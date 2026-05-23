// Battle scene engine. Owns the Three.js scene + renderer + game loop
// and exposes a small imperative API the playback hook calls into:
//
//   • spawnUnit(unit, position)
//   • applyEvents(batch)          — drives all unit animations
//   • screenPositionsForOverlay() — projects unit positions for the 2D HUD
//   • camera gestures (drag/zoom/reset/shake)
//   • dispose()
//
// The render loop is rAF-based and driven by GLView's gl context. We
// step every active Unit / Projectile / particle burst by real wall-
// clock dt so animations feel fluid even when the simulation tick is
// 720ms.
//
// Important: the engine does NOT own the simulation. The playback hook
// is responsible for pushing events; the engine is purely the
// presentation layer.

import * as THREE from 'three';
// expo-three is loaded for its side-effect of attaching a `global.THREE`
// and patching a few RN-specific things. We then construct a normal
// WebGLRenderer below.
import { Renderer as ExpoRenderer } from 'expo-three';
import { LiveUnit } from './types';
import { BattleEvent, GridPosition, MapTheme, Obstacle, Element } from '../types';
import { HexGrid } from '../utils/hex';
import { Battlefield } from './Battlefield';
import { Unit, liveUnitToInit } from './Unit';
import { Projectile } from './Projectile';
import { ParticleSystem } from './Particles';
import { CameraRig } from './CameraRig';
import { themeFor, ThreeTheme } from './themes';
import { boardCenter, hexToWorld, gridExtents } from './math';

export interface ScreenOverlay {
  id: string;
  x: number;        // pixel coord (origin: top-left of canvas)
  y: number;        // pixel coord
  z: number;        // depth (0..1, near = 0)
  visible: boolean;
}

export interface EngineOptions {
  gl: WebGLRenderingContext;
  width: number;
  height: number;
  pixelRatio: number;
  grid: HexGrid;
  theme: MapTheme | undefined;
  obstacles?: Obstacle[];
}

export class Engine {
  readonly scene = new THREE.Scene();
  readonly cameraRig: CameraRig;
  private renderer: THREE.WebGLRenderer;
  private gl: WebGLRenderingContext;
  private battlefield: Battlefield;
  private particles: ParticleSystem;
  private projectiles: Projectile[] = [];
  private units = new Map<string, Unit>();
  private grid: HexGrid;
  private theme: ThreeTheme;
  private boardCenterOff: { x: number; z: number };
  private rafId: number | null = null;
  private lastT = 0;
  private gameTime = 0;
  private destroyed = false;
  private width: number;
  private height: number;

  // Floating damage numbers — purely data carried for the React overlay
  // to render as text. The engine emits them and the React layer pulls
  // them off via consumeOverlayBursts() each frame.
  private floatingBursts: Array<{
    id: string;
    text: string;
    color: string;
    fontSize: number;
    fromUnit: string;
    born: number;     // gameTime when spawned
    crit?: boolean;
  }> = [];
  private floatBurstId = 0;

  constructor(opts: EngineOptions) {
    this.gl = opts.gl;
    this.width = opts.width;
    this.height = opts.height;
    this.grid = opts.grid;
    this.theme = themeFor(opts.theme);
    this.boardCenterOff = boardCenter(opts.grid);

    // ----- Renderer ----------------------------------------------------
    this.renderer = new ExpoRenderer({
      gl: opts.gl as any,
      pixelRatio: opts.pixelRatio,
      width: opts.width,
      height: opts.height,
      clearColor: this.theme.skyHorizon,
    }) as unknown as THREE.WebGLRenderer;
    this.renderer.setSize(opts.width, opts.height);
    this.renderer.setPixelRatio(opts.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // ----- Sky / fog ---------------------------------------------------
    // A large back-faced sphere with vertex colors blends top→horizon.
    const skyGeo = new THREE.SphereGeometry(60, 32, 16);
    const colors = new Float32Array(skyGeo.attributes.position.count * 3);
    const top = new THREE.Color(this.theme.skyTop);
    const horizon = new THREE.Color(this.theme.skyHorizon);
    const pos = skyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 60; // normalized
      const t = Math.pow(Math.max(0, 1 - (y * 0.5 + 0.5)), 1.4);
      const c = top.clone().lerp(horizon, t);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));
    this.scene.fog = new THREE.FogExp2(this.theme.fog, this.theme.fogDensity);

    // ----- Lights ------------------------------------------------------
    const amb = new THREE.AmbientLight(this.theme.ambient, this.theme.ambientIntensity);
    this.scene.add(amb);
    const sun = new THREE.DirectionalLight(this.theme.sun, this.theme.sunIntensity);
    const [sx, sy, sz] = this.theme.sunDir;
    sun.position.set(sx * 10, sy * 10, sz * 10);
    this.scene.add(sun);
    // Team rim lights so units pop against backgrounds.
    const rimPlayer = new THREE.DirectionalLight(this.theme.rimCool, 0.45);
    rimPlayer.position.set(-8, 2, -2);
    this.scene.add(rimPlayer);
    const rimEnemy = new THREE.DirectionalLight(this.theme.rimWarm, 0.45);
    rimEnemy.position.set(8, 2, -2);
    this.scene.add(rimEnemy);
    // Subtle hemisphere fill from the sky → ground.
    const hemi = new THREE.HemisphereLight(this.theme.skyHorizon, this.theme.groundEdge, 0.35);
    this.scene.add(hemi);

    // ----- Battlefield -------------------------------------------------
    // The Battlefield's worldOf() already returns centered (x, z) so
    // its root sits at origin. We attach it under a `battleRoot` group
    // alongside units / projectiles so anything dynamic shares the
    // same coordinate space.
    this.battlefield = new Battlefield({
      grid: this.grid,
      theme: this.theme,
      obstacles: opts.obstacles,
    });
    const battleRoot = new THREE.Group();
    battleRoot.add(this.battlefield.root);
    this.scene.add(battleRoot);
    this.battleRoot = battleRoot;

    // ----- Particle system --------------------------------------------
    this.particles = new ParticleSystem(this.scene);

    // ----- Camera ------------------------------------------------------
    this.cameraRig = new CameraRig(opts.width / opts.height, this.grid);
  }

  private battleRoot!: THREE.Group;

  // -------------------------------------------------------------------
  // World position from a grid cell, relative to the centered board.
  // -------------------------------------------------------------------
  worldOfCell(p: GridPosition): { x: number; z: number } {
    return this.battlefield.worldOf(p.col, p.row);
  }

  // -------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------
  start() {
    if (this.rafId != null) return;
    this.lastT = performance.now();
    const loop = () => {
      if (this.destroyed) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - this.lastT) / 1000);
      this.lastT = now;
      this.gameTime += dt;
      this.step(dt);
      this.renderer.render(this.scene, this.cameraRig.camera);
      // Critical: hand the buffer back to expo-gl.
      (this.gl as any).endFrameEXP();
      this.rafId = requestAnimationFrame(loop) as unknown as number;
    };
    this.rafId = requestAnimationFrame(loop) as unknown as number;
  }

  dispose() {
    this.destroyed = true;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    for (const u of this.units.values()) u.dispose();
    for (const p of this.projectiles) p.dispose();
    this.particles.dispose();
    this.battlefield.dispose();
    this.renderer.dispose();
  }

  resize(width: number, height: number, pixelRatio: number) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
    this.cameraRig.resize(width / height);
  }

  private step(dt: number) {
    // Units
    for (const u of this.units.values()) u.update(dt);
    // Projectiles
    const camPos = this.cameraRig.camera.position;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const alive = p.update(dt, camPos);
      if (!alive) {
        // On arrival, kick off a small impact burst.
        const ip = p.impactPos();
        this.particles.hit(ip, p.element, 0.7);
        this.battleRoot.remove(p.group);
        p.dispose();
        this.projectiles.splice(i, 1);
      }
    }
    // Particles
    this.particles.update(dt);
    // Battlefield seam pulse
    this.battlefield.update(this.gameTime);
    // Camera damping
    this.cameraRig.update(dt);
  }

  // -------------------------------------------------------------------
  // Unit lifecycle — called by the playback hook on first commit + on
  // any 'spawn' battle event.
  // -------------------------------------------------------------------
  spawnUnit(live: LiveUnit) {
    if (this.units.has(live.id)) return;
    const w = this.worldOfCell(live.position);
    const unit = new Unit(liveUnitToInit(live, w));
    this.units.set(live.id, unit);
    this.battleRoot.add(unit.group);
    unit.spawn();
  }

  // Reset & seed: clear all current units and create new ones from the
  // provided live snapshot. Called when the battle starts.
  resetUnits(liveUnits: LiveUnit[]) {
    for (const u of this.units.values()) {
      this.battleRoot.remove(u.group);
      u.dispose();
    }
    this.units.clear();
    for (const lu of liveUnits) this.spawnUnit(lu);
  }

  // -------------------------------------------------------------------
  // Event playback. The hook hands us a batch and we translate each
  // BattleEvent into entity actions. This is where the "presentation
  // engine" lives — everything visual is dispatched from here.
  // -------------------------------------------------------------------
  applyEvents(batch: BattleEvent[]) {
    for (const ev of batch) this.dispatch(ev);
  }

  private dispatch(ev: BattleEvent) {
    switch (ev.kind) {
      case 'spawn': {
        if (ev.unit) this.spawnUnit({ ...(ev.unit as LiveUnit), position: { ...(ev.unit.position) } });
        break;
      }
      case 'move': {
        if (!ev.sourceId || !ev.toPosition) break;
        const u = this.units.get(ev.sourceId);
        if (!u) break;
        const w = this.worldOfCell(ev.toPosition);
        u.moveTo(w.x, w.z, 0.32);
        break;
      }
      case 'attack':
      case 'projectile': {
        if (!ev.sourceId) break;
        const src = this.units.get(ev.sourceId);
        if (!src) break;
        const tgt = ev.targetId ? this.units.get(ev.targetId) : null;
        const tx = tgt ? tgt.worldPos().x : src.worldPos().x + src.facing;
        src.attack(tx, ev.kind === 'projectile');
        if (ev.kind === 'projectile' && tgt) {
          // Slight delay so the wind-up reads before the projectile
          // launches. We capture the live unit refs (not positions)
          // so the projectile's source/dest reflect where the units
          // actually are at launch time (which can differ from event-
          // dispatch time once the attack lunge has played out).
          const element = ev.element ?? 'physical';
          const srcId = src.id;
          const tgtId = tgt.id;
          setTimeout(() => {
            if (this.destroyed) return;
            const s = this.units.get(srcId);
            const t = this.units.get(tgtId);
            if (!s || !t) return;
            const sp = s.worldPos();
            const tp = t.worldPos();
            const p = new Projectile({
              from: { x: sp.x, z: sp.z },
              to: { x: tp.x, z: tp.z },
              element,
              duration: 0.34,
            });
            this.battleRoot.add(p.group);
            this.projectiles.push(p);
          }, 180);
        }
        break;
      }
      case 'damage': {
        if (!ev.targetId) break;
        const u = this.units.get(ev.targetId);
        if (!u) break;
        u.takeHit(ev.value ?? 0);
        const pos = u.worldPos();
        this.particles.hit(pos, ev.element ?? 'physical', 0.8);
        // Float a damage number.
        this.pushFloat(u.id, `${ev.value ?? 0}`, '#ffd24a');
        break;
      }
      case 'crit': {
        if (!ev.targetId) break;
        const u = this.units.get(ev.targetId);
        if (!u) break;
        const pos = u.worldPos();
        this.particles.shockwave(pos, ev.element ?? 'physical', 1.4);
        this.cameraRig.shake(0.16);
        this.pushFloat(u.id, `${ev.value}!`, '#ff5d3c', 22, true);
        break;
      }
      case 'dodge': {
        if (!ev.targetId) break;
        this.pushFloat(ev.targetId, 'MISS', '#9fd3ff', 13);
        break;
      }
      case 'heal': {
        if (!ev.targetId) break;
        const u = this.units.get(ev.targetId);
        if (!u) break;
        u.heal(ev.value ?? 0);
        const pos = u.worldPos();
        this.particles.cast(pos, 'holy');
        this.pushFloat(u.id, `+${ev.value ?? 0}`, '#5ef07a');
        break;
      }
      case 'shield': {
        if (!ev.targetId) break;
        this.pushFloat(ev.targetId, `+${ev.value} 🛡`, '#ffd24a', 12);
        break;
      }
      case 'ability': {
        if (!ev.sourceId) break;
        const u = this.units.get(ev.sourceId);
        if (!u) break;
        u.castGlow();
        const pos = u.worldPos();
        const el: Element = (ev.element as Element) ?? 'physical';
        this.particles.cast(pos, el);
        this.particles.shockwave(pos, el, 1.1);
        this.pushFloat(u.id, ev.text ?? 'Ability', '#c9a3ff', 13);
        break;
      }
      case 'death': {
        if (!ev.targetId) break;
        const u = this.units.get(ev.targetId);
        if (!u) break;
        u.die();
        this.particles.death(u.worldPos());
        this.cameraRig.shake(0.1);
        break;
      }
      case 'status_apply':
      case 'status_expire':
      case 'status_tick':
      case 'mana':
      case 'wave':
      case 'victory':
      case 'defeat':
        // Status & meta events do not produce direct visuals in this
        // build — the React HUD already shows them via the log + alive
        // counters. We could attach floor decals per status here later.
        break;
    }
  }

  private pushFloat(unitId: string, text: string, color: string, fontSize?: number, crit?: boolean) {
    this.floatBurstId++;
    this.floatingBursts.push({
      id: `f_${this.floatBurstId}`,
      text,
      color,
      fontSize: fontSize ?? 16,
      fromUnit: unitId,
      born: this.gameTime,
      crit,
    });
  }

  // Drain & return floating bursts so the React overlay can pop them.
  // Returns each entry with its current screen position projected from
  // the unit's current world pos plus a time-based upward drift.
  consumeFloatingForOverlay(maxAge = 1.0): Array<{
    id: string;
    text: string;
    color: string;
    fontSize: number;
    crit?: boolean;
    x: number;
    y: number;
    alpha: number;
  }> {
    const out: Array<{
      id: string; text: string; color: string; fontSize: number; crit?: boolean;
      x: number; y: number; alpha: number;
    }> = [];
    const cam = this.cameraRig.camera;
    const half = { w: this.width / 2, h: this.height / 2 };
    for (let i = this.floatingBursts.length - 1; i >= 0; i--) {
      const f = this.floatingBursts[i];
      const age = this.gameTime - f.born;
      if (age > maxAge) {
        this.floatingBursts.splice(i, 1);
        continue;
      }
      const u = this.units.get(f.fromUnit);
      if (!u) continue;
      const wp = u.worldPos();
      const v = new THREE.Vector3(wp.x, 1.4 + age * 0.6, wp.z);
      v.project(cam);
      const x = v.x * half.w + half.w;
      const y = -v.y * half.h + half.h;
      const alpha = age < 0.1 ? age / 0.1 : 1 - (age - 0.1) / (maxAge - 0.1);
      out.push({
        id: f.id,
        text: f.text,
        color: f.color,
        fontSize: f.fontSize,
        crit: f.crit,
        x,
        y,
        alpha: Math.max(0, Math.min(1, alpha)),
      });
    }
    return out;
  }

  // Project every unit's head into screen space so the React HUD can
  // overlay HP/MP bars + status badges.
  unitScreenPositions(): Array<{
    id: string; x: number; y: number;
    isPlayer: boolean; alive: boolean;
    hp: number; maxHp: number; mana: number; maxMana: number;
  }> {
    const out: Array<{
      id: string; x: number; y: number;
      isPlayer: boolean; alive: boolean;
      hp: number; maxHp: number; mana: number; maxMana: number;
    }> = [];
    const cam = this.cameraRig.camera;
    const half = { w: this.width / 2, h: this.height / 2 };
    for (const u of this.units.values()) {
      const wp = u.worldPos();
      const v = new THREE.Vector3(wp.x, 1.1, wp.z);
      v.project(cam);
      if (v.z > 1 || v.z < -1) continue;
      out.push({
        id: u.id,
        x: v.x * half.w + half.w,
        y: -v.y * half.h + half.h,
        isPlayer: u.isPlayer,
        alive: u.alive,
        hp: u.hp,
        maxHp: u.maxHp,
        mana: u.mana,
        maxMana: u.maxMana,
      });
    }
    return out;
  }
}

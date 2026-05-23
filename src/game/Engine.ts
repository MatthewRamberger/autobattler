// Pure-JS battle engine.
//
// Owns the live entity registry (units, projectiles, particles) and a
// frame loop that advances per-entity Animated.Values. There are NO
// native modules beyond what React Native ships with — every visual
// effect is driven by Animated transforms with `useNativeDriver: true`
// so motion stays on the native side at 60 fps.
//
// The Engine is mounted once per battle (via the canvas useRef). The
// playback hook calls into it imperatively to apply BattleEvent
// batches. React reads three things from the engine to render:
//
//   • snapshot()       — current list of units / projectiles / particles
//   • subscribe(fn)    — notify on entity-list changes (add/remove)
//   • Animated.Values inside each entity are read by renderer components
//
// Entity Animated values are not React state — mutating them does NOT
// trigger re-renders. React only re-renders on entity LIST changes.

import { Animated, Easing } from 'react-native';
import { HeroClass, Element, GridPosition } from '../types';
import { HexLayout } from '../utils/hex';
import { projectCell, projectFlat, ScreenPt } from './math';

// ---------------------------------------------------------------------
// Entity shapes
// ---------------------------------------------------------------------

export interface UnitAnims {
  tx: Animated.Value;          // screen X (native)
  ty: Animated.Value;          // screen Y (native)
  flash: Animated.Value;       // 0..1 hit flash (drives white overlay opacity)
  weaponSwing: Animated.Value; // 0..1 attack progress (drives weapon rotate)
  lunge: Animated.Value;       // 0..1 lunge forward
  cast: Animated.Value;        // 0..1 caster glow pulse
  bob: Animated.Value;         // 0..1 idle bob (looping)
  scale: Animated.Value;       // 0..1 spawn/death scale
  opacity: Animated.Value;     // 0..1 death fade
  shake: Animated.Value;       // px shake
}

export interface UnitEntity {
  id: string;
  heroClass: HeroClass;
  isPlayer: boolean;
  alive: boolean;
  facing: 1 | -1;
  // Live grid pos. Whenever this changes the engine kicks off an
  // Animated tween on (tx, ty) to interpolate the visual position.
  gridPos: GridPosition;
  // Cached screen pos (depth) for back-to-front sort.
  depth: number;
  anims: UnitAnims;
  spawnT: number;
}

export interface ProjectileEntity {
  id: string;
  element: Element;
  from: { x: number; y: number };
  to: { x: number; y: number };
  arcHeight: number;
  t: Animated.Value;     // 0 → 1 over the flight
  done: boolean;
}

export interface ParticleEntity {
  id: string;
  kind: 'spark' | 'wisp' | 'shock' | 'mote';
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
}

export interface EngineSnapshot {
  units: UnitEntity[];
  projectiles: ProjectileEntity[];
  particles: ParticleEntity[];
}

type Listener = () => void;

// ---------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------

export class Engine {
  private units = new Map<string, UnitEntity>();
  private projectiles: ProjectileEntity[] = [];
  private particles: ParticleEntity[] = [];
  private listeners: Set<Listener> = new Set();
  private nextId = 1;
  private layout: HexLayout;
  // World shake (Animated.Value driven by big hits).
  readonly shakeX = new Animated.Value(0);
  readonly shakeY = new Animated.Value(0);

  constructor(layout: HexLayout) {
    this.layout = layout;
  }

  setLayout(layout: HexLayout) {
    this.layout = layout;
    // Snap every unit's tx/ty to the new layout so resize/rotation
    // doesn't leave them dangling at stale coords.
    for (const u of this.units.values()) {
      const p = projectCell(u.gridPos, layout);
      u.depth = p.depth;
      u.anims.tx.setValue(p.x);
      u.anims.ty.setValue(p.y);
    }
    this.notify();
  }

  snapshot(): EngineSnapshot {
    // Return units sorted back-to-front so units in the back render
    // beneath units in the front. (z-order in React tree decides paint
    // order — children later in the array paint on top.)
    const units = [...this.units.values()].sort((a, b) => a.depth - b.depth);
    return { units, projectiles: this.projectiles.slice(), particles: this.particles.slice() };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private notify() {
    for (const fn of this.listeners) fn();
  }

  // -------------------------------------------------------------------
  // Unit lifecycle
  // -------------------------------------------------------------------
  spawnUnit(opts: {
    id: string; heroClass: HeroClass; isPlayer: boolean; gridPos: GridPosition;
  }): UnitEntity {
    const existing = this.units.get(opts.id);
    if (existing) return existing;
    const p = projectCell(opts.gridPos, this.layout);
    const anims: UnitAnims = {
      tx: new Animated.Value(p.x),
      ty: new Animated.Value(p.y),
      flash: new Animated.Value(0),
      weaponSwing: new Animated.Value(0),
      lunge: new Animated.Value(0),
      cast: new Animated.Value(0),
      bob: new Animated.Value(0),
      scale: new Animated.Value(0.4),
      opacity: new Animated.Value(1),
      shake: new Animated.Value(0),
    };
    // Idle bob loop (cheap on the native side).
    Animated.loop(
      Animated.sequence([
        Animated.timing(anims.bob, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anims.bob, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    // Spawn pop.
    Animated.spring(anims.scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();

    const u: UnitEntity = {
      id: opts.id,
      heroClass: opts.heroClass,
      isPlayer: opts.isPlayer,
      alive: true,
      facing: opts.isPlayer ? 1 : -1,
      gridPos: { ...opts.gridPos },
      depth: p.depth,
      anims,
      spawnT: Date.now(),
    };
    this.units.set(opts.id, u);
    this.notify();
    return u;
  }

  resetUnits(seeds: Array<{ id: string; heroClass: HeroClass; isPlayer: boolean; position: GridPosition }>) {
    this.units.clear();
    this.projectiles = [];
    this.particles = [];
    for (const s of seeds) {
      this.spawnUnit({ id: s.id, heroClass: s.heroClass, isPlayer: s.isPlayer, gridPos: s.position });
    }
    this.notify();
  }

  moveUnit(id: string, to: GridPosition, durMs = 320) {
    const u = this.units.get(id);
    if (!u || !u.alive) return;
    const next = projectCell(to, this.layout);
    if (Math.abs(next.x - (u.anims.tx as any)._value) > 0.01) {
      u.facing = next.x > (u.anims.tx as any)._value ? 1 : -1;
    }
    u.gridPos = { ...to };
    u.depth = next.depth;
    Animated.parallel([
      Animated.timing(u.anims.tx, { toValue: next.x, duration: durMs, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(u.anims.ty, { toValue: next.y, duration: durMs, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]).start(() => this.notify()); // notify on completion so the back-to-front sort updates
  }

  attack(id: string, targetGridPos: GridPosition | null, isProjectile: boolean) {
    const u = this.units.get(id);
    if (!u || !u.alive) return;
    // Face target.
    if (targetGridPos) {
      const target = projectCell(targetGridPos, this.layout);
      u.facing = target.x > (u.anims.tx as any)._value ? 1 : -1;
    }
    // Weapon swing + forward lunge.
    Animated.sequence([
      Animated.parallel([
        Animated.timing(u.anims.weaponSwing, { toValue: -0.4, duration: 140, useNativeDriver: true }),
        Animated.timing(u.anims.lunge, { toValue: -0.15, duration: 140, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(u.anims.weaponSwing, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(u.anims.lunge, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(u.anims.weaponSwing, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(u.anims.lunge, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
    // Casters also pulse the cast aura.
    if (isProjectile && (u.heroClass === 'Mage' || u.heroClass === 'Necromancer' || u.heroClass === 'Cleric' || u.heroClass === 'Druid')) {
      Animated.sequence([
        Animated.timing(u.anims.cast, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(u.anims.cast, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }

  takeHit(id: string) {
    const u = this.units.get(id);
    if (!u || !u.alive) return;
    u.anims.flash.setValue(1);
    Animated.timing(u.anims.flash, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    // Quick shake.
    Animated.sequence([
      Animated.timing(u.anims.shake, { toValue: 5, duration: 40, useNativeDriver: true }),
      Animated.timing(u.anims.shake, { toValue: -5, duration: 40, useNativeDriver: true }),
      Animated.timing(u.anims.shake, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }

  cast(id: string) {
    const u = this.units.get(id);
    if (!u || !u.alive) return;
    Animated.sequence([
      Animated.timing(u.anims.cast, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(u.anims.cast, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start();
  }

  killUnit(id: string) {
    const u = this.units.get(id);
    if (!u || !u.alive) return;
    u.alive = false;
    Animated.parallel([
      Animated.timing(u.anims.opacity, { toValue: 0.35, duration: 360, useNativeDriver: true }),
      Animated.timing(u.anims.scale, { toValue: 0.72, duration: 360, useNativeDriver: true }),
    ]).start(() => this.notify());
  }

  // Big-hit screen shake (camera-level).
  worldShake(strength = 4) {
    Animated.sequence([
      Animated.timing(this.shakeX, { toValue: strength, duration: 35, useNativeDriver: true }),
      Animated.timing(this.shakeY, { toValue: -strength * 0.6, duration: 35, useNativeDriver: true }),
      Animated.timing(this.shakeX, { toValue: -strength, duration: 35, useNativeDriver: true }),
      Animated.timing(this.shakeY, { toValue: strength * 0.6, duration: 35, useNativeDriver: true }),
      Animated.timing(this.shakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
      Animated.timing(this.shakeY, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }

  // -------------------------------------------------------------------
  // Projectiles
  // -------------------------------------------------------------------
  spawnProjectile(fromId: string, toId: string, element: Element, durMs = 380) {
    const src = this.units.get(fromId);
    const dst = this.units.get(toId);
    if (!src || !dst) return;
    const fromP = { x: (src.anims.tx as any)._value, y: (src.anims.ty as any)._value };
    const toP = { x: (dst.anims.tx as any)._value, y: (dst.anims.ty as any)._value };
    const dist = Math.hypot(toP.x - fromP.x, toP.y - fromP.y);
    const arcHeight = Math.min(60, dist * 0.18);
    const t = new Animated.Value(0);
    const proj: ProjectileEntity = {
      id: `p_${this.nextId++}`,
      element,
      from: fromP,
      to: toP,
      arcHeight,
      t,
      done: false,
    };
    this.projectiles.push(proj);
    this.notify();
    Animated.timing(t, { toValue: 1, duration: durMs, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
      proj.done = true;
      this.removeProjectile(proj.id);
      // On arrival, emit a hit spark burst.
      this.spawnSparkBurst(proj.to.x, proj.to.y, element);
    });
  }

  private removeProjectile(id: string) {
    const i = this.projectiles.findIndex((p) => p.id === id);
    if (i >= 0) {
      this.projectiles.splice(i, 1);
      this.notify();
    }
  }

  // -------------------------------------------------------------------
  // Particles — sparks, shockwave rings, cast motes, death wisps
  // -------------------------------------------------------------------
  spawnSparkBurst(cx: number, cy: number, element: Element, count = 9) {
    const color = elementColorOf(element);
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 22 + Math.random() * 18;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist * 0.6 - 14; // upward bias
      const x = new Animated.Value(cx);
      const y = new Animated.Value(cy);
      const opacity = new Animated.Value(1);
      const scale = new Animated.Value(1);
      const id = `pt_${this.nextId++}`;
      const p: ParticleEntity = {
        id, kind: 'spark', x, y, opacity, scale, color, size: 5 + Math.random() * 3,
      };
      this.particles.push(p);
      Animated.parallel([
        Animated.timing(x, { toValue: cx + dx, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: cy + dy + 24, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.4, duration: 450, useNativeDriver: true }),
      ]).start(() => this.removeParticle(id));
    }
    this.notify();
  }

  spawnShockwave(cx: number, cy: number, element: Element) {
    const id = `pt_${this.nextId++}`;
    const x = new Animated.Value(cx);
    const y = new Animated.Value(cy);
    const opacity = new Animated.Value(0.9);
    const scale = new Animated.Value(0.2);
    this.particles.push({ id, kind: 'shock', x, y, opacity, scale, color: elementColorOf(element), size: 30 });
    Animated.parallel([
      Animated.timing(scale, { toValue: 2.4, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => this.removeParticle(id));
    this.notify();
  }

  spawnCastMotes(cx: number, cy: number, element: Element) {
    const color = elementColorOf(element);
    for (let i = 0; i < 8; i++) {
      const dx = (Math.random() - 0.5) * 22;
      const dy = -10 - Math.random() * 18;
      const x = new Animated.Value(cx + dx);
      const y = new Animated.Value(cy);
      const opacity = new Animated.Value(0.9);
      const scale = new Animated.Value(0.8);
      const id = `pt_${this.nextId++}`;
      this.particles.push({ id, kind: 'mote', x, y, opacity, scale, color, size: 4 + Math.random() * 2 });
      Animated.parallel([
        Animated.timing(y, { toValue: cy + dy, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]).start(() => this.removeParticle(id));
    }
    this.notify();
  }

  spawnDeathWisps(cx: number, cy: number) {
    for (let i = 0; i < 10; i++) {
      const dx = (Math.random() - 0.5) * 14;
      const x = new Animated.Value(cx + dx);
      const y = new Animated.Value(cy);
      const opacity = new Animated.Value(0.85);
      const scale = new Animated.Value(1);
      const id = `pt_${this.nextId++}`;
      this.particles.push({ id, kind: 'wisp', x, y, opacity, scale, color: '#aa99cc', size: 6 + Math.random() * 3 });
      Animated.parallel([
        Animated.timing(y, { toValue: cy - 50 - Math.random() * 20, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]).start(() => this.removeParticle(id));
    }
    this.notify();
  }

  private removeParticle(id: string) {
    const i = this.particles.findIndex((p) => p.id === id);
    if (i >= 0) {
      this.particles.splice(i, 1);
      this.notify();
    }
  }

  // Floating damage number positions — exposed so the React HUD can
  // render text over the unit's CURRENT animated position. Caller polls.
  unitScreenPos(id: string): ScreenPt | null {
    const u = this.units.get(id);
    if (!u) return null;
    const px = (u.anims.tx as any)._value as number;
    const py = (u.anims.ty as any)._value as number;
    return { x: px, y: py, depth: u.depth };
  }

  dispose() {
    // Cancel idle bob loops by stopping the values.
    for (const u of this.units.values()) {
      u.anims.bob.stopAnimation();
      u.anims.tx.stopAnimation();
      u.anims.ty.stopAnimation();
    }
    this.units.clear();
    this.projectiles = [];
    this.particles = [];
    this.listeners.clear();
  }
}

function elementColorOf(e: Element): string {
  // Imported from themes module via local require to dodge a circular
  // dep when themes.ts grows. For now we duplicate the small palette.
  switch (e) {
    case 'fire': return '#ff7a18';
    case 'ice': return '#b8e6ff';
    case 'lightning': return '#fff2a8';
    case 'holy': return '#fff5b4';
    case 'shadow': return '#b89bff';
    case 'nature': return '#bef07a';
    default: return '#fff7c2';
  }
}

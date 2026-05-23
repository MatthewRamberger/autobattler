// Procedurally-built character mesh + animation rig.
//
// Each unit is a Three.js Group with named sub-parts (`root`, `body`,
// `head`, `weapon`, `aura`, `shadow`). All sub-meshes use simple primitive
// geometry — there are no external models — so the rig stays light and
// the same code drives every class.
//
// The animator drives the rig via a small set of timed "actions" that the
// Engine pushes per battle event:
//
//   • idleBob       — constant looping
//   • moveTo(x,z)   — interpolate position over a duration
//   • attack()      — class-specific lunge + weapon swing/cast
//   • castGlow()    — caster pose with aura ring
//   • takeHit()     — flash red + shake
//   • die()         — tilt over, sink, fade
//   • respawn(pos)  — snap in with a brief pop
//
// Update is driven by `update(dt)` which advances every active action.
// Actions stack: a moveTo + an attack can run concurrently.

import * as THREE from 'three';
import { HeroClass } from '../types';
import { LiveUnit } from './types';
import { classPalette } from './themes';
import { clamp, easeOut, easeInOut, lerp } from './math';

type ActionKind = 'move' | 'attack' | 'hit' | 'die' | 'spawn' | 'castGlow';

interface Action {
  kind: ActionKind;
  elapsed: number;
  duration: number;
  onUpdate: (t: number, dt: number) => void;
  onEnd?: () => void;
}

export interface UnitInit {
  id: string;
  heroClass: HeroClass;
  isPlayer: boolean;
  position: { x: number; z: number };
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
}

const BODY_HEIGHT = 0.8;
const HEAD_RADIUS = 0.18;

export class Unit {
  readonly id: string;
  readonly group = new THREE.Group();
  readonly heroClass: HeroClass;
  readonly isPlayer: boolean;
  readonly weapon: THREE.Group;
  readonly body: THREE.Group;
  readonly head: THREE.Mesh;
  readonly aura: THREE.Mesh;
  readonly shadow: THREE.Mesh;

  private bodyMat: THREE.MeshStandardMaterial;
  private trimMat: THREE.MeshStandardMaterial;
  private weaponMat: THREE.MeshStandardMaterial;
  private auraMat: THREE.MeshBasicMaterial;
  private originalBody: number;
  private originalTrim: number;

  private actions: Action[] = [];
  private idleTime = 0;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  alive = true;
  // World-space facing direction for attack lunges. Player faces +x,
  // enemy faces -x; updated when attacking based on target side.
  facing: 1 | -1;

  // Position written by actions; we sync to group on update.
  private px: number;
  private pz: number;

  // Visual offsets driven by actions — applied additively on top of
  // (px, pz) each frame.
  private lungeAmount = 0;
  private bobAmount = 0;
  private tilt = 0;
  private sinkY = 0;
  private flashLevel = 0;
  private shake = 0;

  constructor(init: UnitInit) {
    this.id = init.id;
    this.heroClass = init.heroClass;
    this.isPlayer = init.isPlayer;
    this.facing = init.isPlayer ? 1 : -1;
    this.hp = init.hp;
    this.maxHp = init.maxHp;
    this.mana = init.mana;
    this.maxMana = init.maxMana;
    this.px = init.position.x;
    this.pz = init.position.z;

    const pal = classPalette(init.heroClass);
    this.originalBody = pal.body;
    this.originalTrim = pal.trim;
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: pal.body, roughness: 0.55, metalness: 0.15,
    });
    this.trimMat = new THREE.MeshStandardMaterial({
      color: pal.trim, roughness: 0.5, metalness: 0.3,
      emissive: pal.trim, emissiveIntensity: 0.05,
    });
    this.weaponMat = new THREE.MeshStandardMaterial({
      color: pal.weapon, roughness: 0.35, metalness: 0.7,
    });
    // Aura ring under the unit — colored by team, brightens when ability is ready.
    this.auraMat = new THREE.MeshBasicMaterial({
      color: init.isPlayer ? 0x4d8bff : 0xff5a3a,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });

    // Shadow disc (cheap fake — full shadow mapping is too expensive
    // on mobile for ~24 units).
    const shadowGeo = new THREE.CircleGeometry(0.34, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false,
    });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.position.y = 0.085;
    this.group.add(this.shadow);

    // Aura ring (a thin annulus). Sized larger than shadow so it shows.
    const auraGeo = new THREE.RingGeometry(0.32, 0.42, 24);
    auraGeo.rotateX(-Math.PI / 2);
    this.aura = new THREE.Mesh(auraGeo, this.auraMat);
    this.aura.position.y = 0.09;
    this.group.add(this.aura);

    // Body + head — class-specific silhouette.
    this.body = this.buildBody(init.heroClass);
    this.body.position.y = 0.1;
    this.group.add(this.body);

    const headGeo = new THREE.SphereGeometry(HEAD_RADIUS, 16, 12);
    this.head = new THREE.Mesh(headGeo, this.trimMat);
    this.head.position.y = 0.1 + BODY_HEIGHT + HEAD_RADIUS * 0.55;
    this.group.add(this.head);

    // Weapon group (positioned in body's local right-hand space).
    this.weapon = this.buildWeapon(init.heroClass);
    this.weapon.position.set(0.22, 0.1 + BODY_HEIGHT * 0.7, 0.0);
    this.group.add(this.weapon);

    // Eye glow — two tiny emissive dots so the face reads from far.
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff2c8 });
    const eyeGeo = new THREE.SphereGeometry(0.022, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.06, this.head.position.y, 0.16);
    eyeR.position.set(-0.06, this.head.position.y, 0.16);
    this.group.add(eyeL);
    this.group.add(eyeR);

    // Face the right way out of the gate.
    this.group.rotation.y = init.isPlayer ? Math.PI / 2 : -Math.PI / 2;
    this.applyTransform();
  }

  // -----------------------------------------------------------------
  // Class-specific silhouette builders. Every body returns a Group
  // anchored at y=0, height BODY_HEIGHT. We mix capsules / boxes /
  // cones / cylinders so each class reads distinctly from a distance.
  // -----------------------------------------------------------------
  private buildBody(cls: HeroClass): THREE.Group {
    const g = new THREE.Group();
    const torsoH = BODY_HEIGHT * 0.7;
    const torsoR = 0.18;

    switch (cls) {
      case 'Warrior':
      case 'Paladin': {
        // Bulky armored torso + pauldrons + helmet ring.
        const torso = new THREE.Mesh(
          new THREE.CapsuleGeometry(torsoR + 0.04, torsoH * 0.7, 4, 8),
          this.bodyMat,
        );
        torso.position.y = torsoH * 0.5;
        g.add(torso);
        const pauldronGeo = new THREE.SphereGeometry(0.12, 10, 8);
        const pL = new THREE.Mesh(pauldronGeo, this.trimMat);
        const pR = new THREE.Mesh(pauldronGeo, this.trimMat);
        pL.position.set(0.22, torsoH * 0.85, 0);
        pR.position.set(-0.22, torsoH * 0.85, 0);
        g.add(pL); g.add(pR);
        // Helmet crown
        const crown = new THREE.Mesh(
          new THREE.TorusGeometry(HEAD_RADIUS * 0.95, 0.028, 6, 16),
          this.trimMat,
        );
        crown.rotation.x = Math.PI / 2;
        crown.position.y = torsoH + HEAD_RADIUS * 0.95;
        g.add(crown);
        break;
      }
      case 'Berserker': {
        const torso = new THREE.Mesh(
          new THREE.CapsuleGeometry(torsoR + 0.05, torsoH * 0.65, 4, 8),
          this.bodyMat,
        );
        torso.position.y = torsoH * 0.5;
        g.add(torso);
        // Spiked shoulders
        const spike = new THREE.ConeGeometry(0.09, 0.18, 6);
        for (let i = 0; i < 2; i++) {
          const m = new THREE.Mesh(spike, this.trimMat);
          m.position.set((i === 0 ? 0.22 : -0.22), torsoH * 0.85, 0);
          m.rotation.z = i === 0 ? -0.4 : 0.4;
          g.add(m);
        }
        break;
      }
      case 'Archer':
      case 'Rogue': {
        const torso = new THREE.Mesh(
          new THREE.CapsuleGeometry(torsoR - 0.02, torsoH * 0.75, 4, 8),
          this.bodyMat,
        );
        torso.position.y = torsoH * 0.5;
        g.add(torso);
        // Hood ring
        const hood = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.18, 8, 1, true),
          this.bodyMat,
        );
        hood.position.y = torsoH + 0.05;
        g.add(hood);
        break;
      }
      case 'Monk': {
        const torso = new THREE.Mesh(
          new THREE.CapsuleGeometry(torsoR, torsoH * 0.7, 4, 8),
          this.bodyMat,
        );
        torso.position.y = torsoH * 0.5;
        g.add(torso);
        // Sash trim
        const sash = new THREE.Mesh(
          new THREE.TorusGeometry(torsoR + 0.04, 0.025, 6, 18),
          this.trimMat,
        );
        sash.rotation.x = Math.PI / 2;
        sash.position.y = torsoH * 0.4;
        g.add(sash);
        break;
      }
      case 'Mage':
      case 'Necromancer': {
        // Robed silhouette — cone skirt + slimmer torso + tall pointy hat.
        const robe = new THREE.Mesh(
          new THREE.ConeGeometry(0.30, torsoH * 0.8, 10, 1, true),
          this.bodyMat,
        );
        robe.position.y = torsoH * 0.35;
        g.add(robe);
        const upper = new THREE.Mesh(
          new THREE.CapsuleGeometry(torsoR - 0.04, torsoH * 0.3, 4, 8),
          this.bodyMat,
        );
        upper.position.y = torsoH * 0.7;
        g.add(upper);
        // Pointy hat (replaces head finishing later)
        const hat = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 0.34, 10),
          this.trimMat,
        );
        hat.position.y = torsoH + HEAD_RADIUS * 1.4 + 0.17;
        g.add(hat);
        break;
      }
      case 'Cleric':
      case 'Druid': {
        // Robed + halo over head.
        const robe = new THREE.Mesh(
          new THREE.ConeGeometry(0.28, torsoH * 0.75, 10, 1, true),
          this.bodyMat,
        );
        robe.position.y = torsoH * 0.38;
        g.add(robe);
        const upper = new THREE.Mesh(
          new THREE.CapsuleGeometry(torsoR - 0.03, torsoH * 0.32, 4, 8),
          this.bodyMat,
        );
        upper.position.y = torsoH * 0.68;
        g.add(upper);
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(HEAD_RADIUS * 1.4, 0.025, 6, 20),
          new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: 0.85 }),
        );
        halo.position.y = torsoH + HEAD_RADIUS * 2 + 0.05;
        halo.rotation.x = 0.6;
        g.add(halo);
        break;
      }
    }
    return g;
  }

  private buildWeapon(cls: HeroClass): THREE.Group {
    const g = new THREE.Group();
    switch (cls) {
      case 'Warrior':
      case 'Paladin': {
        // Sword: long box blade + cross guard + grip.
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.55, 0.01),
          this.weaponMat,
        );
        blade.position.y = 0.28;
        g.add(blade);
        const guard = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.04, 0.04),
          this.trimMat,
        );
        guard.position.y = 0.0;
        g.add(guard);
        const grip = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8),
          this.bodyMat,
        );
        grip.position.y = -0.07;
        g.add(grip);
        break;
      }
      case 'Berserker': {
        // Axe: blade quad + haft.
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.18, 0.02),
          this.weaponMat,
        );
        blade.position.set(0.06, 0.32, 0);
        g.add(blade);
        const haft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8),
          this.bodyMat,
        );
        haft.position.y = 0.15;
        g.add(haft);
        break;
      }
      case 'Archer': {
        // Bow: torus segment + string.
        const bow = new THREE.Mesh(
          new THREE.TorusGeometry(0.22, 0.018, 6, 12, Math.PI),
          this.weaponMat,
        );
        bow.rotation.z = Math.PI / 2;
        bow.position.y = 0.0;
        g.add(bow);
        const string = new THREE.Mesh(
          new THREE.BoxGeometry(0.005, 0.44, 0.005),
          new THREE.MeshBasicMaterial({ color: 0xeae0c8 }),
        );
        string.position.y = 0.0;
        g.add(string);
        break;
      }
      case 'Rogue':
      case 'Monk': {
        // Dual short daggers.
        for (let i = 0; i < 2; i++) {
          const d = new THREE.Mesh(
            new THREE.ConeGeometry(0.025, 0.22, 4),
            this.weaponMat,
          );
          d.position.set(i === 0 ? 0 : -0.06, 0.12, 0);
          d.rotation.x = 0.1;
          g.add(d);
        }
        break;
      }
      case 'Mage':
      case 'Necromancer':
      case 'Cleric':
      case 'Druid': {
        // Staff: long pole + orb.
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.7, 8),
          this.weaponMat,
        );
        pole.position.y = 0.25;
        g.add(pole);
        const pal = classPalette(this.heroClass);
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 12, 10),
          new THREE.MeshStandardMaterial({
            color: pal.aura,
            emissive: pal.aura,
            emissiveIntensity: 1.0,
            roughness: 0.2,
          }),
        );
        orb.position.y = 0.62;
        g.add(orb);
        break;
      }
    }
    g.userData.restRotZ = 0;
    return g;
  }

  // -----------------------------------------------------------------
  // Animation actions. Each pushes onto the action queue. Callers can
  // freely stack them; `attack` only affects the weapon swing and body
  // lunge, while `move` modifies (px, pz). Hit flashes are blended
  // into bodyMat each frame.
  // -----------------------------------------------------------------
  moveTo(x: number, z: number, duration = 0.32) {
    const fromX = this.px, fromZ = this.pz;
    const toX = x, toZ = z;
    // Face the move direction along world X.
    if (Math.abs(toX - fromX) > 0.001) this.facing = toX > fromX ? 1 : -1;
    this.actions.push({
      kind: 'move',
      elapsed: 0,
      duration,
      onUpdate: (t) => {
        const e = easeInOut(t);
        this.px = lerp(fromX, toX, e);
        this.pz = lerp(fromZ, toZ, e);
      },
      onEnd: () => { this.px = toX; this.pz = toZ; },
    });
  }

  // Run a class-specific attack: lunge forward + animate weapon. The
  // `targetX` lets the attacker face the right way even when target
  // is on the same column (e.g. ally heal cast).
  attack(targetX: number, isProjectile: boolean) {
    if (Math.abs(targetX - this.px) > 0.01) this.facing = targetX > this.px ? 1 : -1;
    const cls = this.heroClass;
    const style = attackStyle(cls, isProjectile);
    this.actions.push({
      kind: 'attack',
      elapsed: 0,
      duration: 0.55,
      onUpdate: (t) => this.driveAttack(t, style),
      onEnd: () => {
        this.lungeAmount = 0;
        if (this.weapon) this.weapon.rotation.set(0, 0, this.weapon.userData.restRotZ);
      },
    });
  }

  castGlow() {
    const mat = this.weapon.children.find((c) => (c as THREE.Mesh).material instanceof THREE.MeshStandardMaterial && ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity > 0.5);
    const startIntensity = mat ? ((mat as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity : 0;
    this.actions.push({
      kind: 'castGlow',
      elapsed: 0,
      duration: 0.7,
      onUpdate: (t) => {
        if (mat) {
          const m = (mat as THREE.Mesh).material as THREE.MeshStandardMaterial;
          m.emissiveIntensity = startIntensity + 2.5 * (1 - Math.abs(t - 0.5) * 2);
        }
      },
      onEnd: () => {
        if (mat) {
          const m = (mat as THREE.Mesh).material as THREE.MeshStandardMaterial;
          m.emissiveIntensity = startIntensity;
        }
      },
    });
  }

  takeHit(damage: number) {
    this.hp = Math.max(0, this.hp - damage);
    this.actions.push({
      kind: 'hit',
      elapsed: 0,
      duration: 0.34,
      onUpdate: (t) => {
        this.flashLevel = 1 - t;
        this.shake = Math.sin(t * Math.PI * 7) * 0.08 * (1 - t);
      },
      onEnd: () => { this.flashLevel = 0; this.shake = 0; },
    });
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    // Same channel as castGlow but greener — recolor aura briefly.
    const original = this.auraMat.color.getHex();
    this.auraMat.color.setHex(0x5ef07a);
    this.auraMat.opacity = 0.85;
    this.actions.push({
      kind: 'castGlow',
      elapsed: 0,
      duration: 0.6,
      onUpdate: (t) => {
        this.auraMat.opacity = 0.85 - 0.55 * t;
      },
      onEnd: () => {
        this.auraMat.color.setHex(original);
        this.auraMat.opacity = 0.35;
      },
    });
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    const startTilt = this.tilt;
    const startSink = this.sinkY;
    this.actions.push({
      kind: 'die',
      elapsed: 0,
      duration: 0.8,
      onUpdate: (t) => {
        this.tilt = lerp(startTilt, -Math.PI / 2.2, easeOut(t));
        this.sinkY = lerp(startSink, -0.3, easeOut(t));
        // Fade body color toward grey.
        this.bodyMat.color.lerp(new THREE.Color(0x1a1a1a), 0.06 * t + 0.01);
      },
    });
    // Dim the aura immediately.
    this.auraMat.opacity = 0;
    this.shadow.visible = false;
  }

  spawn() {
    this.actions.push({
      kind: 'spawn',
      elapsed: 0,
      duration: 0.4,
      onUpdate: (t) => {
        const s = easeOut(t);
        this.group.scale.setScalar(0.4 + 0.6 * s);
      },
      onEnd: () => this.group.scale.setScalar(1),
    });
  }

  // -----------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------
  private driveAttack(t: number, style: AttackStyle) {
    // 0 → 0.4 windup, 0.4 → 0.55 strike, 0.55 → 1 recovery.
    const windup = clamp(t / 0.4, 0, 1);
    const strike = t < 0.4 ? 0 : t < 0.55 ? (t - 0.4) / 0.15 : 1 - (t - 0.55) / 0.45;

    switch (style) {
      case 'melee_chop': {
        // Wind weapon back, swing forward + step.
        const swing = -1.3 * windup + 2.2 * Math.max(0, strike);
        this.weapon.rotation.z = swing;
        this.lungeAmount = 0.22 * Math.sin(Math.PI * Math.max(0, strike));
        break;
      }
      case 'melee_spin': {
        // Continuous spin + lunge.
        this.weapon.rotation.y = t * Math.PI * 4;
        this.lungeAmount = 0.18 * Math.sin(Math.PI * t);
        break;
      }
      case 'melee_dash': {
        // Crouch then leap.
        const sq = 1 - 0.25 * Math.abs(Math.sin(Math.PI * t));
        this.body.scale.y = sq;
        this.lungeAmount = 0.35 * Math.max(0, Math.sin(Math.PI * t));
        this.weapon.rotation.z = -0.6 + 1.4 * windup;
        break;
      }
      case 'ranged_snap': {
        // Pull back then snap forward.
        const pull = -windup * 0.4;
        const snap = strike * 0.6;
        this.weapon.rotation.x = pull + snap;
        this.lungeAmount = 0.08 - 0.06 * windup + 0.12 * strike;
        break;
      }
      case 'cast_burst': {
        // Float up, raise weapon, orb flares.
        this.lungeAmount = 0;
        this.body.position.y = 0.1 + 0.08 * Math.sin(Math.PI * t);
        this.weapon.rotation.z = -0.6 - 0.6 * windup + 0.4 * strike;
        // Brighten orb if any
        const orb = this.weapon.children.find((c) =>
          (c as THREE.Mesh).material instanceof THREE.MeshStandardMaterial &&
          (((c as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity ?? 0) > 0.5,
        );
        if (orb) {
          const m = (orb as THREE.Mesh).material as THREE.MeshStandardMaterial;
          m.emissiveIntensity = 1 + 2.5 * windup * (1 - strike * 0.5);
        }
        break;
      }
      case 'cast_heal': {
        this.body.position.y = 0.1 + 0.1 * Math.sin(Math.PI * t);
        this.weapon.rotation.z = -0.3 * Math.sin(Math.PI * t);
        break;
      }
      default: {
        this.weapon.rotation.z = -0.4 * windup + 0.8 * strike;
        this.lungeAmount = 0.18 * Math.max(0, Math.sin(Math.PI * t));
      }
    }
  }

  private applyTransform() {
    // Position (with lunge along facing) + small shake + sink for death.
    const lungeWorld = this.lungeAmount * this.facing;
    this.group.position.set(
      this.px + lungeWorld + this.shake,
      this.sinkY,
      this.pz,
    );
    // Face along world X — rotate to look toward enemy direction.
    this.group.rotation.y = this.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    // Tilt for death animation.
    this.group.rotation.z = this.tilt * (this.facing > 0 ? -1 : 1);

    // Body idle bob (only when alive).
    if (this.alive) {
      const b = Math.sin(this.idleTime * 2.4 + this.px) * 0.025;
      this.body.position.y = 0.1 + b;
      this.head.position.y = 0.1 + BODY_HEIGHT + HEAD_RADIUS * 0.55 + b;
    }

    // Hit flash — lerp body color toward white.
    if (this.flashLevel > 0) {
      const c = new THREE.Color(this.originalBody);
      c.lerp(new THREE.Color(0xffffff), this.flashLevel * 0.75);
      this.bodyMat.color.copy(c);
    } else if (this.alive) {
      // Reset to original each frame so heal/cast tints don't bleed forever.
      this.bodyMat.color.setHex(this.originalBody);
    }
  }

  // Bright aura when ability is ready.
  setAbilityReady(ready: boolean) {
    this.auraMat.opacity = ready ? 0.85 : 0.35;
  }

  update(dt: number) {
    this.idleTime += dt;
    // Step all active actions; cull finished.
    for (let i = this.actions.length - 1; i >= 0; i--) {
      const a = this.actions[i];
      a.elapsed += dt;
      const t = clamp(a.elapsed / a.duration, 0, 1);
      a.onUpdate(t, dt);
      if (a.elapsed >= a.duration) {
        a.onEnd?.();
        this.actions.splice(i, 1);
      }
    }
    this.applyTransform();
  }

  // True if any non-idle action is still running. Used by the playback
  // system to wait for animations to settle before scheduling the next
  // tick of events on slow speeds.
  isAnimating(): boolean {
    return this.actions.length > 0;
  }

  dispose() {
    this.group.traverse((o) => {
      if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
    });
    this.bodyMat.dispose();
    this.trimMat.dispose();
    this.weaponMat.dispose();
    this.auraMat.dispose();
  }

  worldPos(): { x: number; y: number; z: number } {
    return { x: this.group.position.x, y: this.group.position.y, z: this.group.position.z };
  }
}

// -------------------------------------------------------------------
// Attack style routing — drives which animation profile runs in
// `driveAttack`. Projectile attackers use the 'ranged_snap' or
// 'cast_burst' variants depending on class.
// -------------------------------------------------------------------
type AttackStyle =
  | 'melee_chop'
  | 'melee_spin'
  | 'melee_dash'
  | 'ranged_snap'
  | 'cast_burst'
  | 'cast_heal'
  | 'generic';

function attackStyle(cls: HeroClass, isProjectile: boolean): AttackStyle {
  if (isProjectile) {
    switch (cls) {
      case 'Archer': return 'ranged_snap';
      case 'Mage':
      case 'Necromancer': return 'cast_burst';
      case 'Cleric':
      case 'Druid': return 'cast_heal';
      default: return 'ranged_snap';
    }
  }
  switch (cls) {
    case 'Warrior':
    case 'Paladin': return 'melee_chop';
    case 'Berserker': return 'melee_spin';
    case 'Rogue':
    case 'Monk': return 'melee_dash';
    case 'Archer': return 'ranged_snap';
    case 'Mage':
    case 'Necromancer': return 'cast_burst';
    case 'Cleric':
    case 'Druid': return 'cast_heal';
    default: return 'generic';
  }
}

// Helper for the engine to build an init payload from the existing
// LiveUnit type without reaching into all the fields manually.
export function liveUnitToInit(u: LiveUnit, world: { x: number; z: number }): UnitInit {
  return {
    id: u.id,
    heroClass: u.heroClass,
    isPlayer: u.isPlayer,
    position: world,
    hp: u.hp,
    maxHp: u.maxHp,
    mana: u.mana,
    maxMana: u.maxMana,
  };
}

// Projectile: glowing core + trail (LineSegments with vertex alpha) that
// arcs from source to target. The arc is a quadratic curve so arrows
// and spells lift slightly between origin and impact.
//
// Lifetime is short (~0.34s by default — tuned to match the existing
// battle pacing). On arrival the projectile detonates into a small
// burst that the Engine handles via the ParticleSystem.

import * as THREE from 'three';
import { Element } from '../types';
import { lerp } from './math';

const ELEMENT_COLOR: Record<Element, number> = {
  physical: 0xfff7c2,
  fire: 0xff7a18,
  ice: 0xb8e6ff,
  lightning: 0xfff2a8,
  holy: 0xfff5b4,
  shadow: 0xb89bff,
  nature: 0xbef07a,
};

const ELEMENT_TRAIL: Record<Element, number> = {
  physical: 0x6f6f6f,
  fire: 0xcf3623,
  ice: 0x3da4ff,
  lightning: 0xf1c40f,
  holy: 0xf4c542,
  shadow: 0x5a2eb0,
  nature: 0x27ae60,
};

const TRAIL_LEN = 14;

export class Projectile {
  readonly group = new THREE.Group();
  private head: THREE.Mesh;
  private trail: THREE.Line;
  private positions: Float32Array;
  private from: THREE.Vector3;
  private to: THREE.Vector3;
  private arc: number;
  private elapsed = 0;
  readonly duration: number;
  done = false;
  readonly element: Element;

  constructor(opts: {
    from: { x: number; z: number };
    to: { x: number; z: number };
    element: Element;
    duration?: number;
  }) {
    this.element = opts.element;
    this.duration = opts.duration ?? 0.34;
    this.from = new THREE.Vector3(opts.from.x, 0.6, opts.from.z);
    this.to = new THREE.Vector3(opts.to.x, 0.6, opts.to.z);
    this.arc = Math.max(0.3, this.from.distanceTo(this.to) * 0.18);

    // Head: glowing sphere with bright emissive + a halo billboard
    const headMat = new THREE.MeshStandardMaterial({
      color: ELEMENT_COLOR[opts.element],
      emissive: ELEMENT_COLOR[opts.element],
      emissiveIntensity: 1.8,
      roughness: 0.2,
      transparent: true,
      opacity: 1.0,
    });
    this.head = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 12, 10),
      headMat,
    );
    this.group.add(this.head);

    // Halo behind the head — a billboarded sprite-like quad.
    const haloMat = new THREE.MeshBasicMaterial({
      color: ELEMENT_COLOR[opts.element],
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), haloMat);
    halo.position.copy(this.head.position);
    halo.renderOrder = 5;
    this.head.add(halo);
    (halo as any).userData.billboard = true;

    // Trail — a strip of TRAIL_LEN points colored along its length with
    // alpha falloff at the tail. We update vertex colors each frame.
    this.positions = new Float32Array(TRAIL_LEN * 3);
    const colors = new Float32Array(TRAIL_LEN * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const trailMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      linewidth: 2, // mostly ignored on mobile, kept for desktop
    });
    this.trail = new THREE.Line(trailGeo, trailMat);
    this.group.add(this.trail);

    // Initialize the trail at the source so we don't draw a streak from origin.
    for (let i = 0; i < TRAIL_LEN; i++) {
      this.positions[i * 3 + 0] = this.from.x;
      this.positions[i * 3 + 1] = this.from.y;
      this.positions[i * 3 + 2] = this.from.z;
    }
    // Trail color fades head→tail using ELEMENT_TRAIL color.
    const headC = new THREE.Color(ELEMENT_COLOR[opts.element]);
    const tailC = new THREE.Color(ELEMENT_TRAIL[opts.element]);
    for (let i = 0; i < TRAIL_LEN; i++) {
      const t = i / (TRAIL_LEN - 1);
      const c = headC.clone().lerp(tailC, t);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
  }

  update(dt: number, cameraPos: THREE.Vector3): boolean {
    this.elapsed += dt;
    const t = Math.min(1, this.elapsed / this.duration);

    // Arc position (parabola)
    const x = lerp(this.from.x, this.to.x, t);
    const z = lerp(this.from.z, this.to.z, t);
    const liftT = Math.sin(t * Math.PI);
    const y = lerp(this.from.y, this.to.y, t) + this.arc * liftT;
    this.head.position.set(x, y, z);

    // Trail — shift positions back by one and push current head pos.
    for (let i = TRAIL_LEN - 1; i > 0; i--) {
      this.positions[i * 3 + 0] = this.positions[(i - 1) * 3 + 0];
      this.positions[i * 3 + 1] = this.positions[(i - 1) * 3 + 1];
      this.positions[i * 3 + 2] = this.positions[(i - 1) * 3 + 2];
    }
    this.positions[0] = x;
    this.positions[1] = y;
    this.positions[2] = z;
    (this.trail.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // Billboard halo: face the camera.
    const halo = this.head.children[0];
    if (halo) {
      const dir = new THREE.Vector3().copy(cameraPos).sub(this.head.position).normalize();
      halo.lookAt(this.head.position.x + dir.x, this.head.position.y + dir.y, this.head.position.z + dir.z);
    }

    // Spin head for visual interest.
    this.head.rotation.y += dt * 8;

    // Fade out the head opacity in the last 15% so it doesn't disappear hard.
    const fade = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
    (this.head.material as THREE.MeshStandardMaterial).opacity = fade;

    if (t >= 1) {
      this.done = true;
      return false; // signal removal
    }
    return true;
  }

  dispose() {
    this.head.geometry.dispose();
    (this.head.material as THREE.Material).dispose();
    this.trail.geometry.dispose();
    (this.trail.material as THREE.Material).dispose();
  }

  // Final impact point so the engine can place a hit burst there.
  impactPos(): { x: number; y: number; z: number } {
    return { x: this.to.x, y: this.to.y, z: this.to.z };
  }
}

export function elementColor(e: Element): number {
  return ELEMENT_COLOR[e] ?? ELEMENT_COLOR.physical;
}

export function elementTrail(e: Element): number {
  return ELEMENT_TRAIL[e] ?? ELEMENT_TRAIL.physical;
}

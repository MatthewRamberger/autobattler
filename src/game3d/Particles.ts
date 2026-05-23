// A pool-backed particle system. Each emitter spawns a burst that lives
// for ~0.6s; particles are simple Points sprites with vertex colors
// fading from element-bright to dark. The whole system shares one
// Points object per burst to keep draw calls low.
//
// Burst kinds:
//   • hit       — sparks fan outward from impact in element color
//   • shockwave — flat ring expanding on the ground (radial billboard)
//   • cast      — soft glow particles drifting upward from caster
//   • death     — dark wisps rising from a fallen unit
//
// All bursts auto-remove themselves from the scene when they expire.

import * as THREE from 'three';
import { Element } from '../types';
import { elementColor } from './Projectile';

interface ParticleBurst {
  group: THREE.Object3D;
  elapsed: number;
  duration: number;
  update: (t: number, dt: number) => void;
  dispose: () => void;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private active: ParticleBurst[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(dt: number) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const b = this.active[i];
      b.elapsed += dt;
      const t = Math.min(1, b.elapsed / b.duration);
      b.update(t, dt);
      if (b.elapsed >= b.duration) {
        this.scene.remove(b.group);
        b.dispose();
        this.active.splice(i, 1);
      }
    }
  }

  // Bright sparks flying outward from an impact point.
  hit(position: { x: number; y: number; z: number }, element: Element, intensity = 1) {
    const count = Math.floor(14 * intensity);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities: Array<{ x: number; y: number; z: number }> = [];
    const color = new THREE.Color(elementColor(element));
    const dark = new THREE.Color(0x111111);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      const ang = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      velocities.push({
        x: Math.cos(ang) * speed,
        y: 1.5 + Math.random() * 2.0,
        z: Math.sin(ang) * speed,
      });
      const c = color.clone().lerp(dark, Math.random() * 0.3);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    this.active.push({
      group: points,
      elapsed: 0,
      duration: 0.55,
      update: (t, dt) => {
        const posAttr = geo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < count; i++) {
          const v = velocities[i];
          // Gravity damping over time.
          v.y -= 8 * dt;
          posAttr.array[i * 3 + 0] += v.x * dt;
          posAttr.array[i * 3 + 1] += v.y * dt;
          posAttr.array[i * 3 + 2] += v.z * dt;
        }
        posAttr.needsUpdate = true;
        mat.opacity = 1 - t;
        mat.size = 0.12 * (1 - t * 0.4);
      },
      dispose: () => { geo.dispose(); mat.dispose(); },
    });
  }

  // Ring shockwave that expands on the ground. Use for ability blasts.
  shockwave(position: { x: number; y: number; z: number }, element: Element, max = 1.6) {
    const ringGeo = new THREE.RingGeometry(0.05, 0.12, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: elementColor(element),
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(ringGeo, mat);
    mesh.position.set(position.x, 0.12, position.z);
    this.scene.add(mesh);
    this.active.push({
      group: mesh,
      elapsed: 0,
      duration: 0.6,
      update: (t) => {
        const s = 0.1 + max * t;
        mesh.scale.set(s, 1, s);
        mat.opacity = 0.85 * (1 - t);
      },
      dispose: () => { ringGeo.dispose(); mat.dispose(); },
    });
  }

  // Soft up-drifting motes during casting.
  cast(position: { x: number; y: number; z: number }, element: Element) {
    const count = 10;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities: Array<{ y: number; x: number; z: number }> = [];
    const color = new THREE.Color(elementColor(element));
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = position.x + (Math.random() - 0.5) * 0.35;
      positions[i * 3 + 1] = position.y + Math.random() * 0.4;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.35;
      velocities.push({ y: 1 + Math.random() * 1.2, x: (Math.random() - 0.5) * 0.4, z: (Math.random() - 0.5) * 0.4 });
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.active.push({
      group: points,
      elapsed: 0,
      duration: 0.85,
      update: (t, dt) => {
        const posAttr = geo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < count; i++) {
          const v = velocities[i];
          posAttr.array[i * 3 + 0] += v.x * dt;
          posAttr.array[i * 3 + 1] += v.y * dt;
          posAttr.array[i * 3 + 2] += v.z * dt;
        }
        posAttr.needsUpdate = true;
        mat.opacity = 1 - t;
      },
      dispose: () => { geo.dispose(); mat.dispose(); },
    });
  }

  // Dark wisps rising from a death.
  death(position: { x: number; y: number; z: number }) {
    const count = 16;
    const positions = new Float32Array(count * 3);
    const velocities: Array<{ y: number; x: number; z: number; tw: number }> = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = position.x + (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = position.y + Math.random() * 0.2;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.3;
      velocities.push({
        y: 0.6 + Math.random() * 0.8,
        x: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 0.5,
        tw: Math.random() * Math.PI * 2,
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.22,
      color: 0xaa99cc,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.active.push({
      group: points,
      elapsed: 0,
      duration: 1.0,
      update: (t, dt) => {
        const posAttr = geo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < count; i++) {
          const v = velocities[i];
          v.tw += dt * 3;
          posAttr.array[i * 3 + 0] += (v.x + Math.cos(v.tw) * 0.25) * dt;
          posAttr.array[i * 3 + 1] += v.y * dt;
          posAttr.array[i * 3 + 2] += (v.z + Math.sin(v.tw) * 0.25) * dt;
        }
        posAttr.needsUpdate = true;
        mat.opacity = 0.8 * (1 - t);
      },
      dispose: () => { geo.dispose(); mat.dispose(); },
    });
  }

  dispose() {
    for (const b of this.active) {
      this.scene.remove(b.group);
      b.dispose();
    }
    this.active = [];
  }
}

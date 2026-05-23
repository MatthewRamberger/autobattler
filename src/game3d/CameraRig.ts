// Orbital strategy camera around the battlefield center. Public methods
// take normalized gesture deltas (PanResponder feeds these in from the
// React side) and produce smooth orbit/zoom. We also do a tiny screen
// shake hook used when big hits land.
//
// State is plain spherical coords (radius, theta=azimuth, phi=polar)
// with min/max clamping. We damp toward a target each frame so the
// camera glides instead of snapping.

import * as THREE from 'three';
import { HexGrid } from '../utils/hex';
import { gridExtents } from './math';
import { clamp, lerp } from './math';

interface CameraTarget {
  radius: number;
  theta: number;
  phi: number;
  centerY: number;
}

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  private target: CameraTarget;
  private current: CameraTarget;
  private minRadius: number;
  private maxRadius: number;
  // Screen-shake state
  private shakeStrength = 0;
  private shakeT = 0;

  constructor(aspect: number, grid: HexGrid) {
    const { width, depth } = gridExtents(grid);
    const span = Math.max(width, depth);

    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.5, 200);

    // Choose starting orbit based on map size — siege maps pull farther
    // away so all units fit.
    const baseRadius = grid.size === 'siege' ? span * 0.9 : span * 0.85;
    this.minRadius = grid.size === 'siege' ? span * 0.55 : span * 0.5;
    this.maxRadius = span * 1.6;
    const phi = Math.PI / 3.2; // ~56° down from vertical
    const theta = -Math.PI / 2; // looking along +Z (toward the player side)
    this.target = { radius: baseRadius, theta, phi, centerY: 0 };
    this.current = { ...this.target };
    this.apply(1);
  }

  resize(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  // Drag pan — rotates azimuth and tilts polar by a fraction. We clamp
  // polar so the camera can't go below the ground or straight overhead.
  drag(dx: number, dy: number) {
    this.target.theta -= dx * 0.005;
    this.target.phi = clamp(this.target.phi - dy * 0.003, 0.35, Math.PI / 2 - 0.05);
  }

  zoom(scale: number) {
    // scale > 1 means push out, < 1 means pull in.
    this.target.radius = clamp(this.target.radius * scale, this.minRadius, this.maxRadius);
  }

  // Snap-back to default orbit (called from the reset button).
  reset() {
    this.target.theta = -Math.PI / 2;
    this.target.phi = Math.PI / 3.2;
    this.target.radius = (this.minRadius + this.maxRadius) * 0.45;
  }

  shake(strength: number) {
    this.shakeStrength = Math.max(this.shakeStrength, strength);
    this.shakeT = 0;
  }

  update(dt: number) {
    // Damp current toward target. The camera glides over ~3 frames
    // worth of step at 60fps, which keeps it responsive but smooth.
    const damp = 1 - Math.pow(0.0001, dt);
    this.current.radius = lerp(this.current.radius, this.target.radius, damp);
    this.current.theta = lerp(this.current.theta, this.target.theta, damp);
    this.current.phi = lerp(this.current.phi, this.target.phi, damp);
    this.current.centerY = lerp(this.current.centerY, this.target.centerY, damp);

    // Decay shake
    if (this.shakeStrength > 0) {
      this.shakeT += dt;
      this.shakeStrength = Math.max(0, this.shakeStrength - dt * 4);
    }
    this.apply(dt);
  }

  private apply(dt: number) {
    const { radius, theta, phi, centerY } = this.current;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const x = radius * sinPhi * Math.cos(theta);
    const z = radius * sinPhi * Math.sin(theta);
    const y = radius * cosPhi + centerY;
    let shakeX = 0, shakeY = 0;
    if (this.shakeStrength > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeStrength * 0.25;
      shakeY = (Math.random() - 0.5) * this.shakeStrength * 0.25;
    }
    this.camera.position.set(x + shakeX, y + shakeY, z);
    this.camera.lookAt(0, 0.4, 0);
  }
}

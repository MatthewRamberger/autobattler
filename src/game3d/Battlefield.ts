// Procedural battlefield: ground plate + per-tile beveled hex meshes +
// theme-tinted obstacles. Generated once per battle from the level's
// grid, theme, and obstacle list. The whole thing is added under a
// single `root` Group so the Engine can place/rotate the battlefield
// without touching individual children.

import * as THREE from 'three';
import { HexGrid } from '../utils/hex';
import { Obstacle, ObstacleKind } from '../types';
import {
  hexToWorld, gridExtents, boardCenter, HEX_W, HEX_H, hexCornerOffsets,
} from './math';
import { ThreeTheme, OBSTACLE_SPECS, ObstacleSpec } from './themes';

const TILE_THICKNESS = 0.08;
const TILE_GAP = 0.04;       // shrink each tile slightly so grout shows
const FRINGE = 3.5;          // extra ground extending past the playable area

export interface BattlefieldOptions {
  grid: HexGrid;
  theme: ThreeTheme;
  obstacles?: Obstacle[];
}

export class Battlefield {
  readonly root = new THREE.Group();
  readonly tiles: THREE.Mesh[] = [];
  private grid: HexGrid;
  private theme: ThreeTheme;
  // World offset used to recenter the board on origin (player side
  // along -X, enemy along +X after the engine's rotation).
  readonly center: { x: number; z: number };

  constructor(opts: BattlefieldOptions) {
    this.grid = opts.grid;
    this.theme = opts.theme;
    this.center = boardCenter(opts.grid);

    this.buildGround();
    this.buildTiles();
    this.buildContestedSeam();
    if (opts.obstacles?.length) this.buildObstacles(opts.obstacles);
  }

  dispose() {
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[];
      if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
      else if (m) m.dispose();
    });
  }

  // World position for a hex cell relative to the centered battlefield.
  worldOf(col: number, row: number): { x: number; z: number } {
    const { x, z } = hexToWorld({ col, row });
    return { x: x - this.center.x, z: z - this.center.z };
  }

  // ---------------------------------------------------------------------
  // Ground plate — a wide tinted slab with a soft radial darkening so the
  // battlefield reads as the centerpiece. Built from a Plane with vertex
  // colors to avoid a texture.
  // ---------------------------------------------------------------------
  private buildGround() {
    const { width, depth } = gridExtents(this.grid);
    const w = width + FRINGE * 2;
    const d = depth + FRINGE * 2;
    const geo = new THREE.PlaneGeometry(w, d, 24, 24);
    geo.rotateX(-Math.PI / 2);

    // Tint vertices darker near edges, slightly varied for noise.
    const colors = new Float32Array(geo.attributes.position.count * 3);
    const base = new THREE.Color(this.theme.groundBase);
    const edge = new THREE.Color(this.theme.groundEdge);
    const tmp = new THREE.Color();
    const pos = geo.attributes.position;
    const maxR = Math.hypot(w / 2, d / 2);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z) / maxR;
      const t = Math.min(1, Math.pow(r, 1.6) + (Math.random() - 0.5) * 0.04);
      tmp.copy(base).lerp(edge, t);
      colors[i * 3 + 0] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -TILE_THICKNESS;
    mesh.receiveShadow = true;
    this.root.add(mesh);
  }

  // ---------------------------------------------------------------------
  // Hex tiles — each tile is an extruded hex prism with a colored top.
  // Player side uses a cool tint, enemy side a warm one; the contested
  // middle column glows seam-color and pulses (driven by the engine).
  // ---------------------------------------------------------------------
  private buildTiles() {
    const { grid } = this;
    const cornerOffsets = hexCornerOffsets();
    const shape = new THREE.Shape();
    cornerOffsets.forEach((c, i) => {
      const s = 1 - TILE_GAP;
      const x = c.x * s, z = c.z * s;
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    });
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: TILE_THICKNESS,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 1,
      curveSegments: 1,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, TILE_THICKNESS, 0);

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const inPlayer = col <= grid.playerMaxCol;
        const inEnemy = col >= grid.enemyMinCol;
        const seam = !inPlayer && !inEnemy;
        const baseColor = seam
          ? this.theme.tileSeam
          : inPlayer
            ? this.theme.tilePlayer
            : this.theme.tileEnemy;

        const mat = new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: 0.65,
          metalness: 0.05,
          transparent: true,
          opacity: seam ? 0.55 : 0.45,
          emissive: seam ? this.theme.tileSeam : 0x000000,
          emissiveIntensity: seam ? 0.25 : 0.0,
        });
        const mesh = new THREE.Mesh(geo, mat);
        const w = this.worldOf(col, row);
        mesh.position.set(w.x, 0, w.z);
        mesh.userData = { col, row, seam, inPlayer, inEnemy };
        this.tiles.push(mesh);
        this.root.add(mesh);
      }
    }

    // Etched grid lines — a single LineSegments overlay above the tiles.
    const positions: number[] = [];
    const cornerWorld = hexCornerOffsets();
    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const w = this.worldOf(col, row);
        const y = TILE_THICKNESS + 0.005;
        for (let i = 0; i < 6; i++) {
          const a = cornerWorld[i];
          const b = cornerWorld[(i + 1) % 6];
          positions.push(w.x + a.x * (1 - TILE_GAP), y, w.z + a.z * (1 - TILE_GAP));
          positions.push(w.x + b.x * (1 - TILE_GAP), y, w.z + b.z * (1 - TILE_GAP));
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: this.theme.tileLine,
      transparent: true,
      opacity: this.theme.tileLineAlpha,
    });
    this.root.add(new THREE.LineSegments(lineGeo, lineMat));
  }

  // ---------------------------------------------------------------------
  // Contested seam — a glowing strip drawn slightly above the tiles
  // along the dividing column. The engine pulses its emissive intensity
  // on each tick for atmospheric breathing.
  // ---------------------------------------------------------------------
  seamPulse?: THREE.Mesh;
  private buildContestedSeam() {
    const { grid } = this;
    const seamCol = (grid.playerMaxCol + grid.enemyMinCol) / 2;
    const { depth } = gridExtents(grid);
    const w = HEX_W * 0.05;
    const geo = new THREE.PlaneGeometry(w, depth + HEX_H * 0.6);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: this.theme.tileSeam,
      emissive: this.theme.tileSeam,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const xCenter = this.worldOf(Math.floor(seamCol), 0).x + (HEX_W / 2) * (seamCol % 1 === 0.5 ? 1 : 0.5);
    mesh.position.set(xCenter, TILE_THICKNESS + 0.01, 0);
    this.root.add(mesh);
    this.seamPulse = mesh;
  }

  // ---------------------------------------------------------------------
  // Obstacles — each kind has a primitive blueprint in OBSTACLE_SPECS.
  // We instantiate them with light random rotation/scale variance.
  // ---------------------------------------------------------------------
  private buildObstacles(obstacles: Obstacle[]) {
    for (const o of obstacles) {
      const spec = OBSTACLE_SPECS[o.kind] ?? OBSTACLE_SPECS.rock;
      const mesh = this.makeObstacleMesh(o.kind, spec);
      const w = this.worldOf(o.col, o.row);
      mesh.position.set(w.x, TILE_THICKNESS, w.z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      this.root.add(mesh);
    }
  }

  private makeObstacleMesh(_kind: ObstacleKind, spec: ObstacleSpec) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.8,
      metalness: 0.05,
      emissive: spec.emissive ?? 0x000000,
      emissiveIntensity: spec.emissiveIntensity ?? 0,
    });
    const [sx, sy, sz] = spec.scale ?? [0.5, 0.5, 0.5];

    switch (spec.shape) {
      case 'rock': {
        const geo = new THREE.IcosahedronGeometry(0.5, 0);
        // Crush the icosahedron a little for organic rockiness.
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          pos.setXYZ(i, pos.getX(i) * (0.9 + Math.random() * 0.2),
            pos.getY(i) * (0.9 + Math.random() * 0.2),
            pos.getZ(i) * (0.9 + Math.random() * 0.2));
        }
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(sx, sy, sz);
        mesh.position.y = sy * 0.5;
        group.add(mesh);
        break;
      }
      case 'cone': {
        const geo = new THREE.ConeGeometry(0.5, 1.0, 8);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(sx, sy, sz);
        mesh.position.y = sy * 0.5;
        group.add(mesh);
        break;
      }
      case 'orb': {
        const geo = new THREE.SphereGeometry(0.5, 12, 10);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(sx, sy, sz);
        mesh.position.y = sy * 0.5;
        group.add(mesh);
        break;
      }
      case 'cylinder': {
        const geo = new THREE.CylinderGeometry(0.4, 0.5, 1.0, 10);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(sx, sy, sz);
        mesh.position.y = sy * 0.5;
        group.add(mesh);
        break;
      }
      case 'column': {
        const geo = new THREE.CylinderGeometry(0.18, 0.22, 1.0, 8);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(sx / 0.2, sy, sz / 0.2);
        mesh.position.y = sy * 0.5;
        group.add(mesh);
        // Cap on top
        const capGeo = new THREE.BoxGeometry(0.4, 0.08, 0.4);
        const cap = new THREE.Mesh(capGeo, mat);
        cap.position.y = sy + 0.04;
        cap.scale.set(1, 1, 1);
        group.add(cap);
        break;
      }
      case 'block': {
        const geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(sx, sy, sz);
        mesh.position.y = sy * 0.5;
        group.add(mesh);
        // Cap
        const capGeo = new THREE.BoxGeometry(1.1, 0.1, 1.1);
        const cap = new THREE.Mesh(capGeo, mat);
        cap.scale.set(sx, 1, sz);
        cap.position.y = sy + 0.05;
        group.add(cap);
        break;
      }
      case 'cluster': {
        // 3 stacked icosahedrons for a leafy bush look.
        for (let i = 0; i < 3; i++) {
          const geo = new THREE.IcosahedronGeometry(0.35, 0);
          const m = new THREE.Mesh(geo, mat);
          m.position.set((Math.random() - 0.5) * 0.3, 0.25 + i * 0.18, (Math.random() - 0.5) * 0.3);
          m.scale.set(sx, sy * 0.7, sz);
          group.add(m);
        }
        break;
      }
    }

    return group;
  }

  // Pulse the seam strip — call from the Engine tick.
  update(time: number) {
    if (this.seamPulse) {
      const mat = this.seamPulse.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(time * 1.6));
    }
  }
}

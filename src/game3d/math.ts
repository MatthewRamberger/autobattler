// Hex grid → world conversion + small math helpers used throughout the
// 3D scene. Keeps the existing (col, row) authoring untouched while the
// renderer works in continuous world space (Three.js Y-up, X-east, Z-south).
//
// Cell size is in world units. One hex = HEX_SIZE wide point-to-flat;
// pointy-top orientation matches the 2D layout.

import { GridPosition } from '../types';
import { HexGrid } from '../utils/hex';

export const HEX_SIZE = 1.0;
export const HEX_W = HEX_SIZE;                // width across flats
export const HEX_H = HEX_W * 2 / Math.sqrt(3); // top→bottom across points
export const ROW_STEP = HEX_H * 0.75;
export const COL_STEP = HEX_W;

export interface WorldXZ { x: number; z: number; }

export function hexToWorld(p: GridPosition): WorldXZ {
  const shift = (p.row & 1) ? COL_STEP / 2 : 0;
  // Center the board on origin per-render; offset by board extents happens
  // when we install the battlefield root.
  const x = shift + COL_STEP * p.col;
  const z = ROW_STEP * p.row;
  return { x, z };
}

export function gridExtents(grid: HexGrid): { width: number; depth: number } {
  // Width = (cols + 0.5) hexes to account for the odd-row stagger.
  const width = COL_STEP * (grid.cols + 0.5);
  const depth = ROW_STEP * (grid.rows - 1) + HEX_H;
  return { width, depth };
}

// Center offset so the battlefield root sits at origin and units render
// symmetrically around it. Subtract from a world position to recenter.
export function boardCenter(grid: HexGrid): WorldXZ {
  const { width, depth } = gridExtents(grid);
  return { x: width / 2 - COL_STEP / 2, z: depth / 2 - HEX_H / 2 };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Cubic ease-out — used for tween curves where overshoot would feel wrong
// (movements, fades). For attack lunges we use a bespoke profile in Unit.
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Hex point in CCW order, used to stroke tile outlines and build the
// ground plate as a triangle fan.
export function hexCornerOffsets(): Array<{ x: number; z: number }> {
  const out: Array<{ x: number; z: number }> = [];
  for (let i = 0; i < 6; i++) {
    // Pointy-top: first corner is straight up (angle = -90° + 60°*i).
    const ang = (Math.PI / 180) * (-90 + 60 * i);
    out.push({ x: (HEX_W / 2) * Math.cos(ang) * (2 / Math.sqrt(3)), z: (HEX_H / 2) * Math.sin(ang) });
  }
  return out;
}

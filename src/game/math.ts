// Hex grid → screen conversion + lightweight math helpers used
// throughout the pure-JS battle engine.
//
// The battlefield is rendered in a 2.5D isometric-ish projection:
// the hex grid lives on a flat plane that we tilt forward by ~50°
// so the player gets a perspective view. To keep the math simple,
// we project (col, row) → (cx, cy) using the original hex layout
// and then squash the Y axis by `cos(tilt)` to simulate the tilt.
// The renderer applies a matching `rotateX` transform to the
// ground container, while units stay billboarded upright.

import { GridPosition } from '../types';
import { HexLayout, hexCenter } from '../utils/hex';

export const TILT_DEG = 50;
const TILT_RAD = (TILT_DEG * Math.PI) / 180;
export const TILT_COS = Math.cos(TILT_RAD);
// Depth → Y screen squashing factor. Used by the camera and units.
export const Y_SQUASH = TILT_COS;

export interface ScreenPt { x: number; y: number; depth: number; }

// Project a hex cell to screen coordinates inside the tilted
// battlefield. `depth` is the raw (untilted) Y — used for ordering
// units back-to-front so things in the back render under things
// in front.
export function projectCell(p: GridPosition, layout: HexLayout): ScreenPt {
  const { cx, cy } = hexCenter(p, layout);
  return { x: cx, y: cy * Y_SQUASH, depth: cy };
}

// Same but takes already-projected (cx, cy) flat coordinates. Handy
// for animated tween targets where we don't have a grid position.
export function projectFlat(cx: number, cy: number): ScreenPt {
  return { x: cx, y: cy * Y_SQUASH, depth: cy };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

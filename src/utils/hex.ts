// Hex grid helpers for the autobattler arena.
//
// Layout: pointy-top hexes, "odd-r" offset coordinates.
//   Row 0 (even): columns are flush left.
//   Row 1 (odd):  columns are shifted right by half a hex width.
//   Row 2 (even): flush left. Etc.
//
// Public coords stay {col, row} integers so existing data files & store
// don't need a schema change. Distance & neighbor math goes through
// cube coordinates internally.

import { GridPosition } from '../types';

export const HEX_COLS = 9;
export const HEX_ROWS = 5;
export const PLAYER_MAX_COL = 3;   // cols 0..3 belong to the player
export const ENEMY_MIN_COL = 5;    // cols 5..8 belong to the enemy
// Column 4 is the "contested" no-place zone (the river/center line).

interface Cube { x: number; y: number; z: number; }

function offsetToCube(p: GridPosition): Cube {
  // odd-r offset → cube
  const x = p.col - (p.row - (p.row & 1)) / 2;
  const z = p.row;
  const y = -x - z;
  return { x, y, z };
}

export function hexDistance(a: GridPosition, b: GridPosition): number {
  const ac = offsetToCube(a);
  const bc = offsetToCube(b);
  return (Math.abs(ac.x - bc.x) + Math.abs(ac.y - bc.y) + Math.abs(ac.z - bc.z)) / 2;
}

// Six neighbors in odd-r offset coordinates (odd rows shifted RIGHT).
// Verified by round-tripping through cube → distance for every direction.
const NEIGHBORS_EVEN: Array<[number, number]> = [
  [+1,  0], [ 0, -1], [-1, -1],
  [-1,  0], [-1, +1], [ 0, +1],
];
const NEIGHBORS_ODD: Array<[number, number]> = [
  [+1,  0], [+1, -1], [ 0, -1],
  [-1,  0], [ 0, +1], [+1, +1],
];

export function hexNeighbors(p: GridPosition): GridPosition[] {
  const set = (p.row & 1) ? NEIGHBORS_ODD : NEIGHBORS_EVEN;
  return set.map(([dc, dr]) => ({ col: p.col + dc, row: p.row + dr }));
}

export function inBounds(p: GridPosition): boolean {
  return p.col >= 0 && p.col < HEX_COLS && p.row >= 0 && p.row < HEX_ROWS;
}

// Convert a hex cell to pixel center, given the on-screen hex width.
// Pointy-top hex geometry:
//   hexW  = width across the flat sides
//   hexH  = hexW * 2 / sqrt(3)   (top-to-bottom across the points)
//   rowH  = hexH * 3/4           (vertical step between rows)
//   odd-row x offset = hexW / 2
export function hexLayout(boardW: number, boardH: number) {
  // Width is constrained by HEX_COLS + 0.5 for the odd-row shift.
  const wByCols = boardW / (HEX_COLS + 0.5);
  // Height is constrained by HEX_ROWS rows of 3/4 step plus one full hex bottom.
  const hByRows = boardH / ((HEX_ROWS - 1) * 0.75 + 1);
  const hexHByH = hByRows;                         // candidate hex height from H budget
  const hexHByW = wByCols * 2 / Math.sqrt(3);      // candidate hex height from W budget
  const hexH = Math.min(hexHByH, hexHByW);
  const hexW = hexH * Math.sqrt(3) / 2;
  const rowH = hexH * 0.75;
  const totalW = hexW * (HEX_COLS + 0.5);
  const totalH = rowH * (HEX_ROWS - 1) + hexH;
  return { hexW, hexH, rowH, totalW, totalH };
}

export interface HexPx { cx: number; cy: number; }

// Pixel CENTER of a hex cell within a board sized via hexLayout.
export function hexCenter(p: GridPosition, layout: ReturnType<typeof hexLayout>): HexPx {
  const { hexW, hexH, rowH } = layout;
  const xOffset = (p.row & 1) ? hexW / 2 : 0;
  const cx = xOffset + hexW * (p.col + 0.5);
  const cy = hexH / 2 + rowH * p.row;
  return { cx, cy };
}

// One movement step from `from` toward `to`. Returns the neighbor cell whose
// hex distance to `to` is the smallest. Ties broken by closeness in cube space.
export function stepToward(from: GridPosition, to: GridPosition): GridPosition {
  const candidates = hexNeighbors(from).filter(inBounds);
  if (candidates.length === 0) return from;
  let best = candidates[0];
  let bestDist = hexDistance(best, to);
  for (let i = 1; i < candidates.length; i++) {
    const d = hexDistance(candidates[i], to);
    if (d < bestDist) { best = candidates[i]; bestDist = d; }
  }
  return best;
}

// Hex grid helpers for the autobattler arena.
//
// Layout: pointy-top hexes, "odd-r" offset coordinates (odd rows shifted
// right by half a hex width). Public coords stay {col, row} integers so
// existing data files & store don't need a schema change. Distance &
// neighbor math goes through cube coordinates internally.

import { GridPosition, Level } from '../types';

// Per-map grid description. Distance/neighbor math is unaffected by the
// outer bounds, but `inBounds`, autoPlace, summon-position picking, and
// rendering need to know how big the playable region is.
export interface HexGrid {
  size: 'small' | 'siege';
  cols: number;
  rows: number;
  playerMaxCol: number;   // inclusive
  enemyMinCol: number;    // inclusive
  maxHeroes: number;
}

export const SMALL_GRID: HexGrid = {
  size: 'small',
  cols: 9,
  rows: 5,
  playerMaxCol: 3,
  enemyMinCol: 5,
  maxHeroes: 5,
};

// Siege battlefield: 22 wide × 11 tall. Player owns cols 0..7, contested
// zone is cols 8..10, enemies spawn in cols 11..21. The Arena ScrollView
// handles horizontal panning since this is wider than any phone screen.
export const SIEGE_GRID: HexGrid = {
  size: 'siege',
  cols: 22,
  rows: 11,
  playerMaxCol: 7,
  enemyMinCol: 11,
  maxHeroes: 12,
};

export function gridForLevel(level: Pick<Level, 'mapSize'> | null | undefined): HexGrid {
  return level?.mapSize === 'siege' ? SIEGE_GRID : SMALL_GRID;
}

// Legacy exports — kept so older imports still resolve. These mirror the
// SMALL_GRID dimensions for back-compat.
export const HEX_COLS = SMALL_GRID.cols;
export const HEX_ROWS = SMALL_GRID.rows;
export const PLAYER_MAX_COL = SMALL_GRID.playerMaxCol;
export const ENEMY_MIN_COL = SMALL_GRID.enemyMinCol;

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

export function inBounds(p: GridPosition, grid: HexGrid = SMALL_GRID): boolean {
  return p.col >= 0 && p.col < grid.cols && p.row >= 0 && p.row < grid.rows;
}

// Convert a hex cell to pixel center, given the on-screen hex layout.
// Pointy-top hex geometry:
//   hexW  = width across the flat sides
//   hexH  = hexW * 2 / sqrt(3)   (top-to-bottom across the points)
//   rowH  = hexH * 3/4           (vertical step between rows)
//   odd-row x offset = hexW / 2
export interface HexLayout {
  hexW: number; hexH: number; rowH: number;
  totalW: number; totalH: number;
  grid: HexGrid;
}

export function hexLayout(boardW: number, boardH: number, grid: HexGrid = SMALL_GRID): HexLayout {
  // Width is constrained by cols + 0.5 for the odd-row shift.
  const wByCols = boardW / (grid.cols + 0.5);
  // Height is constrained by rows of 3/4 step plus one full hex bottom.
  const hByRows = boardH / ((grid.rows - 1) * 0.75 + 1);
  const hexHByH = hByRows;
  const hexHByW = wByCols * 2 / Math.sqrt(3);
  // For siege maps we prefer keeping hexes legible (min size ~26px)
  // even if that means the board overflows horizontally and scrolls.
  const minHex = grid.size === 'siege' ? 28 : 18;
  let hexH = Math.min(hexHByH, hexHByW);
  if (grid.size === 'siege') {
    // Don't shrink below the legibility floor — let the board be wider.
    hexH = Math.max(hexH, Math.min(minHex, hexHByH));
  }
  const hexW = hexH * Math.sqrt(3) / 2;
  const rowH = hexH * 0.75;
  const totalW = hexW * (grid.cols + 0.5);
  const totalH = rowH * (grid.rows - 1) + hexH;
  return { hexW, hexH, rowH, totalW, totalH, grid };
}

export interface HexPx { cx: number; cy: number; }

// Pixel CENTER of a hex cell within a board sized via hexLayout.
export function hexCenter(p: GridPosition, layout: HexLayout): HexPx {
  const { hexW, hexH, rowH } = layout;
  const xOffset = (p.row & 1) ? hexW / 2 : 0;
  const cx = xOffset + hexW * (p.col + 0.5);
  const cy = hexH / 2 + rowH * p.row;
  return { cx, cy };
}

// One movement step from `from` toward `to`. Returns the neighbor cell whose
// hex distance to `to` is the smallest. Ties broken by closeness in cube space.
export function stepToward(from: GridPosition, to: GridPosition): GridPosition {
  const candidates = hexNeighbors(from);
  if (candidates.length === 0) return from;
  let best = candidates[0];
  let bestDist = hexDistance(best, to);
  for (let i = 1; i < candidates.length; i++) {
    const d = hexDistance(candidates[i], to);
    if (d < bestDist) { best = candidates[i]; bestDist = d; }
  }
  return best;
}

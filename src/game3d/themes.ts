// Per-map 3D look-and-feel. Each theme drives:
//   - skybox gradient colors (top → horizon)
//   - fog color/density
//   - sun direction + color
//   - ground tint
//   - hex tile tint (player half / enemy half / contested seam)
//   - obstacle color palette (kind → material color)
//
// All values are plain hex strings so they can be referenced from React
// overlays as well. The Battlefield module reads this once at scene init.

import { MapTheme, ObstacleKind } from '../types';

export interface ThreeTheme {
  skyTop: number;
  skyHorizon: number;
  fog: number;
  fogDensity: number;
  ambient: number;
  ambientIntensity: number;
  sun: number;
  sunIntensity: number;
  sunDir: [number, number, number];
  rimWarm: number;
  rimCool: number;
  groundBase: number;
  groundEdge: number;
  tilePlayer: number;
  tileEnemy: number;
  tileSeam: number;
  tileLine: number;
  tileLineAlpha: number;
  obstacleTint: number;
}

const THEMES: Record<MapTheme, ThreeTheme> = {
  plains: {
    skyTop: 0x6892c6, skyHorizon: 0xc9d8e3, fog: 0xb8c5d1, fogDensity: 0.018,
    ambient: 0xc7d5e5, ambientIntensity: 0.55,
    sun: 0xfff2c8, sunIntensity: 1.45,
    sunDir: [0.55, 1.0, 0.4],
    rimWarm: 0xffc77a, rimCool: 0x6fa9e8,
    groundBase: 0x3c5824, groundEdge: 0x1d2b11,
    tilePlayer: 0x4a83b6, tileEnemy: 0xb74a45, tileSeam: 0xefc25a,
    tileLine: 0xc6d6a0, tileLineAlpha: 0.35,
    obstacleTint: 0xb6a071,
  },
  forest: {
    skyTop: 0x274038, skyHorizon: 0x4d6e5e, fog: 0x223028, fogDensity: 0.045,
    ambient: 0x5a7866, ambientIntensity: 0.5,
    sun: 0xb6e08a, sunIntensity: 1.1,
    sunDir: [0.3, 1.0, 0.5],
    rimWarm: 0xb6e08a, rimCool: 0x4ea0c6,
    groundBase: 0x214a1c, groundEdge: 0x081608,
    tilePlayer: 0x3a78b4, tileEnemy: 0xb4533b, tileSeam: 0x9fd45a,
    tileLine: 0x7fce78, tileLineAlpha: 0.30,
    obstacleTint: 0x4a3a22,
  },
  ruins: {
    skyTop: 0x8c7355, skyHorizon: 0xd6b88c, fog: 0x9c8262, fogDensity: 0.022,
    ambient: 0xd6c4a4, ambientIntensity: 0.55,
    sun: 0xfff0c8, sunIntensity: 1.3,
    sunDir: [0.4, 1.0, 0.3],
    rimWarm: 0xffd28a, rimCool: 0x9fb8d2,
    groundBase: 0x6e604a, groundEdge: 0x3a2c1a,
    tilePlayer: 0x4f86b8, tileEnemy: 0xb46a4a, tileSeam: 0xffe39c,
    tileLine: 0xdcc6a2, tileLineAlpha: 0.30,
    obstacleTint: 0xa68f6e,
  },
  tundra: {
    skyTop: 0x86a8cc, skyHorizon: 0xd6e5ef, fog: 0xc6dbeb, fogDensity: 0.030,
    ambient: 0xe3ecf5, ambientIntensity: 0.7,
    sun: 0xeaf5ff, sunIntensity: 1.4,
    sunDir: [0.4, 1.0, 0.6],
    rimWarm: 0xffe7c2, rimCool: 0x9fd0f0,
    groundBase: 0x7c98b8, groundEdge: 0x3a4c66,
    tilePlayer: 0x5fa8d2, tileEnemy: 0xb47979, tileSeam: 0xc8eaff,
    tileLine: 0xeaf5ff, tileLineAlpha: 0.45,
    obstacleTint: 0xcfe4f7,
  },
  inferno: {
    skyTop: 0x4a1610, skyHorizon: 0xb44a22, fog: 0x6c2412, fogDensity: 0.040,
    ambient: 0xff8a5a, ambientIntensity: 0.5,
    sun: 0xffcf6a, sunIntensity: 1.4,
    sunDir: [0.5, 1.0, 0.2],
    rimWarm: 0xff7048, rimCool: 0xa8543a,
    groundBase: 0x6e2a14, groundEdge: 0x2a0a06,
    tilePlayer: 0x5fa4e8, tileEnemy: 0xff6a40, tileSeam: 0xffaf48,
    tileLine: 0xffb47a, tileLineAlpha: 0.35,
    obstacleTint: 0x3a1610,
  },
  shadow: {
    skyTop: 0x2a1844, skyHorizon: 0x6e3a98, fog: 0x331c50, fogDensity: 0.045,
    ambient: 0x6c4ea8, ambientIntensity: 0.45,
    sun: 0xb89bff, sunIntensity: 1.0,
    sunDir: [0.3, 1.0, 0.4],
    rimWarm: 0xc994ff, rimCool: 0x4d6eff,
    groundBase: 0x322a4e, groundEdge: 0x100a22,
    tilePlayer: 0x5070d0, tileEnemy: 0x9d4ad0, tileSeam: 0xb89bff,
    tileLine: 0xc994ff, tileLineAlpha: 0.30,
    obstacleTint: 0x5a3a90,
  },
  celestial: {
    skyTop: 0x5a96d6, skyHorizon: 0xfff2c8, fog: 0xeae0ff, fogDensity: 0.028,
    ambient: 0xfff7d6, ambientIntensity: 0.65,
    sun: 0xfff5b4, sunIntensity: 1.55,
    sunDir: [0.3, 1.0, 0.5],
    rimWarm: 0xfff2a8, rimCool: 0xb6cdfa,
    groundBase: 0xbcb0e6, groundEdge: 0x6a5c9c,
    tilePlayer: 0x6ac6ff, tileEnemy: 0xff9ad6, tileSeam: 0xfff2a8,
    tileLine: 0xffffff, tileLineAlpha: 0.45,
    obstacleTint: 0xeae0ff,
  },
  volcanic: {
    skyTop: 0x2a1610, skyHorizon: 0xb44a22, fog: 0x441a10, fogDensity: 0.050,
    ambient: 0xff6a48, ambientIntensity: 0.45,
    sun: 0xffae5a, sunIntensity: 1.2,
    sunDir: [0.5, 1.0, 0.2],
    rimWarm: 0xff5828, rimCool: 0x6a2a30,
    groundBase: 0x4a201a, groundEdge: 0x1a0a06,
    tilePlayer: 0x5fa4e8, tileEnemy: 0xff5828, tileSeam: 0xffae5a,
    tileLine: 0xff8a48, tileLineAlpha: 0.35,
    obstacleTint: 0x2a1610,
  },
  undead: {
    skyTop: 0x223028, skyHorizon: 0x5e6e58, fog: 0x2a3a30, fogDensity: 0.048,
    ambient: 0x8a9c84, ambientIntensity: 0.45,
    sun: 0xbeebb4, sunIntensity: 0.9,
    sunDir: [0.3, 1.0, 0.5],
    rimWarm: 0xb6cf5a, rimCool: 0x5a7894,
    groundBase: 0x3a4632, groundEdge: 0x101808,
    tilePlayer: 0x5a8aba, tileEnemy: 0x97b04a, tileSeam: 0xc6e9a0,
    tileLine: 0xa6d090, tileLineAlpha: 0.30,
    obstacleTint: 0x5a5a4a,
  },
  siege: {
    skyTop: 0x4a3a2a, skyHorizon: 0xb89072, fog: 0x6a5040, fogDensity: 0.030,
    ambient: 0xd0b890, ambientIntensity: 0.5,
    sun: 0xffd896, sunIntensity: 1.3,
    sunDir: [0.4, 1.0, 0.3],
    rimWarm: 0xffae5a, rimCool: 0x6a7ea0,
    groundBase: 0x6a5440, groundEdge: 0x2a1e14,
    tilePlayer: 0x5a8ad6, tileEnemy: 0xc06a4a, tileSeam: 0xffce7a,
    tileLine: 0xe6c598, tileLineAlpha: 0.30,
    obstacleTint: 0x88685a,
  },
};

export function themeFor(name?: MapTheme): ThreeTheme {
  return THEMES[name ?? 'plains'] ?? THEMES.plains;
}

// Visual blueprint for each obstacle kind. The Battlefield instantiates
// these into primitive meshes (no external models).
export interface ObstacleSpec {
  shape: 'rock' | 'cone' | 'orb' | 'cylinder' | 'column' | 'block' | 'cluster';
  color: number;
  emissive?: number;
  emissiveIntensity?: number;
  scale?: [number, number, number];
}

export const OBSTACLE_SPECS: Record<ObstacleKind, ObstacleSpec> = {
  rock:     { shape: 'rock',     color: 0x7d7d7d, scale: [0.7, 0.6, 0.7] },
  tree:     { shape: 'cone',     color: 0x2a6a36, scale: [0.55, 1.5, 0.55] },
  bush:     { shape: 'cluster',  color: 0x3a8a45, scale: [0.55, 0.5, 0.55] },
  banner:   { shape: 'column',   color: 0x9c2c2c, scale: [0.1, 1.4, 0.1] },
  tower:    { shape: 'column',   color: 0xa68966, scale: [0.5, 1.6, 0.5] },
  fortress: { shape: 'block',    color: 0x9c8068, scale: [1.0, 1.4, 1.0] },
  gate:     { shape: 'block',    color: 0x8a6e54, scale: [1.0, 1.4, 0.4] },
  crystal:  { shape: 'cone',     color: 0xb89bff, emissive: 0x5a36b0, emissiveIntensity: 0.8, scale: [0.45, 1.3, 0.45] },
  icicle:   { shape: 'cone',     color: 0xcfeaff, emissive: 0x6fa4d0, emissiveIntensity: 0.4, scale: [0.4, 1.6, 0.4] },
  skull:    { shape: 'orb',      color: 0xe0d8c8, scale: [0.5, 0.45, 0.5] },
  tomb:     { shape: 'block',    color: 0x686060, scale: [0.55, 0.95, 0.4] },
  fire:     { shape: 'orb',      color: 0xff7a28, emissive: 0xff5828, emissiveIntensity: 1.0, scale: [0.4, 0.5, 0.4] },
  lava:     { shape: 'rock',     color: 0xff5828, emissive: 0xff3010, emissiveIntensity: 0.9, scale: [0.7, 0.25, 0.7] },
  magma:    { shape: 'rock',     color: 0x4a1a10, emissive: 0xff5828, emissiveIntensity: 0.4, scale: [0.7, 0.5, 0.7] },
  pillar:   { shape: 'column',   color: 0xc4a878, scale: [0.35, 1.8, 0.35] },
  altar:    { shape: 'block',    color: 0x7a6450, scale: [0.7, 0.4, 0.7] },
  orb:      { shape: 'orb',      color: 0x9bbcff, emissive: 0x5fa4ff, emissiveIntensity: 1.0, scale: [0.4, 0.4, 0.4] },
  tent:     { shape: 'cone',     color: 0xb46a3a, scale: [0.7, 0.9, 0.7] },
  cauldron: { shape: 'orb',      color: 0x2a2020, emissive: 0xff5a18, emissiveIntensity: 0.6, scale: [0.55, 0.45, 0.55] },
};

// Per-class tint pair (body / trim) used to assemble the procedural
// character. Reads from existing CLASS_COLORS but with explicit dark
// trim so units pop on bright tundra/celestial themes too.
export const CLASS_PALETTE: Record<string, { body: number; trim: number; weapon: number; aura: number }> = {
  Warrior:     { body: 0xc2521a, trim: 0xffd6a5, weapon: 0xb0b8c4, aura: 0xff9a55 },
  Archer:      { body: 0x2a8a4a, trim: 0xcaefb8, weapon: 0xa07a4a, aura: 0x7ddc70 },
  Mage:        { body: 0x5a2eb0, trim: 0xe7c8ff, weapon: 0x6837cc, aura: 0xc994ff },
  Paladin:     { body: 0xd29a1c, trim: 0xfff2c0, weapon: 0xe0e8f0, aura: 0xffe07a },
  Rogue:       { body: 0x3a3f4f, trim: 0xaab3c5, weapon: 0xc0c8d0, aura: 0x9aa7c5 },
  Berserker:   { body: 0xa82820, trim: 0xffb09c, weapon: 0xa07a4a, aura: 0xff6a55 },
  Cleric:      { body: 0xc8a058, trim: 0xfff2c0, weapon: 0xeae0d0, aura: 0xffea9c },
  Druid:       { body: 0x2a9c5a, trim: 0xd3f5b8, weapon: 0x6c4a2a, aura: 0x9ee07a },
  Necromancer: { body: 0x3a1c70, trim: 0xcbb0ff, weapon: 0x6a3a96, aura: 0xa47fff },
  Monk:        { body: 0xb06f1a, trim: 0xffe9c0, weapon: 0xeae0d0, aura: 0xffd07a },
};

export function classPalette(heroClass: string) {
  return CLASS_PALETTE[heroClass] ?? CLASS_PALETTE.Warrior;
}

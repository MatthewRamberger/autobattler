// Per-MapTheme palette for the 2.5D battlefield. Each theme drives:
//   - sky gradient (top → horizon) drawn behind the tilted ground
//   - ground gradient (back → front)
//   - hex tile fill / edge / rim colors per side
//   - contested seam glow
//   - obstacle prop colors

import { MapTheme, ObstacleKind } from '../types';

export interface GameTheme {
  skyTop: string;
  skyHorizon: string;
  groundBack: string;
  groundFront: string;
  tilePlayer: readonly [string, string, string];
  tileEnemy: readonly [string, string, string];
  tileSeam: readonly [string, string, string];
  tileRim: string;
  tileEdge: string;
  seamGlow: string;
  rimWarm: string;
  rimCool: string;
  haze: string | null;
  obstacle: string;
}

const THEMES: Record<MapTheme, GameTheme> = {
  plains: {
    skyTop: '#6892c6', skyHorizon: '#c9d8e3',
    groundBack: '#3c5824', groundFront: '#1d2b11',
    tilePlayer: ['#7fb1d8', '#4a83b6', '#2a5478'],
    tileEnemy:  ['#e08778', '#b74a45', '#7a2a26'],
    tileSeam:   ['#fff5c0', '#efc25a', '#a07a18'],
    tileRim: '#c6d6a0', tileEdge: '#1a2410',
    seamGlow: '#ffd86a', rimWarm: '#ffc77a', rimCool: '#6fa9e8',
    haze: null, obstacle: '#b6a071',
  },
  forest: {
    skyTop: '#274038', skyHorizon: '#4d6e5e',
    groundBack: '#214a1c', groundFront: '#0a1d09',
    tilePlayer: ['#6fb6e6', '#3a78b4', '#1d4470'],
    tileEnemy:  ['#e07a62', '#b4533b', '#762a1c'],
    tileSeam:   ['#d5f0a0', '#9fd45a', '#5a8a2a'],
    tileRim: '#7fce78', tileEdge: '#081608',
    seamGlow: '#bef07a', rimWarm: '#b6e08a', rimCool: '#4ea0c6',
    haze: '#0a1f1255', obstacle: '#4a3a22',
  },
  ruins: {
    skyTop: '#8c7355', skyHorizon: '#d6b88c',
    groundBack: '#6e604a', groundFront: '#3a2c1a',
    tilePlayer: ['#85b8e6', '#4f86b8', '#27506e'],
    tileEnemy:  ['#e09578', '#b46a4a', '#6c3a22'],
    tileSeam:   ['#ffefb8', '#ffe39c', '#a87a14'],
    tileRim: '#dcc6a2', tileEdge: '#1c140c',
    seamGlow: '#ffe39c', rimWarm: '#ffd28a', rimCool: '#9fb8d2',
    haze: null, obstacle: '#a68f6e',
  },
  tundra: {
    skyTop: '#86a8cc', skyHorizon: '#d6e5ef',
    groundBack: '#7c98b8', groundFront: '#3a4c66',
    tilePlayer: ['#9fd6f2', '#5fa8d2', '#2f6a96'],
    tileEnemy:  ['#e0a8a8', '#b47979', '#6c3a3a'],
    tileSeam:   ['#e0f4ff', '#c8eaff', '#7fb8d6'],
    tileRim: '#eaf5ff', tileEdge: '#2a3d56',
    seamGlow: '#cdeaff', rimWarm: '#ffe7c2', rimCool: '#9fd0f0',
    haze: '#cfe4f733', obstacle: '#cfe4f7',
  },
  inferno: {
    skyTop: '#4a1610', skyHorizon: '#b44a22',
    groundBack: '#6e2a14', groundFront: '#2a0a06',
    tilePlayer: ['#9bd4ff', '#5fa4e8', '#2c5e94'],
    tileEnemy:  ['#ffa07c', '#ff6a40', '#a83a1a'],
    tileSeam:   ['#ffd198', '#ffaf48', '#a06a14'],
    tileRim: '#ffb47a', tileEdge: '#2a0a06',
    seamGlow: '#ffae5a', rimWarm: '#ff7048', rimCool: '#a8543a',
    haze: '#6c241255', obstacle: '#3a1610',
  },
  shadow: {
    skyTop: '#2a1844', skyHorizon: '#6e3a98',
    groundBack: '#322a4e', groundFront: '#100a22',
    tilePlayer: ['#8fa6e6', '#5070d0', '#283a76'],
    tileEnemy:  ['#c87fe6', '#9d4ad0', '#5c2278'],
    tileSeam:   ['#d4c2ff', '#b89bff', '#6a4ea8'],
    tileRim: '#c994ff', tileEdge: '#0c0420',
    seamGlow: '#b89bff', rimWarm: '#c994ff', rimCool: '#4d6eff',
    haze: '#331c5066', obstacle: '#5a3a90',
  },
  celestial: {
    skyTop: '#5a96d6', skyHorizon: '#fff2c8',
    groundBack: '#bcb0e6', groundFront: '#6a5c9c',
    tilePlayer: ['#aae0ff', '#6ac6ff', '#2f78b8'],
    tileEnemy:  ['#ffc4dc', '#ff9ad6', '#a85890'],
    tileSeam:   ['#fffce0', '#fff2a8', '#a89a4a'],
    tileRim: '#ffffff', tileEdge: '#5a4a8a',
    seamGlow: '#fff2a8', rimWarm: '#fff2a8', rimCool: '#b6cdfa',
    haze: '#eae0ff44', obstacle: '#eae0ff',
  },
  volcanic: {
    skyTop: '#2a1610', skyHorizon: '#b44a22',
    groundBack: '#4a201a', groundFront: '#1a0a06',
    tilePlayer: ['#9bd4ff', '#5fa4e8', '#2c5e94'],
    tileEnemy:  ['#ff9272', '#ff5828', '#a02a10'],
    tileSeam:   ['#ffd698', '#ffae5a', '#a06a14'],
    tileRim: '#ff8a48', tileEdge: '#1a0a06',
    seamGlow: '#ffae5a', rimWarm: '#ff5828', rimCool: '#6a2a30',
    haze: '#441a1066', obstacle: '#2a1610',
  },
  undead: {
    skyTop: '#223028', skyHorizon: '#5e6e58',
    groundBack: '#3a4632', groundFront: '#101808',
    tilePlayer: ['#8fb4d6', '#5a8aba', '#2c4a72'],
    tileEnemy:  ['#c2d076', '#97b04a', '#5a6e1a'],
    tileSeam:   ['#dceeb8', '#c6e9a0', '#7a9c4a'],
    tileRim: '#a6d090', tileEdge: '#101808',
    seamGlow: '#beebb4', rimWarm: '#b6cf5a', rimCool: '#5a7894',
    haze: '#2a3a3055', obstacle: '#5a5a4a',
  },
  siege: {
    skyTop: '#4a3a2a', skyHorizon: '#b89072',
    groundBack: '#6a5440', groundFront: '#2a1e14',
    tilePlayer: ['#92baf2', '#5a8ad6', '#2c5896'],
    tileEnemy:  ['#e69472', '#c06a4a', '#7a3a22'],
    tileSeam:   ['#ffdca0', '#ffce7a', '#a06a14'],
    tileRim: '#e6c598', tileEdge: '#2a1e14',
    seamGlow: '#ffce7a', rimWarm: '#ffae5a', rimCool: '#6a7ea0',
    haze: null, obstacle: '#88685a',
  },
};

export function themeFor(name?: MapTheme): GameTheme {
  return THEMES[name ?? 'plains'] ?? THEMES.plains;
}

// Per-class palette used when assembling the procedural character.
// All entries are RN color strings.
export interface ClassPalette {
  body: string; bodyDark: string;
  trim: string; trimDark: string;
  weapon: string; weaponDark: string;
  aura: string; accent: string;
  shoulder: string;
  glyph: string;
}

export const CLASS_PALETTE: Record<string, ClassPalette> = {
  Warrior:     { body: '#c2521a', bodyDark: '#7a3010', trim: '#ffd6a5', trimDark: '#a85c1a', weapon: '#cdd4dc', weaponDark: '#5a6068', aura: '#ff9a55', accent: '#ffb066', shoulder: '#3a1a06', glyph: '⚔' },
  Archer:      { body: '#2a8a4a', bodyDark: '#0a2a14', trim: '#caefb8', trimDark: '#27735a', weapon: '#a07a4a', weaponDark: '#5a3a22', aura: '#7ddc70', accent: '#7ddc70', shoulder: '#0a2a14', glyph: '🏹' },
  Mage:        { body: '#5a2eb0', bodyDark: '#28145a', trim: '#e7c8ff', trimDark: '#6837cc', weapon: '#6837cc', weaponDark: '#28145a', aura: '#c994ff', accent: '#c994ff', shoulder: '#1a0a3a', glyph: '🔮' },
  Paladin:     { body: '#d29a1c', bodyDark: '#6c4a0a', trim: '#fff2c0', trimDark: '#a87a14', weapon: '#e0e8f0', weaponDark: '#7a808a', aura: '#ffe07a', accent: '#ffd24a', shoulder: '#3a2e0c', glyph: '✠' },
  Rogue:       { body: '#3a3f4f', bodyDark: '#16181f', trim: '#aab3c5', trimDark: '#3a3f4f', weapon: '#c0c8d0', weaponDark: '#5a6068', aura: '#9aa7c5', accent: '#9aa7c5', shoulder: '#0a0c14', glyph: '🗡' },
  Berserker:   { body: '#a82820', bodyDark: '#48100a', trim: '#ffb09c', trimDark: '#a82820', weapon: '#a07a4a', weaponDark: '#5a3a22', aura: '#ff6a55', accent: '#ff6a55', shoulder: '#3a0a06', glyph: '🪓' },
  Cleric:      { body: '#c8a058', bodyDark: '#6c5028', trim: '#fff2c0', trimDark: '#c8a058', weapon: '#eae0d0', weaponDark: '#8a7a5a', aura: '#ffea9c', accent: '#ffea9c', shoulder: '#5a3c08', glyph: '✚' },
  Druid:       { body: '#2a9c5a', bodyDark: '#0a3a1a', trim: '#d3f5b8', trimDark: '#2a9c5a', weapon: '#6c4a2a', weaponDark: '#3a2812', aura: '#9ee07a', accent: '#9ee07a', shoulder: '#0a3a1a', glyph: '🌿' },
  Necromancer: { body: '#3a1c70', bodyDark: '#180a32', trim: '#cbb0ff', trimDark: '#3a1c70', weapon: '#6a3a96', weaponDark: '#28145a', aura: '#a47fff', accent: '#a47fff', shoulder: '#0c0420', glyph: '☠' },
  Monk:        { body: '#b06f1a', bodyDark: '#5a3808', trim: '#ffe9c0', trimDark: '#b06f1a', weapon: '#eae0d0', weaponDark: '#8a7a5a', aura: '#ffd07a', accent: '#ffd07a', shoulder: '#3a2208', glyph: '👊' },
};

export function classPalette(heroClass: string): ClassPalette {
  return CLASS_PALETTE[heroClass] ?? CLASS_PALETTE.Warrior;
}

// Element → projectile/glow color
export const ELEMENT_COLOR: Record<string, string> = {
  physical: '#fff7c2',
  fire: '#ff7a18',
  ice: '#b8e6ff',
  lightning: '#fff2a8',
  holy: '#fff5b4',
  shadow: '#b89bff',
  nature: '#bef07a',
};

export const ELEMENT_TRAIL: Record<string, string> = {
  physical: '#9a9a9a',
  fire: '#cf3623',
  ice: '#3da4ff',
  lightning: '#f1c40f',
  holy: '#f4c542',
  shadow: '#5a2eb0',
  nature: '#27ae60',
};

// Obstacle visual: emoji + color tint. Rendered as a layered View.
export interface ObstacleVisual { icon: string; tint: string; scale: number; }

export const OBSTACLE_VISUAL: Record<ObstacleKind, ObstacleVisual> = {
  rock:     { icon: '🪨', tint: '#7d7d7d', scale: 1.0 },
  tree:     { icon: '🌲', tint: '#2a6a36', scale: 1.1 },
  bush:     { icon: '🌿', tint: '#3a8a45', scale: 0.9 },
  banner:   { icon: '🚩', tint: '#9c2c2c', scale: 1.0 },
  tower:    { icon: '🗼', tint: '#a68966', scale: 1.0 },
  fortress: { icon: '🏰', tint: '#9c8068', scale: 1.1 },
  gate:     { icon: '🚪', tint: '#8a6e54', scale: 1.0 },
  crystal:  { icon: '💎', tint: '#b89bff', scale: 1.0 },
  icicle:   { icon: '🧊', tint: '#cfeaff', scale: 0.95 },
  skull:    { icon: '💀', tint: '#e0d8c8', scale: 0.9 },
  tomb:     { icon: '🪦', tint: '#686060', scale: 1.0 },
  fire:     { icon: '🔥', tint: '#ff7a28', scale: 1.0 },
  lava:     { icon: '🌋', tint: '#ff5828', scale: 1.0 },
  magma:    { icon: '🪨', tint: '#ff5828', scale: 1.0 },
  pillar:   { icon: '🏛', tint: '#c4a878', scale: 1.0 },
  altar:    { icon: '⛩', tint: '#7a6450', scale: 1.0 },
  orb:      { icon: '🔮', tint: '#9bbcff', scale: 0.9 },
  tent:     { icon: '⛺', tint: '#b46a3a', scale: 1.0 },
  cauldron: { icon: '🫕', tint: '#2a2020', scale: 0.9 },
};

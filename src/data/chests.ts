import { Difficulty, Rarity } from '../types';

// Chest tiers. Every chest source (battle victory, arena clear, daily quest
// claim, achievement claim, shop purchase) routes through this same set so
// the open-the-chest UX is consistent everywhere.
export type ChestKind = 'wooden' | 'silver' | 'gold' | 'mythic';

export interface ChestTheme {
  id: ChestKind;
  name: string;
  icon: string;
  wood: readonly [string, string, string];
  metal: string;
  glow: string;
  variant: 'gold' | 'blue' | 'purple';
}

export const CHEST_THEMES: Record<ChestKind, ChestTheme> = {
  wooden: {
    id: 'wooden', name: 'Wooden Chest', icon: '📦',
    wood: ['#b07a44', '#7a4a22', '#3e2410'], metal: '#8a7450', glow: '#d0a868',
    variant: 'gold',
  },
  silver: {
    id: 'silver', name: 'Silver Chest', icon: '🎁',
    wood: ['#aab6c6', '#6e7c8c', '#3a4452'], metal: '#d2dce8', glow: '#bcd4ee',
    variant: 'blue',
  },
  gold: {
    id: 'gold', name: 'Golden Chest', icon: '🏆',
    wood: ['#f2cc66', '#cc9c2c', '#7a5810'], metal: '#ffe9a4', glow: '#ffd24a',
    variant: 'gold',
  },
  mythic: {
    id: 'mythic', name: 'Mythic Chest', icon: '💠',
    wood: ['#b483ea', '#7a3fd0', '#3a1c70'], metal: '#dcc0ff', glow: '#c79bff',
    variant: 'purple',
  },
};

// Drop tables. Each chest can drop ANY of gold / gems / hero cards / item
// cards but none are guaranteed individually — only gold is "usually" in.
// Rarer heroes & items are deliberately rarer via the rarity weights.
export interface ChestConfig {
  gold: { min: number; max: number; chance: number };
  gems: { min: number; max: number; chance: number };
  heroCards: { rolls: number; chance: number; rarityWeights: Partial<Record<Rarity, number>> };
  items:     { rolls: number; chance: number; rarityWeights: Partial<Record<Rarity, number>> };
}

export const CHEST_CONFIGS: Record<ChestKind, ChestConfig> = {
  wooden: {
    gold: { min: 60, max: 160, chance: 0.95 },
    gems: { min: 1, max: 3, chance: 0.12 },
    heroCards: { rolls: 1, chance: 0.45, rarityWeights: { common: 70, rare: 25, epic: 4, legendary: 1 } },
    items:     { rolls: 1, chance: 0.72, rarityWeights: { common: 65, rare: 28, epic: 6, legendary: 1 } },
  },
  silver: {
    gold: { min: 160, max: 380, chance: 0.95 },
    gems: { min: 2, max: 6, chance: 0.30 },
    heroCards: { rolls: 2, chance: 0.65, rarityWeights: { common: 40, rare: 40, epic: 16, legendary: 4 } },
    items:     { rolls: 2, chance: 0.82, rarityWeights: { common: 30, rare: 45, epic: 20, legendary: 5 } },
  },
  gold: {
    gold: { min: 350, max: 800, chance: 0.95 },
    gems: { min: 5, max: 15, chance: 0.55 },
    heroCards: { rolls: 3, chance: 0.78, rarityWeights: { common: 15, rare: 35, epic: 35, legendary: 12, mythic: 3 } },
    items:     { rolls: 3, chance: 0.86, rarityWeights: { common: 10, rare: 30, epic: 40, legendary: 17, mythic: 3 } },
  },
  mythic: {
    gold: { min: 800, max: 1800, chance: 0.95 },
    gems: { min: 15, max: 40, chance: 0.80 },
    heroCards: { rolls: 4, chance: 0.92, rarityWeights: { rare: 15, epic: 35, legendary: 35, mythic: 15 } },
    items:     { rolls: 4, chance: 0.90, rarityWeights: { rare: 10, epic: 35, legendary: 40, mythic: 15 } },
  },
};

// Battle victory chest = level difficulty.
export function chestForDifficulty(d: Difficulty): ChestKind {
  switch (d) {
    case 'easy': return 'wooden';
    case 'medium': return 'silver';
    case 'hard': return 'gold';
    case 'boss': return 'gold';
    case 'nightmare': return 'mythic';
  }
}

// Arena chest scales by wave milestone.
export function chestForArenaWave(wave: number): ChestKind {
  if (wave < 6) return 'wooden';
  if (wave < 16) return 'silver';
  if (wave < 30) return 'gold';
  return 'mythic';
}

// Shop purchase prices (kept here so the shop screen and ChestScreen can
// stay in sync).
export const CHEST_SHOP_COST: Record<ChestKind, { gold?: number; gems?: number }> = {
  wooden: { gold: 200 },
  silver: { gold: 800 },
  gold:   { gems: 30 },
  mythic: { gems: 100 },
};

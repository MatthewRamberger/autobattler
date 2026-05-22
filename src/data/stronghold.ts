export interface StrongholdBuilding {
  id: string;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  // Cost for next level: gold and gems.
  costFor: (level: number) => { gold: number; gems?: number };
  // Returns the live effect for the given level.
  effect: (level: number) => string;
}

export const STRONGHOLD_BUILDINGS: StrongholdBuilding[] = [
  {
    id: 'bank', name: 'Bank', icon: '🏦',
    description: 'Increases gold gained from battles.',
    maxLevel: 10,
    costFor: (lvl) => ({ gold: 300 + lvl * 250 }),
    effect: (lvl) => `+${lvl * 5}% battle gold`,
  },
  {
    id: 'library', name: 'Library', icon: '📚',
    description: 'Increases EXP gained from battles.',
    maxLevel: 10,
    costFor: (lvl) => ({ gold: 300 + lvl * 250 }),
    effect: (lvl) => `+${lvl * 5}% battle EXP`,
  },
  {
    id: 'arsenal', name: 'Arsenal', icon: '⚒️',
    description: 'Boosts equipment drop chance from battles.',
    maxLevel: 10,
    costFor: (lvl) => ({ gold: 400 + lvl * 300, gems: lvl >= 5 ? 5 : 0 }),
    effect: (lvl) => `+${lvl * 4}% extra gear drop chance`,
  },
  {
    id: 'sanctum', name: 'Sanctum', icon: '🕯️',
    description: 'Heroes start battles with bonus mana.',
    maxLevel: 10,
    costFor: (lvl) => ({ gold: 500 + lvl * 350, gems: lvl >= 5 ? 10 : 0 }),
    effect: (lvl) => `+${lvl * 8} starting mana`,
  },
];

export function strongholdGoldMultiplier(levels: Record<string, number>): number {
  return 1 + 0.05 * (levels['bank'] ?? 0);
}
export function strongholdExpMultiplier(levels: Record<string, number>): number {
  return 1 + 0.05 * (levels['library'] ?? 0);
}
export function strongholdGearDropBonus(levels: Record<string, number>): number {
  return 0.04 * (levels['arsenal'] ?? 0);
}
export function strongholdStartingMana(levels: Record<string, number>): number {
  return (levels['sanctum'] ?? 0) * 8;
}

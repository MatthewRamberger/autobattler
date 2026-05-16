// Per-hero milestone bonuses unlocked by accumulated kills and battles.
// Bonuses are flat stat additions applied in getHeroEffectiveStats.

export interface MilestoneTier {
  threshold: number;
  attackBonus?: number;
  hpBonus?: number;
  defenseBonus?: number;
  critRateBonus?: number;
}

export const KILL_MILESTONES: MilestoneTier[] = [
  { threshold: 10, attackBonus: 5 },
  { threshold: 50, attackBonus: 10 },
  { threshold: 200, attackBonus: 20, critRateBonus: 0.02 },
  { threshold: 1000, attackBonus: 50, critRateBonus: 0.05 },
];

export const BATTLE_MILESTONES: MilestoneTier[] = [
  { threshold: 5, hpBonus: 10 },
  { threshold: 25, hpBonus: 30, defenseBonus: 2 },
  { threshold: 100, hpBonus: 80, defenseBonus: 5 },
  { threshold: 500, hpBonus: 200, defenseBonus: 15 },
];

export function computeMilestoneBonuses(kills: number, battles: number) {
  let attack = 0, hp = 0, defense = 0, critRate = 0;
  for (const tier of KILL_MILESTONES) {
    if (kills >= tier.threshold) {
      attack += tier.attackBonus ?? 0;
      critRate += tier.critRateBonus ?? 0;
    }
  }
  for (const tier of BATTLE_MILESTONES) {
    if (battles >= tier.threshold) {
      hp += tier.hpBonus ?? 0;
      defense += tier.defenseBonus ?? 0;
    }
  }
  return { attack, hp, defense, critRate };
}

export function nextKillMilestone(kills: number): MilestoneTier | null {
  return KILL_MILESTONES.find((m) => kills < m.threshold) ?? null;
}
export function nextBattleMilestone(battles: number): MilestoneTier | null {
  return BATTLE_MILESTONES.find((m) => battles < m.threshold) ?? null;
}

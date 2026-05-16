import { HeroClass, HeroStats } from '../types';

export interface Talent {
  id: string;
  name: string;
  description: string;
  // Flat stat additions applied in getHeroEffectiveStats.
  // For percent stats (critRate, dodge, critDamage) use decimals like 0.05.
  bonus?: Partial<Pick<HeroStats, 'maxHp' | 'attack' | 'defense' | 'speed' | 'critRate' | 'critDamage' | 'dodge' | 'maxMana' | 'manaRegen'>>;
  // Percentage multipliers (multiplied: 1 + value) applied after flat bonuses.
  multipliers?: Partial<Pick<HeroStats, 'maxHp' | 'attack' | 'defense' | 'speed'>>;
}

/**
 * Talent picks: at hero level 5/10/15/20 the player chooses between
 * 2 options per tier. Index of the picked talent stored in Hero.talentChoices.
 */
export const TALENT_UNLOCK_LEVELS = [5, 10, 15, 20];

// Each class has 4 tiers, each tier has 2 options.
export const TALENTS: Record<HeroClass, Talent[][]> = {
  Warrior: [
    [
      { id: 'w_t1_a', name: 'Ironhide', description: '+25% defense.', multipliers: { defense: 0.25 } },
      { id: 'w_t1_b', name: 'Battle Rage', description: '+15% attack.', multipliers: { attack: 0.15 } },
    ],
    [
      { id: 'w_t2_a', name: 'Thick Skull', description: '+15% maxHP.', multipliers: { maxHp: 0.15 } },
      { id: 'w_t2_b', name: 'Sharp Eye', description: '+8% crit rate.', bonus: { critRate: 0.08 } },
    ],
    [
      { id: 'w_t3_a', name: 'Reckless Charge', description: '+1 speed, +10% attack.', bonus: { speed: 1 }, multipliers: { attack: 0.10 } },
      { id: 'w_t3_b', name: 'Bulwark', description: '+25% defense, -1 speed.', bonus: { speed: -1 }, multipliers: { defense: 0.25 } },
    ],
    [
      { id: 'w_t4_a', name: 'Unbreakable', description: '+25% maxHP, +15% defense.', multipliers: { maxHp: 0.25, defense: 0.15 } },
      { id: 'w_t4_b', name: 'Champion', description: '+25% attack, +5% crit damage.', multipliers: { attack: 0.25 }, bonus: { critDamage: 0.05 } },
    ],
  ],
  Archer: [
    [
      { id: 'a_t1_a', name: 'Steady Hand', description: '+10% crit rate.', bonus: { critRate: 0.10 } },
      { id: 'a_t1_b', name: 'Fleet Foot', description: '+1 speed, +10% dodge.', bonus: { speed: 1, dodge: 0.10 } },
    ],
    [
      { id: 'a_t2_a', name: 'Marksman', description: '+15% attack.', multipliers: { attack: 0.15 } },
      { id: 'a_t2_b', name: 'Hawkeye', description: '+0.3 crit damage.', bonus: { critDamage: 0.3 } },
    ],
    [
      { id: 'a_t3_a', name: 'Lethal Shot', description: '+10% attack, +5% crit.', multipliers: { attack: 0.10 }, bonus: { critRate: 0.05 } },
      { id: 'a_t3_b', name: 'Evasion', description: '+15% dodge.', bonus: { dodge: 0.15 } },
    ],
    [
      { id: 'a_t4_a', name: 'Death Mark', description: '+30% attack vs single target.', multipliers: { attack: 0.30 } },
      { id: 'a_t4_b', name: 'Rapid Fire', description: '+2 speed, +10% attack.', bonus: { speed: 2 }, multipliers: { attack: 0.10 } },
    ],
  ],
  Mage: [
    [
      { id: 'm_t1_a', name: 'Arcane Mind', description: '+40 max mana, +2 regen.', bonus: { maxMana: 40, manaRegen: 2 } },
      { id: 'm_t1_b', name: 'Elemental Force', description: '+15% attack.', multipliers: { attack: 0.15 } },
    ],
    [
      { id: 'm_t2_a', name: 'Spell Crit', description: '+10% crit rate.', bonus: { critRate: 0.10 } },
      { id: 'm_t2_b', name: 'Mage Armor', description: '+30% maxHP.', multipliers: { maxHp: 0.30 } },
    ],
    [
      { id: 'm_t3_a', name: 'Overcast', description: '+30% attack, -10% maxHP.', multipliers: { attack: 0.30, maxHp: -0.10 } },
      { id: 'm_t3_b', name: 'Mana Pool', description: '+60 max mana, +3 regen.', bonus: { maxMana: 60, manaRegen: 3 } },
    ],
    [
      { id: 'm_t4_a', name: 'Archmage', description: '+25% attack, +25% mana regen.', multipliers: { attack: 0.25 }, bonus: { manaRegen: 4 } },
      { id: 'm_t4_b', name: 'Annihilation', description: '+50% crit damage.', bonus: { critDamage: 0.5 } },
    ],
  ],
  Paladin: [
    [
      { id: 'p_t1_a', name: 'Aegis', description: '+20% defense.', multipliers: { defense: 0.20 } },
      { id: 'p_t1_b', name: "Sun's Gift", description: '+25% maxHP.', multipliers: { maxHp: 0.25 } },
    ],
    [
      { id: 'p_t2_a', name: 'Devotion', description: '+50 max mana, +3 regen.', bonus: { maxMana: 50, manaRegen: 3 } },
      { id: 'p_t2_b', name: 'Smite', description: '+15% attack.', multipliers: { attack: 0.15 } },
    ],
    [
      { id: 'p_t3_a', name: 'Steadfast', description: '+15% defense, +15% maxHP.', multipliers: { defense: 0.15, maxHp: 0.15 } },
      { id: 'p_t3_b', name: 'Crusader', description: '+25% attack, -1 speed.', bonus: { speed: -1 }, multipliers: { attack: 0.25 } },
    ],
    [
      { id: 'p_t4_a', name: 'Guardian', description: '+20% defense, +20% maxHP.', multipliers: { defense: 0.20, maxHp: 0.20 } },
      { id: 'p_t4_b', name: 'Vengeance', description: '+30% attack, +0.2 crit damage.', multipliers: { attack: 0.30 }, bonus: { critDamage: 0.2 } },
    ],
  ],
  Rogue: [
    [
      { id: 'r_t1_a', name: 'Cunning', description: '+15% crit rate.', bonus: { critRate: 0.15 } },
      { id: 'r_t1_b', name: 'Nimble', description: '+15% dodge.', bonus: { dodge: 0.15 } },
    ],
    [
      { id: 'r_t2_a', name: 'Vital Strike', description: '+0.3 crit damage.', bonus: { critDamage: 0.3 } },
      { id: 'r_t2_b', name: 'Sprint', description: '+2 speed.', bonus: { speed: 2 } },
    ],
    [
      { id: 'r_t3_a', name: 'Deadly Poison', description: '+20% attack.', multipliers: { attack: 0.20 } },
      { id: 'r_t3_b', name: 'Phantom', description: '+20% dodge, +1 speed.', bonus: { dodge: 0.20, speed: 1 } },
    ],
    [
      { id: 'r_t4_a', name: 'Assassinate', description: '+25% attack, +10% crit rate.', multipliers: { attack: 0.25 }, bonus: { critRate: 0.10 } },
      { id: 'r_t4_b', name: 'Ghostwalk', description: '+25% dodge, +20% maxHP.', bonus: { dodge: 0.25 }, multipliers: { maxHp: 0.20 } },
    ],
  ],
  Berserker: [
    [
      { id: 'b_t1_a', name: 'Frenzy', description: '+20% attack.', multipliers: { attack: 0.20 } },
      { id: 'b_t1_b', name: 'Tough', description: '+25% maxHP.', multipliers: { maxHp: 0.25 } },
    ],
    [
      { id: 'b_t2_a', name: 'Bloodthirst', description: '+0.3 crit damage.', bonus: { critDamage: 0.3 } },
      { id: 'b_t2_b', name: 'Iron Stomach', description: '+30% maxHP.', multipliers: { maxHp: 0.30 } },
    ],
    [
      { id: 'b_t3_a', name: 'Wild Swings', description: '+15% attack, +5% crit.', multipliers: { attack: 0.15 }, bonus: { critRate: 0.05 } },
      { id: 'b_t3_b', name: 'Pain Tolerance', description: '+15% defense.', multipliers: { defense: 0.15 } },
    ],
    [
      { id: 'b_t4_a', name: 'Carnage', description: '+30% attack, +0.2 crit damage.', multipliers: { attack: 0.30 }, bonus: { critDamage: 0.2 } },
      { id: 'b_t4_b', name: 'Undying', description: '+40% maxHP, +10% defense.', multipliers: { maxHp: 0.40, defense: 0.10 } },
    ],
  ],
  Cleric: [
    [
      { id: 'c_t1_a', name: 'Prayer', description: '+40 max mana, +3 regen.', bonus: { maxMana: 40, manaRegen: 3 } },
      { id: 'c_t1_b', name: 'Faith', description: '+25% maxHP.', multipliers: { maxHp: 0.25 } },
    ],
    [
      { id: 'c_t2_a', name: 'Divine Power', description: '+20% attack.', multipliers: { attack: 0.20 } },
      { id: 'c_t2_b', name: 'Sanctuary', description: '+20% defense.', multipliers: { defense: 0.20 } },
    ],
    [
      { id: 'c_t3_a', name: 'Inspiration', description: '+5 mana regen.', bonus: { manaRegen: 5 } },
      { id: 'c_t3_b', name: "Saint's Grace", description: '+25% maxHP, +15% defense.', multipliers: { maxHp: 0.25, defense: 0.15 } },
    ],
    [
      { id: 'c_t4_a', name: 'High Priest', description: '+30% attack, +30% mana regen.', multipliers: { attack: 0.30 }, bonus: { manaRegen: 5 } },
      { id: 'c_t4_b', name: 'Beacon', description: '+30% maxHP, +20% defense.', multipliers: { maxHp: 0.30, defense: 0.20 } },
    ],
  ],
  Druid: [
    [
      { id: 'd_t1_a', name: 'Wild Heart', description: '+20% maxHP.', multipliers: { maxHp: 0.20 } },
      { id: 'd_t1_b', name: 'Thornskin', description: '+15% defense.', multipliers: { defense: 0.15 } },
    ],
    [
      { id: 'd_t2_a', name: 'Feral Strike', description: '+15% attack.', multipliers: { attack: 0.15 } },
      { id: 'd_t2_b', name: 'Nature Tongue', description: '+40 max mana, +2 regen.', bonus: { maxMana: 40, manaRegen: 2 } },
    ],
    [
      { id: 'd_t3_a', name: 'Pack Leader', description: '+1 speed, +10% attack.', bonus: { speed: 1 }, multipliers: { attack: 0.10 } },
      { id: 'd_t3_b', name: 'Ancient Bark', description: '+30% maxHP.', multipliers: { maxHp: 0.30 } },
    ],
    [
      { id: 'd_t4_a', name: 'Avatar of the Forest', description: '+30% attack, +20% maxHP.', multipliers: { attack: 0.30, maxHp: 0.20 } },
      { id: 'd_t4_b', name: 'Guardian Wisp', description: '+30% defense, +10% dodge.', multipliers: { defense: 0.30 }, bonus: { dodge: 0.10 } },
    ],
  ],
  Necromancer: [
    [
      { id: 'n_t1_a', name: 'Dark Pact', description: '+20% attack, -10% maxHP.', multipliers: { attack: 0.20, maxHp: -0.10 } },
      { id: 'n_t1_b', name: 'Spectral Wards', description: '+15% maxHP, +1 mana regen.', multipliers: { maxHp: 0.15 }, bonus: { manaRegen: 1 } },
    ],
    [
      { id: 'n_t2_a', name: 'Soul Burn', description: '+15% attack.', multipliers: { attack: 0.15 } },
      { id: 'n_t2_b', name: 'Dread Aura', description: '+15% defense.', multipliers: { defense: 0.15 } },
    ],
    [
      { id: 'n_t3_a', name: 'Reaper', description: '+25% attack, +5% crit.', multipliers: { attack: 0.25 }, bonus: { critRate: 0.05 } },
      { id: 'n_t3_b', name: 'Necromantic Bond', description: '+25% maxHP.', multipliers: { maxHp: 0.25 } },
    ],
    [
      { id: 'n_t4_a', name: 'Death Sovereign', description: '+35% attack, +0.3 crit damage.', multipliers: { attack: 0.35 }, bonus: { critDamage: 0.3 } },
      { id: 'n_t4_b', name: 'Lichform', description: '+30% maxHP, +20% defense.', multipliers: { maxHp: 0.30, defense: 0.20 } },
    ],
  ],
  Monk: [
    [
      { id: 'mk_t1_a', name: 'Inner Focus', description: '+10% crit rate.', bonus: { critRate: 0.10 } },
      { id: 'mk_t1_b', name: 'Swift', description: '+1 speed, +10% dodge.', bonus: { speed: 1, dodge: 0.10 } },
    ],
    [
      { id: 'mk_t2_a', name: 'Iron Body', description: '+20% maxHP.', multipliers: { maxHp: 0.20 } },
      { id: 'mk_t2_b', name: 'Fierce Strike', description: '+15% attack.', multipliers: { attack: 0.15 } },
    ],
    [
      { id: 'mk_t3_a', name: 'Wind Walk', description: '+20% dodge, +1 speed.', bonus: { dodge: 0.20, speed: 1 } },
      { id: 'mk_t3_b', name: 'Blade Hand', description: '+15% attack, +0.2 crit damage.', multipliers: { attack: 0.15 }, bonus: { critDamage: 0.2 } },
    ],
    [
      { id: 'mk_t4_a', name: 'Grandmaster', description: '+25% attack, +15% crit rate.', multipliers: { attack: 0.25 }, bonus: { critRate: 0.15 } },
      { id: 'mk_t4_b', name: 'Mountain Stance', description: '+30% maxHP, +20% defense.', multipliers: { maxHp: 0.30, defense: 0.20 } },
    ],
  ],
};

export function availableTalentTier(level: number): number {
  // Return how many tiers are unlocked (0..4).
  let unlocked = 0;
  for (const req of TALENT_UNLOCK_LEVELS) {
    if (level >= req) unlocked++;
  }
  return unlocked;
}

export function applyTalentBonuses(
  heroClass: HeroClass,
  choices: number[] | undefined,
  level: number,
  stats: HeroStats,
): HeroStats {
  if (!choices) return stats;
  const tiers = TALENTS[heroClass] ?? [];
  const unlocked = availableTalentTier(level);
  const out: any = { ...stats };
  for (let tier = 0; tier < unlocked; tier++) {
    const choice = choices[tier];
    if (choice == null || choice < 0) continue;
    const talent = tiers[tier]?.[choice];
    if (!talent) continue;
    // Flat bonuses
    if (talent.bonus) {
      for (const [k, v] of Object.entries(talent.bonus)) {
        out[k] = (out[k] ?? 0) + (v as number);
      }
    }
    // Multipliers
    if (talent.multipliers) {
      for (const [k, v] of Object.entries(talent.multipliers)) {
        out[k] = Math.round((out[k] ?? 0) * (1 + (v as number)));
      }
    }
  }
  return out;
}

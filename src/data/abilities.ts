import { AbilityDef } from '../types';

export const ABILITIES: Record<string, AbilityDef> = {
  // ============== Warrior ==============
  whirlwind: {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: 'Spins, dealing 130% attack to all adjacent enemies and gaining Taunt.',
    icon: '🌀',
    manaCost: 50,
    cooldownTicks: 18,
    element: 'physical',
    kind: 'aoe',
    data: { power: 1.3, radius: 1, status: 'taunt', duration: 6, statusPower: 1 },
  },

  // ============== Archer ==============
  multishot: {
    id: 'multishot',
    name: 'Multishot',
    description: 'Fires three arrows at up to 3 different enemies for 90% attack each.',
    icon: '🎯',
    manaCost: 45,
    cooldownTicks: 14,
    element: 'physical',
    kind: 'chain',
    data: { power: 0.9, targets: 3 },
  },

  // ============== Mage ==============
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description: 'Explodes for 160% attack on a target and burns nearby enemies.',
    icon: '🔥',
    manaCost: 60,
    cooldownTicks: 16,
    element: 'fire',
    kind: 'aoe',
    data: { power: 1.6, radius: 1, status: 'burn', duration: 4, statusPower: 8 },
  },

  frostnova: {
    id: 'frostnova',
    name: 'Frost Nova',
    description: 'Deals 110% attack and freezes nearby enemies in place.',
    icon: '❄️',
    manaCost: 55,
    cooldownTicks: 18,
    element: 'ice',
    kind: 'aoe',
    data: { power: 1.1, radius: 1, status: 'freeze', duration: 3 },
  },

  // ============== Paladin ==============
  consecrate: {
    id: 'consecrate',
    name: 'Consecrate',
    description: 'Heals lowest-HP ally for 200% attack and grants them a shield.',
    icon: '✨',
    manaCost: 50,
    cooldownTicks: 16,
    element: 'holy',
    kind: 'heal',
    data: { power: 2.0, status: 'shield', duration: 6, statusPower: 40 },
  },

  // ============== Rogue ==============
  shadowstrike: {
    id: 'shadowstrike',
    name: 'Shadow Strike',
    description: 'Teleports behind the enemy backline and crits for 250% attack.',
    icon: '🌑',
    manaCost: 50,
    cooldownTicks: 14,
    element: 'shadow',
    kind: 'execute',
    data: { power: 2.5 },
  },

  // ============== Berserker ==============
  bloodrage: {
    id: 'bloodrage',
    name: 'Blood Rage',
    description: 'Strikes twice for 110% attack each and gains +40% attack for 6 ticks.',
    icon: '💢',
    manaCost: 40,
    cooldownTicks: 14,
    element: 'physical',
    kind: 'multistrike',
    data: { power: 1.1, targets: 2, selfBuff: { attack: 40 }, duration: 6 },
  },

  // ============== Cleric ==============
  divinelight: {
    id: 'divinelight',
    name: 'Divine Light',
    description: 'Heals all allies for 80% attack and removes harmful effects.',
    icon: '🕊️',
    manaCost: 70,
    cooldownTicks: 22,
    element: 'holy',
    kind: 'heal',
    data: { power: 0.8, radius: 99 },
  },

  // ============== Druid ==============
  thornedvines: {
    id: 'thornedvines',
    name: 'Thorned Vines',
    description: 'Roots up to 3 enemies, dealing nature damage and bleed over time.',
    icon: '🌿',
    manaCost: 50,
    cooldownTicks: 18,
    element: 'nature',
    kind: 'chain',
    data: { power: 0.9, targets: 3, status: 'bleed', duration: 5, statusPower: 6 },
  },

  // ============== Necromancer ==============
  drainlife: {
    id: 'drainlife',
    name: 'Drain Life',
    description: 'Steals 150% attack from target and heals self for the damage dealt.',
    icon: '💀',
    manaCost: 45,
    cooldownTicks: 14,
    element: 'shadow',
    kind: 'lifesteal',
    data: { power: 1.5 },
  },

  // ============== Monk ==============
  flurry: {
    id: 'flurry',
    name: 'Flurry of Blows',
    description: 'Strikes 4 times for 60% attack each with +20% crit chance.',
    icon: '👊',
    manaCost: 50,
    cooldownTicks: 14,
    element: 'physical',
    kind: 'multistrike',
    data: { power: 0.6, targets: 4, selfBuff: { critRate: 0.2 }, duration: 4 },
  },

  // ============== Boss-only ==============
  boss_aoe_burst: {
    id: 'boss_aoe_burst',
    name: 'Cataclysm',
    description: 'Boss-only. Massive AoE shadow damage.',
    icon: '💥',
    manaCost: 0,
    cooldownTicks: 20,
    element: 'shadow',
    kind: 'aoe',
    data: { power: 1.4, radius: 99 },
  },
};

export const CLASS_DEFAULT_ABILITY: Record<string, string> = {
  Warrior: 'whirlwind',
  Archer: 'multishot',
  Mage: 'fireball',
  Paladin: 'consecrate',
  Rogue: 'shadowstrike',
  Berserker: 'bloodrage',
  Cleric: 'divinelight',
  Druid: 'thornedvines',
  Necromancer: 'drainlife',
  Monk: 'flurry',
};

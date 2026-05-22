import { Equipment } from '../types';

function mk(eq: Partial<Equipment> & {
  id: string; name: string; type: Equipment['type'];
  rarity: Equipment['rarity']; icon: string;
  statBonus: Equipment['statBonus'];
}): Equipment {
  return {
    level: 1,
    owned: 0,
    ...eq,
  } as Equipment;
}

export const EQUIPMENT: Equipment[] = [
  // ============ WEAPONS ============
  mk({ id: 'sword_iron', name: 'Iron Sword', type: 'weapon', rarity: 'common', icon: '⚔️',
    statBonus: { attack: 8 }, requiredClass: ['Warrior', 'Paladin'], owned: 1 }),
  mk({ id: 'bow_oak', name: 'Oak Bow', type: 'weapon', rarity: 'common', icon: '🏹',
    statBonus: { attack: 10, critRate: 0.03 }, requiredClass: ['Archer'], owned: 1 }),
  mk({ id: 'staff_apprentice', name: "Apprentice Staff", type: 'weapon', rarity: 'common', icon: '🪄',
    statBonus: { attack: 12, maxMana: 20 }, requiredClass: ['Mage', 'Cleric', 'Necromancer'], owned: 1 }),
  mk({ id: 'dagger_shadow', name: 'Shadow Dagger', type: 'weapon', rarity: 'common', icon: '🗡️',
    statBonus: { attack: 14, speed: 1, critRate: 0.05 }, requiredClass: ['Rogue'] }),
  mk({ id: 'axe_battle', name: 'Battle Axe', type: 'weapon', rarity: 'rare', icon: '🪓',
    statBonus: { attack: 22, critDamage: 0.2 }, requiredClass: ['Berserker', 'Warrior'], setId: 'savage' }),
  mk({ id: 'sword_steel', name: 'Steel Sword', type: 'weapon', rarity: 'rare', icon: '⚔️',
    statBonus: { attack: 18, defense: 4 }, requiredClass: ['Warrior', 'Paladin'] }),
  mk({ id: 'bow_elven', name: 'Elven Bow', type: 'weapon', rarity: 'rare', icon: '🏹',
    statBonus: { attack: 22, speed: 1, critRate: 0.08 }, requiredClass: ['Archer'], setId: 'hunter' }),
  mk({ id: 'staff_arcane', name: 'Arcane Staff', type: 'weapon', rarity: 'epic', icon: '🔮',
    statBonus: { attack: 30, hp: 20, maxMana: 40 }, requiredClass: ['Mage', 'Necromancer'], setId: 'arcanum' }),
  mk({ id: 'knuckles_jade', name: 'Jade Knuckles', type: 'weapon', rarity: 'rare', icon: '👊',
    statBonus: { attack: 20, speed: 1, critRate: 0.06 }, requiredClass: ['Monk'] }),
  mk({ id: 'mace_dawn', name: "Dawn's Mace", type: 'weapon', rarity: 'epic', icon: '🔨',
    statBonus: { attack: 28, defense: 6, hp: 30 }, requiredClass: ['Paladin', 'Cleric'] }),
  mk({ id: 'scythe_bone', name: 'Bone Scythe', type: 'weapon', rarity: 'epic', icon: '🌑',
    statBonus: { attack: 30, critDamage: 0.3 }, requiredClass: ['Necromancer'] }),
  mk({ id: 'sword_legendary', name: 'Dawnbreaker', type: 'weapon', rarity: 'legendary', icon: '✨',
    statBonus: { attack: 45, defense: 10, critRate: 0.1 } }),
  mk({ id: 'staff_voidcaller', name: 'Voidcaller', type: 'weapon', rarity: 'legendary', icon: '🌌',
    statBonus: { attack: 50, maxMana: 60, manaRegen: 4 }, requiredClass: ['Mage', 'Necromancer'] }),
  mk({ id: 'sword_mythic', name: 'Sunshatter', type: 'weapon', rarity: 'mythic', icon: '☀️',
    statBonus: { attack: 60, defense: 15, critRate: 0.12, critDamage: 0.4 } }),

  // ============ ARMOR ============
  mk({ id: 'armor_leather', name: 'Leather Armor', type: 'armor', rarity: 'common', icon: '🧥',
    statBonus: { defense: 6, hp: 20 }, owned: 1 }),
  mk({ id: 'armor_chain', name: 'Chain Mail', type: 'armor', rarity: 'common', icon: '🛡️',
    statBonus: { defense: 12, hp: 10 }, requiredClass: ['Warrior', 'Paladin', 'Berserker'], owned: 1 }),
  mk({ id: 'robe_mystic', name: 'Mystic Robe', type: 'armor', rarity: 'common', icon: '👘',
    statBonus: { defense: 4, hp: 30, maxMana: 20 }, requiredClass: ['Mage', 'Cleric', 'Necromancer'], owned: 1 }),
  mk({ id: 'gi_monk', name: 'Monk Gi', type: 'armor', rarity: 'common', icon: '🥋',
    statBonus: { defense: 5, hp: 20, dodge: 0.05 }, requiredClass: ['Monk', 'Rogue'] }),
  mk({ id: 'armor_plate', name: 'Plate Armor', type: 'armor', rarity: 'rare', icon: '🛡️',
    statBonus: { defense: 22, hp: 50 }, requiredClass: ['Warrior', 'Paladin'] }),
  mk({ id: 'cloak_shadow', name: 'Shadow Cloak', type: 'armor', rarity: 'rare', icon: '🌑',
    statBonus: { defense: 8, speed: 2, dodge: 0.08 }, requiredClass: ['Rogue', 'Archer', 'Monk'], setId: 'shadow' }),
  mk({ id: 'robe_archmage', name: 'Archmage Robe', type: 'armor', rarity: 'epic', icon: '🌌',
    statBonus: { defense: 14, hp: 60, maxMana: 50, manaRegen: 2 }, requiredClass: ['Mage', 'Necromancer'], setId: 'arcanum' }),
  mk({ id: 'armor_dragonscale', name: 'Dragonscale Armor', type: 'armor', rarity: 'epic', icon: '🐉',
    statBonus: { defense: 32, hp: 70 } }),
  mk({ id: 'armor_mythril', name: 'Mythril Plate', type: 'armor', rarity: 'legendary', icon: '💎',
    statBonus: { defense: 48, hp: 110, speed: 1 }, requiredClass: ['Warrior', 'Paladin'] }),
  mk({ id: 'armor_phoenix', name: 'Phoenix Mail', type: 'armor', rarity: 'mythic', icon: '🦅',
    statBonus: { defense: 50, hp: 140, manaRegen: 3 } }),

  // ============ ACCESSORIES (new) ============
  mk({ id: 'ring_vitality', name: 'Ring of Vitality', type: 'accessory', rarity: 'common', icon: '💍',
    statBonus: { hp: 30 } }),
  mk({ id: 'ring_swift', name: 'Swift Band', type: 'accessory', rarity: 'common', icon: '🔵',
    statBonus: { speed: 2, dodge: 0.04 } }),
  mk({ id: 'amulet_fury', name: 'Amulet of Fury', type: 'accessory', rarity: 'rare', icon: '📿',
    statBonus: { attack: 10, critRate: 0.05 } }),
  mk({ id: 'amulet_focus', name: 'Crystal Focus', type: 'accessory', rarity: 'rare', icon: '🔷',
    statBonus: { maxMana: 40, manaRegen: 3 }, setId: 'arcanum' }),
  mk({ id: 'amulet_ward', name: 'Warding Stone', type: 'accessory', rarity: 'epic', icon: '🟢',
    statBonus: { defense: 12, hp: 40, dodge: 0.05 } }),
  mk({ id: 'amulet_predator', name: "Predator's Eye", type: 'accessory', rarity: 'epic', icon: '👁️',
    statBonus: { attack: 14, critRate: 0.10, critDamage: 0.2 }, setId: 'hunter' }),
  mk({ id: 'amulet_savage', name: 'Savage Idol', type: 'accessory', rarity: 'epic', icon: '🗿',
    statBonus: { attack: 16, hp: 30 }, setId: 'savage' }),
  mk({ id: 'amulet_void', name: 'Void Sigil', type: 'accessory', rarity: 'legendary', icon: '🟣',
    statBonus: { attack: 20, maxMana: 60, critRate: 0.08 } }),
  mk({ id: 'amulet_sun', name: 'Sunstone', type: 'accessory', rarity: 'mythic', icon: '🟡',
    statBonus: { attack: 24, hp: 80, critDamage: 0.3, critRate: 0.1 } }),
];

export function getEquipmentById(id: string): Equipment | undefined {
  return EQUIPMENT.find((e) => e.id === id);
}

export const RARITY_COLORS: Record<string, string> = {
  common: '#95a5a6',
  rare: '#3498db',
  epic: '#9b59b6',
  legendary: '#f39c12',
  mythic: '#e84393',
};

export const RARITY_GLOW: Record<string, string> = {
  common: '#95a5a655',
  rare: '#3498db77',
  epic: '#9b59b699',
  legendary: '#f39c12bb',
  mythic: '#e84393dd',
};

// Tier system: combine 4 identical copies (consume 4, keep 1 representative)
// to advance to the next tier. Each tier adds +20% to the item's statBonus.
export const MAX_ITEM_TIER = 5;
export const ITEMS_PER_COMBINE = 4;
// Multiplier applied to the canonical statBonus at a given tier (1..5).
export function itemTierFactor(tier: number): number {
  return 1 + 0.2 * Math.max(0, tier - 1);
}

export interface EquipmentSet {
  id: string;
  name: string;
  description: string;
  pieces: number;  // min equipped to activate
  bonus: { attack?: number; defense?: number; hp?: number; critRate?: number; dodge?: number };
}

export const EQUIPMENT_SETS: Record<string, EquipmentSet> = {
  arcanum: {
    id: 'arcanum', name: 'Arcanum',
    description: '2-piece: +40 max mana, +0.05 crit.',
    pieces: 2, bonus: { critRate: 0.05 },
  },
  hunter: {
    id: 'hunter', name: 'Hunter',
    description: '2-piece: +15% crit damage, +5% crit rate.',
    pieces: 2, bonus: { critRate: 0.05 },
  },
  shadow: {
    id: 'shadow', name: 'Shadow',
    description: '2-piece: +10% dodge.',
    pieces: 2, bonus: { dodge: 0.10 },
  },
  savage: {
    id: 'savage', name: 'Savage',
    description: '2-piece: +20 attack.',
    pieces: 2, bonus: { attack: 20 },
  },
};

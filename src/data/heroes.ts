import { Hero, Element } from '../types';

// Centralised defaults so we can author heroes succinctly.
function makeHero(partial: Partial<Hero> & {
  id: string; name: string; heroClass: Hero['heroClass'];
  baseStats: Hero['baseStats'];
  rarity: Hero['rarity']; icon: string; description: string;
  abilityId: string; passiveDesc?: string;
  unlocked?: boolean; portraitSeed?: number;
}): Hero {
  return {
    id: partial.id,
    name: partial.name,
    heroClass: partial.heroClass,
    level: 1,
    stars: 0,
    experience: 0,
    experienceToNext: 100,
    baseStats: partial.baseStats,
    abilityId: partial.abilityId,
    passiveDesc: partial.passiveDesc,
    weaponId: null,
    armorId: null,
    accessoryId: null,
    unlocked: partial.unlocked ?? false,
    rarity: partial.rarity,
    icon: partial.icon,
    portraitSeed: partial.portraitSeed ?? Math.floor(Math.random() * 99999),
    description: partial.description,
  };
}

export const HEROES: Hero[] = [
  makeHero({
    id: 'warrior_1', name: 'Ironwall', heroClass: 'Warrior',
    baseStats: {
      maxHp: 220, attack: 26, defense: 22, speed: 3, range: 1,
      critRate: 0.05, critDamage: 1.5, dodge: 0.04,
      maxMana: 100, manaRegen: 4, element: 'physical', resistance: { physical: 0.1 },
    },
    rarity: 'common', icon: '🛡️', portraitSeed: 11,
    abilityId: 'whirlwind',
    passiveDesc: 'Iron Will: gains +2 defense each time an ally falls.',
    description: 'A stalwart defender who soaks up damage on the front line.',
    unlocked: true,
  }),
  makeHero({
    id: 'archer_1', name: 'Swiftshot', heroClass: 'Archer',
    baseStats: {
      maxHp: 130, attack: 36, defense: 9, speed: 5, range: 3,
      critRate: 0.18, critDamage: 1.7, dodge: 0.12,
      maxMana: 90, manaRegen: 6, element: 'physical', resistance: {},
    },
    rarity: 'common', icon: '🏹', portraitSeed: 21,
    abilityId: 'multishot',
    passiveDesc: 'Eagle Eye: +25% damage to backline targets.',
    description: 'A nimble archer who picks off enemies from a distance.',
    unlocked: true,
  }),
  makeHero({
    id: 'mage_1', name: 'Emberlash', heroClass: 'Mage',
    baseStats: {
      maxHp: 105, attack: 52, defense: 5, speed: 4, range: 4,
      critRate: 0.12, critDamage: 1.6, dodge: 0.06,
      maxMana: 140, manaRegen: 8, element: 'fire',
      resistance: { fire: 0.5, ice: -0.25 },
    },
    rarity: 'common', icon: '🔥', portraitSeed: 31,
    abilityId: 'fireball',
    passiveDesc: 'Pyromancy: basic attacks apply Burn (4 ticks).',
    description: 'A powerful fire mage who burns enemies from afar.',
    unlocked: true,
  }),
  makeHero({
    id: 'paladin_1', name: 'Lightbringer', heroClass: 'Paladin',
    baseStats: {
      maxHp: 170, attack: 22, defense: 19, speed: 3, range: 1,
      critRate: 0.06, critDamage: 1.5, dodge: 0.05,
      maxMana: 110, manaRegen: 5, element: 'holy',
      resistance: { holy: 0.5, shadow: 0.25 },
    },
    rarity: 'rare', icon: '✨', portraitSeed: 41,
    abilityId: 'consecrate',
    passiveDesc: 'Aura of Light: allies regen 2 HP per tick.',
    description: 'A holy warrior who heals allies while fighting on the front.',
  }),
  makeHero({
    id: 'rogue_1', name: 'Shadowstrike', heroClass: 'Rogue',
    baseStats: {
      maxHp: 115, attack: 46, defense: 7, speed: 7, range: 1,
      critRate: 0.28, critDamage: 2.0, dodge: 0.22,
      maxMana: 80, manaRegen: 5, element: 'shadow',
      resistance: { shadow: 0.25 },
    },
    rarity: 'rare', icon: '🗡️', portraitSeed: 51,
    abilityId: 'shadowstrike',
    passiveDesc: 'Backstab: +50% crit damage vs. backline.',
    description: 'A deadly assassin who strikes fast and disappears.',
  }),
  makeHero({
    id: 'berserker_1', name: 'Grimfang', heroClass: 'Berserker',
    baseStats: {
      maxHp: 160, attack: 58, defense: 10, speed: 4, range: 1,
      critRate: 0.15, critDamage: 1.8, dodge: 0.05,
      maxMana: 70, manaRegen: 7, element: 'physical', resistance: {},
    },
    rarity: 'epic', icon: '🪓', portraitSeed: 61,
    abilityId: 'bloodrage',
    passiveDesc: 'Bloodlust: gains +1% attack per 1% missing HP.',
    description: 'A fearless brute who deals more damage as he bleeds.',
  }),
  makeHero({
    id: 'mage_2', name: 'Frostweaver', heroClass: 'Mage',
    baseStats: {
      maxHp: 100, attack: 46, defense: 5, speed: 4, range: 4,
      critRate: 0.12, critDamage: 1.6, dodge: 0.08,
      maxMana: 150, manaRegen: 8, element: 'ice',
      resistance: { ice: 0.6, fire: -0.25 },
    },
    rarity: 'epic', icon: '❄️', portraitSeed: 71,
    abilityId: 'frostnova',
    passiveDesc: 'Hoarfrost: basic attacks apply Slow (2 ticks).',
    description: 'An ice mage who slows and freezes enemies.',
  }),
  makeHero({
    id: 'warrior_2', name: 'Doomplate', heroClass: 'Warrior',
    baseStats: {
      maxHp: 320, attack: 32, defense: 34, speed: 2, range: 1,
      critRate: 0.05, critDamage: 1.5, dodge: 0.02,
      maxMana: 120, manaRegen: 4, element: 'physical',
      resistance: { physical: 0.2, fire: 0.1 },
    },
    rarity: 'legendary', icon: '🏰', portraitSeed: 81,
    abilityId: 'whirlwind',
    passiveDesc: 'Unbreakable: incoming damage capped at 15% maxHP.',
    description: 'An unstoppable juggernaut clad in legendary armor.',
  }),
  // -------- NEW HEROES --------
  makeHero({
    id: 'cleric_1', name: 'Aurelia', heroClass: 'Cleric',
    baseStats: {
      maxHp: 130, attack: 24, defense: 10, speed: 4, range: 3,
      critRate: 0.08, critDamage: 1.5, dodge: 0.06,
      maxMana: 160, manaRegen: 10, element: 'holy',
      resistance: { holy: 0.5, shadow: 0.2 },
    },
    rarity: 'rare', icon: '🕊️', portraitSeed: 91,
    abilityId: 'divinelight',
    passiveDesc: 'Blessing: heals lowest-HP ally for 3% maxHP each tick.',
    description: 'A devoted healer whose light keeps allies alive.',
  }),
  makeHero({
    id: 'druid_1', name: 'Verdara', heroClass: 'Druid',
    baseStats: {
      maxHp: 140, attack: 30, defense: 11, speed: 4, range: 3,
      critRate: 0.10, critDamage: 1.6, dodge: 0.10,
      maxMana: 130, manaRegen: 7, element: 'nature',
      resistance: { nature: 0.5, fire: -0.2 },
    },
    rarity: 'epic', icon: '🌿', portraitSeed: 101,
    abilityId: 'thornedvines',
    passiveDesc: 'Regrowth: revives once at 30% HP (per battle).',
    description: 'A nature warden who weaves the forest into a weapon.',
  }),
  makeHero({
    id: 'necro_1', name: 'Mortimer', heroClass: 'Necromancer',
    baseStats: {
      maxHp: 110, attack: 50, defense: 6, speed: 4, range: 4,
      critRate: 0.10, critDamage: 1.7, dodge: 0.05,
      maxMana: 130, manaRegen: 7, element: 'shadow',
      resistance: { shadow: 0.6, holy: -0.25 },
    },
    rarity: 'epic', icon: '💀', portraitSeed: 111,
    abilityId: 'drainlife',
    passiveDesc: 'Soul Siphon: 20% of damage dealt is returned as HP.',
    description: 'A wielder of the dark arts who feeds on suffering.',
  }),
  makeHero({
    id: 'monk_1', name: 'Tenzin', heroClass: 'Monk',
    baseStats: {
      maxHp: 145, attack: 38, defense: 12, speed: 6, range: 1,
      critRate: 0.20, critDamage: 1.8, dodge: 0.18,
      maxMana: 100, manaRegen: 8, element: 'physical',
      resistance: { physical: 0.15 },
    },
    rarity: 'legendary', icon: '🥋', portraitSeed: 121,
    abilityId: 'flurry',
    passiveDesc: 'Inner Peace: +5% dodge per 25% missing HP.',
    description: 'A disciplined martial artist whose strikes blur the air.',
  }),
  makeHero({
    id: 'paladin_2', name: 'Sunhammer', heroClass: 'Paladin',
    baseStats: {
      maxHp: 230, attack: 34, defense: 24, speed: 3, range: 1,
      critRate: 0.08, critDamage: 1.6, dodge: 0.03,
      maxMana: 130, manaRegen: 5, element: 'holy',
      resistance: { holy: 0.6, shadow: 0.35 },
    },
    rarity: 'mythic', icon: '☀️', portraitSeed: 131,
    abilityId: 'consecrate',
    passiveDesc: 'Radiance: damage dealt heals nearby allies for 25%.',
    description: 'Mythic champion whose hammer carries the light of dawn.',
  }),
  makeHero({
    id: 'archer_2', name: 'Stormcaller', heroClass: 'Archer',
    baseStats: {
      maxHp: 130, attack: 42, defense: 9, speed: 6, range: 4,
      critRate: 0.22, critDamage: 1.9, dodge: 0.14,
      maxMana: 100, manaRegen: 7, element: 'lightning',
      resistance: { lightning: 0.5, nature: 0.2 },
    },
    rarity: 'epic', icon: '⚡', portraitSeed: 141,
    abilityId: 'multishot',
    passiveDesc: 'Chain Lightning: basic attacks splash 30% damage to nearby enemies.',
    description: 'A storm-touched archer whose arrows arc with lightning.',
  }),
  makeHero({
    id: 'rogue_2', name: 'Nightveil', heroClass: 'Rogue',
    baseStats: {
      maxHp: 125, attack: 52, defense: 7, speed: 8, range: 1,
      critRate: 0.32, critDamage: 2.1, dodge: 0.26,
      maxMana: 90, manaRegen: 6, element: 'shadow',
      resistance: { shadow: 0.35, holy: -0.2 },
    },
    rarity: 'legendary', icon: '🥷', portraitSeed: 151,
    abilityId: 'shadowstrike',
    passiveDesc: 'Vanish: gains +30% dodge for 4t after taking lethal damage (once).',
    description: 'A phantom assassin who slips between heartbeats.',
  }),
  makeHero({
    id: 'berserker_2', name: 'Bloodforge', heroClass: 'Berserker',
    baseStats: {
      maxHp: 180, attack: 64, defense: 12, speed: 4, range: 1,
      critRate: 0.18, critDamage: 1.9, dodge: 0.05,
      maxMana: 80, manaRegen: 7, element: 'physical',
      resistance: { physical: 0.1 },
    },
    rarity: 'legendary', icon: '⚒️', portraitSeed: 161,
    abilityId: 'bloodrage',
    passiveDesc: 'Crimson Tide: kills restore 15% maxHP and grant +5 attack.',
    description: 'A warlord whose strength swells with each fallen foe.',
  }),
  makeHero({
    id: 'cleric_2', name: 'Solaris', heroClass: 'Cleric',
    baseStats: {
      maxHp: 150, attack: 28, defense: 12, speed: 4, range: 3,
      critRate: 0.10, critDamage: 1.6, dodge: 0.07,
      maxMana: 180, manaRegen: 12, element: 'holy',
      resistance: { holy: 0.6, shadow: 0.3 },
    },
    rarity: 'legendary', icon: '🌅', portraitSeed: 171,
    abilityId: 'divinelight',
    passiveDesc: 'Sunblessing: overflow healing converts to shields for the ally.',
    description: 'A high priestess of the dawn whose blessings transcend mortality.',
  }),
];

export function getHeroById(id: string): Hero | undefined {
  return HEROES.find((h) => h.id === id);
}

export const CLASS_COLORS: Record<string, string> = {
  Warrior: '#e67e22',
  Archer: '#27ae60',
  Mage: '#8e44ad',
  Paladin: '#f1c40f',
  Rogue: '#34495e',
  Berserker: '#c0392b',
  Cleric: '#ecf0f1',
  Druid: '#16a085',
  Necromancer: '#7f00ff',
  Monk: '#f39c12',
};

export const ELEMENT_COLORS: Record<Element, string> = {
  physical: '#bdc3c7',
  fire: '#e74c3c',
  ice: '#3498db',
  lightning: '#f1c40f',
  holy: '#f9e79f',
  shadow: '#5b2c6f',
  nature: '#27ae60',
};

export const ELEMENT_ICONS: Record<Element, string> = {
  physical: '⚔️',
  fire: '🔥',
  ice: '❄️',
  lightning: '⚡',
  holy: '✨',
  shadow: '🌑',
  nature: '🌿',
};

export const CLASS_DESCRIPTIONS: Record<string, string> = {
  Warrior: 'Tanky melee bruiser. Soaks damage, holds the line.',
  Archer: 'Backline DPS. High crit, focuses backline targets.',
  Mage: 'Glass cannon spellcaster. AoE damage and burn.',
  Paladin: 'Frontline support. Heals and shields.',
  Rogue: 'High-evasion assassin. Crits and teleports.',
  Berserker: 'Damage scales with missing HP. Risky.',
  Cleric: 'Pure healer. Mass heal, status cleanse.',
  Druid: 'Nature control. Roots, bleeds, revives.',
  Necromancer: 'Drains life. Lifesteal damage dealer.',
  Monk: 'Mobile striker. Multi-hits, high dodge.',
};

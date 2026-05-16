import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Hero, Equipment, GridPosition, GameState, HeroStats, Element, ShopItem,
  EnemyConfig, LevelProgressEntry,
} from '../types';
import { HEROES } from '../data/heroes';
import { EQUIPMENT, EQUIPMENT_SETS, MAX_FORGE_LEVEL, forgeShardsRequired } from '../data/equipment';
import { ACHIEVEMENTS } from '../data/achievements';
import { ABILITIES } from '../data/abilities';

const SAVE_KEY = '@autobattler/save_v2';

interface GameStore extends GameState {
  currentScreen: string;
  setScreen: (screen: string) => void;

  selectHero: (id: string | null) => void;
  levelUpHero: (heroId: string) => void;
  ascendHero: (heroId: string) => void;
  toggleFavorite: (heroId: string) => void;
  equipItem: (heroId: string, equipmentId: string) => void;
  unequipItem: (heroId: string, slot: 'weapon' | 'armor' | 'accessory') => void;

  setCurrentLevel: (levelId: number | null) => void;
  placeHero: (heroId: string, pos: GridPosition) => void;
  removeHeroFromGrid: (heroId: string) => void;
  clearPlacements: () => void;
  autoPlace: () => void;

  applyBattleRewards: (won: boolean, gold: number, exp: number, heroIds: string[], stats: { damage: number; kills: number }, itemDrop?: string) => void;
  setArenaWave: (wave: number) => void;

  unlockHero: (heroId: string, cost: number) => void;

  forgeEquipment: (id: string) => void;
  buyShopItem: (slotIdx: number) => void;
  refreshShop: (force?: boolean) => void;

  claimAchievement: (id: string) => void;
  updateAchievementProgress: (id: string, delta: number) => void;

  setBattleSpeed: (s: 1 | 2 | 4) => void;
  hydrate: () => Promise<void>;
  reset: () => void;
}

function buildInitialHeroes(): Record<string, Hero> {
  return Object.fromEntries(HEROES.map((h) => [h.id, { ...h, baseStats: { ...h.baseStats, resistance: { ...h.baseStats.resistance } } }]));
}

function buildInitialEquipment(): Record<string, Equipment> {
  return Object.fromEntries(EQUIPMENT.map((e) => [e.id, { ...e, statBonus: { ...e.statBonus } }]));
}

function buildInitialAchievements(): Record<string, { progress: number; claimed: boolean }> {
  return Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, { progress: 0, claimed: false }]));
}

const INITIAL_STATE: Pick<GameState, 'gold' | 'gems' | 'heroes' | 'equipment' | 'levelProgress' | 'placedHeroes' | 'currentLevelId' | 'selectedHeroId' | 'arenaWave' | 'arenaBestWave' | 'achievements' | 'shopStock' | 'shopRefreshAt' | 'battleSpeed' | 'totalBattles' | 'totalVictories' | 'totalDamageDealt' | 'totalKills' | 'hydrated'> = {
  gold: 250,
  gems: 0,
  heroes: buildInitialHeroes(),
  equipment: buildInitialEquipment(),
  levelProgress: {},
  placedHeroes: {},
  currentLevelId: null,
  selectedHeroId: null,
  arenaWave: 1,
  arenaBestWave: 0,
  achievements: buildInitialAchievements(),
  shopStock: [],
  shopRefreshAt: 0,
  battleSpeed: 1,
  totalBattles: 0,
  totalVictories: 0,
  totalDamageDealt: 0,
  totalKills: 0,
  hydrated: false,
};

function generateShop(): ShopItem[] {
  const items = Object.values(EQUIPMENT);
  const pool: ShopItem[] = [];
  const rarityCost: Record<string, number> = { common: 80, rare: 250, epic: 600, legendary: 1500, mythic: 4000 };
  // Pick 6 weighted random items.
  for (let i = 0; i < 6; i++) {
    const r = Math.random();
    let pickedRarity = 'common';
    if (r > 0.85) pickedRarity = 'epic';
    else if (r > 0.6) pickedRarity = 'rare';
    if (r > 0.97) pickedRarity = 'legendary';
    const filtered = items.filter((it) => it.rarity === pickedRarity);
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    if (!pick) continue;
    pool.push({
      id: `slot_${i}`,
      itemId: pick.id,
      cost: rarityCost[pickedRarity] ?? 100,
      currency: 'gold',
      stock: 1,
    });
  }
  // Always include a gem-cost mythic item & a gems-for-gold deal.
  pool.push({
    id: 'slot_gem',
    itemId: 'sword_mythic',
    cost: 100, currency: 'gems', stock: 1, label: 'Mythic Weapon (rotating)',
  });
  pool.push({
    id: 'slot_shards',
    itemId: 'shards:sword_legendary',
    cost: 30, currency: 'gems', stock: 5, label: '5 Legendary Shards',
  });
  return pool;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,
  currentScreen: 'home',

  setScreen: (screen) => set({ currentScreen: screen }),
  selectHero: (id) => set({ selectedHeroId: id }),

  levelUpHero: (heroId) => {
    const { heroes, gold } = get();
    const hero = heroes[heroId];
    if (!hero) return;
    const cost = hero.level * 50;
    if (gold < cost) return;
    const newLevel = hero.level + 1;
    const statBoost = 1.12;
    set({
      gold: gold - cost,
      heroes: {
        ...heroes,
        [heroId]: {
          ...hero,
          level: newLevel,
          experience: 0,
          experienceToNext: Math.round(100 * Math.pow(1.3, newLevel)),
          baseStats: {
            ...hero.baseStats,
            maxHp: Math.round(hero.baseStats.maxHp * statBoost),
            attack: Math.round(hero.baseStats.attack * statBoost),
            defense: Math.round(hero.baseStats.defense * statBoost),
            critRate: Math.min(0.6, hero.baseStats.critRate + 0.005),
            maxMana: hero.baseStats.maxMana + 2,
          },
        },
      },
    });
    persist(get());
  },

  ascendHero: (heroId) => {
    const { heroes, gems } = get();
    const hero = heroes[heroId];
    if (!hero) return;
    if (hero.stars >= 5) return;
    const cost = (hero.stars + 1) * 30;
    if (gems < cost) return;
    set({
      gems: gems - cost,
      heroes: {
        ...heroes,
        [heroId]: {
          ...hero,
          stars: hero.stars + 1,
          baseStats: {
            ...hero.baseStats,
            maxHp: Math.round(hero.baseStats.maxHp * 1.25),
            attack: Math.round(hero.baseStats.attack * 1.2),
            defense: Math.round(hero.baseStats.defense * 1.2),
            critRate: Math.min(0.7, hero.baseStats.critRate + 0.03),
          },
        },
      },
    });
    persist(get());
  },

  toggleFavorite: (heroId) => {
    const { heroes } = get();
    const hero = heroes[heroId];
    if (!hero) return;
    set({ heroes: { ...heroes, [heroId]: { ...hero, favorite: !hero.favorite } } });
    persist(get());
  },

  equipItem: (heroId, equipmentId) => {
    const { heroes, equipment } = get();
    const hero = heroes[heroId];
    const item = equipment[equipmentId];
    if (!hero || !item || item.owned <= 0) return;

    const slotKey: keyof Hero =
      item.type === 'weapon' ? 'weaponId' : item.type === 'armor' ? 'armorId' : 'accessoryId';
    const currentEquipped = hero[slotKey] as string | null;

    const updatedEquipment = { ...equipment };
    if (currentEquipped) {
      updatedEquipment[currentEquipped] = {
        ...updatedEquipment[currentEquipped],
        owned: updatedEquipment[currentEquipped].owned + 1,
      };
    }
    updatedEquipment[equipmentId] = { ...item, owned: item.owned - 1 };

    set({
      heroes: { ...heroes, [heroId]: { ...hero, [slotKey]: equipmentId } },
      equipment: updatedEquipment,
    });
    persist(get());
  },

  unequipItem: (heroId, slot) => {
    const { heroes, equipment } = get();
    const hero = heroes[heroId];
    if (!hero) return;
    const itemIdKey: keyof Hero =
      slot === 'weapon' ? 'weaponId' : slot === 'armor' ? 'armorId' : 'accessoryId';
    const itemId = hero[itemIdKey] as string | null;
    if (!itemId) return;
    const updatedEquipment = { ...equipment };
    updatedEquipment[itemId] = { ...updatedEquipment[itemId], owned: updatedEquipment[itemId].owned + 1 };
    set({
      heroes: { ...heroes, [heroId]: { ...hero, [itemIdKey]: null } },
      equipment: updatedEquipment,
    });
    persist(get());
  },

  setCurrentLevel: (levelId) => set({ currentLevelId: levelId, placedHeroes: {} }),

  placeHero: (heroId, pos) => {
    const { placedHeroes } = get();
    if (Object.keys(placedHeroes).length >= 5 && !placedHeroes[heroId]) return; // Cap at 5
    const cleaned = Object.fromEntries(Object.entries(placedHeroes).filter(([id]) => id !== heroId));
    const deduped = Object.fromEntries(Object.entries(cleaned).filter(([, p]) => !(p.col === pos.col && p.row === pos.row)));
    set({ placedHeroes: { ...deduped, [heroId]: pos } });
  },

  removeHeroFromGrid: (heroId) => {
    const { placedHeroes } = get();
    const updated = { ...placedHeroes };
    delete updated[heroId];
    set({ placedHeroes: updated });
  },

  clearPlacements: () => set({ placedHeroes: {} }),

  autoPlace: () => {
    const { heroes, placedHeroes } = get();
    const unlocked = Object.values(heroes).filter((h) => h.unlocked);
    // Sort: tanks front (warrior/paladin), DPS mid, ranged back.
    const tanks = unlocked.filter((h) => ['Warrior', 'Paladin'].includes(h.heroClass));
    const dps = unlocked.filter((h) => ['Berserker', 'Rogue', 'Monk'].includes(h.heroClass));
    const ranged = unlocked.filter((h) => ['Archer', 'Mage', 'Cleric', 'Druid', 'Necromancer'].includes(h.heroClass));

    const newPlacements: Record<string, GridPosition> = {};
    const rowOf = (i: number) => [1, 0, 2, 1, 0][i] ?? 1;
    let row = 0;
    for (const h of tanks.slice(0, 2)) {
      newPlacements[h.id] = { col: 3, row };
      row = (row + 1) % 3;
    }
    let r2 = 0;
    for (const h of dps.slice(0, 2)) {
      newPlacements[h.id] = { col: 2, row: r2 };
      r2 = (r2 + 1) % 3;
    }
    let r3 = 0;
    for (const h of ranged.slice(0, 2)) {
      if (Object.keys(newPlacements).length >= 5) break;
      newPlacements[h.id] = { col: 0, row: r3 };
      r3 = (r3 + 1) % 3;
    }
    // If not enough, fill from any leftover.
    for (const h of unlocked) {
      if (Object.keys(newPlacements).length >= 5) break;
      if (newPlacements[h.id]) continue;
      newPlacements[h.id] = { col: 1, row: rowOf(Object.keys(newPlacements).length) };
    }
    set({ placedHeroes: newPlacements });
  },

  applyBattleRewards: (won, gold, exp, heroIds, stats, itemDrop) => {
    const state = get();
    const updatedHeroes = { ...state.heroes };
    for (const heroId of heroIds) {
      const hero = updatedHeroes[heroId];
      if (!hero) continue;
      let newExp = hero.experience + exp;
      let lvl = hero.level;
      let expNext = hero.experienceToNext;
      let baseStats = hero.baseStats;
      while (newExp >= expNext && lvl < 50) {
        newExp -= expNext;
        lvl += 1;
        expNext = Math.round(100 * Math.pow(1.3, lvl));
        const boost = 1.08;
        baseStats = {
          ...baseStats,
          maxHp: Math.round(baseStats.maxHp * boost),
          attack: Math.round(baseStats.attack * boost),
          defense: Math.round(baseStats.defense * boost),
          critRate: Math.min(0.6, baseStats.critRate + 0.003),
          maxMana: baseStats.maxMana + 1,
        };
      }
      updatedHeroes[heroId] = { ...hero, level: lvl, experience: newExp, experienceToNext: expNext, baseStats };
    }

    const updatedEquipment = { ...state.equipment };
    if (itemDrop && updatedEquipment[itemDrop]) {
      updatedEquipment[itemDrop] = {
        ...updatedEquipment[itemDrop],
        owned: updatedEquipment[itemDrop].owned + 1,
      };
    }
    // Random shards drop for a couple of items when winning.
    if (won) {
      const ids = Object.keys(updatedEquipment);
      const dropCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < dropCount; i++) {
        const id = ids[Math.floor(Math.random() * ids.length)];
        const eq = updatedEquipment[id];
        if (!eq) continue;
        updatedEquipment[id] = { ...eq, shards: eq.shards + (1 + Math.floor(Math.random() * 3)) };
      }
    }

    const updatedProgress = { ...state.levelProgress };
    if (won && state.currentLevelId !== null) {
      const prev = updatedProgress[state.currentLevelId];
      updatedProgress[state.currentLevelId] = {
        completed: true,
        stars: Math.max(prev?.stars ?? 0, 3),
      };
    }

    // Achievement progress
    const ach = { ...state.achievements };
    function bump(id: string, n: number = 1) {
      const cur = ach[id] ?? { progress: 0, claimed: false };
      ach[id] = { ...cur, progress: cur.progress + n };
    }
    if (won) bump('first_win'), bump('win_10'), bump('win_50');
    if (won && state.currentLevelId === 9) bump('beat_boss');
    if (won && state.currentLevelId === 12) bump('campaign');
    bump('kill_100', stats.kills);
    bump('damage_10000', stats.damage);

    const unlockedCount = Object.values(updatedHeroes).filter((h) => h.unlocked).length;
    ach['unlock_5_heroes'] = { ...(ach['unlock_5_heroes'] ?? { progress: 0, claimed: false }), progress: unlockedCount };

    set({
      gold: state.gold + (won ? gold : Math.floor(gold * 0.25)),
      gems: state.gems + (won ? 2 : 0),
      heroes: updatedHeroes,
      equipment: updatedEquipment,
      levelProgress: updatedProgress,
      achievements: ach,
      totalBattles: state.totalBattles + 1,
      totalVictories: state.totalVictories + (won ? 1 : 0),
      totalDamageDealt: state.totalDamageDealt + stats.damage,
      totalKills: state.totalKills + stats.kills,
    });
    persist(get());
  },

  setArenaWave: (wave) => {
    set({
      arenaWave: wave,
      arenaBestWave: Math.max(wave, get().arenaBestWave),
      achievements: {
        ...get().achievements,
        arena_10: { progress: Math.max(get().arenaBestWave, wave), claimed: get().achievements.arena_10?.claimed ?? false },
        arena_25: { progress: Math.max(get().arenaBestWave, wave), claimed: get().achievements.arena_25?.claimed ?? false },
      },
    });
    persist(get());
  },

  unlockHero: (heroId, cost) => {
    const { heroes, gold } = get();
    if (gold < cost || !heroes[heroId]) return;
    set({
      gold: gold - cost,
      heroes: { ...heroes, [heroId]: { ...heroes[heroId], unlocked: true } },
    });
    persist(get());
  },

  forgeEquipment: (id) => {
    const { equipment, gold } = get();
    const item = equipment[id];
    if (!item) return;
    if (item.level >= MAX_FORGE_LEVEL) return;
    const shardCost = forgeShardsRequired(item.level);
    const goldCost = 50 * (item.level + 1);
    if (item.shards < shardCost || gold < goldCost) return;
    const newLevel = item.level + 1;
    const factor = 1 + 0.2 * newLevel;
    const newStatBonus: Equipment['statBonus'] = {};
    for (const [k, v] of Object.entries(item.statBonus)) {
      const base = (item.statBonus as any)[k] / (1 + 0.2 * item.level);
      (newStatBonus as any)[k] = typeof v === 'number'
        ? (Number.isInteger(base) ? Math.round(base * factor) : +(base * factor).toFixed(2))
        : v;
    }
    set({
      gold: gold - goldCost,
      equipment: {
        ...equipment,
        [id]: { ...item, level: newLevel, shards: item.shards - shardCost, statBonus: newStatBonus },
      },
    });
    // Achievement
    if (newLevel === 5) {
      const ach = { ...get().achievements };
      ach.forge_5 = { progress: 1, claimed: ach.forge_5?.claimed ?? false };
      set({ achievements: ach });
    }
    persist(get());
  },

  buyShopItem: (slotIdx) => {
    const state = get();
    const item = state.shopStock[slotIdx];
    if (!item || item.stock <= 0) return;
    const wallet = item.currency === 'gold' ? state.gold : state.gems;
    if (wallet < item.cost) return;

    let updatedEquipment = { ...state.equipment };

    if (item.itemId.startsWith('shards:')) {
      const targetId = item.itemId.split(':')[1];
      if (updatedEquipment[targetId]) {
        updatedEquipment[targetId] = { ...updatedEquipment[targetId], shards: updatedEquipment[targetId].shards + 5 };
      }
    } else {
      const eq = updatedEquipment[item.itemId];
      if (eq) updatedEquipment[item.itemId] = { ...eq, owned: eq.owned + 1 };
    }

    const newStock = state.shopStock.map((s, i) => i === slotIdx ? { ...s, stock: s.stock - 1 } : s);
    set({
      gold: item.currency === 'gold' ? state.gold - item.cost : state.gold,
      gems: item.currency === 'gems' ? state.gems - item.cost : state.gems,
      equipment: updatedEquipment,
      shopStock: newStock,
    });
    persist(get());
  },

  refreshShop: (force) => {
    const state = get();
    const now = Date.now();
    if (!force && state.shopRefreshAt > now && state.shopStock.length > 0) return;
    const cost = 50;
    if (force && state.gems < cost) return;
    set({
      shopStock: generateShop(),
      shopRefreshAt: now + 1000 * 60 * 30,
      gems: force ? state.gems - cost : state.gems,
    });
    persist(get());
  },

  claimAchievement: (id) => {
    const state = get();
    const ach = state.achievements[id];
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!ach || !def) return;
    if (ach.claimed || ach.progress < def.goal) return;
    let gold = state.gold + (def.reward.gold ?? 0);
    let gems = state.gems + (def.reward.gems ?? 0);
    let equipment = state.equipment;
    if (def.reward.itemId && equipment[def.reward.itemId]) {
      equipment = { ...equipment, [def.reward.itemId]: { ...equipment[def.reward.itemId], owned: equipment[def.reward.itemId].owned + 1 } };
    }
    set({
      gold, gems, equipment,
      achievements: { ...state.achievements, [id]: { ...ach, claimed: true } },
    });
    persist(get());
  },

  updateAchievementProgress: (id, delta) => {
    const state = get();
    const cur = state.achievements[id] ?? { progress: 0, claimed: false };
    set({ achievements: { ...state.achievements, [id]: { ...cur, progress: cur.progress + delta } } });
  },

  setBattleSpeed: (s) => { set({ battleSpeed: s }); persist(get()); },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with current data files (so new heroes/equipment appear).
        const heroes = { ...buildInitialHeroes() };
        for (const id in heroes) {
          if (parsed.heroes && parsed.heroes[id]) {
            heroes[id] = { ...heroes[id], ...parsed.heroes[id] };
          }
        }
        const equipment = { ...buildInitialEquipment() };
        for (const id in equipment) {
          if (parsed.equipment && parsed.equipment[id]) {
            equipment[id] = { ...equipment[id], ...parsed.equipment[id] };
          }
        }
        const achievements = { ...buildInitialAchievements(), ...(parsed.achievements ?? {}) };
        set({
          ...parsed,
          heroes,
          equipment,
          achievements,
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
      // Generate shop on first hydrate.
      if (get().shopStock.length === 0) {
        get().refreshShop();
      }
    } catch (e) {
      set({ hydrated: true });
    }
  },

  reset: () => {
    AsyncStorage.removeItem(SAVE_KEY).catch(() => {});
    set({ ...INITIAL_STATE, currentScreen: 'home', hydrated: true });
    get().refreshShop(true);
  },
}));

// Throttle persistence to avoid spamming on every state change.
let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persist(state: GameState) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const toSave = {
      gold: state.gold,
      gems: state.gems,
      heroes: state.heroes,
      equipment: state.equipment,
      levelProgress: state.levelProgress,
      achievements: state.achievements,
      shopStock: state.shopStock,
      shopRefreshAt: state.shopRefreshAt,
      arenaWave: state.arenaWave,
      arenaBestWave: state.arenaBestWave,
      battleSpeed: state.battleSpeed,
      totalBattles: state.totalBattles,
      totalVictories: state.totalVictories,
      totalDamageDealt: state.totalDamageDealt,
      totalKills: state.totalKills,
    };
    AsyncStorage.setItem(SAVE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, 250);
}

// ============================================================
// Effective stats: hero base + equipment + set bonuses + star bonuses
// ============================================================
export interface EffectiveStats extends HeroStats {
  power: number;
  setNames: string[];
}

export function getHeroEffectiveStats(heroId: string, store: GameStore): EffectiveStats | null {
  const hero = store.heroes[heroId];
  if (!hero) return null;
  const equipped = [
    hero.weaponId ? store.equipment[hero.weaponId] : null,
    hero.armorId ? store.equipment[hero.armorId] : null,
    hero.accessoryId ? store.equipment[hero.accessoryId] : null,
  ].filter(Boolean) as Equipment[];

  const sumBonus = (key: keyof Equipment['statBonus']): number =>
    equipped.reduce((s, it) => s + ((it.statBonus[key] as number | undefined) ?? 0), 0);

  // Set bonus check
  const setCounts: Record<string, number> = {};
  for (const it of equipped) {
    if (it.setId) setCounts[it.setId] = (setCounts[it.setId] ?? 0) + 1;
  }
  const activeSets: string[] = [];
  let setAttack = 0, setDefense = 0, setCrit = 0, setDodge = 0, setHp = 0;
  for (const [setId, count] of Object.entries(setCounts)) {
    const set = EQUIPMENT_SETS[setId];
    if (set && count >= set.pieces) {
      activeSets.push(set.name);
      setAttack += set.bonus.attack ?? 0;
      setDefense += set.bonus.defense ?? 0;
      setCrit += set.bonus.critRate ?? 0;
      setDodge += set.bonus.dodge ?? 0;
      setHp += set.bonus.hp ?? 0;
    }
  }

  const starMul = 1 + hero.stars * 0.05;

  const maxHp = Math.round((hero.baseStats.maxHp + sumBonus('hp') + setHp) * starMul);
  const attack = Math.round((hero.baseStats.attack + sumBonus('attack') + setAttack) * starMul);
  const defense = Math.round((hero.baseStats.defense + sumBonus('defense') + setDefense) * starMul);
  const speed = hero.baseStats.speed + sumBonus('speed');
  const critRate = Math.min(0.85, hero.baseStats.critRate + sumBonus('critRate') + setCrit);
  const critDamage = hero.baseStats.critDamage + sumBonus('critDamage');
  const dodge = Math.min(0.6, hero.baseStats.dodge + sumBonus('dodge') + setDodge);
  const maxMana = hero.baseStats.maxMana + sumBonus('maxMana');
  const manaRegen = hero.baseStats.manaRegen + sumBonus('manaRegen');

  const power = Math.round(maxHp * 0.4 + attack * 4 + defense * 3 + speed * 4 + critRate * 100 + (critDamage - 1) * 50);

  return {
    hp: maxHp,
    maxHp,
    attack,
    defense,
    speed,
    range: hero.baseStats.range,
    critRate,
    critDamage,
    dodge,
    maxMana,
    manaRegen,
    element: hero.baseStats.element,
    resistance: hero.baseStats.resistance,
    power,
    setNames: activeSets,
  };
}

// Team synergies (more than just sets — class quantity based).
export interface Synergy {
  id: string;
  name: string;
  description: string;
  active: boolean;
  count: number;
  threshold: number;
}

export function computeTeamSynergies(placedHeroIds: string[], store: GameStore): Synergy[] {
  const classes: Record<string, number> = {};
  const elements: Record<string, number> = {};
  for (const id of placedHeroIds) {
    const h = store.heroes[id];
    if (!h) continue;
    classes[h.heroClass] = (classes[h.heroClass] ?? 0) + 1;
    elements[h.baseStats.element] = (elements[h.baseStats.element] ?? 0) + 1;
  }

  const defs: Array<Omit<Synergy, 'active' | 'count'> & { source: 'class' | 'element'; key: string }> = [
    { id: 'warriors', name: 'Iron Wall', description: '2+ Warriors: all heroes +15% maxHP.', threshold: 2, source: 'class', key: 'Warrior' },
    { id: 'mages', name: 'Arcane Coven', description: '2+ Mages: all heroes +20% mana regen.', threshold: 2, source: 'class', key: 'Mage' },
    { id: 'rogues', name: 'Shadow Pact', description: '2+ Rogues: all heroes +10% dodge.', threshold: 2, source: 'class', key: 'Rogue' },
    { id: 'archers', name: 'Volley', description: '2+ Archers: all heroes +8% crit.', threshold: 2, source: 'class', key: 'Archer' },
    { id: 'paladins', name: 'Sanctified Ground', description: '2+ Paladins: allies +1 HP regen / tick.', threshold: 2, source: 'class', key: 'Paladin' },
    { id: 'healers', name: 'Faithful', description: '1+ Cleric: cleanse on heal.', threshold: 1, source: 'class', key: 'Cleric' },
    { id: 'fire', name: 'Inferno', description: '2+ Fire heroes: +15% fire damage.', threshold: 2, source: 'element', key: 'fire' },
    { id: 'ice', name: 'Permafrost', description: '2+ Ice heroes: +10% slow chance.', threshold: 2, source: 'element', key: 'ice' },
    { id: 'holy', name: 'Sanctity', description: '2+ Holy heroes: +25% holy damage.', threshold: 2, source: 'element', key: 'holy' },
    { id: 'shadow', name: 'Eclipse', description: '2+ Shadow heroes: +15% lifesteal.', threshold: 2, source: 'element', key: 'shadow' },
  ];

  return defs.map((d) => {
    const count = d.source === 'class' ? (classes[d.key] ?? 0) : (elements[d.key] ?? 0);
    return {
      id: d.id, name: d.name, description: d.description,
      threshold: d.threshold,
      active: count >= d.threshold,
      count,
    };
  }).filter((s) => s.count > 0);
}

// Class color helper re-export so screens can use without two imports.
export { CLASS_COLORS, ELEMENT_COLORS, ELEMENT_ICONS } from '../data/heroes';

// Arena enemy generation
export function generateArenaWave(wave: number): EnemyConfig[] {
  const tiers = ['Warrior', 'Archer', 'Mage', 'Rogue', 'Berserker', 'Paladin', 'Monk', 'Cleric', 'Druid', 'Necromancer'] as const;
  const elements: Element[] = ['physical', 'fire', 'ice', 'lightning', 'holy', 'shadow', 'nature'];
  const icons: Record<string, string[]> = {
    Warrior: ['🦹', '💀', '🏰', '🤺', '🛡️'],
    Archer: ['🏹', '🧝', '🤖'],
    Mage: ['🧙', '🔮', '👁️', '👻'],
    Rogue: ['🥷', '🦊', '🦝'],
    Berserker: ['🦬', '🦏', '🐺'],
    Paladin: ['👼', '😇'],
    Monk: ['🧘', '🐯'],
    Cleric: ['🕊️', '👼'],
    Druid: ['🐻', '🌳'],
    Necromancer: ['💀', '👻', '🧟'],
  };
  const enemyCount = Math.min(5, 2 + Math.floor(wave / 2));
  const lvl = Math.max(1, Math.floor(1 + wave * 1.2));
  const enemies: EnemyConfig[] = [];
  for (let i = 0; i < enemyCount; i++) {
    const klass = tiers[Math.floor(Math.random() * tiers.length)];
    const ico = icons[klass]?.[Math.floor(Math.random() * (icons[klass]?.length ?? 1))] ?? '👤';
    const element = elements[Math.floor(Math.random() * elements.length)];
    enemies.push({
      name: `${klass} #${wave}-${i+1}`,
      heroClass: klass,
      level: lvl,
      position: { col: 7 + (i % 3), row: i % 3 },
      icon: ico,
      element,
      stars: wave >= 10 && i === 0 ? 1 : 0,
      abilityId: undefined,
    });
  }
  return enemies;
}

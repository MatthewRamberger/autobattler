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
import { rollDailyQuests } from '../data/dailyQuests';
import { applyTalentBonuses, availableTalentTier, TALENTS } from '../data/talents';

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

  // Daily quests
  rollDailyQuestsIfStale: () => void;
  claimDailyQuest: (id: string) => void;

  // Auto-resolve grind: simulate N battles back-to-back.
  autoResolveLevel: (levelId: number, times: number) => Promise<{ wins: number; losses: number; goldGained: number; expGained: number }>;

  // Loadouts: save/load up to 3 placements.
  saveLoadout: (slotId: string, name: string) => void;
  applyLoadout: (slotId: string) => void;
  deleteLoadout: (slotId: string) => void;

  // Battle prediction (Monte Carlo).
  predictBattle: (levelId: number, samples?: number) => Promise<{ winRate: number; avgTicks: number }>;

  // Item enchanting (random affix at gem cost).
  enchantEquipment: (id: string) => void;

  // Auto-equip the best owned gear for a hero across all three slots.
  autoEquipBest: (heroId: string) => void;

  // Talents: pick the chosen talent for a tier.
  pickTalent: (heroId: string, tier: number, choice: number) => void;
  // Talents: reset all picks for a hero (costs gems).
  respecTalents: (heroId: string) => void;

  // Equipment dismantle: convert N copies of an item into shards.
  dismantleEquipment: (id: string, qty: number) => void;

  // Mystery chest: roll a weighted reward.
  openMysteryChest: (rarity: 'wooden' | 'silver' | 'gold' | 'mythic') => Promise<{ items: { id: string; qty: number }[]; gold: number; gems: number }>;

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

const INITIAL_STATE: GameState = {
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
  dailyQuests: [],
  dailyQuestProgress: {},
  dailyResetAt: 0,
  loginStreak: 0,
  lastLoginDay: 0,
  loadouts: {},
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
    const state = get();
    const { heroes, gold, dailyQuestProgress } = state;
    const hero = heroes[heroId];
    if (!hero) return;
    const cost = hero.level * 50;
    if (gold < cost) return;
    const newLevel = hero.level + 1;
    const statBoost = 1.12;
    const dq = dailyQuestProgress.daily_levelup ?? { progress: 0, claimed: false };
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
      dailyQuestProgress: { ...dailyQuestProgress, daily_levelup: { ...dq, progress: dq.progress + 1 } },
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
    // Distribute kills across the placed heroes evenly for stat tracking.
    const killsPerHero = heroIds.length > 0 ? Math.floor(stats.kills / heroIds.length) : 0;
    const extraKills = heroIds.length > 0 ? stats.kills - killsPerHero * heroIds.length : 0;
    let extraIdx = 0;
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
      const myKills = killsPerHero + (extraIdx++ < extraKills ? 1 : 0);
      updatedHeroes[heroId] = {
        ...hero, level: lvl, experience: newExp, experienceToNext: expNext, baseStats,
        battlesUsed: (hero.battlesUsed ?? 0) + 1,
        kills: (hero.kills ?? 0) + myKills,
      };
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
    if (won && state.currentLevelId === 13) bump('campaign');
    bump('kill_100', stats.kills);
    bump('damage_10000', stats.damage);

    const unlockedCount = Object.values(updatedHeroes).filter((h) => h.unlocked).length;
    ach['unlock_5_heroes'] = { ...(ach['unlock_5_heroes'] ?? { progress: 0, claimed: false }), progress: unlockedCount };

    // Daily quest progress
    const daily = { ...state.dailyQuestProgress };
    function bumpDaily(id: string, n: number = 1) {
      const cur = daily[id] ?? { progress: 0, claimed: false };
      daily[id] = { ...cur, progress: cur.progress + n };
    }
    if (won) bumpDaily('daily_battles');
    if (won && state.currentLevelId === -1) bumpDaily('daily_arena');
    bumpDaily('daily_damage', stats.damage);
    bumpDaily('daily_kills', stats.kills);

    set({
      gold: state.gold + (won ? gold : Math.floor(gold * 0.25)),
      gems: state.gems + (won ? 2 : 0),
      heroes: updatedHeroes,
      equipment: updatedEquipment,
      levelProgress: updatedProgress,
      achievements: ach,
      dailyQuestProgress: daily,
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
    const dq = get().dailyQuestProgress.daily_forge ?? { progress: 0, claimed: false };
    set({
      gold: gold - goldCost,
      equipment: {
        ...equipment,
        [id]: { ...item, level: newLevel, shards: item.shards - shardCost, statBonus: newStatBonus },
      },
      dailyQuestProgress: {
        ...get().dailyQuestProgress,
        daily_forge: { ...dq, progress: dq.progress + 1 },
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

  rollDailyQuestsIfStale: () => {
    const now = Date.now();
    const state = get();
    const today = Math.floor(now / 86400000);
    const dayChanged = today !== state.lastLoginDay;
    if (!dayChanged && state.dailyResetAt > now && state.dailyQuests.length > 0) return;

    const quests = rollDailyQuests();
    const progress: Record<string, { progress: number; claimed: boolean }> = {};
    for (const q of quests) progress[q.id] = { progress: 0, claimed: false };

    // Daily login bonus & streak (resets if >1 day gap).
    let streak = state.loginStreak;
    let bonusGold = 0;
    let bonusGems = 0;
    if (state.lastLoginDay === 0 || today - state.lastLoginDay > 1) {
      streak = 1;
    } else if (today > state.lastLoginDay) {
      streak += 1;
    }
    if (state.lastLoginDay !== today) {
      bonusGold = 100 + streak * 25;
      bonusGems = Math.min(20, streak * 2);
    }

    set({
      dailyQuests: quests,
      dailyQuestProgress: progress,
      dailyResetAt: (today + 1) * 86400000,
      loginStreak: streak,
      lastLoginDay: today,
      gold: state.gold + bonusGold,
      gems: state.gems + bonusGems,
    });
    persist(get());
  },

  claimDailyQuest: (id) => {
    const state = get();
    const quest = state.dailyQuests.find((q) => q.id === id);
    const prog = state.dailyQuestProgress[id];
    if (!quest || !prog) return;
    if (prog.claimed || prog.progress < quest.goal) return;
    set({
      gold: state.gold + (quest.reward.gold ?? 0),
      gems: state.gems + (quest.reward.gems ?? 0),
      dailyQuestProgress: { ...state.dailyQuestProgress, [id]: { ...prog, claimed: true } },
    });
    persist(get());
  },

  autoResolveLevel: async (levelId, times) => {
    // Lazy-import to avoid cycles.
    const { computeBattle, buildPlayerUnit, buildEnemyUnit } = await import('../utils/battleEngine');
    const { LEVELS } = await import('../data/levels');
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return { wins: 0, losses: 0, goldGained: 0, expGained: 0 };
    const state = get();
    let wins = 0, losses = 0, goldGained = 0, expGained = 0;
    for (let i = 0; i < times; i++) {
      const placedIds = Object.keys(state.placedHeroes);
      if (placedIds.length === 0) break;
      const playerUnits = placedIds.map((heroId) => {
        const hero = state.heroes[heroId];
        const stats = getHeroEffectiveStats(heroId, get())!;
        return buildPlayerUnit({
          heroId, name: hero.name, heroClass: hero.heroClass,
          maxHp: stats.maxHp, attack: stats.attack, defense: stats.defense,
          speed: stats.speed, range: stats.range,
          critRate: stats.critRate, critDamage: stats.critDamage, dodge: stats.dodge,
          maxMana: stats.maxMana, manaRegen: stats.manaRegen,
          element: stats.element, resistance: stats.resistance,
          position: state.placedHeroes[heroId], icon: hero.icon, portraitSeed: hero.portraitSeed,
          stars: hero.stars, abilityId: hero.abilityId,
        });
      });
      const enemyUnits = level.enemies.map((e, idx) => buildEnemyUnit({
        name: e.name, heroClass: e.heroClass, level: e.level,
        position: e.position, icon: e.icon, index: idx,
        element: e.element, stars: e.stars, abilityId: e.abilityId,
      }));
      const result = computeBattle(playerUnits, enemyUnits, { bossMechanic: level.bossMechanic });
      const won = result.won;
      const totalDmg = result.finalUnits.filter((u) => u.isPlayer).reduce((s, u) => s + u.damageDealt, 0);
      const totalKills = result.finalUnits.filter((u) => u.isPlayer).reduce((s, u) => s + u.killCount, 0);
      const gold = won ? level.rewards.gold : Math.floor(level.rewards.gold * 0.25);
      const exp = won ? level.rewards.experience : Math.floor(level.rewards.experience * 0.1);
      const drops = level.rewards.possibleDrops;
      const drop = won && Math.random() < 0.45 ? drops[Math.floor(Math.random() * drops.length)] : undefined;
      // Apply rewards via the existing path.
      get().applyBattleRewards(won, gold, exp, placedIds, { damage: totalDmg, kills: totalKills }, drop);
      if (won) { wins++; goldGained += gold; expGained += exp; }
      else losses++;
    }
    return { wins, losses, goldGained, expGained };
  },

  saveLoadout: (slotId, name) => {
    const state = get();
    if (Object.keys(state.placedHeroes).length === 0) return;
    set({
      loadouts: {
        ...state.loadouts,
        [slotId]: { name, placements: { ...state.placedHeroes } },
      },
    });
    persist(get());
  },

  applyLoadout: (slotId) => {
    const state = get();
    const lo = state.loadouts[slotId];
    if (!lo) return;
    // Only place heroes the player has unlocked.
    const placements: Record<string, GridPosition> = {};
    for (const [hid, pos] of Object.entries(lo.placements)) {
      if (state.heroes[hid]?.unlocked) placements[hid] = pos;
    }
    set({ placedHeroes: placements });
  },

  deleteLoadout: (slotId) => {
    const state = get();
    const { [slotId]: _, ...rest } = state.loadouts;
    set({ loadouts: rest });
    persist(get());
  },

  predictBattle: async (levelId, samples = 12) => {
    const { computeBattle, buildPlayerUnit, buildEnemyUnit } = await import('../utils/battleEngine');
    const { LEVELS } = await import('../data/levels');
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return { winRate: 0, avgTicks: 0 };
    const state = get();
    const placedIds = Object.keys(state.placedHeroes);
    if (placedIds.length === 0) return { winRate: 0, avgTicks: 0 };

    let wins = 0;
    let ticks = 0;
    for (let i = 0; i < samples; i++) {
      const playerUnits = placedIds.map((heroId) => {
        const hero = state.heroes[heroId];
        const stats = getHeroEffectiveStats(heroId, state)!;
        return buildPlayerUnit({
          heroId, name: hero.name, heroClass: hero.heroClass,
          maxHp: stats.maxHp, attack: stats.attack, defense: stats.defense,
          speed: stats.speed, range: stats.range,
          critRate: stats.critRate, critDamage: stats.critDamage, dodge: stats.dodge,
          maxMana: stats.maxMana, manaRegen: stats.manaRegen,
          element: stats.element, resistance: stats.resistance,
          position: state.placedHeroes[heroId], icon: hero.icon, portraitSeed: hero.portraitSeed,
          stars: hero.stars, abilityId: hero.abilityId,
        });
      });
      const enemyUnits = level.enemies.map((e, idx) => buildEnemyUnit({
        name: e.name, heroClass: e.heroClass, level: e.level,
        position: e.position, icon: e.icon, index: idx,
        element: e.element, stars: e.stars, abilityId: e.abilityId,
      }));
      const extraWaves = level.waves?.map((wave, wi) =>
        wave.map((e, idx) => buildEnemyUnit({
          name: e.name, heroClass: e.heroClass, level: e.level,
          position: e.position, icon: e.icon, index: 100 + wi * 10 + idx,
          element: e.element, stars: e.stars, abilityId: e.abilityId,
        }))
      );
      const result = computeBattle(playerUnits, enemyUnits, {
        bossMechanic: level.bossMechanic, extraWaves,
      });
      if (result.won) wins++;
      ticks += result.totalTicks;
    }
    return { winRate: wins / samples, avgTicks: Math.round(ticks / samples) };
  },

  enchantEquipment: (id) => {
    const state = get();
    const item = state.equipment[id];
    if (!item || item.owned <= 0) return;
    const cost = 25;
    if (state.gems < cost) return;
    // Pick a random affix not already on the item.
    type Affix = keyof Equipment['statBonus'];
    const candidates: Array<{ key: Affix; min: number; max: number; isPct?: boolean }> = [
      { key: 'attack', min: 3, max: 12 },
      { key: 'defense', min: 3, max: 12 },
      { key: 'hp', min: 10, max: 40 },
      { key: 'speed', min: 1, max: 2 },
      { key: 'critRate', min: 0.03, max: 0.08, isPct: true },
      { key: 'dodge', min: 0.03, max: 0.08, isPct: true },
      { key: 'maxMana', min: 10, max: 30 },
      { key: 'manaRegen', min: 1, max: 3 },
    ];
    const free = candidates.filter((c) => !(c.key in item.statBonus));
    const pool = free.length > 0 ? free : candidates;
    const affix = pool[Math.floor(Math.random() * pool.length)];
    const val = affix.isPct
      ? +(affix.min + Math.random() * (affix.max - affix.min)).toFixed(2)
      : Math.round(affix.min + Math.random() * (affix.max - affix.min));
    const updated: Equipment = {
      ...item,
      statBonus: { ...item.statBonus, [affix.key]: ((item.statBonus as any)[affix.key] ?? 0) + val },
    };
    set({
      gems: state.gems - cost,
      equipment: { ...state.equipment, [id]: updated },
    });
    persist(get());
  },

  autoEquipBest: (heroId) => {
    const state = get();
    const hero = state.heroes[heroId];
    if (!hero) return;
    // Helper: score an equipment piece for this hero.
    function score(eq: Equipment): number {
      let s = 0;
      const b = eq.statBonus;
      s += (b.attack ?? 0) * 4;
      s += (b.defense ?? 0) * 3;
      s += (b.hp ?? 0) * 0.4;
      s += (b.speed ?? 0) * 4;
      s += (b.critRate ?? 0) * 100;
      s += (b.critDamage ?? 0) * 50;
      s += (b.dodge ?? 0) * 60;
      s += (b.maxMana ?? 0) * 0.5;
      s += (b.manaRegen ?? 0) * 4;
      // Forge level adds value through statBonus already.
      // Set bonus heuristic: if other equipped items share the same set, prefer it.
      const otherEq = [
        hero.weaponId && state.equipment[hero.weaponId],
        hero.armorId && state.equipment[hero.armorId],
        hero.accessoryId && state.equipment[hero.accessoryId],
      ].filter((x): x is Equipment => !!x && x.id !== eq.id);
      const sameSet = otherEq.filter((o) => o.setId && o.setId === eq.setId).length;
      if (eq.setId && sameSet >= 1) s += 20;
      return s;
    }

    // We have to unequip current first to free slots, then equip best.
    let equipment = { ...state.equipment };
    let updatedHero: Hero = { ...hero };

    function unequipSlot(slot: 'weaponId' | 'armorId' | 'accessoryId') {
      const cur = updatedHero[slot] as string | null;
      if (cur) {
        equipment[cur] = { ...equipment[cur], owned: equipment[cur].owned + 1 };
        updatedHero = { ...updatedHero, [slot]: null };
      }
    }

    function equipSlot(slot: 'weaponId' | 'armorId' | 'accessoryId', id: string | null) {
      if (!id) return;
      const item = equipment[id];
      if (!item || item.owned <= 0) return;
      equipment[id] = { ...item, owned: item.owned - 1 };
      updatedHero = { ...updatedHero, [slot]: id };
    }

    // Unequip everything first (so previously-equipped items go into the picker pool).
    unequipSlot('weaponId'); unequipSlot('armorId'); unequipSlot('accessoryId');

    function pickBestFromCurrent(type: Equipment['type']): string | null {
      const available = Object.values(equipment).filter((e) =>
        e.type === type && e.owned > 0 &&
        (!e.requiredClass || e.requiredClass.includes(hero.heroClass))
      );
      if (available.length === 0) return null;
      const sorted = [...available].sort((a, b) => score(b) - score(a));
      return sorted[0]?.id ?? null;
    }

    const bestWeapon = pickBestFromCurrent('weapon');
    const bestArmor = pickBestFromCurrent('armor');
    const bestAccessory = pickBestFromCurrent('accessory');

    if (bestWeapon) equipSlot('weaponId', bestWeapon);
    if (bestArmor) equipSlot('armorId', bestArmor);
    if (bestAccessory) equipSlot('accessoryId', bestAccessory);

    set({
      equipment,
      heroes: { ...state.heroes, [heroId]: updatedHero },
    });
    persist(get());
  },

  pickTalent: (heroId, tier, choice) => {
    const state = get();
    const hero = state.heroes[heroId];
    if (!hero) return;
    const unlocked = availableTalentTier(hero.level);
    if (tier >= unlocked) return;
    const tierOptions = TALENTS[hero.heroClass]?.[tier];
    if (!tierOptions || choice < 0 || choice >= tierOptions.length) return;
    const current = hero.talentChoices ?? [-1, -1, -1, -1];
    if (current[tier] === choice) return;
    const updated = [...current];
    while (updated.length < 4) updated.push(-1);
    updated[tier] = choice;
    set({ heroes: { ...state.heroes, [heroId]: { ...hero, talentChoices: updated } } });
    persist(get());
  },

  respecTalents: (heroId) => {
    const state = get();
    const hero = state.heroes[heroId];
    if (!hero) return;
    const cost = 50;
    if (state.gems < cost) return;
    set({
      gems: state.gems - cost,
      heroes: { ...state.heroes, [heroId]: { ...hero, talentChoices: [-1, -1, -1, -1] } },
    });
    persist(get());
  },

  dismantleEquipment: (id, qty) => {
    const state = get();
    const item = state.equipment[id];
    if (!item || item.owned < qty || qty <= 0) return;
    // Yield depends on rarity.
    const rarityYield: Record<string, number> = {
      common: 1, rare: 3, epic: 8, legendary: 20, mythic: 50,
    };
    const shards = (rarityYield[item.rarity] ?? 1) * qty;
    set({
      equipment: {
        ...state.equipment,
        [id]: { ...item, owned: item.owned - qty, shards: item.shards + shards },
      },
    });
    persist(get());
  },

  openMysteryChest: async (rarity) => {
    const state = get();
    const costs: Record<typeof rarity, { gold?: number; gems?: number }> = {
      wooden: { gold: 200 },
      silver: { gold: 800 },
      gold: { gems: 30 },
      mythic: { gems: 100 },
    } as any;
    const cost = costs[rarity];
    if (cost.gold && state.gold < cost.gold) return { items: [], gold: 0, gems: 0 };
    if (cost.gems && state.gems < cost.gems) return { items: [], gold: 0, gems: 0 };

    // Reward weights per chest tier.
    const tierWeights: Record<typeof rarity, Partial<Record<string, number>>> = {
      wooden: { common: 60, rare: 30, epic: 9, legendary: 1, mythic: 0 },
      silver: { common: 20, rare: 50, epic: 25, legendary: 5, mythic: 0 },
      gold: { common: 5, rare: 25, epic: 40, legendary: 25, mythic: 5 },
      mythic: { common: 0, rare: 5, epic: 25, legendary: 50, mythic: 20 },
    } as any;
    const items: { id: string; qty: number }[] = [];
    const rolls = rarity === 'mythic' ? 5 : rarity === 'gold' ? 4 : rarity === 'silver' ? 3 : 2;
    const pool = Object.values(EQUIPMENT);
    for (let r = 0; r < rolls; r++) {
      // Weighted rarity pick.
      const weights = tierWeights[rarity];
      const totalW = Object.values(weights).reduce<number>((s, n) => s + (n ?? 0), 0);
      let roll = Math.random() * totalW;
      let pickedRarity = 'common';
      for (const [k, v] of Object.entries(weights)) {
        if (v == null) continue;
        if (roll < v) { pickedRarity = k; break; }
        roll -= v;
      }
      const candidates = pool.filter((p) => p.rarity === pickedRarity);
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      if (pick) items.push({ id: pick.id, qty: 1 });
    }
    // Bonus gold/gems.
    const bonusGold = rarity === 'mythic' ? 1000 : rarity === 'gold' ? 300 : rarity === 'silver' ? 100 : 30;
    const bonusGems = rarity === 'mythic' ? 25 : rarity === 'gold' ? 8 : rarity === 'silver' ? 2 : 0;

    // Apply rewards.
    const newEquipment = { ...state.equipment };
    for (const it of items) {
      const eq = newEquipment[it.id];
      if (eq) newEquipment[it.id] = { ...eq, owned: eq.owned + it.qty };
    }
    set({
      gold: state.gold - (cost.gold ?? 0) + bonusGold,
      gems: state.gems - (cost.gems ?? 0) + bonusGems,
      equipment: newEquipment,
    });
    persist(get());
    return { items, gold: bonusGold, gems: bonusGems };
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
      // Roll daily quests if stale or never set.
      get().rollDailyQuestsIfStale();
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
      dailyQuests: state.dailyQuests,
      dailyQuestProgress: state.dailyQuestProgress,
      dailyResetAt: state.dailyResetAt,
      loginStreak: state.loginStreak,
      lastLoginDay: state.lastLoginDay,
      loadouts: state.loadouts,
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

  const pre: HeroStats = {
    hp: Math.round((hero.baseStats.maxHp + sumBonus('hp') + setHp) * starMul),
    maxHp: Math.round((hero.baseStats.maxHp + sumBonus('hp') + setHp) * starMul),
    attack: Math.round((hero.baseStats.attack + sumBonus('attack') + setAttack) * starMul),
    defense: Math.round((hero.baseStats.defense + sumBonus('defense') + setDefense) * starMul),
    speed: hero.baseStats.speed + sumBonus('speed'),
    range: hero.baseStats.range,
    critRate: Math.min(0.85, hero.baseStats.critRate + sumBonus('critRate') + setCrit),
    critDamage: hero.baseStats.critDamage + sumBonus('critDamage'),
    dodge: Math.min(0.6, hero.baseStats.dodge + sumBonus('dodge') + setDodge),
    maxMana: hero.baseStats.maxMana + sumBonus('maxMana'),
    manaRegen: hero.baseStats.manaRegen + sumBonus('manaRegen'),
    element: hero.baseStats.element,
    resistance: hero.baseStats.resistance,
  };

  const withTalents = applyTalentBonuses(hero.heroClass, hero.talentChoices, hero.level, pre);
  const critRate = Math.min(0.95, withTalents.critRate);
  const dodge = Math.min(0.75, withTalents.dodge);

  const power = Math.round(
    withTalents.maxHp * 0.4 + withTalents.attack * 4 + withTalents.defense * 3 +
    withTalents.speed * 4 + critRate * 100 + (withTalents.critDamage - 1) * 50
  );

  return {
    ...withTalents,
    hp: withTalents.maxHp,
    critRate,
    dodge,
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

// Hero bonds: pairs of specific heroes give a bonus when both placed.
export const HERO_BONDS: Array<{ pair: [string, string]; name: string; bonus: string }> = [
  { pair: ['warrior_1', 'paladin_1'], name: 'Shield Brothers', bonus: 'Both gain +10% defense and +5% maxHP.' },
  { pair: ['mage_1', 'mage_2'], name: 'Elemental Convergence', bonus: 'Burn and freeze chance increased.' },
  { pair: ['archer_1', 'rogue_1'], name: 'Silent Hunt', bonus: 'Both gain +10% crit rate.' },
  { pair: ['cleric_1', 'paladin_2'], name: 'Dawn Communion', bonus: 'Healing effectiveness +25%.' },
  { pair: ['necro_1', 'druid_1'], name: 'Cycle of Souls', bonus: 'Both gain +15% lifesteal on basic attacks.' },
  { pair: ['monk_1', 'berserker_1'], name: 'Iron Fist Pact', bonus: 'Both gain +10% attack and +1 speed.' },
];

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

  const list: Synergy[] = defs.map((d) => {
    const count = d.source === 'class' ? (classes[d.key] ?? 0) : (elements[d.key] ?? 0);
    return {
      id: d.id, name: d.name, description: d.description,
      threshold: d.threshold,
      active: count >= d.threshold,
      count,
    };
  }).filter((s) => s.count > 0);

  // Active bonds (both heroes placed).
  const placedSet = new Set(placedHeroIds);
  for (const b of HERO_BONDS) {
    if (placedSet.has(b.pair[0]) && placedSet.has(b.pair[1])) {
      list.push({
        id: `bond_${b.pair[0]}_${b.pair[1]}`,
        name: `♥ ${b.name}`, description: b.bonus,
        threshold: 2, active: true, count: 2,
      });
    }
  }
  return list;
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

import { create } from 'zustand';
import { Hero, Equipment, GridPosition, GameState } from '../types';
import { HEROES } from '../data/heroes';
import { EQUIPMENT } from '../data/equipment';
import { getEquipmentById } from '../data/equipment';

interface GameStore extends GameState {
  // Navigation
  currentScreen: string;
  setScreen: (screen: string) => void;

  // Hero actions
  selectHero: (id: string | null) => void;
  levelUpHero: (heroId: string) => void;
  equipItem: (heroId: string, equipmentId: string) => void;
  unequipItem: (heroId: string, slot: 'weapon' | 'armor') => void;

  // Battle prep
  setCurrentLevel: (levelId: number | null) => void;
  placeHero: (heroId: string, pos: GridPosition) => void;
  removeHeroFromGrid: (heroId: string) => void;
  clearPlacements: () => void;

  // Rewards
  applyBattleRewards: (won: boolean, gold: number, exp: number, heroIds: string[], itemDrop?: string) => void;

  // Shop / unlock
  unlockHero: (heroId: string, cost: number) => void;
}

function buildInitialHeroes(): Record<string, Hero> {
  return Object.fromEntries(HEROES.map((h) => [h.id, { ...h }]));
}

function buildInitialEquipment(): Record<string, Equipment> {
  return Object.fromEntries(EQUIPMENT.map((e) => [e.id, { ...e }]));
}

export const useGameStore = create<GameStore>((set, get) => ({
  gold: 200,
  heroes: buildInitialHeroes(),
  equipment: buildInitialEquipment(),
  levelProgress: {},
  placedHeroes: {},
  currentLevelId: null,
  selectedHeroId: null,
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
    const statBoost = 1.15;
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
            maxHp: Math.round(hero.baseStats.maxHp * statBoost),
            attack: Math.round(hero.baseStats.attack * statBoost),
            defense: Math.round(hero.baseStats.defense * statBoost),
            speed: hero.baseStats.speed,
            range: hero.baseStats.range,
          },
        },
      },
    });
  },

  equipItem: (heroId, equipmentId) => {
    const { heroes, equipment } = get();
    const hero = heroes[heroId];
    const item = equipment[equipmentId];
    if (!hero || !item || item.owned <= 0) return;

    const slot = item.type === 'weapon' ? 'weaponId' : 'armorId';
    const currentEquipped = hero[slot];

    const updatedEquipment = { ...equipment };
    // Return old item
    if (currentEquipped) {
      updatedEquipment[currentEquipped] = {
        ...updatedEquipment[currentEquipped],
        owned: updatedEquipment[currentEquipped].owned + 1,
      };
    }
    // Equip new item
    updatedEquipment[equipmentId] = { ...item, owned: item.owned - 1 };

    set({
      heroes: { ...heroes, [heroId]: { ...hero, [slot]: equipmentId } },
      equipment: updatedEquipment,
    });
  },

  unequipItem: (heroId, slot) => {
    const { heroes, equipment } = get();
    const hero = heroes[heroId];
    if (!hero) return;
    const itemIdKey = slot === 'weapon' ? 'weaponId' : 'armorId';
    const itemId = hero[itemIdKey];
    if (!itemId) return;

    const updatedEquipment = { ...equipment };
    updatedEquipment[itemId] = { ...updatedEquipment[itemId], owned: updatedEquipment[itemId].owned + 1 };

    set({
      heroes: { ...heroes, [heroId]: { ...hero, [itemIdKey]: null } },
      equipment: updatedEquipment,
    });
  },

  setCurrentLevel: (levelId) => set({ currentLevelId: levelId, placedHeroes: {} }),

  placeHero: (heroId, pos) => {
    const { placedHeroes } = get();
    // Remove from any old position
    const cleaned = Object.fromEntries(
      Object.entries(placedHeroes).filter(([id]) => id !== heroId)
    );
    // Remove any other hero on same cell
    const deduped = Object.fromEntries(
      Object.entries(cleaned).filter(([, p]) => !(p.col === pos.col && p.row === pos.row))
    );
    set({ placedHeroes: { ...deduped, [heroId]: pos } });
  },

  removeHeroFromGrid: (heroId) => {
    const { placedHeroes } = get();
    const updated = { ...placedHeroes };
    delete updated[heroId];
    set({ placedHeroes: updated });
  },

  clearPlacements: () => set({ placedHeroes: {} }),

  applyBattleRewards: (won, gold, exp, heroIds, itemDrop) => {
    const { heroes, equipment, levelProgress, currentLevelId } = get();
    if (!won) return;

    const updatedHeroes = { ...heroes };
    for (const heroId of heroIds) {
      const hero = updatedHeroes[heroId];
      if (!hero) continue;
      const newExp = hero.experience + exp;
      updatedHeroes[heroId] = { ...hero, experience: newExp };
    }

    const updatedEquipment = { ...equipment };
    if (itemDrop && updatedEquipment[itemDrop]) {
      updatedEquipment[itemDrop] = {
        ...updatedEquipment[itemDrop],
        owned: updatedEquipment[itemDrop].owned + 1,
      };
    }

    const updatedProgress = { ...levelProgress };
    if (currentLevelId !== null) {
      updatedProgress[currentLevelId] = { completed: true, stars: 3 };
    }

    set({
      gold: get().gold + gold,
      heroes: updatedHeroes,
      equipment: updatedEquipment,
      levelProgress: updatedProgress,
    });
  },

  unlockHero: (heroId, cost) => {
    const { heroes, gold } = get();
    if (gold < cost || !heroes[heroId]) return;
    set({
      gold: gold - cost,
      heroes: { ...heroes, [heroId]: { ...heroes[heroId], unlocked: true } },
    });
  },
}));

export function getHeroEffectiveStats(heroId: string, store: GameStore) {
  const hero = store.heroes[heroId];
  if (!hero) return null;
  const weapon = hero.weaponId ? store.equipment[hero.weaponId] : null;
  const armor = hero.armorId ? store.equipment[hero.armorId] : null;

  const weaponBonus = weapon?.statBonus ?? {};
  const armorBonus = armor?.statBonus ?? {};

  return {
    maxHp: hero.baseStats.maxHp + (weaponBonus.hp ?? 0) + (armorBonus.hp ?? 0),
    attack: hero.baseStats.attack + (weaponBonus.attack ?? 0) + (armorBonus.attack ?? 0),
    defense: hero.baseStats.defense + (weaponBonus.defense ?? 0) + (armorBonus.defense ?? 0),
    speed: hero.baseStats.speed + (weaponBonus.speed ?? 0) + (armorBonus.speed ?? 0),
    range: hero.baseStats.range,
  };
}

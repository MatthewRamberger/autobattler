export type HeroClass = 'Warrior' | 'Archer' | 'Mage' | 'Paladin' | 'Rogue' | 'Berserker';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type EquipmentType = 'weapon' | 'armor';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'boss';

export interface HeroStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  rarity: Rarity;
  icon: string;
  statBonus: Partial<Pick<HeroStats, 'hp' | 'attack' | 'defense' | 'speed'>>;
  requiredClass?: HeroClass[];
  owned: number;
}

export interface Hero {
  id: string;
  name: string;
  heroClass: HeroClass;
  level: number;
  experience: number;
  experienceToNext: number;
  baseStats: Omit<HeroStats, 'hp' | 'maxHp'> & { maxHp: number };
  weaponId: string | null;
  armorId: string | null;
  unlocked: boolean;
  rarity: Rarity;
  icon: string;
  description: string;
}

export interface GridPosition {
  col: number;
  row: number;
}

export interface BattleUnit {
  id: string;
  heroId: string;
  name: string;
  heroClass: HeroClass;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  position: GridPosition;
  isPlayer: boolean;
  isAlive: boolean;
  ticksUntilAttack: number;
  icon: string;
}

export interface BattleLogEntry {
  tick: number;
  text: string;
  type: 'attack' | 'death' | 'miss' | 'victory' | 'defeat';
  attackerId?: string;
  targetId?: string;
  damage?: number;
}

export interface BattleResult {
  won: boolean;
  log: BattleLogEntry[];
  survivingPlayerUnits: string[];
  goldEarned: number;
  expEarned: number;
  itemDropped?: string;
}

export interface EnemyConfig {
  name: string;
  heroClass: HeroClass;
  level: number;
  position: GridPosition;
  icon: string;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  enemies: EnemyConfig[];
  rewards: {
    gold: number;
    experience: number;
    possibleDrops: string[];
  };
}

export type Screen =
  | 'home'
  | 'collection'
  | 'equipment'
  | 'levels'
  | 'hero-detail'
  | 'battle-prep'
  | 'battle';

export interface GameState {
  gold: number;
  heroes: Record<string, Hero>;
  equipment: Record<string, Equipment>;
  levelProgress: Record<number, { completed: boolean; stars: number }>;
  placedHeroes: Record<string, GridPosition>;
  currentLevelId: number | null;
  selectedHeroId: string | null;
}

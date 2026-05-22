export type HeroClass = 'Warrior' | 'Archer' | 'Mage' | 'Paladin' | 'Rogue' | 'Berserker' | 'Cleric' | 'Druid' | 'Necromancer' | 'Monk';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type EquipmentType = 'weapon' | 'armor' | 'accessory';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'boss' | 'nightmare';
export type Element = 'physical' | 'fire' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'nature';
export type StatusEffectType =
  | 'poison'
  | 'burn'
  | 'stun'
  | 'freeze'
  | 'slow'
  | 'regen'
  | 'shield'
  | 'taunt'
  | 'rage'
  | 'bleed'
  | 'blind'
  | 'silence'
  | 'fortify';

export interface HeroStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  critRate: number;     // 0..1
  critDamage: number;   // 1.5 = 150% etc.
  dodge: number;        // 0..1
  maxMana: number;
  manaRegen: number;
  element: Element;
  resistance: Partial<Record<Element, number>>; // damage multiplier modifier (0..1)
}

export interface AbilityDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  manaCost: number;
  cooldownTicks: number;
  element: Element;
  // Generic data buckets so the engine can dispatch on `kind`.
  kind:
    | 'aoe'
    | 'multistrike'
    | 'heal'
    | 'buff'
    | 'execute'
    | 'lifesteal'
    | 'taunt'
    | 'chain'
    | 'dot';
  data: {
    power?: number;         // damage/heal multiplier
    radius?: number;        // for AoE
    targets?: number;       // for chain/multi
    status?: StatusEffectType;
    duration?: number;
    statusPower?: number;
    selfBuff?: Partial<Pick<HeroStats, 'attack' | 'defense' | 'speed' | 'critRate'>>;
  };
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  rarity: Rarity;
  icon: string;
  level: number;       // forge level 0..5
  statBonus: Partial<
    Pick<HeroStats, 'hp' | 'attack' | 'defense' | 'speed' | 'critRate' | 'critDamage' | 'dodge' | 'maxMana' | 'manaRegen'>
  >;
  setId?: string;      // equipment sets that grant synergy bonuses
  requiredClass?: HeroClass[];
  owned: number;
  shards: number;      // shards needed to forge, accumulated as drops
}

export interface Hero {
  id: string;
  name: string;
  heroClass: HeroClass;
  level: number;
  stars: number;            // ascension level, 0..5
  // Card rank, 0..5. Raised by combining duplicate hero cards. Each rank
  // grants a flat permanent multiplier to the hero's core stats.
  rank?: number;
  experience: number;
  experienceToNext: number;
  baseStats: Omit<HeroStats, 'hp'>;  // maxHp is in baseStats
  abilityId: string;
  passiveDesc?: string;
  weaponId: string | null;
  armorId: string | null;
  accessoryId: string | null;
  unlocked: boolean;
  rarity: Rarity;
  icon: string;
  portraitSeed: number;    // drives portrait generation
  description: string;
  favorite?: boolean;
  // Talent tree: choice index 0/1 per tier (4 tiers). Unlocked at hero
  // level 5/10/15/20 respectively. -1 means not yet picked.
  talentChoices?: number[];
  // Per-hero career stats
  battlesUsed?: number;
  kills?: number;
}

export interface GridPosition {
  col: number;
  row: number;
}

export interface ActiveStatusEffect {
  type: StatusEffectType;
  ticksRemaining: number;
  power: number;          // damage per tick, or %, or shield amount
  sourceId?: string;
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
  critRate: number;
  critDamage: number;
  dodge: number;
  mana: number;
  maxMana: number;
  manaRegen: number;
  element: Element;
  resistance: Partial<Record<Element, number>>;
  position: GridPosition;
  isPlayer: boolean;
  isAlive: boolean;
  ticksUntilAttack: number;
  ticksUntilAbility: number;
  icon: string;
  portraitSeed: number;
  abilityId?: string;
  statuses: ActiveStatusEffect[];
  shield: number;          // current shield value (mitigates next hits)
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  killCount: number;
  stars: number;
}

export interface FloatingNumber {
  id: string;
  tick: number;
  unitId: string;
  value: number;
  kind: 'damage' | 'heal' | 'crit' | 'dodge' | 'shield' | 'status';
  text?: string;
  color?: string;
}

export interface BattleLogEntry {
  tick: number;
  text: string;
  type:
    | 'attack'
    | 'death'
    | 'miss'
    | 'dodge'
    | 'crit'
    | 'ability'
    | 'heal'
    | 'status'
    | 'victory'
    | 'defeat'
    | 'wave'
    | 'system';
  attackerId?: string;
  targetId?: string;
  damage?: number;
  heal?: number;
  element?: Element;
}

export interface BattleEvent {
  tick: number;
  kind:
    | 'move'
    | 'attack'
    | 'crit'
    | 'dodge'
    | 'damage'
    | 'death'
    | 'ability'
    | 'heal'
    | 'shield'
    | 'status_apply'
    | 'status_tick'
    | 'status_expire'
    | 'projectile'
    | 'mana'
    | 'victory'
    | 'defeat'
    | 'wave'
    | 'spawn';
  sourceId?: string;
  targetId?: string;
  targetIds?: string[];
  value?: number;
  text?: string;
  status?: StatusEffectType;
  element?: Element;
  toPosition?: GridPosition;
  fromPosition?: GridPosition;
  unit?: BattleUnit;
}

export interface BattleResult {
  won: boolean;
  log: BattleLogEntry[];
  events: BattleEvent[];
  finalUnits: BattleUnit[];
  survivingPlayerUnits: string[];
  goldEarned: number;
  expEarned: number;
  itemDropped?: string;
  totalTicks: number;
}

export interface EnemyConfig {
  name: string;
  heroClass: HeroClass;
  level: number;
  position: GridPosition;
  icon: string;
  element?: Element;
  stars?: number;        // boss tier
  abilityId?: string;
}

export type MapTheme =
  | 'plains'
  | 'forest'
  | 'ruins'
  | 'tundra'
  | 'inferno'
  | 'shadow'
  | 'celestial'
  | 'volcanic'
  | 'undead'
  | 'siege';

export type ObstacleKind =
  | 'rock'        // gray boulder
  | 'tree'        // pine
  | 'bush'        // small shrub
  | 'banner'      // flag/standard
  | 'tower'       // small watchtower
  | 'fortress'    // large keep
  | 'gate'        // arched gateway
  | 'crystal'     // magical crystal
  | 'icicle'      // ice spike
  | 'skull'       // bone pile
  | 'tomb'        // gravestone
  | 'fire'        // flame
  | 'lava'        // lava pool
  | 'magma'       // magma rock
  | 'pillar'      // ancient column
  | 'altar'       // sacrificial altar
  | 'orb'         // floating orb
  | 'tent'        // war tent
  | 'cauldron';   // boiling cauldron

export interface Obstacle {
  col: number;
  row: number;
  kind: ObstacleKind;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  enemies: EnemyConfig[];
  waves?: EnemyConfig[][];   // multi-wave levels
  bossMechanic?: 'enrage' | 'summon' | 'aoe-burst' | 'lifelink';
  rewards: {
    gold: number;
    experience: number;
    possibleDrops: string[];
  };
  recommendedPower?: number;
  // Optional larger battlefield. Levels left at `undefined` use the
  // default 9×5 grid; 'siege' uses the 22×11 scrolling battlefield
  // with up to 12 heroes per side.
  mapSize?: 'small' | 'siege';
  // Optional override of the placement cap (defaults to the grid's
  // maxHeroes — 5 for small, 12 for siege).
  maxHeroes?: number;
  // Visual theming for the battlefield. Drives background gradient
  // and per-tile tint. Defaults to 'plains' if omitted.
  theme?: MapTheme;
  // Decorative props rendered in the contested column. Purely visual
  // (do not block movement) but make each map feel unique.
  obstacles?: Obstacle[];
}

export type Screen =
  | 'home'
  | 'collection'
  | 'equipment'
  | 'levels'
  | 'battle-prep'
  | 'battle'
  | 'shop'
  | 'achievements'
  | 'arena'
  | 'forge'
  | 'daily'
  | 'stats'
  | 'codex'
  | 'chests'
  | 'stronghold'
  | 'settings'
  | 'summon';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  goal: number;
  reward: { gold?: number; itemId?: string; gems?: number };
}

export interface AchievementProgress {
  progress: number;
  claimed: boolean;
}

export interface ShopItem {
  id: string;
  itemId: string;    // equipment id OR 'shards:itemId' OR 'gems' OR 'heroSlot:heroId'
  cost: number;
  currency: 'gold' | 'gems';
  stock: number;
  label?: string;
}

export interface LevelProgressEntry {
  completed: boolean;
  stars: number;
  bestTime?: number;
  difficulty?: Difficulty;
}

export interface GameState {
  gold: number;
  gems: number;
  heroes: Record<string, Hero>;
  // Hero cards owned per hero id. Cards are earned from chests, summons and
  // battles. Each card is a deployable copy AND fuel for rank-up combining.
  heroCards: Record<string, number>;
  equipment: Record<string, Equipment>;
  levelProgress: Record<number, LevelProgressEntry>;
  // Battlefield placements. The KEY is a placement-instance id, not a hero
  // id: the first copy of a hero uses the bare hero id, extra copies use
  // `${heroId}#2`, `${heroId}#3`, … so the same hero can be deployed
  // multiple times. Use `heroIdOfPlacement` to recover the hero id.
  placedHeroes: Record<string, GridPosition>;
  currentLevelId: number | null;
  selectedHeroId: string | null;
  arenaWave: number;
  arenaBestWave: number;
  achievements: Record<string, AchievementProgress>;
  shopStock: ShopItem[];
  shopRefreshAt: number;
  battleSpeed: 1 | 2 | 4;
  totalBattles: number;
  totalVictories: number;
  totalDamageDealt: number;
  totalKills: number;
  hydrated: boolean;
  // Daily quests
  dailyQuests: Achievement[];
  dailyQuestProgress: Record<string, AchievementProgress>;
  dailyResetAt: number;
  loginStreak: number;
  lastLoginDay: number; // floor(Date.now() / 86400000)

  // Up to 3 saved team compositions (name -> placement map)
  loadouts: Record<string, { name: string; placements: Record<string, GridPosition> }>;

  // Stronghold building levels (per-building 0..maxLevel)
  stronghold: Record<string, number>;

  // User settings
  settings: {
    particles: boolean;
    reduceMotion: boolean;
    autoFastForward: boolean;
    turnByTurn: boolean;
  };
}

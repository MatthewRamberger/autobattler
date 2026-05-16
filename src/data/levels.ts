import { Level } from '../types';

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Goblin Camp',
    description: 'A small band of goblin scouts have set up camp nearby.',
    difficulty: 'easy',
    enemies: [
      { name: 'Goblin Scout', heroClass: 'Rogue', level: 1, position: { col: 4, row: 1 }, icon: '👺' },
      { name: 'Goblin Grunt', heroClass: 'Warrior', level: 1, position: { col: 3, row: 2 }, icon: '👺' },
    ],
    rewards: { gold: 50, experience: 30, possibleDrops: ['sword_iron', 'armor_leather'] },
  },
  {
    id: 2,
    name: 'Bandit Crossroads',
    description: 'Bandits have taken control of the crossroads. Clear them out.',
    difficulty: 'easy',
    enemies: [
      { name: 'Bandit', heroClass: 'Warrior', level: 2, position: { col: 4, row: 0 }, icon: '🦹' },
      { name: 'Bandit', heroClass: 'Warrior', level: 2, position: { col: 4, row: 2 }, icon: '🦹' },
      { name: 'Bandit Archer', heroClass: 'Archer', level: 2, position: { col: 3, row: 1 }, icon: '🦹' },
    ],
    rewards: { gold: 80, experience: 50, possibleDrops: ['bow_oak', 'armor_chain', 'dagger_shadow'] },
  },
  {
    id: 3,
    name: 'The Dark Forest',
    description: 'Ancient evil stirs in the depths of the forest.',
    difficulty: 'medium',
    enemies: [
      { name: 'Forest Troll', heroClass: 'Berserker', level: 3, position: { col: 4, row: 1 }, icon: '👹' },
      { name: 'Dark Sprite', heroClass: 'Mage', level: 3, position: { col: 3, row: 0 }, icon: '🧚' },
      { name: 'Dark Sprite', heroClass: 'Mage', level: 3, position: { col: 3, row: 2 }, icon: '🧚' },
    ],
    rewards: { gold: 120, experience: 80, possibleDrops: ['staff_apprentice', 'robe_mystic', 'bow_elven'] },
  },
  {
    id: 4,
    name: "Skeleton Keep",
    description: 'An undead army rises from the ruins of an ancient fortress.',
    difficulty: 'medium',
    enemies: [
      { name: 'Skeleton Warrior', heroClass: 'Warrior', level: 4, position: { col: 4, row: 0 }, icon: '💀' },
      { name: 'Skeleton Warrior', heroClass: 'Warrior', level: 4, position: { col: 4, row: 2 }, icon: '💀' },
      { name: 'Skeleton Archer', heroClass: 'Archer', level: 4, position: { col: 3, row: 1 }, icon: '💀' },
      { name: 'Necromancer', heroClass: 'Mage', level: 4, position: { col: 2, row: 1 }, icon: '🧙' },
    ],
    rewards: { gold: 160, experience: 110, possibleDrops: ['sword_steel', 'armor_plate', 'axe_battle'] },
  },
  {
    id: 5,
    name: 'The Dragon Pass',
    description: 'Elite mercenaries guard the mountain pass. A hard fight awaits.',
    difficulty: 'hard',
    enemies: [
      { name: 'Elite Knight', heroClass: 'Warrior', level: 5, position: { col: 4, row: 1 }, icon: '🏰' },
      { name: 'Ranger Captain', heroClass: 'Archer', level: 5, position: { col: 3, row: 0 }, icon: '🧝' },
      { name: 'Assassin', heroClass: 'Rogue', level: 5, position: { col: 3, row: 2 }, icon: '🥷' },
      { name: 'War Mage', heroClass: 'Mage', level: 5, position: { col: 2, row: 1 }, icon: '🧙' },
    ],
    rewards: { gold: 220, experience: 150, possibleDrops: ['staff_arcane', 'cloak_shadow', 'sword_steel'] },
  },
  {
    id: 6,
    name: 'The Shadow Citadel',
    description: 'The lair of the Shadow Lord. Only the strongest survive.',
    difficulty: 'hard',
    enemies: [
      { name: 'Shadow Guard', heroClass: 'Warrior', level: 6, position: { col: 4, row: 0 }, icon: '🌑' },
      { name: 'Shadow Guard', heroClass: 'Warrior', level: 6, position: { col: 4, row: 2 }, icon: '🌑' },
      { name: 'Shadow Mage', heroClass: 'Mage', level: 6, position: { col: 3, row: 1 }, icon: '🌑' },
      { name: 'Shadow Rogue', heroClass: 'Rogue', level: 6, position: { col: 2, row: 0 }, icon: '🌑' },
      { name: 'Shadow Archer', heroClass: 'Archer', level: 6, position: { col: 2, row: 2 }, icon: '🌑' },
    ],
    rewards: { gold: 300, experience: 200, possibleDrops: ['armor_dragonscale', 'bow_elven', 'staff_arcane'] },
  },
  {
    id: 7,
    name: 'Boss: The Shadow Lord',
    description: 'The final confrontation. Destroy the Shadow Lord and bring peace.',
    difficulty: 'boss',
    enemies: [
      { name: 'Shadow Knight', heroClass: 'Warrior', level: 8, position: { col: 4, row: 0 }, icon: '👑' },
      { name: 'Shadow Knight', heroClass: 'Warrior', level: 8, position: { col: 4, row: 2 }, icon: '👑' },
      { name: 'Shadow Lord', heroClass: 'Berserker', level: 10, position: { col: 3, row: 1 }, icon: '👿' },
      { name: 'Dark Mage', heroClass: 'Mage', level: 8, position: { col: 2, row: 0 }, icon: '🔮' },
      { name: 'Dark Mage', heroClass: 'Mage', level: 8, position: { col: 2, row: 2 }, icon: '🔮' },
    ],
    rewards: { gold: 500, experience: 350, possibleDrops: ['sword_legendary', 'armor_mythril', 'armor_dragonscale'] },
  },
];

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#27ae60',
  medium: '#f39c12',
  hard: '#e74c3c',
  boss: '#8e44ad',
};

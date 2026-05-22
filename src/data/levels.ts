import { Level } from '../types';

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Goblin Camp',
    description: 'A small band of goblin scouts have set up camp nearby.',
    difficulty: 'easy',
    theme: 'plains',
    obstacles: [
      { col: 4, row: 0, kind: 'banner' },
      { col: 4, row: 4, kind: 'tent' },
      { col: 4, row: 2, kind: 'rock' },
    ],
    enemies: [
      { name: 'Goblin Scout', heroClass: 'Rogue', level: 1, position: { col: 5, row: 2 }, icon: '👺', element: 'physical' },
      { name: 'Goblin Grunt', heroClass: 'Warrior', level: 2, position: { col: 6, row: 3 }, icon: '👺', element: 'physical' },
    ],
    rewards: { gold: 50, experience: 30, possibleDrops: ['sword_iron', 'armor_leather', 'ring_vitality'] },
    recommendedPower: 200,
  },
  {
    id: 2,
    name: 'Bandit Crossroads',
    description: 'Bandits have taken control of the crossroads. Clear them out.',
    difficulty: 'easy',
    theme: 'plains',
    obstacles: [
      { col: 4, row: 0, kind: 'banner' },
      { col: 4, row: 2, kind: 'tower' },
      { col: 4, row: 4, kind: 'banner' },
      { col: 7, row: 0, kind: 'tree' },
      { col: 7, row: 4, kind: 'tree' },
    ],
    enemies: [
      { name: 'Bandit', heroClass: 'Warrior', level: 3, position: { col: 5, row: 1 }, icon: '🦹', element: 'physical' },
      { name: 'Bandit', heroClass: 'Warrior', level: 3, position: { col: 5, row: 3 }, icon: '🦹', element: 'physical' },
      { name: 'Bandit Archer', heroClass: 'Archer', level: 4, position: { col: 6, row: 2 }, icon: '🦹', element: 'physical' },
    ],
    rewards: { gold: 80, experience: 50, possibleDrops: ['bow_oak', 'armor_chain', 'dagger_shadow', 'ring_swift'] },
    recommendedPower: 500,
  },
  {
    id: 3,
    name: 'The Dark Forest',
    description: 'Ancient evil stirs in the depths of the forest.',
    difficulty: 'medium',
    theme: 'forest',
    obstacles: [
      { col: 4, row: 0, kind: 'tree' },
      { col: 4, row: 4, kind: 'tree' },
      { col: 4, row: 2, kind: 'bush' },
      { col: 7, row: 0, kind: 'tree' },
      { col: 7, row: 4, kind: 'tree' },
      { col: 1, row: 0, kind: 'bush' },
      { col: 1, row: 4, kind: 'bush' },
    ],
    enemies: [
      { name: 'Forest Troll', heroClass: 'Berserker', level: 6, position: { col: 5, row: 2 }, icon: '👹', element: 'nature' },
      { name: 'Dark Sprite', heroClass: 'Mage', level: 5, position: { col: 6, row: 1 }, icon: '🧚', element: 'shadow' },
      { name: 'Dark Sprite', heroClass: 'Mage', level: 5, position: { col: 6, row: 3 }, icon: '🧚', element: 'shadow' },
    ],
    rewards: { gold: 120, experience: 80, possibleDrops: ['staff_apprentice', 'robe_mystic', 'bow_elven', 'amulet_fury'] },
    recommendedPower: 1200,
  },
  {
    id: 4,
    name: "Skeleton Keep",
    description: 'An undead army rises from the ruins of an ancient fortress.',
    difficulty: 'medium',
    theme: 'ruins',
    obstacles: [
      { col: 4, row: 0, kind: 'pillar' },
      { col: 4, row: 4, kind: 'pillar' },
      { col: 4, row: 2, kind: 'tomb' },
      { col: 8, row: 0, kind: 'fortress' },
      { col: 8, row: 4, kind: 'fortress' },
      { col: 8, row: 2, kind: 'gate' },
    ],
    enemies: [
      { name: 'Skeleton Warrior', heroClass: 'Warrior', level: 9, position: { col: 5, row: 1 }, icon: '💀', element: 'shadow' },
      { name: 'Skeleton Warrior', heroClass: 'Warrior', level: 9, position: { col: 5, row: 3 }, icon: '💀', element: 'shadow' },
      { name: 'Skeleton Archer', heroClass: 'Archer', level: 9, position: { col: 6, row: 2 }, icon: '💀', element: 'shadow' },
      { name: 'Necromancer', heroClass: 'Necromancer', level: 10, position: { col: 7, row: 2 }, icon: '🧙', element: 'shadow', abilityId: 'drainlife' },
    ],
    rewards: { gold: 160, experience: 110, possibleDrops: ['sword_steel', 'armor_plate', 'axe_battle', 'amulet_focus'] },
    recommendedPower: 2200,
  },
  {
    id: 5,
    name: 'Frozen Tundra',
    description: 'A blizzard hides an icy ambush.',
    difficulty: 'medium',
    theme: 'tundra',
    obstacles: [
      { col: 4, row: 0, kind: 'icicle' },
      { col: 4, row: 2, kind: 'icicle' },
      { col: 4, row: 4, kind: 'icicle' },
      { col: 7, row: 0, kind: 'rock' },
      { col: 7, row: 4, kind: 'rock' },
      { col: 1, row: 2, kind: 'icicle' },
    ],
    enemies: [
      { name: 'Ice Wraith', heroClass: 'Mage', level: 12, position: { col: 6, row: 1 }, icon: '👻', element: 'ice', abilityId: 'frostnova' },
      { name: 'Frostfang Wolf', heroClass: 'Rogue', level: 11, position: { col: 5, row: 2 }, icon: '🐺', element: 'ice' },
      { name: 'Frostfang Wolf', heroClass: 'Rogue', level: 11, position: { col: 5, row: 3 }, icon: '🐺', element: 'ice' },
      { name: 'Yeti', heroClass: 'Berserker', level: 13, position: { col: 6, row: 2 }, icon: '🦣', element: 'ice' },
    ],
    rewards: { gold: 200, experience: 140, possibleDrops: ['robe_archmage', 'cloak_shadow', 'amulet_ward', 'gi_monk'] },
    recommendedPower: 3500,
  },
  {
    id: 6,
    name: 'The Dragon Pass',
    description: 'Elite mercenaries guard the mountain pass. A hard fight awaits.',
    difficulty: 'hard',
    theme: 'ruins',
    obstacles: [
      { col: 4, row: 0, kind: 'rock' },
      { col: 4, row: 4, kind: 'rock' },
      { col: 4, row: 2, kind: 'banner' },
      { col: 8, row: 0, kind: 'tower' },
      { col: 8, row: 4, kind: 'tower' },
      { col: 8, row: 2, kind: 'fortress' },
    ],
    enemies: [
      { name: 'Elite Knight', heroClass: 'Warrior', level: 16, position: { col: 5, row: 2 }, icon: '🏰', element: 'physical' },
      { name: 'Ranger Captain', heroClass: 'Archer', level: 15, position: { col: 6, row: 1 }, icon: '🧝', element: 'physical' },
      { name: 'Assassin', heroClass: 'Rogue', level: 15, position: { col: 6, row: 3 }, icon: '🥷', element: 'shadow' },
      { name: 'War Mage', heroClass: 'Mage', level: 17, position: { col: 7, row: 2 }, icon: '🧙', element: 'fire' },
    ],
    rewards: { gold: 260, experience: 180, possibleDrops: ['staff_arcane', 'cloak_shadow', 'amulet_predator', 'mace_dawn'] },
    recommendedPower: 5500,
  },
  {
    id: 7,
    name: 'Inferno Caverns',
    description: 'Fire elementals roar through the molten caves.',
    difficulty: 'hard',
    theme: 'inferno',
    obstacles: [
      { col: 4, row: 0, kind: 'magma' },
      { col: 4, row: 2, kind: 'fire' },
      { col: 4, row: 4, kind: 'magma' },
      { col: 8, row: 0, kind: 'lava' },
      { col: 8, row: 2, kind: 'cauldron' },
      { col: 8, row: 4, kind: 'lava' },
      { col: 1, row: 1, kind: 'magma' },
      { col: 1, row: 3, kind: 'magma' },
    ],
    enemies: [
      { name: 'Fire Imp', heroClass: 'Mage', level: 19, position: { col: 6, row: 1 }, icon: '😈', element: 'fire' },
      { name: 'Fire Imp', heroClass: 'Mage', level: 19, position: { col: 6, row: 3 }, icon: '😈', element: 'fire' },
      { name: 'Magma Brute', heroClass: 'Berserker', level: 21, position: { col: 5, row: 2 }, icon: '🔥', element: 'fire' },
      { name: 'Salamander', heroClass: 'Warrior', level: 19, position: { col: 7, row: 1 }, icon: '🦎', element: 'fire' },
      { name: 'Salamander', heroClass: 'Warrior', level: 19, position: { col: 7, row: 3 }, icon: '🦎', element: 'fire' },
    ],
    rewards: { gold: 320, experience: 220, possibleDrops: ['armor_dragonscale', 'staff_arcane', 'amulet_predator', 'scythe_bone'] },
    recommendedPower: 8500,
  },
  {
    id: 8,
    name: 'The Shadow Citadel',
    description: 'The lair of the Shadow Lord. Only the strongest survive.',
    difficulty: 'hard',
    theme: 'shadow',
    obstacles: [
      { col: 4, row: 0, kind: 'pillar' },
      { col: 4, row: 4, kind: 'pillar' },
      { col: 4, row: 2, kind: 'altar' },
      { col: 8, row: 0, kind: 'tower' },
      { col: 8, row: 4, kind: 'tower' },
      { col: 8, row: 2, kind: 'gate' },
      { col: 1, row: 2, kind: 'pillar' },
    ],
    enemies: [
      { name: 'Shadow Guard', heroClass: 'Warrior', level: 23, position: { col: 5, row: 1 }, icon: '🌑', element: 'shadow' },
      { name: 'Shadow Guard', heroClass: 'Warrior', level: 23, position: { col: 5, row: 3 }, icon: '🌑', element: 'shadow' },
      { name: 'Shadow Mage', heroClass: 'Mage', level: 24, position: { col: 6, row: 2 }, icon: '🌑', element: 'shadow' },
      { name: 'Shadow Rogue', heroClass: 'Rogue', level: 24, position: { col: 7, row: 1 }, icon: '🌑', element: 'shadow' },
      { name: 'Shadow Archer', heroClass: 'Archer', level: 24, position: { col: 7, row: 3 }, icon: '🌑', element: 'shadow' },
    ],
    rewards: { gold: 400, experience: 280, possibleDrops: ['armor_dragonscale', 'bow_elven', 'amulet_void', 'sword_legendary'] },
    recommendedPower: 12500,
  },
  {
    id: 9,
    name: 'Boss: The Shadow Lord',
    description: 'The Shadow Lord himself. He grows stronger as his minions fall.',
    difficulty: 'boss',
    theme: 'shadow',
    obstacles: [
      { col: 4, row: 0, kind: 'orb' },
      { col: 4, row: 4, kind: 'orb' },
      { col: 4, row: 2, kind: 'altar' },
      { col: 8, row: 1, kind: 'pillar' },
      { col: 8, row: 3, kind: 'pillar' },
      { col: 8, row: 2, kind: 'fortress' },
    ],
    enemies: [
      { name: 'Shadow Knight', heroClass: 'Warrior', level: 27, position: { col: 5, row: 1 }, icon: '👑', element: 'shadow' },
      { name: 'Shadow Knight', heroClass: 'Warrior', level: 27, position: { col: 5, row: 3 }, icon: '👑', element: 'shadow' },
      { name: 'Shadow Lord', heroClass: 'Berserker', level: 33, stars: 2, position: { col: 6, row: 2 }, icon: '👿', element: 'shadow', abilityId: 'boss_aoe_burst' },
      { name: 'Dark Mage', heroClass: 'Mage', level: 28, position: { col: 7, row: 1 }, icon: '🔮', element: 'shadow' },
      { name: 'Dark Mage', heroClass: 'Mage', level: 28, position: { col: 7, row: 3 }, icon: '🔮', element: 'shadow' },
    ],
    bossMechanic: 'enrage',
    rewards: { gold: 600, experience: 400, possibleDrops: ['sword_legendary', 'armor_mythril', 'amulet_void', 'staff_voidcaller'] },
    recommendedPower: 17000,
  },
  {
    id: 10,
    name: 'Twin Wyrms',
    description: 'Two ancient dragons. Move fast or be incinerated.',
    difficulty: 'boss',
    theme: 'volcanic',
    obstacles: [
      { col: 4, row: 0, kind: 'magma' },
      { col: 4, row: 4, kind: 'magma' },
      { col: 4, row: 2, kind: 'lava' },
      { col: 8, row: 1, kind: 'fire' },
      { col: 8, row: 3, kind: 'fire' },
      { col: 1, row: 1, kind: 'magma' },
      { col: 1, row: 3, kind: 'magma' },
    ],
    enemies: [
      { name: 'Crimson Wyrm', heroClass: 'Berserker', level: 36, stars: 1, position: { col: 6, row: 1 }, icon: '🐲', element: 'fire', abilityId: 'fireball' },
      { name: 'Azure Wyrm', heroClass: 'Mage', level: 36, stars: 1, position: { col: 6, row: 3 }, icon: '🐉', element: 'ice', abilityId: 'frostnova' },
      { name: 'Drake Whelp', heroClass: 'Rogue', level: 30, position: { col: 5, row: 2 }, icon: '🦖', element: 'fire' },
      { name: 'Drake Whelp', heroClass: 'Rogue', level: 30, position: { col: 7, row: 2 }, icon: '🦖', element: 'ice' },
    ],
    bossMechanic: 'aoe-burst',
    rewards: { gold: 700, experience: 450, possibleDrops: ['armor_phoenix', 'staff_voidcaller', 'amulet_void'] },
    recommendedPower: 20000,
  },
  {
    id: 11,
    name: 'Celestial Trial',
    description: 'A test of heroes. Five seraphim block your ascension.',
    difficulty: 'nightmare',
    theme: 'celestial',
    obstacles: [
      { col: 4, row: 0, kind: 'crystal' },
      { col: 4, row: 4, kind: 'crystal' },
      { col: 4, row: 2, kind: 'altar' },
      { col: 8, row: 1, kind: 'pillar' },
      { col: 8, row: 3, kind: 'pillar' },
      { col: 8, row: 2, kind: 'gate' },
      { col: 1, row: 0, kind: 'crystal' },
      { col: 1, row: 4, kind: 'crystal' },
    ],
    enemies: [
      { name: 'Seraph Guardian', heroClass: 'Paladin', level: 40, stars: 1, position: { col: 5, row: 2 }, icon: '👼', element: 'holy', abilityId: 'consecrate' },
      { name: 'Seraph Archer', heroClass: 'Archer', level: 36, position: { col: 6, row: 1 }, icon: '🏹', element: 'holy' },
      { name: 'Seraph Archer', heroClass: 'Archer', level: 36, position: { col: 6, row: 3 }, icon: '🏹', element: 'holy' },
      { name: 'Seraph Priest', heroClass: 'Cleric', level: 38, stars: 1, position: { col: 7, row: 2 }, icon: '🕊️', element: 'holy', abilityId: 'divinelight' },
      { name: 'Seraph Blademaster', heroClass: 'Monk', level: 40, stars: 1, position: { col: 6, row: 2 }, icon: '⚔️', element: 'holy', abilityId: 'flurry' },
    ],
    bossMechanic: 'lifelink',
    rewards: { gold: 900, experience: 600, possibleDrops: ['armor_phoenix', 'sword_mythic', 'amulet_sun'] },
    recommendedPower: 23000,
  },
  {
    id: 12,
    name: 'The Worldbreaker',
    description: 'An eldritch titan from beyond the veil. Final small-team challenge.',
    difficulty: 'nightmare',
    theme: 'shadow',
    obstacles: [
      { col: 4, row: 0, kind: 'orb' },
      { col: 4, row: 4, kind: 'orb' },
      { col: 4, row: 2, kind: 'altar' },
      { col: 8, row: 0, kind: 'pillar' },
      { col: 8, row: 4, kind: 'pillar' },
      { col: 8, row: 2, kind: 'fortress' },
      { col: 1, row: 1, kind: 'orb' },
      { col: 1, row: 3, kind: 'orb' },
    ],
    enemies: [
      { name: 'Worldbreaker', heroClass: 'Berserker', level: 50, stars: 3, position: { col: 6, row: 2 }, icon: '🌋', element: 'shadow', abilityId: 'boss_aoe_burst' },
      { name: 'Eldritch Spawn', heroClass: 'Rogue', level: 42, stars: 1, position: { col: 5, row: 1 }, icon: '🦑', element: 'shadow' },
      { name: 'Eldritch Spawn', heroClass: 'Rogue', level: 42, stars: 1, position: { col: 5, row: 3 }, icon: '🦑', element: 'shadow' },
      { name: 'Cult Adept', heroClass: 'Mage', level: 44, stars: 1, position: { col: 7, row: 1 }, icon: '🧙', element: 'shadow', abilityId: 'fireball' },
      { name: 'Cult Adept', heroClass: 'Mage', level: 44, stars: 1, position: { col: 7, row: 3 }, icon: '🧙', element: 'shadow', abilityId: 'frostnova' },
    ],
    bossMechanic: 'enrage',
    rewards: { gold: 1200, experience: 900, possibleDrops: ['sword_mythic', 'armor_phoenix', 'amulet_sun'] },
    recommendedPower: 28000,
  },
  {
    id: 13,
    name: 'The Endless Crucible',
    description: 'Three waves of escalating threats. Survive every one.',
    difficulty: 'nightmare',
    theme: 'ruins',
    obstacles: [
      { col: 4, row: 0, kind: 'banner' },
      { col: 4, row: 4, kind: 'banner' },
      { col: 4, row: 2, kind: 'tower' },
      { col: 8, row: 0, kind: 'fortress' },
      { col: 8, row: 4, kind: 'fortress' },
      { col: 8, row: 2, kind: 'gate' },
    ],
    enemies: [
      { name: 'Crucible Guard', heroClass: 'Warrior', level: 40, stars: 1, position: { col: 5, row: 1 }, icon: '⚒️', element: 'physical' },
      { name: 'Crucible Guard', heroClass: 'Warrior', level: 40, stars: 1, position: { col: 5, row: 3 }, icon: '⚒️', element: 'physical' },
      { name: 'Crucible Sniper', heroClass: 'Archer', level: 42, stars: 1, position: { col: 7, row: 2 }, icon: '🎯', element: 'physical' },
    ],
    waves: [
      [
        { name: 'Flame Wraith', heroClass: 'Mage', level: 44, stars: 1, position: { col: 6, row: 1 }, icon: '🔥', element: 'fire', abilityId: 'fireball' },
        { name: 'Frost Wraith', heroClass: 'Mage', level: 44, stars: 1, position: { col: 6, row: 3 }, icon: '❄️', element: 'ice', abilityId: 'frostnova' },
        { name: 'Crucible Assassin', heroClass: 'Rogue', level: 46, stars: 1, position: { col: 5, row: 2 }, icon: '🥷', element: 'shadow' },
      ],
      [
        { name: 'Crucible Tyrant', heroClass: 'Berserker', level: 50, stars: 3, position: { col: 6, row: 2 }, icon: '👹', element: 'fire', abilityId: 'boss_aoe_burst' },
        { name: 'Tyrant Acolyte', heroClass: 'Necromancer', level: 46, stars: 1, position: { col: 7, row: 1 }, icon: '💀', element: 'shadow', abilityId: 'drainlife' },
        { name: 'Tyrant Acolyte', heroClass: 'Necromancer', level: 46, stars: 1, position: { col: 7, row: 3 }, icon: '💀', element: 'shadow', abilityId: 'drainlife' },
      ],
    ],
    bossMechanic: 'aoe-burst',
    rewards: { gold: 2000, experience: 1500, possibleDrops: ['sword_mythic', 'armor_phoenix', 'amulet_sun'] },
    recommendedPower: 32000,
  },

  // ----------------------------------------------------------------
  // SIEGE LEVELS — 22×11 hex grid, 12 heroes per side, hordes of enemies
  // ----------------------------------------------------------------
  {
    id: 14,
    name: 'Siege: The Goblin Tide',
    description: 'A massive war-band of goblins, ogres, and shamans rolls across the plains. Hold the line.',
    difficulty: 'nightmare',
    mapSize: 'siege',
    maxHeroes: 12,
    theme: 'siege',
    obstacles: [
      { col: 9, row: 0, kind: 'banner' },
      { col: 9, row: 5, kind: 'tower' },
      { col: 9, row: 10, kind: 'banner' },
      { col: 10, row: 2, kind: 'rock' },
      { col: 10, row: 8, kind: 'rock' },
      { col: 21, row: 0, kind: 'fortress' },
      { col: 21, row: 5, kind: 'gate' },
      { col: 21, row: 10, kind: 'fortress' },
      { col: 16, row: 1, kind: 'tent' },
      { col: 16, row: 9, kind: 'tent' },
    ],
    enemies: siegeWave('vanguard', 1),
    waves: [
      siegeWave('middle', 2),
      siegeWave('boss', 3),
    ],
    bossMechanic: 'enrage',
    rewards: { gold: 3500, experience: 2500, possibleDrops: ['sword_mythic', 'armor_phoenix', 'amulet_sun', 'staff_voidcaller'] },
    recommendedPower: 50000,
  },
  {
    id: 15,
    name: 'Siege: The Bone Legion',
    description: 'A necromancer-king has raised an undead army. Three waves, dozens deep.',
    difficulty: 'nightmare',
    mapSize: 'siege',
    maxHeroes: 12,
    theme: 'undead',
    obstacles: [
      { col: 9, row: 0, kind: 'tomb' },
      { col: 9, row: 5, kind: 'altar' },
      { col: 9, row: 10, kind: 'tomb' },
      { col: 10, row: 2, kind: 'skull' },
      { col: 10, row: 8, kind: 'skull' },
      { col: 21, row: 0, kind: 'tower' },
      { col: 21, row: 5, kind: 'fortress' },
      { col: 21, row: 10, kind: 'tower' },
      { col: 16, row: 1, kind: 'tomb' },
      { col: 16, row: 9, kind: 'tomb' },
      { col: 16, row: 5, kind: 'pillar' },
    ],
    enemies: undeadVanguard(),
    waves: [
      undeadMiddle(),
      undeadBoss(),
    ],
    bossMechanic: 'summon',
    rewards: { gold: 5000, experience: 3500, possibleDrops: ['sword_mythic', 'armor_phoenix', 'amulet_sun', 'staff_voidcaller'] },
    recommendedPower: 65000,
  },
  {
    id: 16,
    name: 'Siege: Worldfall',
    description: 'The eldritch titan returns with an army at its back. Twelve heroes for twelve waves of horror.',
    difficulty: 'nightmare',
    mapSize: 'siege',
    maxHeroes: 12,
    theme: 'shadow',
    obstacles: [
      { col: 9, row: 0, kind: 'orb' },
      { col: 9, row: 5, kind: 'altar' },
      { col: 9, row: 10, kind: 'orb' },
      { col: 10, row: 2, kind: 'pillar' },
      { col: 10, row: 8, kind: 'pillar' },
      { col: 21, row: 0, kind: 'fortress' },
      { col: 21, row: 5, kind: 'fortress' },
      { col: 21, row: 10, kind: 'fortress' },
      { col: 16, row: 1, kind: 'orb' },
      { col: 16, row: 9, kind: 'orb' },
      { col: 16, row: 5, kind: 'altar' },
    ],
    enemies: worldfallVanguard(),
    waves: [
      worldfallMiddle(),
      worldfallElites(),
      worldfallFinal(),
    ],
    bossMechanic: 'aoe-burst',
    rewards: { gold: 10000, experience: 6000, possibleDrops: ['sword_mythic', 'armor_phoenix', 'amulet_sun', 'staff_voidcaller'] },
    recommendedPower: 90000,
  },
];

// ----------------------------------------------------------------
// SIEGE WAVE GENERATORS
// Each wave fills the enemy zone (cols 11..21) with a horde. Rows are
// spread 1..9 (the middle nine of the 11-row board) so units don't
// crowd the absolute top/bottom edges.
// ----------------------------------------------------------------

import { EnemyConfig } from '../types';

function siegeWave(tier: 'vanguard' | 'middle' | 'boss', waveNum: number): EnemyConfig[] {
  const list: EnemyConfig[] = [];
  if (tier === 'vanguard') {
    // 18 light goblins forming the front line.
    let i = 0;
    for (let col = 11; col <= 14; col++) {
      for (const row of [2, 4, 6]) {
        list.push({
          name: 'Goblin Raider', heroClass: 'Rogue', level: 30,
          position: { col, row }, icon: '👺', element: 'physical',
        });
        i++;
      }
    }
    // Ogre shock troops
    for (const row of [3, 5]) {
      list.push({
        name: 'Ogre Brute', heroClass: 'Berserker', level: 34, stars: 1,
        position: { col: 15, row }, icon: '👹', element: 'physical',
      });
    }
    // Shamans (back)
    for (const row of [2, 6]) {
      list.push({
        name: 'Goblin Shaman', heroClass: 'Mage', level: 36, stars: 1,
        position: { col: 17, row }, icon: '🧙', element: 'fire', abilityId: 'fireball',
      });
    }
  } else if (tier === 'middle') {
    // Second wave — wolves and ogres
    for (let col = 11; col <= 13; col++) {
      for (const row of [2, 4, 6]) {
        list.push({
          name: 'Dire Wolf', heroClass: 'Rogue', level: 38, stars: 1,
          position: { col, row }, icon: '🐺', element: 'physical',
        });
      }
    }
    for (const row of [3, 5]) {
      list.push({
        name: 'Forest Troll', heroClass: 'Berserker', level: 42, stars: 1,
        position: { col: 14, row }, icon: '👹', element: 'nature',
      });
    }
    list.push({
      name: 'Yeti Champion', heroClass: 'Berserker', level: 44, stars: 2,
      position: { col: 16, row: 4 }, icon: '🦣', element: 'ice', abilityId: 'frostnova',
    });
    for (const row of [2, 6]) {
      list.push({
        name: 'War Shaman', heroClass: 'Mage', level: 42, stars: 1,
        position: { col: 17, row }, icon: '🧙', element: 'lightning', abilityId: 'frostnova',
      });
    }
  } else {
    // Boss wave — warlord + elite guards
    for (const row of [3, 5]) {
      list.push({
        name: 'Warband Knight', heroClass: 'Warrior', level: 46, stars: 2,
        position: { col: 13, row }, icon: '⚒️', element: 'physical',
      });
    }
    for (const row of [2, 6]) {
      list.push({
        name: 'Hex Witch', heroClass: 'Necromancer', level: 44, stars: 1,
        position: { col: 14, row }, icon: '🧚', element: 'shadow', abilityId: 'drainlife',
      });
    }
    list.push({
      name: 'Goblin Warlord', heroClass: 'Berserker', level: 50, stars: 4,
      position: { col: 17, row: 4 }, icon: '👑', element: 'physical', abilityId: 'boss_aoe_burst',
    });
    for (const row of [3, 5]) {
      list.push({
        name: 'Elite Guard', heroClass: 'Warrior', level: 46, stars: 2,
        position: { col: 18, row }, icon: '🏰', element: 'physical',
      });
    }
    for (const row of [2, 6]) {
      list.push({
        name: 'Sniper', heroClass: 'Archer', level: 46, stars: 1,
        position: { col: 19, row }, icon: '🎯', element: 'physical',
      });
    }
  }
  return list;
}

function undeadVanguard(): EnemyConfig[] {
  const list: EnemyConfig[] = [];
  // Skeleton fodder — 18 weak units
  for (let col = 11; col <= 13; col++) {
    for (const row of [1, 3, 5, 7]) {
      list.push({
        name: 'Skeleton Warrior', heroClass: 'Warrior', level: 32,
        position: { col, row }, icon: '💀', element: 'shadow',
      });
    }
  }
  // Skeleton archers
  for (const row of [2, 4, 6]) {
    list.push({
      name: 'Skeleton Archer', heroClass: 'Archer', level: 36, stars: 1,
      position: { col: 14, row }, icon: '💀', element: 'shadow',
    });
  }
  return list;
}

function undeadMiddle(): EnemyConfig[] {
  const list: EnemyConfig[] = [];
  // Wights and zombies
  for (let col = 11; col <= 12; col++) {
    for (const row of [1, 3, 5, 7]) {
      list.push({
        name: 'Risen Wight', heroClass: 'Warrior', level: 42, stars: 1,
        position: { col, row }, icon: '🧟', element: 'shadow',
      });
    }
  }
  // Shadow rogues
  for (const row of [2, 4, 6]) {
    list.push({
      name: 'Shadow Reaper', heroClass: 'Rogue', level: 44, stars: 1,
      position: { col: 13, row }, icon: '🌑', element: 'shadow',
    });
  }
  // Ghost mages
  for (const row of [3, 5]) {
    list.push({
      name: 'Wraith', heroClass: 'Mage', level: 46, stars: 2,
      position: { col: 15, row }, icon: '👻', element: 'ice', abilityId: 'frostnova',
    });
  }
  return list;
}

function undeadBoss(): EnemyConfig[] {
  const list: EnemyConfig[] = [];
  // Final wave — necromancer king and his elite court
  for (const row of [3, 5]) {
    list.push({
      name: 'Death Knight', heroClass: 'Warrior', level: 48, stars: 3,
      position: { col: 13, row }, icon: '👑', element: 'shadow',
    });
  }
  for (const row of [2, 6]) {
    list.push({
      name: 'Lich Acolyte', heroClass: 'Necromancer', level: 46, stars: 2,
      position: { col: 14, row }, icon: '💀', element: 'shadow', abilityId: 'drainlife',
    });
  }
  list.push({
    name: 'Lichlord', heroClass: 'Necromancer', level: 50, stars: 5,
    position: { col: 17, row: 4 }, icon: '👑', element: 'shadow', abilityId: 'drainlife',
  });
  for (const row of [3, 5]) {
    list.push({
      name: 'Royal Wraith', heroClass: 'Mage', level: 48, stars: 2,
      position: { col: 18, row }, icon: '👻', element: 'shadow', abilityId: 'frostnova',
    });
  }
  for (const row of [2, 6]) {
    list.push({
      name: 'Bone Sniper', heroClass: 'Archer', level: 46, stars: 2,
      position: { col: 19, row }, icon: '💀', element: 'shadow',
    });
  }
  return list;
}

function worldfallVanguard(): EnemyConfig[] {
  const list: EnemyConfig[] = [];
  // Massive horde of light tentacle spawns
  for (let col = 11; col <= 13; col++) {
    for (const row of [1, 3, 5, 7, 9]) {
      list.push({
        name: 'Spawn', heroClass: 'Rogue', level: 38, stars: 1,
        position: { col, row }, icon: '🦑', element: 'shadow',
      });
    }
  }
  // Burning imps
  for (const row of [2, 4, 6, 8]) {
    list.push({
      name: 'Hell Imp', heroClass: 'Mage', level: 40, stars: 1,
      position: { col: 14, row }, icon: '😈', element: 'fire', abilityId: 'fireball',
    });
  }
  return list;
}

function worldfallMiddle(): EnemyConfig[] {
  const list: EnemyConfig[] = [];
  // Drakes and brutes
  for (let col = 11; col <= 12; col++) {
    for (const row of [1, 3, 5, 7, 9]) {
      list.push({
        name: 'Drake Whelp', heroClass: 'Rogue', level: 44, stars: 1,
        position: { col, row }, icon: '🦖', element: 'fire',
      });
    }
  }
  for (const row of [2, 4, 6, 8]) {
    list.push({
      name: 'Magma Brute', heroClass: 'Berserker', level: 46, stars: 2,
      position: { col: 13, row }, icon: '🔥', element: 'fire',
    });
  }
  // Fire elementals
  for (const row of [3, 5, 7]) {
    list.push({
      name: 'Inferno Elemental', heroClass: 'Mage', level: 46, stars: 2,
      position: { col: 15, row }, icon: '🔥', element: 'fire', abilityId: 'fireball',
    });
  }
  return list;
}

function worldfallElites(): EnemyConfig[] {
  const list: EnemyConfig[] = [];
  // Shadow knights and titans-in-waiting
  for (const row of [2, 4, 6, 8]) {
    list.push({
      name: 'Shadow Knight', heroClass: 'Warrior', level: 48, stars: 3,
      position: { col: 12, row }, icon: '👑', element: 'shadow',
    });
  }
  for (const row of [3, 5, 7]) {
    list.push({
      name: 'Dark Mage', heroClass: 'Necromancer', level: 48, stars: 2,
      position: { col: 14, row }, icon: '🧙', element: 'shadow', abilityId: 'drainlife',
    });
  }
  for (const row of [2, 4, 6, 8]) {
    list.push({
      name: 'Crimson Wyrm', heroClass: 'Berserker', level: 50, stars: 3,
      position: { col: 16, row }, icon: '🐲', element: 'fire', abilityId: 'fireball',
    });
  }
  return list;
}

function worldfallFinal(): EnemyConfig[] {
  const list: EnemyConfig[] = [];
  // The Titan and his elite guard
  list.push({
    name: 'Worldbreaker', heroClass: 'Berserker', level: 50, stars: 5,
    position: { col: 18, row: 4 }, icon: '🌋', element: 'shadow', abilityId: 'boss_aoe_burst',
  });
  list.push({
    name: 'The Shadow Lord', heroClass: 'Berserker', level: 50, stars: 4,
    position: { col: 18, row: 6 }, icon: '👿', element: 'shadow', abilityId: 'boss_aoe_burst',
  });
  for (const row of [3, 5]) {
    list.push({
      name: 'Eldritch Tyrant', heroClass: 'Berserker', level: 50, stars: 3,
      position: { col: 16, row }, icon: '👹', element: 'shadow', abilityId: 'boss_aoe_burst',
    });
  }
  for (const row of [2, 7]) {
    list.push({
      name: 'High Cultist', heroClass: 'Necromancer', level: 50, stars: 3,
      position: { col: 14, row }, icon: '🧙', element: 'shadow', abilityId: 'drainlife',
    });
  }
  for (const row of [4, 6]) {
    list.push({
      name: 'Royal Guard', heroClass: 'Warrior', level: 50, stars: 3,
      position: { col: 15, row }, icon: '🏰', element: 'shadow',
    });
  }
  return list;
}

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#27ae60',
  medium: '#f39c12',
  hard: '#e74c3c',
  boss: '#8e44ad',
  nightmare: '#e84393',
};

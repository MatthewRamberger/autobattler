import { Achievement } from '../types';

// Daily quests are simply ephemeral achievements that reset every 24 hours.
// We store them in the GameState as `dailyQuests` plus a `dailyResetAt` timestamp.
export interface DailyQuestDef extends Achievement {
  goalMin: number;
  goalMax: number;
}

export const DAILY_QUEST_POOL: DailyQuestDef[] = [
  {
    id: 'daily_battles',
    name: 'Daily Warrior',
    description: 'Win battles today.',
    icon: '⚔️',
    goal: 0, goalMin: 3, goalMax: 6,
    reward: { gold: 200, gems: 5 },
  },
  {
    id: 'daily_damage',
    name: 'Daily Devastator',
    description: 'Deal damage in battles today.',
    icon: '💥',
    goal: 0, goalMin: 1500, goalMax: 4000,
    reward: { gold: 300, gems: 5 },
  },
  {
    id: 'daily_kills',
    name: 'Daily Reaper',
    description: 'Defeat enemies today.',
    icon: '☠️',
    goal: 0, goalMin: 10, goalMax: 25,
    reward: { gold: 250, gems: 5 },
  },
  {
    id: 'daily_arena',
    name: 'Daily Gladiator',
    description: 'Win arena waves today.',
    icon: '🏟️',
    goal: 0, goalMin: 2, goalMax: 5,
    reward: { gold: 400, gems: 10 },
  },
  {
    id: 'daily_forge',
    name: 'Daily Smith',
    description: 'Forge an upgrade today.',
    icon: '🔨',
    goal: 0, goalMin: 1, goalMax: 2,
    reward: { gold: 350, gems: 8 },
  },
  {
    id: 'daily_levelup',
    name: 'Daily Trainer',
    description: 'Level up your heroes today.',
    icon: '⬆️',
    goal: 0, goalMin: 2, goalMax: 4,
    reward: { gold: 200, gems: 5 },
  },
];

export function rollDailyQuests(): Achievement[] {
  // Pick 3 distinct quests with a randomised goal each day.
  const pool = [...DAILY_QUEST_POOL];
  const picks: Achievement[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const def = pool.splice(idx, 1)[0];
    const goal = def.goalMin + Math.floor(Math.random() * (def.goalMax - def.goalMin + 1));
    picks.push({
      id: def.id, name: def.name, description: def.description, icon: def.icon,
      goal, reward: def.reward,
    });
  }
  return picks;
}

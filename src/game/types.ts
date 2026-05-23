// Shared types between the playback hook, engine, and screen overlay.
// These mirror the legacy shapes that lived inside useBattleReplay so
// the rest of the UI (combat log, result modal, stats table) keeps
// working unchanged.

import { BattleUnit, BattleLogEntry } from '../types';

export type LiveUnit = BattleUnit;

export interface UnitStatLine {
  id: string;
  name: string;
  heroClass: string;
  icon: string;
  isPlayer: boolean;
  isAlive: boolean;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  killCount: number;
}

export interface BattleResultSummary {
  won: boolean;
  gold: number;
  exp: number;
  drop?: string;
  damageDealt: number;
  healingDone: number;
  killCount: number;
  unitStats: UnitStatLine[];
  chest?: import('../store/gameStore').ChestReward;
  chestKind?: import('../data/chests').ChestKind;
}

export type Phase = 'running' | 'paused' | 'done' | 'turn-wait';

// Snapshot of a unit for the HUD/log layer.
export interface UnitSnapshot {
  id: string;
  isPlayer: boolean;
  isAlive: boolean;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  killCount: number;
  name: string;
  heroClass: BattleUnit['heroClass'];
  icon: string;
  ticksUntilAbility: number;
  abilityId?: string;
  statuses: BattleUnit['statuses'];
}

export { BattleLogEntry };

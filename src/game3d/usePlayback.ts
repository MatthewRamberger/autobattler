// Battle playback hook for the 3D engine.
//
// Owns the deterministic battle simulation (same path as the legacy
// useBattleReplay: builds player/enemy units, calls computeBattle()
// once, then streams its events out to the engine on a rescheduling
// timer). The engine handles ALL visual side-effects — this hook
// only updates React state for the UI shell:
//
//   • phase, tick, log
//   • unit snapshots (HUD alive counts, stat table, ability ready flag)
//   • result summary for the post-battle modal
//   • controls (pause, fast-forward, advance, turn-by-turn toggle)
//
// The hook accepts an `engineRef` and pushes BattleEvent batches into
// it; the engine drives Three.js. Mid-battle gestures (pan/zoom) are
// handled directly on the GLView wrapper, not here.

import { useCallback, useEffect, useRef, useState } from 'react';
import { BattleEvent, BattleLogEntry, BattleUnit } from '../types';
import { computeBattle, buildPlayerUnit, buildEnemyUnit } from '../utils/battleEngine';
import { LEVELS } from '../data/levels';
import { useGameStore, getHeroEffectiveStats, generateArenaWave } from '../store/gameStore';
import { chestForArenaWave, chestForDifficulty } from '../data/chests';
import { HexGrid } from '../utils/hex';
import { heroIdOfPlacement } from '../utils/placement';
import { Engine } from './Engine';
import { BattleResultSummary, Phase, UnitSnapshot } from './types';

const BASE_TICK_MS = 720;

export interface PlaybackApi {
  isArena: boolean;
  level: ReturnType<typeof LEVELS.find> | null;
  phase: Phase;
  tick: number;
  log: BattleLogEntry[];
  units: UnitSnapshot[];
  result: BattleResultSummary | null;
  togglePause: () => void;
  fastForward: () => void;
  advanceTurn: () => void;
  toggleTurnByTurn: () => void;
  turnByTurnActive: boolean;
  turnSourceId: string | null;
}

export function usePlayback(grid: HexGrid, engineRef: React.MutableRefObject<Engine | null>): PlaybackApi {
  const store = useGameStore();
  const {
    currentLevelId, heroes, placedHeroes, applyBattleRewards,
    battleSpeed, arenaWave, setArenaWave,
  } = store;

  const isArena = currentLevelId === -1;
  const level = isArena ? null : LEVELS.find((l) => l.id === currentLevelId) ?? null;

  const [phase, setPhase] = useState<Phase>('running');
  const [tick, setTick] = useState(0);
  const [log, setLog] = useState<BattleLogEntry[]>([]);
  const [units, setUnits] = useState<UnitSnapshot[]>([]);
  const [result, setResult] = useState<BattleResultSummary | null>(null);

  const mounted = useRef(true);
  const events = useRef<BattleEvent[]>([]);
  const logs = useRef<BattleLogEntry[]>([]);
  const evIdx = useRef(0);
  const finalUnits = useRef<BattleUnit[]>([]);
  // Initial unit list captured at setup so we can seed the engine
  // whenever its GL context finishes being created (which can happen
  // after `setup` has already run).
  const initialUnits = useRef<BattleUnit[]>([]);
  const tickRef = useRef(0);
  const paused = useRef(false);
  const doneRef = useRef(false);
  const turnByTurnRef = useRef(false);
  const turnSourceRef = useRef<string | null>(null);
  const displayedLogTicks = useRef<Set<string>>(new Set());
  const engineSeeded = useRef(false);

  const safeSet = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mounted.current) setter(value);
  }, []);

  // -------------------------------------------------------------------
  // Setup: build initial units, compute the battle, seed the engine.
  // We also reset every ref so React Strict Mode's double-invocation
  // in dev doesn't leave stale state from the first pass.
  // -------------------------------------------------------------------
  useEffect(() => {
    mounted.current = true;
    doneRef.current = false;
    paused.current = false;
    evIdx.current = 0;
    tickRef.current = 0;
    events.current = [];
    logs.current = [];
    finalUnits.current = [];
    displayedLogTicks.current = new Set();
    turnSourceRef.current = null;
    turnByTurnRef.current = !!store.settings?.turnByTurn;
    engineSeeded.current = false;

    safeSet(setPhase, 'running');
    safeSet(setTick, 0);
    safeSet(setLog, []);
    safeSet(setResult, null);

    try {
      const enemyCfg = level ? level.enemies : generateArenaWave(arenaWave);
      const enemyUnits = enemyCfg.map((e, idx) => buildEnemyUnit({
        name: e.name, heroClass: e.heroClass, level: e.level, position: e.position,
        icon: e.icon, index: idx, element: e.element, stars: e.stars, abilityId: e.abilityId,
      }));
      const stronghold = (store.stronghold ?? {}) as Record<string, number>;
      const sanctumMana = (stronghold['sanctum'] ?? 0) * 8;
      const playerUnits = Object.entries(placedHeroes).flatMap(([placementKey, pos]) => {
        const heroId = heroIdOfPlacement(placementKey);
        const hero = heroes[heroId];
        const stats = getHeroEffectiveStats(heroId, store);
        if (!hero || !stats) return [];
        const u = buildPlayerUnit({
          heroId, name: hero.name, heroClass: hero.heroClass,
          maxHp: stats.maxHp, attack: stats.attack, defense: stats.defense,
          speed: stats.speed, range: stats.range,
          critRate: stats.critRate, critDamage: stats.critDamage, dodge: stats.dodge,
          maxMana: stats.maxMana, manaRegen: stats.manaRegen,
          element: stats.element, resistance: stats.resistance,
          position: pos, icon: hero.icon, portraitSeed: hero.portraitSeed,
          stars: 0, abilityId: hero.abilityId,
        });
        u.mana = Math.min(u.maxMana, u.mana + sanctumMana);
        return [u];
      });

      const extraWaves = level?.waves?.map((wave, wi) =>
        wave.map((e, idx) => buildEnemyUnit({
          name: e.name, heroClass: e.heroClass, level: e.level, position: e.position,
          icon: e.icon, index: 100 + wi * 10 + idx, element: e.element, stars: e.stars, abilityId: e.abilityId,
        }))
      );

      const computed = computeBattle(playerUnits, enemyUnits, {
        bossMechanic: level?.bossMechanic, extraWaves, grid,
      });
      events.current = computed.events;
      logs.current = computed.log;
      finalUnits.current = computed.finalUnits;

      const all = [...playerUnits, ...enemyUnits];
      initialUnits.current = all.map((u) => ({ ...u, position: { ...u.position } }));
      setUnits(all.map((u) => snapshotOf(u)));

      // Seed the engine when it's ready. The engine is created
      // asynchronously by the GLView's onContextCreate, so it may not
      // exist yet on this commit. The replay-loop effect retries
      // seeding before it processes events.
      maybeSeedEngine();

      safeSet(setLog, [{
        tick: 0, type: 'system' as const,
        text: `🎯 ${playerUnits.length}v${enemyUnits.length} · ${computed.events.length} events queued`,
      }]);
    } catch (err) {
      console.warn('[battle3d] setup failed', err);
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      safeSet(setLog, [{ tick: 0, type: 'system' as const, text: `⚠ Battle setup failed — ${msg}` }]);
      finish();
    }

    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function maybeSeedEngine() {
    const e = engineRef.current;
    if (!e || engineSeeded.current) return;
    const seed = initialUnits.current;
    if (!seed.length) return;
    e.resetUnits(seed);
    engineSeeded.current = true;
  }

  // -------------------------------------------------------------------
  // Replay loop. Same architecture as the legacy hook: a self-
  // rescheduling timeout driven by phase/battleSpeed. On each iteration
  // we consume a tick's worth of events, push them to the engine for
  // visual presentation, and then update React state for the HUD.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'running') return;
    let cancelled = false;
    let tid: ReturnType<typeof setTimeout> | null = null;

    const isActionEvent = (e: BattleEvent) =>
      e.kind === 'move' || e.kind === 'attack' || e.kind === 'projectile' || e.kind === 'ability';

    const runOne = () => {
      if (cancelled || !mounted.current || doneRef.current) return;
      if (paused.current) { tid = setTimeout(runOne, 100); return; }

      // Ensure the engine has had a chance to be created + seeded. If
      // not yet, re-check next frame — the GLView's onContextCreate
      // should fire very shortly after mount.
      if (!engineRef.current) { tid = setTimeout(runOne, 32); return; }
      if (!engineSeeded.current) maybeSeedEngine();
      if (!engineSeeded.current) { tid = setTimeout(runOne, 32); return; }

      const evs = events.current;
      if (evIdx.current >= evs.length) { finish(); return; }

      if (turnByTurnRef.current) {
        const batch: BattleEvent[] = [];
        let turnSource: string | null = null;
        let consumedAction = false;
        while (evIdx.current < evs.length) {
          const e = evs[evIdx.current];
          if (isActionEvent(e)) {
            if (!consumedAction) {
              turnSource = e.sourceId ?? null;
              consumedAction = true;
              batch.push(e); evIdx.current++; continue;
            }
            if (e.sourceId !== turnSource) break;
            batch.push(e); evIdx.current++; continue;
          }
          batch.push(e); evIdx.current++;
        }
        if (batch.length) commitBatch(batch);
        turnSourceRef.current = turnSource;
        if (evIdx.current >= evs.length) finish();
        else safeSet(setPhase, 'turn-wait');
        return;
      }

      // Normal continuous playback — one tick's worth of events per step.
      const t = evs[evIdx.current]?.tick ?? tickRef.current;
      const batch: BattleEvent[] = [];
      while (evIdx.current < evs.length && evs[evIdx.current].tick === t) {
        batch.push(evs[evIdx.current]);
        evIdx.current++;
      }
      commitBatch(batch);
      tid = setTimeout(runOne, BASE_TICK_MS / Math.max(1, store.battleSpeed));
    };

    // First scheduling waits a frame so the engine has a chance to be
    // created (its onContextCreate is async).
    tid = setTimeout(runOne, 32);
    return () => { cancelled = true; if (tid) clearTimeout(tid); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, battleSpeed]);

  function commitBatch(batch: BattleEvent[]) {
    if (!batch.length) return;
    const lastTick = batch[batch.length - 1].tick;
    tickRef.current = lastTick;
    safeSet(setTick, lastTick);

    // Push to the engine (visual presentation).
    engineRef.current?.applyEvents(batch);

    // Update React-side snapshots for the HUD.
    setUnits((prev) => applyEventsToSnapshots(prev, batch));

    // Append newly-revealed log lines.
    const ticks = new Set(batch.map((b) => b.tick));
    const newLogs = logs.current.filter((e) =>
      ticks.has(e.tick) && !displayedLogTicks.current.has(`${e.tick}_${e.text}`)
    );
    for (const l of newLogs) displayedLogTicks.current.add(`${l.tick}_${l.text}`);
    if (newLogs.length) setLog((prev) => [...prev, ...newLogs]);
  }

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    safeSet(setPhase, 'done');
    try {
      const fin = finalUnits.current;
      const survivors = fin.filter((u) => u.isPlayer && u.isAlive);
      const won = survivors.length > 0 && fin.filter((u) => !u.isPlayer).every((u) => !u.isAlive);
      const heroIds = [...new Set(Object.keys(placedHeroes).map(heroIdOfPlacement))];
      const pUnits = fin.filter((u) => u.isPlayer);
      const dmg = pUnits.reduce((s, u) => s + u.damageDealt, 0);
      const heal = pUnits.reduce((s, u) => s + u.healingDone, 0);
      const kills = pUnits.reduce((s, u) => s + u.killCount, 0);
      const unitStats = fin.map((u) => ({
        id: u.id, name: u.name, heroClass: u.heroClass, icon: u.icon,
        isPlayer: u.isPlayer, isAlive: u.isAlive,
        damageDealt: u.damageDealt, damageTaken: u.damageTaken,
        healingDone: u.healingDone, killCount: u.killCount,
      }));

      const { rewardChest } = useGameStore.getState();
      let summary: BattleResultSummary;
      if (isArena) {
        const gold = won ? 30 + arenaWave * 15 : 5;
        const exp = won ? 20 + arenaWave * 10 : 5;
        applyBattleRewards(won, gold, exp, heroIds, { damage: dmg, kills });
        if (won) {
          const kind = chestForArenaWave(arenaWave);
          const chest = rewardChest(kind);
          setArenaWave(arenaWave + 1);
          summary = { won, gold: chest.gold, exp, damageDealt: dmg, healingDone: heal, killCount: kills, unitStats, chest, chestKind: kind };
        } else {
          summary = { won, gold, exp, damageDealt: dmg, healingDone: heal, killCount: kills, unitStats };
        }
      } else if (level) {
        const gold = won ? level.rewards.gold : Math.floor(level.rewards.gold * 0.25);
        const exp = won ? level.rewards.experience : Math.floor(level.rewards.experience * 0.1);
        applyBattleRewards(won, gold, exp, heroIds, { damage: dmg, kills });
        if (won) {
          const kind = chestForDifficulty(level.difficulty);
          const chest = rewardChest(kind);
          summary = { won, gold: chest.gold, exp, damageDealt: dmg, healingDone: heal, killCount: kills, unitStats, chest, chestKind: kind };
        } else {
          summary = { won, gold, exp, damageDealt: dmg, healingDone: heal, killCount: kills, unitStats };
        }
      } else {
        summary = { won, gold: 0, exp: 0, damageDealt: dmg, healingDone: heal, killCount: kills, unitStats };
      }
      safeSet(setResult, summary);
    } catch (err) {
      console.warn('[battle3d] finish/rewards failed', err);
      safeSet(setResult, { won: false, gold: 0, exp: 0, damageDealt: 0, healingDone: 0, killCount: 0, unitStats: [] });
    }
  }

  const togglePause = useCallback(() => {
    if (doneRef.current) return;
    paused.current = !paused.current;
    safeSet(setPhase, paused.current ? 'paused' : 'running');
  }, [safeSet]);

  const advanceTurn = useCallback(() => {
    if (doneRef.current) return;
    paused.current = false;
    safeSet(setPhase, 'running');
  }, [safeSet]);

  const toggleTurnByTurn = useCallback(() => {
    if (doneRef.current) return;
    turnByTurnRef.current = !turnByTurnRef.current;
    if (!turnByTurnRef.current) {
      paused.current = false;
      safeSet(setPhase, 'running');
    }
  }, [safeSet]);

  const fastForward = useCallback(() => {
    if (doneRef.current) return;
    paused.current = false;
    const evs = events.current;
    const rest: BattleEvent[] = [];
    while (evIdx.current < evs.length) { rest.push(evs[evIdx.current]); evIdx.current++; }
    if (rest.length) {
      engineRef.current?.applyEvents(rest);
      setUnits((prev) => applyEventsToSnapshots(prev, rest));
    }
    setLog(logs.current.slice());
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isArena,
    level,
    phase,
    tick,
    log,
    units,
    result,
    togglePause,
    fastForward,
    advanceTurn,
    toggleTurnByTurn,
    turnByTurnActive: turnByTurnRef.current,
    turnSourceId: turnSourceRef.current,
  };
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function snapshotOf(u: BattleUnit): UnitSnapshot {
  return {
    id: u.id,
    isPlayer: u.isPlayer,
    isAlive: u.isAlive,
    hp: u.hp,
    maxHp: u.maxHp,
    mana: u.mana,
    maxMana: u.maxMana,
    damageDealt: u.damageDealt,
    damageTaken: u.damageTaken,
    healingDone: u.healingDone,
    killCount: u.killCount,
    name: u.name,
    heroClass: u.heroClass,
    icon: u.icon,
    ticksUntilAbility: u.ticksUntilAbility,
    abilityId: u.abilityId,
    statuses: u.statuses.slice(),
  };
}

function applyEventsToSnapshots(prev: UnitSnapshot[], batch: BattleEvent[]): UnitSnapshot[] {
  let next = prev;
  const patch = (id: string, fn: (u: UnitSnapshot) => UnitSnapshot) => {
    next = next.map((u) => (u.id === id ? fn(u) : u));
  };
  for (const ev of batch) {
    switch (ev.kind) {
      case 'damage':
        if (ev.targetId) {
          const dmg = ev.value ?? 0;
          patch(ev.targetId, (u) => ({ ...u, hp: Math.max(0, u.hp - dmg), damageTaken: u.damageTaken + dmg }));
          if (ev.sourceId) {
            const src = ev.sourceId;
            next = next.map((u) => (u.id === src ? { ...u, damageDealt: u.damageDealt + dmg } : u));
          }
        }
        break;
      case 'heal':
        if (ev.targetId && ev.value) {
          const id = ev.targetId, heal = ev.value;
          patch(id, (u) => ({ ...u, hp: Math.min(u.maxHp, u.hp + heal) }));
          if (ev.sourceId) {
            const src = ev.sourceId;
            next = next.map((u) => (u.id === src ? { ...u, healingDone: u.healingDone + heal } : u));
          }
        }
        break;
      case 'death':
        if (ev.targetId) patch(ev.targetId, (u) => ({ ...u, isAlive: false, hp: 0 }));
        break;
      case 'spawn':
        if (ev.unit && !next.some((u) => u.id === ev.unit!.id)) {
          next = [...next, snapshotOf(ev.unit as BattleUnit)];
        }
        break;
      case 'mana':
        if (ev.targetId && ev.value != null) {
          const mp = ev.value;
          patch(ev.targetId, (u) => ({ ...u, mana: Math.max(0, Math.min(u.maxMana, mp)) }));
        }
        break;
      case 'status_apply':
        if (ev.targetId && ev.status) {
          const st = ev.status;
          patch(ev.targetId, (u) =>
            u.statuses.some((s) => s.type === st)
              ? u
              : { ...u, statuses: [...u.statuses, { type: st, ticksRemaining: 4, power: ev.value ?? 1 }] });
        }
        break;
      case 'status_expire':
        if (ev.targetId && ev.status) {
          const st = ev.status;
          patch(ev.targetId, (u) => ({ ...u, statuses: u.statuses.filter((s) => s.type !== st) }));
        }
        break;
    }
  }
  return next;
}

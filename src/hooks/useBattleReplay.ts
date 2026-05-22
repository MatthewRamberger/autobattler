import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated } from 'react-native';
import {
  BattleUnit, BattleEvent, BattleLogEntry, GridPosition, Element,
} from '../types';
import { computeBattle, buildPlayerUnit, buildEnemyUnit } from '../utils/battleEngine';
import { LEVELS } from '../data/levels';
import { useGameStore, getHeroEffectiveStats, generateArenaWave } from '../store/gameStore';
import { HEX_COLS, HEX_ROWS, HexGrid, HexLayout, hexCenter } from '../utils/hex';
import { heroIdOfPlacement } from '../utils/placement';

// Legacy re-exports — kept so older imports still resolve.
export const GRID_COLS = HEX_COLS;
export const GRID_ROWS = HEX_ROWS;
// Slowed from 460 → 720 so individual attacks read clearly and the
// per-class attack animations have time to play out before the next
// event batch. battleSpeed (1×/2×/4×) still divides this so impatient
// players can fast-forward.
const BASE_TICK_MS = 720;

export interface UnitAnims {
  // Scale/opacity/flash/bob/shake/punch are still Animated.Values so we
  // can drive the small visual polish (idle bob, attack lunge, hit shake,
  // damage flash, death fade, spawn pop). Position is NOT animated here
  // — `LiveUnit.position` in state is rendered directly, so unit moves
  // are instant teleports between cells. Removing the position-animation
  // layer was necessary because mixed JS/native Animated graphs in this
  // RN + React combo were silently failing to propagate updates.
  flash: Animated.Value;        // 0..1 hit flash
  shake: Animated.Value;        // px shake
  punch: Animated.Value;        // 0..1 attack lunge (+ chop/dash blend)
  scale: Animated.Value;        // spawn/death scale
  opacity: Animated.Value;      // death fade
  bob: Animated.Value;          // idle bob 0..1 (looping)
  rotate: Animated.Value;       // -1..1 → -45°..+45° (chops, spins)
  cast: Animated.Value;         // 0..1 caster pulse (mage/cleric glow)
  facing: 1 | -1;               // attack lunge direction
  // Drives which timing curve `punch` is currently mid-play (so the
  // avatar component can blend extra effects per attack style — e.g.
  // archers get a pullback before the snap). Set fresh on every
  // attack event by the per-class dispatcher.
  attackStyle: AttackStyle;
}

// Per-class attack visual identity. Each style drives a slightly
// different combination of punch/rotate/scale/cast on the shared
// UnitAnims handles. Pure presentation — no engine effect.
export type AttackStyle =
  | 'melee_chop'   // Warrior/Paladin: heavy overhead chop
  | 'melee_spin'  // Berserker: spinning attack
  | 'melee_dash'   // Rogue/Monk: fast dash strike
  | 'ranged_snap'  // Archer: pullback then snap
  | 'cast_burst'  // Mage/Necromancer: cast pose + burst
  | 'cast_heal'    // Cleric/Druid: gentle uplift glow
  | 'generic';

export interface LiveUnit extends BattleUnit {
  position: GridPosition;
}

export interface VfxNumber {
  id: string; unitId: string; text: string; color: string; fontSize?: number; crit?: boolean;
}

export interface Projectile {
  id: string; from: GridPosition; to: GridPosition; element: Element; anim: Animated.Value;
}

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
  won: boolean; gold: number; exp: number; drop?: string;
  damageDealt: number; healingDone: number; killCount: number;
  unitStats: UnitStatLine[];
}

export type Phase = 'running' | 'paused' | 'done' | 'turn-wait';

/**
 * Owns the pre-computed battle, plays its event stream back on a timer, and
 * exposes plain render state plus a stable map of Animated handles. All
 * timers / animation frames are torn down on unmount and every state write is
 * guarded by a mounted flag, so finishing or leaving a battle can never set
 * state on an unmounted tree or leak an interval.
 *
 * Timer design: a single self-rescheduling `setTimeout` driven by a
 * `phase`/`battleSpeed` useEffect. When phase becomes 'paused' or 'done',
 * the effect cleanup cancels the next callback. Resuming or rotating speed
 * re-arms the loop.
 */
// Map a hero class to its signature attack visual. Projectile attacks
// route through `ranged_snap` for archer-shaped classes and `cast_burst`
// for caster-shaped ones; everything else is melee.
export function attackStyleFor(heroClass: string, isProjectile: boolean): AttackStyle {
  if (isProjectile) {
    switch (heroClass) {
      case 'Archer': return 'ranged_snap';
      case 'Mage':
      case 'Necromancer': return 'cast_burst';
      case 'Cleric':
      case 'Druid': return 'cast_heal';
      default: return 'ranged_snap';
    }
  }
  switch (heroClass) {
    case 'Warrior':
    case 'Paladin': return 'melee_chop';
    case 'Berserker': return 'melee_spin';
    case 'Rogue':
    case 'Monk': return 'melee_dash';
    case 'Archer': return 'ranged_snap';
    case 'Mage':
    case 'Necromancer': return 'cast_burst';
    case 'Cleric':
    case 'Druid': return 'cast_heal';
    default: return 'generic';
  }
}

// Run the per-class attack animation. Each style reuses the same shared
// UnitAnims handles (punch, rotate, scale, cast) but in different
// proportions so each class reads distinctly on screen.
//
// punch  → translateX  (forward lunge / dash)
// rotate → rotation    (chop swing / spin / pullback)
// scale  → bump        (pre-cast charge / dash burst)
// cast   → outer glow  (caster ring opacity)
export function playAttackAnim(a: UnitAnims, style: AttackStyle) {
  // Always reset shared values first so consecutive attacks don't pile up.
  a.punch.setValue(0); a.rotate.setValue(0); a.cast.setValue(0);
  switch (style) {
    case 'melee_chop':
      // Wind back, then chop down + forward step.
      Animated.sequence([
        Animated.timing(a.rotate, { toValue: -0.55, duration: 130, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(a.rotate, { toValue: 0.55, duration: 150, useNativeDriver: true }),
          Animated.timing(a.punch, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(a.rotate, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(a.punch, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]),
      ]).start();
      break;
    case 'melee_spin':
      // Continuous accelerating spin (0 → 2 maps to 0° → 720°), with a
      // small lunge in the middle. Snapping from 2 → 0 at the end is
      // visually invisible because 720° ≡ 0° on the rotation circle.
      Animated.parallel([
        Animated.sequence([
          Animated.timing(a.rotate, { toValue: 2, duration: 380, useNativeDriver: true }),
          Animated.timing(a.rotate, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(a.punch, { toValue: 0.7, duration: 200, useNativeDriver: true }),
          Animated.timing(a.punch, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]),
      ]).start();
      break;
    case 'melee_dash':
      // Crouch-and-burst forward dash.
      Animated.sequence([
        Animated.timing(a.scale, { toValue: 0.88, duration: 90, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(a.scale, { toValue: 1.08, duration: 100, useNativeDriver: true }),
          Animated.timing(a.punch, { toValue: 1.2, duration: 110, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(a.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(a.punch, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]),
      ]).start();
      break;
    case 'ranged_snap':
      // Pull back, then release forward.
      Animated.sequence([
        Animated.parallel([
          Animated.timing(a.punch, { toValue: -0.4, duration: 220, useNativeDriver: true }),
          Animated.timing(a.scale, { toValue: 0.96, duration: 220, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(a.punch, { toValue: 0.55, duration: 120, useNativeDriver: true }),
          Animated.timing(a.scale, { toValue: 1.04, duration: 120, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(a.punch, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(a.scale, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]),
      ]).start();
      break;
    case 'cast_burst':
      // Caster floats up + outer glow ring pulses.
      Animated.parallel([
        Animated.sequence([
          Animated.timing(a.scale, { toValue: 1.12, duration: 240, useNativeDriver: true }),
          Animated.timing(a.scale, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(a.cast, { toValue: 1, duration: 240, useNativeDriver: true }),
          Animated.timing(a.cast, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(a.punch, { toValue: 0.3, duration: 220, useNativeDriver: true }),
          Animated.timing(a.punch, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]),
      ]).start();
      break;
    case 'cast_heal':
      // Gentle uplift, no forward motion.
      Animated.parallel([
        Animated.sequence([
          Animated.timing(a.scale, { toValue: 1.08, duration: 280, useNativeDriver: true }),
          Animated.timing(a.scale, { toValue: 1, duration: 320, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(a.cast, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(a.cast, { toValue: 0, duration: 320, useNativeDriver: true }),
        ]),
      ]).start();
      break;
    default:
      Animated.sequence([
        Animated.timing(a.punch, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(a.punch, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
  }
}

export function useBattleReplay(layout: HexLayout, grid: HexGrid) {
  const store = useGameStore();
  const {
    currentLevelId, heroes, placedHeroes, applyBattleRewards,
    battleSpeed, arenaWave, setArenaWave,
  } = store;

  const isArena = currentLevelId === -1;
  const level = isArena ? null : LEVELS.find((l) => l.id === currentLevelId) ?? null;

  const [phase, setPhase] = useState<Phase>('running');
  const [units, setUnits] = useState<LiveUnit[]>([]);
  const [log, setLog] = useState<BattleLogEntry[]>([]);
  const [vfx, setVfx] = useState<VfxNumber[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<BattleResultSummary | null>(null);

  const mounted = useRef(true);
  const events = useRef<BattleEvent[]>([]);
  const logs = useRef<BattleLogEntry[]>([]);
  const evIdx = useRef(0);
  const tickRef = useRef(0);
  const anims = useRef<Map<string, UnitAnims>>(new Map());
  const timeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const finalUnits = useRef<BattleUnit[]>([]);
  const paused = useRef(false);
  const done = useRef(false);
  // Dedup key set so turn-by-turn doesn't double-push log entries when a
  // turn straddles a tick boundary that the loop visits twice.
  const displayedLogTicks = useRef<Set<string>>(new Set());

  const safeSet = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mounted.current) setter(value);
  }, []);

  const makeAnims = useCallback((facing: 1 | -1): UnitAnims => {
    const a: UnitAnims = {
      flash: new Animated.Value(0),
      shake: new Animated.Value(0),
      punch: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      bob: new Animated.Value(0),
      rotate: new Animated.Value(0),
      cast: new Animated.Value(0),
      facing,
      attackStyle: 'generic',
    };
    Animated.loop(
      Animated.sequence([
        Animated.timing(a.bob, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(a.bob, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    return a;
  }, []);

  const getAnims = useCallback((id: string) => anims.current.get(id), []);

  function scheduleTimeout(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      timeouts.current.delete(id);
      if (mounted.current) fn();
    }, ms);
    timeouts.current.add(id);
    return id;
  }

  // ---- one-time battle setup -------------------------------------------------
  useEffect(() => {
    // Reset every ref to fresh-battle defaults. This matters in React Strict
    // Mode's dev double-invocation: refs persist across the simulated
    // unmount → remount, so without explicit resets here `done.current`
    // from the first invocation would still be true on the second, and the
    // replay loop would bail forever (no events processed, no log entries,
    // no movement — exactly the bug pattern users were seeing).
    mounted.current = true;
    done.current = false;
    paused.current = false;
    evIdx.current = 0;
    tickRef.current = 0;
    anims.current = new Map();
    events.current = [];
    logs.current = [];
    finalUnits.current = [];
    displayedLogTicks.current = new Set();
    turnSourceRef.current = null;
    // Snapshot turn-by-turn setting at battle start so toggling mid-fight
    // doesn't deadlock the loop.
    turnByTurnRef.current = !!store.settings?.turnByTurn;
    safeSet(setPhase, 'running');
    safeSet(setTick, 0);
    safeSet(setLog, []);
    safeSet(setVfx, []);
    safeSet(setProjectiles, []);
    safeSet(setResult, null);

    try {
      const enemyCfg = level ? level.enemies : generateArenaWave(arenaWave);
      const enemyUnits = enemyCfg.map((e, idx) => buildEnemyUnit({
        name: e.name, heroClass: e.heroClass, level: e.level, position: e.position,
        icon: e.icon, index: idx, element: e.element, stars: e.stars, abilityId: e.abilityId,
      }));
      // Defensive: store.stronghold / store.settings may be missing from
      // very old saves where these fields didn't yet exist.
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

      // Diagnostic header pushed directly into the displayed log so we can
      // see from the screen alone whether setup actually produced a battle.
      // If any of these counts are 0 we know something's wrong with setup
      // even without a debugger attached.
      safeSet(setLog, [{
        tick: 0, type: 'system' as const,
        text: `🎯 ${playerUnits.length}v${enemyUnits.length} · ${computed.events.length} events queued`,
      }]);

      const all = [...playerUnits, ...enemyUnits];
      const map = new Map<string, UnitAnims>();
      for (const u of all) map.set(u.id, makeAnims(u.isPlayer ? 1 : -1));
      anims.current = map;
      setUnits(all.map((u) => ({ ...u, position: { ...u.position } })));
    } catch (err) {
      // Surface the failure: console + a visible combat-log entry so
      // we can actually see what blew up on device (console.warn is
      // invisible without a debugger).
      // eslint-disable-next-line no-console
      console.warn('[battle] setup failed', err);
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      safeSet(setLog, [{ tick: 0, type: 'system' as const, text: `⚠ Battle setup failed — ${msg}` }]);
      finish();
    }
    return () => {
      mounted.current = false;
      timeouts.current.forEach((t) => clearTimeout(t));
      timeouts.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Turn-by-turn: track which source we're currently presenting so we can
  // pause AFTER that source's full action (attack + resolution events) and
  // wait for the user to advance. Set whenever an action event is dispatched.
  const turnSourceRef = useRef<string | null>(null);
  // Snapshot of settings.turnByTurn captured at battle start. We don't react
  // to mid-battle toggles so the flow can't deadlock.
  const turnByTurnRef = useRef<boolean>(false);

  // ---- replay loop -----------------------------------------------------------
  // A self-rescheduling timeout: each tick processes one batch of events,
  // then schedules the next. Cleanup cancels the next callback on phase /
  // battle-speed change or unmount.
  //
  // Turn-by-turn flavor: we cut events at "action boundaries" — every
  // move/attack/projectile/ability from a NEW source ends the current
  // turn. When that mode is on, after each turn we flip phase to
  // 'turn-wait' and stop until the user calls advanceTurn().
  useEffect(() => {
    if (phase !== 'running') return;
    let cancelled = false;
    let tid: ReturnType<typeof setTimeout> | null = null;

    const isActionEvent = (e: BattleEvent) =>
      e.kind === 'move' || e.kind === 'attack' || e.kind === 'projectile' || e.kind === 'ability';

    const runOne = () => {
      if (cancelled || !mounted.current || done.current) return;
      if (paused.current) {
        tid = setTimeout(runOne, 100);
        return;
      }
      const evs = events.current;
      if (evIdx.current >= evs.length) {
        finish();
        return;
      }

      if (turnByTurnRef.current) {
        // Process exactly one "actor turn": consume events until either
        //  - we see a NEW action event whose source differs from the one
        //    we already accepted for this turn, OR
        //  - we run out of events.
        const batch: BattleEvent[] = [];
        let turnSource: string | null = null;
        let consumedAction = false;
        while (evIdx.current < evs.length) {
          const e = evs[evIdx.current];
          if (isActionEvent(e)) {
            if (!consumedAction) {
              turnSource = e.sourceId ?? null;
              consumedAction = true;
              batch.push(e);
              evIdx.current++;
              continue;
            }
            // Hitting another action event with a different source ends
            // this turn. Don't consume it; it kicks off the next one.
            if (e.sourceId !== turnSource) break;
            // Same source firing another action (rare — e.g. multi-hit
            // ability emitting its own events) — fold into this turn.
            batch.push(e);
            evIdx.current++;
            continue;
          }
          // Non-action events (damage/heal/status/etc) belong to the most
          // recent action's resolution. Always include them.
          batch.push(e);
          evIdx.current++;
        }

        if (batch.length) {
          const lastTick = batch[batch.length - 1].tick;
          tickRef.current = lastTick;
          safeSet(setTick, lastTick);
          applyEvents(batch);
          const ticks = new Set(batch.map((b) => b.tick));
          const newLogs = logs.current.filter((e) => ticks.has(e.tick) && !displayedLogTicks.current.has(`${e.tick}_${e.text}`));
          for (const l of newLogs) displayedLogTicks.current.add(`${l.tick}_${l.text}`);
          if (newLogs.length) setLog((prev) => [...prev, ...newLogs]);
          turnSourceRef.current = turnSource;
        }

        // Either wait for advance or finish.
        if (evIdx.current >= evs.length) {
          finish();
        } else {
          safeSet(setPhase, 'turn-wait');
        }
        return;
      }

      // Normal continuous playback — process all events at the current tick.
      const t = evs[evIdx.current]?.tick ?? tickRef.current;
      tickRef.current = t;
      safeSet(setTick, t);
      const batch: BattleEvent[] = [];
      while (evIdx.current < evs.length && evs[evIdx.current].tick === t) {
        batch.push(evs[evIdx.current]);
        evIdx.current++;
      }
      applyEvents(batch);
      const newLogs = logs.current.filter((e) => e.tick === t && !displayedLogTicks.current.has(`${e.tick}_${e.text}`));
      for (const l of newLogs) displayedLogTicks.current.add(`${l.tick}_${l.text}`);
      if (newLogs.length) setLog((prev) => [...prev, ...newLogs]);
      tid = setTimeout(runOne, BASE_TICK_MS / Math.max(1, store.battleSpeed));
    };

    // Wait one frame so the setup effect's setUnits has a chance to commit
    // before we start firing event batches that reference those units.
    tid = setTimeout(runOne, 16);

    return () => {
      cancelled = true;
      if (tid) clearTimeout(tid);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, battleSpeed]);

  // Pure data reduce; animation side-effects queued and flushed after commit.
  function applyEvents(batch: BattleEvent[]) {
    const map = anims.current;
    // Defensive: settings may be missing from old saves.
    const particles = store.settings?.particles ?? true;
    const reduce = store.settings?.reduceMotion ?? false;
    const fx: Array<() => void> = [];
    const float = (id: string, text: string, color: string, fontSize?: number, crit?: boolean) => {
      if (!particles) return;
      fx.push(() => spawnFloat(id, text, color, fontSize, crit));
    };

    setUnits((prev) => {
      let next = prev;
      const patch = (id: string, fn: (u: LiveUnit) => LiveUnit) => {
        next = next.map((u) => (u.id === id ? fn(u) : u));
      };
      for (const ev of batch) {
        switch (ev.kind) {
          case 'move':
            if (ev.toPosition && ev.sourceId) {
              const to = ev.toPosition;
              patch(ev.sourceId, (u) => ({ ...u, position: to }));
            }
            break;
          case 'attack':
          case 'projectile':
            if (ev.sourceId) {
              const src = next.find((u) => u.id === ev.sourceId);
              const a = map.get(ev.sourceId);
              if (a && !reduce && src) {
                const style = attackStyleFor(src.heroClass, ev.kind === 'projectile');
                a.attackStyle = style;
                fx.push(() => playAttackAnim(a, style));
              }
            }
            if (ev.kind === 'projectile' && ev.sourceId && ev.targetId) {
              const s = next.find((u) => u.id === ev.sourceId);
              const tg = next.find((u) => u.id === ev.targetId);
              if (s && tg && particles) {
                const from = s.position, toP = tg.position, el = ev.element ?? 'physical';
                // Projectile launches slightly after the caster's pullback
                // so the wind-up reads.
                fx.push(() => scheduleTimeout(() => spawnProjectile(from, toP, el), 180));
              }
            }
            break;
          case 'damage':
            if (ev.targetId) {
              const id = ev.targetId;
              const dmg = ev.value ?? 0;
              patch(id, (u) => ({ ...u, hp: Math.max(0, u.hp - dmg), damageTaken: u.damageTaken + dmg }));
              if (ev.sourceId) {
                const src = ev.sourceId;
                next = next.map((u) => (u.id === src ? { ...u, damageDealt: u.damageDealt + dmg } : u));
              }
              const a = map.get(id);
              if (a && !reduce) fx.push(() => {
                a.shake.setValue(0);
                Animated.sequence([
                  Animated.timing(a.shake, { toValue: 5, duration: 40, useNativeDriver: true }),
                  Animated.timing(a.shake, { toValue: -5, duration: 40, useNativeDriver: true }),
                  Animated.timing(a.shake, { toValue: 0, duration: 40, useNativeDriver: true }),
                ]).start();
                a.flash.setValue(1);
                Animated.timing(a.flash, { toValue: 0, duration: 240, useNativeDriver: true }).start();
              });
              float(id, `${ev.value}`, '#ffd24a');
            }
            break;
          case 'crit':
            if (ev.targetId) float(ev.targetId, `${ev.value}!`, '#ff5d3c', 22, true);
            break;
          case 'dodge':
            if (ev.targetId) float(ev.targetId, 'MISS', '#9fd3ff', 13);
            break;
          case 'heal':
            if (ev.targetId && ev.value) {
              const id = ev.targetId;
              const heal = ev.value ?? 0;
              patch(id, (u) => ({ ...u, hp: Math.min(u.maxHp, u.hp + heal) }));
              if (ev.sourceId) {
                const src = ev.sourceId;
                next = next.map((u) => (u.id === src ? { ...u, healingDone: u.healingDone + heal } : u));
              }
              float(id, `+${ev.value}`, '#5ef07a');
            }
            break;
          case 'shield':
            if (ev.targetId && ev.value) {
              const id = ev.targetId;
              patch(id, (u) => ({ ...u, shield: u.shield + (ev.value ?? 0) }));
              float(id, `+${ev.value}🛡`, '#ffd24a', 12);
            }
            break;
          case 'death':
            if (ev.targetId) {
              const id = ev.targetId;
              patch(id, (u) => ({ ...u, isAlive: false, hp: 0 }));
              const a = map.get(id);
              if (a) fx.push(() => Animated.parallel([
                Animated.timing(a.opacity, { toValue: 0.32, duration: 360, useNativeDriver: true }),
                Animated.timing(a.scale, { toValue: 0.72, duration: 360, useNativeDriver: true }),
              ]).start());
            }
            break;
          case 'ability':
            if (ev.sourceId) {
              const id = ev.sourceId;
              float(id, `${ev.text ?? 'Ability'}`, '#c9a3ff', 13);
              const a = map.get(id);
              if (a && !reduce) fx.push(() => {
                a.flash.setValue(0.7);
                Animated.timing(a.flash, { toValue: 0, duration: 400, useNativeDriver: true }).start();
              });
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
          case 'spawn':
            if (ev.unit && ev.unit.position && !next.some((p) => p.id === ev.unit!.id)) {
              const su = ev.unit;
              if (!map.has(su.id)) map.set(su.id, makeAnims(su.isPlayer ? 1 : -1));
              // Important: leave scale at the default 1. Earlier rounds tried
              // a 0 → 1 spring pop, but if the spring fails to fire (which
              // we've seen happen with native-driver Animated.Values in this
              // RN combo) the new unit stays at scale 0 forever — invisible
              // even though it's correctly in the units state. The HUD enemy
              // count would tick up but the user sees nothing on the field.
              next = [...next, { ...su, position: { ...su.position } }];
            }
            break;
        }
      }
      return next;
    });

    if (fx.length) {
      // Run side-effects on the next frame so React commits the state
      // update first; otherwise Animated.timing reads stale state.
      requestAnimationFrame(() => { for (const fn of fx) fn(); });
    }
  }

  function spawnFloat(unitId: string, text: string, color: string, fontSize?: number, crit?: boolean) {
    if (!mounted.current) return;
    const id = `${unitId}_${Math.random()}`;
    setVfx((prev) => [...prev, { id, unitId, text, color, fontSize, crit }]);
    scheduleTimeout(() => setVfx((prev) => prev.filter((v) => v.id !== id)), 850);
  }

  function spawnProjectile(from: GridPosition, to: GridPosition, element: Element) {
    const id = `p_${Math.random()}`;
    const anim = new Animated.Value(0);
    setProjectiles((prev) => [...prev, { id, from, to, element, anim }]);
    // Slowed (230 → 340ms) to match the new tick cadence and make the
    // arc of arrows / spells clearly readable.
    Animated.timing(anim, { toValue: 1, duration: 340, useNativeDriver: true }).start(() => {
      if (mounted.current) setProjectiles((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function finish() {
    if (done.current) return;
    done.current = true;
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
      const unitStats: UnitStatLine[] = fin.map((u) => ({
        id: u.id, name: u.name, heroClass: u.heroClass, icon: u.icon,
        isPlayer: u.isPlayer, isAlive: u.isAlive,
        damageDealt: u.damageDealt, damageTaken: u.damageTaken,
        healingDone: u.healingDone, killCount: u.killCount,
      }));

      let summary: BattleResultSummary;
      if (isArena) {
        const gold = won ? 30 + arenaWave * 15 : 5;
        const exp = won ? 20 + arenaWave * 10 : 5;
        applyBattleRewards(won, gold, exp, heroIds, { damage: dmg, kills });
        if (won) setArenaWave(arenaWave + 1);
        summary = { won, gold, exp, damageDealt: dmg, healingDone: heal, killCount: kills, unitStats };
      } else if (level) {
        const drops = level.rewards.possibleDrops;
        const drop = drops[Math.floor(Math.random() * drops.length)];
        const actualDrop = Math.random() < (won ? 0.55 : 0.1) ? drop : undefined;
        const gold = won ? level.rewards.gold : Math.floor(level.rewards.gold * 0.25);
        const exp = won ? level.rewards.experience : Math.floor(level.rewards.experience * 0.1);
        applyBattleRewards(won, gold, exp, heroIds, { damage: dmg, kills }, actualDrop);
        summary = { won, gold, exp, drop: actualDrop, damageDealt: dmg, healingDone: heal, killCount: kills, unitStats };
      } else {
        summary = { won, gold: 0, exp: 0, damageDealt: dmg, healingDone: heal, killCount: kills, unitStats };
      }
      safeSet(setResult, summary);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[battle] finish/rewards failed', err);
      safeSet(setResult, { won: false, gold: 0, exp: 0, damageDealt: 0, healingDone: 0, killCount: 0, unitStats: [] });
    }
  }

  const togglePause = useCallback(() => {
    if (done.current) return;
    // From the turn-wait state, treat pause toggle as "exit turn-by-turn for
    // this fight" — flip to running so playback continues.
    paused.current = !paused.current;
    safeSet(setPhase, paused.current ? 'paused' : 'running');
  }, [safeSet]);

  const advanceTurn = useCallback(() => {
    if (done.current) return;
    // From either turn-wait or paused, resume into the running phase. The
    // replay-loop effect re-arms on phase change.
    paused.current = false;
    safeSet(setPhase, 'running');
  }, [safeSet]);

  const toggleTurnByTurn = useCallback(() => {
    if (done.current) return;
    turnByTurnRef.current = !turnByTurnRef.current;
    // If we just turned it OFF mid-pause, push the loop back into running.
    if (!turnByTurnRef.current) {
      paused.current = false;
      safeSet(setPhase, 'running');
    }
  }, [safeSet]);

  const fastForward = useCallback(() => {
    if (done.current) return;
    paused.current = false;
    const evs = events.current;
    const rest: BattleEvent[] = [];
    while (evIdx.current < evs.length) { rest.push(evs[evIdx.current]); evIdx.current++; }
    if (rest.length) applyEvents(rest);
    setLog(logs.current.slice());
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isArena, level, phase, units, log, vfx, projectiles, tick, result,
    getAnims, togglePause, fastForward, advanceTurn, toggleTurnByTurn,
    turnByTurnActive: turnByTurnRef.current,
    turnSourceId: turnSourceRef.current,
  };
}

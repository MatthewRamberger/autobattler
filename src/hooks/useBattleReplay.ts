import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated } from 'react-native';
import {
  BattleUnit, BattleEvent, BattleLogEntry, GridPosition, Element,
} from '../types';
import { computeBattle, buildPlayerUnit, buildEnemyUnit } from '../utils/battleEngine';
import { LEVELS } from '../data/levels';
import { useGameStore, getHeroEffectiveStats, generateArenaWave } from '../store/gameStore';
import { HEX_COLS, HEX_ROWS, HexGrid, HexLayout, hexCenter } from '../utils/hex';

// Legacy re-exports — kept so older imports still resolve.
export const GRID_COLS = HEX_COLS;
export const GRID_ROWS = HEX_ROWS;
const BASE_TICK_MS = 460;

export interface UnitAnims {
  // Pixel-center coordinates in board space. Hex offset makes a (col,row)→
  // pixel mapping non-linear in row parity, so move tweens animate pixels
  // directly. The owning component is responsible for passing the layout
  // when it wants to map a fresh position back to pixels.
  x: Animated.Value;
  y: Animated.Value;
  flash: Animated.Value;        // 0..1 hit flash
  shake: Animated.Value;        // px shake
  punch: Animated.Value;        // 0..1 attack lunge
  scale: Animated.Value;        // spawn/death scale
  opacity: Animated.Value;      // death fade
  bob: Animated.Value;          // idle bob 0..1 (looping)
  facing: 1 | -1;               // attack lunge direction
}

export interface LiveUnit extends BattleUnit {
  position: GridPosition;
}

export interface VfxNumber {
  id: string; unitId: string; text: string; color: string; fontSize?: number; crit?: boolean;
}

export interface Projectile {
  id: string; from: GridPosition; to: GridPosition; element: Element; anim: Animated.Value;
}

export interface BattleResultSummary {
  won: boolean; gold: number; exp: number; drop?: string;
  damageDealt: number; healingDone: number; killCount: number;
}

export type Phase = 'running' | 'paused' | 'done';

/**
 * Owns the pre-computed battle, plays its event stream back on a timer, and
 * exposes plain render state plus a stable map of Animated handles. All
 * timers / animation frames are torn down on unmount and every state write is
 * guarded by a mounted flag, so finishing or leaving a battle can never set
 * state on an unmounted tree or leak an interval (the old finish-time crash).
 *
 * `layout` is the hex pixel layout of the rendered board — passed in by the
 * screen so move tweens can target real pixel centers. `grid` is the
 * abstract board (cols × rows × team zones) — passed to the engine so
 * bounds checks scale with siege maps.
 */
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
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafs = useRef<Set<number>>(new Set());
  const timeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const finalUnits = useRef<BattleUnit[]>([]);
  const paused = useRef(false);
  const done = useRef(false);

  const safeSet = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mounted.current) setter(value);
  }, []);

  // Keep latest layout in a ref so the makeAnims/move closures always see
  // the up-to-date pixel mapping if the screen resizes mid-battle.
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const makeAnims = useCallback((pos: GridPosition, facing: 1 | -1): UnitAnims => {
    const c = hexCenter(pos, layoutRef.current);
    const a: UnitAnims = {
      x: new Animated.Value(c.cx),
      y: new Animated.Value(c.cy),
      flash: new Animated.Value(0),
      shake: new Animated.Value(0),
      punch: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      bob: new Animated.Value(0),
      facing,
    };
    Animated.loop(
      Animated.sequence([
        Animated.timing(a.bob, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(a.bob, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    return a;
  }, []);

  const getAnims = useCallback((id: string) => anims.current.get(id), []);

  // ---- one-time battle setup -------------------------------------------------
  useEffect(() => {
    mounted.current = true;
    try {
      const enemyCfg = level ? level.enemies : generateArenaWave(arenaWave);
      const enemyUnits = enemyCfg.map((e, idx) => buildEnemyUnit({
        name: e.name, heroClass: e.heroClass, level: e.level, position: e.position,
        icon: e.icon, index: idx, element: e.element, stars: e.stars, abilityId: e.abilityId,
      }));
      const sanctumMana = (store.stronghold['sanctum'] ?? 0) * 8;
      const playerUnits = Object.entries(placedHeroes).flatMap(([heroId, pos]) => {
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
          stars: hero.stars, abilityId: hero.abilityId,
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
      const map = new Map<string, UnitAnims>();
      for (const u of all) map.set(u.id, makeAnims(u.position, u.isPlayer ? 1 : -1));
      anims.current = map;
      setUnits(all.map((u) => ({ ...u, position: { ...u.position } })));
      startTimer();
    } catch (err) {
      // Never let setup throw into render — show an immediate (empty) finish.
      // eslint-disable-next-line no-console
      console.warn('[battle] setup failed', err);
      finish();
    }
    return () => {
      mounted.current = false;
      if (timer.current) clearInterval(timer.current);
      rafs.current.forEach((r) => cancelAnimationFrame(r));
      timeouts.current.forEach((t) => clearTimeout(t));
      rafs.current.clear();
      timeouts.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startTimer() {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(step, BASE_TICK_MS / store.battleSpeed);
  }

  // restart cadence on speed change while running
  useEffect(() => {
    if (phase === 'running' && !done.current) startTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleSpeed]);

  function scheduleRaf(fn: () => void) {
    const id = requestAnimationFrame(() => {
      rafs.current.delete(id);
      if (mounted.current) fn();
    });
    rafs.current.add(id);
  }
  function scheduleTimeout(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      timeouts.current.delete(id);
      if (mounted.current) fn();
    }, ms);
    timeouts.current.add(id);
  }

  function step() {
    if (paused.current || done.current || !mounted.current) return;
    const evs = events.current;
    if (evIdx.current >= evs.length) { finish(); return; }
    const t = evs[evIdx.current]?.tick ?? tickRef.current;
    tickRef.current = t;
    safeSet(setTick, t);
    const batch: BattleEvent[] = [];
    while (evIdx.current < evs.length && evs[evIdx.current].tick === t) {
      batch.push(evs[evIdx.current]);
      evIdx.current++;
    }
    applyEvents(batch);
    const newLogs = logs.current.filter((e) => e.tick === t);
    if (newLogs.length) setLog((prev) => [...prev, ...newLogs]);
  }

  // Pure data reduce; animation side-effects queued and flushed after commit.
  function applyEvents(batch: BattleEvent[]) {
    const map = anims.current;
    const particles = store.settings.particles;
    const reduce = store.settings.reduceMotion;
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
              const a = map.get(ev.sourceId);
              if (a) {
                const target = hexCenter(to, layoutRef.current);
                fx.push(() => Animated.parallel([
                  Animated.timing(a.x, { toValue: target.cx, duration: 230, useNativeDriver: true }),
                  Animated.timing(a.y, { toValue: target.cy, duration: 230, useNativeDriver: true }),
                ]).start());
              }
            }
            break;
          case 'attack':
          case 'projectile':
            if (ev.sourceId) {
              const a = map.get(ev.sourceId);
              if (a && !reduce) fx.push(() => Animated.sequence([
                Animated.timing(a.punch, { toValue: 1, duration: 110, useNativeDriver: true }),
                Animated.timing(a.punch, { toValue: 0, duration: 160, useNativeDriver: true }),
              ]).start());
            }
            if (ev.kind === 'projectile' && ev.sourceId && ev.targetId) {
              const s = next.find((u) => u.id === ev.sourceId);
              const tg = next.find((u) => u.id === ev.targetId);
              if (s && tg && particles) {
                const from = s.position, toP = tg.position, el = ev.element ?? 'physical';
                fx.push(() => spawnProjectile(from, toP, el));
              }
            }
            break;
          case 'damage':
            if (ev.targetId) {
              const id = ev.targetId;
              patch(id, (u) => ({ ...u, hp: Math.max(0, u.hp - (ev.value ?? 0)) }));
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
              patch(id, (u) => ({ ...u, hp: Math.min(u.maxHp, u.hp + (ev.value ?? 0)) }));
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
              if (!map.has(su.id)) map.set(su.id, makeAnims(su.position, su.isPlayer ? 1 : -1));
              const a = map.get(su.id)!;
              a.scale.setValue(0);
              fx.push(() => Animated.spring(a.scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start());
              next = [...next, { ...su, position: { ...su.position } }];
            }
            break;
        }
      }
      return next;
    });

    if (fx.length) scheduleRaf(() => { for (const fn of fx) fn(); });
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
    Animated.timing(anim, { toValue: 1, duration: 230, useNativeDriver: true }).start(() => {
      if (mounted.current) setProjectiles((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function finish() {
    if (done.current) return;
    done.current = true;
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    safeSet(setPhase, 'done');

    try {
      const fin = finalUnits.current;
      const survivors = fin.filter((u) => u.isPlayer && u.isAlive);
      const won = survivors.length > 0 && fin.filter((u) => !u.isPlayer).every((u) => !u.isAlive);
      const heroIds = Object.keys(placedHeroes);
      const pUnits = fin.filter((u) => u.isPlayer);
      const dmg = pUnits.reduce((s, u) => s + u.damageDealt, 0);
      const heal = pUnits.reduce((s, u) => s + u.healingDone, 0);
      const kills = pUnits.reduce((s, u) => s + u.killCount, 0);

      let summary: BattleResultSummary;
      if (isArena) {
        const gold = won ? 30 + arenaWave * 15 : 5;
        const exp = won ? 20 + arenaWave * 10 : 5;
        applyBattleRewards(won, gold, exp, heroIds, { damage: dmg, kills });
        if (won) setArenaWave(arenaWave + 1);
        summary = { won, gold, exp, damageDealt: dmg, healingDone: heal, killCount: kills };
      } else if (level) {
        const drops = level.rewards.possibleDrops;
        const drop = drops[Math.floor(Math.random() * drops.length)];
        const actualDrop = Math.random() < (won ? 0.55 : 0.1) ? drop : undefined;
        const gold = won ? level.rewards.gold : Math.floor(level.rewards.gold * 0.25);
        const exp = won ? level.rewards.experience : Math.floor(level.rewards.experience * 0.1);
        applyBattleRewards(won, gold, exp, heroIds, { damage: dmg, kills }, actualDrop);
        summary = { won, gold, exp, drop: actualDrop, damageDealt: dmg, healingDone: heal, killCount: kills };
      } else {
        summary = { won, gold: 0, exp: 0, damageDealt: dmg, healingDone: heal, killCount: kills };
      }
      safeSet(setResult, summary);
    } catch (err) {
      // A failure applying rewards must never crash the app — still show a card.
      // eslint-disable-next-line no-console
      console.warn('[battle] finish/rewards failed', err);
      safeSet(setResult, { won: false, gold: 0, exp: 0, damageDealt: 0, healingDone: 0, killCount: 0 });
    }
  }

  const togglePause = useCallback(() => {
    if (done.current) return;
    paused.current = !paused.current;
    safeSet(setPhase, paused.current ? 'paused' : 'running');
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
    getAnims, togglePause, fastForward,
  };
}

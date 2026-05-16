import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore, getHeroEffectiveStats, generateArenaWave } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import {
  BattleUnit, BattleLogEntry, BattleEvent, GridPosition,
  Element, StatusEffectType,
} from '../types';
import { computeBattle, buildPlayerUnit, buildEnemyUnit } from '../utils/battleEngine';
import { ELEMENT_COLORS } from '../data/heroes';
import { ABILITIES } from '../data/abilities';
import HeroPortrait from '../components/HeroPortrait';
import FloatingNumber from '../components/FloatingNumber';
import { ScreenBackground, GButton, Panel, Plate, palette, gradients, radius } from '../components/ui';

const GRID_COLS = 10;
const GRID_ROWS = 3;
const BASE_TICK_MS = 480;

// Animation handles live OUTSIDE React state (a stable ref map keyed by unit
// id). State only holds plain serialisable battle data. This prevents the
// previous bug where Animated.start() ran inside setState updater functions.
interface UnitAnims {
  x: Animated.Value;
  y: Animated.Value;
  shake: Animated.Value;
  flash: Animated.Value;
}

interface LiveUnit extends BattleUnit {
  position: GridPosition;
}

interface VfxNumber {
  id: string; unitId: string; text: string; color: string; fontSize?: number;
}

interface Projectile {
  id: string; from: GridPosition; to: GridPosition; element: Element; anim: Animated.Value;
}

const STATUS_ICON: Record<StatusEffectType, string> = {
  poison: '☠️', burn: '🔥', stun: '💫', freeze: '❄️',
  slow: '🐌', regen: '💚', shield: '🛡️', taunt: '😡',
  rage: '💢', bleed: '🩸', blind: '🌑', silence: '🤐', fortify: '🪨',
};

export default function BattleScreen() {
  const store = useGameStore();
  const {
    currentLevelId, heroes, placedHeroes, setScreen, applyBattleRewards, clearPlacements,
    battleSpeed, setBattleSpeed, arenaWave, setArenaWave,
  } = store;

  const isArena = currentLevelId === -1;
  const level = isArena ? null : LEVELS.find((l) => l.id === currentLevelId);

  const [phase, setPhase] = useState<'running' | 'paused' | 'done'>('running');
  const [log, setLog] = useState<BattleLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'crits' | 'heals' | 'abilities' | 'deaths'>('all');
  const [liveUnits, setLiveUnits] = useState<LiveUnit[]>([]);
  const [vfxNumbers, setVfxNumbers] = useState<VfxNumber[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [currentTick, setCurrentTick] = useState(0);
  const [result, setResult] = useState<{
    won: boolean; gold: number; exp: number; drop?: string;
    damageDealt: number; healingDone: number; killCount: number;
  } | null>(null);

  const logScrollRef = useRef<ScrollView>(null);
  const eventsRef = useRef<BattleEvent[]>([]);
  const logRef = useRef<BattleLogEntry[]>([]);
  const eventIdxRef = useRef(0);
  const tickRef = useRef(0);
  const animsRef = useRef<Map<string, UnitAnims>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalUnitsRef = useRef<BattleUnit[]>([]);
  const pausedRef = useRef(false);
  const doneRef = useRef(false);

  useEffect(() => {
    initBattle();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function makeAnims(pos: GridPosition): UnitAnims {
    return {
      x: new Animated.Value(pos.col),
      y: new Animated.Value(pos.row),
      shake: new Animated.Value(0),
      flash: new Animated.Value(0),
    };
  }

  function initBattle() {
    const enemyUnits: BattleUnit[] = level
      ? level.enemies.map((e, idx) => buildEnemyUnit({
          name: e.name, heroClass: e.heroClass, level: e.level,
          position: e.position, icon: e.icon, index: idx,
          element: e.element, stars: e.stars, abilityId: e.abilityId,
        }))
      : generateArenaWave(arenaWave).map((e, idx) => buildEnemyUnit({
          name: e.name, heroClass: e.heroClass, level: e.level,
          position: e.position, icon: e.icon, index: idx,
          element: e.element, stars: e.stars, abilityId: e.abilityId,
        }));

    const sanctumMana = (store.stronghold['sanctum'] ?? 0) * 8;
    const playerUnits: BattleUnit[] = Object.entries(placedHeroes).flatMap(([heroId, pos]) => {
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

    const extraWaves: BattleUnit[][] | undefined = level?.waves?.map((wave, wi) =>
      wave.map((e, idx) => buildEnemyUnit({
        name: e.name, heroClass: e.heroClass, level: e.level,
        position: e.position, icon: e.icon, index: 100 + wi * 10 + idx,
        element: e.element, stars: e.stars, abilityId: e.abilityId,
      }))
    );

    const computed = computeBattle(playerUnits, enemyUnits, {
      bossMechanic: level?.bossMechanic,
      extraWaves,
    });
    eventsRef.current = computed.events;
    logRef.current = computed.log;
    finalUnitsRef.current = computed.finalUnits;

    const all = [...playerUnits, ...enemyUnits];
    const map = new Map<string, UnitAnims>();
    for (const u of all) map.set(u.id, makeAnims(u.position));
    animsRef.current = map;

    const initial: LiveUnit[] = all.map((u) => ({ ...u, position: { ...u.position } }));
    setLiveUnits(initial);
    setPhase('running');
    startTimer();
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(stepFrame, BASE_TICK_MS / store.battleSpeed);
  }

  useEffect(() => {
    if (phase === 'running') startTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.battleSpeed]);

  // -------- Frame stepping --------
  function stepFrame() {
    if (pausedRef.current || doneRef.current) return;
    const events = eventsRef.current;
    if (eventIdxRef.current >= events.length) {
      finishBattle();
      return;
    }
    const thisTick = events[eventIdxRef.current]?.tick ?? tickRef.current;
    tickRef.current = thisTick;
    setCurrentTick(thisTick);

    const tickEvents: BattleEvent[] = [];
    while (eventIdxRef.current < events.length && events[eventIdxRef.current].tick === thisTick) {
      tickEvents.push(events[eventIdxRef.current]);
      eventIdxRef.current++;
    }
    applyTickEvents(tickEvents);

    const newLogs = logRef.current.filter((e) => e.tick === thisTick);
    if (newLogs.length) {
      setLog((prev) => [...prev, ...newLogs]);
      setTimeout(() => logScrollRef.current?.scrollToEnd({ animated: true }), 30);
    }
  }

  // Pure data reducer + queued animation side-effects (run AFTER setState).
  function applyTickEvents(tickEvents: BattleEvent[]) {
    const anims = animsRef.current;
    const reduceMotion = store.settings.reduceMotion;
    const sideEffects: Array<() => void> = [];

    setLiveUnits((prev) => {
      let next = prev;
      const patch = (id: string, fn: (u: LiveUnit) => LiveUnit) => {
        next = next.map((u) => (u.id === id ? fn(u) : u));
      };

      for (const ev of tickEvents) {
        switch (ev.kind) {
          case 'move':
            if (ev.toPosition && ev.sourceId) {
              const to = ev.toPosition;
              patch(ev.sourceId, (u) => ({ ...u, position: to }));
              const a = anims.get(ev.sourceId);
              if (a) sideEffects.push(() => Animated.parallel([
                Animated.timing(a.x, { toValue: to.col, duration: 220, useNativeDriver: false }),
                Animated.timing(a.y, { toValue: to.row, duration: 220, useNativeDriver: false }),
              ]).start());
            }
            break;
          case 'damage':
            if (ev.targetId) {
              const id = ev.targetId;
              patch(id, (u) => ({ ...u, hp: Math.max(0, u.hp - (ev.value ?? 0)) }));
              const a = anims.get(id);
              if (a && !reduceMotion) sideEffects.push(() => {
                Animated.sequence([
                  Animated.timing(a.shake, { toValue: 6, duration: 45, useNativeDriver: true }),
                  Animated.timing(a.shake, { toValue: -6, duration: 45, useNativeDriver: true }),
                  Animated.timing(a.shake, { toValue: 0, duration: 45, useNativeDriver: true }),
                ]).start();
                Animated.sequence([
                  Animated.timing(a.flash, { toValue: 1, duration: 60, useNativeDriver: false }),
                  Animated.timing(a.flash, { toValue: 0, duration: 220, useNativeDriver: false }),
                ]).start();
              });
              queueFloat(sideEffects, id, `-${ev.value}`, ev.element ? ELEMENT_COLORS[ev.element] : '#ff6a55', 16);
            }
            break;
          case 'crit':
            if (ev.targetId) queueFloat(sideEffects, ev.targetId, `CRIT ${ev.value}!`, palette.gold, 21);
            break;
          case 'dodge':
            if (ev.targetId) queueFloat(sideEffects, ev.targetId, 'MISS', '#8fb7ff', 14);
            break;
          case 'heal':
            if (ev.targetId && ev.value) {
              const id = ev.targetId;
              patch(id, (u) => ({ ...u, hp: Math.min(u.maxHp, u.hp + (ev.value ?? 0)) }));
              queueFloat(sideEffects, id, `+${ev.value}`, '#56d364', 16);
            }
            break;
          case 'shield':
            if (ev.targetId && ev.value) {
              const id = ev.targetId;
              patch(id, (u) => ({ ...u, shield: u.shield + (ev.value ?? 0) }));
              queueFloat(sideEffects, id, `+${ev.value}🛡`, palette.gold, 12);
            }
            break;
          case 'death':
            if (ev.targetId) patch(ev.targetId, (u) => ({ ...u, isAlive: false, hp: 0 }));
            break;
          case 'ability':
            if (ev.sourceId) {
              const id = ev.sourceId;
              queueFloat(sideEffects, id, `★ ${ev.text ?? 'Ability'}`, '#b89bff', 14);
              const a = anims.get(id);
              if (a && !reduceMotion) sideEffects.push(() => Animated.sequence([
                Animated.timing(a.flash, { toValue: 0.8, duration: 180, useNativeDriver: false }),
                Animated.timing(a.flash, { toValue: 0, duration: 280, useNativeDriver: false }),
              ]).start());
            }
            break;
          case 'status_apply':
            if (ev.targetId && ev.status) {
              const st = ev.status;
              patch(ev.targetId, (u) =>
                u.statuses.some((s) => s.type === st)
                  ? u
                  : { ...u, statuses: [...u.statuses, { type: st, ticksRemaining: 4, power: ev.value ?? 1 }] }
              );
              queueFloat(sideEffects, ev.targetId, STATUS_ICON[st] ?? '?', '#d8cfe8', 14);
            }
            break;
          case 'status_expire':
            if (ev.targetId && ev.status) {
              const st = ev.status;
              patch(ev.targetId, (u) => ({ ...u, statuses: u.statuses.filter((s) => s.type !== st) }));
            }
            break;
          case 'projectile':
            if (ev.sourceId && ev.targetId) {
              const src = next.find((u) => u.id === ev.sourceId);
              const tgt = next.find((u) => u.id === ev.targetId);
              if (src && tgt) {
                const from = src.position, to = tgt.position, el = ev.element ?? 'physical';
                sideEffects.push(() => launchProjectile(from, to, el));
              }
            }
            break;
          case 'spawn':
            if (ev.unit) {
              const su = ev.unit;
              if (!next.some((p) => p.id === su.id)) {
                if (!anims.has(su.id)) anims.set(su.id, makeAnims(su.position));
                next = [...next, { ...su, position: { ...su.position } }];
              }
            }
            break;
        }
      }
      return next;
    });

    // Side effects run after the state update is queued — never inside it.
    requestAnimationFrame(() => { for (const fn of sideEffects) fn(); });
  }

  function queueFloat(bucket: Array<() => void>, unitId: string, text: string, color: string, fontSize?: number) {
    if (!store.settings.particles) return;
    bucket.push(() => spawnFloating(unitId, text, color, fontSize));
  }

  function spawnFloating(unitId: string, text: string, color: string, fontSize?: number) {
    const id = `${unitId}_${Math.random()}`;
    setVfxNumbers((prev) => [...prev, { id, unitId, text, color, fontSize }]);
    setTimeout(() => setVfxNumbers((prev) => prev.filter((v) => v.id !== id)), 900);
  }

  function launchProjectile(from: GridPosition, to: GridPosition, element: Element) {
    if (!store.settings.particles) return;
    const id = `proj_${Math.random()}`;
    const anim = new Animated.Value(0);
    setProjectiles((prev) => [...prev, { id, from, to, element, anim }]);
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: false }).start(() => {
      setProjectiles((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function finishBattle() {
    if (doneRef.current) return;
    doneRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('done');
    const finalUnits = finalUnitsRef.current;
    const survivors = finalUnits.filter((u) => u.isPlayer && u.isAlive);
    const won = survivors.length > 0 && finalUnits.filter((u) => !u.isPlayer).every((u) => !u.isAlive);

    const playerHeroIds = Object.keys(placedHeroes);
    const playerUnits = finalUnits.filter((u) => u.isPlayer);
    const totalDamage = playerUnits.reduce((s, u) => s + u.damageDealt, 0);
    const totalHealing = playerUnits.reduce((s, u) => s + u.healingDone, 0);
    const totalKills = playerUnits.reduce((s, u) => s + u.killCount, 0);

    if (isArena) {
      const gold = won ? 30 + arenaWave * 15 : 5;
      const exp = won ? 20 + arenaWave * 10 : 5;
      applyBattleRewards(won, gold, exp, playerHeroIds, { damage: totalDamage, kills: totalKills });
      if (won) setArenaWave(arenaWave + 1);
      setResult({ won, gold, exp, drop: undefined, damageDealt: totalDamage, healingDone: totalHealing, killCount: totalKills });
    } else if (level) {
      const drops = level.rewards.possibleDrops;
      const drop = drops[Math.floor(Math.random() * drops.length)];
      const actualDrop = Math.random() < (won ? 0.55 : 0.1) ? drop : undefined;
      const gold = won ? level.rewards.gold : Math.floor(level.rewards.gold * 0.25);
      const exp = won ? level.rewards.experience : Math.floor(level.rewards.experience * 0.1);
      applyBattleRewards(won, gold, exp, playerHeroIds, { damage: totalDamage, kills: totalKills }, actualDrop);
      setResult({ won, gold, exp, drop: actualDrop, damageDealt: totalDamage, healingDone: totalHealing, killCount: totalKills });
    } else {
      setResult({ won, gold: 0, exp: 0, damageDealt: totalDamage, healingDone: totalHealing, killCount: totalKills });
    }
  }

  function handleDone() {
    clearPlacements();
    setScreen(isArena ? 'arena' : 'levels');
  }
  function handleRetry() {
    setScreen(isArena ? 'arena' : 'battle-prep');
  }
  function togglePause() {
    pausedRef.current = !pausedRef.current;
    setPhase(pausedRef.current ? 'paused' : 'running');
  }
  function fastForward() {
    pausedRef.current = false;
    const events = eventsRef.current;
    const remaining: BattleEvent[] = [];
    while (eventIdxRef.current < events.length) {
      remaining.push(events[eventIdxRef.current]);
      eventIdxRef.current++;
    }
    if (remaining.length) applyTickEvents(remaining);
    setLog(logRef.current);
    finishBattle();
  }

  const filteredLog = log.filter((e) => {
    if (logFilter === 'all') return true;
    if (logFilter === 'crits') return e.type === 'crit';
    if (logFilter === 'heals') return e.type === 'heal';
    if (logFilter === 'abilities') return e.type === 'ability';
    if (logFilter === 'deaths') return e.type === 'death' || e.type === 'victory' || e.type === 'defeat';
    return true;
  });

  const players = liveUnits.filter((u) => u.isPlayer);
  const enemies = liveUnits.filter((u) => !u.isPlayer);

  return (
    <View style={styles.container}>
      <ScreenBackground />

      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudSide}>
          <Text style={styles.teamTag}>⚔️ YOUR ARMY</Text>
          <Text style={styles.teamCount}>{players.filter((u) => u.isAlive).length}/{players.length}</Text>
        </View>
        <View style={styles.hudCenter}>
          <LinearGradient colors={gradients.banner} style={styles.titleBanner}>
            <Text style={styles.titleText} numberOfLines={1}>
              {isArena ? `ARENA · WAVE ${arenaWave}` : level?.name ?? 'BATTLE'}
            </Text>
          </LinearGradient>
          <View style={styles.tickPill}>
            <Text style={styles.tickText}>
              {phase === 'paused' ? 'PAUSED' : phase === 'done' ? (result?.won ? 'VICTORY' : 'DEFEAT') : `TICK ${currentTick}`}
            </Text>
          </View>
        </View>
        <View style={[styles.hudSide, { alignItems: 'flex-end' }]}>
          <Text style={[styles.teamTag, { color: '#ff9a8a' }]}>ENEMY 🔥</Text>
          <Text style={styles.teamCount}>{enemies.filter((u) => u.isAlive).length}/{enemies.length}</Text>
        </View>
      </View>

      {/* Controls */}
      {phase !== 'done' && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.ctrl} onPress={() => setBattleSpeed(battleSpeed === 1 ? 2 : battleSpeed === 2 ? 4 : 1)}>
            <Text style={styles.ctrlText}>{battleSpeed}×</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrl} onPress={togglePause}>
            <Text style={styles.ctrlText}>{phase === 'paused' ? '▶' : '❚❚'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrl} onPress={fastForward}>
            <Text style={styles.ctrlText}>⏭</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Arena */}
      <View style={styles.arenaWrap}>
        <View style={styles.arena}>
          {Array.from({ length: GRID_ROWS }, (_, row) => (
            <View key={row} style={styles.arenaRow}>
              {Array.from({ length: GRID_COLS }, (_, col) => {
                const playerSide = col <= 4;
                return (
                  <LinearGradient
                    key={col}
                    colors={playerSide ? gradients.arenaPlayer : gradients.arenaEnemy}
                    style={[
                      styles.cell,
                      (row + col) % 2 === 0 && { opacity: 0.82 },
                      col === 4 && styles.midLineR,
                      col === 5 && styles.midLineL,
                    ]}
                  />
                );
              })}
            </View>
          ))}
          <View style={styles.midGlow} pointerEvents="none" />

          <View style={styles.layer} pointerEvents="none">
            {liveUnits.map((u) => (
              <UnitToken
                key={u.id}
                unit={u}
                anims={animsRef.current.get(u.id)}
                vfx={vfxNumbers.filter((v) => v.unitId === u.id)}
              />
            ))}
          </View>
          <View style={styles.layer} pointerEvents="none">
            {projectiles.map((p) => <ProjectileVfx key={p.id} proj={p} />)}
          </View>
        </View>
      </View>

      {/* Health roster */}
      <View style={styles.roster}>
        <View style={styles.rosterCol}>
          {players.map((u) => <UnitBar key={u.id} unit={u} friendly />)}
        </View>
        <View style={styles.rosterDivider} />
        <View style={styles.rosterCol}>
          {enemies.map((u) => <UnitBar key={u.id} unit={u} friendly={false} />)}
        </View>
      </View>

      {/* Battle log */}
      <Panel style={styles.logPanel} padded={false}>
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>⚔ COMBAT LOG</Text>
          <View style={styles.logFilters}>
            {(['all', 'crits', 'heals', 'abilities', 'deaths'] as const).map((f) => (
              <TouchableOpacity key={f} onPress={() => setLogFilter(f)} style={[styles.logChip, logFilter === f && styles.logChipOn]}>
                <Text style={[styles.logChipText, logFilter === f && styles.logChipTextOn]}>
                  {f === 'all' ? 'ALL' : f.slice(0, 3).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <ScrollView ref={logScrollRef} style={styles.logScroll} showsVerticalScrollIndicator={false}>
          {filteredLog.map((entry, idx) => (
            <Text key={idx} style={[styles.logLine, logColor(entry.type)]}>{entry.text}</Text>
          ))}
        </ScrollView>
      </Panel>

      {/* Result */}
      {phase === 'done' && result && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultCardOuter}>
            <LinearGradient
              colors={result.won ? (['#3a2e12', '#241d33'] as const) : (['#3a1620', '#241320'] as const)}
              style={styles.resultCard}
            >
              <LinearGradient
                colors={result.won ? gradients.banner : (['#ff6a55', '#cf3623'] as const)}
                style={styles.resultBanner}
              >
                <Text style={styles.resultBannerText}>{result.won ? 'VICTORY!' : 'DEFEAT'}</Text>
              </LinearGradient>
              <Text style={styles.resultEmoji}>{result.won ? '👑' : '💀'}</Text>
              {result.won && <Text style={styles.stars}>⭐ ⭐ ⭐</Text>}

              <View style={styles.resultStats}>
                <ResultStat label="DAMAGE" value={result.damageDealt} />
                <ResultStat label="HEALED" value={result.healingDone} />
                <ResultStat label="KILLS" value={result.killCount} />
              </View>

              <Plate style={styles.rewards}>
                <Text style={styles.rewardRow}>🪙  +{result.gold} Gold</Text>
                <Text style={styles.rewardRow}>⭐  +{result.exp} XP</Text>
                {result.won && <Text style={styles.rewardRow}>💎  +2 Gems</Text>}
                {result.drop && <Text style={[styles.rewardRow, { color: palette.gold }]}>🎁  Item dropped!</Text>}
              </Plate>

              <View style={styles.resultBtns}>
                <GButton label="Retry" variant="purple" onPress={handleRetry} style={{ flex: 1 }} />
                <GButton label={isArena ? 'Arena' : 'Campaign'} variant="gold" onPress={handleDone} style={{ flex: 1 }} />
              </View>
            </LinearGradient>
          </View>
        </View>
      )}
    </View>
  );
}

function logColor(type: BattleLogEntry['type']) {
  switch (type) {
    case 'death': return { color: '#ff7a68' };
    case 'crit': return { color: palette.gold, fontWeight: '800' as const };
    case 'ability': return { color: '#b89bff' };
    case 'heal': return { color: '#56d364' };
    case 'status': return { color: '#caa8ff' };
    case 'victory': return { color: palette.gold, fontWeight: '900' as const, fontSize: 13 };
    case 'defeat': return { color: '#ff6a55', fontWeight: '900' as const, fontSize: 13 };
    default: return { color: '#a99fc0' };
  }
}

function ResultStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: palette.gold, fontSize: 20, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: palette.textMute, fontSize: 9, marginTop: 2, letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

function UnitToken({ unit, anims, vfx }: { unit: LiveUnit; anims?: UnitAnims; vfx: VfxNumber[] }) {
  const cellW = 1 / GRID_COLS;
  const rowH = 1 / GRID_ROWS;
  const ax = anims?.x ?? new Animated.Value(unit.position.col);
  const ay = anims?.y ?? new Animated.Value(unit.position.row);
  const shake = anims?.shake ?? new Animated.Value(0);
  const flash = anims?.flash ?? new Animated.Value(0);

  const left = ax.interpolate({ inputRange: [0, GRID_COLS - 1], outputRange: ['0%', `${(GRID_COLS - 1) * cellW * 100}%`] });
  const top = ay.interpolate({ inputRange: [0, GRID_ROWS - 1], outputRange: ['0%', `${(GRID_ROWS - 1) * rowH * 100}%`] });
  const flashColor = flash.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0)', 'rgba(255,90,90,0.65)'] });

  return (
    <Animated.View
      style={{
        position: 'absolute', left, top,
        width: `${cellW * 100}%`, height: `${rowH * 100}%`,
        transform: [{ translateX: shake }],
      }}
    >
      <View style={{ flex: 1, padding: 3, alignItems: 'center', justifyContent: 'center' }}>
        {unit.isAlive ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={[
              styles.tokenRing,
              { borderColor: unit.isPlayer ? palette.blue : palette.red,
                shadowColor: unit.isPlayer ? palette.blue : palette.red },
            ]}>
              <HeroPortrait
                size={50}
                heroClass={unit.heroClass}
                rarity={'common'}
                icon={unit.icon}
                element={unit.element}
                seed={unit.portraitSeed}
                stars={unit.stars}
                isEnemy={!unit.isPlayer}
                hpPct={unit.hp / Math.max(1, unit.maxHp)}
                manaPct={unit.mana / Math.max(1, unit.maxMana)}
                shieldPct={unit.shield > 0 ? unit.shield / Math.max(1, unit.maxHp) : 0}
                showFrame={false}
              />
              <Animated.View pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject, backgroundColor: flashColor, borderRadius: 10 }} />
            </View>
            {unit.statuses.length > 0 && (
              <View style={styles.statusStrip}>
                {unit.statuses.slice(0, 4).map((s, i) => (
                  <Text key={i} style={{ fontSize: 9 }}>{STATUS_ICON[s.type]}</Text>
                ))}
              </View>
            )}
            {unit.abilityId && (
              <View style={[
                styles.abilityPip,
                unit.ticksUntilAbility === 0 && unit.mana >= (ABILITIES[unit.abilityId]?.manaCost ?? 999) && styles.abilityPipReady,
              ]}>
                <Text style={styles.abilityPipText}>
                  {unit.ticksUntilAbility === 0 ? (ABILITIES[unit.abilityId]?.icon ?? '✦') : unit.ticksUntilAbility}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ fontSize: 24, opacity: 0.35 }}>💀</Text>
        )}
        {vfx.map((v) => <FloatingNumber key={v.id} text={v.text} color={v.color} fontSize={v.fontSize} />)}
      </View>
    </Animated.View>
  );
}

function ProjectileVfx({ proj }: { proj: Projectile }) {
  const cellW = 1 / GRID_COLS;
  const rowH = 1 / GRID_ROWS;
  const left = proj.anim.interpolate({ inputRange: [0, 1], outputRange: [`${proj.from.col * cellW * 100}%`, `${proj.to.col * cellW * 100}%`] });
  const top = proj.anim.interpolate({ inputRange: [0, 1], outputRange: [`${proj.from.row * rowH * 100}%`, `${proj.to.row * rowH * 100}%`] });
  const glyph: Record<Element, string> = {
    physical: '➤', fire: '🔥', ice: '❄', lightning: '⚡', holy: '✨', shadow: '🌑', nature: '🍃',
  };
  return (
    <Animated.View
      style={{ position: 'absolute', left, top, width: `${cellW * 100}%`, height: `${rowH * 100}%`, alignItems: 'center', justifyContent: 'center' }}
      pointerEvents="none"
    >
      <Text style={{ fontSize: 18, color: ELEMENT_COLORS[proj.element] }}>{glyph[proj.element]}</Text>
    </Animated.View>
  );
}

function UnitBar({ unit, friendly }: { unit: LiveUnit; friendly: boolean }) {
  const pct = unit.isAlive ? unit.hp / Math.max(1, unit.maxHp) : 0;
  const mpct = unit.maxMana > 0 ? unit.mana / unit.maxMana : 0;
  const ability = unit.abilityId ? ABILITIES[unit.abilityId] : null;
  const ready = ability && unit.ticksUntilAbility === 0 && unit.mana >= ability.manaCost && unit.isAlive;
  return (
    <View style={styles.unitBar}>
      <Text style={styles.unitIcon}>{unit.isAlive ? unit.icon : '💀'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.unitName, !unit.isAlive && styles.unitDead]} numberOfLines={1}>
          {unit.name}{ready ? ' ✦' : ''}
        </Text>
        <View style={styles.hpTrack}>
          <LinearGradient
            colors={friendly ? (['#6df07a', '#2c9c3a'] as const) : (['#ff8f7a', '#cf3623'] as const)}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: `${pct * 100}%`, height: '100%' }}
          />
        </View>
        {unit.maxMana > 0 && (
          <View style={[styles.hpTrack, { height: 3, marginTop: 2 }]}>
            <View style={{ width: `${mpct * 100}%`, height: '100%', backgroundColor: palette.blue }} />
          </View>
        )}
      </View>
      <Text style={[styles.unitHp, !unit.isAlive && styles.unitDead]}>{unit.isAlive ? unit.hp : '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bgBot },
  hud: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingTop: 14, paddingBottom: 6, gap: 8,
  },
  hudSide: { width: 78 },
  hudCenter: { flex: 1, alignItems: 'center', gap: 4 },
  teamTag: { color: '#8fd0ff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  teamCount: { color: palette.text, fontSize: 16, fontWeight: '900' },
  titleBanner: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 2, borderColor: '#fff6' },
  titleText: { color: '#5a3c08', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  tickPill: { backgroundColor: palette.panelDeep, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 2, borderWidth: 1, borderColor: '#0007' },
  tickText: { color: palette.textSoft, fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 4 },
  ctrl: {
    backgroundColor: palette.panelDeep, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 2, borderColor: palette.goldDark, minWidth: 50, alignItems: 'center',
  },
  ctrlText: { color: palette.gold, fontWeight: '900', fontSize: 14 },
  arenaWrap: { paddingHorizontal: 8, paddingVertical: 6 },
  arena: {
    borderRadius: radius.lg, overflow: 'hidden', borderWidth: 3, borderColor: palette.goldDeep,
    backgroundColor: '#10182a',
  },
  arenaRow: { flexDirection: 'row' },
  cell: { flex: 1, aspectRatio: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: '#ffffff10' },
  midLineR: { borderRightWidth: 2, borderRightColor: palette.gold + '99' },
  midLineL: { borderLeftWidth: 0 },
  midGlow: {
    position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2,
    backgroundColor: palette.gold, opacity: 0.5,
  },
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  tokenRing: {
    borderRadius: 12, borderWidth: 2, overflow: 'hidden',
    shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  statusStrip: {
    position: 'absolute', top: -6, flexDirection: 'row', gap: 1,
    backgroundColor: '#000a', borderRadius: 4, paddingHorizontal: 2,
  },
  abilityPip: {
    position: 'absolute', bottom: -3, right: -3, width: 17, height: 17, borderRadius: 9,
    backgroundColor: '#000b', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#555',
  },
  abilityPipReady: { borderColor: '#fff', backgroundColor: palette.purple, ...({ shadowColor: palette.purple, shadowRadius: 6, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 }, elevation: 6 }) },
  abilityPipText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  roster: {
    flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, gap: 8, maxHeight: 132,
  },
  rosterCol: { flex: 1, gap: 4 },
  rosterDivider: { width: 2, backgroundColor: palette.gold + '33', borderRadius: 1 },
  unitBar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unitIcon: { fontSize: 15, width: 20, textAlign: 'center' },
  unitName: { color: palette.textSoft, fontSize: 9, fontWeight: '700', marginBottom: 2 },
  unitDead: { color: '#5b5470', textDecorationLine: 'line-through' },
  hpTrack: { height: 6, backgroundColor: palette.trackBg, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: '#0006' },
  unitHp: { color: palette.textMute, fontSize: 9, fontWeight: '800', width: 34, textAlign: 'right' },
  logPanel: { flex: 1, marginHorizontal: 10, marginBottom: 10 },
  logHeader: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 6 },
  logTitle: { color: palette.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1, flex: 1 },
  logFilters: { flexDirection: 'row', gap: 3 },
  logChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: palette.panelDeep, borderWidth: 1, borderColor: '#0006' },
  logChipOn: { backgroundColor: palette.purpleDeep, borderColor: palette.purple },
  logChipText: { color: palette.textMute, fontSize: 8, fontWeight: '800' },
  logChipTextOn: { color: '#fff' },
  logScroll: { flex: 1, paddingHorizontal: 10, paddingBottom: 8 },
  logLine: { fontSize: 11, marginBottom: 3, lineHeight: 15 },
  resultOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000d0', justifyContent: 'center', alignItems: 'center', padding: 24 },
  resultCardOuter: { width: '100%', borderRadius: radius.xl, borderWidth: 3, borderColor: palette.goldDeep, overflow: 'hidden', ...({ shadowColor: palette.gold, shadowOpacity: 0.8, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 16 }) },
  resultCard: { padding: 22, alignItems: 'center' },
  resultBanner: { paddingHorizontal: 30, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: '#fff6', marginTop: -4 },
  resultBannerText: { color: '#5a3c08', fontWeight: '900', fontSize: 22, letterSpacing: 2 },
  resultEmoji: { fontSize: 58, marginVertical: 8 },
  stars: { fontSize: 22, letterSpacing: 4, marginBottom: 8 },
  resultStats: { flexDirection: 'row', width: '100%', marginBottom: 14 },
  rewards: { width: '100%', gap: 6, marginBottom: 16, alignItems: 'center' },
  rewardRow: { color: palette.textSoft, fontSize: 14, fontWeight: '700' },
  resultBtns: { flexDirection: 'row', gap: 10, width: '100%' },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Animated,
} from 'react-native';
import { useGameStore, getHeroEffectiveStats, generateArenaWave } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import {
  BattleUnit, BattleLogEntry, BattleEvent, GridPosition, FloatingNumber as FloatingNumberData,
  Element, StatusEffectType,
} from '../types';
import { computeBattle, buildPlayerUnit, buildEnemyUnit } from '../utils/battleEngine';
import { CLASS_COLORS, ELEMENT_COLORS } from '../data/heroes';
import { ABILITIES } from '../data/abilities';
import HeroPortrait from '../components/HeroPortrait';
import FloatingNumber from '../components/FloatingNumber';

const GRID_COLS = 10;
const GRID_ROWS = 3;
const BASE_TICK_MS = 500;

interface LiveUnit extends BattleUnit {
  shake: Animated.Value;
  flash: Animated.Value;
  position: GridPosition;
  positionAnim: { x: Animated.Value; y: Animated.Value };
}

interface VfxNumber {
  id: string;
  unitId: string;
  text: string;
  color: string;
  fontSize?: number;
}

interface Projectile {
  id: string;
  from: GridPosition;
  to: GridPosition;
  element: Element;
  anim: Animated.Value;
}

function themeFor(difficulty: string) {
  switch (difficulty) {
    case 'easy': return { player: '#0d1a0d', enemy: '#1a0d0d' };
    case 'medium': return { player: '#0d1a1a', enemy: '#1a1a0d' };
    case 'hard': return { player: '#0d0d1a', enemy: '#1f0d12' };
    case 'boss': return { player: '#1a0d1a', enemy: '#1a0d0d' };
    case 'nightmare': return { player: '#0a0a1a', enemy: '#1a0a0a' };
    default: return { player: '#0d1a0d', enemy: '#1a0d0d' };
  }
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

  const [phase, setPhase] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
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
  const liveUnitsRef = useRef<LiveUnit[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalUnitsRef = useRef<BattleUnit[]>([]);
  const pausedRef = useRef(false);

  useEffect(() => {
    initBattle();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function buildArenaEnemies(): BattleUnit[] {
    const cfgs = generateArenaWave(arenaWave);
    return cfgs.map((e, idx) => buildEnemyUnit({
      name: e.name, heroClass: e.heroClass, level: e.level,
      position: e.position, icon: e.icon, index: idx,
      element: e.element, stars: e.stars, abilityId: e.abilityId,
    }));
  }

  function initBattle() {
    const enemyUnits: BattleUnit[] = level
      ? level.enemies.map((e, idx) => buildEnemyUnit({
          name: e.name, heroClass: e.heroClass, level: e.level,
          position: e.position, icon: e.icon, index: idx,
          element: e.element, stars: e.stars, abilityId: e.abilityId,
        }))
      : buildArenaEnemies();

    const sanctumMana = (store.stronghold['sanctum'] ?? 0) * 8;
    const playerUnits: BattleUnit[] = Object.entries(placedHeroes).map(([heroId, pos]) => {
      const hero = heroes[heroId];
      const stats = getHeroEffectiveStats(heroId, store)!;
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
      return u;
    });

    // Build extra waves if the level defines them.
    const extraWaves: BattleUnit[][] | undefined = level?.waves?.map((wave, wi) =>
      wave.map((e, idx) => buildEnemyUnit({
        name: e.name, heroClass: e.heroClass, level: e.level,
        position: e.position, icon: e.icon, index: 100 + wi * 10 + idx,
        element: e.element, stars: e.stars, abilityId: e.abilityId,
      }))
    );

    // Pre-compute the full battle.
    const result = computeBattle(playerUnits, enemyUnits, {
      bossMechanic: level?.bossMechanic,
      extraWaves,
    });
    eventsRef.current = result.events;
    logRef.current = result.log;
    finalUnitsRef.current = result.finalUnits;

    const allLive: LiveUnit[] = [...playerUnits, ...enemyUnits].map((u) => ({
      ...u,
      position: { ...u.position },
      shake: new Animated.Value(0),
      flash: new Animated.Value(0),
      positionAnim: { x: new Animated.Value(u.position.col), y: new Animated.Value(u.position.row) },
    }));
    setLiveUnits(allLive);
    liveUnitsRef.current = allLive;
    setPhase('running');
    startTimer();
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(stepFrame, BASE_TICK_MS / store.battleSpeed);
  }

  // Restart timer when speed changes
  useEffect(() => {
    if (phase === 'running') startTimer();
  }, [store.battleSpeed]);

  function stepFrame() {
    if (pausedRef.current) return;
    const events = eventsRef.current;
    const logs = logRef.current;
    if (eventIdxRef.current >= events.length) {
      finishBattle();
      return;
    }
    const thisTick = events[eventIdxRef.current]?.tick ?? tickRef.current;
    tickRef.current = thisTick;
    setCurrentTick(thisTick);

    // Process all events with the same tick this frame.
    const tickEvents: BattleEvent[] = [];
    while (eventIdxRef.current < events.length && events[eventIdxRef.current].tick === thisTick) {
      tickEvents.push(events[eventIdxRef.current]);
      eventIdxRef.current++;
    }

    for (const ev of tickEvents) handleEvent(ev);

    // Append logs that belong to this tick.
    const newLogEntries = logs.filter((e) => e.tick === thisTick);
    if (newLogEntries.length) {
      setLog((prev) => [...prev, ...newLogEntries]);
      setTimeout(() => logScrollRef.current?.scrollToEnd({ animated: true }), 30);
    }
  }

  function handleEvent(ev: BattleEvent) {
    switch (ev.kind) {
      case 'move':
        if (ev.toPosition && ev.sourceId) {
          updateUnit(ev.sourceId, (u) => {
            Animated.parallel([
              Animated.timing(u.positionAnim.x, { toValue: ev.toPosition!.col, duration: 250, useNativeDriver: false }),
              Animated.timing(u.positionAnim.y, { toValue: ev.toPosition!.row, duration: 250, useNativeDriver: false }),
            ]).start();
            return { ...u, position: ev.toPosition! };
          });
        }
        break;
      case 'damage':
        if (ev.targetId) {
          updateUnit(ev.targetId, (u) => {
            const newHp = Math.max(0, u.hp - (ev.value ?? 0));
            if (!store.settings.reduceMotion) {
              Animated.sequence([
                Animated.timing(u.shake, { toValue: 7, duration: 50, useNativeDriver: true }),
                Animated.timing(u.shake, { toValue: -7, duration: 50, useNativeDriver: true }),
                Animated.timing(u.shake, { toValue: 0, duration: 50, useNativeDriver: true }),
              ]).start();
              Animated.sequence([
                Animated.timing(u.flash, { toValue: 1, duration: 60, useNativeDriver: false }),
                Animated.timing(u.flash, { toValue: 0, duration: 220, useNativeDriver: false }),
              ]).start();
            }
            return { ...u, hp: newHp };
          });
          spawnFloating(ev.targetId, `-${ev.value}`, ev.element ? ELEMENT_COLORS[ev.element] : '#e74c3c', 16);
        }
        break;
      case 'crit':
        if (ev.targetId) {
          spawnFloating(ev.targetId, `CRIT ${ev.value}!`, '#f1c40f', 20);
        }
        break;
      case 'dodge':
        if (ev.targetId) {
          spawnFloating(ev.targetId, 'MISS', '#7c83fd', 14);
        }
        break;
      case 'heal':
        if (ev.targetId && ev.value) {
          updateUnit(ev.targetId, (u) => ({ ...u, hp: Math.min(u.maxHp, u.hp + (ev.value ?? 0)) }));
          spawnFloating(ev.targetId, `+${ev.value}`, '#27ae60', 16);
        }
        break;
      case 'shield':
        if (ev.targetId && ev.value) {
          updateUnit(ev.targetId, (u) => ({ ...u, shield: u.shield + ev.value! }));
          spawnFloating(ev.targetId, `+${ev.value} SHIELD`, '#f1c40f', 12);
        }
        break;
      case 'death':
        if (ev.targetId) {
          updateUnit(ev.targetId, (u) => ({ ...u, isAlive: false, hp: 0 }));
        }
        break;
      case 'ability':
        if (ev.sourceId) {
          spawnFloating(ev.sourceId, `★ ${ev.text ?? 'Ability'}`, '#7c83fd', 14);
          updateUnit(ev.sourceId, (u) => {
            Animated.sequence([
              Animated.timing(u.flash, { toValue: 0.8, duration: 200, useNativeDriver: false }),
              Animated.timing(u.flash, { toValue: 0, duration: 300, useNativeDriver: false }),
            ]).start();
            return u;
          });
        }
        break;
      case 'status_apply':
        if (ev.targetId && ev.status) {
          updateUnit(ev.targetId, (u) => {
            const existing = u.statuses.find((s) => s.type === ev.status);
            if (existing) return u;
            return { ...u, statuses: [...u.statuses, { type: ev.status!, ticksRemaining: 4, power: ev.value ?? 1 }] };
          });
          spawnFloating(ev.targetId, STATUS_ICON[ev.status] ?? '?', '#ccc', 14);
        }
        break;
      case 'status_expire':
        if (ev.targetId && ev.status) {
          updateUnit(ev.targetId, (u) => ({
            ...u, statuses: u.statuses.filter((s) => s.type !== ev.status),
          }));
        }
        break;
      case 'projectile':
        if (ev.sourceId && ev.targetId) {
          const src = liveUnitsRef.current.find((u) => u.id === ev.sourceId);
          const tgt = liveUnitsRef.current.find((u) => u.id === ev.targetId);
          if (src && tgt) launchProjectile(src.position, tgt.position, ev.element ?? 'physical');
        }
        break;
      case 'spawn':
        if (ev.unit) {
          const u = ev.unit;
          const newUnit: LiveUnit = {
            ...u,
            position: { ...u.position },
            shake: new Animated.Value(0),
            flash: new Animated.Value(0),
            positionAnim: { x: new Animated.Value(u.position.col), y: new Animated.Value(u.position.row) },
          };
          setLiveUnits((prev) => {
            if (prev.some((p) => p.id === u.id)) return prev;
            const next = [...prev, newUnit];
            liveUnitsRef.current = next;
            return next;
          });
        }
        break;
      case 'wave':
        // Already logged; allows replay to scroll battle log.
        break;
    }
  }

  function updateUnit(id: string, transform: (u: LiveUnit) => LiveUnit) {
    setLiveUnits((prev) => {
      const next = prev.map((u) => (u.id === id ? transform(u) : u));
      liveUnitsRef.current = next;
      return next;
    });
  }

  function spawnFloating(unitId: string, text: string, color: string, fontSize?: number) {
    if (!store.settings.particles) return;
    const id = `${unitId}_${Math.random()}`;
    setVfxNumbers((prev) => [...prev, { id, unitId, text, color, fontSize }]);
    setTimeout(() => {
      setVfxNumbers((prev) => prev.filter((v) => v.id !== id));
    }, 900);
  }

  function launchProjectile(from: GridPosition, to: GridPosition, element: Element) {
    if (!store.settings.particles) return;
    const id = `proj_${Math.random()}`;
    const anim = new Animated.Value(0);
    setProjectiles((prev) => [...prev, { id, from, to, element, anim }]);
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(() => {
      setProjectiles((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function finishBattle() {
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
    } else {
      const drops = level!.rewards.possibleDrops;
      const drop = drops[Math.floor(Math.random() * drops.length)];
      const dropChance = won ? 0.55 : 0.1;
      const actualDrop = Math.random() < dropChance ? drop : undefined;
      const gold = won ? level!.rewards.gold : Math.floor(level!.rewards.gold * 0.25);
      const exp = won ? level!.rewards.experience : Math.floor(level!.rewards.experience * 0.1);
      applyBattleRewards(won, gold, exp, playerHeroIds, { damage: totalDamage, kills: totalKills }, actualDrop);
      setResult({ won, gold, exp, drop: actualDrop, damageDealt: totalDamage, healingDone: totalHealing, killCount: totalKills });
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
    // Process all remaining events instantly.
    const events = eventsRef.current;
    while (eventIdxRef.current < events.length) {
      const ev = events[eventIdxRef.current];
      eventIdxRef.current++;
      handleEvent(ev);
    }
    setLog(logRef.current);
    finishBattle();
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {isArena ? `Arena Wave ${arenaWave}` : level?.name ?? ''}
        </Text>
        <View style={styles.headerRight}>
          <View style={[styles.phaseBadge, {
            backgroundColor: phase === 'running' ? '#e67e2244' : phase === 'paused' ? '#7c83fd44' : '#27ae6044',
          }]}>
            <Text style={[styles.phaseText, {
              color: phase === 'running' ? '#e67e22' : phase === 'paused' ? '#7c83fd' : '#27ae60',
            }]}>
              {phase === 'running' ? `T${currentTick}` : phase === 'paused' ? 'PAUSED' : phase === 'done' ? (result?.won ? 'WIN' : 'LOSE') : 'READY'}
            </Text>
          </View>
          {phase !== 'done' && (
            <>
              <SpeedToggle value={battleSpeed} onChange={setBattleSpeed} />
              <TouchableOpacity onPress={togglePause} style={styles.ctrlBtn}>
                <Text style={styles.ctrlText}>{phase === 'paused' ? '▶' : '❚❚'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={fastForward} style={styles.ctrlBtn}>
                <Text style={styles.ctrlText}>⏭</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Battle grid */}
      <View style={styles.gridWrap}>
        <View style={styles.grid}>
          {Array.from({ length: GRID_ROWS }, (_, row) => (
            <View key={row} style={styles.gridRow}>
              {Array.from({ length: GRID_COLS }, (_, col) => {
                const isPlayerSide = col <= 4;
                const theme = themeFor(level?.difficulty ?? 'easy');
                return (
                  <View
                    key={col}
                    style={[
                      styles.cell,
                      { backgroundColor: isPlayerSide ? theme.player : theme.enemy },
                      col === 4 && styles.dividerRight,
                      col === 5 && styles.dividerLeft,
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* Absolute-positioned units so they animate smoothly */}
        <View style={styles.unitsLayer} pointerEvents="none">
          {liveUnits.map((u) => (
            <UnitCell
              key={u.id}
              unit={u}
              vfxNumbers={vfxNumbers.filter((v) => v.unitId === u.id)}
            />
          ))}
        </View>

        {/* Projectiles layer */}
        <View style={styles.unitsLayer} pointerEvents="none">
          {projectiles.map((p) => (
            <ProjectileVfx key={p.id} proj={p} />
          ))}
        </View>
      </View>

      {/* Status bars */}
      <View style={styles.unitStatusRow}>
        <View style={styles.unitStatusSide}>
          <Text style={styles.sideLabel}>YOUR TEAM</Text>
          {liveUnits.filter((u) => u.isPlayer).map((u) => (
            <UnitStatusBar key={u.id} unit={u} color="#27ae60" />
          ))}
        </View>
        <View style={styles.divider} />
        <View style={styles.unitStatusSide}>
          <Text style={[styles.sideLabel, { color: '#e74c3c' }]}>ENEMIES</Text>
          {liveUnits.filter((u) => !u.isPlayer).map((u) => (
            <UnitStatusBar key={u.id} unit={u} color="#e74c3c" />
          ))}
        </View>
      </View>

      {/* Battle log */}
      <View style={styles.logContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.logTitle}>BATTLE LOG</Text>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 2 }}>
            {(['all', 'crits', 'heals', 'abilities', 'deaths'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.logFilterBtn, logFilter === f && styles.logFilterActive]}
                onPress={() => setLogFilter(f)}
              >
                <Text style={[styles.logFilterText, logFilter === f && styles.logFilterTextActive]}>
                  {f === 'all' ? 'ALL' : f.toUpperCase().slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <ScrollView ref={logScrollRef} style={styles.log} showsVerticalScrollIndicator={false}>
          {log.filter((e) => {
            if (logFilter === 'all') return true;
            if (logFilter === 'crits') return e.type === 'crit';
            if (logFilter === 'heals') return e.type === 'heal';
            if (logFilter === 'abilities') return e.type === 'ability';
            if (logFilter === 'deaths') return e.type === 'death' || e.type === 'victory' || e.type === 'defeat';
            return true;
          }).map((entry, idx) => (
            <Text
              key={idx}
              style={[
                styles.logEntry,
                entry.type === 'death' && styles.logDeath,
                entry.type === 'crit' && styles.logCrit,
                entry.type === 'ability' && styles.logAbility,
                entry.type === 'heal' && styles.logHeal,
                entry.type === 'dodge' && styles.logDodge,
                entry.type === 'status' && styles.logStatus,
                entry.type === 'victory' && styles.logVictory,
                entry.type === 'defeat' && styles.logDefeat,
              ]}
            >
              {entry.text}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* Result overlay */}
      {phase === 'done' && result && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>{result.won ? '🏆' : '💀'}</Text>
            <Text style={[styles.resultTitle, { color: result.won ? '#f1c40f' : '#e74c3c' }]}>
              {result.won ? 'VICTORY!' : 'DEFEAT'}
            </Text>
            <View style={styles.statsBox}>
              <ResultStat label="DMG dealt" value={result.damageDealt} />
              <ResultStat label="Healed" value={result.healingDone} />
              <ResultStat label="Kills" value={result.killCount} />
            </View>
            <View style={styles.rewardsList}>
              <Text style={styles.rewardRow}>💰 +{result.gold} gold</Text>
              <Text style={styles.rewardRow}>⭐ +{result.exp} EXP</Text>
              {result.won && <Text style={styles.rewardRow}>💎 +2 gems</Text>}
              {result.drop && <Text style={styles.rewardRow}>🎁 Item dropped!</Text>}
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: '#666' }]} onPress={handleRetry}>
                <Text style={styles.doneBtnText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
                <Text style={styles.doneBtnText}>{isArena ? 'Arena' : 'Levels'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function ResultStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: '#f1c40f', fontSize: 16, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: '#888', fontSize: 10, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function SpeedToggle({ value, onChange }: { value: 1 | 2 | 4; onChange: (v: 1 | 2 | 4) => void }) {
  return (
    <TouchableOpacity
      style={styles.ctrlBtn}
      onPress={() => onChange(value === 1 ? 2 : value === 2 ? 4 : 1)}
    >
      <Text style={styles.ctrlText}>{value}x</Text>
    </TouchableOpacity>
  );
}

function UnitCell({ unit, vfxNumbers }: { unit: LiveUnit; vfxNumbers: VfxNumber[] }) {
  const cellSize = 1 / GRID_COLS;
  const rowSize = 1 / GRID_ROWS;
  const left = unit.positionAnim.x.interpolate({
    inputRange: [0, GRID_COLS - 1],
    outputRange: ['0%', `${(GRID_COLS - 1) * cellSize * 100}%`],
  });
  const top = unit.positionAnim.y.interpolate({
    inputRange: [0, GRID_ROWS - 1],
    outputRange: ['0%', `${(GRID_ROWS - 1) * rowSize * 100}%`],
  });

  const flashOverlay = unit.flash.interpolate({
    inputRange: [0, 1], outputRange: ['rgba(255,255,255,0)', 'rgba(255,80,80,0.7)'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top,
        width: `${cellSize * 100}%`,
        height: `${rowSize * 100}%`,
        transform: [{ translateX: unit.shake }],
      }}
    >
      <View style={{ flex: 1, padding: 2 }}>
        <View style={{ flex: 1, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          {unit.isAlive ? (
            <>
              <HeroPortrait
                size={Math.min(60, 999)}
                heroClass={unit.heroClass}
                rarity={'common'}
                icon={unit.icon}
                element={unit.element}
                seed={unit.portraitSeed}
                stars={unit.stars}
                isEnemy={!unit.isPlayer}
                hpPct={unit.hp / unit.maxHp}
                manaPct={unit.mana / Math.max(1, unit.maxMana)}
                shieldPct={unit.shield > 0 ? unit.shield / unit.maxHp : 0}
                showFrame={false}
              />
              <Animated.View
                pointerEvents="none"
                style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: flashOverlay,
                  borderRadius: 8,
                }}
              />
              {unit.statuses.length > 0 && (
                <View style={styles.statusStrip}>
                  {unit.statuses.slice(0, 4).map((s, i) => (
                    <Text key={i} style={{ fontSize: 9 }}>{STATUS_ICON[s.type]}</Text>
                  ))}
                </View>
              )}
              {unit.abilityId && (
                <View style={[
                  styles.abilityRing,
                  unit.ticksUntilAbility === 0 &&
                  unit.mana >= (ABILITIES[unit.abilityId]?.manaCost ?? 999) && styles.abilityReady,
                ]}>
                  <Text style={styles.abilityIcon}>
                    {unit.ticksUntilAbility === 0 ? (ABILITIES[unit.abilityId]?.icon ?? '✦') : unit.ticksUntilAbility}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={{ fontSize: 22, opacity: 0.4 }}>💀</Text>
          )}
          {vfxNumbers.map((v) => (
            <FloatingNumber key={v.id} text={v.text} color={v.color} fontSize={v.fontSize} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

function ProjectileVfx({ proj }: { proj: Projectile }) {
  const cellSize = 1 / GRID_COLS;
  const rowSize = 1 / GRID_ROWS;
  const fromX = proj.from.col * cellSize;
  const toX = proj.to.col * cellSize;
  const fromY = proj.from.row * rowSize;
  const toY = proj.to.row * rowSize;
  const left = proj.anim.interpolate({ inputRange: [0, 1], outputRange: [`${fromX * 100}%`, `${toX * 100}%`] });
  const top = proj.anim.interpolate({ inputRange: [0, 1], outputRange: [`${fromY * 100}%`, `${toY * 100}%`] });

  const glyph: Record<Element, string> = {
    physical: '➤',
    fire: '🔥',
    ice: '❄',
    lightning: '⚡',
    holy: '✨',
    shadow: '🌑',
    nature: '🍃',
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left, top,
        width: `${cellSize * 100}%`,
        height: `${rowSize * 100}%`,
        alignItems: 'center', justifyContent: 'center',
      }}
      pointerEvents="none"
    >
      <Text style={{ fontSize: 18, color: ELEMENT_COLORS[proj.element] }}>
        {glyph[proj.element]}
      </Text>
    </Animated.View>
  );
}

function UnitStatusBar({ unit, color }: { unit: LiveUnit; color: string }) {
  const pct = unit.isAlive ? unit.hp / unit.maxHp : 0;
  const mpct = unit.maxMana > 0 ? unit.mana / unit.maxMana : 0;
  const ability = unit.abilityId ? ABILITIES[unit.abilityId] : null;
  return (
    <View style={unitStyles.row}>
      <Text style={unitStyles.icon}>{unit.icon}</Text>
      <View style={unitStyles.info}>
        <Text style={[unitStyles.name, !unit.isAlive && unitStyles.dead]} numberOfLines={1}>
          {unit.name}
          {ability && unit.ticksUntilAbility === 0 && unit.mana >= ability.manaCost && unit.isAlive && ' ✦'}
        </Text>
        <View style={unitStyles.track}>
          <View style={[unitStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
        </View>
        {unit.maxMana > 0 && (
          <View style={[unitStyles.track, { height: 2, marginTop: 1 }]}>
            <View style={[unitStyles.fill, { width: `${mpct * 100}%`, backgroundColor: '#3498db' }]} />
          </View>
        )}
      </View>
      <Text style={[unitStyles.hp, !unit.isAlive && unitStyles.dead]}>
        {unit.isAlive ? unit.hp : '💀'}
      </Text>
    </View>
  );
}

const unitStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  icon: { fontSize: 14 },
  info: { flex: 1 },
  name: { color: '#ccc', fontSize: 9, marginBottom: 2 },
  dead: { color: '#444', textDecorationLine: 'line-through' },
  track: { height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  hp: { color: '#888', fontSize: 9, width: 32, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 10, borderBottomWidth: 1, borderBottomColor: '#1e1e2e', gap: 6,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: '#fff', fontWeight: '800', fontSize: 14, flex: 1 },
  phaseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, minWidth: 50, alignItems: 'center' },
  phaseText: { fontWeight: '700', fontSize: 11 },
  ctrlBtn: { backgroundColor: '#1e1e2e', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#333', minWidth: 30, alignItems: 'center' },
  ctrlText: { color: '#ccc', fontWeight: '700', fontSize: 13 },
  gridWrap: { padding: 4 },
  grid: {},
  gridRow: { flexDirection: 'row' },
  cell: {
    flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
    borderWidth: 0.5, borderColor: '#1a1a2a',
  },
  playerCell: { backgroundColor: '#0d1a0d' },
  enemyCell: { backgroundColor: '#1a0d0d' },
  dividerRight: { borderRightWidth: 2, borderRightColor: '#333' },
  dividerLeft: { borderLeftWidth: 2, borderLeftColor: '#333' },
  unitsLayer: {
    position: 'absolute', top: 4, left: 4, right: 4, bottom: 0,
  },
  statusStrip: {
    position: 'absolute', top: -4, flexDirection: 'row', gap: 1,
    backgroundColor: '#000a', borderRadius: 4, paddingHorizontal: 2,
  },
  abilityRing: {
    position: 'absolute', bottom: -2, left: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#000a',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#444',
  },
  abilityReady: { borderColor: '#7c83fd', backgroundColor: '#7c83fdcc' },
  abilityIcon: { color: '#fff', fontSize: 8, fontWeight: '900' },
  unitStatusRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1e1e2e', padding: 10, maxHeight: 150 },
  unitStatusSide: { flex: 1 },
  sideLabel: { color: '#27ae60', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  divider: { width: 1, backgroundColor: '#1e1e2e', marginHorizontal: 8 },
  logContainer: { flex: 1, borderTopWidth: 1, borderTopColor: '#1e1e2e', padding: 10 },
  logTitle: { color: '#555', fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  logFilterBtn: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, backgroundColor: '#1a1a2a', borderWidth: 1, borderColor: '#333' },
  logFilterActive: { borderColor: '#7c83fd', backgroundColor: '#7c83fd22' },
  logFilterText: { color: '#666', fontSize: 8, fontWeight: '700' },
  logFilterTextActive: { color: '#7c83fd' },
  log: { flex: 1 },
  logEntry: { color: '#777', fontSize: 11, marginBottom: 3, lineHeight: 15 },
  logDeath: { color: '#e74c3c' },
  logCrit: { color: '#f1c40f', fontWeight: '700' },
  logAbility: { color: '#7c83fd' },
  logHeal: { color: '#27ae60' },
  logDodge: { color: '#888' },
  logStatus: { color: '#bb8fce' },
  logVictory: { color: '#f1c40f', fontWeight: '700', fontSize: 13 },
  logDefeat: { color: '#e74c3c', fontWeight: '700', fontSize: 13 },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: '#1e1e2e', borderRadius: 20, padding: 28, alignItems: 'center',
    width: '85%', borderWidth: 2, borderColor: '#333',
  },
  resultEmoji: { fontSize: 60, marginBottom: 8 },
  resultTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 3, marginBottom: 14 },
  statsBox: { flexDirection: 'row', width: '100%', marginBottom: 14, paddingHorizontal: 4 },
  rewardsList: { marginBottom: 16, gap: 4, alignItems: 'center' },
  rewardRow: { color: '#ccc', fontSize: 14, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10 },
  doneBtn: { backgroundColor: '#3498db', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

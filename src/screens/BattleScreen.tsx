import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Animated,
} from 'react-native';
import { useGameStore, getHeroEffectiveStats } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { BattleUnit, BattleLogEntry, GridPosition } from '../types';
import { computeBattle, buildPlayerUnit, buildEnemyUnit } from '../utils/battleEngine';
import { CLASS_COLORS } from '../data/heroes';
import { DIFFICULTY_COLORS } from '../data/levels';

const GRID_COLS = 10;
const GRID_ROWS = 3;
const BATTLE_TICK_MS = 600;

interface LiveUnit extends BattleUnit {
  shake: Animated.Value;
}

export default function BattleScreen() {
  const store = useGameStore();
  const { currentLevelId, heroes, placedHeroes, setScreen, applyBattleRewards, clearPlacements } = store;

  const level = LEVELS.find((l) => l.id === currentLevelId);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [log, setLog] = useState<BattleLogEntry[]>([]);
  const [liveUnits, setLiveUnits] = useState<LiveUnit[]>([]);
  const [result, setResult] = useState<{ won: boolean; gold: number; exp: number; drop?: string } | null>(null);
  const logScrollRef = useRef<ScrollView>(null);
  const tickRef = useRef(0);
  const unitsRef = useRef<BattleUnit[]>([]);
  const battleLogRef = useRef<BattleLogEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initBattle();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function initBattle() {
    if (!level) return;

    // Build player units
    const playerUnits: BattleUnit[] = Object.entries(placedHeroes).map(([heroId, pos]) => {
      const hero = heroes[heroId];
      const stats = getHeroEffectiveStats(heroId, store)!;
      return buildPlayerUnit(heroId, hero.name, hero.heroClass, stats.maxHp, stats.attack, stats.defense, stats.speed, stats.range, pos, hero.icon);
    });

    // Build enemy units
    const enemyUnits: BattleUnit[] = level.enemies.map((e, idx) =>
      buildEnemyUnit(e.name, e.heroClass, e.level, e.position, e.icon, idx)
    );

    const allUnits: LiveUnit[] = [...playerUnits, ...enemyUnits].map((u) => ({
      ...u,
      shake: new Animated.Value(0),
    }));

    setLiveUnits(allUnits);
    unitsRef.current = allUnits.map((u) => ({ ...u }));
    setPhase('running');
    runBattleTick(allUnits.map((u) => ({ ...u })));
  }

  function runBattleTick(units: BattleUnit[]) {
    // Pre-compute the full battle result for log
    const playerSnapshot = units.filter((u) => u.isPlayer);
    const enemySnapshot = units.filter((u) => !u.isPlayer);
    const result = computeBattle(playerSnapshot, enemySnapshot);
    battleLogRef.current = result.log;

    // Now replay tick by tick visually
    let tickIndex = 0;
    const shakeMap: Record<string, Animated.Value> = {};

    setLiveUnits((prev) => {
      prev.forEach((u) => { shakeMap[u.id] = u.shake; });
      return prev;
    });

    timerRef.current = setInterval(() => {
      const allDone = tickIndex >= battleLogRef.current.length;
      if (allDone) {
        clearInterval(timerRef.current!);
        const finalEntry = battleLogRef.current[battleLogRef.current.length - 1];
        const won = finalEntry?.type === 'victory';

        // Choose random drop
        const possibleDrops = level!.rewards.possibleDrops;
        const drop = possibleDrops[Math.floor(Math.random() * possibleDrops.length)];
        const dropChance = 0.4;
        const actualDrop = Math.random() < dropChance ? drop : undefined;

        const earnedGold = won ? level!.rewards.gold : Math.floor(level!.rewards.gold * 0.2);
        const earnedExp = won ? level!.rewards.experience : Math.floor(level!.rewards.experience * 0.1);
        const survivingIds = Object.keys(placedHeroes);

        if (won) applyBattleRewards(true, earnedGold, earnedExp, survivingIds, actualDrop);
        else applyBattleRewards(false, 0, 0, [], undefined);

        setResult({ won, gold: earnedGold, exp: earnedExp, drop: actualDrop });
        setPhase('done');
        return;
      }

      const entry = battleLogRef.current[tickIndex];
      setLog((prev) => [...prev, entry]);

      // Animate attacker shake for attack entries
      if (entry.type === 'attack' && entry.targetId) {
        const shake = shakeMap[entry.targetId];
        if (shake) {
          Animated.sequence([
            Animated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: true }),
            Animated.timing(shake, { toValue: -6, duration: 60, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
          ]).start();
        }
      }

      // Update unit HP based on log
      if (entry.targetId && entry.damage != null) {
        setLiveUnits((prev) =>
          prev.map((u) => {
            if (u.id !== entry.targetId) return u;
            const newHp = Math.max(0, u.hp - entry.damage!);
            return { ...u, hp: newHp, isAlive: newHp > 0 };
          })
        );
      }
      if (entry.type === 'death' && entry.targetId) {
        setLiveUnits((prev) =>
          prev.map((u) => (u.id === entry.targetId ? { ...u, isAlive: false, hp: 0 } : u))
        );
      }

      tickIndex++;
      logScrollRef.current?.scrollToEnd({ animated: true });
    }, BATTLE_TICK_MS);
  }

  function handleDone() {
    clearPlacements();
    setScreen('levels');
  }

  if (!level) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{level.name}</Text>
        <View style={[styles.phaseBadge, { backgroundColor: phase === 'running' ? '#e67e2244' : '#27ae6044' }]}>
          <Text style={[styles.phaseText, { color: phase === 'running' ? '#e67e22' : '#27ae60' }]}>
            {phase === 'idle' ? 'READY' : phase === 'running' ? '⚔️ BATTLING' : result?.won ? '🏆 VICTORY' : '💀 DEFEAT'}
          </Text>
        </View>
      </View>

      {/* Battle Grid */}
      <View style={styles.gridWrap}>
        <View style={styles.grid}>
          {Array.from({ length: GRID_ROWS }, (_, row) => (
            <View key={row} style={styles.gridRow}>
              {Array.from({ length: GRID_COLS }, (_, col) => {
                const unit = liveUnits.find((u) => u.position.col === col && u.position.row === row);
                const isPlayerSide = col <= 4;
                return (
                  <View
                    key={col}
                    style={[
                      styles.cell,
                      isPlayerSide ? styles.playerCell : styles.enemyCell,
                      col === 4 && styles.dividerRight,
                      col === 5 && styles.dividerLeft,
                    ]}
                  >
                    {unit && (
                      <Animated.View
                        style={[
                          styles.unitContainer,
                          { transform: [{ translateX: unit.shake }] },
                          !unit.isAlive && styles.deadUnit,
                        ]}
                      >
                        <Text style={[styles.unitEmoji, !unit.isAlive && styles.deadEmoji]}>{unit.icon}</Text>
                        {unit.isAlive && (
                          <View style={styles.hpBar}>
                            <View
                              style={[
                                styles.hpFill,
                                {
                                  width: `${(unit.hp / unit.maxHp) * 100}%`,
                                  backgroundColor: unit.isPlayer ? '#27ae60' : '#e74c3c',
                                },
                              ]}
                            />
                          </View>
                        )}
                      </Animated.View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Unit Status */}
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
        <Text style={styles.logTitle}>BATTLE LOG</Text>
        <ScrollView ref={logScrollRef} style={styles.log} showsVerticalScrollIndicator={false}>
          {log.map((entry, idx) => (
            <Text
              key={idx}
              style={[
                styles.logEntry,
                entry.type === 'death' && styles.logDeath,
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
            {result.won && (
              <View style={styles.rewardsList}>
                <Text style={styles.rewardRow}>💰 +{result.gold} gold</Text>
                <Text style={styles.rewardRow}>⭐ +{result.exp} EXP</Text>
                {result.drop && <Text style={styles.rewardRow}>🎁 Item dropped!</Text>}
              </View>
            )}
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneBtnText}>Return to Levels</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function UnitStatusBar({ unit, color }: { unit: LiveUnit; color: string }) {
  const pct = unit.isAlive ? unit.hp / unit.maxHp : 0;
  return (
    <View style={unitStyles.row}>
      <Text style={unitStyles.icon}>{unit.icon}</Text>
      <View style={unitStyles.info}>
        <Text style={[unitStyles.name, !unit.isAlive && unitStyles.dead]} numberOfLines={1}>{unit.name}</Text>
        <View style={unitStyles.track}>
          <View style={[unitStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
        </View>
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
  hp: { color: '#888', fontSize: 9, width: 28, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  title: { color: '#fff', fontWeight: '800', fontSize: 16 },
  phaseBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  phaseText: { fontWeight: '700', fontSize: 12 },
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
  unitContainer: { width: '90%', height: '90%', alignItems: 'center', justifyContent: 'center' },
  deadUnit: { opacity: 0.3 },
  unitEmoji: { fontSize: 18 },
  deadEmoji: { fontSize: 14 },
  hpBar: { width: '100%', height: 3, backgroundColor: '#111', borderRadius: 2, marginTop: 2, overflow: 'hidden' },
  hpFill: { height: '100%', borderRadius: 2 },
  unitStatusRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1e1e2e', padding: 10, maxHeight: 130 },
  unitStatusSide: { flex: 1 },
  sideLabel: { color: '#27ae60', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  divider: { width: 1, backgroundColor: '#1e1e2e', marginHorizontal: 8 },
  logContainer: { flex: 1, borderTopWidth: 1, borderTopColor: '#1e1e2e', padding: 10 },
  logTitle: { color: '#555', fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  log: { flex: 1 },
  logEntry: { color: '#777', fontSize: 11, marginBottom: 3, lineHeight: 15 },
  logDeath: { color: '#e74c3c' },
  logVictory: { color: '#f1c40f', fontWeight: '700', fontSize: 13 },
  logDefeat: { color: '#e74c3c', fontWeight: '700', fontSize: 13 },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    borderWidth: 2,
    borderColor: '#333',
  },
  resultEmoji: { fontSize: 60, marginBottom: 12 },
  resultTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 3, marginBottom: 16 },
  rewardsList: { marginBottom: 20, gap: 6 },
  rewardRow: { color: '#ccc', fontSize: 16, textAlign: 'center' },
  doneBtn: { backgroundColor: '#3498db', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

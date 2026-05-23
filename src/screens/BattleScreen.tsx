import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { gridForLevel } from '../utils/hex';
import { BattleLogEntry } from '../types';
import { CHEST_THEMES } from '../data/chests';
import ChestOpening from '../components/ChestOpening';
import BattleCanvas from '../game/BattleCanvas';
import { usePlayback } from '../game/usePlayback';
import { UnitStatLine } from '../game/types';
import type { Engine } from '../game/Engine';
import { ScreenBackground, GButton, Panel, Plate, palette, gradients } from '../components/ui';

export default function BattleScreen() {
  const { setScreen, clearPlacements, battleSpeed, setBattleSpeed, forfeitBattle, currentLevelId, heroes, equipment } = useGameStore();
  const isArena = currentLevelId === -1;
  const level = isArena ? null : LEVELS.find((l) => l.id === currentLevelId) ?? null;
  const [revealChest, setRevealChest] = useState<string | null>(null);

  // Live window dimensions — re-renders on rotate / split-screen.
  const { width: screenW, height: screenH } = useWindowDimensions();
  const grid = useMemo(() => gridForLevel(level), [level]);

  // The 3D viewport sizes are larger than the legacy 2D arena so the
  // battlefield can use proper perspective. We still leave room below
  // for the combat log + controls.
  const canvasW = Math.max(220, screenW - 16);
  const canvasH = grid.size === 'siege'
    ? Math.min(screenH * 0.5, 380)
    : Math.min(screenH * 0.42, 320);

  // Engine ref shared between the playback hook and the canvas. The
  // canvas creates the engine asynchronously on its onContextCreate;
  // the playback hook polls the ref before applying its first batch.
  const engineRef = useRef<Engine | null>(null);

  const {
    isArena: isArenaReplay, level: levelReplay, phase, units, log, tick, result,
    togglePause, fastForward, advanceTurn, toggleTurnByTurn, turnByTurnActive, turnSourceId,
    floats,
  } = usePlayback(grid, engineRef);
  const [logFilter, setLogFilter] = useState<'all' | 'crits' | 'heals' | 'abilities' | 'deaths'>('all');
  // Toggle the per-unit damage / heal / taken stats overlay during battle.
  const [showStats, setShowStats] = useState(false);
  // Auto-scroll the combat log to the latest entry as new ticks stream in.
  const logRef = useRef<ScrollView | null>(null);
  useEffect(() => {
    logRef.current?.scrollToEnd({ animated: true });
  }, [log.length]);

  const players = units.filter((u) => u.isPlayer);
  const enemies = units.filter((u) => !u.isPlayer);
  const aliveP = players.filter((u) => u.isAlive).length;
  const aliveE = enemies.filter((u) => u.isAlive).length;

  const filteredLog = log.filter((e) => {
    if (logFilter === 'all') return true;
    if (logFilter === 'crits') return e.type === 'crit';
    if (logFilter === 'heals') return e.type === 'heal';
    if (logFilter === 'abilities') return e.type === 'ability';
    if (logFilter === 'deaths') return e.type === 'death' || e.type === 'victory' || e.type === 'defeat';
    return true;
  });

  const goCampaign = () => { clearPlacements(); setScreen(isArenaReplay ? 'arena' : 'levels'); };
  const goRetry = () => setScreen(isArenaReplay ? 'arena' : 'battle-prep');

  const onForfeit = () => {
    if (phase === 'done') { goCampaign(); return; }
    Alert.alert(
      'Forfeit battle?',
      'This counts as a loss. No gold or XP awarded.',
      [
        { text: 'Keep fighting', style: 'cancel' },
        { text: 'Forfeit', style: 'destructive', onPress: () => { forfeitBattle(); clearPlacements(); setScreen(isArenaReplay ? 'arena' : 'levels'); } },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left', 'bottom']}>
      <ScreenBackground />

      {/* HUD */}
      <View style={styles.hud}>
        <TouchableOpacity onPress={onForfeit} style={styles.exitBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <LinearGradient colors={gradients.panel} style={styles.exitBtnBg}>
            <Text style={styles.exitChevron}>‹</Text>
          </LinearGradient>
        </TouchableOpacity>
        <CrownCount tint={palette.blue} label="ALLIES" alive={aliveP} total={players.length} />
        <View style={styles.hudCenter}>
          <LinearGradient colors={gradients.banner} style={styles.banner}>
            <Text style={styles.bannerText} numberOfLines={1}>
              {isArenaReplay ? 'ARENA WAVE' : (levelReplay?.name ?? 'BATTLE')}
            </Text>
          </LinearGradient>
          <View style={styles.tickPill}>
            <Text style={styles.tickText}>
              {phase === 'paused'
                ? '⏸ PAUSED'
                : phase === 'turn-wait'
                  ? `▷ TAP NEXT · ⏱ ${tick}`
                  : phase === 'done'
                    ? (result?.won ? '🏆 VICTORY' : '☠ DEFEAT')
                    : `⏱ ${tick}`}
            </Text>
          </View>
        </View>
        <CrownCount tint={palette.red} label="ENEMY" alive={aliveE} total={enemies.length} right />
      </View>

      {/* Arena — 2.5D battlefield. Drag to pan, pinch to zoom,
          double-tap to recenter. The whole renderer is pure-JS
          (Animated.Views, no native modules) so it can never
          fail to load — entering battle always works. */}
      <View style={styles.arenaArea}>
        <BattleCanvas
          width={canvasW}
          height={canvasH}
          grid={grid}
          theme={levelReplay?.theme}
          obstacles={levelReplay?.obstacles}
          units={units}
          floats={floats}
          onEngineReady={(eng) => { engineRef.current = eng; }}
        />
      </View>

      {/* Controls */}
      {phase !== 'done' && (
        <View style={styles.controls}>
          <RoundBtn label={`${battleSpeed}×`} onPress={() => setBattleSpeed(battleSpeed === 1 ? 2 : battleSpeed === 2 ? 4 : 1)} />
          <RoundBtn
            label={turnByTurnActive ? 'AUTO' : 'TURN'}
            tone={turnByTurnActive ? 'purple' : 'panel'}
            small
            onPress={toggleTurnByTurn}
          />
          {turnByTurnActive ? (
            <RoundBtn
              label={phase === 'turn-wait' ? 'NEXT ▶' : '...'}
              tone="gold"
              onPress={advanceTurn}
              wide
            />
          ) : (
            <RoundBtn label={phase === 'paused' ? '▶' : '❚❚'} onPress={togglePause} />
          )}
          <RoundBtn label="⏭" onPress={fastForward} />
          <RoundBtn label={showStats ? '📊' : '📊'} tone={showStats ? 'purple' : 'panel'} small onPress={() => setShowStats((v) => !v)} />
        </View>
      )}

      {/* Live damage stats — overlays the log when toggled on. */}
      {showStats && phase !== 'done' && (
        <Panel style={styles.statsPanel} padded={false}>
          <View style={styles.logHead}>
            <Text style={styles.logTitle}>📊 LIVE STATS</Text>
            <TouchableOpacity onPress={() => setShowStats(false)} style={styles.chip}>
              <Text style={styles.chipText}>HIDE</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
            <UnitStatsTable
              rows={units.map((u) => ({
                id: u.id, name: u.name, heroClass: u.heroClass, icon: u.icon,
                isPlayer: u.isPlayer, isAlive: u.isAlive,
                damageDealt: u.damageDealt, damageTaken: u.damageTaken,
                healingDone: u.healingDone, killCount: u.killCount,
              }))}
              highlightId={turnSourceId ?? undefined}
            />
          </ScrollView>
        </Panel>
      )}

      {/* Combat log */}
      <Panel style={styles.logPanel} padded={false} flexFill>
        <View style={styles.logHead}>
          <Text style={styles.logTitle}>⚔ COMBAT LOG · {filteredLog.length}</Text>
          <View style={styles.logFilters}>
            {(['all', 'crits', 'heals', 'abilities', 'deaths'] as const).map((f) => (
              <TouchableOpacity key={f} onPress={() => setLogFilter(f)} style={[styles.chip, logFilter === f && styles.chipOn]}>
                <Text style={[styles.chipText, logFilter === f && styles.chipTextOn]}>
                  {f === 'all' ? 'ALL' : f.slice(0, 3).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <ScrollView
          ref={logRef}
          style={styles.logScroll}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => logRef.current?.scrollToEnd({ animated: false })}
        >
          {filteredLog.slice(-120).map((e, i) => (
            <Text key={i} style={[styles.logLine, logColor(e.type)]}>{e.text}</Text>
          ))}
        </ScrollView>
      </Panel>

      {/* Result */}
      {phase === 'done' && result && (
        <View style={styles.overlay}>
          <View style={styles.cardOuter}>
            <LinearGradient
              colors={result.won ? (['#3a2e12', '#221b30'] as const) : (['#3a1620', '#221320'] as const)}
              style={styles.card}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center', paddingBottom: 4 }}
                style={{ width: '100%', maxHeight: screenH * 0.72 }}
              >
                <LinearGradient
                  colors={result.won ? gradients.banner : (['#ff6a55', '#cf3623'] as const)}
                  style={styles.resultBanner}
                >
                  <Text style={styles.resultBannerText}>{result.won ? 'VICTORY!' : 'DEFEAT'}</Text>
                </LinearGradient>
                <Text style={styles.crowns}>{result.won ? '👑 👑 👑' : '💀'}</Text>
                <View style={styles.statRow}>
                  <Stat label="DAMAGE" value={result.damageDealt} />
                  <Stat label="HEALED" value={result.healingDone} />
                  <Stat label="KILLS" value={result.killCount} />
                </View>

                {/* Per-unit performance table */}
                {result.unitStats && result.unitStats.length > 0 && (
                  <Plate style={styles.unitStatsWrap}>
                    <Text style={styles.unitStatsTitle}>UNIT PERFORMANCE</Text>
                    <UnitStatsTable rows={result.unitStats} />
                  </Plate>
                )}

                {result.won && result.chest && result.chestKind ? (
                  <View style={styles.chestRow}>
                    <Text style={styles.chestRowTitle}>VICTORY CHEST</Text>
                    <ChestRewardBadge
                      kind={result.chestKind}
                      onOpen={() => setRevealChest(result.chestKind!)}
                    />
                    <View style={styles.chestSummary}>
                      {result.chest.gold > 0 && <Text style={styles.chestLine}>🪙 +{result.chest.gold} gold</Text>}
                      {result.chest.gems > 0 && <Text style={styles.chestLine}>💎 +{result.chest.gems} gems</Text>}
                      {result.chest.heroCards.length > 0 && (
                        <Text style={styles.chestLine}>
                          🃏 +{result.chest.heroCards.reduce((s, c) => s + c.qty, 0)} hero card{result.chest.heroCards.reduce((s, c) => s + c.qty, 0) === 1 ? '' : 's'}
                        </Text>
                      )}
                      {result.chest.items.length > 0 && (
                        <Text style={styles.chestLine}>
                          🎁 +{result.chest.items.reduce((s, c) => s + c.qty, 0)} item{result.chest.items.reduce((s, c) => s + c.qty, 0) === 1 ? '' : 's'}
                        </Text>
                      )}
                    </View>
                  </View>
                ) : (
                  <Plate style={styles.rewards}>
                    <Text style={styles.reward}>🪙  +{result.gold} Gold</Text>
                  </Plate>
                )}
              </ScrollView>
              <View style={styles.btnRow}>
                <GButton label="Retry" variant="purple" onPress={goRetry} style={{ flex: 1 }} />
                <GButton label={isArenaReplay ? 'Arena' : 'Campaign'} variant="gold" onPress={goCampaign} style={{ flex: 1 }} />
              </View>
            </LinearGradient>
          </View>
        </View>
      )}

      {revealChest && result?.chest && (
        <ChestOpening
          theme={CHEST_THEMES[revealChest as keyof typeof CHEST_THEMES]}
          reward={result.chest}
          heroes={heroes}
          equipment={equipment}
          onClose={() => setRevealChest(null)}
        />
      )}
    </SafeAreaView>
  );
}

function ChestRewardBadge({
  kind, onOpen,
}: { kind: import('../data/chests').ChestKind; onOpen: () => void }) {
  const theme = CHEST_THEMES[kind];
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onOpen}>
      <LinearGradient
        colors={[theme.wood[0], theme.wood[1]] as const}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.chestBadge, { borderColor: theme.glow, shadowColor: theme.glow }]}
      >
        <Text style={styles.chestBadgeIcon}>{theme.icon}</Text>
        <View>
          <Text style={[styles.chestBadgeName, { color: theme.glow }]}>{theme.name.toUpperCase()}</Text>
          <Text style={styles.chestBadgeHint}>TAP TO OPEN</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function UnitStatsTable({ rows, highlightId }: { rows: UnitStatLine[]; highlightId?: string }) {
  const players = rows.filter((r) => r.isPlayer);
  const enemies = rows.filter((r) => !r.isPlayer);
  return (
    <View>
      {[{ team: 'ALLIES', list: players, color: palette.blue },
        { team: 'ENEMIES', list: enemies, color: palette.red }].map(({ team, list, color }) => (
        list.length > 0 ? (
          <View key={team} style={{ marginBottom: 8 }}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableTeam, { color }]}>{team}</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.85 }]}>DMG</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.85 }]}>TAKEN</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.7 }]}>HEAL</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>K</Text>
            </View>
            {list.map((u) => (
              <View
                key={u.id}
                style={[
                  styles.tableRow,
                  highlightId === u.id && { backgroundColor: '#9b6dff22', borderColor: palette.purple },
                  !u.isAlive && { opacity: 0.55 },
                ]}
              >
                <View style={[styles.tableTeam, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <Text style={{ fontSize: 12 }}>{u.icon}</Text>
                  <Text style={styles.tableName} numberOfLines={1}>
                    {u.isAlive ? u.name : `† ${u.name}`}
                  </Text>
                </View>
                <Text style={[styles.tableValue, { flex: 0.85, color: '#ffd24a' }]}>{u.damageDealt}</Text>
                <Text style={[styles.tableValue, { flex: 0.85, color: '#ff8a78' }]}>{u.damageTaken}</Text>
                <Text style={[styles.tableValue, { flex: 0.7, color: '#5ef07a' }]}>{u.healingDone}</Text>
                <Text style={[styles.tableValue, { flex: 0.4, color: palette.textSoft }]}>{u.killCount}</Text>
              </View>
            ))}
          </View>
        ) : null
      ))}
    </View>
  );
}

function CrownCount({ tint, label, alive, total, right }: { tint: string; label: string; alive: number; total: number; right?: boolean }) {
  return (
    <View style={[styles.crownBox, right && { alignItems: 'flex-end' }]}>
      <Text style={[styles.crownLabel, { color: tint }]}>{label}</Text>
      <Text style={styles.crownCount}>{alive}<Text style={styles.crownTotal}>/{total}</Text></Text>
    </View>
  );
}

function RoundBtn({
  label, onPress, tone = 'panel', small, wide,
}: { label: string; onPress: () => void; tone?: 'panel' | 'gold' | 'purple'; small?: boolean; wide?: boolean }) {
  const colors =
    tone === 'gold' ? gradients.goldBtn :
    tone === 'purple' ? (['#b89bff', '#8257e6', '#5a36b0'] as const) :
    gradients.panel;
  const textColor =
    tone === 'gold' ? '#5a3c08' :
    tone === 'purple' ? '#fff' :
    palette.gold;
  const border =
    tone === 'gold' ? '#fff7' :
    tone === 'purple' ? '#fff8' :
    palette.goldDark;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.round}>
      <LinearGradient
        colors={colors as any}
        style={[
          styles.roundGrad,
          small && { width: 44, height: 36, borderRadius: 10 },
          wide && { paddingHorizontal: 18, minWidth: 90 },
          { borderColor: border },
        ]}
      >
        <Text style={[styles.roundText, small && { fontSize: 11 }, { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function logColor(type: BattleLogEntry['type']) {
  switch (type) {
    case 'death': return { color: '#ff7a68' };
    case 'crit': return { color: palette.gold, fontWeight: '800' as const };
    case 'ability': return { color: '#c9a3ff' };
    case 'heal': return { color: '#5ef07a' };
    case 'status': return { color: '#caa8ff' };
    case 'victory': return { color: palette.gold, fontWeight: '900' as const, fontSize: 13 };
    case 'defeat': return { color: '#ff6a55', fontWeight: '900' as const, fontSize: 13 };
    default: return { color: '#a99fc0' };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bgBot },
  hud: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6, gap: 6 },
  hudCenter: { flex: 1, alignItems: 'center', gap: 4 },
  exitBtn: { width: 34, height: 34 },
  exitBtnBg: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: palette.goldDeep,
  },
  exitChevron: { color: palette.gold, fontSize: 22, fontWeight: '900', marginTop: -2 },
  crownBox: { width: 56 },
  crownLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  crownCount: { color: '#fff', fontSize: 18, fontWeight: '900' },
  crownTotal: { color: palette.textMute, fontSize: 11, fontWeight: '800' },
  banner: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 2, borderColor: '#fff6' },
  bannerText: { color: '#5a3c08', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  tickPill: { backgroundColor: palette.panelDeep, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 2, borderWidth: 1, borderColor: '#0007' },
  tickText: { color: palette.textSoft, fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  arenaArea: { alignItems: 'center', paddingVertical: 6 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 4, paddingHorizontal: 10 },
  round: { borderRadius: 22 },
  roundGrad: {
    width: 48, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: palette.goldDark,
  },
  roundText: { color: palette.gold, fontWeight: '900', fontSize: 14 },
  logPanel: { flex: 1, marginHorizontal: 10, marginBottom: 8 },
  logHead: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 6 },
  logTitle: { color: palette.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1, flex: 1 },
  logFilters: { flexDirection: 'row', gap: 3 },
  chip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: palette.panelDeep, borderWidth: 1, borderColor: '#0006' },
  chipOn: { backgroundColor: palette.purpleDeep, borderColor: palette.purple },
  chipText: { color: palette.textMute, fontSize: 8, fontWeight: '800' },
  chipTextOn: { color: '#fff' },
  logScroll: { flex: 1, paddingHorizontal: 10, paddingBottom: 8 },
  logLine: { fontSize: 11, marginBottom: 3, lineHeight: 15 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000d0', justifyContent: 'center', alignItems: 'center', padding: 24 },
  cardOuter: { width: '100%', borderRadius: 26, borderWidth: 3, borderColor: palette.goldDeep, overflow: 'hidden' },
  card: { padding: 22, alignItems: 'center' },
  resultBanner: { paddingHorizontal: 30, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: '#fff6', marginTop: -4 },
  resultBannerText: { color: '#5a3c08', fontWeight: '900', fontSize: 22, letterSpacing: 2 },
  crowns: { fontSize: 30, marginVertical: 10, letterSpacing: 4 },
  statRow: { flexDirection: 'row', width: '100%', marginBottom: 14 },
  statValue: { color: palette.gold, fontSize: 20, fontWeight: '900' },
  statLabel: { color: palette.textMute, fontSize: 9, marginTop: 2, letterSpacing: 1, fontWeight: '700' },
  rewards: { width: '100%', gap: 6, marginBottom: 16, alignItems: 'center' },
  reward: { color: palette.textSoft, fontSize: 14, fontWeight: '700' },
  chestRow: { width: '100%', alignItems: 'center', marginBottom: 16, gap: 8 },
  chestRowTitle: { color: palette.gold, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  chestBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 14, borderWidth: 2,
    shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  chestBadgeIcon: { fontSize: 36 },
  chestBadgeName: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  chestBadgeHint: { color: '#ffffffcc', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 },
  chestSummary: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  chestLine: { color: palette.textSoft, fontSize: 12, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  statsPanel: { marginHorizontal: 10, marginBottom: 6 },
  unitStatsWrap: { width: '100%', marginBottom: 12, paddingVertical: 8, paddingHorizontal: 8 },
  unitStatsTitle: { color: palette.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 6, textAlign: 'center' },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderBottomWidth: 1, borderBottomColor: '#ffffff15',
  },
  tableTeam: { flex: 1.4, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  tableHeaderCell: { color: palette.textMute, fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 5,
    borderBottomWidth: 1, borderBottomColor: '#ffffff08',
    borderLeftWidth: 2, borderLeftColor: 'transparent',
  },
  tableName: { color: palette.textSoft, fontSize: 11, fontWeight: '700', flexShrink: 1 },
  tableValue: { fontSize: 11, fontWeight: '900', textAlign: 'right' },
});

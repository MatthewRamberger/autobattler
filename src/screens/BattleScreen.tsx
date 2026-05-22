import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { useBattleReplay } from '../hooks/useBattleReplay';
import { LEVELS } from '../data/levels';
import { gridForLevel, hexLayout } from '../utils/hex';
import { BattleLogEntry } from '../types';
import Arena from '../components/battle/Arena';
import UnitAvatar from '../components/battle/UnitAvatar';
import Projectile from '../components/battle/Projectile';
import { ScreenBackground, GButton, Panel, Plate, palette, gradients } from '../components/ui';

const FRAME_PAD = 8;

export default function BattleScreen() {
  const { setScreen, clearPlacements, battleSpeed, setBattleSpeed, forfeitBattle, currentLevelId } = useGameStore();
  const isArena = currentLevelId === -1;
  const level = isArena ? null : LEVELS.find((l) => l.id === currentLevelId) ?? null;

  // Live window dimensions — re-renders on rotate / split-screen. Using
  // Dimensions.get can return stale values on first mount on some devices.
  const { width: screenW, height: screenH } = useWindowDimensions();
  const grid = useMemo(() => gridForLevel(level), [level]);

  // Board budget: width minus side padding & frame padding; for small maps
  // the height is bounded so the combat log stays visible. For siege maps
  // we let the board grow taller and the user scrolls horizontally inside
  // the Arena container.
  const fieldWBudget = Math.max(200, screenW - 20 - FRAME_PAD * 2);
  const fieldHBudget = grid.size === 'siege'
    ? Math.min(screenH * 0.45, 340)
    : Math.min(fieldWBudget * 0.7, 220);

  const layout = useMemo(
    () => hexLayout(fieldWBudget, fieldHBudget, grid),
    [fieldWBudget, fieldHBudget, grid]
  );
  const fieldW = layout.totalW;
  const fieldH = layout.totalH;

  const {
    isArena: isArenaReplay, level: levelReplay, phase, units, log, vfx, projectiles, tick, result,
    getAnims, togglePause, fastForward,
  } = useBattleReplay(layout, grid);
  const [logFilter, setLogFilter] = useState<'all' | 'crits' | 'heals' | 'abilities' | 'deaths'>('all');
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

  // Decide whether the arena needs to horizontal-scroll. Siege boards are
  // always wider than the screen budget, normal boards never are.
  const needsScroll = layout.totalW > fieldWBudget + 2;

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
              {phase === 'paused' ? '⏸ PAUSED' : phase === 'done' ? (result?.won ? '🏆 VICTORY' : '☠ DEFEAT') : `⏱ ${tick}`}
            </Text>
          </View>
        </View>
        <CrownCount tint={palette.red} label="ENEMY" alive={aliveE} total={enemies.length} right />
      </View>

      {/* Arena */}
      <View style={styles.arenaArea}>
        {needsScroll ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={{ paddingHorizontal: 8 }}
            // Center the initial scroll on the action.
            contentOffset={{ x: Math.max(0, (fieldW - fieldWBudget) / 2), y: 0 }}
          >
            <ArenaCanvas fieldW={fieldW} fieldH={fieldH} layout={layout} units={units} projectiles={projectiles} vfx={vfx} getAnims={getAnims} />
          </ScrollView>
        ) : (
          <ArenaCanvas fieldW={fieldW} fieldH={fieldH} layout={layout} units={units} projectiles={projectiles} vfx={vfx} getAnims={getAnims} />
        )}
      </View>

      {/* Controls */}
      {phase !== 'done' && (
        <View style={styles.controls}>
          <RoundBtn label={`${battleSpeed}×`} onPress={() => setBattleSpeed(battleSpeed === 1 ? 2 : battleSpeed === 2 ? 4 : 1)} />
          <RoundBtn label={phase === 'paused' ? '▶' : '❚❚'} onPress={togglePause} />
          <RoundBtn label="⏭" onPress={fastForward} />
        </View>
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
              <Plate style={styles.rewards}>
                <Text style={styles.reward}>🪙  +{result.gold} Gold</Text>
                <Text style={styles.reward}>⭐  +{result.exp} XP</Text>
                {result.won && <Text style={styles.reward}>💎  +2 Gems</Text>}
                {result.drop && <Text style={[styles.reward, { color: palette.gold }]}>🎁  Item dropped!</Text>}
              </Plate>
              <View style={styles.btnRow}>
                <GButton label="Retry" variant="purple" onPress={goRetry} style={{ flex: 1 }} />
                <GButton label={isArenaReplay ? 'Arena' : 'Campaign'} variant="gold" onPress={goCampaign} style={{ flex: 1 }} />
              </View>
            </LinearGradient>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function ArenaCanvas({
  fieldW, fieldH, layout, units, projectiles, vfx, getAnims,
}: {
  fieldW: number; fieldH: number;
  layout: ReturnType<typeof hexLayout>;
  units: any[]; projectiles: any[]; vfx: any[];
  getAnims: (id: string) => any;
}) {
  return (
    <View style={{ width: fieldW + FRAME_PAD * 2, height: fieldH + FRAME_PAD * 2 }}>
      <Arena width={fieldW} height={fieldH} layout={layout} />
      <View style={[styles.unitLayer, { left: FRAME_PAD, top: FRAME_PAD, width: fieldW, height: fieldH }]} pointerEvents="none">
        {units.map((u) => (
          <UnitAvatar key={u.id} unit={u} anims={getAnims(u.id)} layout={layout}
            vfx={vfx.filter((v: any) => v.unitId === u.id)} />
        ))}
        {projectiles.map((p) => (
          <Projectile key={p.id} proj={p} layout={layout} />
        ))}
      </View>
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

function RoundBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.round}>
      <LinearGradient colors={gradients.panel} style={styles.roundGrad}>
        <Text style={styles.roundText}>{label}</Text>
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
  unitLayer: { position: 'absolute' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 4 },
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
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
});

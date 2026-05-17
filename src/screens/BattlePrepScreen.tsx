import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore, getHeroEffectiveStats, computeTeamSynergies, generateArenaWave } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { GridPosition } from '../types';
import HeroPortrait from '../components/HeroPortrait';
import Sprite from '../components/battle/spriteRenderer';
import { spriteFor } from '../components/battle/spriteLibrary';
import { Hex } from '../components/battle/Arena';
import {
  HEX_COLS, HEX_ROWS, PLAYER_MAX_COL, ENEMY_MIN_COL, hexLayout, hexCenter,
} from '../utils/hex';
import {
  Screen, TopBar, Panel, GButton, palette, gradients, radius, spacing,
} from '../components/ui';

export default function BattlePrepScreen() {
  const store = useGameStore();
  const {
    currentLevelId, heroes, placedHeroes, setScreen, placeHero, removeHeroFromGrid,
    clearPlacements, autoPlace, arenaWave, loadouts, saveLoadout, applyLoadout, deleteLoadout,
    predictBattle,
  } = store;
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{ winRate: number; avgTicks: number } | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [showLoadouts, setShowLoadouts] = useState(false);

  const isArena = currentLevelId === -1;
  const level = isArena ? null : LEVELS.find((l) => l.id === currentLevelId);

  const screenW = Dimensions.get('window').width;
  const fieldWBudget = screenW - 24;
  const fieldHBudget = Math.min(fieldWBudget * 0.72, 260);
  const layout = useMemo(() => hexLayout(fieldWBudget, fieldHBudget), [fieldWBudget, fieldHBudget]);

  if (!level && !isArena) return null;

  const unlockedHeroes = Object.values(heroes).filter((h) => h.unlocked);
  const placedIds = new Set(Object.keys(placedHeroes));
  const synergies = computeTeamSynergies(Object.keys(placedHeroes), store);
  const enemyPreview = level ? level.enemies : isArena ? generateArenaWave(arenaWave) : [];
  const teamPower = Object.keys(placedHeroes).reduce((s, id) => s + (getHeroEffectiveStats(id, store)?.power ?? 0), 0);

  function handleCell(col: number, row: number) {
    if (col > PLAYER_MAX_COL) return;
    const existing = Object.entries(placedHeroes).find(([, p]) => p.col === col && p.row === row);
    if (existing) {
      if (selectedHeroId === existing[0]) { removeHeroFromGrid(existing[0]); setSelectedHeroId(null); }
      else setSelectedHeroId(existing[0]);
      return;
    }
    if (selectedHeroId) { placeHero(selectedHeroId, { col, row }); setSelectedHeroId(null); }
  }

  function startBattle() {
    if (Object.keys(placedHeroes).length === 0) {
      Alert.alert('No heroes placed', 'Tap a hero below, then tap a blue hex.');
      return;
    }
    setScreen('battle');
  }

  const recommended = level?.recommendedPower ?? 0;
  const powerOk = !recommended || teamPower >= recommended;

  // Build the hex map as a stack of absolutely positioned hex cells + tap
  // targets. We render player hexes blue, enemy hexes red, contested col grey.
  const cells: React.ReactNode[] = [];
  for (let row = 0; row < HEX_ROWS; row++) {
    for (let col = 0; col < HEX_COLS; col++) {
      const { cx, cy } = hexCenter({ col, row }, layout);
      const placedHeroId = Object.entries(placedHeroes).find(([, p]) => p.col === col && p.row === row)?.[0];
      const enemyHere = (level?.enemies ?? enemyPreview).find((e) => e.position.col === col && e.position.row === row);
      const placedHero = placedHeroId ? heroes[placedHeroId] : null;
      const isPlayer = col <= PLAYER_MAX_COL;
      const isEnemy = col >= ENEMY_MIN_COL;
      const selected = placedHeroId === selectedHeroId;
      const tint = isPlayer ? '#1c3956' : isEnemy ? '#5a2840' : '#3a2f30';
      const hiTint = isPlayer ? '#2c5780' : isEnemy ? '#7a3a58' : '#534545';
      const spriteH = Math.min(layout.hexW, layout.hexH) * 0.84;
      cells.push(
        <TouchableOpacity
          key={`${row}-${col}`}
          activeOpacity={isPlayer ? 0.7 : 1}
          onPress={() => handleCell(col, row)}
          style={{
            position: 'absolute',
            left: cx - layout.hexW / 2,
            top: cy - layout.hexH / 2,
            width: layout.hexW,
            height: layout.hexH,
          }}
        >
          <Hex w={layout.hexW} h={layout.hexH} fill={tint} stroke={'#0008'} hiFill={hiTint} />
          {selected && (
            <View style={{
              ...StyleSheet.absoluteFillObject,
              borderWidth: 2, borderColor: palette.gold, borderRadius: 6,
            }} />
          )}
          <View style={{
            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {placedHero ? (
              <Sprite
                def={spriteFor({
                  heroId: placedHero.id, icon: placedHero.icon,
                  heroClass: placedHero.heroClass, isPlayer: true,
                })}
                size={spriteH}
              />
            ) : enemyHere ? (
              <Sprite
                def={spriteFor({
                  icon: enemyHere.icon, heroClass: enemyHere.heroClass, isPlayer: false,
                })}
                size={spriteH}
                flip
              />
            ) : isPlayer ? (
              <Text style={styles.plus}>＋</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    }
  }

  return (
    <Screen>
      <TopBar
        title={isArena ? `ARENA ${arenaWave}` : (level?.name ?? 'PREP')}
        titleSize={15}
        onBack={() => { clearPlacements(); setScreen(isArena ? 'arena' : 'levels'); }}
        right={
          <View style={styles.powerPill}>
            <Text style={[styles.powerText, { color: powerOk ? palette.green : palette.red }]}>⚡{teamPower}</Text>
            {!!recommended && <Text style={styles.recText}>/{recommended}</Text>}
          </View>
        }
      />

      <View style={styles.toolbar}>
        <GButton small label="✨ Auto" variant="blue" onPress={autoPlace} />
        <GButton small label="🗑 Clear" variant="purple" onPress={() => clearPlacements()} />
        <GButton small label="📁 Teams" variant="purple" onPress={() => setShowLoadouts((s) => !s)} />
        {!isArena && level && (
          <GButton
            small label={predicting ? '…' : '🔮 Predict'} variant="purple"
            onPress={async () => { setPredicting(true); const r = await predictBattle(level.id, 8); setPrediction(r); setPredicting(false); }}
          />
        )}
      </View>

      {prediction && (
        <View style={styles.predict}>
          <Text style={styles.predictText}>
            🔮 Predicted win {Math.round(prediction.winRate * 100)}% · ~{prediction.avgTicks} ticks
          </Text>
        </View>
      )}

      {showLoadouts && (
        <View style={styles.loadouts}>
          {([1, 2, 3] as const).map((slot) => {
            const key = `slot_${slot}`;
            const lo = loadouts[key];
            return (
              <Panel key={key} style={{ flex: 1 }}>
                <Text style={styles.loName} numberOfLines={1}>{lo?.name ?? `Team ${slot}`}</Text>
                <View style={{ gap: 4, marginTop: 4 }}>
                  <GButton small label="Save" variant="blue" onPress={() => saveLoadout(key, `Team ${slot}`)} />
                  <GButton small label="Load" variant="green" disabled={!lo} onPress={() => applyLoadout(key)} />
                  {lo && <GButton small label="Delete" variant="red" onPress={() => deleteLoadout(key)} />}
                </View>
              </Panel>
            );
          })}
        </View>
      )}

      <View style={styles.arenaWrap}>
        <View style={[styles.arena, { width: layout.totalW + 12, height: layout.totalH + 12 }]}>
          <LinearGradient colors={['#f6c945', '#a9781a']} style={StyleSheet.absoluteFill} />
          <View style={{
            position: 'absolute', left: 6, top: 6,
            width: layout.totalW, height: layout.totalH,
            backgroundColor: '#0c1828', borderRadius: 10, overflow: 'hidden',
          }}>
            {cells}
          </View>
        </View>
      </View>

      {synergies.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.synergies}>
          {synergies.map((s) => (
            <View key={s.id} style={[styles.synChip, s.active ? styles.synOn : styles.synOff]}>
              <Text style={[styles.synName, !s.active && { color: palette.textDim }]}>{s.name}</Text>
              <Text style={[styles.synCount, !s.active && { color: palette.textDim }]}>{s.count}/{s.threshold}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.benchWrap}>
        <Text style={styles.benchTitle}>YOUR HEROES — tap, then tap a blue hex</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, gap: 8 }}>
          {unlockedHeroes.map((hero) => {
            const sel = hero.id === selectedHeroId;
            const placed = placedIds.has(hero.id);
            const stats = getHeroEffectiveStats(hero.id, store);
            return (
              <TouchableOpacity key={hero.id} activeOpacity={0.85}
                onPress={() => setSelectedHeroId(sel ? null : hero.id)}
                style={[styles.benchHero, sel && styles.benchSel, placed && { opacity: 0.45 }]}
              >
                <HeroPortrait size={54} heroClass={hero.heroClass} rarity={hero.rarity} icon={hero.icon}
                  element={hero.baseStats.element} seed={hero.portraitSeed} level={hero.level} stars={hero.stars} selected={sel} />
                <Text style={styles.benchName} numberOfLines={1}>{hero.name}</Text>
                {stats && <Text style={styles.benchPower}>⚡{stats.power}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.enemyMini}>
          <Text style={styles.enemyMiniTitle}>ENEMIES · {enemyPreview.length}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {enemyPreview.map((e, i) => (
              <View key={i} style={{ marginRight: 4 }}>
                <HeroPortrait size={30} heroClass={e.heroClass} rarity="common" icon={e.icon}
                  element={e.element ?? 'physical'} seed={e.name.charCodeAt(0) + i} isEnemy showFrame={false} stars={e.stars} />
              </View>
            ))}
          </ScrollView>
        </View>
        <GButton label="FIGHT ▶" variant="red" onPress={startBattle} style={{ minWidth: 130 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  powerPill: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: palette.panelDeep, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#0007' },
  powerText: { fontWeight: '900', fontSize: 13 },
  recText: { color: palette.textDim, fontSize: 10, fontWeight: '700' },
  toolbar: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 4, flexWrap: 'wrap' },
  predict: { backgroundColor: palette.purpleDeep + '55', marginHorizontal: 12, borderRadius: 8, paddingVertical: 6, marginTop: 2 },
  predictText: { color: '#caa8ff', fontWeight: '800', fontSize: 12, textAlign: 'center' },
  loadouts: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 6 },
  loName: { color: palette.textSoft, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  arenaWrap: { padding: 8, alignItems: 'center' },
  arena: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 3, borderColor: palette.goldDeep },
  plus: { color: '#ffffff33', fontSize: 18, fontWeight: '900' },
  synergies: { paddingHorizontal: 12, gap: 6, paddingVertical: 2 },
  synChip: { borderRadius: 10, paddingVertical: 4, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1 },
  synOn: { backgroundColor: palette.greenDeep + '44', borderColor: palette.green },
  synOff: { backgroundColor: palette.panelDeep, borderColor: '#0006' },
  synName: { color: palette.green, fontSize: 10, fontWeight: '800' },
  synCount: { color: palette.green, fontSize: 9, fontWeight: '700' },
  benchWrap: { paddingTop: 6 },
  benchTitle: { color: palette.textMute, fontSize: 9, paddingHorizontal: 12, marginBottom: 6, fontWeight: '700', letterSpacing: 0.5 },
  benchHero: { backgroundColor: palette.panelDeep, borderRadius: 12, padding: 6, alignItems: 'center', width: 74, borderWidth: 2, borderColor: '#0006' },
  benchSel: { borderColor: palette.gold, backgroundColor: palette.goldDark + '44' },
  benchName: { color: palette.textSoft, fontSize: 9, fontWeight: '700', marginTop: 3 },
  benchPower: { color: palette.gold, fontSize: 9, fontWeight: '800', marginTop: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  enemyMini: { flex: 1 },
  enemyMiniTitle: { color: '#ff9a8a', fontSize: 9, fontWeight: '900', marginBottom: 4, letterSpacing: 1 },
});

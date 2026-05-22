import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, useWindowDimensions,
} from 'react-native';
import {
  useGameStore, getHeroEffectiveStats, computeTeamSynergies, generateArenaWave,
} from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { MiniUnitPortrait } from '../components/battle/UnitAvatar';
import Arena, { FRAME_PAD } from '../components/battle/Arena';
import BattleStage from '../components/battle/BattleStage';
import HeroPortrait from '../components/HeroPortrait';
import { gridForLevel, hexLayout, hexCenter, HexLayout } from '../utils/hex';
import { heroIdOfPlacement, countPlacementsOf } from '../utils/placement';
import { Screen, TopBar, Panel, GButton, palette } from '../components/ui';

type Selection =
  | { kind: 'bench'; heroId: string }
  | { kind: 'placement'; key: string }
  | null;

export default function BattlePrepScreen() {
  const store = useGameStore();
  const {
    currentLevelId, heroes, heroCards, placedHeroes, setScreen, placeHero,
    movePlacement, removeHeroFromGrid, clearPlacements, autoPlace, arenaWave,
    loadouts, saveLoadout, applyLoadout, deleteLoadout, predictBattle,
  } = store;
  const [selection, setSelection] = useState<Selection>(null);
  const [prediction, setPrediction] = useState<{ winRate: number; avgTicks: number } | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [showLoadouts, setShowLoadouts] = useState(false);

  const isArena = currentLevelId === -1;
  const level = isArena ? null : LEVELS.find((l) => l.id === currentLevelId);

  const { width: screenW, height: screenH } = useWindowDimensions();
  const grid = useMemo(() => gridForLevel(level ?? null), [level]);

  const fieldWBudget = screenW - 24;
  const fieldHBudget = grid.size === 'siege'
    ? Math.min(screenH * 0.36, 300)
    : Math.min(fieldWBudget * 0.72, 230);

  const layout: HexLayout = useMemo(
    () => hexLayout(fieldWBudget, fieldHBudget, grid),
    [fieldWBudget, fieldHBudget, grid]
  );

  if (!level && !isArena) return null;

  const maxHeroes = level?.maxHeroes ?? grid.maxHeroes;
  const placedKeys = Object.keys(placedHeroes);
  const placedCount = placedKeys.length;
  const unlockedHeroes = Object.values(heroes).filter((h) => h.unlocked);
  const synergyHeroIds = placedKeys.map(heroIdOfPlacement);
  const synergies = computeTeamSynergies(synergyHeroIds, store);
  const enemyPreview = level ? level.enemies : isArena ? generateArenaWave(arenaWave) : [];
  const teamPower = placedKeys.reduce(
    (s, k) => s + (getHeroEffectiveStats(heroIdOfPlacement(k), store)?.power ?? 0), 0
  );

  // Placement-instance occupying a given cell, if any.
  function occupantAt(col: number, row: number): string | null {
    const hit = Object.entries(placedHeroes).find(([, p]) => p.col === col && p.row === row);
    return hit ? hit[0] : null;
  }

  function handleCell(col: number, row: number) {
    if (col > grid.playerMaxCol) return; // enemy/contested side is read-only
    const occKey = occupantAt(col, row);
    if (occKey) {
      // Tapping the already-selected instance removes it; otherwise select it.
      if (selection?.kind === 'placement' && selection.key === occKey) {
        removeHeroFromGrid(occKey);
        setSelection(null);
      } else {
        setSelection({ kind: 'placement', key: occKey });
      }
      return;
    }
    // Empty player cell.
    if (selection?.kind === 'bench') {
      placeHero(selection.heroId, { col, row }); // keep selection for rapid multi-deploy
    } else if (selection?.kind === 'placement') {
      movePlacement(selection.key, { col, row });
      setSelection(null);
    }
  }

  function startBattle() {
    if (placedCount === 0) {
      Alert.alert('No heroes placed', 'Tap a hero card below, then tap a glowing tile.');
      return;
    }
    setScreen('battle');
  }

  const recommended = level?.recommendedPower ?? 0;
  const powerOk = !recommended || teamPower >= recommended;
  const spriteRatio = grid.size === 'siege' ? 0.78 : 0.9;

  // Touchable hex overlay aligned to the Arena backdrop.
  const cells: React.ReactNode[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const { cx, cy } = hexCenter({ col, row }, layout);
      const occKey = occupantAt(col, row);
      const placedHero = occKey ? heroes[heroIdOfPlacement(occKey)] : null;
      const enemyHere = enemyPreview.find((e) => e.position.col === col && e.position.row === row);
      const isPlayer = col <= grid.playerMaxCol;
      const selected = selection?.kind === 'placement' && selection.key === occKey;
      const canDrop = isPlayer && !occKey && selection != null;
      const spriteH = Math.min(layout.hexW, layout.hexH) * spriteRatio;
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
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && (
            <View style={{
              position: 'absolute', width: layout.hexW * 0.92, height: layout.hexH * 0.92,
              borderRadius: 10, borderWidth: 2.5, borderColor: palette.gold,
            }} />
          )}
          {canDrop && (
            <View style={{
              width: layout.hexW * 0.4, height: layout.hexW * 0.4, borderRadius: 999,
              borderWidth: 2, borderColor: palette.gold + 'aa',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={styles.plus}>＋</Text>
            </View>
          )}
          {placedHero ? (
            <MiniUnitPortrait icon={placedHero.icon} heroClass={placedHero.heroClass}
              isPlayer size={spriteH} stars={0} />
          ) : enemyHere ? (
            <MiniUnitPortrait icon={enemyHere.icon} heroClass={enemyHere.heroClass}
              isPlayer={false} size={spriteH} stars={enemyHere.stars} />
          ) : null}
        </TouchableOpacity>
      );
    }
  }

  const stageW = screenW - 16;
  const stageH = grid.size === 'siege'
    ? Math.min(screenH * 0.34, 280)
    : Math.min(layout.totalH + FRAME_PAD * 2 + 4, 244);

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
        <GButton small label="🗑 Clear" variant="purple" onPress={() => { clearPlacements(); setSelection(null); }} />
        <GButton small label="📁 Teams" variant="purple" onPress={() => setShowLoadouts((s) => !s)} />
        {!isArena && level && (
          <GButton
            small label={predicting ? '…' : '🔮 Predict'} variant="purple"
            onPress={async () => { setPredicting(true); const r = await predictBattle(level.id, 8); setPrediction(r); setPredicting(false); }}
          />
        )}
        <View style={styles.countChip}>
          <Text style={styles.countChipText}>{placedCount}/{maxHeroes}</Text>
        </View>
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
        <BattleStage
          contentWidth={layout.totalW + FRAME_PAD * 2}
          contentHeight={layout.totalH + FRAME_PAD * 2}
          viewportWidth={stageW}
          viewportHeight={stageH}
        >
          <View style={{ width: layout.totalW + FRAME_PAD * 2, height: layout.totalH + FRAME_PAD * 2 }}>
            <Arena width={layout.totalW} height={layout.totalH} layout={layout}
              theme={level?.theme} obstacles={level?.obstacles} />
            <View style={{
              position: 'absolute', left: FRAME_PAD, top: FRAME_PAD,
              width: layout.totalW, height: layout.totalH,
            }}>
              {cells}
            </View>
          </View>
        </BattleStage>
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
        <Text style={styles.benchTitle}>
          YOUR ROSTER — tap a card, then a glowing tile · place duplicates to field a squad
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, gap: 8 }}>
          {unlockedHeroes.map((hero) => {
            const sel = selection?.kind === 'bench' && selection.heroId === hero.id;
            const copies = Math.max(1, heroCards[hero.id] ?? 0);
            const placedOf = countPlacementsOf(hero.id, placedKeys);
            const allPlaced = placedOf >= copies;
            const stats = getHeroEffectiveStats(hero.id, store);
            return (
              <TouchableOpacity key={hero.id} activeOpacity={0.85}
                onPress={() => setSelection(sel ? null : { kind: 'bench', heroId: hero.id })}
                style={[styles.benchHero, sel && styles.benchSel, allPlaced && { opacity: 0.5 }]}
              >
                <HeroPortrait size={54} heroClass={hero.heroClass} rarity={hero.rarity} icon={hero.icon}
                  element={hero.baseStats.element} seed={hero.portraitSeed} level={hero.level}
                  selected={sel} />
                <Text style={styles.benchName} numberOfLines={1}>{hero.name}</Text>
                <View style={styles.benchRow}>
                  {stats && <Text style={styles.benchPower}>⚡{stats.power}</Text>}
                  <Text style={styles.benchCopies}>{placedOf}/{copies}🃏</Text>
                </View>
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
                  element={e.element ?? 'physical'} seed={e.name.charCodeAt(0) + i} isEnemy
                  showFrame={false} stars={e.stars} />
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
  toolbar: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 4, flexWrap: 'wrap', alignItems: 'center' },
  countChip: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: palette.panelDeep, borderRadius: 8, borderWidth: 1, borderColor: palette.goldDark },
  countChipText: { color: palette.gold, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  predict: { backgroundColor: palette.purpleDeep + '55', marginHorizontal: 12, borderRadius: 8, paddingVertical: 6, marginTop: 2 },
  predictText: { color: '#caa8ff', fontWeight: '800', fontSize: 12, textAlign: 'center' },
  loadouts: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 6 },
  loName: { color: palette.textSoft, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  arenaWrap: { paddingVertical: 8, alignItems: 'center' },
  plus: { color: palette.gold, fontSize: 16, fontWeight: '900' },
  synergies: { paddingHorizontal: 12, gap: 6, paddingVertical: 2 },
  synChip: { borderRadius: 10, paddingVertical: 4, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1 },
  synOn: { backgroundColor: palette.greenDeep + '44', borderColor: palette.green },
  synOff: { backgroundColor: palette.panelDeep, borderColor: '#0006' },
  synName: { color: palette.green, fontSize: 10, fontWeight: '800' },
  synCount: { color: palette.green, fontSize: 9, fontWeight: '700' },
  benchWrap: { paddingTop: 6 },
  benchTitle: { color: palette.textMute, fontSize: 9, paddingHorizontal: 12, marginBottom: 6, fontWeight: '700', letterSpacing: 0.5 },
  benchHero: { backgroundColor: palette.panelDeep, borderRadius: 12, padding: 6, alignItems: 'center', width: 78, borderWidth: 2, borderColor: '#0006' },
  benchSel: { borderColor: palette.gold, backgroundColor: palette.goldDark + '44' },
  benchName: { color: palette.textSoft, fontSize: 9, fontWeight: '700', marginTop: 3 },
  benchRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  benchPower: { color: palette.gold, fontSize: 9, fontWeight: '800' },
  benchCopies: { color: palette.blue, fontSize: 9, fontWeight: '800' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  enemyMini: { flex: 1 },
  enemyMiniTitle: { color: '#ff9a8a', fontSize: 9, fontWeight: '900', marginBottom: 4, letterSpacing: 1 },
});

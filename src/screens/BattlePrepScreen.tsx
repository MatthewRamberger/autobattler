import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { useGameStore, getHeroEffectiveStats, computeTeamSynergies, generateArenaWave } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { GridPosition } from '../types';
import { RARITY_COLORS } from '../data/equipment';
import { CLASS_COLORS } from '../data/heroes';
import HeroPortrait from '../components/HeroPortrait';

const GRID_COLS = 10;
const GRID_ROWS = 3;
const PLAYER_MAX_COL = 4;

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
  if (!level && !isArena) return null;

  const unlockedHeroes = Object.values(heroes).filter((h) => h.unlocked);
  const placedIds = new Set(Object.keys(placedHeroes));
  const synergies = computeTeamSynergies(Object.keys(placedHeroes), store);

  const enemyPreview = level ? level.enemies : isArena ? generateArenaWave(arenaWave) : [];
  const teamPower = Object.keys(placedHeroes).reduce((s, id) => {
    const stats = getHeroEffectiveStats(id, store);
    return s + (stats?.power ?? 0);
  }, 0);

  function handleCellPress(col: number, row: number) {
    if (col > PLAYER_MAX_COL) return;
    const pos: GridPosition = { col, row };
    const existing = Object.entries(placedHeroes).find(([, p]) => p.col === col && p.row === row);
    if (existing) {
      if (selectedHeroId === existing[0]) {
        removeHeroFromGrid(existing[0]);
        setSelectedHeroId(null);
      } else {
        setSelectedHeroId(existing[0]);
      }
      return;
    }
    if (selectedHeroId) {
      placeHero(selectedHeroId, pos);
      setSelectedHeroId(null);
    }
  }

  function startBattle() {
    if (Object.keys(placedHeroes).length === 0) {
      Alert.alert('No heroes placed!', 'Place at least one hero on the left side.');
      return;
    }
    setScreen('battle');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { clearPlacements(); setScreen(isArena ? 'arena' : 'levels'); }} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title} numberOfLines={1}>
            {isArena ? `Arena Wave ${arenaWave}` : level?.name ?? ''}
          </Text>
          <Text style={styles.subtitle}>
            Power {teamPower}{level?.recommendedPower ? ` / rec ${level.recommendedPower}` : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.battleBtn} onPress={startBattle}>
          <Text style={styles.battleBtnText}>FIGHT ▶</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbarRow}>
        <TouchableOpacity style={styles.toolBtn} onPress={autoPlace}>
          <Text style={styles.toolBtnText}>✨ Auto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => clearPlacements()}>
          <Text style={styles.toolBtnText}>🗑 Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => setShowLoadouts((s) => !s)}>
          <Text style={styles.toolBtnText}>📁 Loadouts</Text>
        </TouchableOpacity>
        {!isArena && level && (
          <TouchableOpacity
            style={styles.toolBtn}
            disabled={predicting || Object.keys(placedHeroes).length === 0}
            onPress={async () => {
              setPredicting(true);
              const r = await predictBattle(level.id, 8);
              setPrediction(r);
              setPredicting(false);
            }}
          >
            <Text style={styles.toolBtnText}>{predicting ? '...' : '🔮 Predict'}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerCounts}>
          <Text style={styles.countText}>👥 {Object.keys(placedHeroes).length}/5</Text>
        </View>
      </View>

      {prediction && (
        <View style={styles.predictionRow}>
          <Text style={styles.predictionText}>
            Predicted win rate: {Math.round(prediction.winRate * 100)}% · avg {prediction.avgTicks} ticks
          </Text>
        </View>
      )}

      {showLoadouts && (
        <View style={styles.loadoutsRow}>
          {([1, 2, 3] as const).map((slot) => {
            const key = `slot_${slot}`;
            const lo = loadouts[key];
            return (
              <View key={key} style={styles.loadoutSlot}>
                <Text style={styles.loadoutLabel}>{lo?.name ?? `Loadout ${slot}`}</Text>
                <View style={styles.loadoutBtns}>
                  <TouchableOpacity
                    style={styles.loSmall}
                    onPress={() => saveLoadout(key, `Team ${slot}`)}
                  >
                    <Text style={styles.loSmallText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.loSmall, { backgroundColor: '#27ae60' }]}
                    disabled={!lo}
                    onPress={() => applyLoadout(key)}
                  >
                    <Text style={styles.loSmallText}>Load</Text>
                  </TouchableOpacity>
                  {lo && (
                    <TouchableOpacity
                      style={[styles.loSmall, { backgroundColor: '#c0392b' }]}
                      onPress={() => deleteLoadout(key)}
                    >
                      <Text style={styles.loSmallText}>X</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {Array.from({ length: GRID_ROWS }, (_, row) => (
            <View key={row} style={styles.gridRow}>
              {Array.from({ length: GRID_COLS }, (_, col) => {
                const isPlayerSide = col <= PLAYER_MAX_COL;
                const placedHeroId = Object.entries(placedHeroes).find(([, p]) => p.col === col && p.row === row)?.[0];
                const enemyHere = level?.enemies.find((e) => e.position.col === col && e.position.row === row);
                const placedHero = placedHeroId ? heroes[placedHeroId] : null;
                const isSelected = placedHeroId === selectedHeroId;

                return (
                  <TouchableOpacity
                    key={col}
                    style={[
                      styles.cell,
                      isPlayerSide ? styles.playerCell : styles.enemyCell,
                      isSelected && styles.selectedCell,
                      col === PLAYER_MAX_COL && styles.dividerRight,
                      col === PLAYER_MAX_COL + 1 && styles.dividerLeft,
                    ]}
                    onPress={() => handleCellPress(col, row)}
                    activeOpacity={isPlayerSide ? 0.7 : 1}
                  >
                    {placedHero ? (
                      <HeroPortrait
                        size={36}
                        heroClass={placedHero.heroClass}
                        rarity={placedHero.rarity}
                        icon={placedHero.icon}
                        element={placedHero.baseStats.element}
                        seed={placedHero.portraitSeed}
                        stars={placedHero.stars}
                        showFrame={false}
                      />
                    ) : enemyHere ? (
                      <HeroPortrait
                        size={36}
                        heroClass={enemyHere.heroClass}
                        rarity={'common'}
                        icon={enemyHere.icon}
                        element={enemyHere.element ?? 'physical'}
                        seed={(enemyHere.name.charCodeAt(0) * 13) + enemyHere.position.col}
                        stars={enemyHere.stars}
                        isEnemy
                        showFrame={false}
                      />
                    ) : isPlayerSide ? (
                      <Text style={styles.emptyCell}>+</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Synergies */}
      {synergies.length > 0 && (
        <View style={styles.synergyBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, gap: 6 }}>
            {synergies.map((s) => (
              <View key={s.id} style={[
                styles.synergyChip,
                s.active ? styles.synergyActive : styles.synergyInactive,
              ]}>
                <Text style={[styles.synergyName, !s.active && { color: '#666' }]}>{s.name}</Text>
                <Text style={[styles.synergyCount, !s.active && { color: '#555' }]}>{s.count}/{s.threshold}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Hero bench */}
      <View style={styles.bench}>
        <Text style={styles.benchTitle}>HEROES — tap to select, then tap a cell</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.benchList}>
          {unlockedHeroes.map((hero) => {
            const isSelected = hero.id === selectedHeroId;
            const isPlaced = placedIds.has(hero.id);
            const stats = getHeroEffectiveStats(hero.id, store);
            return (
              <TouchableOpacity
                key={hero.id}
                style={[styles.benchHero, isSelected && styles.benchHeroSelected, isPlaced && styles.benchHeroPlaced]}
                onPress={() => setSelectedHeroId(hero.id === selectedHeroId ? null : hero.id)}
                activeOpacity={0.8}
              >
                <HeroPortrait
                  size={56}
                  heroClass={hero.heroClass}
                  rarity={hero.rarity}
                  icon={hero.icon}
                  element={hero.baseStats.element}
                  seed={hero.portraitSeed}
                  level={hero.level}
                  stars={hero.stars}
                  selected={isSelected}
                />
                <Text style={styles.benchName} numberOfLines={1}>{hero.name}</Text>
                {stats && <Text style={styles.benchPower}>⚡{stats.power}</Text>}
                {isPlaced && <View style={styles.placedBadge}><Text style={styles.placedBadgeText}>ON GRID</Text></View>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Enemy preview */}
      <View style={styles.enemyPreview}>
        <Text style={styles.enemyPreviewTitle}>ENEMIES ({enemyPreview.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {enemyPreview.map((e, idx) => (
            <View key={idx} style={styles.enemyChip}>
              <HeroPortrait
                size={44}
                heroClass={e.heroClass}
                rarity={'common'}
                icon={e.icon}
                element={e.element ?? 'physical'}
                seed={e.name.charCodeAt(0) + idx}
                isEnemy
                showFrame
                level={e.level}
                stars={e.stars}
              />
              <Text style={styles.enemyChipName} numberOfLines={1}>{e.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 10, borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: '#888', fontSize: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { color: '#fff', fontWeight: '800', fontSize: 14 },
  subtitle: { color: '#666', fontSize: 10, marginTop: 1 },
  battleBtn: { backgroundColor: '#c0392b', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  battleBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  toolbarRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  toolBtn: { backgroundColor: '#1e1e2e', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#333' },
  toolBtnText: { color: '#ccc', fontSize: 11 },
  predictionRow: { backgroundColor: '#2a2a4e', paddingHorizontal: 10, paddingVertical: 6 },
  predictionText: { color: '#7c83fd', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  loadoutsRow: { flexDirection: 'row', padding: 6, gap: 4 },
  loadoutSlot: { flex: 1, backgroundColor: '#1e1e2e', borderRadius: 6, padding: 4, borderWidth: 1, borderColor: '#333' },
  loadoutLabel: { color: '#ccc', fontSize: 10, textAlign: 'center', marginBottom: 4 },
  loadoutBtns: { flexDirection: 'row', gap: 2 },
  loSmall: { flex: 1, backgroundColor: '#3498db', borderRadius: 4, paddingVertical: 4, alignItems: 'center' },
  loSmallText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  headerCounts: { flex: 1, alignItems: 'flex-end' },
  countText: { color: '#666', fontSize: 11 },
  gridContainer: { paddingHorizontal: 4 },
  grid: {},
  gridRow: { flexDirection: 'row' },
  cell: {
    flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
    borderWidth: 0.5, borderColor: '#1e1e2e',
  },
  playerCell: { backgroundColor: '#0d1a0d' },
  enemyCell: { backgroundColor: '#1a0d0d' },
  selectedCell: { backgroundColor: '#1a2a1a', borderColor: '#27ae60', borderWidth: 2 },
  dividerRight: { borderRightWidth: 2, borderRightColor: '#333' },
  dividerLeft: { borderLeftWidth: 2, borderLeftColor: '#333' },
  emptyCell: { color: '#1e1e2e', fontSize: 16 },
  synergyBar: { paddingVertical: 4, borderTopWidth: 1, borderTopColor: '#1e1e2e' },
  synergyChip: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, alignItems: 'center' },
  synergyActive: { backgroundColor: '#27ae6033', borderWidth: 1, borderColor: '#27ae60' },
  synergyInactive: { backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#333' },
  synergyName: { color: '#27ae60', fontSize: 10, fontWeight: '700' },
  synergyCount: { color: '#27ae60', fontSize: 9 },
  bench: { borderTopWidth: 1, borderTopColor: '#1e1e2e', paddingTop: 6 },
  benchTitle: { color: '#555', fontSize: 9, paddingHorizontal: 10, marginBottom: 4, letterSpacing: 0.5 },
  benchList: { paddingHorizontal: 8, gap: 6 },
  benchHero: {
    backgroundColor: '#1e1e2e', borderRadius: 8, padding: 6, alignItems: 'center',
    width: 70, borderWidth: 1, borderColor: '#2a2a2a',
  },
  benchHeroSelected: { borderColor: '#27ae60', backgroundColor: '#0d2a0d', borderWidth: 2 },
  benchHeroPlaced: { opacity: 0.5 },
  benchName: { color: '#ccc', fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  benchPower: { color: '#f1c40f', fontSize: 9, marginTop: 1 },
  placedBadge: { marginTop: 2, backgroundColor: '#27ae6044', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  placedBadgeText: { color: '#27ae60', fontSize: 7, fontWeight: '700' },
  enemyPreview: { borderTopWidth: 1, borderTopColor: '#1e1e2e', paddingVertical: 6, paddingHorizontal: 4 },
  enemyPreviewTitle: { color: '#c0392b', fontSize: 9, fontWeight: '700', paddingHorizontal: 8, marginBottom: 4, letterSpacing: 1 },
  enemyChip: { alignItems: 'center', marginHorizontal: 4, minWidth: 60 },
  enemyChipName: { color: '#e74c3c', fontSize: 8, fontWeight: '600', marginTop: 2, textAlign: 'center', maxWidth: 60 },
});

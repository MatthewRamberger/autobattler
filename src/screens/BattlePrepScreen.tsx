import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { useGameStore, getHeroEffectiveStats } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { GridPosition } from '../types';
import { RARITY_COLORS } from '../data/equipment';
import { CLASS_COLORS } from '../data/heroes';

const GRID_COLS = 10;
const GRID_ROWS = 3;
const PLAYER_MAX_COL = 4;

export default function BattlePrepScreen() {
  const store = useGameStore();
  const { currentLevelId, heroes, placedHeroes, setScreen, placeHero, removeHeroFromGrid, clearPlacements } = store;
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);

  const level = LEVELS.find((l) => l.id === currentLevelId);
  if (!level) return null;

  const unlockedHeroes = Object.values(heroes).filter((h) => h.unlocked);
  const placedIds = new Set(Object.keys(placedHeroes));

  function handleCellPress(col: number, row: number) {
    if (col > PLAYER_MAX_COL) return; // Can't place on enemy side

    const pos: GridPosition = { col, row };
    const existingHeroOnCell = Object.entries(placedHeroes).find(
      ([, p]) => p.col === col && p.row === row
    );

    if (existingHeroOnCell) {
      // Tap placed hero to select/remove
      if (selectedHeroId === existingHeroOnCell[0]) {
        removeHeroFromGrid(existingHeroOnCell[0]);
        setSelectedHeroId(null);
      } else {
        setSelectedHeroId(existingHeroOnCell[0]);
      }
      return;
    }

    if (selectedHeroId) {
      placeHero(selectedHeroId, pos);
      setSelectedHeroId(null);
    }
  }

  function handleHeroTap(heroId: string) {
    if (placedIds.has(heroId)) {
      setSelectedHeroId(heroId === selectedHeroId ? null : heroId);
    } else {
      setSelectedHeroId(heroId === selectedHeroId ? null : heroId);
    }
  }

  function startBattle() {
    if (Object.keys(placedHeroes).length === 0) {
      Alert.alert('No heroes placed!', 'Place at least one hero on the left side of the grid.');
      return;
    }
    setScreen('battle');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { clearPlacements(); setScreen('levels'); }} style={styles.backBtn}>
          <Text style={styles.backText}>← Levels</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{level.name}</Text>
          <Text style={styles.subtitle}>Place heroes on the left half</Text>
        </View>
        <TouchableOpacity style={styles.battleBtn} onPress={startBattle}>
          <Text style={styles.battleBtnText}>FIGHT ▶</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        <Text style={styles.gridLabel}>YOUR SIDE</Text>
        <View style={styles.grid}>
          {Array.from({ length: GRID_ROWS }, (_, row) => (
            <View key={row} style={styles.gridRow}>
              {Array.from({ length: GRID_COLS }, (_, col) => {
                const isPlayerSide = col <= PLAYER_MAX_COL;
                const placedHeroId = Object.entries(placedHeroes).find(
                  ([, p]) => p.col === col && p.row === row
                )?.[0];
                const enemyHere = level.enemies.find((e) => e.position.col === col && e.position.row === row);
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
                    activeOpacity={isPlayerSide ? 0.8 : 1}
                  >
                    {placedHero ? (
                      <View style={[styles.unitIcon, { backgroundColor: CLASS_COLORS[placedHero.heroClass] + '44' }]}>
                        <Text style={styles.unitEmoji}>{placedHero.icon}</Text>
                      </View>
                    ) : enemyHere ? (
                      <View style={styles.enemyUnitIcon}>
                        <Text style={styles.unitEmoji}>{enemyHere.icon}</Text>
                      </View>
                    ) : isPlayerSide ? (
                      <Text style={styles.emptyCell}>+</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
        <Text style={styles.gridLabel}>ENEMY SIDE</Text>
      </View>

      {/* Hero bench */}
      <View style={styles.bench}>
        <Text style={styles.benchTitle}>HEROES  —  Tap to select, then tap a cell to place</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.benchList}>
          {unlockedHeroes.map((hero) => {
            const isSelected = hero.id === selectedHeroId;
            const isPlaced = placedIds.has(hero.id);
            const stats = getHeroEffectiveStats(hero.id, store);
            return (
              <TouchableOpacity
                key={hero.id}
                style={[styles.benchHero, isSelected && styles.benchHeroSelected, isPlaced && styles.benchHeroPlaced]}
                onPress={() => handleHeroTap(hero.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.benchIcon}>{hero.icon}</Text>
                <Text style={styles.benchName} numberOfLines={1}>{hero.name}</Text>
                <Text style={styles.benchLevel}>Lv.{hero.level}</Text>
                {stats && <Text style={styles.benchHp}>❤️{stats.maxHp}</Text>}
                {isPlaced && <View style={styles.placedBadge}><Text style={styles.placedBadgeText}>ON GRID</Text></View>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Enemy preview */}
      <View style={styles.enemyPreview}>
        <Text style={styles.enemyPreviewTitle}>ENEMIES ({level.enemies.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {level.enemies.map((e, idx) => (
            <View key={idx} style={styles.enemyChip}>
              <Text style={styles.enemyChipIcon}>{e.icon}</Text>
              <Text style={styles.enemyChipName}>{e.name}</Text>
              <Text style={styles.enemyChipLevel}>Lv.{e.level}</Text>
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
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: '#888', fontSize: 13 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { color: '#fff', fontWeight: '800', fontSize: 15 },
  subtitle: { color: '#555', fontSize: 10, marginTop: 2 },
  battleBtn: { backgroundColor: '#c0392b', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  battleBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  gridContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  gridLabel: { color: '#333', fontSize: 9, fontWeight: '700', letterSpacing: 1, writingDirection: 'ltr', width: 20, textAlign: 'center' },
  grid: { flex: 1 },
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
  unitIcon: { width: '80%', height: '80%', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  enemyUnitIcon: { width: '80%', height: '80%', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ff000022' },
  unitEmoji: { fontSize: 16 },
  emptyCell: { color: '#1e1e2e', fontSize: 16, fontWeight: '300' },
  bench: { borderTopWidth: 1, borderTopColor: '#1e1e2e', paddingTop: 8 },
  benchTitle: { color: '#555', fontSize: 10, paddingHorizontal: 12, marginBottom: 6, letterSpacing: 0.5 },
  benchList: { paddingHorizontal: 12, gap: 8 },
  benchHero: {
    backgroundColor: '#1e1e2e', borderRadius: 10, padding: 8, alignItems: 'center',
    width: 72, borderWidth: 2, borderColor: '#2a2a2a',
  },
  benchHeroSelected: { borderColor: '#27ae60', backgroundColor: '#0d2a0d' },
  benchHeroPlaced: { opacity: 0.6 },
  benchIcon: { fontSize: 24, marginBottom: 3 },
  benchName: { color: '#ccc', fontSize: 9, fontWeight: '600', textAlign: 'center' },
  benchLevel: { color: '#666', fontSize: 9, marginTop: 1 },
  benchHp: { color: '#e74c3c', fontSize: 9, marginTop: 1 },
  placedBadge: { marginTop: 3, backgroundColor: '#27ae6044', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  placedBadgeText: { color: '#27ae60', fontSize: 8, fontWeight: '700' },
  enemyPreview: { borderTopWidth: 1, borderTopColor: '#1e1e2e', paddingVertical: 8 },
  enemyPreviewTitle: { color: '#c0392b', fontSize: 10, fontWeight: '700', paddingHorizontal: 12, marginBottom: 6, letterSpacing: 1 },
  enemyChip: { backgroundColor: '#2a0d0d', borderRadius: 8, padding: 8, alignItems: 'center', marginHorizontal: 4, minWidth: 60, borderWidth: 1, borderColor: '#c0392b44' },
  enemyChipIcon: { fontSize: 20 },
  enemyChipName: { color: '#e74c3c', fontSize: 8, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  enemyChipLevel: { color: '#666', fontSize: 8 },
});

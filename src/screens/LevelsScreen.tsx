import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { LEVELS, DIFFICULTY_COLORS } from '../data/levels';
import HeroPortrait from '../components/HeroPortrait';

export default function LevelsScreen() {
  const { setScreen, levelProgress, setCurrentLevel, autoResolveLevel, placedHeroes, autoPlace } = useGameStore();
  const [grinding, setGrinding] = useState<number | null>(null);

  function handleSelectLevel(levelId: number) {
    setCurrentLevel(levelId);
    setScreen('battle-prep');
  }

  async function handleAutoResolve(levelId: number, times: number) {
    if (Object.keys(placedHeroes).length === 0) autoPlace();
    setGrinding(levelId);
    const r = await autoResolveLevel(levelId, times);
    setGrinding(null);
    Alert.alert(
      `Auto-resolve ×${times}`,
      `Wins: ${r.wins}\nLosses: ${r.losses}\nGold: +${r.goldGained}\nEXP: +${r.expGained}`,
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>CAMPAIGN</Text>
        <Text style={styles.progress}>
          {Object.values(levelProgress).filter((p) => p.completed).length}/{LEVELS.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {LEVELS.map((level, idx) => {
          const progress = levelProgress[level.id];
          const isCompleted = !!progress?.completed;
          const prevCompleted = idx === 0 || !!levelProgress[LEVELS[idx - 1].id]?.completed;
          const isLocked = !prevCompleted;
          const diffColor = DIFFICULTY_COLORS[level.difficulty];

          return (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelCard,
                { borderColor: isCompleted ? diffColor : isLocked ? '#222' : diffColor + '88' },
                isLocked && styles.locked,
              ]}
              onPress={() => !isLocked && handleSelectLevel(level.id)}
              activeOpacity={isLocked ? 1 : 0.8}
            >
              <View style={styles.levelNumCol}>
                <View style={[styles.levelNumBg, { backgroundColor: isLocked ? '#222' : diffColor }]}>
                  <Text style={styles.levelNum}>{level.id}</Text>
                </View>
                {level.bossMechanic && !isLocked && (
                  <Text style={styles.bossLabel}>{level.bossMechanic.toUpperCase()}</Text>
                )}
              </View>

              <View style={styles.levelInfo}>
                <View style={styles.levelNameRow}>
                  <Text style={[styles.levelName, isLocked && styles.lockedText]} numberOfLines={1}>{level.name}</Text>
                  <View style={[styles.diffBadge, { backgroundColor: diffColor + (isLocked ? '44' : '') }]}>
                    <Text style={styles.diffText}>{level.difficulty.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.levelDesc, isLocked && styles.lockedText]} numberOfLines={2}>
                  {isLocked ? '🔒 Complete previous level to unlock' : level.description}
                </Text>
                {!isLocked && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.enemyRow}>
                    {level.enemies.map((e, i) => (
                      <View key={i} style={{ marginRight: 4 }}>
                        <HeroPortrait
                          size={28}
                          heroClass={e.heroClass}
                          rarity="common"
                          icon={e.icon}
                          element={e.element ?? 'physical'}
                          seed={e.name.charCodeAt(0) + i}
                          isEnemy
                          showFrame={false}
                          stars={e.stars}
                        />
                      </View>
                    ))}
                  </ScrollView>
                )}
                <View style={styles.rewardsRow}>
                  <Text style={styles.rewardItem}>💰 {level.rewards.gold}</Text>
                  <Text style={styles.rewardItem}>⭐ {level.rewards.experience}</Text>
                  {level.recommendedPower && (
                    <Text style={styles.rewardItem}>⚡ {level.recommendedPower}</Text>
                  )}
                </View>
              </View>

              <View style={styles.statusCol}>
                {isCompleted ? (
                  <>
                    <Text style={styles.starsText}>⭐⭐⭐</Text>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); handleAutoResolve(level.id, 5); }}
                      style={styles.autoBtn}
                      disabled={grinding === level.id}
                    >
                      <Text style={styles.autoText}>
                        {grinding === level.id ? '…' : '×5'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : isLocked ? (
                  <Text style={styles.lockIcon}>🔒</Text>
                ) : (
                  <Text style={styles.playBtn}>▶</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 13 },
  title: { color: '#c0392b', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  progress: { color: '#888', fontSize: 13 },
  list: { padding: 10 },
  levelCard: {
    backgroundColor: '#1e1e2e', borderRadius: 12, borderWidth: 2,
    padding: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  locked: { opacity: 0.5 },
  levelNumCol: { alignItems: 'center' },
  levelNumBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  levelNum: { color: '#fff', fontWeight: '800', fontSize: 14 },
  bossLabel: { color: '#bb8fce', fontSize: 8, fontWeight: '700', marginTop: 2 },
  levelInfo: { flex: 1 },
  levelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  levelName: { color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 },
  lockedText: { color: '#555' },
  diffBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  diffText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  levelDesc: { color: '#777', fontSize: 11, lineHeight: 14, marginBottom: 4 },
  enemyRow: { marginVertical: 4, flexDirection: 'row' },
  rewardsRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  rewardItem: { color: '#555', fontSize: 10 },
  statusCol: { alignItems: 'center', minWidth: 42 },
  starsText: { fontSize: 10 },
  lockIcon: { fontSize: 18 },
  playBtn: { color: '#27ae60', fontSize: 22, fontWeight: '700' },
  autoBtn: { marginTop: 4, backgroundColor: '#e67e2233', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#e67e22' },
  autoText: { color: '#e67e22', fontSize: 10, fontWeight: '800' },
});

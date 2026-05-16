import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { LEVELS, DIFFICULTY_COLORS } from '../data/levels';

export default function LevelsScreen() {
  const { setScreen, levelProgress, setCurrentLevel } = useGameStore();

  function handleSelectLevel(levelId: number) {
    setCurrentLevel(levelId);
    setScreen('battle-prep');
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
              </View>

              <View style={styles.levelInfo}>
                <View style={styles.levelNameRow}>
                  <Text style={[styles.levelName, isLocked && styles.lockedText]}>{level.name}</Text>
                  <View style={[styles.diffBadge, { backgroundColor: diffColor + (isLocked ? '44' : '') }]}>
                    <Text style={styles.diffText}>{level.difficulty.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.levelDesc, isLocked && styles.lockedText]} numberOfLines={2}>
                  {isLocked ? '🔒 Complete previous level to unlock' : level.description}
                </Text>
                <View style={styles.rewardsRow}>
                  <Text style={styles.rewardItem}>💰 {level.rewards.gold}</Text>
                  <Text style={styles.rewardItem}>⭐ {level.rewards.experience} EXP</Text>
                  <Text style={styles.rewardItem}>👹 {level.enemies.length} enemies</Text>
                </View>
              </View>

              <View style={styles.statusCol}>
                {isCompleted ? (
                  <Text style={styles.starsText}>⭐⭐⭐</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 14 },
  title: { color: '#c0392b', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  progress: { color: '#888', fontSize: 14 },
  list: { padding: 12 },
  levelCard: {
    backgroundColor: '#1e1e2e', borderRadius: 14, borderWidth: 2,
    padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  locked: { opacity: 0.5 },
  levelNumCol: { alignItems: 'center' },
  levelNumBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  levelNum: { color: '#fff', fontWeight: '800', fontSize: 16 },
  levelInfo: { flex: 1 },
  levelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  levelName: { color: '#fff', fontWeight: '700', fontSize: 15, flex: 1 },
  lockedText: { color: '#555' },
  diffBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  diffText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  levelDesc: { color: '#777', fontSize: 12, lineHeight: 16, marginBottom: 6 },
  rewardsRow: { flexDirection: 'row', gap: 12 },
  rewardItem: { color: '#555', fontSize: 11 },
  statusCol: { alignItems: 'center', minWidth: 44 },
  starsText: { fontSize: 10 },
  lockIcon: { fontSize: 20 },
  playBtn: { color: '#27ae60', fontSize: 24, fontWeight: '700' },
});

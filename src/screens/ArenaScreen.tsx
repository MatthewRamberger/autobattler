import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useGameStore, generateArenaWave } from '../store/gameStore';
import HeroPortrait from '../components/HeroPortrait';

export default function ArenaScreen() {
  const { setScreen, arenaWave, arenaBestWave, setArenaWave, setCurrentLevel } = useGameStore();

  const preview = generateArenaWave(arenaWave);

  function startArena() {
    // Use a sentinel id (-1) for arena.
    setCurrentLevel(-1);
    setScreen('battle-prep');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ARENA</Text>
        <Text style={styles.progress}>Best W{arenaBestWave}</Text>
      </View>

      <View style={styles.waveCard}>
        <Text style={styles.waveLabel}>CURRENT WAVE</Text>
        <Text style={styles.waveNum}>{arenaWave}</Text>
        <Text style={styles.waveDesc}>
          Enemies scale with wave number. Win to advance — defeat resets to wave 1.
        </Text>
        <View style={styles.rewardsBox}>
          <Text style={styles.rewardItem}>💰 {30 + arenaWave * 15}</Text>
          <Text style={styles.rewardItem}>⭐ {20 + arenaWave * 10}</Text>
          <Text style={styles.rewardItem}>💎 2</Text>
        </View>

        <Text style={styles.previewTitle}>ENEMY PREVIEW</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}>
          {preview.map((e, i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <HeroPortrait
                size={52}
                heroClass={e.heroClass}
                rarity={'common'}
                icon={e.icon}
                element={e.element ?? 'physical'}
                seed={e.name.charCodeAt(0) + i}
                isEnemy
                level={e.level}
                stars={e.stars}
              />
              <Text style={styles.previewName}>{e.heroClass}</Text>
              <Text style={styles.previewLvl}>Lv.{e.level}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#666' }]}
          onPress={() => {
            Alert.alert('Reset wave?', 'Restart from wave 1.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => setArenaWave(1) },
            ]);
          }}
        >
          <Text style={styles.actionText}>↺ Reset to Wave 1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e84393' }]} onPress={startArena}>
          <Text style={styles.actionText}>⚔ Fight Wave {arenaWave}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 13 },
  title: { color: '#e84393', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  progress: { color: '#888', fontSize: 13 },
  waveCard: { backgroundColor: '#1e1e2e', borderRadius: 14, margin: 14, padding: 18, alignItems: 'center', borderWidth: 2, borderColor: '#e84393' },
  waveLabel: { color: '#888', fontSize: 11, letterSpacing: 2 },
  waveNum: { color: '#e84393', fontSize: 64, fontWeight: '900', marginVertical: 6 },
  waveDesc: { color: '#888', fontSize: 11, textAlign: 'center', marginBottom: 14, lineHeight: 16 },
  rewardsBox: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  rewardItem: { color: '#f1c40f', fontSize: 13, fontWeight: '700' },
  previewTitle: { color: '#555', fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  previewName: { color: '#888', fontSize: 9, marginTop: 3 },
  previewLvl: { color: '#666', fontSize: 9 },
  actions: { flexDirection: 'row', padding: 14, gap: 10 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

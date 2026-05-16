import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { ACHIEVEMENTS } from '../data/achievements';

export default function AchievementsScreen() {
  const { setScreen, achievements, claimAchievement, gold, gems } = useGameStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ACHIEVEMENTS</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.gold}>💰 {gold}</Text>
          <Text style={[styles.gold, { color: '#bb8fce' }]}>💎 {gems}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {ACHIEVEMENTS.map((a) => {
          const ap = achievements[a.id] ?? { progress: 0, claimed: false };
          const pct = Math.min(1, ap.progress / a.goal);
          const ready = ap.progress >= a.goal && !ap.claimed;
          return (
            <View key={a.id} style={[styles.card, ready && styles.ready, ap.claimed && styles.claimed]}>
              <Text style={styles.icon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{a.name}</Text>
                <Text style={styles.desc}>{a.description}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {Math.min(ap.progress, a.goal)} / {a.goal}
                </Text>
                <Text style={styles.reward}>
                  Reward:{' '}
                  {a.reward.gold ? `💰 ${a.reward.gold}` : ''}
                  {a.reward.gems ? ` 💎 ${a.reward.gems}` : ''}
                  {a.reward.itemId ? ' 🎁 item' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.claimBtn, !ready && styles.claimDisabled]}
                disabled={!ready}
                onPress={() => claimAchievement(a.id)}
              >
                <Text style={[styles.claimText, !ready && { color: '#555' }]}>
                  {ap.claimed ? '✓' : ready ? 'CLAIM' : '—'}
                </Text>
              </TouchableOpacity>
            </View>
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
  title: { color: '#bb8fce', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  gold: { color: '#f1c40f', fontWeight: '700', fontSize: 13 },
  list: { padding: 10 },
  card: {
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 12,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#333',
  },
  ready: { borderColor: '#27ae60', backgroundColor: '#0d2a0d' },
  claimed: { opacity: 0.5 },
  icon: { fontSize: 32 },
  name: { color: '#fff', fontWeight: '800', fontSize: 14 },
  desc: { color: '#888', fontSize: 11, marginTop: 2 },
  track: { height: 5, backgroundColor: '#222', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#bb8fce' },
  progressText: { color: '#666', fontSize: 10, marginTop: 2 },
  reward: { color: '#f1c40f', fontSize: 11, marginTop: 3 },
  claimBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#27ae60' },
  claimDisabled: { backgroundColor: '#1a1a2a' },
  claimText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});

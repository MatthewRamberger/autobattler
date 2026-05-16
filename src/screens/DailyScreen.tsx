import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function DailyScreen() {
  const {
    setScreen, dailyQuests, dailyQuestProgress, claimDailyQuest,
    dailyResetAt, loginStreak, gold, gems,
  } = useGameStore();

  const msLeft = Math.max(0, dailyResetAt - Date.now());
  const hours = Math.floor(msLeft / 3_600_000);
  const minutes = Math.floor((msLeft % 3_600_000) / 60_000);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>DAILY</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.currency}>💰 {gold}</Text>
          <Text style={[styles.currency, { color: '#bb8fce' }]}>💎 {gems}</Text>
        </View>
      </View>

      <View style={styles.streakCard}>
        <Text style={styles.streakLabel}>LOGIN STREAK</Text>
        <Text style={styles.streakValue}>🔥 {loginStreak} day{loginStreak === 1 ? '' : 's'}</Text>
        <Text style={styles.streakReset}>Resets in {hours}h {minutes}m</Text>
      </View>

      <Text style={styles.section}>TODAY'S QUESTS</Text>
      <ScrollView contentContainerStyle={{ padding: 10 }}>
        {dailyQuests.length === 0 ? (
          <Text style={styles.empty}>No quests yet — refresh or check back tomorrow.</Text>
        ) : dailyQuests.map((q) => {
          const ap = dailyQuestProgress[q.id] ?? { progress: 0, claimed: false };
          const pct = Math.min(1, ap.progress / q.goal);
          const ready = ap.progress >= q.goal && !ap.claimed;
          return (
            <View key={q.id} style={[styles.card, ready && styles.ready, ap.claimed && styles.claimed]}>
              <Text style={styles.icon}>{q.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{q.name}</Text>
                <Text style={styles.desc}>{q.description}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {Math.min(ap.progress, q.goal)} / {q.goal}
                </Text>
                <Text style={styles.reward}>
                  Reward:{' '}
                  {q.reward.gold ? `💰 ${q.reward.gold}` : ''}
                  {q.reward.gems ? `  💎 ${q.reward.gems}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.claimBtn, !ready && styles.claimDisabled]}
                disabled={!ready}
                onPress={() => claimDailyQuest(q.id)}
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
  title: { color: '#e67e22', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  currency: { color: '#f1c40f', fontWeight: '700', fontSize: 13 },
  streakCard: {
    margin: 12, padding: 14, backgroundColor: '#1e1e2e',
    borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e67e22',
  },
  streakLabel: { color: '#888', fontSize: 10, letterSpacing: 2 },
  streakValue: { color: '#e67e22', fontSize: 22, fontWeight: '900', marginVertical: 4 },
  streakReset: { color: '#555', fontSize: 11 },
  section: { color: '#555', fontSize: 11, paddingHorizontal: 14, letterSpacing: 2, marginTop: 4 },
  empty: { color: '#555', textAlign: 'center', padding: 30 },
  card: {
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 12,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#333',
  },
  ready: { borderColor: '#27ae60', backgroundColor: '#0d2a0d' },
  claimed: { opacity: 0.5 },
  icon: { fontSize: 30 },
  name: { color: '#fff', fontWeight: '800', fontSize: 14 },
  desc: { color: '#888', fontSize: 11, marginTop: 2 },
  track: { height: 5, backgroundColor: '#222', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#e67e22' },
  progressText: { color: '#666', fontSize: 10, marginTop: 2 },
  reward: { color: '#f1c40f', fontSize: 11, marginTop: 3 },
  claimBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#27ae60' },
  claimDisabled: { backgroundColor: '#1a1a2a' },
  claimText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});

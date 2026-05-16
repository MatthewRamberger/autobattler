import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';
import {
  Screen, TopBar, Panel, GButton, Bar, CurrencyBar, palette, spacing,
} from '../components/ui';
import { gradients } from '../theme';

export default function DailyScreen() {
  const {
    setScreen, dailyQuests, dailyQuestProgress, claimDailyQuest,
    dailyResetAt, loginStreak, gold, gems,
  } = useGameStore();

  const msLeft = Math.max(0, dailyResetAt - Date.now());
  const hours = Math.floor(msLeft / 3_600_000);
  const minutes = Math.floor((msLeft % 3_600_000) / 60_000);

  return (
    <Screen>
      <TopBar title="DAILY" onBack={() => setScreen('home')} right={<CurrencyBar gold={gold} gems={gems} />} />
      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        <Panel glow={palette.gold} style={{ alignItems: 'center', marginBottom: spacing.md }}>
          <Text style={styles.streakLabel}>LOGIN STREAK</Text>
          <Text style={styles.streakValue}>🔥 {loginStreak} day{loginStreak === 1 ? '' : 's'}</Text>
          <Text style={styles.streakReset}>Resets in {hours}h {minutes}m</Text>
        </Panel>

        {dailyQuests.length === 0 ? (
          <Text style={styles.empty}>No quests yet — check back tomorrow.</Text>
        ) : dailyQuests.map((q) => {
          const ap = dailyQuestProgress[q.id] ?? { progress: 0, claimed: false };
          const pct = Math.min(1, ap.progress / q.goal);
          const ready = ap.progress >= q.goal && !ap.claimed;
          return (
            <Panel key={q.id} style={[styles.card, ap.claimed && { opacity: 0.5 }]} glow={ready ? palette.green : undefined}>
              <View style={styles.cardRow}>
                <Text style={styles.icon}>{q.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{q.name}</Text>
                  <Text style={styles.desc}>{q.description}</Text>
                  <Bar pct={pct} colors={gradients.banner} height={8} style={{ marginTop: 6 }} />
                  <Text style={styles.progressText}>{Math.min(ap.progress, q.goal)} / {q.goal}</Text>
                  <Text style={styles.reward}>
                    {q.reward.gold ? `🪙 ${q.reward.gold}` : ''}{q.reward.gems ? `   💎 ${q.reward.gems}` : ''}
                  </Text>
                </View>
                <GButton small disabled={!ready} variant={ready ? 'green' : 'purple'}
                  label={ap.claimed ? '✓' : ready ? 'CLAIM' : '—'} onPress={() => claimDailyQuest(q.id)} />
              </View>
            </Panel>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  streakLabel: { color: palette.textMute, fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  streakValue: { color: palette.gold, fontSize: 26, fontWeight: '900', marginVertical: 4 },
  streakReset: { color: palette.textDim, fontSize: 11 },
  empty: { color: palette.textDim, textAlign: 'center', padding: 30 },
  card: { marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 30 },
  name: { color: palette.text, fontWeight: '800', fontSize: 14 },
  desc: { color: palette.textMute, fontSize: 11, marginTop: 2 },
  progressText: { color: palette.textDim, fontSize: 10, marginTop: 3 },
  reward: { color: palette.gold, fontSize: 11, marginTop: 3, fontWeight: '700' },
});

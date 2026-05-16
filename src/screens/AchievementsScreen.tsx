import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { ACHIEVEMENTS } from '../data/achievements';
import { Screen, TopBar, Panel, GButton, Bar, CurrencyBar, palette, spacing } from '../components/ui';

export default function AchievementsScreen() {
  const { setScreen, achievements, claimAchievement, gold, gems } = useGameStore();
  return (
    <Screen>
      <TopBar title="AWARDS" onBack={() => setScreen('home')} right={<CurrencyBar gold={gold} gems={gems} />} />
      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        {ACHIEVEMENTS.map((a) => {
          const ap = achievements[a.id] ?? { progress: 0, claimed: false };
          const pct = Math.min(1, ap.progress / a.goal);
          const ready = ap.progress >= a.goal && !ap.claimed;
          return (
            <Panel key={a.id} style={[styles.card, ap.claimed && { opacity: 0.5 }]} glow={ready ? palette.green : undefined}>
              <View style={styles.row}>
                <Text style={styles.icon}>{a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{a.name}</Text>
                  <Text style={styles.desc}>{a.description}</Text>
                  <Bar pct={pct} colors={['#c07bff', '#7a3fd0']} height={8} style={{ marginTop: 6 }} />
                  <Text style={styles.progressText}>{Math.min(ap.progress, a.goal)} / {a.goal}</Text>
                  <Text style={styles.reward}>
                    {a.reward.gold ? `🪙 ${a.reward.gold}` : ''}{a.reward.gems ? ` 💎 ${a.reward.gems}` : ''}{a.reward.itemId ? ' 🎁 item' : ''}
                  </Text>
                </View>
                <GButton small disabled={!ready} variant={ready ? 'green' : 'purple'}
                  label={ap.claimed ? '✓' : ready ? 'CLAIM' : '—'} onPress={() => claimAchievement(a.id)} />
              </View>
            </Panel>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 32 },
  name: { color: palette.text, fontWeight: '800', fontSize: 14 },
  desc: { color: palette.textMute, fontSize: 11, marginTop: 2 },
  progressText: { color: palette.textDim, fontSize: 10, marginTop: 2 },
  reward: { color: palette.gold, fontSize: 11, marginTop: 3, fontWeight: '700' },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGameStore, ChestReward } from '../store/gameStore';
import { ACHIEVEMENTS } from '../data/achievements';
import { CHEST_THEMES, ChestKind } from '../data/chests';
import ChestOpening from '../components/ChestOpening';
import { Screen, TopBar, Panel, GButton, Bar, CurrencyBar, palette, spacing } from '../components/ui';

// Pick a chest theme that scales with the reward's value, so claiming a
// big achievement shows a fancier chest than a tiny one.
function chestKindForReward(r: { gold?: number; gems?: number; itemId?: string }): ChestKind {
  const score = (r.gold ?? 0) + (r.gems ?? 0) * 30 + (r.itemId ? 500 : 0);
  if (score >= 3000) return 'mythic';
  if (score >= 1200) return 'gold';
  if (score >= 400) return 'silver';
  return 'wooden';
}

export default function AchievementsScreen() {
  const { setScreen, achievements, claimAchievement, gold, gems, heroes, equipment } = useGameStore();
  const [reveal, setReveal] = useState<{ kind: ChestKind; reward: ChestReward; id: number } | null>(null);

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
                    🎁 {a.reward.gold ? `🪙 ${a.reward.gold}` : ''}{a.reward.gems ? ` 💎 ${a.reward.gems}` : ''}{a.reward.itemId ? ' item' : ''}
                  </Text>
                </View>
                <GButton small disabled={!ready} variant={ready ? 'green' : 'purple'}
                  label={ap.claimed ? '✓' : ready ? 'CLAIM' : '—'}
                  onPress={() => {
                    const r = claimAchievement(a.id);
                    if (r) setReveal({ kind: chestKindForReward(a.reward), reward: r, id: Date.now() });
                  }} />
              </View>
            </Panel>
          );
        })}
      </ScrollView>
      {reveal && (
        <ChestOpening
          key={reveal.id}
          theme={CHEST_THEMES[reveal.kind]}
          reward={reveal.reward}
          heroes={heroes}
          equipment={equipment}
          onClose={() => setReveal(null)}
        />
      )}
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

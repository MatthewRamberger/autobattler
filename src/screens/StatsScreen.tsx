import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGameStore, getHeroEffectiveStats } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { Screen, TopBar, Panel, SectionTitle, palette, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

export default function StatsScreen() {
  const store = useGameStore();
  const {
    setScreen, totalBattles, totalVictories, totalDamageDealt, totalKills,
    arenaBestWave, heroes, levelProgress, gold, gems, loginStreak,
  } = store;

  const winRate = totalBattles > 0 ? Math.round((totalVictories / totalBattles) * 100) : 0;
  const unlockedCount = Object.values(heroes).filter((h) => h.unlocked).length;
  const totalHeroTiers = Object.values(heroes).reduce((s, h) => s + h.level, 0);
  const maxTierHeroes = Object.values(heroes).filter((h) => h.level >= 5).length;
  const clearedCount = Object.values(levelProgress).filter((p) => p.completed).length;
  const strongest = Object.values(heroes)
    .filter((h) => h.unlocked)
    .map((h) => ({ hero: h, stats: getHeroEffectiveStats(h.id, store) }))
    .filter((x) => x.stats)
    .sort((a, b) => (b.stats!.power ?? 0) - (a.stats!.power ?? 0))
    .slice(0, 5);

  return (
    <Screen>
      <TopBar title="STATS" onBack={() => setScreen('home')} />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <Panel style={styles.section}>
          <SectionTitle>ECONOMY</SectionTitle>
          <Row k="🪙 Gold" v={gold} />
          <Row k="💎 Gems" v={gems} />
          <Row k="🔥 Login streak" v={`${loginStreak}d`} last />
        </Panel>
        <Panel style={styles.section}>
          <SectionTitle>COMBAT</SectionTitle>
          <Row k="⚔️ Battles" v={totalBattles} />
          <Row k="🏆 Victories" v={`${totalVictories} (${winRate}%)`} />
          <Row k="💥 Damage dealt" v={totalDamageDealt.toLocaleString()} />
          <Row k="☠️ Kills" v={totalKills.toLocaleString()} />
          <Row k="🏟️ Arena best" v={arenaBestWave} last />
        </Panel>
        <Panel style={styles.section}>
          <SectionTitle>ROSTER</SectionTitle>
          <Row k="🦸 Heroes" v={`${unlockedCount} / ${Object.keys(heroes).length}`} />
          <Row k="🃏 Total tiers" v={totalHeroTiers} />
          <Row k="⭐ Tier 5 heroes" v={maxTierHeroes} />
          <Row k="🗺️ Levels cleared" v={`${clearedCount} / ${LEVELS.length}`} last />
        </Panel>
        <Panel>
          <SectionTitle>TOP 5 HEROES</SectionTitle>
          {strongest.length === 0 ? (
            <Text style={{ color: palette.textDim, textAlign: 'center', padding: 8 }}>No heroes unlocked yet.</Text>
          ) : strongest.map(({ hero, stats }, idx) => {
            const grad = rarityGradient[hero.rarity] ?? rarityGradient.common;
            return (
              <View key={hero.id} style={styles.heroRow}>
                <Text style={styles.rank}>#{idx + 1}</Text>
                <Text style={styles.heroIcon}>{hero.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroName, { color: grad[0] }]}>
                    {hero.name} {hero.level > 1 && '★'.repeat(hero.level - 1)}
                  </Text>
                  <Text style={styles.heroMeta}>{hero.heroClass} · T{hero.level}</Text>
                </View>
                <Text style={styles.power}>⚡{stats!.power}</Text>
              </View>
            );
          })}
        </Panel>
      </ScrollView>
    </Screen>
  );
}

function Row({ k, v, last }: { k: string; v: string | number; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowKey}>{k}</Text>
      <Text style={styles.rowVal}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#ffffff12' },
  rowKey: { color: palette.textMute, fontSize: 12, fontWeight: '600' },
  rowVal: { color: palette.text, fontSize: 12, fontWeight: '800' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  rank: { color: palette.gold, fontSize: 13, fontWeight: '900', width: 28 },
  heroIcon: { fontSize: 22 },
  heroName: { fontSize: 13, fontWeight: '800' },
  heroMeta: { color: palette.textMute, fontSize: 10, marginTop: 1 },
  power: { color: palette.gold, fontWeight: '900', fontSize: 13 },
});

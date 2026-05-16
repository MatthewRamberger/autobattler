import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useGameStore, getHeroEffectiveStats } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { RARITY_COLORS } from '../data/equipment';

export default function StatsScreen() {
  const store = useGameStore();
  const {
    setScreen, totalBattles, totalVictories, totalDamageDealt, totalKills,
    arenaBestWave, heroes, levelProgress, gold, gems, loginStreak,
  } = store;

  const winRate = totalBattles > 0 ? Math.round((totalVictories / totalBattles) * 100) : 0;
  const unlockedCount = Object.values(heroes).filter((h) => h.unlocked).length;
  const totalHeroLevels = Object.values(heroes).reduce((s, h) => s + h.level, 0);
  const totalStars = Object.values(heroes).reduce((s, h) => s + h.stars, 0);
  const clearedCount = Object.values(levelProgress).filter((p) => p.completed).length;

  // Strongest 5 heroes by power
  const strongest = Object.values(heroes)
    .filter((h) => h.unlocked)
    .map((h) => ({ hero: h, stats: getHeroEffectiveStats(h.id, store) }))
    .filter((x) => x.stats)
    .sort((a, b) => (b.stats!.power ?? 0) - (a.stats!.power ?? 0))
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>STATS</Text>
        <View />
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
        <Section title="ECONOMY">
          <Row label="Gold" value={gold} icon="💰" />
          <Row label="Gems" value={gems} icon="💎" />
          <Row label="Login streak" value={`${loginStreak} day${loginStreak === 1 ? '' : 's'}`} icon="🔥" />
        </Section>

        <Section title="COMBAT">
          <Row label="Total battles" value={totalBattles} icon="⚔️" />
          <Row label="Victories" value={`${totalVictories} (${winRate}%)`} icon="🏆" />
          <Row label="Total damage dealt" value={totalDamageDealt.toLocaleString()} icon="💥" />
          <Row label="Total kills" value={totalKills.toLocaleString()} icon="☠️" />
          <Row label="Arena best wave" value={arenaBestWave} icon="🏟️" />
        </Section>

        <Section title="ROSTER">
          <Row label="Heroes unlocked" value={`${unlockedCount} / ${Object.keys(heroes).length}`} icon="🦸" />
          <Row label="Total levels" value={totalHeroLevels} icon="⬆️" />
          <Row label="Total ascension stars" value={totalStars} icon="⭐" />
        </Section>

        <Section title="CAMPAIGN">
          <Row label="Levels cleared" value={`${clearedCount} / ${LEVELS.length}`} icon="🗺️" />
        </Section>

        <Section title="TOP 5 HEROES">
          {strongest.length === 0 ? (
            <Text style={{ color: '#555', textAlign: 'center', padding: 8 }}>No heroes unlocked yet.</Text>
          ) : strongest.map(({ hero, stats }, idx) => (
            <View key={hero.id} style={styles.heroRow}>
              <Text style={styles.heroRank}>#{idx + 1}</Text>
              <Text style={styles.heroIcon}>{hero.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroName, { color: RARITY_COLORS[hero.rarity] }]}>
                  {hero.name} {hero.stars > 0 && '★'.repeat(hero.stars)}
                </Text>
                <Text style={styles.heroMeta}>
                  {hero.heroClass} · Lv.{hero.level}
                </Text>
              </View>
              <Text style={styles.power}>⚡{stats!.power}</Text>
            </View>
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, icon }: { label: string; value: string | number; icon?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowKey}>{icon && `${icon} `}{label}</Text>
      <Text style={styles.rowVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 13 },
  title: { color: '#7c83fd', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  section: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 12, marginBottom: 10 },
  sectionTitle: { color: '#555', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowKey: { color: '#888', fontSize: 12 },
  rowVal: { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  heroRank: { color: '#666', fontSize: 13, fontWeight: '800', width: 28 },
  heroIcon: { fontSize: 22 },
  heroName: { fontSize: 13, fontWeight: '700' },
  heroMeta: { color: '#666', fontSize: 10, marginTop: 1 },
  power: { color: '#f1c40f', fontWeight: '700', fontSize: 13 },
});

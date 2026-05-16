import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import {
  Screen, CurrencyBar, Banner, Panel, Plate, palette, gradients, radius, spacing, shadow,
} from '../components/ui';

const TILES: Array<{
  screen: string; icon: string; label: string; sub: (c: any) => string;
  colors: readonly [string, string]; badge?: (c: any) => number;
}> = [
  { screen: 'levels', icon: '⚔️', label: 'CAMPAIGN', sub: (c) => `${c.completedLevels}/${LEVELS.length} cleared · boss fights`, colors: ['#ff8f5a', '#d8542a'] },
  { screen: 'arena', icon: '🏟️', label: 'ARENA', sub: (c) => `Endless gauntlet · best wave ${c.arenaBestWave}`, colors: ['#ff6aa8', '#c0246b'] },
  { screen: 'collection', icon: '🦸', label: 'HEROES', sub: (c) => `${c.unlockedCount}/${c.totalHeroes} unlocked`, colors: ['#54b8ff', '#1f6fd6'] },
  { screen: 'equipment', icon: '🎒', label: 'EQUIPMENT', sub: () => 'Weapons · armor · trinkets', colors: ['#5ed36a', '#2c9c3a'] },
  { screen: 'forge', icon: '🔨', label: 'FORGE', sub: () => 'Upgrade gear with shards', colors: ['#ffb74d', '#e0791a'] },
  { screen: 'shop', icon: '🏪', label: 'SHOP', sub: () => 'Spend gold & gems', colors: ['#ffd24a', '#e0a016'] },
  { screen: 'chests', icon: '📦', label: 'CHESTS', sub: () => '4 tiers of loot', colors: ['#c07bff', '#7a3fd0'] },
  { screen: 'summon', icon: '🔮', label: 'SUMMON', sub: () => 'Pull heroes with gems', colors: ['#b89bff', '#6a3fd0'] },
  { screen: 'stronghold', icon: '🏰', label: 'STRONGHOLD', sub: () => 'Permanent base upgrades', colors: ['#f6c945', '#d29a1c'] },
  { screen: 'codex', icon: '📖', label: 'CODEX', sub: () => 'Heroes · classes · abilities', colors: ['#16d0b5', '#0e8a78'] },
  { screen: 'daily', icon: '📅', label: 'DAILY', sub: (c) => `Streak 🔥 ${c.loginStreak}`, colors: ['#ff8f5a', '#d8542a'], badge: (c) => c.claimableQuests },
  { screen: 'achievements', icon: '🏆', label: 'AWARDS', sub: () => 'Claim milestones', colors: ['#c07bff', '#7a3fd0'], badge: (c) => c.claimableAchievements },
  { screen: 'stats', icon: '📊', label: 'STATS', sub: () => 'Lifetime progress', colors: ['#54b8ff', '#1f6fd6'] },
  { screen: 'settings', icon: '⚙️', label: 'SETTINGS', sub: () => 'Speed · particles · motion', colors: ['#9aa0ad', '#6c7280'] },
];

export default function HomeScreen() {
  const {
    setScreen, gold, gems, heroes, levelProgress, arenaBestWave,
    totalVictories, totalBattles, totalDamageDealt, totalKills, reset,
    dailyQuests, dailyQuestProgress, achievements, loginStreak,
  } = useGameStore();

  const unlockedCount = Object.values(heroes).filter((h) => h.unlocked).length;
  const totalHeroes = Object.keys(heroes).length;
  const completedLevels = Object.values(levelProgress).filter((p) => p.completed).length;
  const winRate = totalBattles > 0 ? Math.round((totalVictories / totalBattles) * 100) : 0;
  const claimableQuests = dailyQuests.filter((q) => {
    const ap = dailyQuestProgress[q.id];
    return ap && ap.progress >= q.goal && !ap.claimed;
  }).length;
  const claimableAchievements = Object.entries(achievements).filter(([, ap]) => !ap.claimed && ap.progress > 0).length;
  const ctx = { completedLevels, arenaBestWave, unlockedCount, totalHeroes, loginStreak, claimableQuests, claimableAchievements };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <Banner title="⚔️  AUTOBATTLER" size={20} />
        <View style={{ flex: 1 }} />
      </View>
      <View style={styles.currencyWrap}>
        <CurrencyBar gold={gold} gems={gems} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {TILES.map((t) => {
            const badge = t.badge ? t.badge(ctx) : 0;
            return (
              <TouchableOpacity key={t.screen} style={styles.tile} activeOpacity={0.85} onPress={() => setScreen(t.screen)}>
                <LinearGradient colors={t.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tileGrad}>
                  <View style={styles.tileGloss} pointerEvents="none" />
                  <View style={styles.tileIconWrap}>
                    <Text style={styles.tileIcon}>{t.icon}</Text>
                  </View>
                  <Text style={styles.tileLabel}>{t.label}</Text>
                  <Text style={styles.tileSub} numberOfLines={2}>{t.sub(ctx)}</Text>
                  {badge > 0 && (
                    <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        <Panel style={{ marginTop: spacing.lg }}>
          <Text style={styles.statsTitle}>📜 LIFETIME RECORD</Text>
          <StatRow k="Battles fought" v={`${totalBattles}`} />
          <StatRow k="Victories" v={`${totalVictories}  (${winRate}%)`} />
          <StatRow k="Damage dealt" v={`${totalDamageDealt}`} />
          <StatRow k="Total kills" v={`${totalKills}`} />
          <StatRow k="Arena best" v={`Wave ${arenaBestWave}`} last />
        </Panel>

        <TouchableOpacity
          style={styles.reset}
          onPress={() => Alert.alert('Reset save?', 'This wipes all progress.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Wipe', style: 'destructive', onPress: reset },
          ])}
        >
          <Text style={styles.resetText}>Reset progress</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

function StatRow({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <View style={[styles.statRow, !last && styles.statRowBorder]}>
      <Text style={styles.statKey}>{k}</Text>
      <Text style={styles.statVal}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 26, paddingHorizontal: 16 },
  currencyWrap: { alignItems: 'center', paddingVertical: 12 },
  scroll: { padding: spacing.md, paddingBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  tile: {
    width: '31.5%', borderRadius: radius.lg, borderWidth: 2, borderColor: '#ffffff44',
    overflow: 'hidden', ...shadow.card,
  },
  tileGrad: { padding: 10, alignItems: 'center', minHeight: 104, justifyContent: 'center' },
  tileGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '42%', backgroundColor: '#ffffff2e' },
  tileIconWrap: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#00000033',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6, borderWidth: 1, borderColor: '#ffffff55',
  },
  tileIcon: { fontSize: 24 },
  tileLabel: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.5, textShadowColor: '#0007', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  tileSub: { color: '#ffffffcc', fontSize: 8.5, textAlign: 'center', marginTop: 2, fontWeight: '600' },
  badge: {
    position: 'absolute', top: 6, right: 6, backgroundColor: palette.red, borderRadius: 11,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
    borderWidth: 2, borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  statsTitle: { color: palette.gold, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  statRowBorder: { borderBottomWidth: 1, borderBottomColor: '#ffffff14' },
  statKey: { color: palette.textMute, fontSize: 12, fontWeight: '600' },
  statVal: { color: palette.text, fontSize: 12, fontWeight: '800' },
  reset: { padding: 16, alignItems: 'center', marginTop: 8 },
  resetText: { color: palette.textDim, fontSize: 11 },
});

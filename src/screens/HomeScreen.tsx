import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';

export default function HomeScreen() {
  const {
    setScreen, gold, gems, heroes, levelProgress, arenaBestWave,
    totalVictories, totalBattles, totalDamageDealt, totalKills, reset,
  } = useGameStore();
  const unlockedCount = Object.values(heroes).filter((h) => h.unlocked).length;
  const completedLevels = Object.values(levelProgress).filter((p) => p.completed).length;
  const winRate = totalBattles > 0 ? Math.round((totalVictories / totalBattles) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚔️ AUTOBATTLER</Text>
        <Text style={styles.subtitle}>Assemble. Place. Conquer.</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>💰 {gold}</Text>
          <Text style={styles.statLabel}>Gold</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#bb8fce' }]}>💎 {gems}</Text>
          <Text style={styles.statLabel}>Gems</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🦸 {unlockedCount}</Text>
          <Text style={styles.statLabel}>Heroes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>✅ {completedLevels}/{LEVELS.length}</Text>
          <Text style={styles.statLabel}>Cleared</Text>
        </View>
      </View>

      <ScrollView style={styles.menu} contentContainerStyle={{ paddingBottom: 18 }}>
        <MenuButton icon="⚔️" label="CAMPAIGN" sub="Story battles & boss fights" onPress={() => setScreen('levels')} color="#c0392b" />
        <MenuButton icon="🏟️" label="ARENA" sub={`Endless gauntlet · Best wave ${arenaBestWave}`} onPress={() => setScreen('arena')} color="#e84393" />
        <MenuButton icon="🦸" label="HEROES" sub={`${unlockedCount}/${Object.keys(heroes).length} unlocked · level up & ascend`} onPress={() => setScreen('collection')} color="#2980b9" />
        <MenuButton icon="🎒" label="EQUIPMENT" sub="Weapons, armor, accessories" onPress={() => setScreen('equipment')} color="#27ae60" />
        <MenuButton icon="🔨" label="FORGE" sub="Upgrade gear with shards" onPress={() => setScreen('forge')} color="#e67e22" />
        <MenuButton icon="🏪" label="SHOP" sub="Buy gear with gold or gems" onPress={() => setScreen('shop')} color="#f1c40f" />
        <MenuButton icon="🏆" label="ACHIEVEMENTS" sub="Claim milestone rewards" onPress={() => setScreen('achievements')} color="#bb8fce" />

        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>LIFETIME STATS</Text>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>Battles</Text>
            <Text style={styles.statVal}>{totalBattles}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>Victories</Text>
            <Text style={styles.statVal}>{totalVictories} ({winRate}%)</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>Damage dealt</Text>
            <Text style={styles.statVal}>{totalDamageDealt}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>Total kills</Text>
            <Text style={styles.statVal}>{totalKills}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>Arena best</Text>
            <Text style={styles.statVal}>Wave {arenaBestWave}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            Alert.alert('Reset save?', 'This will wipe all progress.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Wipe', style: 'destructive', onPress: reset },
            ]);
          }}
        >
          <Text style={styles.resetText}>Reset progress</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuButton({ icon, label, sub, onPress, color }: {
  icon: string; label: string; sub: string; onPress: () => void; color: string;
}) {
  return (
    <TouchableOpacity style={[styles.menuBtn, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, { color }]}>{label}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { alignItems: 'center', paddingTop: 30, paddingBottom: 14 },
  title: { fontSize: 30, fontWeight: '900', color: '#f1c40f', letterSpacing: 3 },
  subtitle: { color: '#888', fontSize: 12, marginTop: 4, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: '#1e1e2e', borderRadius: 10, padding: 10, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statLabel: { color: '#666', fontSize: 10, marginTop: 2 },
  menu: { flex: 1, paddingHorizontal: 12 },
  menuBtn: {
    backgroundColor: '#1e1e2e', borderRadius: 12, borderLeftWidth: 4,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10,
  },
  menuIcon: { fontSize: 26 },
  menuLabel: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  menuSub: { color: '#666', fontSize: 11, marginTop: 2 },
  menuArrow: { color: '#444', fontSize: 22 },
  statsCard: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14, marginTop: 6 },
  statsCardTitle: { color: '#555', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  statKey: { color: '#777', fontSize: 12 },
  statVal: { color: '#ddd', fontSize: 12, fontWeight: '600' },
  resetBtn: { padding: 14, alignItems: 'center', marginTop: 10 },
  resetText: { color: '#444', fontSize: 11 },
});

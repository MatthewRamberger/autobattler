import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function HomeScreen() {
  const { setScreen, gold, heroes, levelProgress } = useGameStore();
  const unlockedCount = Object.values(heroes).filter((h) => h.unlocked).length;
  const completedLevels = Object.values(levelProgress).filter((p) => p.completed).length;

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
          <Text style={styles.statValue}>🦸 {unlockedCount}</Text>
          <Text style={styles.statLabel}>Heroes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>✅ {completedLevels}</Text>
          <Text style={styles.statLabel}>Cleared</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <MenuButton icon="⚔️" label="BATTLE" sub="Choose a level and fight" onPress={() => setScreen('levels')} color="#c0392b" />
        <MenuButton icon="🦸" label="COLLECTION" sub="Manage your heroes" onPress={() => setScreen('collection')} color="#2980b9" />
        <MenuButton icon="🎒" label="EQUIPMENT" sub="Weapons and armor" onPress={() => setScreen('equipment')} color="#27ae60" />
      </View>

      <Text style={styles.tip}>Tip: Place heroes on the left half of the grid before battle!</Text>
    </SafeAreaView>
  );
}

function MenuButton({ icon, label, sub, onPress, color }: {
  icon: string; label: string; sub: string; onPress: () => void; color: string;
}) {
  return (
    <TouchableOpacity style={[styles.menuBtn, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View>
        <Text style={[styles.menuLabel, { color }]}>{label}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 24 },
  title: { fontSize: 36, fontWeight: '900', color: '#f1c40f', letterSpacing: 3 },
  subtitle: { color: '#888', fontSize: 14, marginTop: 4, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 32, paddingHorizontal: 20 },
  statBox: { flex: 1, backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#666', fontSize: 11, marginTop: 4 },
  menu: { paddingHorizontal: 20, gap: 12 },
  menuBtn: {
    backgroundColor: '#1e1e2e',
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIcon: { fontSize: 30 },
  menuLabel: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  menuSub: { color: '#666', fontSize: 12, marginTop: 2 },
  tip: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 32, paddingHorizontal: 40 },
});

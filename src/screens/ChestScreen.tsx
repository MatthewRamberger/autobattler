import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Animated, Easing, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { RARITY_COLORS } from '../data/equipment';

const CHESTS = [
  { id: 'wooden' as const, name: 'Wooden Chest', icon: '🟫', cost: { gold: 200 }, desc: '2 items · mostly common, slim epic chance.', color: '#a0826d' },
  { id: 'silver' as const, name: 'Silver Chest', icon: '⚪', cost: { gold: 800 }, desc: '3 items · rares guaranteed.', color: '#bdc3c7' },
  { id: 'gold' as const, name: 'Golden Chest', icon: '🟨', cost: { gems: 30 }, desc: '4 items · legendary 25%, mythic 5%.', color: '#f1c40f' },
  { id: 'mythic' as const, name: 'Mythic Chest', icon: '🟪', cost: { gems: 100 }, desc: '5 items · legendary 50%, mythic 20%.', color: '#e84393' },
];

export default function ChestScreen() {
  const { setScreen, gold, gems, openMysteryChest, equipment } = useGameStore();
  const [opening, setOpening] = useState<string | null>(null);
  const [results, setResults] = useState<{ items: { id: string; qty: number }[]; gold: number; gems: number } | null>(null);
  const shake = useRef(new Animated.Value(0)).current;

  async function handleOpen(chest: typeof CHESTS[number]) {
    if (chest.cost.gold && gold < chest.cost.gold) {
      Alert.alert('Not enough gold', `Costs ${chest.cost.gold} gold.`);
      return;
    }
    if (chest.cost.gems && gems < chest.cost.gems) {
      Alert.alert('Not enough gems', `Costs ${chest.cost.gems} gems.`);
      return;
    }
    setOpening(chest.id);
    setResults(null);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 80, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shake, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
    const r = await openMysteryChest(chest.id);
    setResults(r);
    setOpening(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>MYSTERY CHESTS</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.gold}>💰 {gold}</Text>
          <Text style={[styles.gold, { color: '#bb8fce' }]}>💎 {gems}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 10 }}>
        {CHESTS.map((c) => (
          <Animated.View
            key={c.id}
            style={{
              transform: opening === c.id
                ? [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }]
                : [],
            }}
          >
            <View style={[styles.chestCard, { borderColor: c.color + '88' }]}>
              <Text style={styles.chestIcon}>{c.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.chestName, { color: c.color }]}>{c.name}</Text>
                <Text style={styles.chestDesc}>{c.desc}</Text>
                <Text style={styles.chestCost}>
                  Cost: {c.cost.gold ? `💰 ${c.cost.gold}` : ''}{c.cost.gems ? `💎 ${c.cost.gems}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.openBtn, { backgroundColor: c.color + '33', borderColor: c.color }]}
                disabled={opening === c.id}
                onPress={() => handleOpen(c)}
              >
                <Text style={[styles.openText, { color: c.color }]}>
                  {opening === c.id ? '...' : 'OPEN'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}

        {results && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>YOU GOT</Text>
            <Text style={styles.resultLine}>💰 +{results.gold} gold</Text>
            {results.gems > 0 && <Text style={styles.resultLine}>💎 +{results.gems} gems</Text>}
            {results.items.map((it, i) => {
              const eq = equipment[it.id];
              if (!eq) return null;
              const rc = RARITY_COLORS[eq.rarity];
              return (
                <View key={i} style={[styles.itemRow, { borderColor: rc + '88' }]}>
                  <Text style={styles.itemIcon}>{eq.icon}</Text>
                  <Text style={[styles.itemName, { color: rc }]}>
                    {eq.name} ×{it.qty}
                  </Text>
                  <Text style={styles.itemRarity}>{eq.rarity}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 13 },
  title: { color: '#e84393', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  gold: { color: '#f1c40f', fontWeight: '700', fontSize: 13 },
  chestCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    backgroundColor: '#1e1e2e', borderRadius: 14, borderWidth: 2, padding: 12,
  },
  chestIcon: { fontSize: 36 },
  chestName: { fontSize: 15, fontWeight: '800' },
  chestDesc: { color: '#888', fontSize: 11, marginTop: 3 },
  chestCost: { color: '#f1c40f', fontSize: 11, marginTop: 4 },
  openBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 2 },
  openText: { fontWeight: '900', fontSize: 13 },
  resultBox: { backgroundColor: '#1e1e2e', borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 2, borderColor: '#f1c40f' },
  resultTitle: { color: '#f1c40f', fontSize: 12, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 8 },
  resultLine: { color: '#fff', fontSize: 14, textAlign: 'center', marginVertical: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, borderWidth: 1, marginTop: 4 },
  itemIcon: { fontSize: 22 },
  itemName: { flex: 1, fontSize: 13, fontWeight: '700' },
  itemRarity: { color: '#888', fontSize: 10 },
});

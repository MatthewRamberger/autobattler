import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { Screen, TopBar, Panel, GButton, Plate, CurrencyBar, palette, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

const CHESTS = [
  { id: 'wooden' as const, name: 'Wooden Chest', icon: '📦', cost: { gold: 200 }, desc: '2 items · mostly common.', variant: 'gold' as const },
  { id: 'silver' as const, name: 'Silver Chest', icon: '🎁', cost: { gold: 800 }, desc: '3 items · rares guaranteed.', variant: 'blue' as const },
  { id: 'gold' as const, name: 'Golden Chest', icon: '🏆', cost: { gems: 30 }, desc: '4 items · legendary 25%.', variant: 'gold' as const },
  { id: 'mythic' as const, name: 'Mythic Chest', icon: '💠', cost: { gems: 100 }, desc: '5 items · mythic 20%.', variant: 'purple' as const },
];

export default function ChestScreen() {
  const { setScreen, gold, gems, openMysteryChest, equipment } = useGameStore();
  const [opening, setOpening] = useState<string | null>(null);
  const [results, setResults] = useState<{ items: { id: string; qty: number }[]; gold: number; gems: number } | null>(null);
  const shake = useRef(new Animated.Value(0)).current;

  async function handleOpen(chest: typeof CHESTS[number]) {
    if (chest.cost.gold && gold < chest.cost.gold) { Alert.alert('Not enough gold'); return; }
    if (chest.cost.gems && gems < chest.cost.gems) { Alert.alert('Not enough gems'); return; }
    setOpening(chest.id);
    setResults(null);
    Animated.sequence(
      [1, -1, 1, -1, 1, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 80, useNativeDriver: true, easing: Easing.linear }))
    ).start();
    const r = await openMysteryChest(chest.id);
    setResults(r);
    setOpening(null);
  }

  return (
    <Screen>
      <TopBar title="CHESTS" onBack={() => setScreen('home')} right={<CurrencyBar gold={gold} gems={gems} />} />
      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        {CHESTS.map((c) => (
          <Animated.View key={c.id} style={{
            transform: opening === c.id ? [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] }) }] : [],
          }}>
            <Panel style={{ marginBottom: spacing.md }}>
              <View style={styles.row}>
                <Text style={styles.chestIcon}>{c.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chestName}>{c.name}</Text>
                  <Text style={styles.chestDesc}>{c.desc}</Text>
                  <Text style={styles.cost}>Cost: {c.cost.gold ? `🪙 ${c.cost.gold}` : ''}{c.cost.gems ? `💎 ${c.cost.gems}` : ''}</Text>
                </View>
                <GButton small variant={c.variant} disabled={opening === c.id}
                  label={opening === c.id ? '…' : 'OPEN'} onPress={() => handleOpen(c)} />
              </View>
            </Panel>
          </Animated.View>
        ))}

        {results && (
          <Panel glow={palette.gold}>
            <Text style={styles.resultTitle}>✦ YOU GOT ✦</Text>
            <Text style={styles.resultLine}>🪙 +{results.gold} gold</Text>
            {results.gems > 0 && <Text style={styles.resultLine}>💎 +{results.gems} gems</Text>}
            {results.items.map((it, i) => {
              const eq = equipment[it.id];
              if (!eq) return null;
              const g = rarityGradient[eq.rarity] ?? rarityGradient.common;
              return (
                <Plate key={i} style={styles.itemRow}>
                  <Text style={styles.itemIcon}>{eq.icon}</Text>
                  <Text style={[styles.itemName, { color: g[0] }]}>{eq.name} ×{it.qty}</Text>
                  <Text style={styles.itemRarity}>{eq.rarity}</Text>
                </Plate>
              );
            })}
          </Panel>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chestIcon: { fontSize: 38 },
  chestName: { fontSize: 15, fontWeight: '900', color: palette.text },
  chestDesc: { color: palette.textMute, fontSize: 11, marginTop: 3 },
  cost: { color: palette.gold, fontSize: 11, marginTop: 4, fontWeight: '700' },
  resultTitle: { color: palette.gold, fontSize: 12, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 8 },
  resultLine: { color: palette.text, fontSize: 14, textAlign: 'center', marginVertical: 2, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  itemIcon: { fontSize: 22 },
  itemName: { flex: 1, fontSize: 13, fontWeight: '800' },
  itemRarity: { color: palette.textMute, fontSize: 10, fontWeight: '700' },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore, ChestReward } from '../store/gameStore';
import { Screen, TopBar, Panel, GButton, CurrencyBar, palette, spacing } from '../components/ui';
import ChestOpening, { ChestTheme } from '../components/ChestOpening';

interface ChestDef extends ChestTheme {
  icon: string;
  desc: string;
  cost: { gold?: number; gems?: number };
  variant: 'gold' | 'blue' | 'purple';
}

const CHESTS: ChestDef[] = [
  {
    id: 'wooden', name: 'Wooden Chest', icon: '📦',
    desc: '2 items · 1 hero card · mostly common.',
    cost: { gold: 200 }, variant: 'gold',
    wood: ['#b07a44', '#7a4a22', '#3e2410'], metal: '#8a7450', glow: '#d0a868',
  },
  {
    id: 'silver', name: 'Silver Chest', icon: '🎁',
    desc: '3 items · 2 hero cards · rares guaranteed.',
    cost: { gold: 800 }, variant: 'blue',
    wood: ['#aab6c6', '#6e7c8c', '#3a4452'], metal: '#d2dce8', glow: '#bcd4ee',
  },
  {
    id: 'gold', name: 'Golden Chest', icon: '🏆',
    desc: '4 items · 3 hero cards · legendary 25%.',
    cost: { gems: 30 }, variant: 'gold',
    wood: ['#f2cc66', '#cc9c2c', '#7a5810'], metal: '#ffe9a4', glow: '#ffd24a',
  },
  {
    id: 'mythic', name: 'Mythic Chest', icon: '💠',
    desc: '5 items · 4 hero cards · mythic 20%.',
    cost: { gems: 100 }, variant: 'purple',
    wood: ['#b483ea', '#7a3fd0', '#3a1c70'], metal: '#dcc0ff', glow: '#c79bff',
  },
];

export default function ChestScreen() {
  const { setScreen, gold, gems, openMysteryChest, equipment, heroes } = useGameStore();
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState<{ theme: ChestDef; reward: ChestReward; id: number } | null>(null);

  async function handleOpen(chest: ChestDef) {
    if (chest.cost.gold && gold < chest.cost.gold) { Alert.alert('Not enough gold'); return; }
    if (chest.cost.gems && gems < chest.cost.gems) { Alert.alert('Not enough gems'); return; }
    setBusy(true);
    const reward = await openMysteryChest(chest.id as any);
    setBusy(false);
    if (reward.items.length === 0 && reward.heroCards.length === 0) {
      Alert.alert('Could not open chest');
      return;
    }
    setOpening({ theme: chest, reward, id: Date.now() });
  }

  return (
    <Screen>
      <TopBar title="CHESTS" onBack={() => setScreen('home')} right={<CurrencyBar gold={gold} gems={gems} />} />
      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Crack chests for gear, gold and hero cards. Combine matching cards to rank up your heroes.
        </Text>
        {CHESTS.map((c) => {
          const affordable =
            (!c.cost.gold || gold >= c.cost.gold) && (!c.cost.gems || gems >= c.cost.gems);
          return (
            <Panel key={c.id} style={{ marginBottom: spacing.md }}>
              <View style={styles.row}>
                <View style={[styles.chestBadge, { shadowColor: c.glow }]}>
                  <LinearGradient colors={c.wood} style={styles.chestBadgeBg}>
                    <Text style={styles.chestIcon}>{c.icon}</Text>
                  </LinearGradient>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.chestName, { color: c.glow }]}>{c.name}</Text>
                  <Text style={styles.chestDesc}>{c.desc}</Text>
                  <Text style={styles.cost}>
                    {c.cost.gold ? `🪙 ${c.cost.gold}` : ''}{c.cost.gems ? `💎 ${c.cost.gems}` : ''}
                  </Text>
                </View>
                <GButton small variant={c.variant} disabled={busy || !affordable}
                  label={busy ? '…' : 'OPEN'} onPress={() => handleOpen(c)} />
              </View>
            </Panel>
          );
        })}
      </ScrollView>

      {opening && (
        <ChestOpening
          key={opening.id}
          theme={opening.theme}
          reward={opening.reward}
          heroes={heroes}
          equipment={equipment}
          onClose={() => setOpening(null)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { color: palette.textMute, fontSize: 11, lineHeight: 16, marginBottom: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chestBadge: {
    borderRadius: 14, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  chestBadgeBg: {
    width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#00000066',
  },
  chestIcon: { fontSize: 30 },
  chestName: { fontSize: 15, fontWeight: '900' },
  chestDesc: { color: palette.textMute, fontSize: 11, marginTop: 3 },
  cost: { color: palette.gold, fontSize: 12, marginTop: 4, fontWeight: '800' },
});

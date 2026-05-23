import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore, ChestReward } from '../store/gameStore';
import { CHEST_THEMES, CHEST_SHOP_COST, ChestKind, ChestTheme } from '../data/chests';
import { Screen, TopBar, Panel, GButton, CurrencyBar, palette, spacing } from '../components/ui';
import ChestOpening from '../components/ChestOpening';

interface ChestEntry {
  kind: ChestKind;
  theme: ChestTheme;
  desc: string;
}

const CHESTS: ChestEntry[] = [
  { kind: 'wooden', theme: CHEST_THEMES.wooden, desc: 'Cheap & cheerful — mostly common loot, gold most of the time.' },
  { kind: 'silver', theme: CHEST_THEMES.silver, desc: 'A bigger haul — rares are likely, gems sometimes.' },
  { kind: 'gold',   theme: CHEST_THEMES.gold,   desc: 'Premium tier — epics & legendaries become realistic.' },
  { kind: 'mythic', theme: CHEST_THEMES.mythic, desc: 'Top tier — mythics roll, gems and legendaries common.' },
];

export default function ChestScreen() {
  const { setScreen, gold, gems, openMysteryChest, equipment, heroes } = useGameStore();
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState<{ theme: ChestTheme; reward: ChestReward; id: number } | null>(null);

  async function handleBuy(entry: ChestEntry) {
    const cost = CHEST_SHOP_COST[entry.kind];
    if (cost.gold && gold < cost.gold) { Alert.alert('Not enough gold'); return; }
    if (cost.gems && gems < cost.gems) { Alert.alert('Not enough gems'); return; }
    setBusy(true);
    const reward = await openMysteryChest(entry.kind);
    setBusy(false);
    const empty = reward.items.length === 0 && reward.heroCards.length === 0 && reward.gold === 0 && reward.gems === 0;
    if (empty) {
      Alert.alert('Could not open chest');
      return;
    }
    setOpening({ theme: entry.theme, reward, id: Date.now() });
  }

  return (
    <Screen>
      <TopBar title="CHESTS" onBack={() => setScreen('home')} right={<CurrencyBar gold={gold} gems={gems} />} />
      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Crack chests for gold, gems, hero cards and gear. Nothing is guaranteed — but gold is in
          most. Rarer heroes are rarer.
        </Text>
        {CHESTS.map((c) => {
          const cost = CHEST_SHOP_COST[c.kind];
          const affordable =
            (!cost.gold || gold >= cost.gold) && (!cost.gems || gems >= cost.gems);
          return (
            <Panel key={c.kind} style={{ marginBottom: spacing.md }}>
              <View style={styles.row}>
                <View style={[styles.chestBadge, { shadowColor: c.theme.glow }]}>
                  <LinearGradient colors={c.theme.wood} style={styles.chestBadgeBg}>
                    <Text style={styles.chestIcon}>{c.theme.icon}</Text>
                  </LinearGradient>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.chestName, { color: c.theme.glow }]}>{c.theme.name}</Text>
                  <Text style={styles.chestDesc}>{c.desc}</Text>
                  <Text style={styles.cost}>
                    {cost.gold ? `🪙 ${cost.gold}` : ''}{cost.gems ? `💎 ${cost.gems}` : ''}
                  </Text>
                </View>
                <GButton small variant={c.theme.variant} disabled={busy || !affordable}
                  label={busy ? '…' : 'BUY'} onPress={() => handleBuy(c)} />
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

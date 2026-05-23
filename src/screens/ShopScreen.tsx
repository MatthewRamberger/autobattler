import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore, ChestReward } from '../store/gameStore';
import { CHEST_THEMES, ChestKind, ChestTheme } from '../data/chests';
import ChestOpening from '../components/ChestOpening';
import { Screen, TopBar, Panel, GButton, CurrencyBar, palette, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

export default function ShopScreen() {
  const { setScreen, shopStock, gold, gems, buyShopItem, refreshShop, equipment, heroes } = useGameStore();
  const [opening, setOpening] = useState<{ theme: ChestTheme; reward: ChestReward; id: number } | null>(null);

  function handleBuy(idx: number) {
    const slot = shopStock[idx];
    if (!slot || slot.stock <= 0) return;
    const wallet = slot.currency === 'gold' ? gold : gems;
    if (wallet < slot.cost) { Alert.alert(`Not enough ${slot.currency}`); return; }
    const result = buyShopItem(idx);
    if (result) {
      // Chest purchase → play the chest opening animation.
      setOpening({ theme: CHEST_THEMES[result.kind], reward: result.reward, id: Date.now() });
    }
  }

  return (
    <Screen>
      <TopBar title="SHOP" onBack={() => setScreen('home')} right={<CurrencyBar gold={gold} gems={gems} />} />
      <View style={styles.refreshRow}>
        <GButton small variant="purple" label="🔄 Refresh · 50💎"
          onPress={() => { if (gems < 50) { Alert.alert('Not enough gems'); return; } refreshShop(true); }} />
        <Text style={styles.hint}>Auto-refresh every 30 min</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        {shopStock.length === 0 ? (
          <Text style={styles.empty}>The shop is empty. Try refreshing.</Text>
        ) : shopStock.map((slot, idx) => {
          const sold = slot.stock <= 0;
          const canAfford = slot.currency === 'gold' ? gold >= slot.cost : gems >= slot.cost;
          // Chest slot → render a chest tile with the shared CHEST_THEMES art.
          if (slot.itemId.startsWith('chest:')) {
            const kind = slot.itemId.split(':')[1] as ChestKind;
            const theme = CHEST_THEMES[kind];
            return (
              <Panel key={slot.id} style={[styles.card, sold && { opacity: 0.4 }]}>
                <View style={styles.row}>
                  <View style={[styles.chestBadge, { shadowColor: theme.glow }]}>
                    <LinearGradient colors={theme.wood} style={styles.chestBadgeBg}>
                      <Text style={styles.chestIcon}>{theme.icon}</Text>
                    </LinearGradient>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: theme.glow }]} numberOfLines={1}>
                      {slot.label ?? theme.name}
                    </Text>
                    <Text style={styles.bonus} numberOfLines={1}>
                      Rolls gold, gems, hero cards & gear · rarer payouts at higher tiers.
                    </Text>
                    <Text style={styles.meta}>CHEST · stock {slot.stock}</Text>
                  </View>
                  <GButton small variant={theme.variant}
                    label={`${slot.currency === 'gold' ? '🪙' : '💎'} ${slot.cost}`}
                    disabled={sold}
                    onPress={() => handleBuy(idx)} />
                </View>
              </Panel>
            );
          }
          const item = equipment[slot.itemId];
          if (!item) return null;
          const grad = rarityGradient[item.rarity] ?? rarityGradient.common;
          return (
            <Panel key={slot.id} style={[styles.card, sold && { opacity: 0.4 }]}>
              <View style={styles.row}>
                <LinearGradient colors={grad} style={styles.iconBg}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: grad[0] }]} numberOfLines={1}>
                    {slot.label ?? item.name}
                  </Text>
                  <Text style={styles.bonus} numberOfLines={1}>
                    {Object.entries(item.statBonus).map(([k, v]) => `+${v} ${k}`).join(' · ')}
                  </Text>
                  <Text style={styles.meta}>{item.type.toUpperCase()} · {item.rarity.toUpperCase()} · stock {slot.stock}</Text>
                </View>
                <GButton small variant={slot.currency === 'gold' ? 'gold' : 'blue'}
                  label={`${slot.currency === 'gold' ? '🪙' : '💎'} ${slot.cost}`}
                  disabled={sold}
                  onPress={() => handleBuy(idx)} />
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
  refreshRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, justifyContent: 'space-between' },
  hint: { color: palette.textDim, fontSize: 10 },
  empty: { color: palette.textDim, textAlign: 'center', padding: 40 },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBg: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff44' },
  icon: { fontSize: 24 },
  chestBadge: { borderRadius: 12, shadowOpacity: 0.85, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  chestBadgeBg: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#00000066' },
  chestIcon: { fontSize: 26 },
  name: { fontSize: 14, fontWeight: '800' },
  bonus: { color: '#8fd0ff', fontSize: 11, marginTop: 2, fontWeight: '600' },
  meta: { color: palette.textDim, fontSize: 10, marginTop: 2 },
});

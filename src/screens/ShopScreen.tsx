import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { Screen, TopBar, Panel, GButton, CurrencyBar, palette, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

export default function ShopScreen() {
  const { setScreen, shopStock, gold, gems, buyShopItem, refreshShop, equipment } = useGameStore();
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
          const isShard = slot.itemId.startsWith('shards:');
          const targetId = isShard ? slot.itemId.split(':')[1] : slot.itemId;
          const item = equipment[targetId];
          if (!item) return null;
          const sold = slot.stock <= 0;
          const canAfford = slot.currency === 'gold' ? gold >= slot.cost : gems >= slot.cost;
          const grad = rarityGradient[item.rarity] ?? rarityGradient.common;
          return (
            <Panel key={slot.id} style={[styles.card, sold && { opacity: 0.4 }]}>
              <View style={styles.row}>
                <LinearGradient colors={grad} style={styles.iconBg}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: grad[0] }]} numberOfLines={1}>
                    {isShard ? `5× ${item.name} Shards` : item.name}
                  </Text>
                  <Text style={styles.bonus} numberOfLines={1}>
                    {Object.entries(item.statBonus).map(([k, v]) => `+${v} ${k}`).join(' · ')}
                  </Text>
                  <Text style={styles.meta}>{item.type.toUpperCase()} · {item.rarity.toUpperCase()} · stock {slot.stock}</Text>
                </View>
                <GButton small variant={slot.currency === 'gold' ? 'gold' : 'blue'}
                  label={`${slot.currency === 'gold' ? '🪙' : '💎'} ${slot.cost}`}
                  disabled={sold}
                  onPress={() => {
                    if (!canAfford) { Alert.alert(`Not enough ${slot.currency}`); return; }
                    buyShopItem(idx);
                  }} />
              </View>
            </Panel>
          );
        })}
      </ScrollView>
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
  name: { fontSize: 14, fontWeight: '800' },
  bonus: { color: '#8fd0ff', fontSize: 11, marginTop: 2, fontWeight: '600' },
  meta: { color: palette.textDim, fontSize: 10, marginTop: 2 },
});

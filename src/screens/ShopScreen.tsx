import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { RARITY_COLORS } from '../data/equipment';

export default function ShopScreen() {
  const { setScreen, shopStock, gold, gems, buyShopItem, refreshShop, equipment } = useGameStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>SHOP</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.gold}>💰 {gold}</Text>
          <Text style={[styles.gold, { color: '#bb8fce' }]}>💎 {gems}</Text>
        </View>
      </View>

      <View style={styles.refreshRow}>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            if (gems < 50) { Alert.alert('Not enough gems', 'Refresh costs 50 gems.'); return; }
            refreshShop(true);
          }}
        >
          <Text style={styles.refreshText}>🔄 Refresh stock (50💎)</Text>
        </TouchableOpacity>
        <Text style={styles.refreshHint}>Auto-refresh every 30 min</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {shopStock.length === 0 ? (
          <Text style={styles.empty}>The shop is empty. Try refreshing.</Text>
        ) : shopStock.map((slot, idx) => {
          const isShard = slot.itemId.startsWith('shards:');
          const targetId = isShard ? slot.itemId.split(':')[1] : slot.itemId;
          const item = equipment[targetId];
          if (!item) return null;
          const sold = slot.stock <= 0;
          const canAfford = slot.currency === 'gold' ? gold >= slot.cost : gems >= slot.cost;
          const rarityColor = RARITY_COLORS[item.rarity];
          return (
            <View key={slot.id} style={[styles.itemCard, { borderColor: rarityColor + '88', opacity: sold ? 0.4 : 1 }]}>
              <View style={[styles.icoBox, { backgroundColor: rarityColor + '22' }]}>
                <Text style={styles.ico}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: rarityColor }]}>
                  {isShard ? `5 × ${item.name} Shards` : item.name}
                </Text>
                <Text style={styles.itemBonus}>
                  {Object.entries(item.statBonus).map(([k, v]) => `+${v} ${k}`).join(' · ')}
                </Text>
                <Text style={styles.itemStock}>
                  {item.type.toUpperCase()} · {item.rarity.toUpperCase()} · stock {slot.stock}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.buyBtn,
                  { backgroundColor: slot.currency === 'gold' ? '#f1c40f33' : '#bb8fce33',
                    borderColor: slot.currency === 'gold' ? '#f1c40f' : '#bb8fce' },
                  (!canAfford || sold) && { opacity: 0.4 },
                ]}
                onPress={() => {
                  if (sold) return;
                  if (!canAfford) { Alert.alert(`Not enough ${slot.currency}`); return; }
                  buyShopItem(idx);
                }}
              >
                <Text style={[styles.buyText, { color: slot.currency === 'gold' ? '#f1c40f' : '#bb8fce' }]}>
                  {slot.currency === 'gold' ? '💰' : '💎'} {slot.cost}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 13 },
  title: { color: '#f1c40f', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  gold: { color: '#f1c40f', fontWeight: '700', fontSize: 13 },
  refreshRow: { flexDirection: 'row', alignItems: 'center', padding: 10, justifyContent: 'space-between' },
  refreshBtn: { backgroundColor: '#bb8fce22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#bb8fce' },
  refreshText: { color: '#bb8fce', fontSize: 11, fontWeight: '700' },
  refreshHint: { color: '#555', fontSize: 10 },
  list: { padding: 10 },
  empty: { color: '#555', textAlign: 'center', padding: 40 },
  itemCard: {
    backgroundColor: '#1e1e2e', borderRadius: 12, borderWidth: 2,
    padding: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  icoBox: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  ico: { fontSize: 24 },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemBonus: { color: '#7ec8e3', fontSize: 11, marginTop: 2 },
  itemStock: { color: '#666', fontSize: 10, marginTop: 2 },
  buyBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  buyText: { fontWeight: '800', fontSize: 13 },
});

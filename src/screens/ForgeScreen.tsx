import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { RARITY_COLORS, MAX_FORGE_LEVEL, forgeShardsRequired } from '../data/equipment';

export default function ForgeScreen() {
  const { setScreen, equipment, gold, gems, forgeEquipment, enchantEquipment } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');

  const items = Object.values(equipment).filter((e) =>
    (filter === 'all' || e.type === filter) && (e.owned > 0 || e.shards > 0 || e.level > 0)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>FORGE</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.gold}>💰 {gold}</Text>
          <Text style={[styles.gold, { color: '#bb8fce' }]}>💎 {gems}</Text>
        </View>
      </View>

      <Text style={styles.help}>
        Forge with shards/gold to add +20% stats per level (max +5). Enchant with gems to add a random affix.
      </Text>

      <View style={styles.filterRow}>
        {(['all', 'weapon', 'armor', 'accessory'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {items.length === 0 ? (
          <Text style={styles.empty}>No forgeable items yet.{'\n'}Win battles to find shards.</Text>
        ) : items.map((item) => {
          const rarityColor = RARITY_COLORS[item.rarity];
          const maxed = item.level >= MAX_FORGE_LEVEL;
          const cost = maxed ? 0 : forgeShardsRequired(item.level);
          const goldCost = 50 * (item.level + 1);
          const can = !maxed && item.shards >= cost && gold >= goldCost;
          return (
            <View key={item.id} style={[styles.card, { borderColor: rarityColor + '88' }]}>
              <View style={[styles.icoBox, { backgroundColor: rarityColor + '22' }]}>
                <Text style={styles.ico}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: rarityColor }]}>
                  {item.name}{item.level > 0 && ` +${item.level}`}
                </Text>
                <Text style={styles.bonus}>
                  {Object.entries(item.statBonus).map(([k, v]) => `+${v} ${k}`).join(' · ')}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>x{item.owned} owned</Text>
                  <Text style={styles.metaText}>{item.shards} shards</Text>
                  <Text style={styles.metaText}>Lv {item.level}/{MAX_FORGE_LEVEL}</Text>
                </View>
              </View>
              <View style={{ gap: 4 }}>
                <TouchableOpacity
                  style={[styles.forgeBtn, !can && styles.forgeDisabled]}
                  disabled={!can}
                  onPress={() => {
                    if (!can) {
                      if (maxed) Alert.alert('Maxed', 'Already at max forge level.');
                      else Alert.alert('Cannot forge', `Need ${cost} shards and ${goldCost} gold.`);
                      return;
                    }
                    forgeEquipment(item.id);
                  }}
                >
                  <Text style={[styles.forgeText, !can && { color: '#555' }]}>
                    {maxed ? 'MAX' : `+${item.level + 1}`}
                  </Text>
                  {!maxed && (
                    <Text style={styles.forgeCost}>
                      {cost} shards · {goldCost}💰
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.enchantBtn, (gems < 25 || item.owned <= 0) && styles.forgeDisabled]}
                  disabled={gems < 25 || item.owned <= 0}
                  onPress={() => {
                    if (gems < 25) { Alert.alert('Not enough gems', 'Enchant costs 25 gems.'); return; }
                    if (item.owned <= 0) { Alert.alert('Item is equipped', 'Unequip first.'); return; }
                    enchantEquipment(item.id);
                  }}
                >
                  <Text style={styles.enchantText}>Enchant</Text>
                  <Text style={styles.forgeCost}>25 💎</Text>
                </TouchableOpacity>
              </View>
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
  title: { color: '#e67e22', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  gold: { color: '#f1c40f', fontWeight: '700' },
  help: { color: '#666', fontSize: 11, padding: 10, lineHeight: 15 },
  filterRow: { flexDirection: 'row', padding: 10, gap: 6 },
  filterBtn: { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: '#1e1e2e', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  filterBtnActive: { backgroundColor: '#e67e2222', borderColor: '#e67e22' },
  filterText: { color: '#666', fontSize: 11, fontWeight: '600' },
  filterTextActive: { color: '#e67e22' },
  list: { padding: 10 },
  empty: { color: '#555', textAlign: 'center', padding: 40, lineHeight: 20 },
  card: {
    backgroundColor: '#1e1e2e', borderRadius: 12, borderWidth: 2,
    padding: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  icoBox: { width: 46, height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  ico: { fontSize: 22 },
  name: { fontSize: 13, fontWeight: '700' },
  bonus: { color: '#7ec8e3', fontSize: 11, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 3 },
  metaText: { color: '#666', fontSize: 10 },
  forgeBtn: { backgroundColor: '#e67e2233', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e67e22', minWidth: 80 },
  forgeDisabled: { backgroundColor: '#1a1a2a', borderColor: '#333' },
  forgeText: { color: '#e67e22', fontWeight: '800', fontSize: 14 },
  forgeCost: { color: '#888', fontSize: 9, marginTop: 2 },
  enchantBtn: { backgroundColor: '#bb8fce33', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: '#bb8fce', minWidth: 80 },
  enchantText: { color: '#bb8fce', fontWeight: '800', fontSize: 11 },
});

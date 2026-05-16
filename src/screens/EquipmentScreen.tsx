import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';
import EquipmentCard from '../components/EquipmentCard';

export default function EquipmentScreen() {
  const { setScreen, equipment, heroes } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  const equippedIds = new Set(
    Object.values(heroes).flatMap((h) => [h.weaponId, h.armorId, h.accessoryId].filter(Boolean) as string[])
  );

  const allItems = Object.values(equipment);
  const filtered = allItems.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (rarityFilter !== 'all' && item.rarity !== rarityFilter) return false;
    return item.owned > 0 || equippedIds.has(item.id);
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>EQUIPMENT</Text>
        <Text style={styles.count}>{filtered.length} items</Text>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'weapon', 'armor', 'accessory'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'ALL' : f === 'weapon' ? '⚔️' : f === 'armor' ? '🛡️' : '💍'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.rarityRow}>
        {['all', 'common', 'rare', 'epic', 'legendary', 'mythic'].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rarityBtn, rarityFilter === r && styles.rarityBtnActive]}
            onPress={() => setRarityFilter(r)}
          >
            <Text style={[styles.rarityText, rarityFilter === r && styles.rarityTextActive]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items{'\n'}Win battles to earn equipment!</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <EquipmentCard key={item.id} item={item} equipped={equippedIds.has(item.id)} />
          ))
        )}
      </ScrollView>

      <View style={styles.tip}>
        <Text style={styles.tipText}>💡 Equip from HEROES · Upgrade in FORGE</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 13 },
  title: { color: '#27ae60', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  count: { color: '#666', fontSize: 13 },
  filterRow: { flexDirection: 'row', padding: 10, gap: 6 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e1e2e', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  filterBtnActive: { backgroundColor: '#27ae6022', borderColor: '#27ae60' },
  filterText: { color: '#666', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#27ae60' },
  rarityRow: { flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 6, gap: 4 },
  rarityBtn: { flex: 1, paddingVertical: 5, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  rarityBtnActive: { backgroundColor: '#2a2a3e', borderColor: '#7c83fd' },
  rarityText: { color: '#555', fontSize: 9, fontWeight: '600' },
  rarityTextActive: { color: '#7c83fd' },
  list: { flex: 1 },
  listContent: { padding: 10 },
  empty: { padding: 60, alignItems: 'center' },
  emptyText: { color: '#444', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  tip: { padding: 10, borderTopWidth: 1, borderTopColor: '#1e1e2e', alignItems: 'center' },
  tipText: { color: '#555', fontSize: 11 },
});

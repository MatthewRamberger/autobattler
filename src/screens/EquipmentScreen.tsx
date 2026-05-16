import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import EquipmentCard from '../components/EquipmentCard';
import { Screen, TopBar, palette } from '../components/ui';

export default function EquipmentScreen() {
  const { setScreen, equipment, heroes, dismantleEquipment } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  const equippedIds = new Set(
    Object.values(heroes).flatMap((h) => [h.weaponId, h.armorId, h.accessoryId].filter(Boolean) as string[])
  );
  const filtered = Object.values(equipment).filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (rarityFilter !== 'all' && item.rarity !== rarityFilter) return false;
    return item.owned > 0 || equippedIds.has(item.id);
  });

  return (
    <Screen>
      <TopBar title="EQUIPMENT" onBack={() => setScreen('home')}
        right={<View style={styles.count}><Text style={styles.countText}>{filtered.length}</Text></View>} />

      <View style={styles.filterRow}>
        {(['all', 'weapon', 'armor', 'accessory'] as const).map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.fBtn, filter === f && styles.fBtnOn]}>
            <Text style={[styles.fText, filter === f && styles.fTextOn]}>
              {f === 'all' ? 'ALL' : f === 'weapon' ? '⚔️' : f === 'armor' ? '🛡️' : '💍'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.rarityRow}>
        {['all', 'common', 'rare', 'epic', 'legendary', 'mythic'].map((r) => (
          <TouchableOpacity key={r} onPress={() => setRarityFilter(r)}
            style={[styles.rBtn, rarityFilter === r && styles.rBtnOn]}>
            <Text style={[styles.rText, rarityFilter === r && styles.rTextOn]}>{r[0].toUpperCase() + r.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No items.{'\n'}Win battles to earn equipment!</Text>
        ) : filtered.map((item) => (
          <View key={item.id} style={{ position: 'relative' }}>
            <EquipmentCard item={item} equipped={equippedIds.has(item.id)} />
            {item.owned >= 2 && (
              <TouchableOpacity style={styles.dismantle}
                onPress={() => {
                  const y: Record<string, number> = { common: 1, rare: 3, epic: 8, legendary: 20, mythic: 50 };
                  Alert.alert(`Dismantle ${item.name}?`, `Convert one copy into ${y[item.rarity] ?? 1} shards.`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Dismantle', onPress: () => dismantleEquipment(item.id, 1) },
                  ]);
                }}>
                <Text style={styles.dismantleText}>♻</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
      <Text style={styles.tip}>💡 Equip from HEROES · Upgrade in FORGE</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { backgroundColor: palette.panelDeep, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: palette.goldDark },
  countText: { color: palette.gold, fontWeight: '900', fontSize: 12 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 6 },
  fBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: palette.panelDeep, alignItems: 'center', borderWidth: 1.5, borderColor: '#0007' },
  fBtnOn: { backgroundColor: palette.greenDeep, borderColor: palette.green },
  fText: { color: palette.textMute, fontSize: 13, fontWeight: '800' },
  fTextOn: { color: '#fff' },
  rarityRow: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 6, gap: 4 },
  rBtn: { flex: 1, paddingVertical: 5, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#0007', backgroundColor: palette.panelDeep },
  rBtnOn: { backgroundColor: palette.purpleDeep, borderColor: palette.purple },
  rText: { color: palette.textDim, fontSize: 9, fontWeight: '700' },
  rTextOn: { color: '#fff' },
  empty: { color: palette.textDim, fontSize: 14, textAlign: 'center', lineHeight: 22, padding: 50 },
  tip: { color: palette.textDim, fontSize: 11, textAlign: 'center', padding: 10 },
  dismantle: { position: 'absolute', right: 56, top: 14, backgroundColor: palette.redDeep, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, borderColor: '#fff5' },
  dismantleText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});

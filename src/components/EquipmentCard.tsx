import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Equipment } from '../types';
import { RARITY_COLORS } from '../data/equipment';

interface Props {
  item: Equipment;
  onPress?: () => void;
  selected?: boolean;
  equipped?: boolean;
}

export default function EquipmentCard({ item, onPress, selected, equipped }: Props) {
  const rarityColor = RARITY_COLORS[item.rarity];
  const bonusText = Object.entries(item.statBonus)
    .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
    .join('  ');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { borderColor: selected ? '#fff' : rarityColor }]}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBg, { backgroundColor: rarityColor + '22' }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: rarityColor }]} numberOfLines={1}>{item.name}</Text>
          {equipped && <Text style={styles.equippedBadge}>EQUIPPED</Text>}
        </View>
        <Text style={styles.bonus}>{bonusText}</Text>
        <Text style={styles.type}>{item.type.toUpperCase()} · {item.rarity.toUpperCase()}</Text>
      </View>
      <View style={styles.ownedBadge}>
        <Text style={styles.ownedText}>×{item.owned}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    borderWidth: 2,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 26 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  equippedBadge: {
    backgroundColor: '#27ae60',
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bonus: { color: '#7ec8e3', fontSize: 12, marginTop: 2 },
  type: { color: '#666', fontSize: 11, marginTop: 2 },
  ownedBadge: {
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  ownedText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

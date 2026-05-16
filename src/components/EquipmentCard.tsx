import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Equipment } from '../types';
import { RARITY_COLORS, EQUIPMENT_SETS } from '../data/equipment';

interface Props {
  item: Equipment;
  onPress?: () => void;
  selected?: boolean;
  equipped?: boolean;
}

export default function EquipmentCard({ item, onPress, selected, equipped }: Props) {
  const rarityColor = RARITY_COLORS[item.rarity];
  const bonusText = Object.entries(item.statBonus)
    .map(([k, v]) => {
      const isPct = k === 'critRate' || k === 'dodge' || k === 'critDamage';
      return isPct ? `+${Math.round((v as number) * 100)}% ${k}` : `+${v} ${k}`;
    })
    .join('  ');

  const set = item.setId ? EQUIPMENT_SETS[item.setId] : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { borderColor: selected ? '#fff' : rarityColor }]}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBg, { backgroundColor: rarityColor + '22' }]}>
        <Text style={styles.icon}>{item.icon}</Text>
        {item.level > 0 && (
          <View style={styles.forgeBadge}>
            <Text style={styles.forgeText}>+{item.level}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: rarityColor }]} numberOfLines={1}>
            {item.name}
            {item.level > 0 && ` +${item.level}`}
          </Text>
          {equipped && <Text style={styles.equippedBadge}>EQUIPPED</Text>}
        </View>
        <Text style={styles.bonus}>{bonusText}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.type}>
            {item.type.toUpperCase()} · {item.rarity.toUpperCase()}
          </Text>
          {set && <Text style={styles.setText}>SET: {set.name}</Text>}
          {item.shards > 0 && <Text style={styles.shards}>◆ {item.shards}</Text>}
        </View>
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
    marginBottom: 8,
  },
  iconBg: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  icon: { fontSize: 24 },
  forgeBadge: {
    position: 'absolute',
    bottom: -3, right: -3,
    backgroundColor: '#e67e22',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  forgeText: { color: '#fff', fontWeight: '900', fontSize: 9 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  equippedBadge: {
    backgroundColor: '#27ae60',
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bonus: { color: '#7ec8e3', fontSize: 11, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  type: { color: '#666', fontSize: 9 },
  setText: { color: '#f1c40f', fontSize: 9, fontWeight: '700' },
  shards: { color: '#bb8fce', fontSize: 9, fontWeight: '700' },
  ownedBadge: {
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  ownedText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

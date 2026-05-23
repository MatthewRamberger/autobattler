import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Equipment } from '../types';
import { EQUIPMENT_SETS } from '../data/equipment';
import { palette, radius, shadow, rarityGradient } from '../theme';

interface Props {
  item: Equipment;
  onPress?: () => void;
  selected?: boolean;
  equipped?: boolean;
}

export default function EquipmentCard({ item, onPress, selected, equipped }: Props) {
  const grad = rarityGradient[item.rarity] ?? rarityGradient.common;
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
      activeOpacity={0.85}
      style={[styles.card, { borderColor: selected ? palette.gold : grad[1] }, shadow.card]}
    >
      <LinearGradient colors={grad} style={styles.iconBg}>
        <Text style={styles.icon}>{item.icon}</Text>
        {item.level > 1 && (
          <View style={styles.forgeBadge}><Text style={styles.forgeText}>T{item.level}</Text></View>
        )}
      </LinearGradient>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: grad[0] }]} numberOfLines={1}>
            {item.name}{item.level > 1 && ` T${item.level}`}
          </Text>
          {equipped && <Text style={styles.equippedBadge}>EQUIPPED</Text>}
        </View>
        <Text style={styles.bonus}>{bonusText}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.type}>{item.type.toUpperCase()} · {item.rarity.toUpperCase()}</Text>
          {set && <Text style={styles.setText}>SET: {set.name}</Text>}
          <Text style={styles.tier}>T{item.level}</Text>
        </View>
      </View>
      <View style={styles.ownedBadge}><Text style={styles.ownedText}>×{item.owned}</Text></View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.panel, borderRadius: radius.md, borderWidth: 2,
    padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10,
  },
  iconBg: { width: 46, height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff44' },
  icon: { fontSize: 24 },
  forgeBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: palette.goldDeep, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: '#fff' },
  forgeText: { color: '#fff', fontWeight: '900', fontSize: 9 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 13, fontWeight: '800', flexShrink: 1 },
  equippedBadge: { backgroundColor: palette.greenDeep, color: '#fff', fontSize: 8, fontWeight: '900', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  bonus: { color: '#8fd0ff', fontSize: 11, marginTop: 2, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  type: { color: palette.textDim, fontSize: 9, fontWeight: '700' },
  setText: { color: palette.gold, fontSize: 9, fontWeight: '800' },
  tier: { color: palette.gold, fontSize: 9, fontWeight: '800' },
  ownedBadge: { backgroundColor: palette.panelDeep, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 32, alignItems: 'center', borderWidth: 1, borderColor: '#0006' },
  ownedText: { color: palette.text, fontWeight: '800', fontSize: 13 },
});

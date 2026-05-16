import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Hero } from '../types';
import { RARITY_COLORS } from '../data/equipment';
import { CLASS_COLORS } from '../data/heroes';

interface Props {
  hero: Hero;
  onPress?: () => void;
  selected?: boolean;
  compact?: boolean;
}

export default function HeroCard({ hero, onPress, selected, compact }: Props) {
  const rarityColor = RARITY_COLORS[hero.rarity];
  const classColor = CLASS_COLORS[hero.heroClass];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { borderColor: selected ? '#fff' : rarityColor }, selected && styles.selected]}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBg, { backgroundColor: classColor + '33' }]}>
        <Text style={styles.icon}>{hero.icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: rarityColor }]} numberOfLines={1}>{hero.name}</Text>
        <Text style={styles.class}>{hero.heroClass}</Text>
        {!compact && (
          <View style={styles.levelRow}>
            <Text style={styles.level}>Lv.{hero.level}</Text>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
              <Text style={styles.rarityText}>{hero.rarity.toUpperCase()}</Text>
            </View>
          </View>
        )}
        {compact && <Text style={styles.level}>Lv.{hero.level}</Text>}
      </View>
      {!hero.unlocked && (
        <View style={styles.locked}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}
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
  selected: { backgroundColor: '#2a2a3e' },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 28 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  class: { color: '#888', fontSize: 12, marginTop: 1 },
  levelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  level: { color: '#ccc', fontSize: 12 },
  rarityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rarityText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  locked: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000000aa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: { fontSize: 24 },
});

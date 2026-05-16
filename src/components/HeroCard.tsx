import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Hero } from '../types';
import HeroPortrait from './HeroPortrait';
import { palette, radius, shadow } from '../theme';
import { rarityGradient } from '../theme';

interface Props {
  hero: Hero;
  onPress?: () => void;
  selected?: boolean;
  compact?: boolean;
}

export default function HeroCard({ hero, onPress, selected, compact }: Props) {
  const grad = rarityGradient[hero.rarity] ?? rarityGradient.common;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { borderColor: selected ? palette.gold : grad[1] }, shadow.card]}
    >
      <HeroPortrait
        size={52} heroClass={hero.heroClass} rarity={hero.rarity} icon={hero.icon}
        element={hero.baseStats.element} seed={hero.portraitSeed} stars={hero.stars}
        selected={selected} showFrame={false}
      />
      <View style={styles.info}>
        <Text style={[styles.name, { color: grad[0] }]} numberOfLines={1}>{hero.name}</Text>
        <Text style={styles.class}>{hero.heroClass}</Text>
        <View style={styles.levelRow}>
          <Text style={styles.level}>Lv.{hero.level}</Text>
          {!compact && (
            <LinearGradient colors={grad} style={styles.rarityBadge}>
              <Text style={styles.rarityText}>{hero.rarity.toUpperCase()}</Text>
            </LinearGradient>
          )}
        </View>
      </View>
      {!hero.unlocked && (
        <View style={styles.locked}><Text style={styles.lockIcon}>🔒</Text></View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.panel, borderRadius: radius.md, borderWidth: 2,
    padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '900' },
  class: { color: palette.textMute, fontSize: 12, marginTop: 1, fontWeight: '600' },
  levelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  level: { color: palette.textSoft, fontSize: 12, fontWeight: '700' },
  rarityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#ffffff44' },
  rarityText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  locked: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000000bb', borderRadius: radius.md, justifyContent: 'center', alignItems: 'center',
  },
  lockIcon: { fontSize: 24 },
});

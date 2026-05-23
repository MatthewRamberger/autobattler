// Small standalone class-themed portrait used by the placement /
// prep screens and previews. The full battle avatar that used to live
// here was replaced by the 3D engine in src/game3d/Unit.ts — this
// remaining export is purely for static UI (no animations, no HP bar).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HeroClass } from '../../types';
import { palette } from '../../theme';

interface ClassStyle {
  bg: readonly [string, string, string];
  rim: readonly [string, string];
  accent: string;
}

const CLASS_STYLES: Record<HeroClass, ClassStyle> = {
  Warrior:     { bg: ['#ff9a55', '#c2521a', '#3a1a06'], rim: ['#ffd6a5', '#a85c1a'], accent: '#ffb066' },
  Archer:      { bg: ['#7ddc70', '#2a8a4a', '#0a2a14'], rim: ['#caefb8', '#27735a'], accent: '#7ddc70' },
  Mage:        { bg: ['#c994ff', '#5a2eb0', '#1a0a3a'], rim: ['#e7c8ff', '#6837cc'], accent: '#c994ff' },
  Paladin:     { bg: ['#ffe07a', '#d29a1c', '#3a2e0c'], rim: ['#fff2c0', '#a87a14'], accent: '#ffd24a' },
  Rogue:       { bg: ['#6b7184', '#3a3f4f', '#0a0c14'], rim: ['#aab3c5', '#3a3f4f'], accent: '#9aa7c5' },
  Berserker:   { bg: ['#ff6a55', '#a82820', '#3a0a06'], rim: ['#ffb09c', '#a82820'], accent: '#ff6a55' },
  Cleric:      { bg: ['#fff2c0', '#c8a058', '#5a3c08'], rim: ['#ffffff', '#c8a058'], accent: '#ffea9c' },
  Druid:       { bg: ['#9ee07a', '#2a9c5a', '#0a3a1a'], rim: ['#d3f5b8', '#2a9c5a'], accent: '#9ee07a' },
  Necromancer: { bg: ['#a47fff', '#3a1c70', '#0c0420'], rim: ['#cbb0ff', '#3a1c70'], accent: '#a47fff' },
  Monk:        { bg: ['#ffd07a', '#b06f1a', '#3a2208'], rim: ['#ffe9c0', '#b06f1a'], accent: '#ffd07a' },
};

export function MiniUnitPortrait({
  icon, heroClass, isPlayer, size, stars = 0,
}: {
  icon: string;
  heroClass: HeroClass;
  isPlayer: boolean;
  size: number;
  stars?: number;
}) {
  const classStyle = CLASS_STYLES[heroClass] ?? CLASS_STYLES.Warrior;
  const teamColor = isPlayer ? palette.blue : palette.red;
  const teamColorDeep = isPlayer ? '#1f6fd6' : '#a82820';
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', bottom: size * 0.05,
        width: size * 0.85, height: size * 0.14,
        borderRadius: 999, backgroundColor: '#00000088',
      }} pointerEvents="none" />
      <View style={{
        position: 'absolute',
        width: size + 4, height: size + 4, borderRadius: (size + 4) / 2,
        borderWidth: 1.5, borderColor: teamColor + '88',
        shadowColor: teamColor, shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
      }} pointerEvents="none" />
      <View style={{
        width: size * 0.85, height: size * 0.85, borderRadius: size * 0.43,
        overflow: 'hidden', borderWidth: 2, borderColor: teamColorDeep,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <LinearGradient
          colors={classStyle.bg}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={{ ...StyleSheet.absoluteFillObject }}
        />
        <View style={{
          position: 'absolute',
          left: size * 0.04, top: size * 0.04,
          width: size * 0.72, height: size * 0.32,
          borderRadius: size * 0.4,
          backgroundColor: classStyle.rim[0],
          opacity: 0.22,
        }} pointerEvents="none" />
        <View style={{
          transform: [{ scaleX: isPlayer ? 1 : -1 }],
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{
            fontSize: size * 0.5,
            textShadowColor: '#000a', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
          }}>{icon}</Text>
        </View>
      </View>
      {stars > 0 && (
        <View style={{
          position: 'absolute', top: -2, flexDirection: 'row', gap: 1,
        }}>
          {Array.from({ length: stars }).map((_, i) => (
            <Text key={i} style={{
              color: classStyle.accent, fontSize: size * 0.18, fontWeight: '900',
              textShadowColor: '#000a', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1,
            }}>★</Text>
          ))}
        </View>
      )}
    </View>
  );
}

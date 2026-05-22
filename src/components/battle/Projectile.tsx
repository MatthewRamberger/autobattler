import React from 'react';
import { Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Element } from '../../types';
import { ELEMENT_COLORS } from '../../data/heroes';
import { Projectile as Proj } from '../../hooks/useBattleReplay';
import { HexLayout, hexCenter } from '../../utils/hex';

// Per-element styled projectile: a glowing core + a motion-blur streak that
// points along the travel direction, drawn with gradient Views so it stays
// crisp under the BattleStage pinch-zoom.
const TRAIL: Record<Element, readonly [string, string]> = {
  physical: ['#fff7c2', '#9a9a9a'] as const,
  fire: ['#ffe066', '#cf3623'] as const,
  ice: ['#e0f4ff', '#3da4ff'] as const,
  lightning: ['#fff2a8', '#f1c40f'] as const,
  holy: ['#ffffff', '#f4c542'] as const,
  shadow: ['#d2a3ff', '#5a2eb0'] as const,
  nature: ['#bef07a', '#27ae60'] as const,
};

interface Props { proj: Proj; layout: HexLayout; }

export default function Projectile({ proj, layout }: Props) {
  const from = hexCenter(proj.from, layout);
  const to = hexCenter(proj.to, layout);
  const { hexW, hexH } = layout;
  const size = Math.min(hexW, hexH) * 0.4;
  const colors = TRAIL[proj.element] ?? TRAIL.physical;
  const glow = ELEMENT_COLORS[proj.element];
  const angleDeg = (Math.atan2(to.cy - from.cy, to.cx - from.cx) * 180) / Math.PI;
  const streakLen = size * 3.4;

  const translateX = proj.anim.interpolate({ inputRange: [0, 1], outputRange: [0, to.cx - from.cx] });
  const translateY = proj.anim.interpolate({ inputRange: [0, 1], outputRange: [0, to.cy - from.cy] });
  const lift = proj.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -hexH * 0.32, 0] });
  const fade = proj.anim.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 1, 1, 0] });
  const spin = proj.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: from.cx - size / 2,
        top: from.cy - size / 2,
        width: size, height: size,
        alignItems: 'center', justifyContent: 'center',
        transform: [{ translateX }, { translateY }, { translateY: lift }],
        opacity: fade,
      }}
    >
      {/* Motion-blur streak trailing behind the head */}
      <View
        style={{
          position: 'absolute',
          width: streakLen, height: size * 0.62,
          transform: [{ rotate: `${angleDeg}deg` }, { translateX: -streakLen / 2 }],
        }}
      >
        <LinearGradient
          colors={['transparent', colors[1] + '00', colors[0] + 'cc'] as const}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={{ flex: 1, borderRadius: size }}
        />
      </View>

      {/* Glowing head */}
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <LinearGradient
          colors={colors as any}
          start={{ x: 0.2, y: 0.2 }} end={{ x: 0.8, y: 0.8 }}
          style={{
            width: size, height: size, borderRadius: size / 2,
            shadowColor: glow, shadowOpacity: 1, shadowRadius: 9, shadowOffset: { width: 0, height: 0 },
            elevation: 7,
          }}
        />
      </Animated.View>
      {/* White-hot core */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', width: size * 0.42, height: size * 0.42,
          borderRadius: size * 0.21, backgroundColor: '#ffffff',
        }}
      />
    </Animated.View>
  );
}

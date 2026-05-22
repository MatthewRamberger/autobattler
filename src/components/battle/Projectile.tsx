import React from 'react';
import { Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Element } from '../../types';
import { ELEMENT_COLORS } from '../../data/heroes';
import { Projectile as Proj } from '../../hooks/useBattleReplay';
import { HexLayout, hexCenter } from '../../utils/hex';

// Per-element styled trail color. Drawn as a gradient ball + trail so
// projectiles read on the redesigned painted field. Position uses
// transform translates so the native driver carries the motion.
const TRAIL: Record<Element, readonly [string, string]> = {
  physical: ['#fff7c2', '#888'] as const,
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
  const size = Math.min(hexW, hexH) * 0.36;
  const colors = TRAIL[proj.element] ?? TRAIL.physical;
  const glow = ELEMENT_COLORS[proj.element];

  const translateX = proj.anim.interpolate({
    inputRange: [0, 1], outputRange: [0, to.cx - from.cx],
  });
  const translateY = proj.anim.interpolate({
    inputRange: [0, 1], outputRange: [0, to.cy - from.cy],
  });
  const lift = proj.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -hexH * 0.35, 0] });
  const fade = proj.anim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0.4] });

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
      <LinearGradient
        colors={colors as any}
        start={{ x: 0.2, y: 0.2 }} end={{ x: 0.8, y: 0.8 }}
        style={{
          width: size, height: size, borderRadius: size / 2,
          shadowColor: glow, shadowOpacity: 1, shadowRadius: 7, shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2,
          backgroundColor: '#ffffffcc',
        }}
      />
    </Animated.View>
  );
}

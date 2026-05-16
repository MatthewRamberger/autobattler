import React from 'react';
import { Animated, Text } from 'react-native';
import { Element } from '../../types';
import { ELEMENT_COLORS } from '../../data/heroes';
import { Projectile as Proj } from '../../hooks/useBattleReplay';

const GLYPH: Record<Element, string> = {
  physical: '➤', fire: '🔥', ice: '❄', lightning: '⚡', holy: '✨', shadow: '🌑', nature: '🍃',
};

export default function Projectile({ proj, cellW, cellH }: { proj: Proj; cellW: number; cellH: number }) {
  const left = proj.anim.interpolate({
    inputRange: [0, 1],
    outputRange: [proj.from.col * cellW, proj.to.col * cellW],
  });
  const top = proj.anim.interpolate({
    inputRange: [0, 1],
    outputRange: [proj.from.row * cellH, proj.to.row * cellH],
  });
  // small arc
  const lift = proj.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -cellH * 0.35, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left, top, width: cellW, height: cellH,
        alignItems: 'center', justifyContent: 'center',
        transform: [{ translateY: lift }],
      }}
    >
      <Text style={{ fontSize: Math.min(cellW, cellH) * 0.34, color: ELEMENT_COLORS[proj.element] }}>
        {GLYPH[proj.element]}
      </Text>
    </Animated.View>
  );
}

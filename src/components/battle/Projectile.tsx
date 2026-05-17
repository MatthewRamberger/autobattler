import React from 'react';
import { Animated, Text } from 'react-native';
import { Element } from '../../types';
import { ELEMENT_COLORS } from '../../data/heroes';
import { Projectile as Proj } from '../../hooks/useBattleReplay';
import { hexLayout, hexCenter } from '../../utils/hex';

const GLYPH: Record<Element, string> = {
  physical: '➤', fire: '🔥', ice: '❄', lightning: '⚡', holy: '✨', shadow: '🌑', nature: '🍃',
};

interface Props { proj: Proj; layout: ReturnType<typeof hexLayout>; }

export default function Projectile({ proj, layout }: Props) {
  const from = hexCenter(proj.from, layout);
  const to = hexCenter(proj.to, layout);
  const { hexW, hexH } = layout;
  const fontSize = Math.min(hexW, hexH) * 0.34;

  const left = proj.anim.interpolate({
    inputRange: [0, 1], outputRange: [from.cx - hexW / 2, to.cx - hexW / 2],
  });
  const top = proj.anim.interpolate({
    inputRange: [0, 1], outputRange: [from.cy - hexH / 2, to.cy - hexH / 2],
  });
  const lift = proj.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -hexH * 0.35, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left, top, width: hexW, height: hexH,
        alignItems: 'center', justifyContent: 'center',
        transform: [{ translateY: lift }],
      }}
    >
      <Text style={{ fontSize, color: ELEMENT_COLORS[proj.element] }}>
        {GLYPH[proj.element]}
      </Text>
    </Animated.View>
  );
}

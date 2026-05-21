import React from 'react';
import { Animated, Text } from 'react-native';
import { Element } from '../../types';
import { ELEMENT_COLORS } from '../../data/heroes';
import { Projectile as Proj } from '../../hooks/useBattleReplay';
import { HexLayout, hexCenter } from '../../utils/hex';

const GLYPH: Record<Element, string> = {
  physical: '➤', fire: '🔥', ice: '❄', lightning: '⚡', holy: '✨', shadow: '🌑', nature: '🍃',
};

interface Props { proj: Proj; layout: HexLayout; }

// Projectile is positioned via transform translate (not left/top) so the
// animation can use the native driver. The wrap sits at the start hex's
// pixel top-left and translates toward the target as anim goes 0 → 1.
export default function Projectile({ proj, layout }: Props) {
  const from = hexCenter(proj.from, layout);
  const to = hexCenter(proj.to, layout);
  const { hexW, hexH } = layout;
  const fontSize = Math.min(hexW, hexH) * 0.34;

  const translateX = proj.anim.interpolate({
    inputRange: [0, 1], outputRange: [0, to.cx - from.cx],
  });
  const translateY = proj.anim.interpolate({
    inputRange: [0, 1], outputRange: [0, to.cy - from.cy],
  });
  const lift = proj.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -hexH * 0.35, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: from.cx - hexW / 2,
        top: from.cy - hexH / 2,
        width: hexW, height: hexH,
        alignItems: 'center', justifyContent: 'center',
        transform: [{ translateX }, { translateY }, { translateY: lift }],
      }}
    >
      <Text style={{ fontSize, color: ELEMENT_COLORS[proj.element] }}>
        {GLYPH[proj.element]}
      </Text>
    </Animated.View>
  );
}

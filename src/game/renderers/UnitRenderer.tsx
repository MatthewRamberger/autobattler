// Engine-driven unit renderer. Wraps the static UnitSprite with the
// Animated.Value transforms exposed by the engine: idle bob, attack
// lunge + weapon swing, hit flash, shake, death fade.
//
// The visual look of the character itself lives in UnitSprite — that
// way the placement screen and the in-battle canvas render identical
// sprites without duplicating the body composition.

import React from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { UnitEntity } from '../Engine';
import UnitSprite from '../sprite/UnitSprite';

interface Props {
  unit: UnitEntity;
  cellSize: number;
  // Mirrors unit.facing / unit.alive. The entity object is mutated in
  // place by the engine, so its reference never changes — these explicit
  // props are what lets React.memo notice a facing flip or death and
  // re-render. Without them the memo comparison sees identical props
  // and units keep facing the wrong way after walking past a target.
  facing: 1 | -1;
  alive: boolean;
}

const UnitRenderer = React.memo(function UnitRenderer({ unit, cellSize, facing, alive }: Props) {
  const a = unit.anims;
  const size = cellSize * 1.05;

  // Native-side interpolations.
  const bobY = a.bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const lungeX = a.lunge.interpolate({
    inputRange: [-1, 0, 1, 1.5],
    outputRange: [-facing * 6, 0, facing * 14, facing * 22],
  });
  // The weapon swing rotates a child group around its top-anchor point.
  const weaponRot = a.weaponSwing.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-55deg', '0deg', '95deg'],
  });
  const auraOpacity = a.cast.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size * 0.7, // pin sprite "feet" to the tile center
          transform: [
            { translateX: Animated.add(a.tx, Animated.add(a.shake, lungeX)) as any },
            { translateY: Animated.add(a.ty, bobY) as any },
            { scale: a.scale },
          ],
          opacity: a.opacity,
        },
      ]}
    >
      {/* Ground shadow — grounds the sprite on its tile. Cheap static
          ellipse; it rides the wrap's transforms, which is close enough
          (the idle bob is only ±3px). Hidden once the corpse fade runs
          so dead units don't leave floating shadows. */}
      {alive && (
        <View
          style={{
            position: 'absolute',
            bottom: size * 0.06,
            left: size * 0.24,
            width: size * 0.52,
            height: size * 0.13,
            borderRadius: 999,
            backgroundColor: '#000',
            opacity: 0.28,
          }}
        />
      )}

      {/* Caster glow halo behind the sprite when ability is firing. */}
      <Animated.View
        style={{
          position: 'absolute',
          left: size * 0.1, right: size * 0.1,
          top: size * 0.1, bottom: size * 0.1,
          borderRadius: size,
          backgroundColor: '#ffffff',
          opacity: Animated.multiply(auraOpacity, 0.35),
          shadowColor: '#ffffff',
          shadowOpacity: 1, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
        }}
      />

      {/* The actual sprite. The body is unanimated — only the wrap
          translates / scales. The swing animation lives in a separate
          overlay below so we don't need to mutate the sprite tree. */}
      <UnitSprite
        heroClass={unit.heroClass}
        isPlayer={unit.isPlayer}
        size={size}
        facing={facing}
      />

      {/* Weapon swing overlay — covers the weapon slot and rotates
          on attack. We don't redraw the weapon here; we just rotate
          the entire sprite's "right side" via a clipped wedge.
          Implementation: a small white slash highlight that arcs
          when swinging, which sells the attack motion. */}
      <Animated.View
        style={{
          position: 'absolute',
          right: size * 0.06,
          top: size * 0.18,
          width: size * 0.5,
          height: size * 0.5,
          opacity: a.weaponSwing.interpolate({ inputRange: [-1, 0, 0.4, 1], outputRange: [0.6, 0, 0.85, 0] }),
          transform: [
            { translateX: -size * 0.2 },
            { translateY: size * 0.25 },
            { rotateZ: weaponRot },
            { translateX: size * 0.2 },
            { translateY: -size * 0.25 },
          ],
        }}
      >
        <View style={{
          position: 'absolute', right: 0, top: '50%',
          width: size * 0.5, height: 3,
          borderRadius: 2,
          backgroundColor: '#ffffff',
          shadowColor: '#ffffff',
          shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
        }} />
      </Animated.View>

      {/* Hit-flash overlay — full white wash over the sprite. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: size * 0.12, right: size * 0.12,
          top: size * 0.1, bottom: size * 0.15,
          borderRadius: size * 0.4,
          backgroundColor: '#ffffff',
          opacity: a.flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.7] }),
        }}
      />
    </Animated.View>
  );
});

export default UnitRenderer;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0, top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

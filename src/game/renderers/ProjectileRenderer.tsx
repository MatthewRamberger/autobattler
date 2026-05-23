// Animated projectile: a glowing core + 4 staggered trail segments
// that lag behind the head. All driven by a single `t` Animated.Value
// interpolation so the whole arc runs natively.

import React from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { ProjectileEntity } from '../Engine';
import { ELEMENT_COLOR, ELEMENT_TRAIL } from '../themes';

const TRAIL_COUNT = 5;

interface Props {
  proj: ProjectileEntity;
}

const ProjectileRenderer = React.memo(function ProjectileRenderer({ proj }: Props) {
  const head = ELEMENT_COLOR[proj.element] ?? ELEMENT_COLOR.physical;
  const trail = ELEMENT_TRAIL[proj.element] ?? ELEMENT_TRAIL.physical;

  // Head position — a parabolic arc.
  const dx = proj.to.x - proj.from.x;
  const dy = proj.to.y - proj.from.y;
  const arcY = proj.arcHeight;
  // x is linear; y has a lifted midpoint via 3-stop interpolation.
  const tx = proj.t.interpolate({ inputRange: [0, 1], outputRange: [proj.from.x, proj.to.x] });
  const ty = proj.t.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [proj.from.y, (proj.from.y + proj.to.y) / 2 - arcY, proj.to.y],
  });
  const fade = proj.t.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });
  const angle = Math.atan2(dy, dx);
  const angleStr = `${(angle * 180) / Math.PI}deg`;

  return (
    <>
      {/* Trail segments: each lags by `lag` fraction of t so they
          arc behind the head along the same path. */}
      {Array.from({ length: TRAIL_COUNT }).map((_, i) => {
        const lag = (i + 1) * 0.06;
        const txS = proj.t.interpolate({
          inputRange: [0, lag, 1],
          outputRange: [proj.from.x, proj.from.x, proj.to.x],
        });
        const tyS = proj.t.interpolate({
          inputRange: [0, lag, 0.5, 1],
          outputRange: [proj.from.y, proj.from.y, (proj.from.y + proj.to.y) / 2 - arcY, proj.to.y],
        });
        const a = (1 - i / TRAIL_COUNT) * 0.55;
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.trail,
              {
                backgroundColor: trail,
                width: 14 - i * 2,
                height: 14 - i * 2,
                marginLeft: -(14 - i * 2) / 2,
                marginTop: -(14 - i * 2) / 2,
                opacity: Animated.multiply(fade, a),
                transform: [{ translateX: txS }, { translateY: tyS }],
              },
            ]}
          />
        );
      })}
      {/* Head */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.head,
          {
            backgroundColor: head,
            shadowColor: head,
            opacity: fade,
            transform: [{ translateX: tx }, { translateY: ty }, { rotateZ: angleStr }],
          },
        ]}
      />
    </>
  );
});

export default ProjectileRenderer;

const styles = StyleSheet.create({
  head: {
    position: 'absolute',
    left: 0, top: 0,
    width: 16, height: 16,
    marginLeft: -8, marginTop: -8,
    borderRadius: 8,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  trail: {
    position: 'absolute',
    left: 0, top: 0,
    borderRadius: 999,
  },
});

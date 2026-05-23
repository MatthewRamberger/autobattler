// Renders a single particle (spark / shockwave / cast mote / death
// wisp) as an Animated.View. All driven by the engine's native-side
// Animated.Values.

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { ParticleEntity } from '../Engine';

interface Props { p: ParticleEntity; }

const ParticleRenderer = React.memo(function ParticleRenderer({ p }: Props) {
  if (p.kind === 'shock') {
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shock,
          {
            borderColor: p.color,
            shadowColor: p.color,
            width: p.size,
            height: p.size * 0.55,
            marginLeft: -p.size / 2,
            marginTop: -p.size * 0.275,
            opacity: p.opacity,
            transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
          },
        ]}
      />
    );
  }
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dot,
        {
          backgroundColor: p.color,
          shadowColor: p.color,
          width: p.size,
          height: p.size,
          marginLeft: -p.size / 2,
          marginTop: -p.size / 2,
          borderRadius: p.size / 2,
          opacity: p.opacity,
          transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
        },
      ]}
    />
  );
});

export default ParticleRenderer;

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    left: 0, top: 0,
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  shock: {
    position: 'absolute',
    left: 0, top: 0,
    borderWidth: 3,
    borderRadius: 999,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
});

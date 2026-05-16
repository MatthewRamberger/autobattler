import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRID_COLS, GRID_ROWS } from '../../hooks/useBattleReplay';
import { palette } from '../../theme';

// A Clash-Royale-style arena: blue/green tiled field split into two team
// halves by a golden river with wooden bridges, framed in ornate gold with
// crown-tower emblems in the corners.
export default function Arena({ width, height }: { width: number; height: number }) {
  const cellW = width / GRID_COLS;
  const cellH = height / GRID_ROWS;
  return (
    <View style={[styles.frame, { width: width + 16, height: height + 16 }]}>
      <LinearGradient colors={['#f6c945', '#a9781a']} style={styles.frameGrad} />
      <View style={[styles.field, { width, height }]}>
        {/* team-tinted ground */}
        <LinearGradient colors={['#234a6e', '#16314a']} style={styles.half} />
        <LinearGradient colors={['#5a233a', '#3a1528']} style={[styles.half, { left: width / 2 }]} />

        {/* checker tiles */}
        {Array.from({ length: GRID_ROWS }).map((_, r) =>
          Array.from({ length: GRID_COLS }).map((_, c) => (
            <View
              key={`${r}-${c}`}
              style={{
                position: 'absolute', left: c * cellW, top: r * cellH, width: cellW, height: cellH,
                backgroundColor: (r + c) % 2 === 0 ? '#ffffff10' : 'transparent',
                borderColor: '#ffffff10', borderWidth: StyleSheet.hairlineWidth,
              }}
            />
          ))
        )}

        {/* central river */}
        <View style={[styles.river, { left: width / 2 - cellW * 0.42, width: cellW * 0.84 }]}>
          <LinearGradient colors={['#6fd0ff', '#1f6fd6']} style={StyleSheet.absoluteFill} />
        </View>
        {/* bridges (rows 0 and 2) */}
        {[0, 2].map((r) => (
          <View
            key={r}
            style={[styles.bridge, {
              left: width / 2 - cellW * 0.5, top: r * cellH + cellH * 0.2,
              width: cellW, height: cellH * 0.6,
            }]}
          >
            <LinearGradient colors={['#b9803e', '#7c4a1c']} style={StyleSheet.absoluteFill} />
            {[0.2, 0.4, 0.6, 0.8].map((p) => (
              <View key={p} style={[styles.plank, { left: `${p * 100}%` }]} />
            ))}
          </View>
        ))}

        {/* crown-tower emblems */}
        <Text style={[styles.tower, { left: 4, top: 2 }]}>🏰</Text>
        <Text style={[styles.tower, { left: 4, bottom: 2 }]}>🏰</Text>
        <Text style={[styles.tower, { right: 4, top: 2 }]}>🔥</Text>
        <Text style={[styles.tower, { right: 4, bottom: 2 }]}>🔥</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 22, padding: 8, alignSelf: 'center' },
  frameGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 22, borderWidth: 2, borderColor: '#fff5' },
  field: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#16314a' },
  half: { position: 'absolute', top: 0, bottom: 0, width: '50%' },
  river: { position: 'absolute', top: 0, bottom: 0, opacity: 0.5 },
  bridge: { position: 'absolute', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#3a2410' },
  plank: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#00000033' },
  tower: { position: 'absolute', fontSize: 16, opacity: 0.55 },
});

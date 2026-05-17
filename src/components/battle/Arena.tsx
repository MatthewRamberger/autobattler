import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HexLayout, hexCenter } from '../../utils/hex';
import { palette } from '../../theme';

// A hex-tiled arena. Player side (left, blue) and enemy side (right, red)
// are split by a contested no-place column rendered as a glowing river.
//
// `layout` is precomputed by the parent so the same hex sizing is shared
// with the unit layer, projectiles, and any prep-screen previews.
export default function Arena({ width, height, layout }: { width: number; height: number; layout: HexLayout }) {
  const { hexW, hexH, totalW, totalH, grid } = layout;
  const playerMaxCol = grid.playerMaxCol;
  const enemyMinCol = grid.enemyMinCol;
  const midColCx = hexCenter({ col: Math.floor((playerMaxCol + enemyMinCol) / 2), row: 0 }, layout).cx;

  const cells: React.ReactNode[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const { cx, cy } = hexCenter({ col, row }, layout);
      const isPlayer = col <= playerMaxCol;
      const isEnemy = col >= enemyMinCol;
      const tint = isPlayer ? '#1f3c5e' : isEnemy ? '#5a2840' : '#3a3030';
      const tintHi = isPlayer ? '#2c5780' : isEnemy ? '#7a3a58' : '#534545';
      cells.push(
        <View
          key={`${row}-${col}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: cx - hexW / 2,
            top: cy - hexH / 2,
            width: hexW,
            height: hexH,
          }}
        >
          <Hex w={hexW} h={hexH} fill={tint} stroke={'#0008'} hiFill={tintHi} />
        </View>
      );
    }
  }

  return (
    <View style={[styles.frame, { width: totalW + 16, height: totalH + 16 }]}>
      <LinearGradient colors={['#f6c945', '#a9781a']} style={styles.frameGrad} />
      <View style={[styles.field, { width: totalW, height: totalH }]}>
        <LinearGradient colors={['#16253a', '#0c1828']} style={styles.bg} />
        <LinearGradient
          colors={['#2a4f7a55', '#16253a00']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={[styles.halfGlow, { left: 0, width: totalW * 0.5 }]}
        />
        <LinearGradient
          colors={['#5a233a00', '#5a233a55']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={[styles.halfGlow, { left: totalW * 0.5, width: totalW * 0.5 }]}
        />

        {cells}

        {/* River across the contested column(s) */}
        <View
          pointerEvents="none"
          style={[styles.river, {
            left: midColCx - hexW * 0.36,
            width: hexW * 0.72,
            top: 0, bottom: 0,
          }]}
        >
          <LinearGradient colors={['#6fd0ff66', '#1f6fd699']} style={StyleSheet.absoluteFill} />
        </View>

        {/* Crown emblems at the corners */}
        <Text style={[styles.tower, { left: 6, top: 2 }]}>🏰</Text>
        <Text style={[styles.tower, { left: 6, bottom: 2 }]}>🏰</Text>
        <Text style={[styles.tower, { right: 6, top: 2 }]}>🔥</Text>
        <Text style={[styles.tower, { right: 6, bottom: 2 }]}>🔥</Text>
      </View>
    </View>
  );
}

// A proper pointy-top hexagon built without SVG:
//   - center rectangle (full width, middle 50% of height)
//   - top triangle    (CSS border-triangle hack)
//   - bottom triangle (mirrored)
// The triangle hack uses 0×0 Views with asymmetric borders, which React
// Native supports the same way the browser does.
export function Hex({ w, h, fill, stroke, hiFill }: { w: number; h: number; fill: string; stroke?: string; hiFill?: string }) {
  const triH = h * 0.25;
  const bodyH = h - triH * 2;
  return (
    <View style={{ width: w, height: h }}>
      {/* top triangle pointing up */}
      <View style={{
        position: 'absolute', left: 0, top: 0,
        width: 0, height: 0,
        borderStyle: 'solid',
        borderLeftWidth: w / 2, borderRightWidth: w / 2,
        borderBottomWidth: triH, borderTopWidth: 0,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: fill, borderTopColor: 'transparent',
      }} />
      {/* center body */}
      <View style={{
        position: 'absolute', left: 0, top: triH, width: w, height: bodyH,
        backgroundColor: fill,
      }} />
      {/* bottom triangle pointing down */}
      <View style={{
        position: 'absolute', left: 0, top: triH + bodyH,
        width: 0, height: 0,
        borderStyle: 'solid',
        borderLeftWidth: w / 2, borderRightWidth: w / 2,
        borderTopWidth: triH, borderBottomWidth: 0,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderTopColor: fill, borderBottomColor: 'transparent',
      }} />
      {/* Inner highlight band */}
      {hiFill && (
        <View pointerEvents="none" style={{
          position: 'absolute', left: w * 0.22, top: h * 0.42,
          width: w * 0.56, height: h * 0.18,
          backgroundColor: hiFill, opacity: 0.4, borderRadius: 4,
        }} />
      )}
      {/* Thin side outlines */}
      {stroke && (
        <View pointerEvents="none" style={{
          position: 'absolute', left: 0, top: triH, width: w, height: bodyH,
          borderLeftWidth: 1, borderRightWidth: 1,
          borderColor: stroke,
        }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 22, padding: 8, alignSelf: 'center' },
  frameGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 22, borderWidth: 2, borderColor: '#fff5' },
  field: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#0c1828' },
  bg: { ...StyleSheet.absoluteFillObject },
  halfGlow: { position: 'absolute', top: 0, bottom: 0 },
  river: { position: 'absolute', opacity: 0.6 },
  tower: { position: 'absolute', fontSize: 16, opacity: 0.65 },
});

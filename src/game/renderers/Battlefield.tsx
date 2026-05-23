// Static battlefield: tilted ground gradient + per-tile hex panels +
// obstacle props. Drawn once per layout/theme; the engine never
// touches this part of the tree.
//
// The 2.5D perspective is achieved by applying a single `rotateX`
// transform to a container that holds the tiles. Children are still
// painted flat by React Native, but the wrapper's perspective makes
// the back rows look smaller and farther away. Units render OUTSIDE
// this tilt so they stay billboarded upright.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HexLayout, hexCenter } from '../../utils/hex';
import { Obstacle } from '../../types';
import { GameTheme, OBSTACLE_VISUAL } from '../themes';
import { TILT_DEG, Y_SQUASH } from '../math';

interface Props {
  layout: HexLayout;
  theme: GameTheme;
  obstacles?: Obstacle[];
  width: number;
  height: number;
}

export default function Battlefield({ layout, theme, obstacles, width, height }: Props) {
  const { grid, hexW, hexH } = layout;
  const cellSize = Math.min(hexW, hexH);

  // Pre-compute tile centers projected to tilted screen space so the
  // ground panel looks like an actual tilted board.
  const tiles: Array<{
    col: number; row: number; x: number; y: number; seam: boolean; inPlayer: boolean;
  }> = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const { cx, cy } = hexCenter({ col, row }, layout);
      const inPlayer = col <= grid.playerMaxCol;
      const inEnemy = col >= grid.enemyMinCol;
      const seam = !inPlayer && !inEnemy;
      tiles.push({ col, row, x: cx, y: cy * Y_SQUASH, seam, inPlayer });
    }
  }

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.field]}>
      {/* Sky strip behind the battlefield. Drawn flat so it doesn't get
          warped by the tilt. */}
      <LinearGradient
        colors={[theme.skyTop, theme.skyHorizon]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.7 }}
        style={[StyleSheet.absoluteFill]}
      />

      {/* Ground plate — vertical gradient from "back" (compressed) to
          "front". We don't bother with an actual rotateX here because
          the tile positions already account for the squash. */}
      <LinearGradient
        colors={[theme.groundBack, theme.groundFront]}
        start={{ x: 0.5, y: 0.15 }} end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.85 }]}
      />

      {/* Tile layer. Each tile is a small parallelogram-shaped panel
          (we cheat with rotateX-squashed circles for a hex-like look
          since plain Views can't draw arbitrary polygons). */}
      {tiles.map((t) => {
        const tw = hexW * 0.86;
        const th = hexH * Y_SQUASH * 1.05;
        const palette = t.seam ? theme.tileSeam : t.inPlayer ? theme.tilePlayer : theme.tileEnemy;
        return (
          <View
            key={`${t.col}_${t.row}`}
            style={{
              position: 'absolute',
              left: t.x - tw / 2,
              top: t.y - th / 2,
              width: tw,
              height: th,
              borderRadius: tw * 0.45,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.tileRim + '66',
              opacity: t.seam ? 0.6 : 0.55,
            }}
          >
            <LinearGradient
              colors={[palette[0], palette[1], palette[2]]}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {t.seam && (
              <View style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: theme.seamGlow,
                opacity: 0.18,
              }} />
            )}
          </View>
        );
      })}

      {/* Seam stripe — a glowing vertical band along the contested column. */}
      <SeamGlow layout={layout} theme={theme} />

      {/* Obstacles — emoji-only props positioned on their tile. We
          intentionally keep these visually quiet so they don't fight
          with units; just a flat tinted backdrop + the icon. */}
      {obstacles?.map((o, i) => {
        const { cx, cy } = hexCenter({ col: o.col, row: o.row }, layout);
        const v = OBSTACLE_VISUAL[o.kind];
        const size = cellSize * 0.7 * v.scale;
        return (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: cx - size / 2,
              top: cy * Y_SQUASH - size * 0.6,
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{
              fontSize: size * 0.7,
              opacity: 0.85,
              textShadowColor: '#000a',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}>{v.icon}</Text>
          </View>
        );
      })}

      {/* Theme haze overlay (forest mist, inferno smoke, tundra fog…). */}
      {theme.haze && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.haze }]} pointerEvents="none" />
      )}
    </View>
  );
}

function SeamGlow({ layout, theme }: { layout: HexLayout; theme: GameTheme }) {
  const { grid, hexW } = layout;
  const seamCol = (grid.playerMaxCol + grid.enemyMinCol) / 2;
  // Center of the seam in untilted X.
  const xCenter = hexCenter({ col: Math.floor(seamCol), row: 0 }, layout).cx + hexW * (seamCol % 1 === 0 ? 0.5 : 0);
  const fieldH = layout.totalH * Y_SQUASH;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: xCenter - hexW * 0.06,
        top: 0,
        width: hexW * 0.12,
        height: fieldH,
        backgroundColor: theme.seamGlow,
        opacity: 0.45,
        shadowColor: theme.seamGlow,
        shadowOpacity: 0.9,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        borderRadius: hexW * 0.06,
      }}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    overflow: 'hidden',
    borderRadius: 14,
  },
});

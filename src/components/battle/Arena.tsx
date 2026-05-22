import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HexLayout, hexCenter, inBounds } from '../../utils/hex';
import { palette } from '../../theme';
import { MapTheme, Obstacle, ObstacleKind } from '../../types';

// A hex-tiled arena. Player side (left, blue) and enemy side (right, red)
// are split by a contested no-place column rendered as a glowing river.
//
// `layout` is precomputed by the parent so the same hex sizing is shared
// with the unit layer, projectiles, and any prep-screen previews.
//
// Theme + obstacles drive the visual identity per level — each map gets a
// distinct background gradient, per-tile tint, and decorative props.
interface ThemeStyle {
  bgTop: string;
  bgBot: string;
  playerTint: string;
  playerHi: string;
  enemyTint: string;
  enemyHi: string;
  midTint: string;
  midHi: string;
  river: readonly [string, string];
  cornerLeft: string;
  cornerRight: string;
  haze?: string;            // overlay tint to add fog / atmosphere
}

const THEMES: Record<MapTheme, ThemeStyle> = {
  plains: {
    bgTop: '#3a5a2c', bgBot: '#1f3018',
    playerTint: '#3d5f2c', playerHi: '#5a8240',
    enemyTint: '#6a4a24', enemyHi: '#8a6634',
    midTint: '#4e4030', midHi: '#6a5640',
    river: ['#a3d8a366', '#5a983a99'] as const,
    cornerLeft: '🏕️', cornerRight: '🏕️',
  },
  forest: {
    bgTop: '#1f3a20', bgBot: '#0a1a0a',
    playerTint: '#2a4a2a', playerHi: '#3e6a3e',
    enemyTint: '#3a2a44', enemyHi: '#553a66',
    midTint: '#2a3530', midHi: '#3e4a44',
    river: ['#5a8a4a66', '#2a5a2a99'] as const,
    cornerLeft: '🌲', cornerRight: '🌳',
    haze: '#0d2010aa',
  },
  ruins: {
    bgTop: '#3a3530', bgBot: '#1a1612',
    playerTint: '#3e3833', playerHi: '#5a4f48',
    enemyTint: '#4a3a3a', enemyHi: '#664a4a',
    midTint: '#3a3530', midHi: '#544840',
    river: ['#8a785566', '#5a4a3399'] as const,
    cornerLeft: '🏛️', cornerRight: '🏰',
  },
  tundra: {
    bgTop: '#3a4a6a', bgBot: '#15203a',
    playerTint: '#3a4a66', playerHi: '#5a7090',
    enemyTint: '#445566', enemyHi: '#6a7d96',
    midTint: '#4a5a72', midHi: '#6a7d96',
    river: ['#bce0ff66', '#5a98c899'] as const,
    cornerLeft: '🏔️', cornerRight: '❄️',
    haze: '#7ab0e022',
  },
  inferno: {
    bgTop: '#5a1a14', bgBot: '#1a0808',
    playerTint: '#4a2018', playerHi: '#6a342a',
    enemyTint: '#6a1a14', enemyHi: '#8a2a1c',
    midTint: '#5a2014', midHi: '#7a3422',
    river: ['#ff8a3a99', '#c03a1a99'] as const,
    cornerLeft: '🌋', cornerRight: '🔥',
    haze: '#ff5a2a22',
  },
  volcanic: {
    bgTop: '#4a1a1a', bgBot: '#1a0606',
    playerTint: '#3a201a', playerHi: '#5a342a',
    enemyTint: '#5a1a14', enemyHi: '#7a2a1c',
    midTint: '#4a201a', midHi: '#6a3422',
    river: ['#ffaa5a99', '#c0552a99'] as const,
    cornerLeft: '🗻', cornerRight: '🐉',
    haze: '#ff8a3a22',
  },
  shadow: {
    bgTop: '#2a1a4a', bgBot: '#0a0414',
    playerTint: '#2a1f44', playerHi: '#3a2e5a',
    enemyTint: '#3a1a44', enemyHi: '#502a66',
    midTint: '#2a1a3a', midHi: '#402a5a',
    river: ['#9b6dff66', '#3f1e8099'] as const,
    cornerLeft: '🌑', cornerRight: '👁️',
    haze: '#6a1a8a22',
  },
  celestial: {
    bgTop: '#5a4a1a', bgBot: '#2a2010',
    playerTint: '#4a4a2a', playerHi: '#6a6a44',
    enemyTint: '#5a4a1a', enemyHi: '#7a6a2a',
    midTint: '#5a4a2a', midHi: '#7a6644',
    river: ['#ffe07a99', '#d29a1c99'] as const,
    cornerLeft: '☀️', cornerRight: '✨',
    haze: '#ffd24a22',
  },
  undead: {
    bgTop: '#2a3030', bgBot: '#0a1010',
    playerTint: '#2a3a3a', playerHi: '#3a5050',
    enemyTint: '#3a2a3a', enemyHi: '#503a50',
    midTint: '#2a3030', midHi: '#3a4848',
    river: ['#7a9a8a66', '#3a5a4a99'] as const,
    cornerLeft: '⚰️', cornerRight: '💀',
    haze: '#5a7a6a22',
  },
  siege: {
    bgTop: '#3a3020', bgBot: '#181208',
    playerTint: '#3a3a2a', playerHi: '#5a5440',
    enemyTint: '#4a3024', enemyHi: '#664a34',
    midTint: '#3e342a', midHi: '#584a3a',
    river: ['#d4b06a66', '#7a5a2099'] as const,
    cornerLeft: '🏰', cornerRight: '⚔️',
  },
};

// Decorative obstacle glyphs. Rendered as text overlays so we get rich
// art without committing to a sprite-sheet pipeline.
const OBSTACLE_ART: Record<ObstacleKind, { emoji: string; scale: number }> = {
  rock:      { emoji: '🪨', scale: 0.62 },
  tree:      { emoji: '🌲', scale: 0.70 },
  bush:      { emoji: '🌿', scale: 0.52 },
  banner:    { emoji: '🚩', scale: 0.60 },
  tower:     { emoji: '🗼', scale: 0.68 },
  fortress:  { emoji: '🏰', scale: 0.78 },
  gate:      { emoji: '⛩️', scale: 0.74 },
  crystal:   { emoji: '💎', scale: 0.58 },
  icicle:    { emoji: '🧊', scale: 0.60 },
  skull:     { emoji: '💀', scale: 0.58 },
  tomb:      { emoji: '🪦', scale: 0.66 },
  fire:      { emoji: '🔥', scale: 0.60 },
  lava:      { emoji: '🌋', scale: 0.66 },
  magma:     { emoji: '🟥', scale: 0.50 },
  pillar:    { emoji: '🏛️', scale: 0.68 },
  altar:     { emoji: '⚱️', scale: 0.62 },
  orb:       { emoji: '🔮', scale: 0.56 },
  tent:      { emoji: '⛺', scale: 0.66 },
  cauldron:  { emoji: '🫕', scale: 0.58 },
};

export default function Arena({
  width, height, layout, theme = 'plains', obstacles = [],
}: {
  width: number; height: number; layout: HexLayout;
  theme?: MapTheme; obstacles?: Obstacle[];
}) {
  const { hexW, hexH, totalW, totalH, grid } = layout;
  const playerMaxCol = grid.playerMaxCol;
  const enemyMinCol = grid.enemyMinCol;
  const midColCx = hexCenter({ col: Math.floor((playerMaxCol + enemyMinCol) / 2), row: 0 }, layout).cx;

  const t = THEMES[theme] ?? THEMES.plains;

  const cells: React.ReactNode[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const { cx, cy } = hexCenter({ col, row }, layout);
      const isPlayer = col <= playerMaxCol;
      const isEnemy = col >= enemyMinCol;
      const tint = isPlayer ? t.playerTint : isEnemy ? t.enemyTint : t.midTint;
      const tintHi = isPlayer ? t.playerHi : isEnemy ? t.enemyHi : t.midHi;
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

  // Decorative props placed in legal grid cells.
  const obstacleNodes = obstacles
    .filter((o) => inBounds({ col: o.col, row: o.row }, grid))
    .map((o, i) => {
      const { cx, cy } = hexCenter({ col: o.col, row: o.row }, layout);
      const art = OBSTACLE_ART[o.kind];
      const size = Math.min(hexW, hexH) * art.scale;
      return (
        <View
          key={`ob-${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: cx - size / 2,
            top: cy - size / 2 - size * 0.15,
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Soft shadow disc under the prop */}
          <View
            style={{
              position: 'absolute',
              bottom: 2,
              width: size * 0.7,
              height: size * 0.14,
              borderRadius: 999,
              backgroundColor: '#00000077',
            }}
          />
          <Text
            style={{
              fontSize: size * 0.78,
              textShadowColor: '#000a',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 3,
            }}
          >
            {art.emoji}
          </Text>
        </View>
      );
    });

  return (
    <View style={[styles.frame, { width: totalW + 16, height: totalH + 16 }]}>
      <LinearGradient colors={['#f6c945', '#a9781a']} style={styles.frameGrad} />
      <View style={[styles.field, { width: totalW, height: totalH }]}>
        <LinearGradient colors={[t.bgTop, t.bgBot]} style={styles.bg} />
        <LinearGradient
          colors={[`${t.playerHi}55`, '#00000000']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={[styles.halfGlow, { left: 0, width: totalW * 0.5 }]}
        />
        <LinearGradient
          colors={['#00000000', `${t.enemyHi}55`]}
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
          <LinearGradient colors={t.river} style={StyleSheet.absoluteFill} />
        </View>

        {/* Decorative obstacles (above tiles, below units) */}
        {obstacleNodes}

        {/* Optional atmospheric haze overlay */}
        {t.haze && (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: t.haze }]}
          />
        )}

        {/* Themed corner emblems */}
        <Text style={[styles.tower, { left: 6, top: 2 }]}>{t.cornerLeft}</Text>
        <Text style={[styles.tower, { left: 6, bottom: 2 }]}>{t.cornerLeft}</Text>
        <Text style={[styles.tower, { right: 6, top: 2 }]}>{t.cornerRight}</Text>
        <Text style={[styles.tower, { right: 6, bottom: 2 }]}>{t.cornerRight}</Text>
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

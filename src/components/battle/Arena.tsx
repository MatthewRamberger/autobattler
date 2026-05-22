import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HexLayout, hexCenter, inBounds } from '../../utils/hex';
import { palette } from '../../theme';
import { MapTheme, Obstacle, ObstacleKind } from '../../types';

// A hex-tiled arena rebuilt from scratch for a polished look.
//
// Layout: pointy-top hexes drawn as a CSS-triangle hex (no SVG dep) with a
// stacked rim of three gradient layers — base, rim ring, inner glow — and
// a contact shadow underneath so the whole grid sits on the field like
// inlaid tiles rather than a flat shaded square. Halves are tinted by
// team (subtle blue/red wash) without changing tile color radically, so
// the eye reads the divide via lighting rather than swatch noise.
//
// The contested center column gets a glowing rune line instead of the old
// `river` gradient strip — it reads as an arena divider in any theme.
//
// Obstacles render as layered Views (shadow base + body + highlight)
// instead of emoji so the props match the painted-tile look.

interface ThemeStyle {
  // Sky / ground gradients for the field background. `bgMid` adds a third
  // gradient stop so we can fake distant atmosphere.
  bg: readonly [string, string, string];

  // Hex tile palette: deep shadow underneath, mid body, light highlight.
  tile: { shadow: string; mid: string; hi: string; rim: string };
  // Team wash overlays — kept very subtle so the field reads as one space.
  playerWash: string;   // ~ #...22
  enemyWash: string;

  // Center rune divider.
  rune: readonly [string, string];

  // Ambient haze tint for foggy / hot themes.
  haze?: string;

  // Decorative corner emblems (still emoji — these are small and far enough
  // to read as themed flourishes rather than primary art).
  cornerLeft: string;
  cornerRight: string;

  // Edge-of-field glow tint (a halo around the field rectangle).
  edgeGlow: string;
}

// Color reference: deeper saturated colors so the field looks painted, not
// washed-out. Highlights are warm so gold ornaments harmonize.
const THEMES: Record<MapTheme, ThemeStyle> = {
  plains: {
    bg: ['#2f4624', '#1d2c16', '#0d160a'],
    tile: { shadow: '#0e1a07', mid: '#4a6a32', hi: '#7ab156', rim: '#9fcd6d' },
    playerWash: '#3da4ff18', enemyWash: '#ff6a5518',
    rune: ['#ffe07a', '#d29a1c'],
    cornerLeft: '🌾', cornerRight: '🌾',
    edgeGlow: '#5a8a3a55',
  },
  forest: {
    bg: ['#13301a', '#0a1d0e', '#040b06'],
    tile: { shadow: '#04140a', mid: '#244c2a', hi: '#3c8a45', rim: '#69bf6f' },
    playerWash: '#3da4ff15', enemyWash: '#ff5a5a18',
    rune: ['#bef07a', '#5a983a'],
    haze: '#0a1f12aa',
    cornerLeft: '🌲', cornerRight: '🌳',
    edgeGlow: '#2a6a3a66',
  },
  ruins: {
    bg: ['#2f2826', '#1c1816', '#0c0a08'],
    tile: { shadow: '#0e0a07', mid: '#5a4e44', hi: '#8c7c6a', rim: '#b59c82' },
    playerWash: '#5fa4ff15', enemyWash: '#ff8a5a18',
    rune: ['#ffe39c', '#a87a14'],
    cornerLeft: '🏛️', cornerRight: '🏰',
    edgeGlow: '#8a785566',
  },
  tundra: {
    bg: ['#2c3e60', '#162234', '#08111e'],
    tile: { shadow: '#0a1828', mid: '#4a6a92', hi: '#9bc3eb', rim: '#d9ecff' },
    playerWash: '#3da4ff22', enemyWash: '#c5a3ff14',
    rune: ['#bce0ff', '#5a98c8'],
    haze: '#7ab0e022',
    cornerLeft: '🏔️', cornerRight: '❄️',
    edgeGlow: '#7ab0e0aa',
  },
  inferno: {
    bg: ['#4a1410', '#260808', '#0c0303'],
    tile: { shadow: '#1f0805', mid: '#7a2820', hi: '#c34a2a', rim: '#ff6a3a' },
    playerWash: '#3da4ff10', enemyWash: '#ff3a1a22',
    rune: ['#ffd24a', '#ff5a14'],
    haze: '#ff5a2a26',
    cornerLeft: '🌋', cornerRight: '🔥',
    edgeGlow: '#ff5a1a88',
  },
  volcanic: {
    bg: ['#3a1410', '#1c0606', '#080202'],
    tile: { shadow: '#1c0604', mid: '#6a2418', hi: '#a8442a', rim: '#e26a3a' },
    playerWash: '#3da4ff10', enemyWash: '#ff5a3a22',
    rune: ['#ffae5a', '#c0552a'],
    haze: '#ff8a3a22',
    cornerLeft: '🗻', cornerRight: '🐉',
    edgeGlow: '#ff5a1a88',
  },
  shadow: {
    bg: ['#241340', '#120a22', '#06030d'],
    tile: { shadow: '#0d0719', mid: '#3a2563', hi: '#7c4ad0', rim: '#bd9eff' },
    playerWash: '#5fa4ff14', enemyWash: '#ff3a8814',
    rune: ['#cf9bff', '#5a2eb0'],
    haze: '#6a1a8a26',
    cornerLeft: '🌑', cornerRight: '👁️',
    edgeGlow: '#7a3acf88',
  },
  celestial: {
    bg: ['#4e3a14', '#2c2210', '#120c05'],
    tile: { shadow: '#1a1206', mid: '#7a5a1c', hi: '#d09a2c', rim: '#ffd95a' },
    playerWash: '#fff2a818', enemyWash: '#ff8a5a14',
    rune: ['#fff2a8', '#d29a1c'],
    haze: '#ffd24a18',
    cornerLeft: '☀️', cornerRight: '✨',
    edgeGlow: '#ffd24a88',
  },
  undead: {
    bg: ['#1f2c2a', '#0e1716', '#040809'],
    tile: { shadow: '#040d0c', mid: '#3a504a', hi: '#6f8a82', rim: '#a8c5bb' },
    playerWash: '#5fa4ff12', enemyWash: '#c5a3ff14',
    rune: ['#bbe5d0', '#3a7a6a'],
    haze: '#5a7a6a26',
    cornerLeft: '⚰️', cornerRight: '💀',
    edgeGlow: '#5a8a7aaa',
  },
  siege: {
    bg: ['#3a2d18', '#1c1409', '#0a0703'],
    tile: { shadow: '#150d05', mid: '#5a4a2a', hi: '#9c7a3a', rim: '#d4b06a' },
    playerWash: '#3da4ff14', enemyWash: '#ff6a3a18',
    rune: ['#ffd97a', '#a8761a'],
    cornerLeft: '🏰', cornerRight: '⚔️',
    edgeGlow: '#a87a1a88',
  },
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
  const midCol = Math.floor((playerMaxCol + enemyMinCol) / 2);
  const midColCx = hexCenter({ col: midCol, row: 0 }, layout).cx;

  const t = THEMES[theme] ?? THEMES.plains;

  const cells: React.ReactNode[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const { cx, cy } = hexCenter({ col, row }, layout);
      const isPlayer = col <= playerMaxCol;
      const isEnemy = col >= enemyMinCol;
      const isMid = !isPlayer && !isEnemy;
      // Subtle alternating brightness so adjacent tiles read as separate
      // facets rather than one large blob.
      const facetShift = ((row + col) % 2) === 0 ? 0 : -3;
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
          <TileHex
            w={hexW}
            h={hexH}
            tile={t.tile}
            wash={isPlayer ? t.playerWash : isEnemy ? t.enemyWash : '#ffffff10'}
            facetShift={facetShift}
            emphasize={isMid}
          />
        </View>
      );
    }
  }

  // Decorative obstacles drawn as gradient Views (no emoji) so they share
  // the painted-tile look. The renderer picks per-kind visual.
  const obstacleNodes = obstacles
    .filter((o) => inBounds({ col: o.col, row: o.row }, grid))
    .map((o, i) => {
      const { cx, cy } = hexCenter({ col: o.col, row: o.row }, layout);
      const size = Math.min(hexW, hexH);
      return (
        <View
          key={`ob-${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: cx - size / 2,
            top: cy - size / 2,
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ObstacleArt kind={o.kind} size={size} />
        </View>
      );
    });

  // Center rune-line glyphs along the contested column.
  const runeNodes: React.ReactNode[] = [];
  for (let row = 0; row < grid.rows; row++) {
    const { cx, cy } = hexCenter({ col: midCol, row }, layout);
    runeNodes.push(
      <View
        key={`rune-${row}`}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: cx - hexW * 0.18,
          top: cy - hexW * 0.18,
          width: hexW * 0.36,
          height: hexW * 0.36,
          borderRadius: hexW * 0.18,
          borderWidth: 1,
          borderColor: t.rune[0] + '55',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{
          width: hexW * 0.18, height: hexW * 0.18, borderRadius: hexW * 0.09,
          backgroundColor: t.rune[0] + '88',
        }} />
      </View>
    );
  }

  return (
    <View style={[styles.frame, { width: totalW + 16, height: totalH + 16 }]}>
      {/* Outer gold frame with subtle bevel */}
      <LinearGradient
        colors={['#f6c945', '#a9781a', '#5a3c08'] as const}
        style={styles.frameGrad}
      />
      {/* Inner frame highlight */}
      <View style={styles.frameHi} pointerEvents="none" />

      <View style={[styles.field, { width: totalW, height: totalH }]}>
        {/* Sky → ground gradient */}
        <LinearGradient colors={t.bg} style={styles.bg} />

        {/* Distant atmosphere / vignette */}
        <LinearGradient
          colors={['transparent', '#00000088'] as const}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject as any}
        />
        {/* Soft top edge highlight (sunlight) */}
        <LinearGradient
          colors={['#ffffff22', 'transparent'] as const}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
          style={StyleSheet.absoluteFillObject as any}
        />

        {/* Team-side halos (gentle radial-style glows from the edges) */}
        <LinearGradient
          colors={['#3da4ff33', 'transparent'] as const}
          start={{ x: 0, y: 0.5 }} end={{ x: 0.55, y: 0.5 }}
          style={StyleSheet.absoluteFillObject as any}
        />
        <LinearGradient
          colors={['transparent', '#ff5a3a33'] as const}
          start={{ x: 0.45, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject as any}
        />

        {/* Floor shadow under the grid (gives the tiles "lift") */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: totalW * 0.04, right: totalW * 0.04,
            top: totalH * 0.04, bottom: totalH * 0.04,
            backgroundColor: '#00000033',
            borderRadius: 24,
          }}
        />

        {/* Hex tiles */}
        {cells}

        {/* Center divider runes */}
        {runeNodes}
        {/* Glow strip behind the rune line */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: midColCx - 2, width: 4,
            top: 6, bottom: 6,
            backgroundColor: t.rune[0] + '33',
            shadowColor: t.rune[0],
            shadowOpacity: 1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
          }}
        />

        {/* Obstacles (above tiles, below units) */}
        {obstacleNodes}

        {/* Optional atmospheric haze */}
        {t.haze && (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: t.haze }]}
          />
        )}

        {/* Edge corner emblems */}
        <Text style={[styles.tower, { left: 8, top: 4 }]}>{t.cornerLeft}</Text>
        <Text style={[styles.tower, { left: 8, bottom: 4 }]}>{t.cornerLeft}</Text>
        <Text style={[styles.tower, { right: 8, top: 4 }]}>{t.cornerRight}</Text>
        <Text style={[styles.tower, { right: 8, bottom: 4 }]}>{t.cornerRight}</Text>
      </View>

      {/* Outer glow halo */}
      <View
        pointerEvents="none"
        style={[styles.glowHalo, {
          shadowColor: t.edgeGlow,
        }]}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Hex tile — drawn as a pointy-top hexagon with stacked layers:
//   1. Cast shadow (slightly offset down)
//   2. Main body (gradient)
//   3. Top facet highlight
//   4. Rim outline (thin ring of slightly lighter color)
//   5. Optional team wash overlay
// ---------------------------------------------------------------------------
function TileHex({
  w, h, tile, wash, facetShift, emphasize,
}: {
  w: number; h: number;
  tile: { shadow: string; mid: string; hi: string; rim: string };
  wash: string;
  facetShift: number;
  emphasize?: boolean;
}) {
  // Two hex layers: rim (slightly larger, behind) + body (mid color). Then
  // two thin View bands for the highlight facet and lower-edge shadow,
  // plus a wash overlay. Total: ~7 Views per tile (cheap).
  const inset = 1;
  const ww = w - inset * 2;
  const hh = h - inset * 2;
  return (
    <View style={{ width: w, height: h }}>
      <HexShape w={ww + 2} h={hh + 2} color={tile.rim} dx={inset - 1} dy={inset - 1} />
      <HexShape w={ww} h={hh} color={tile.mid} dx={inset} dy={inset} />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: inset + ww * 0.16, top: inset + hh * 0.38,
          width: ww * 0.68, height: hh * 0.18,
          backgroundColor: lighten(tile.hi, facetShift),
          opacity: emphasize ? 0.6 : 0.42,
          borderRadius: 4,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: inset + ww * 0.12, top: inset + hh * 0.72,
          width: ww * 0.76, height: hh * 0.16,
          backgroundColor: tile.shadow,
          opacity: 0.40,
          borderRadius: 4,
        }}
      />
      {wash && wash !== '#ffffff10' && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', left: inset, top: inset, width: ww, height: hh,
            backgroundColor: wash,
          }}
        />
      )}
    </View>
  );
}

// Pointy-top hex shape built from one rectangle + two triangle Views.
function HexShape({
  w, h, color, dx = 0, dy = 0, opacity = 1,
}: {
  w: number; h: number; color: string;
  dx?: number; dy?: number; opacity?: number;
}) {
  const triH = h * 0.25;
  const bodyH = h - triH * 2;
  return (
    <View
      style={{
        position: 'absolute', left: dx, top: dy, width: w, height: h, opacity,
      }}
      pointerEvents="none"
    >
      <View style={{
        position: 'absolute', left: 0, top: 0,
        width: 0, height: 0,
        borderStyle: 'solid',
        borderLeftWidth: w / 2, borderRightWidth: w / 2,
        borderBottomWidth: triH, borderTopWidth: 0,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color, borderTopColor: 'transparent',
      }} />
      <View style={{
        position: 'absolute', left: 0, top: triH - 0.5, width: w, height: bodyH + 1,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute', left: 0, top: triH + bodyH,
        width: 0, height: 0,
        borderStyle: 'solid',
        borderLeftWidth: w / 2, borderRightWidth: w / 2,
        borderTopWidth: triH, borderBottomWidth: 0,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderTopColor: color, borderBottomColor: 'transparent',
      }} />
    </View>
  );
}

// Backwards-compatible export used by BattlePrepScreen to draw single
// placement tiles. The new Arena uses the internal `Hex` component above
// with richer styling; the prep screen still wants the simpler API.
export function Hex({
  w, h, fill, stroke, hiFill,
}: { w: number; h: number; fill: string; stroke?: string; hiFill?: string }) {
  return (
    <View style={{ width: w, height: h }}>
      <HexShape w={w} h={h} color={fill} />
      {hiFill && (
        <View pointerEvents="none" style={{
          position: 'absolute', left: w * 0.22, top: h * 0.42,
          width: w * 0.56, height: h * 0.18,
          backgroundColor: hiFill, opacity: 0.4, borderRadius: 4,
        }} />
      )}
      {stroke && (
        <View pointerEvents="none" style={{
          position: 'absolute', left: 0, top: h * 0.25, width: w, height: h * 0.5,
          borderLeftWidth: 1, borderRightWidth: 1,
          borderColor: stroke,
        }} />
      )}
    </View>
  );
}

// Small color helper — additive lighten/darken on hex strings.
function lighten(hex: string, delta: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const r = clamp255(parseInt(hex.slice(1, 3), 16) + delta);
  const g = clamp255(parseInt(hex.slice(3, 5), 16) + delta);
  const b = clamp255(parseInt(hex.slice(5, 7), 16) + delta);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function clamp255(n: number): number { return Math.max(0, Math.min(255, n)); }
function toHex(n: number): string { return n.toString(16).padStart(2, '0'); }

// ---------------------------------------------------------------------------
// Obstacles — gradient + shape Views so the props share the painted look.
// Each kind composes a tiny scene: shadow base + body + accent.
// ---------------------------------------------------------------------------
function ObstacleArt({ kind, size }: { kind: ObstacleKind; size: number }) {
  switch (kind) {
    case 'rock':
    case 'magma':
      return (
        <PropFrame size={size}>
          <Boulder size={size * 0.7} colors={kind === 'magma'
            ? ['#ff6a2a', '#a83a0e'] as const
            : ['#a3a3aa', '#4a4a55'] as const}
          />
        </PropFrame>
      );
    case 'tree':
      return (
        <PropFrame size={size}>
          <Tree size={size * 0.78} />
        </PropFrame>
      );
    case 'bush':
      return (
        <PropFrame size={size}>
          <Bush size={size * 0.6} />
        </PropFrame>
      );
    case 'crystal':
    case 'orb':
      return (
        <PropFrame size={size}>
          <Crystal size={size * 0.62} colors={kind === 'orb'
            ? ['#b89bff', '#5a3acf'] as const
            : ['#7adfff', '#1f6fd6'] as const}
          />
        </PropFrame>
      );
    case 'icicle':
      return (
        <PropFrame size={size}>
          <Crystal size={size * 0.62} colors={['#dff4ff', '#5a98c8'] as const} />
        </PropFrame>
      );
    case 'fire':
    case 'lava':
      return (
        <PropFrame size={size}>
          <FlameProp size={size * 0.7} />
        </PropFrame>
      );
    case 'banner':
      return (
        <PropFrame size={size}>
          <Banner size={size * 0.78} />
        </PropFrame>
      );
    case 'tower':
    case 'fortress':
    case 'pillar':
    case 'gate':
      return (
        <PropFrame size={size}>
          <Tower size={size * 0.78} variant={kind === 'fortress' ? 'fortress' : kind === 'pillar' ? 'pillar' : kind === 'gate' ? 'gate' : 'tower'} />
        </PropFrame>
      );
    case 'tomb':
    case 'skull':
    case 'altar':
      return (
        <PropFrame size={size}>
          <Tomb size={size * 0.7} variant={kind === 'skull' ? 'skull' : kind === 'altar' ? 'altar' : 'tomb'} />
        </PropFrame>
      );
    case 'tent':
    case 'cauldron':
      return (
        <PropFrame size={size}>
          <Tent size={size * 0.72} variant={kind === 'cauldron' ? 'cauldron' : 'tent'} />
        </PropFrame>
      );
  }
}

function PropFrame({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* Contact shadow disc */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: size * 0.08,
          width: size * 0.6, height: size * 0.12,
          borderRadius: 999,
          backgroundColor: '#00000077',
        }}
      />
      {children}
    </View>
  );
}

function Boulder({ size, colors }: { size: number; colors: readonly [string, string] }) {
  return (
    <View style={{ width: size, height: size * 0.7, marginBottom: size * 0.1, alignItems: 'center' }}>
      <LinearGradient
        colors={[colors[0], colors[1]] as any}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
        style={{
          width: size, height: size * 0.66,
          borderTopLeftRadius: size * 0.42,
          borderTopRightRadius: size * 0.36,
          borderBottomLeftRadius: size * 0.18,
          borderBottomRightRadius: size * 0.22,
        }}
      />
      {/* Highlight bump */}
      <View style={{
        position: 'absolute', top: size * 0.06, left: size * 0.18,
        width: size * 0.4, height: size * 0.16,
        borderRadius: 999,
        backgroundColor: '#ffffff44',
      }} />
    </View>
  );
}

function Tree({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* trunk */}
      <View style={{
        position: 'absolute', bottom: 0, width: size * 0.18, height: size * 0.32,
        backgroundColor: '#3a1f0c', borderRadius: 4,
      }} />
      {/* canopy — three stacked triangles */}
      <View style={{ position: 'absolute', bottom: size * 0.22, alignItems: 'center' }}>
        <ConeLeaf size={size * 0.85} top="#5fc35a" bot="#1f6f24" />
      </View>
      <View style={{ position: 'absolute', bottom: size * 0.42, alignItems: 'center' }}>
        <ConeLeaf size={size * 0.7} top="#7ddc70" bot="#2a8a2e" />
      </View>
      <View style={{ position: 'absolute', bottom: size * 0.62, alignItems: 'center' }}>
        <ConeLeaf size={size * 0.55} top="#a0ec88" bot="#43a44a" />
      </View>
    </View>
  );
}

function ConeLeaf({ size, top, bot }: { size: number; top: string; bot: string }) {
  return (
    <LinearGradient
      colors={[top, bot] as any}
      start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      style={{
        width: size, height: size * 0.55,
        borderTopLeftRadius: size * 0.5, borderTopRightRadius: size * 0.5,
      }}
    />
  );
}

function Bush({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size * 0.6, marginBottom: 2 }}>
      <LinearGradient
        colors={['#7ddc70', '#1f6f24'] as any}
        style={{
          width: size, height: size * 0.6,
          borderRadius: size * 0.32,
        }}
      />
      <View style={{
        position: 'absolute', top: 0, left: size * 0.14, width: size * 0.36, height: size * 0.18,
        borderRadius: 999, backgroundColor: '#bff4a0aa',
      }} />
    </View>
  );
}

function Crystal({ size, colors }: { size: number; colors: readonly [string, string] }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.5, height: size * 0.95,
        backgroundColor: colors[0],
        transform: [{ rotate: '6deg' }],
        // Diamond-ish: clip corners using border-radius on opposite corners.
        borderTopLeftRadius: size * 0.22,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: size * 0.22,
        shadowColor: colors[0],
        shadowOpacity: 0.9,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      }} />
      <LinearGradient
        colors={[colors[0] + 'aa', colors[1]] as any}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          width: size * 0.32, height: size * 0.85,
          transform: [{ rotate: '-8deg' }],
          borderTopLeftRadius: 4,
          borderTopRightRadius: size * 0.16,
          borderBottomLeftRadius: size * 0.16,
          borderBottomRightRadius: 4,
        }}
      />
    </View>
  );
}

function FlameProp({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* base */}
      <View style={{
        width: size * 0.7, height: size * 0.18,
        borderRadius: size * 0.1,
        backgroundColor: '#3a1208',
      }} />
      {/* flame body */}
      <LinearGradient
        colors={['#ffe066', '#ff8a14', '#ce2e0e'] as any}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          bottom: size * 0.14,
          width: size * 0.5, height: size * 0.7,
          borderTopLeftRadius: size * 0.4,
          borderTopRightRadius: size * 0.32,
          borderBottomLeftRadius: size * 0.2,
          borderBottomRightRadius: size * 0.2,
        }}
      />
      <View style={{
        position: 'absolute', bottom: size * 0.32, width: size * 0.18, height: size * 0.32,
        borderRadius: size * 0.2,
        backgroundColor: '#fff2a8',
        opacity: 0.85,
      }} />
    </View>
  );
}

function Banner({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* pole */}
      <View style={{
        position: 'absolute', bottom: 0, width: 3, height: size * 0.92,
        backgroundColor: '#5a3c08',
        borderRadius: 2,
      }} />
      {/* flag */}
      <LinearGradient
        colors={['#ff6a55', '#a82323'] as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: size * 0.06,
          left: size * 0.5 - 1,
          width: size * 0.46, height: size * 0.38,
          borderTopRightRadius: 4, borderBottomRightRadius: 4,
        }}
      />
      {/* finial */}
      <View style={{
        position: 'absolute', top: 0, width: 6, height: 6, borderRadius: 3,
        backgroundColor: '#f6c945',
      }} />
    </View>
  );
}

function Tower({ size, variant }: { size: number; variant: 'tower' | 'fortress' | 'pillar' | 'gate' }) {
  const W = variant === 'fortress' ? size * 0.86 : variant === 'pillar' ? size * 0.34 : variant === 'gate' ? size * 0.78 : size * 0.5;
  const H = variant === 'pillar' ? size * 0.96 : size * 0.82;
  return (
    <View style={{ width: W, height: H, alignItems: 'center' }}>
      {/* body */}
      <LinearGradient
        colors={['#cbb78a', '#7a6638', '#3f3318'] as any}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={{
          width: W, height: H * 0.86,
          borderTopLeftRadius: variant === 'gate' ? W * 0.5 : 6,
          borderTopRightRadius: variant === 'gate' ? W * 0.5 : 6,
        }}
      />
      {/* battlements */}
      {variant !== 'pillar' && variant !== 'gate' && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.16,
          flexDirection: 'row', justifyContent: 'space-around',
        }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: W * 0.16, height: H * 0.16, backgroundColor: '#3f3318' }} />
          ))}
        </View>
      )}
      {/* door */}
      {variant !== 'pillar' && (
        <View style={{
          position: 'absolute', bottom: 2, width: W * 0.32, height: H * 0.42,
          backgroundColor: '#1a0d04',
          borderTopLeftRadius: W * 0.2, borderTopRightRadius: W * 0.2,
        }} />
      )}
      {/* windows */}
      {(variant === 'tower' || variant === 'fortress') && (
        <View style={{ position: 'absolute', top: H * 0.32, width: W * 0.22, height: H * 0.18,
          backgroundColor: '#ffd24a', borderRadius: 2, opacity: 0.85,
          shadowColor: '#ffd24a', shadowOpacity: 1, shadowRadius: 4,
        }} />
      )}
    </View>
  );
}

function Tomb({ size, variant }: { size: number; variant: 'tomb' | 'skull' | 'altar' }) {
  if (variant === 'skull') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{
          width: size * 0.6, height: size * 0.55,
          backgroundColor: '#e8e0c5',
          borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3,
          borderBottomLeftRadius: size * 0.2, borderBottomRightRadius: size * 0.2,
        }}>
          <View style={{ position: 'absolute', top: size * 0.18, left: size * 0.1, width: size * 0.12, height: size * 0.16, backgroundColor: '#000', borderRadius: size * 0.08 }} />
          <View style={{ position: 'absolute', top: size * 0.18, right: size * 0.1, width: size * 0.12, height: size * 0.16, backgroundColor: '#000', borderRadius: size * 0.08 }} />
        </View>
      </View>
    );
  }
  if (variant === 'altar') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <LinearGradient
          colors={['#7a6a3a', '#3a2e0c'] as any}
          style={{ width: size * 0.7, height: size * 0.42, borderRadius: 4 }}
        />
        <View style={{
          position: 'absolute', top: size * 0.16,
          width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2,
          backgroundColor: '#c9a3ff',
          shadowColor: '#c9a3ff', shadowOpacity: 1, shadowRadius: 8,
        }} />
      </View>
    );
  }
  // tomb
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <LinearGradient
        colors={['#a8a294', '#5a5246', '#2a261c'] as any}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={{
          width: size * 0.6, height: size * 0.78,
          borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3,
        }}
      />
      <View style={{
        position: 'absolute', top: size * 0.28, width: 3, height: size * 0.32, backgroundColor: '#2a261c',
      }} />
      <View style={{
        position: 'absolute', top: size * 0.32, width: size * 0.32, height: 3, backgroundColor: '#2a261c',
      }} />
    </View>
  );
}

function Tent({ size, variant }: { size: number; variant: 'tent' | 'cauldron' }) {
  if (variant === 'cauldron') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{
          width: size * 0.7, height: size * 0.5,
          backgroundColor: '#1a1a1a',
          borderBottomLeftRadius: size * 0.34,
          borderBottomRightRadius: size * 0.34,
          borderTopLeftRadius: 4, borderTopRightRadius: 4,
        }} />
        <LinearGradient
          colors={['#bf3a14', '#3a0a04'] as any}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute', bottom: size * 0.34,
            width: size * 0.7, height: size * 0.12,
            borderRadius: 4,
          }}
        />
      </View>
    );
  }
  // tent
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{
        width: 0, height: 0,
        borderStyle: 'solid',
        borderLeftWidth: size * 0.42, borderRightWidth: size * 0.42,
        borderBottomWidth: size * 0.62, borderTopWidth: 0,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: '#a8521c',
      }} />
      <View style={{
        position: 'absolute', bottom: 0, width: size * 0.18, height: size * 0.32,
        backgroundColor: '#1a0d04',
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 22, padding: 8, alignSelf: 'center' },
  frameGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 22 },
  frameHi: {
    ...StyleSheet.absoluteFillObject, borderRadius: 22,
    borderWidth: 2, borderColor: '#fffaa044',
  },
  field: {
    borderRadius: 14, overflow: 'hidden', backgroundColor: '#0c1828',
    borderWidth: 2, borderColor: '#0a0608',
  },
  bg: { ...StyleSheet.absoluteFillObject },
  tower: { position: 'absolute', fontSize: 18, opacity: 0.55, textShadowColor: '#000a', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  glowHalo: {
    ...StyleSheet.absoluteFillObject, borderRadius: 22,
    shadowOpacity: 0.8, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HexLayout, hexCenter, inBounds } from '../../utils/hex';
import { MapTheme, Obstacle, ObstacleKind } from '../../types';

// ===========================================================================
// Arena — a layered, level-themed battlefield.
//
// Rendering stack (back → front):
//   1. Gold bevelled frame
//   2. Themed sky gradient
//   3. Distant horizon silhouette (mountains / treeline / walls …)
//   4. Ground plane with directional lighting + team-side halos
//   5. Hex tile grid (3-tone bevelled hexes, team-tinted halves)
//   6. Glowing contested rune divider
//   7. Level obstacle props (detailed trees, fortresses, crystals …)
//   8. Foreground edge scenery framing the field
//   9. Atmospheric haze + vignette
//
// Everything is plain Views + expo-linear-gradient so it stays crisp under
// the BattleStage pinch-zoom without any native dependency.
// ===========================================================================

export const FRAME_PAD = 8;

type SceneryKind = 'hills' | 'pines' | 'ruins' | 'peaks' | 'volcano' | 'spires' | 'clouds' | 'graves' | 'walls';

interface ThemeStyle {
  sky: readonly [string, string, string];
  ground: readonly [string, string];
  tile: { hi: string; mid: string; low: string; shadow: string; rim: string };
  playerWash: string;
  enemyWash: string;
  rune: readonly [string, string];
  horizon: { kind: SceneryKind; far: string; near: string };
  haze?: string;
  edgeGlow: string;
}

const THEMES: Record<MapTheme, ThemeStyle> = {
  plains: {
    sky: ['#8fb6e0', '#6b94c8', '#3f5e80'],
    ground: ['#4a6a32', '#2b3f1d'],
    tile: { hi: '#9fd069', mid: '#5d8a3c', low: '#3c5a26', shadow: '#16240d', rim: '#bce08a' },
    playerWash: '#3da4ff20', enemyWash: '#ff6a5520',
    rune: ['#ffe488', '#d29a1c'],
    horizon: { kind: 'hills', far: '#4a6a8a', near: '#2f4a2a' },
    edgeGlow: '#5a8a3a66',
  },
  forest: {
    sky: ['#3a5a52', '#274038', '#142420'],
    ground: ['#244c2a', '#10260f'],
    tile: { hi: '#62b465', mid: '#317a3a', low: '#1e4d24', shadow: '#081608', rim: '#7fce78' },
    playerWash: '#3da4ff18', enemyWash: '#ff5a5a1c',
    rune: ['#bef07a', '#5a983a'],
    horizon: { kind: 'pines', far: '#1c3526', near: '#0c1c12' },
    haze: '#0a1f1255',
    edgeGlow: '#2a6a3a77',
  },
  ruins: {
    sky: ['#caa97f', '#8c7355', '#4a3a2a'],
    ground: ['#5a4e44', '#2a2018'],
    tile: { hi: '#c4ad8e', mid: '#82705a', low: '#564636', shadow: '#1c140c', rim: '#dcc6a2' },
    playerWash: '#5fa4ff18', enemyWash: '#ff8a5a1c',
    rune: ['#ffe39c', '#a87a14'],
    horizon: { kind: 'ruins', far: '#5a4c3a', near: '#2e2418' },
    edgeGlow: '#8a785577',
  },
  tundra: {
    sky: ['#bcd6ee', '#86a8cc', '#41597a'],
    ground: ['#7a96b6', '#3a4c66'],
    tile: { hi: '#eaf5ff', mid: '#9fc2e4', low: '#6f8eb4', shadow: '#2a3d56', rim: '#ffffff' },
    playerWash: '#3da4ff24', enemyWash: '#c5a3ff18',
    rune: ['#cdeaff', '#5a98c8'],
    horizon: { kind: 'peaks', far: '#8aa8c8', near: '#4a5e7e' },
    haze: '#cfe4f733',
    edgeGlow: '#9fd0f0aa',
  },
  inferno: {
    sky: ['#6a2018', '#3a0e0a', '#150403'],
    ground: ['#5a1e14', '#260808'],
    tile: { hi: '#ff8a4a', mid: '#b84a26', low: '#7a2c18', shadow: '#1f0805', rim: '#ffb072' },
    playerWash: '#3da4ff14', enemyWash: '#ff3a1a26',
    rune: ['#ffd24a', '#ff5a14'],
    horizon: { kind: 'volcano', far: '#4a1810', near: '#240806' },
    haze: '#ff5a2a2e',
    edgeGlow: '#ff5a1a99',
  },
  volcanic: {
    sky: ['#5a1c14', '#300c0a', '#120303'],
    ground: ['#4a1a12', '#1c0606'],
    tile: { hi: '#e8743a', mid: '#a8442a', low: '#6a2418', shadow: '#1c0604', rim: '#ff9456' },
    playerWash: '#3da4ff14', enemyWash: '#ff5a3a26',
    rune: ['#ffae5a', '#c0552a'],
    horizon: { kind: 'volcano', far: '#3a120c', near: '#1c0604' },
    haze: '#ff8a3a2a',
    edgeGlow: '#ff5a1a99',
  },
  shadow: {
    sky: ['#352052', '#1e1238', '#0a0518'],
    ground: ['#2c1a4a', '#120a26'],
    tile: { hi: '#9a6ce8', mid: '#5a3aa0', low: '#3a2568', shadow: '#0d0719', rim: '#c6a4ff' },
    playerWash: '#5fa4ff18', enemyWash: '#ff3a8818',
    rune: ['#cf9bff', '#5a2eb0'],
    horizon: { kind: 'spires', far: '#2a1850', near: '#150a2a' },
    haze: '#6a1a8a2a',
    edgeGlow: '#7a3acf99',
  },
  celestial: {
    sky: ['#ffe9a8', '#e6b864', '#9a7430'],
    ground: ['#6a5220', '#3a2c10'],
    tile: { hi: '#ffe89a', mid: '#d6a63c', low: '#9a7424', shadow: '#3a2a08', rim: '#fff4c4' },
    playerWash: '#bfe4ff20', enemyWash: '#ff8a5a18',
    rune: ['#fff2a8', '#d29a1c'],
    horizon: { kind: 'clouds', far: '#e8c878', near: '#c89a44' },
    haze: '#ffe9a826',
    edgeGlow: '#ffd24a99',
  },
  undead: {
    sky: ['#34504a', '#1e302c', '#0a1614'],
    ground: ['#2e423c', '#121e1a'],
    tile: { hi: '#86a89c', mid: '#4e6a60', low: '#33473f', shadow: '#0a1614', rim: '#a8c5bb' },
    playerWash: '#5fa4ff16', enemyWash: '#c5a3ff18',
    rune: ['#bbe5d0', '#3a7a6a'],
    horizon: { kind: 'graves', far: '#2a3e38', near: '#16241f' },
    haze: '#5a7a6a2a',
    edgeGlow: '#5a8a7aaa',
  },
  siege: {
    sky: ['#9aaec8', '#6a7e9a', '#3a4458'],
    ground: ['#5a4a2a', '#2a2010'],
    tile: { hi: '#c8a868', mid: '#8a6e3a', low: '#5a4628', shadow: '#1a1206', rim: '#e0c084' },
    playerWash: '#3da4ff18', enemyWash: '#ff6a3a1c',
    rune: ['#ffd97a', '#a8761a'],
    horizon: { kind: 'walls', far: '#4a4232', near: '#2a241a' },
    edgeGlow: '#a87a1a99',
  },
};

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------
function lighten(hex: string, delta: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const c = (i: number) => Math.max(0, Math.min(255, parseInt(hex.slice(i, i + 2), 16) + delta));
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(c(1))}${h(c(3))}${h(c(5))}`;
}

// ===========================================================================
// Arena
//
// Memoised: the props (layout / theme / obstacles) are stable for the whole
// battle, so the ~200-tile grid is built once instead of on every replay
// tick when the parent screen re-renders.
// ===========================================================================
function ArenaBase({
  width, height, layout, theme = 'plains', obstacles = [],
}: {
  width: number; height: number; layout: HexLayout;
  theme?: MapTheme; obstacles?: Obstacle[];
}) {
  const { hexW, hexH, totalW, totalH, grid } = layout;
  const midCol = Math.floor((grid.playerMaxCol + grid.enemyMinCol) / 2);
  const midColCx = hexCenter({ col: midCol, row: 0 }, layout).cx;
  const t = THEMES[theme] ?? THEMES.plains;

  // --- Hex tiles -----------------------------------------------------------
  const cells: React.ReactNode[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const { cx, cy } = hexCenter({ col, row }, layout);
      const isPlayer = col <= grid.playerMaxCol;
      const isEnemy = col >= grid.enemyMinCol;
      const facet = ((row + col) & 1) === 0 ? 4 : -4;
      cells.push(
        <View
          key={`c${row}-${col}`}
          pointerEvents="none"
          style={{ position: 'absolute', left: cx - hexW / 2, top: cy - hexH / 2, width: hexW, height: hexH }}
        >
          <TileHex
            w={hexW} h={hexH} tile={t.tile} facet={facet}
            wash={isPlayer ? t.playerWash : isEnemy ? t.enemyWash : null}
            contested={!isPlayer && !isEnemy}
          />
        </View>
      );
    }
  }

  // --- Obstacle props ------------------------------------------------------
  const obstacleNodes = obstacles
    .filter((o) => inBounds({ col: o.col, row: o.row }, grid))
    .map((o, i) => {
      const { cx, cy } = hexCenter({ col: o.col, row: o.row }, layout);
      const size = Math.min(hexW, hexH) * 1.32;
      return (
        <View
          key={`ob${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: cx - size / 2, top: cy - size * 0.72,
            width: size, height: size,
            alignItems: 'center', justifyContent: 'flex-end',
          }}
        >
          <ObstacleArt kind={o.kind} size={size} />
        </View>
      );
    });

  // --- Contested rune divider ---------------------------------------------
  const runeNodes: React.ReactNode[] = [];
  for (let row = 0; row < grid.rows; row++) {
    const { cx, cy } = hexCenter({ col: midCol, row }, layout);
    const r = hexW * 0.2;
    runeNodes.push(
      <View
        key={`r${row}`}
        pointerEvents="none"
        style={{
          position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2,
          borderRadius: r, borderWidth: 1.5, borderColor: t.rune[0] + '66',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <View style={{
          width: r, height: r, borderRadius: r / 2, backgroundColor: t.rune[0] + 'cc',
          shadowColor: t.rune[0], shadowOpacity: 1, shadowRadius: 5, shadowOffset: { width: 0, height: 0 },
        }} />
      </View>
    );
  }

  const horizonH = Math.max(40, totalH * 0.36);

  return (
    <View style={[styles.frame, { width: totalW + FRAME_PAD * 2, height: totalH + FRAME_PAD * 2 }]}>
      {/* Bevelled gold frame */}
      <LinearGradient colors={['#ffd874', '#b58a2a', '#5a3c08'] as const} style={styles.frameGrad} />
      <View style={styles.frameInner} pointerEvents="none" />

      <View style={[styles.field, { width: totalW, height: totalH }]}>
        {/* Sky */}
        <LinearGradient colors={t.sky} style={StyleSheet.absoluteFillObject as any} />

        {/* Distant horizon silhouette */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: horizonH }} pointerEvents="none">
          <HorizonScenery w={totalW} h={horizonH} theme={t} />
        </View>

        {/* Ground plane */}
        <LinearGradient
          colors={[t.ground[0], t.ground[1]] as const}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: totalH - horizonH * 0.55 }}
        />
        {/* Sunlight wash from upper-left */}
        <LinearGradient
          colors={['#ffffff2a', 'transparent'] as const}
          start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 0.7 }}
          style={StyleSheet.absoluteFillObject as any}
        />
        {/* Team-side ground halos */}
        <LinearGradient
          colors={['#3da4ff38', 'transparent'] as const}
          start={{ x: 0, y: 0.6 }} end={{ x: 0.5, y: 0.6 }}
          style={StyleSheet.absoluteFillObject as any}
        />
        <LinearGradient
          colors={['transparent', '#ff5a3a38'] as const}
          start={{ x: 0.5, y: 0.6 }} end={{ x: 1, y: 0.6 }}
          style={StyleSheet.absoluteFillObject as any}
        />

        {/* Soft contact shadow under the grid */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: totalW * 0.03, right: totalW * 0.03,
            top: totalH * 0.06, bottom: totalH * 0.04,
            backgroundColor: '#00000033', borderRadius: 26,
          }}
        />

        {cells}

        {/* Rune divider glow strip */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', left: midColCx - 2.5, width: 5, top: 4, bottom: 4,
            backgroundColor: t.rune[0] + '3a',
            shadowColor: t.rune[0], shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
          }}
        />
        {runeNodes}

        {obstacleNodes}

        {/* Foreground framing scenery */}
        <EdgeScenery w={totalW} h={totalH} hexW={hexW} theme={t} />

        {/* Atmospheric haze */}
        {t.haze && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: t.haze }]} />
        )}
        {/* Vignette */}
        <View pointerEvents="none" style={styles.vignette} />
        <LinearGradient
          colors={['transparent', '#00000066'] as const}
          start={{ x: 0.5, y: 0.55 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject as any}
        />
      </View>

      <View pointerEvents="none" style={[styles.outerGlow, { shadowColor: t.edgeGlow }]} />
    </View>
  );
}

// ===========================================================================
// Hex tile — drop shadow + rim + 3-tone bevelled body + team wash
// ===========================================================================
function TileHex({
  w, h, tile, wash, facet, contested,
}: {
  w: number; h: number;
  tile: ThemeStyle['tile'];
  wash: string | null;
  facet: number;
  contested?: boolean;
}) {
  const inset = 1.4;
  const bw = w - inset * 2;
  const bh = h - inset * 2;
  return (
    <View style={{ width: w, height: h }}>
      {/* cast shadow */}
      <HexShape w={w} h={h} top={tile.shadow} mid={tile.shadow} bot={tile.shadow} dx={0} dy={2.5} opacity={0.5} />
      {/* rim */}
      <HexShape w={w} h={h} top={tile.rim} mid={tile.rim} bot={tile.rim} dx={0} dy={0} />
      {/* body */}
      <HexShape
        w={bw} h={bh}
        top={lighten(tile.hi, facet)} mid={tile.mid} bot={tile.low}
        dx={inset} dy={inset}
      />
      {/* glossy top facet */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: inset + bw * 0.2, top: inset + bh * 0.16,
          width: bw * 0.6, height: bh * 0.16,
          borderRadius: 99, backgroundColor: '#ffffff', opacity: 0.18,
        }}
      />
      {wash && (
        <HexShape w={bw} h={bh} top={wash} mid={wash} bot={wash} dx={inset} dy={inset} />
      )}
      {contested && (
        <HexShape w={bw} h={bh} top={'#ffffff14'} mid={'#ffffff14'} bot={'#ffffff14'} dx={inset} dy={inset} />
      )}
    </View>
  );
}

// Pointy-top hexagon from one rect + two triangles, each band its own color.
function HexShape({
  w, h, top, mid, bot, dx = 0, dy = 0, opacity = 1,
}: {
  w: number; h: number; top: string; mid: string; bot: string;
  dx?: number; dy?: number; opacity?: number;
}) {
  const triH = h * 0.26;
  const bodyH = h - triH * 2;
  return (
    <View style={{ position: 'absolute', left: dx, top: dy, width: w, height: h, opacity }} pointerEvents="none">
      <View style={{
        position: 'absolute', left: 0, top: 0, width: 0, height: 0,
        borderLeftWidth: w / 2, borderRightWidth: w / 2, borderBottomWidth: triH,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: top,
      }} />
      <View style={{ position: 'absolute', left: 0, top: triH - 0.5, width: w, height: bodyH + 1, backgroundColor: mid }} />
      <View style={{
        position: 'absolute', left: 0, top: triH + bodyH, width: 0, height: 0,
        borderLeftWidth: w / 2, borderRightWidth: w / 2, borderTopWidth: triH,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: bot,
      }} />
    </View>
  );
}

// ===========================================================================
// Horizon scenery — distant theme silhouette band
// ===========================================================================
function HorizonScenery({ w, h, theme }: { w: number; h: number; theme: ThemeStyle }) {
  const { kind, far, near } = theme.horizon;
  return (
    <View style={{ width: w, height: h }} pointerEvents="none">
      <SilhouetteRow w={w} band={h} color={far} count={kind === 'walls' ? 6 : 7} kind={kind} layer="far" />
      <SilhouetteRow w={w} band={h} color={near} count={kind === 'walls' ? 5 : 5} kind={kind} layer="near" />
    </View>
  );
}

function SilhouetteRow({
  w, band, color, count, kind, layer,
}: {
  w: number; band: number; color: string; count: number;
  kind: SceneryKind; layer: 'far' | 'near';
}) {
  const slot = w / count;
  const base = layer === 'far' ? band * 0.52 : band * 0.82;
  const peakH = layer === 'far' ? band * 0.55 : band * 0.95;
  const shapes: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const cx = slot * (i + 0.5) + (layer === 'near' ? slot * 0.18 : 0);
    const wob = 0.7 + ((i * 37) % 11) / 18;
    shapes.push(
      <SceneryShape key={`${layer}${i}`} kind={kind} cx={cx} baseY={band} color={color}
        width={slot * (kind === 'pines' ? 0.92 : 1.18)} height={peakH * wob} />
    );
  }
  return <>{shapes}</>;
}

function SceneryShape({
  kind, cx, baseY, width, height, color,
}: { kind: SceneryKind; cx: number; baseY: number; width: number; height: number; color: string }) {
  const left = cx - width / 2;
  const top = baseY - height;
  if (kind === 'pines' || kind === 'spires') {
    // Sharp triangle.
    return (
      <View style={{ position: 'absolute', left, top, width, height }}>
        <View style={{
          position: 'absolute', left: 0, top: 0, width: 0, height: 0,
          borderLeftWidth: width / 2, borderRightWidth: width / 2, borderBottomWidth: height,
          borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
        }} />
      </View>
    );
  }
  if (kind === 'peaks' || kind === 'volcano') {
    return (
      <View style={{ position: 'absolute', left, top, width, height }}>
        <View style={{
          position: 'absolute', left: 0, top: 0, width: 0, height: 0,
          borderLeftWidth: width / 2, borderRightWidth: width / 2, borderBottomWidth: height,
          borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
        }} />
        {/* snow / lava cap */}
        <View style={{
          position: 'absolute', left: width / 2 - width * 0.13, top: 0, width: 0, height: 0,
          borderLeftWidth: width * 0.13, borderRightWidth: width * 0.13, borderBottomWidth: height * 0.3,
          borderLeftColor: 'transparent', borderRightColor: 'transparent',
          borderBottomColor: kind === 'volcano' ? '#ff7a3a' : '#eef4ff',
        }} />
      </View>
    );
  }
  if (kind === 'walls' || kind === 'ruins') {
    // Blocky battlement.
    return (
      <View style={{ position: 'absolute', left, top, width, height, backgroundColor: color }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[0, 1, 2].map((k) => (
            <View key={k} style={{ width: width * 0.22, height: height * 0.22, backgroundColor: color, marginTop: -height * 0.18 }} />
          ))}
        </View>
        {kind === 'ruins' && (
          <View style={{ position: 'absolute', right: width * 0.2, bottom: 0, width: width * 0.2, height: height * 1.4, backgroundColor: color }} />
        )}
      </View>
    );
  }
  // hills / clouds / graves → rounded hump.
  return (
    <View style={{
      position: 'absolute', left, top, width, height: height * 1.4,
      borderTopLeftRadius: width * 0.6, borderTopRightRadius: width * 0.6,
      backgroundColor: color,
    }}>
      {kind === 'graves' && (
        <View style={{
          position: 'absolute', left: width * 0.42, top: -height * 0.3,
          width: width * 0.16, height: height * 0.5, backgroundColor: color,
          borderTopLeftRadius: 4, borderTopRightRadius: 4,
        }} />
      )}
    </View>
  );
}

// ===========================================================================
// Foreground edge scenery — small framing props at the field borders
// ===========================================================================
function EdgeScenery({
  w, h, hexW, theme,
}: { w: number; h: number; hexW: number; theme: ThemeStyle }) {
  const kind = theme.horizon.kind;
  const s = hexW * 0.95;
  const corner = (left: number, top: number, k: ObstacleKind, key: string) => (
    <View key={key} pointerEvents="none" style={{ position: 'absolute', left, top, width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ObstacleArt kind={k} size={s} />
    </View>
  );
  const edgeKind: ObstacleKind =
    kind === 'pines' || kind === 'hills' ? 'tree'
      : kind === 'peaks' ? 'icicle'
        : kind === 'volcano' ? 'fire'
          : kind === 'spires' ? 'crystal'
            : kind === 'graves' ? 'tomb'
              : kind === 'walls' ? 'tower'
                : kind === 'clouds' ? 'pillar'
                  : 'rock';
  return (
    <>
      {corner(-s * 0.18, h - s * 0.92, edgeKind, 'bl')}
      {corner(w - s * 0.82, h - s * 0.92, edgeKind, 'br')}
      {corner(w * 0.32, h - s * 0.7, kind === 'volcano' ? 'magma' : kind === 'pines' ? 'bush' : 'rock', 'bm')}
    </>
  );
}

// ===========================================================================
// Obstacle props — detailed gradient/View art
// ===========================================================================
function ObstacleArt({ kind, size }: { kind: ObstacleKind; size: number }) {
  switch (kind) {
    case 'tree': return <Tree size={size} />;
    case 'bush': return <Bush size={size * 0.7} />;
    case 'rock':
    case 'magma': return <Boulder size={size * 0.78} lava={kind === 'magma'} />;
    case 'crystal':
    case 'orb': return <Crystal size={size * 0.78} colors={kind === 'orb' ? ['#c6a4ff', '#5a3acf'] : ['#8be4ff', '#1f6fd6']} />;
    case 'icicle': return <Crystal size={size * 0.8} colors={['#eafaff', '#6aa8d8']} />;
    case 'fire':
    case 'lava': return <Flame size={size * 0.82} />;
    case 'banner': return <Banner size={size * 0.92} />;
    case 'fortress': return <Fortress size={size} />;
    case 'tower': return <Tower size={size * 0.92} variant="tower" />;
    case 'gate': return <Tower size={size * 0.92} variant="gate" />;
    case 'pillar': return <Tower size={size * 0.92} variant="pillar" />;
    case 'tomb': return <Tomb size={size * 0.82} variant="tomb" />;
    case 'skull': return <Tomb size={size * 0.82} variant="skull" />;
    case 'altar': return <Tomb size={size * 0.82} variant="altar" />;
    case 'tent': return <Tent size={size * 0.86} />;
    case 'cauldron': return <Cauldron size={size * 0.82} />;
    default: return <Boulder size={size * 0.7} lava={false} />;
  }
}

function ContactShadow({ size, scale = 0.62 }: { size: number; scale?: number }) {
  return (
    <View pointerEvents="none" style={{
      position: 'absolute', bottom: size * 0.04,
      width: size * scale, height: size * 0.13, borderRadius: 999, backgroundColor: '#00000077',
    }} />
  );
}

function Tree({ size }: { size: number }) {
  const trunkW = size * 0.14;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ContactShadow size={size} scale={0.5} />
      {/* trunk */}
      <LinearGradient
        colors={['#5a3415', '#2e1808'] as const}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', bottom: size * 0.08, width: trunkW, height: size * 0.34, borderRadius: trunkW / 2 }}
      />
      {/* foliage tiers — back tier wider/darker, front tier bright */}
      {[
        { b: 0.26, w: 0.92, c: ['#3f9a48', '#1c5824'] },
        { b: 0.44, w: 0.74, c: ['#5fbf58', '#2a7a32'] },
        { b: 0.62, w: 0.54, c: ['#86dc78', '#3f9a48'] },
      ].map((tier, i) => (
        <View key={i} style={{ position: 'absolute', bottom: size * tier.b, alignItems: 'center' }}>
          <LinearGradient
            colors={tier.c as any}
            start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
            style={{
              width: size * tier.w, height: size * tier.w * 0.62,
              borderTopLeftRadius: size * tier.w * 0.5, borderTopRightRadius: size * tier.w * 0.5,
              borderBottomLeftRadius: size * tier.w * 0.3, borderBottomRightRadius: size * tier.w * 0.3,
            }}
          />
        </View>
      ))}
      {/* sun highlight */}
      <View style={{
        position: 'absolute', bottom: size * 0.72, left: size * 0.3,
        width: size * 0.2, height: size * 0.12, borderRadius: 99, backgroundColor: '#d6f5b0', opacity: 0.6,
      }} />
    </View>
  );
}

function Bush({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size * 0.72, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ContactShadow size={size} scale={0.7} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        {[0.6, 0.92, 0.66].map((m, i) => (
          <LinearGradient key={i}
            colors={['#6fce63', '#256f2c'] as const}
            style={{ width: size * 0.42, height: size * 0.42 * m, borderRadius: size * 0.21, marginHorizontal: -size * 0.08 }}
          />
        ))}
      </View>
      <View style={{ position: 'absolute', top: 0, left: size * 0.22, width: size * 0.3, height: size * 0.14, borderRadius: 99, backgroundColor: '#c6f0a0aa' }} />
    </View>
  );
}

function Boulder({ size, lava }: { size: number; lava: boolean }) {
  const c: readonly [string, string] = lava ? ['#ff7a3a', '#7a2408'] : ['#b4b4be', '#4a4a55'];
  return (
    <View style={{ width: size, height: size * 0.8, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ContactShadow size={size} scale={0.66} />
      <LinearGradient
        colors={c as any}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
        style={{
          width: size * 0.86, height: size * 0.62,
          borderTopLeftRadius: size * 0.4, borderTopRightRadius: size * 0.34,
          borderBottomLeftRadius: size * 0.16, borderBottomRightRadius: size * 0.2,
        }}
      />
      <View style={{ position: 'absolute', top: size * 0.06, left: size * 0.2, width: size * 0.34, height: size * 0.14, borderRadius: 99, backgroundColor: lava ? '#ffd07a88' : '#ffffff55' }} />
      {lava && (
        <View style={{ position: 'absolute', bottom: size * 0.16, width: size * 0.5, height: size * 0.1, borderRadius: 99, backgroundColor: '#ffd24a', opacity: 0.85 }} />
      )}
    </View>
  );
}

function Crystal({ size, colors }: { size: number; colors: readonly [string, string] }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ContactShadow size={size} scale={0.42} />
      <View style={{
        position: 'absolute', bottom: size * 0.06,
        width: size * 0.7, height: size * 0.16, borderRadius: 99,
        backgroundColor: colors[0], opacity: 0.4,
      }} />
      {[
        { w: 0.3, h: 0.92, rot: '-12deg', dx: -0.16 },
        { w: 0.42, h: 1.0, rot: '4deg', dx: 0.04 },
        { w: 0.26, h: 0.7, rot: '16deg', dx: 0.22 },
      ].map((s, i) => (
        <LinearGradient key={i}
          colors={[lighten(colors[0], 30), colors[1]] as any}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute', bottom: size * 0.1,
            left: size * (0.5 - s.w / 2 + s.dx),
            width: size * s.w, height: size * s.h * 0.7,
            borderTopLeftRadius: size * 0.1, borderTopRightRadius: size * 0.1,
            transform: [{ rotate: s.rot }],
            shadowColor: colors[0], shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
          }}
        />
      ))}
    </View>
  );
}

function Flame({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ContactShadow size={size} scale={0.5} />
      <View style={{ position: 'absolute', bottom: size * 0.06, width: size * 0.56, height: size * 0.14, borderRadius: 99, backgroundColor: '#2a1206' }} />
      <LinearGradient
        colors={['#ffe070', '#ff8a1e', '#cf2e0e'] as const}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute', bottom: size * 0.12, width: size * 0.5, height: size * 0.72,
          borderTopLeftRadius: size * 0.4, borderTopRightRadius: size * 0.3,
          borderBottomLeftRadius: size * 0.22, borderBottomRightRadius: size * 0.22,
        }}
      />
      <View style={{
        position: 'absolute', bottom: size * 0.28, width: size * 0.2, height: size * 0.36,
        borderRadius: size * 0.12, backgroundColor: '#fff2b0', opacity: 0.9,
      }} />
    </View>
  );
}

function Banner({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ContactShadow size={size} scale={0.3} />
      <View style={{ position: 'absolute', bottom: 0, width: size * 0.05, height: size * 0.94, backgroundColor: '#4a3010', borderRadius: 2 }} />
      <View style={{ position: 'absolute', top: 0, width: size * 0.1, height: size * 0.1, borderRadius: 99, backgroundColor: '#ffd24a' }} />
      <LinearGradient
        colors={['#ff7a62', '#a82323'] as const}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }}
        style={{
          position: 'absolute', top: size * 0.1, left: size * 0.52,
          width: size * 0.42, height: size * 0.4,
        }}
      />
      <View style={{
        position: 'absolute', top: size * 0.22, left: size * 0.66,
        width: size * 0.14, height: size * 0.14, borderRadius: 99, backgroundColor: '#ffd24a',
      }} />
    </View>
  );
}

function Tower({ size, variant }: { size: number; variant: 'tower' | 'gate' | 'pillar' }) {
  const W = variant === 'pillar' ? size * 0.34 : size * 0.6;
  const H = variant === 'pillar' ? size * 0.96 : size * 0.86;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ContactShadow size={size} scale={0.62} />
      <View style={{ width: W, height: H, alignItems: 'center' }}>
        <LinearGradient
          colors={['#d8c294', '#8a7448', '#43381c'] as const}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.2 }}
          style={{
            width: W, height: H * 0.86,
            borderTopLeftRadius: variant === 'gate' ? W * 0.5 : 5,
            borderTopRightRadius: variant === 'gate' ? W * 0.5 : 5,
          }}
        />
        {variant === 'tower' && (
          <View style={{ position: 'absolute', top: -H * 0.02, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ width: W * 0.26, height: H * 0.16, backgroundColor: '#6a5836' }} />
            ))}
          </View>
        )}
        {variant !== 'pillar' && (
          <View style={{
            position: 'absolute', bottom: 0, width: W * 0.36, height: H * 0.4,
            backgroundColor: '#160c04', borderTopLeftRadius: W * 0.2, borderTopRightRadius: W * 0.2,
          }} />
        )}
        {variant === 'tower' && (
          <View style={{
            position: 'absolute', top: H * 0.3, width: W * 0.2, height: H * 0.2,
            backgroundColor: '#ffd24a', borderRadius: 2, opacity: 0.92,
            shadowColor: '#ffd24a', shadowOpacity: 1, shadowRadius: 5, shadowOffset: { width: 0, height: 0 },
          }} />
        )}
        {/* edge shading */}
        <View pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, width: W * 0.22, height: H * 0.86, backgroundColor: '#00000033' }} />
      </View>
    </View>
  );
}

// The marquee prop — a multi-tower keep with crenellations, gate and flags.
function Fortress({ size }: { size: number }) {
  const wallW = size * 0.82;
  const wallH = size * 0.42;
  const keepW = size * 0.34;
  const keepH = size * 0.62;
  const sideW = size * 0.2;
  const sideH = size * 0.5;
  const stone: readonly [string, string, string] = ['#d4be90', '#8a7448', '#3e3218'];
  const Crenel = ({ w, parts }: { w: number; parts: number }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: w }}>
      {Array.from({ length: parts }).map((_, i) => (
        <View key={i} style={{ width: w / (parts * 2 - 1), height: size * 0.08, backgroundColor: stone[2] }} />
      ))}
    </View>
  );
  const Flag = ({ left }: { left: number }) => (
    <View style={{ position: 'absolute', left, top: -size * 0.06, alignItems: 'center' }}>
      <View style={{ width: 2, height: size * 0.16, backgroundColor: '#3a2a10' }} />
      <View style={{ position: 'absolute', top: 0, left: 2, width: size * 0.12, height: size * 0.08, backgroundColor: '#cf3623' }} />
    </View>
  );
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ContactShadow size={size} scale={0.86} />
      {/* side towers */}
      {[-1, 1].map((dir) => (
        <View key={dir} style={{
          position: 'absolute', bottom: 0,
          left: size / 2 + dir * (wallW / 2 - sideW * 0.4) - sideW / 2,
          width: sideW, alignItems: 'center',
        }}>
          <Crenel w={sideW} parts={2} />
          <LinearGradient colors={stone as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.3 }}
            style={{ width: sideW, height: sideH }} />
        </View>
      ))}
      {/* wall */}
      <View style={{ position: 'absolute', bottom: 0, alignItems: 'center' }}>
        <Crenel w={wallW} parts={5} />
        <LinearGradient colors={stone as any} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }}
          style={{ width: wallW, height: wallH }} />
        {/* gate */}
        <View style={{
          position: 'absolute', bottom: 0, width: size * 0.2, height: wallH * 0.74,
          backgroundColor: '#140c04', borderTopLeftRadius: size * 0.1, borderTopRightRadius: size * 0.1,
        }} />
        {/* portcullis bars */}
        {[0.32, 0.5, 0.68].map((p) => (
          <View key={p} style={{ position: 'absolute', bottom: 0, left: wallW * p, width: 1.5, height: wallH * 0.7, backgroundColor: '#6a5836' }} />
        ))}
      </View>
      {/* central keep */}
      <View style={{ position: 'absolute', bottom: wallH * 0.4, alignItems: 'center' }}>
        <Crenel w={keepW} parts={3} />
        <LinearGradient colors={stone as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.25 }}
          style={{ width: keepW, height: keepH }} />
        {/* lit windows */}
        <View style={{ position: 'absolute', top: keepH * 0.34, width: keepW * 0.6, flexDirection: 'row', justifyContent: 'space-between' }}>
          {[0, 1].map((i) => (
            <View key={i} style={{
              width: keepW * 0.2, height: keepH * 0.22, backgroundColor: '#ffd24a', borderRadius: 1.5,
              shadowColor: '#ffd24a', shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
            }} />
          ))}
        </View>
        <Flag left={keepW * 0.12} />
        <Flag left={keepW * 0.74} />
      </View>
    </View>
  );
}

function Tomb({ size, variant }: { size: number; variant: 'tomb' | 'skull' | 'altar' }) {
  if (variant === 'skull') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <ContactShadow size={size} scale={0.5} />
        <LinearGradient colors={['#f0e8cc', '#a89c78'] as const}
          style={{
            width: size * 0.62, height: size * 0.58,
            borderTopLeftRadius: size * 0.31, borderTopRightRadius: size * 0.31,
            borderBottomLeftRadius: size * 0.22, borderBottomRightRadius: size * 0.22,
            marginBottom: size * 0.06,
          }}>
          <View style={{ position: 'absolute', top: size * 0.2, left: size * 0.1, width: size * 0.14, height: size * 0.17, backgroundColor: '#1a1208', borderRadius: 99 }} />
          <View style={{ position: 'absolute', top: size * 0.2, right: size * 0.1, width: size * 0.14, height: size * 0.17, backgroundColor: '#1a1208', borderRadius: 99 }} />
          <View style={{ position: 'absolute', bottom: size * 0.06, alignSelf: 'center', width: size * 0.1, height: size * 0.1, backgroundColor: '#1a1208' }} />
        </LinearGradient>
      </View>
    );
  }
  if (variant === 'altar') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <ContactShadow size={size} scale={0.66} />
        <LinearGradient colors={['#8a7a48', '#3a2e0c'] as const}
          style={{ width: size * 0.72, height: size * 0.4, borderRadius: 4 }} />
        <View style={{
          position: 'absolute', bottom: size * 0.34,
          width: size * 0.36, height: size * 0.36, borderRadius: 99, backgroundColor: '#c9a3ff',
          shadowColor: '#c9a3ff', shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
        }} />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ContactShadow size={size} scale={0.54} />
      <LinearGradient colors={['#b4ac98', '#5e564a', '#2a261c'] as const}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.4 }}
        style={{
          width: size * 0.6, height: size * 0.74,
          borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3,
        }} />
      <View style={{ position: 'absolute', top: size * 0.22, width: 3.5, height: size * 0.3, backgroundColor: '#2a261c' }} />
      <View style={{ position: 'absolute', top: size * 0.28, width: size * 0.3, height: 3.5, backgroundColor: '#2a261c' }} />
    </View>
  );
}

function Tent({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ContactShadow size={size} scale={0.7} />
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: size * 0.44, borderRightWidth: size * 0.44, borderBottomWidth: size * 0.66,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#b85a22',
      }} />
      <View style={{ position: 'absolute', right: size * 0.1, bottom: 0, width: 0, height: 0,
        borderLeftWidth: size * 0.44, borderRightWidth: 0, borderBottomWidth: size * 0.66,
        borderLeftColor: 'transparent', borderBottomColor: '#00000033' }} />
      <View style={{ position: 'absolute', bottom: 0, width: size * 0.2, height: size * 0.34, backgroundColor: '#160c04', borderTopLeftRadius: size * 0.1, borderTopRightRadius: size * 0.1 }} />
      <View style={{ position: 'absolute', top: size * 0.16, width: size * 0.1, height: size * 0.1, borderRadius: 99, backgroundColor: '#ffd24a' }} />
    </View>
  );
}

function Cauldron({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <ContactShadow size={size} scale={0.62} />
      <View style={{
        width: size * 0.72, height: size * 0.5, backgroundColor: '#181818',
        borderBottomLeftRadius: size * 0.36, borderBottomRightRadius: size * 0.36,
        borderTopLeftRadius: 4, borderTopRightRadius: 4,
      }} />
      <LinearGradient colors={['#9be86a', '#2a8a2e'] as const}
        style={{ position: 'absolute', bottom: size * 0.34, width: size * 0.66, height: size * 0.12, borderRadius: 99 }} />
      <View style={{ position: 'absolute', bottom: size * 0.42, width: size * 0.2, height: size * 0.2, borderRadius: 99, backgroundColor: '#bff09a', opacity: 0.7 }} />
    </View>
  );
}

// ===========================================================================
const styles = StyleSheet.create({
  frame: { borderRadius: 22, padding: FRAME_PAD, alignSelf: 'center' },
  frameGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 22 },
  frameInner: {
    ...StyleSheet.absoluteFillObject, borderRadius: 22,
    borderWidth: 2, borderColor: '#fff7a055',
  },
  field: {
    borderRadius: 14, overflow: 'hidden', backgroundColor: '#0c1828',
    borderWidth: 2, borderColor: '#000',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject, borderRadius: 12,
    borderWidth: 26, borderColor: '#0000003a',
  },
  outerGlow: {
    ...StyleSheet.absoluteFillObject, borderRadius: 22,
    shadowOpacity: 0.85, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 5,
  },
});

export default React.memo(ArenaBase);

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { HeroClass, Rarity, Element } from '../types';
import { CLASS_COLORS, ELEMENT_COLORS } from '../data/heroes';
import { RARITY_COLORS, RARITY_GLOW } from '../data/equipment';

interface Props {
  size: number;
  heroClass: HeroClass;
  rarity: Rarity;
  icon: string;
  element?: Element;
  seed: number;
  level?: number;
  stars?: number;
  isEnemy?: boolean;
  hpPct?: number;
  manaPct?: number;
  shieldPct?: number;
  selected?: boolean;
  dimmed?: boolean;
  showFrame?: boolean;
  style?: ViewStyle;
}

// Tiny seeded RNG for stable per-hero generation.
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Class silhouettes built from positioned circles/rectangles.
// Each entry is { color: 'class' | hex, shape: 'circle'|'rect', x,y,w,h, opacity }.
type Shape = {
  shape: 'circle' | 'rect' | 'diamond' | 'tri';
  x: number; y: number; w: number; h: number;
  color?: string;          // explicit hex
  cls?: boolean;           // use class color
  alpha?: number;          // 0..1
};

const SILHOUETTES: Record<HeroClass, Shape[]> = {
  // Shoulders + chest + helmet shape, no face (the emoji is the face).
  Warrior: [
    { shape: 'rect', x: 18, y: 60, w: 64, h: 28, cls: true, alpha: 0.9 },
    { shape: 'rect', x: 26, y: 88, w: 48, h: 18, cls: true, alpha: 0.55 },
    { shape: 'circle', x: 14, y: 56, w: 18, h: 18, cls: true, alpha: 0.8 },
    { shape: 'circle', x: 68, y: 56, w: 18, h: 18, cls: true, alpha: 0.8 },
  ],
  Paladin: [
    { shape: 'rect', x: 16, y: 60, w: 68, h: 30, cls: true, alpha: 0.95 },
    { shape: 'rect', x: 22, y: 90, w: 56, h: 18, cls: true, alpha: 0.6 },
    { shape: 'diamond', x: 42, y: 70, w: 16, h: 24, color: '#f9e79f', alpha: 0.9 },
    { shape: 'circle', x: 10, y: 56, w: 20, h: 20, color: '#f9e79f', alpha: 0.6 },
    { shape: 'circle', x: 70, y: 56, w: 20, h: 20, color: '#f9e79f', alpha: 0.6 },
  ],
  Archer: [
    { shape: 'rect', x: 30, y: 60, w: 40, h: 32, cls: true, alpha: 0.85 },
    { shape: 'rect', x: 20, y: 88, w: 60, h: 14, cls: true, alpha: 0.4 },
    { shape: 'rect', x: 6, y: 40, w: 4, h: 60, color: '#bdc3c7', alpha: 0.7 },
    { shape: 'circle', x: 0, y: 36, w: 14, h: 14, color: '#27ae60', alpha: 0.5 },
  ],
  Mage: [
    { shape: 'rect', x: 22, y: 60, w: 56, h: 36, cls: true, alpha: 0.85 },
    { shape: 'tri', x: 20, y: 50, w: 60, h: 24, cls: true, alpha: 0.95 },
    { shape: 'circle', x: 78, y: 30, w: 16, h: 16, color: '#f1c40f', alpha: 0.85 },
    { shape: 'rect', x: 82, y: 36, w: 4, h: 70, color: '#7c5b21', alpha: 0.8 },
  ],
  Rogue: [
    { shape: 'rect', x: 22, y: 58, w: 56, h: 28, cls: true, alpha: 0.9 },
    { shape: 'rect', x: 30, y: 86, w: 40, h: 22, cls: true, alpha: 0.6 },
    { shape: 'tri', x: 30, y: 40, w: 40, h: 26, color: '#0b0b0b', alpha: 0.8 },
    { shape: 'circle', x: 8, y: 70, w: 14, h: 14, color: '#7f8c8d', alpha: 0.7 },
  ],
  Berserker: [
    { shape: 'rect', x: 16, y: 58, w: 68, h: 32, cls: true, alpha: 0.9 },
    { shape: 'circle', x: 14, y: 54, w: 22, h: 22, cls: true, alpha: 0.8 },
    { shape: 'circle', x: 64, y: 54, w: 22, h: 22, cls: true, alpha: 0.8 },
    { shape: 'tri', x: 6, y: 30, w: 22, h: 30, color: '#a93226', alpha: 0.8 },
    { shape: 'tri', x: 72, y: 30, w: 22, h: 30, color: '#a93226', alpha: 0.8 },
  ],
  Cleric: [
    { shape: 'rect', x: 20, y: 60, w: 60, h: 32, cls: true, alpha: 0.85 },
    { shape: 'rect', x: 28, y: 90, w: 44, h: 18, cls: true, alpha: 0.45 },
    { shape: 'rect', x: 45, y: 68, w: 10, h: 26, color: '#f9e79f', alpha: 0.85 },
    { shape: 'rect', x: 36, y: 76, w: 28, h: 10, color: '#f9e79f', alpha: 0.85 },
  ],
  Druid: [
    { shape: 'rect', x: 18, y: 64, w: 64, h: 28, cls: true, alpha: 0.85 },
    { shape: 'tri', x: 14, y: 40, w: 24, h: 26, color: '#27ae60', alpha: 0.7 },
    { shape: 'tri', x: 62, y: 40, w: 24, h: 26, color: '#27ae60', alpha: 0.7 },
    { shape: 'circle', x: 38, y: 92, w: 24, h: 8, color: '#16a085', alpha: 0.7 },
  ],
  Necromancer: [
    { shape: 'rect', x: 22, y: 58, w: 56, h: 36, cls: true, alpha: 0.85 },
    { shape: 'tri', x: 22, y: 48, w: 56, h: 22, color: '#2c0c4e', alpha: 0.95 },
    { shape: 'circle', x: 8, y: 36, w: 14, h: 14, color: '#7f00ff', alpha: 0.7 },
    { shape: 'circle', x: 78, y: 36, w: 14, h: 14, color: '#7f00ff', alpha: 0.7 },
  ],
  Monk: [
    { shape: 'rect', x: 22, y: 60, w: 56, h: 32, cls: true, alpha: 0.85 },
    { shape: 'rect', x: 22, y: 60, w: 56, h: 10, color: '#c0392b', alpha: 0.95 },
    { shape: 'circle', x: 28, y: 90, w: 16, h: 16, cls: true, alpha: 0.7 },
    { shape: 'circle', x: 56, y: 90, w: 16, h: 16, cls: true, alpha: 0.7 },
  ],
};

// Background "scenes" per element (color rings + ambient shapes).
function backgroundFor(element: Element | undefined, isEnemy: boolean) {
  const base = isEnemy ? '#1a0d0d' : '#0d1a14';
  const tint = element ? ELEMENT_COLORS[element] : (isEnemy ? '#5e0e0e' : '#1c4e3d');
  return { base, tint };
}

export default function HeroPortrait({
  size, heroClass, rarity, icon, element, seed,
  level, stars, isEnemy, hpPct = 1, manaPct = 0, shieldPct = 0,
  selected, dimmed, showFrame = true, style,
}: Props) {
  const rng = mulberry32(seed || 1);
  const classColor = CLASS_COLORS[heroClass] ?? '#888';
  const rarityColor = RARITY_COLORS[rarity] ?? '#888';
  const rarityGlow = RARITY_GLOW[rarity] ?? '#88888855';
  const bg = backgroundFor(element, !!isEnemy);

  // Generate decorative speckles based on seed.
  const speckles = Array.from({ length: 6 }, () => ({
    x: rng() * 100,
    y: rng() * 100,
    s: 2 + rng() * 4,
    a: 0.15 + rng() * 0.3,
  }));

  const shapes = SILHOUETTES[heroClass] ?? SILHOUETTES.Warrior;

  // Scale-related sizes.
  const FRAME_W = 4;
  const inner = size - FRAME_W * 2;
  const scale = inner / 100;

  return (
    <View
      style={[
        styles.container,
        {
          width: size, height: size,
          backgroundColor: bg.base,
          borderColor: selected ? '#fff' : rarityColor,
          borderWidth: showFrame ? FRAME_W : 0,
          borderRadius: size * 0.18,
          opacity: dimmed ? 0.45 : 1,
          shadowColor: rarityGlow,
          shadowOpacity: 0.6,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 8,
          elevation: 6,
        },
        style,
      ]}
    >
      {/* Radial-ish gradient using stacked tinted circles */}
      <View style={[styles.fill, { backgroundColor: bg.tint, opacity: 0.18 }]} />
      <View style={[styles.tintRing, {
        width: inner * 0.95, height: inner * 0.95,
        borderRadius: inner * 0.5, top: inner * 0.05, left: inner * 0.025,
        backgroundColor: bg.tint, opacity: 0.22,
      }]} />
      <View style={[styles.tintRing, {
        width: inner * 0.7, height: inner * 0.7,
        borderRadius: inner * 0.35, top: inner * 0.15, left: inner * 0.15,
        backgroundColor: bg.tint, opacity: 0.18,
      }]} />

      {/* Decorative speckles */}
      {speckles.map((s, i) => (
        <View
          key={`sp-${i}`}
          style={{
            position: 'absolute',
            top: s.y * inner / 100,
            left: s.x * inner / 100,
            width: s.s * scale, height: s.s * scale,
            borderRadius: s.s * scale / 2,
            backgroundColor: '#fff',
            opacity: s.a,
          }}
        />
      ))}

      {/* Class silhouette */}
      {shapes.map((sh, i) => {
        const color = sh.color ?? (sh.cls ? classColor : '#fff');
        const left = sh.x * scale;
        const top = sh.y * scale;
        const width = sh.w * scale;
        const height = sh.h * scale;
        const opacity = sh.alpha ?? 0.8;
        if (sh.shape === 'circle') {
          return (
            <View
              key={`s-${i}`}
              style={{
                position: 'absolute', left, top, width, height,
                borderRadius: Math.max(width, height) / 2,
                backgroundColor: color, opacity,
              }}
            />
          );
        }
        if (sh.shape === 'rect') {
          return (
            <View
              key={`s-${i}`}
              style={{
                position: 'absolute', left, top, width, height,
                backgroundColor: color, opacity,
                borderRadius: 2,
              }}
            />
          );
        }
        if (sh.shape === 'diamond') {
          return (
            <View
              key={`s-${i}`}
              style={{
                position: 'absolute', left, top, width, height,
                backgroundColor: color, opacity,
                transform: [{ rotate: '45deg' }],
              }}
            />
          );
        }
        // Triangle via rotated square clipped by overflow:
        return (
          <View
            key={`s-${i}`}
            style={{
              position: 'absolute', left, top, width, height,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: height / 4, left: width / 4,
                width: width * 0.7, height: width * 0.7,
                backgroundColor: color, opacity,
                transform: [{ rotate: '45deg' }],
              }}
            />
          </View>
        );
      })}

      {/* Big emoji as face/identity */}
      <View
        style={{
          position: 'absolute',
          width: inner, height: inner,
          alignItems: 'center', justifyContent: 'center',
          top: -inner * 0.05,
        }}
      >
        <Text style={{ fontSize: inner * 0.45 }}>{icon}</Text>
      </View>

      {/* Bottom info strip: level, hp, mana */}
      <View
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          backgroundColor: '#00000099',
          paddingHorizontal: 4, paddingVertical: 3,
        }}
      >
        {hpPct >= 0 && (
          <View style={{ height: 3, backgroundColor: '#220000', borderRadius: 2, overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.max(0, Math.min(1, hpPct)) * 100}%`,
                height: '100%',
                backgroundColor: isEnemy ? '#e74c3c' : '#27ae60',
              }}
            />
          </View>
        )}
        {manaPct > 0 && (
          <View style={{ height: 2, marginTop: 1, backgroundColor: '#001122', borderRadius: 2, overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.max(0, Math.min(1, manaPct)) * 100}%`,
                height: '100%',
                backgroundColor: '#3498db',
              }}
            />
          </View>
        )}
        {shieldPct > 0 && (
          <View style={{ height: 2, marginTop: 1, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.max(0, Math.min(1, shieldPct)) * 100}%`,
                height: '100%',
                backgroundColor: '#f1c40f',
              }}
            />
          </View>
        )}
      </View>

      {/* Top-left rank badge */}
      {level !== undefined && (
        <View style={[styles.cornerBadge, { top: 2, left: 2, backgroundColor: rarityColor }]}>
          <Text style={[styles.cornerText, { fontSize: Math.max(8, size * 0.11) }]}>Lv{level}</Text>
        </View>
      )}

      {/* Top-right stars */}
      {stars !== undefined && stars > 0 && (
        <View style={[styles.cornerBadge, { top: 2, right: 2, backgroundColor: '#00000099' }]}>
          <Text style={{ color: '#f1c40f', fontSize: Math.max(8, size * 0.1) }}>
            {'★'.repeat(stars)}
          </Text>
        </View>
      )}

      {/* Element marker (bottom-right) */}
      {element && element !== 'physical' && (
        <View
          style={{
            position: 'absolute', bottom: 12, right: 2,
            width: size * 0.16, height: size * 0.16,
            borderRadius: size * 0.08,
            backgroundColor: ELEMENT_COLORS[element] + 'cc',
            justifyContent: 'center', alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: size * 0.11 }}>{ELEMENT_GLYPH[element]}</Text>
        </View>
      )}
    </View>
  );
}

const ELEMENT_GLYPH: Record<Element, string> = {
  physical: '⚔',
  fire: '🔥',
  ice: '❄',
  lightning: '⚡',
  holy: '✨',
  shadow: '🌑',
  nature: '🌿',
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fill: { ...StyleSheet.absoluteFillObject },
  tintRing: { position: 'absolute' },
  cornerBadge: {
    position: 'absolute',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerText: { color: '#fff', fontWeight: '800' },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';

// A SpriteDef is a tiny pixel-art bitmap. `palette` maps single-character
// keys to colors; '.' is reserved for transparency. `rows` is a list of
// equal-length strings, top-to-bottom.
export interface SpriteDef {
  w: number;
  h: number;
  palette: Record<string, string>;
  rows: string[];
}

// Run-length encode each row so the renderer emits ~1 View per color run,
// not one per pixel. A 16×18 sprite typically renders as ~50 Views.
interface Run { x: number; w: number; color: string; }
interface RowRuns { y: number; runs: Run[]; }

function encode(def: SpriteDef): RowRuns[] {
  const out: RowRuns[] = [];
  // Sprite authoring is forgiving: rows shorter than `w` are padded with
  // transparent pixels, rows longer than `w` are truncated.
  for (let y = 0; y < def.h; y++) {
    const raw = def.rows[y] ?? '';
    const row = raw.length >= def.w ? raw.slice(0, def.w) : raw + '.'.repeat(def.w - raw.length);
    const runs: Run[] = [];
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      let j = i + 1;
      while (j < row.length && row[j] === ch) j++;
      if (ch !== '.') {
        const color = def.palette[ch];
        if (color) runs.push({ x: i, w: j - i, color });
      }
      i = j;
    }
    out.push({ y, runs });
  }
  return out;
}

// Cache the RLE so we don't redo it for every render.
const cache = new WeakMap<SpriteDef, RowRuns[]>();
function rle(def: SpriteDef): RowRuns[] {
  let cached = cache.get(def);
  if (!cached) { cached = encode(def); cache.set(def, cached); }
  return cached;
}

interface Props {
  def: SpriteDef;
  /** Pixel size of the rendered sprite (height). Width is derived. */
  size: number;
  /** Mirror horizontally (for enemy facing). */
  flip?: boolean;
  /** Apply a hue tint on top (e.g. element color). 0..1. */
  tint?: string;
  tintOpacity?: number;
}

function SpriteBase({ def, size, flip, tint, tintOpacity = 0.25 }: Props) {
  const pixel = size / def.h;
  const w = pixel * def.w;
  const runs = rle(def);

  return (
    <View
      style={{
        width: w, height: size,
        transform: flip ? [{ scaleX: -1 }] : undefined,
      }}
    >
      {runs.map(({ y, runs: rr }) =>
        rr.map((r, i) => (
          <View
            key={`${y}-${i}`}
            style={{
              position: 'absolute',
              left: r.x * pixel,
              top: y * pixel,
              width: r.w * pixel + 0.5,   // overlap by half a px to avoid seams
              height: pixel + 0.5,
              backgroundColor: r.color,
            }}
          />
        ))
      )}
      {tint && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: tint, opacity: tintOpacity }]}
        />
      )}
    </View>
  );
}

export default React.memo(SpriteBase);

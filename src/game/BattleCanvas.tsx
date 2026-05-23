// Top-level battle canvas. Mounts the Engine, wires gesture handlers
// to the camera, and renders the scene (battlefield + units +
// projectiles + particles + floating numbers + HP bars).
//
// All imports are RN core + this game module. No native deps beyond
// what the rest of the app already uses.

import React, { useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, PanResponder, TouchableOpacity, Animated,
} from 'react-native';
import { hexLayout, HexGrid } from '../utils/hex';
import { MapTheme, Obstacle } from '../types';
import { palette } from '../theme';
import { Engine } from './Engine';
import { themeFor } from './themes';
import { TILT_DEG, Y_SQUASH } from './math';
import Battlefield from './renderers/Battlefield';
import UnitRenderer from './renderers/UnitRenderer';
import ProjectileRenderer from './renderers/ProjectileRenderer';
import ParticleRenderer from './renderers/ParticleRenderer';
import Camera, { CameraHandle } from './Camera';
import { UnitSnapshot } from './types';

interface Props {
  width: number;
  height: number;
  grid: HexGrid;
  theme?: MapTheme;
  obstacles?: Obstacle[];
  units: UnitSnapshot[];
  floats: Array<{ id: string; unitId: string; text: string; color: string; crit?: boolean; fontSize?: number; bornMs: number }>;
  onEngineReady?: (engine: Engine) => void;
}

export default function BattleCanvas({
  width, height, grid, theme, obstacles, units, floats, onEngineReady,
}: Props) {
  const layout = useMemo(() => hexLayout(width, height * 1.2, grid), [width, height, grid]);
  const themeColors = useMemo(() => themeFor(theme), [theme]);

  // Field dimensions (untilted). We let the camera handle the actual
  // viewport sizing; the inner content size is the layout's full
  // extent (with the Y axis squashed by the tilt).
  const contentW = layout.totalW;
  const contentH = layout.totalH * Y_SQUASH + 24; // a little headroom for tall units

  // Engine creation. We use a memo so it persists across re-renders.
  const engineRef = useRef<Engine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new Engine(layout);
  }
  // Push layout updates so resizing keeps everything in sync.
  useEffect(() => {
    engineRef.current?.setLayout(layout);
  }, [layout]);
  // Announce engine to parent once it exists.
  useEffect(() => {
    if (engineRef.current && onEngineReady) onEngineReady(engineRef.current);
  }, [onEngineReady]);
  // Dispose on unmount.
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Snapshot subscription — we re-render when the entity LIST changes
  // (spawn/death/projectile create/destroy). Per-frame motion is on
  // Animated.Values so it doesn't trigger React.
  const [snap, setSnap] = React.useState(() => engineRef.current!.snapshot());
  useEffect(() => {
    if (!engineRef.current) return;
    const unsub = engineRef.current.subscribe(() => {
      setSnap(engineRef.current!.snapshot());
    });
    setSnap(engineRef.current.snapshot());
    return unsub;
  }, []);

  // Per-unit cell size used by the UnitRenderer.
  const cellSize = Math.min(layout.hexW, layout.hexH * Y_SQUASH) * 0.96;

  // -----------------------------------------------------------------
  // Camera gestures
  // -----------------------------------------------------------------
  const cameraRef = useRef<CameraHandle | null>(null);
  const g = useRef({
    mode: 'none' as 'none' | 'pan' | 'pinch',
    startDist: 1,
    lastX: 0,
    lastY: 0,
    lastTap: 0,
  });
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,
    onPanResponderGrant: (evt) => {
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        const dx = (touches[0].locationX ?? 0) - (touches[1].locationX ?? 0);
        const dy = (touches[0].locationY ?? 0) - (touches[1].locationY ?? 0);
        g.current = { mode: 'pinch', startDist: Math.hypot(dx, dy) || 1, lastX: 0, lastY: 0, lastTap: g.current.lastTap };
      } else {
        const now = Date.now();
        if (now - g.current.lastTap < 280) {
          cameraRef.current?.reset();
        }
        g.current = {
          mode: 'pan',
          startDist: 1,
          lastX: touches[0]?.locationX ?? 0,
          lastY: touches[0]?.locationY ?? 0,
          lastTap: now,
        };
      }
    },
    onPanResponderMove: (evt) => {
      const touches = evt.nativeEvent.touches;
      const cam = cameraRef.current;
      if (!cam) return;
      if (touches.length >= 2 && g.current.mode === 'pinch') {
        const dx = (touches[0].locationX ?? 0) - (touches[1].locationX ?? 0);
        const dy = (touches[0].locationY ?? 0) - (touches[1].locationY ?? 0);
        const dist = Math.hypot(dx, dy) || 1;
        const fx = ((touches[0].locationX ?? 0) + (touches[1].locationX ?? 0)) / 2;
        const fy = ((touches[0].locationY ?? 0) + (touches[1].locationY ?? 0)) / 2;
        cam.pinch(dist / g.current.startDist, fx, fy);
        g.current.startDist = dist;
      } else if (touches.length === 1 && g.current.mode === 'pan') {
        const x = touches[0].locationX ?? 0;
        const y = touches[0].locationY ?? 0;
        cam.pan(x - g.current.lastX, y - g.current.lastY);
        g.current.lastX = x;
        g.current.lastY = y;
      }
    },
    onPanResponderRelease: () => { g.current.mode = 'none'; },
    onPanResponderTerminate: () => { g.current.mode = 'none'; },
  })).current;

  return (
    <View style={[styles.frame, { width, height, backgroundColor: themeColors.skyTop }]} {...responder.panHandlers}>
      <Camera
        ref={cameraRef}
        width={width}
        height={height}
        contentWidth={contentW}
        contentHeight={contentH}
        shakeX={engineRef.current.shakeX}
        shakeY={engineRef.current.shakeY}
      >
        {/* The tilted ground is conceptually one layer. We render
            the battlefield directly (its tile positions already
            account for the squash), then a sibling layer for units
            and effects. */}
        <View style={{ width: contentW, height: contentH }}>
          <Battlefield
            layout={layout}
            theme={themeColors}
            obstacles={obstacles}
            width={contentW}
            height={contentH}
          />

          {/* Particles — behind units, but on top of terrain. */}
          {snap.particles.map((p) => (
            <ParticleRenderer key={p.id} p={p} />
          ))}

          {/* Units — sorted back-to-front by the engine. */}
          {snap.units.map((u) => (
            <UnitRenderer key={u.id} unit={u} cellSize={cellSize} />
          ))}

          {/* Projectiles — in front of units. */}
          {snap.projectiles.map((p) => (
            <ProjectileRenderer key={p.id} proj={p} />
          ))}

          {/* HP bars — billboarded above each unit, follow the
              unit's Animated.tx/ty. */}
          {snap.units.map((u) => {
            const snapU = units.find((x) => x.id === u.id);
            if (!snapU) return null;
            return (
              <HpBar
                key={`hp_${u.id}`}
                anims={u.anims}
                hp={snapU.hp}
                maxHp={snapU.maxHp}
                mana={snapU.mana}
                maxMana={snapU.maxMana}
                isPlayer={u.isPlayer}
                alive={u.alive}
                name={snapU.name}
                icon={snapU.icon}
                cellSize={cellSize}
                statuses={snapU.statuses}
              />
            );
          })}

          {/* Floating damage numbers — also follow their owning
              unit's tx/ty so they drift relative to current
              animated position. */}
          {floats.map((f) => {
            const unit = snap.units.find((u) => u.id === f.unitId);
            if (!unit) return null;
            return (
              <FloatNumber
                key={f.id}
                anims={unit.anims}
                text={f.text}
                color={f.color}
                fontSize={f.fontSize ?? 16}
                crit={!!f.crit}
                cellSize={cellSize}
                bornMs={f.bornMs}
              />
            );
          })}
        </View>
      </Camera>

      {/* Reset camera button */}
      <TouchableOpacity
        style={styles.resetBtn}
        activeOpacity={0.8}
        onPress={() => cameraRef.current?.reset()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.resetIcon}>⊕</Text>
      </TouchableOpacity>

      <View pointerEvents="none" style={styles.hint}>
        <Text style={styles.hintText}>✥ drag · pinch · 2-tap reset</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------
// HP/MP bar that follows a unit's Animated position. The bar itself
// re-renders only when hp/mana React props change; positional motion
// stays on the native side.
// ---------------------------------------------------------------------
function HpBar({
  anims, hp, maxHp, mana, maxMana, isPlayer, alive, name, icon, cellSize, statuses,
}: {
  anims: any; hp: number; maxHp: number; mana: number; maxMana: number;
  isPlayer: boolean; alive: boolean; name: string; icon: string; cellSize: number;
  statuses: Array<{ type: string }>;
}) {
  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const mpPct = maxMana > 0 ? Math.max(0, Math.min(1, mana / maxMana)) : 0;
  const tone = isPlayer ? palette.blue : palette.red;
  const fill = hpPct < 0.35 ? '#ff5d3c' : hpPct < 0.65 ? '#ffae3a' : '#5ef07a';
  const w = cellSize * 0.95;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -w / 2,
        top: -cellSize * 0.65,
        width: w,
        alignItems: 'center',
        transform: [{ translateX: anims.tx }, { translateY: anims.ty }],
        opacity: alive ? 1 : 0.4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 1 }}>
        <Text style={{
          color: tone, fontSize: 9, fontWeight: '800',
          textShadowColor: '#000a', textShadowRadius: 2, letterSpacing: 0.3,
        }} numberOfLines={1}>
          {icon} {name}
        </Text>
      </View>
      <View style={{
        width: '100%', height: 5, borderRadius: 3,
        backgroundColor: '#0009', borderWidth: 1, borderColor: '#0008',
        overflow: 'hidden',
      }}>
        <View style={{ width: `${hpPct * 100}%`, height: '100%', backgroundColor: fill }} />
      </View>
      {maxMana > 0 && (
        <View style={{
          width: '100%', height: 3, borderRadius: 2,
          backgroundColor: '#0008', overflow: 'hidden', marginTop: 1,
        }}>
          <View style={{ width: `${mpPct * 100}%`, height: '100%', backgroundColor: '#5fa4ff' }} />
        </View>
      )}
      {statuses.length > 0 && (
        <View style={{ flexDirection: 'row', marginTop: 1, gap: 1 }}>
          {statuses.slice(0, 4).map((s, i) => (
            <Text key={i} style={{ fontSize: 8 }}>{STATUS_ICON[s.type] ?? '•'}</Text>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const STATUS_ICON: Record<string, string> = {
  poison: '☠', burn: '🔥', stun: '💫', freeze: '❄', slow: '🐌', regen: '💚',
  shield: '🛡', taunt: '😡', rage: '💢', bleed: '🩸', blind: '🌑', silence: '🤐', fortify: '🪨',
};

// ---------------------------------------------------------------------
// Floating damage number — drifts upward and fades over ~1.1s. Position
// is anchored to a unit's anims, plus a small upward drift driven by
// its own Animated.Value.
// ---------------------------------------------------------------------
function FloatNumber({
  anims, text, color, fontSize, crit, cellSize, bornMs,
}: { anims: any; text: string; color: string; fontSize: number; crit: boolean; cellSize: number; bornMs: number }) {
  const drift = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(drift, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 1020, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);
  const dy = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -38] });
  return (
    <Animated.Text
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -40,
        top: -cellSize * 0.85,
        width: 80,
        textAlign: 'center',
        color,
        fontSize,
        fontWeight: crit ? '900' : '800',
        textShadowColor: crit ? color : '#0009',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: crit ? 8 : 4,
        opacity,
        transform: [{ translateX: anims.tx }, { translateY: Animated.add(anims.ty, dy) }],
      }}
    >
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: palette.goldDeep,
    alignSelf: 'center',
  },
  resetBtn: {
    position: 'absolute',
    top: 8, right: 8,
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#1a1430dd',
    borderWidth: 1.5, borderColor: palette.goldDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  resetIcon: { color: palette.gold, fontSize: 17, fontWeight: '900', marginTop: -1 },
  hint: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    left: 0, right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: '#ffffff88',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    backgroundColor: '#0009',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
});

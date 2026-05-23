// 3D battle canvas — mounts an Expo GLView, builds the engine on the
// resulting context, wires gesture handlers (drag/pan rotates the
// orbit camera, pinch zooms it, double-tap resets it), and overlays
// HP bars + floating damage numbers as absolutely-positioned RN Views
// so text stays crisp.
//
// React doesn't manage the Three.js scene at all — the engine owns it
// and we only re-render the overlay at ~30 fps to read the latest
// projected positions for each unit.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, TouchableOpacity, PixelRatio } from 'react-native';
import { GLView } from 'expo-gl';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Engine } from '../../game3d/Engine';
import { HexGrid } from '../../utils/hex';
import { MapTheme, Obstacle } from '../../types';
import { palette } from '../../theme';
import { UnitSnapshot } from '../../game3d/types';

const OVERLAY_FPS = 30;
const OVERLAY_INTERVAL_MS = 1000 / OVERLAY_FPS;

interface Props {
  width: number;
  height: number;
  grid: HexGrid;
  theme?: MapTheme;
  obstacles?: Obstacle[];
  units: UnitSnapshot[];
  onEngineReady?: (engine: Engine) => void;
}

export default function BattleCanvas3D({
  width, height, grid, theme, obstacles, units, onEngineReady,
}: Props) {
  const engineRef = useRef<Engine | null>(null);
  const [overlayTick, setOverlayTick] = useState(0);
  const lastOverlayT = useRef(0);

  // Latest projected screen positions, captured by the rAF loop and read
  // by the render below. We keep them in a ref to avoid setState-per-
  // frame; the setOverlayTick triggers re-render at 30fps which then
  // reads from this ref.
  const screenPositions = useRef<Array<{
    id: string; x: number; y: number;
    isPlayer: boolean; alive: boolean;
    hp: number; maxHp: number; mana: number; maxMana: number;
  }>>([]);
  const floatingNumbers = useRef<Array<{
    id: string; text: string; color: string; fontSize: number;
    crit?: boolean; x: number; y: number; alpha: number;
  }>>([]);

  // --------------------------------------------------------------
  // GL context creation — happens once when the GLView mounts.
  // --------------------------------------------------------------
  const onContextCreate = useCallback(async (gl: ExpoWebGLRenderingContext) => {
    const pixelRatio = PixelRatio.get();
    const engine = new Engine({
      gl: gl as unknown as WebGLRenderingContext,
      width: gl.drawingBufferWidth / pixelRatio,
      height: gl.drawingBufferHeight / pixelRatio,
      pixelRatio,
      grid,
      theme,
      obstacles,
    });
    engineRef.current = engine;
    engine.start();
    onEngineReady?.(engine);

    // Kick off the overlay refresh loop. We drive it from a rAF so it
    // stays in sync with the engine's frame schedule.
    const tick = (now: number) => {
      if (!engineRef.current) return;
      if (now - lastOverlayT.current >= OVERLAY_INTERVAL_MS) {
        lastOverlayT.current = now;
        screenPositions.current = engineRef.current.unitScreenPositions();
        floatingNumbers.current = engineRef.current.consumeFloatingForOverlay(1.1);
        setOverlayTick((t) => (t + 1) & 0xffff);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [grid, theme, obstacles, onEngineReady]);

  // --------------------------------------------------------------
  // Lifecycle: dispose engine on unmount. The screen always re-mounts
  // when entering battle, so this is sufficient.
  // --------------------------------------------------------------
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // --------------------------------------------------------------
  // Gestures. Single-finger drag rotates the orbit camera; two-finger
  // pinch zooms it. Double-tap resets.
  // --------------------------------------------------------------
  const g = useRef({
    mode: 'none' as 'none' | 'drag' | 'pinch',
    lastX: 0, lastY: 0,
    pinchStart: 0,
    lastTap: 0,
  });
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        const dx = (touches[0].locationX ?? 0) - (touches[1].locationX ?? 0);
        const dy = (touches[0].locationY ?? 0) - (touches[1].locationY ?? 0);
        g.current.mode = 'pinch';
        g.current.pinchStart = Math.hypot(dx, dy) || 1;
      } else {
        g.current.mode = 'drag';
        g.current.lastX = touches[0]?.locationX ?? 0;
        g.current.lastY = touches[0]?.locationY ?? 0;
        const now = Date.now();
        if (now - g.current.lastTap < 280) {
          engineRef.current?.cameraRig.reset();
        }
        g.current.lastTap = now;
      }
    },
    onPanResponderMove: (evt) => {
      const touches = evt.nativeEvent.touches;
      const eng = engineRef.current;
      if (!eng) return;
      if (touches.length >= 2 && g.current.mode === 'pinch') {
        const dx = (touches[0].locationX ?? 0) - (touches[1].locationX ?? 0);
        const dy = (touches[0].locationY ?? 0) - (touches[1].locationY ?? 0);
        const dist = Math.hypot(dx, dy) || 1;
        const scale = g.current.pinchStart / dist; // <1 zoom in, >1 zoom out
        eng.cameraRig.zoom(scale);
        g.current.pinchStart = dist;
      } else if (touches.length === 1 && g.current.mode === 'drag') {
        const x = touches[0].locationX ?? 0;
        const y = touches[0].locationY ?? 0;
        eng.cameraRig.drag(x - g.current.lastX, y - g.current.lastY);
        g.current.lastX = x;
        g.current.lastY = y;
      }
    },
    onPanResponderRelease: () => { g.current.mode = 'none'; },
    onPanResponderTerminate: () => { g.current.mode = 'none'; },
  })).current;

  return (
    <View style={[styles.root, { width, height }]} {...responder.panHandlers}>
      <GLView
        style={{ width, height }}
        onContextCreate={onContextCreate}
      />

      {/* Overlay layer — HP/MP bars + floating numbers + name labels.
          Pointer events are disabled so the GL gesture handler sees
          the touches underneath. */}
      <View pointerEvents="none" style={[styles.overlay, { width, height }]}>
        {screenPositions.current.map((p) => {
          const u = units.find((x) => x.id === p.id);
          if (!u) return null;
          const hpPct = Math.max(0, Math.min(1, p.hp / Math.max(1, p.maxHp)));
          const mpPct = u.maxMana > 0 ? Math.max(0, Math.min(1, p.mana / u.maxMana)) : 0;
          const tone = u.isPlayer ? palette.blue : palette.red;
          return (
            <View
              key={p.id}
              style={[
                styles.barWrap,
                { left: p.x - 28, top: p.y - 56, opacity: p.alive ? 1 : 0.35 },
              ]}
            >
              <View style={styles.nameRow}>
                <Text style={[styles.unitName, { color: tone }]} numberOfLines={1}>
                  {u.icon} {u.name}
                </Text>
              </View>
              <View style={styles.hpBg}>
                <View style={[
                  styles.hpFill,
                  {
                    width: `${hpPct * 100}%`,
                    backgroundColor: hpPct < 0.35 ? '#ff5d3c' : hpPct < 0.65 ? '#ffae3a' : '#5ef07a',
                  },
                ]} />
              </View>
              {u.maxMana > 0 && (
                <View style={styles.mpBg}>
                  <View style={[styles.mpFill, { width: `${mpPct * 100}%` }]} />
                </View>
              )}
              {u.statuses.length > 0 && (
                <View style={styles.statusRow}>
                  {u.statuses.slice(0, 4).map((s, i) => (
                    <Text key={i} style={styles.statusIcon}>{STATUS_ICON[s.type] ?? '•'}</Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {floatingNumbers.current.map((f) => (
          <Text
            key={f.id}
            style={[
              styles.floatNum,
              {
                left: f.x - 32,
                top: f.y - 24,
                color: f.color,
                opacity: f.alpha,
                fontSize: f.fontSize,
                fontWeight: f.crit ? '900' : '800',
                textShadowRadius: f.crit ? 8 : 4,
                textShadowColor: f.crit ? f.color : '#0009',
              },
            ]}
          >
            {f.text}
          </Text>
        ))}
      </View>

      {/* Reset camera button — corner pill, doesn't intercept gestures
          unless tapped exactly on it. */}
      <TouchableOpacity
        style={styles.resetBtn}
        activeOpacity={0.8}
        onPress={() => engineRef.current?.cameraRig.reset()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.resetIcon}>⊕</Text>
      </TouchableOpacity>
    </View>
  );
}

const STATUS_ICON: Record<string, string> = {
  poison: '☠', burn: '🔥', stun: '💫', freeze: '❄', slow: '🐌', regen: '💚',
  shield: '🛡', taunt: '😡', rage: '💢', bleed: '🩸', blind: '🌑', silence: '🤐', fortify: '🪨',
};

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: palette.goldDeep,
    alignSelf: 'center',
    backgroundColor: '#0a0816',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  barWrap: {
    position: 'absolute',
    width: 56,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  unitName: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textShadowColor: '#000a',
    textShadowRadius: 3,
  },
  hpBg: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#000a',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0008',
  },
  hpFill: { height: '100%' },
  mpBg: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#0008',
    marginTop: 1,
    overflow: 'hidden',
  },
  mpFill: { height: '100%', backgroundColor: '#5fa4ff' },
  statusRow: { flexDirection: 'row', marginTop: 1, gap: 1 },
  statusIcon: { fontSize: 8 },
  floatNum: {
    position: 'absolute',
    width: 64,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
  },
  resetBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1a1430dd',
    borderWidth: 1.5,
    borderColor: palette.goldDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetIcon: {
    color: palette.gold,
    fontSize: 17,
    fontWeight: '900',
    marginTop: -1,
  },
});

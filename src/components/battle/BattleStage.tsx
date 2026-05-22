import React, { useImperativeHandle, useMemo, useRef } from 'react';
import { View, Animated, PanResponder, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { palette } from '../../theme';

// A pinch-to-zoom + drag-to-pan viewport for the battlefield.
//
// Built entirely on core React Native (PanResponder + Animated) so it adds
// no native dependency and the APK keeps building. Single-finger drags pan,
// two-finger gestures pinch-zoom around the pinch midpoint. Taps fall
// through to children untouched (the responder is only claimed once the
// finger actually moves), so placement screens still work when wrapped.

export interface BattleStageHandle {
  reset: () => void;
}

interface Props {
  contentWidth: number;
  contentHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  showReset?: boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function touchDistance(touches: any[]): number {
  const [a, b] = touches;
  const dx = (a.locationX ?? a.pageX) - (b.locationX ?? b.pageX);
  const dy = (a.locationY ?? a.pageY) - (b.locationY ?? b.pageY);
  return Math.sqrt(dx * dx + dy * dy) || 1;
}

function touchMidpoint(touches: any[]): { x: number; y: number } {
  const [a, b] = touches;
  return {
    x: ((a.locationX ?? 0) + (b.locationX ?? 0)) / 2,
    y: ((a.locationY ?? 0) + (b.locationY ?? 0)) / 2,
  };
}

const BattleStage = React.forwardRef<BattleStageHandle, Props>(function BattleStage(
  { contentWidth, contentHeight, viewportWidth, viewportHeight, children,
    minScale = 0.6, maxScale = 3.4, showReset = true },
  ref,
) {
  // Translation clamps so the map can't be dragged off into empty space.
  const clampTx = (t: number, s: number): number => {
    const scaled = contentWidth * s;
    if (scaled <= viewportWidth) return (viewportWidth - scaled) / 2;
    return clamp(t, viewportWidth - scaled, 0);
  };
  const clampTy = (t: number, s: number): number => {
    const scaled = contentHeight * s;
    if (scaled <= viewportHeight) return (viewportHeight - scaled) / 2;
    return clamp(t, viewportHeight - scaled, 0);
  };

  // Initial view: fit the whole map into the viewport (never above 1×).
  const fit = Math.min(viewportWidth / contentWidth, viewportHeight / contentHeight) || 1;
  const initScale = clamp(Math.min(1, fit), minScale, maxScale);
  const initTx = clampTx(0, initScale);
  const initTy = clampTy(0, initScale);

  const scale = useRef(new Animated.Value(initScale)).current;
  const tx = useRef(new Animated.Value(initTx)).current;
  const ty = useRef(new Animated.Value(initTy)).current;

  // Plain-number mirrors of the animated values (PanResponder reads these).
  const cur = useRef({ scale: initScale, tx: initTx, ty: initTy });
  const g = useRef({
    mode: 'none' as 'none' | 'pan' | 'pinch',
    startDist: 1, startScale: 1, startTx: 0, startTy: 0,
    focalX: 0, focalY: 0,
  });

  const apply = (s: number, x: number, y: number) => {
    cur.current = { scale: s, tx: x, ty: y };
    scale.setValue(s);
    tx.setValue(x);
    ty.setValue(y);
  };

  const resetView = () => {
    cur.current = { scale: initScale, tx: initTx, ty: initTy };
    Animated.parallel([
      Animated.spring(scale, { toValue: initScale, useNativeDriver: true, friction: 8, tension: 60 }),
      Animated.spring(tx, { toValue: initTx, useNativeDriver: true, friction: 8, tension: 60 }),
      Animated.spring(ty, { toValue: initTy, useNativeDriver: true, friction: 8, tension: 60 }),
    ]).start();
  };

  useImperativeHandle(ref, () => ({ reset: resetView }), [initScale, initTx, initTy]);

  const responder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Claim the gesture only once a real drag/pinch begins — taps pass through.
      onMoveShouldSetPanResponder: (evt, gs) =>
        evt.nativeEvent.touches.length >= 2 || Math.abs(gs.dx) > 6 || Math.abs(gs.dy) > 6,
      onMoveShouldSetPanResponderCapture: (evt, gs) =>
        evt.nativeEvent.touches.length >= 2 || Math.abs(gs.dx) > 6 || Math.abs(gs.dy) > 6,
      onPanResponderGrant: () => { g.current.mode = 'none'; },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          const dist = touchDistance(touches);
          const mid = touchMidpoint(touches);
          if (g.current.mode !== 'pinch') {
            g.current = {
              mode: 'pinch',
              startDist: dist,
              startScale: cur.current.scale,
              startTx: cur.current.tx,
              startTy: cur.current.ty,
              focalX: mid.x, focalY: mid.y,
            };
            return;
          }
          const next = clamp(
            g.current.startScale * (dist / g.current.startDist),
            minScale, maxScale,
          );
          // Keep the content point under the pinch focal point fixed.
          const f = g.current;
          const ratio = next / f.startScale;
          const nx = f.focalX - (f.focalX - f.startTx) * ratio;
          const ny = f.focalY - (f.focalY - f.startTy) * ratio;
          apply(next, clampTx(nx, next), clampTy(ny, next));
        } else if (touches.length === 1) {
          if (g.current.mode !== 'pan') {
            g.current = {
              ...g.current,
              mode: 'pan',
              startTx: cur.current.tx,
              startTy: cur.current.ty,
              focalX: touches[0].locationX ?? 0,
              focalY: touches[0].locationY ?? 0,
            };
            return;
          }
          const dx = (touches[0].locationX ?? 0) - g.current.focalX;
          const dy = (touches[0].locationY ?? 0) - g.current.focalY;
          const s = cur.current.scale;
          apply(s, clampTx(g.current.startTx + dx, s), clampTy(g.current.startTy + dy, s));
        }
      },
      onPanResponderRelease: () => { g.current.mode = 'none'; },
      onPanResponderTerminate: () => { g.current.mode = 'none'; },
    }),
    [contentWidth, contentHeight, viewportWidth, viewportHeight, minScale, maxScale],
  );

  return (
    <View
      style={[styles.viewport, { width: viewportWidth, height: viewportHeight }]}
      {...responder.panHandlers}
    >
      <Animated.View
        style={{
          width: contentWidth,
          height: contentHeight,
          transformOrigin: 'top left',
          transform: [{ translateX: tx }, { translateY: ty }, { scale }],
        } as any}
      >
        {children}
      </Animated.View>

      {showReset && (
        <TouchableOpacity
          style={styles.resetBtn}
          activeOpacity={0.8}
          onPress={resetView}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.resetIcon}>⊕</Text>
        </TouchableOpacity>
      )}
      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>✥ drag · pinch to zoom</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  viewport: { overflow: 'hidden', alignSelf: 'center' },
  resetBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#1a1430dd', borderWidth: 1.5, borderColor: palette.goldDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  resetIcon: { color: palette.gold, fontSize: 17, fontWeight: '900', marginTop: -1 },
  hint: {
    position: 'absolute', bottom: 6, alignSelf: 'center',
    backgroundColor: '#0009', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2,
  },
  hintText: { color: '#ffffff88', fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
});

export default BattleStage;

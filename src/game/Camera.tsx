// Camera viewport: pan + pinch-zoom wrapper around the battlefield.
// All transform values live on Animated.Values driven on the native
// side, so dragging the world stays smooth even while the battle
// engine is mutating dozens of unit positions per second.
//
// Inputs come from a PanResponder living above the camera (in
// BattleCanvas) so the engine never sees gesture events directly.

import React, { useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

export interface CameraHandle {
  pan(dx: number, dy: number): void;
  pinch(scale: number, focalX: number, focalY: number): void;
  reset(): void;
}

interface Props {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  shakeX?: Animated.Value;
  shakeY?: Animated.Value;
  children: React.ReactNode;
}

const Camera = React.forwardRef<CameraHandle, Props>(function Camera(
  { width, height, contentWidth, contentHeight, shakeX, shakeY, children },
  ref,
) {
  // Initial fit so the whole board is visible.
  const fitScale = Math.min(width / contentWidth, height / contentHeight, 1.0);
  const initScale = Math.max(0.55, fitScale);
  const initTx = (width - contentWidth * initScale) / 2;
  const initTy = (height - contentHeight * initScale) / 2;

  const tx = useRef(new Animated.Value(initTx)).current;
  const ty = useRef(new Animated.Value(initTy)).current;
  const scale = useRef(new Animated.Value(initScale)).current;
  // Plain-number mirrors used by the controller to clamp.
  const state = useRef({ tx: initTx, ty: initTy, scale: initScale });

  const MIN_SCALE = 0.45;
  const MAX_SCALE = 2.6;

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const clampTx = (t: number, s: number) => {
    const scaled = contentWidth * s;
    if (scaled <= width) return (width - scaled) / 2;
    return clamp(t, width - scaled, 0);
  };
  const clampTy = (t: number, s: number) => {
    const scaled = contentHeight * s;
    if (scaled <= height) return (height - scaled) / 2;
    return clamp(t, height - scaled, 0);
  };

  const apply = (s: number, x: number, y: number) => {
    const cs = clamp(s, MIN_SCALE, MAX_SCALE);
    const cx = clampTx(x, cs);
    const cy = clampTy(y, cs);
    state.current = { scale: cs, tx: cx, ty: cy };
    scale.setValue(cs);
    tx.setValue(cx);
    ty.setValue(cy);
  };

  React.useImperativeHandle(ref, () => ({
    pan(dx, dy) {
      const s = state.current.scale;
      apply(s, state.current.tx + dx, state.current.ty + dy);
    },
    pinch(s, fx, fy) {
      // Keep the focal point fixed under the user's fingers.
      const prev = state.current.scale;
      const next = clamp(prev * s, MIN_SCALE, MAX_SCALE);
      const ratio = next / prev;
      const nx = fx - (fx - state.current.tx) * ratio;
      const ny = fy - (fy - state.current.ty) * ratio;
      apply(next, nx, ny);
    },
    reset() {
      Animated.parallel([
        Animated.spring(scale, { toValue: initScale, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.spring(tx, { toValue: initTx, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.spring(ty, { toValue: initTy, friction: 8, tension: 60, useNativeDriver: true }),
      ]).start();
      state.current = { tx: initTx, ty: initTy, scale: initScale };
    },
  }), [initScale, initTx, initTy, contentWidth, contentHeight, width, height]);

  // Optional shake — added on top of the pan translation.
  const finalTx = shakeX ? Animated.add(tx, shakeX) : tx;
  const finalTy = shakeY ? Animated.add(ty, shakeY) : ty;

  return (
    <View style={[styles.viewport, { width, height }]}>
      <Animated.View
        style={{
          width: contentWidth,
          height: contentHeight,
          transformOrigin: 'top left' as any,
          transform: [{ translateX: finalTx }, { translateY: finalTy }, { scale }],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
});

export default Camera;

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
    alignSelf: 'center',
  },
});

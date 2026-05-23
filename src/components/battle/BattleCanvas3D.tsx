// Runtime-only wrapper around the heavy 3D battle canvas. The
// Impl file imports expo-gl, expo-three, three, and the entire
// src/game3d module — touching any of them evaluates expo-gl's
// `requireNativeModule('ExpoGL')` call. If the host APK predates
// the native expo-gl link that call throws on import and brings
// down the whole bundle at app boot.
//
// To make app boot bulletproof regardless of Metro's bundling
// optimizations (which can ignore React.lazy in dev builds), this
// wrapper's top-level imports are React + RN only. We dynamically
// `require('./BattleCanvas3DImpl')` inside a mount effect — that
// `require` is never hoisted, so the heavy modules only evaluate
// when the user actually enters a battle.
//
// If the dynamic require throws (typically the missing native
// ExpoGL module), we render a clear "rebuild required" panel
// inline instead of bubbling the crash up.

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../../theme';
import type { UnitSnapshot } from '../../game3d/types';
import type { HexGrid } from '../../utils/hex';
import type { MapTheme, Obstacle } from '../../types';
import type { Engine } from '../../game3d/Engine';

interface Props {
  width: number;
  height: number;
  grid: HexGrid;
  theme?: MapTheme;
  obstacles?: Obstacle[];
  units: UnitSnapshot[];
  onEngineReady?: (engine: Engine) => void;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; Impl: React.ComponentType<Props> }
  | { kind: 'error'; error: Error };

export default function BattleCanvas3D(props: Props) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    try {
      // Dynamic require — Metro leaves runtime require() calls alone, so
      // the heavy 3D modules are only evaluated here on mount, never at
      // bundle boot. If any transitive module throws (most commonly
      // expo-gl's missing-native-module error) we catch it below.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('./BattleCanvas3DImpl');
      if (!cancelled) {
        setState({ kind: 'ready', Impl: mod.default ?? mod });
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      // eslint-disable-next-line no-console
      console.warn('[BattleCanvas3D] failed to load impl:', e?.message);
      if (!cancelled) setState({ kind: 'error', error: e });
    }
    return () => { cancelled = true; };
  }, []);

  if (state.kind === 'loading') {
    return (
      <View style={[styles.frame, { width: props.width, height: props.height }]}>
        <ActivityIndicator size="large" color={palette.gold} />
        <Text style={styles.loadText}>Loading battlefield…</Text>
      </View>
    );
  }

  if (state.kind === 'error') {
    return <NativeModuleErrorPanel width={props.width} height={props.height} error={state.error} />;
  }

  const Impl = state.Impl;
  return <Impl {...props} />;
}

// Inline error UI. We tell the user exactly what to do — almost
// every plausible failure here is the missing native expo-gl link,
// which the user fixes with `expo prebuild` + a fresh native build.
function NativeModuleErrorPanel({
  width, height, error,
}: { width: number; height: number; error: Error }) {
  const msg = error?.message || String(error);
  const needsRebuild = /Cannot find native module|ExpoGL|requireNativeModule|UnavailabilityError/i.test(msg);
  return (
    <View style={[styles.frame, styles.errorFrame, { width, height }]}>
      <Text style={styles.icon}>⚠️</Text>
      {needsRebuild ? (
        <>
          <Text style={styles.title}>Native rebuild required</Text>
          <Text style={styles.body}>
            The 3D battlefield needs <Text style={styles.code}>expo-gl</Text> linked into
            the native build. Run:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeLine}>npx expo prebuild --clean</Text>
            <Text style={styles.codeLine}>npx expo run:android</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>Battlefield failed to load</Text>
          <Text style={styles.body} numberOfLines={4}>{msg}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#0e0a1a',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: palette.goldDeep,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: 18,
  },
  errorFrame: {
    borderColor: palette.redDeep,
  },
  loadText: {
    color: palette.textSoft,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  icon: { fontSize: 32, marginBottom: 6 },
  title: {
    color: palette.gold,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    color: palette.textSoft,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  code: {
    fontWeight: '900',
    color: palette.gold,
  },
  codeBlock: {
    backgroundColor: '#000a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff2',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  codeLine: {
    color: '#bef07a',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});

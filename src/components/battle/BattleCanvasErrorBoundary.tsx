// Inline error boundary specifically for the 3D battle canvas. The
// canvas depends on expo-gl's native module — if the host APK was
// built before that dep was added, expo-gl throws "Cannot find
// native module 'ExpoGL'" at import time and the lazy chunk rejects.
//
// We catch that here, detect the specific error, and render a
// friendly "rebuild your native side" panel instead of letting the
// whole BattleScreen die.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette } from '../../theme';

interface Props {
  width: number;
  height: number;
  children: React.ReactNode;
  onBack: () => void;
}
interface State {
  error: Error | null;
}

export default class BattleCanvasErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.warn('[BattleCanvas]', error?.message, error?.stack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const msg = error.message || String(error);
    const needsRebuild = /Cannot find native module|ExpoGL|requireNativeModule|UnavailabilityError/i.test(msg);

    return (
      <View style={[styles.panel, { width: this.props.width, height: this.props.height }]}>
        <Text style={styles.icon}>⚠️</Text>
        {needsRebuild ? (
          <>
            <Text style={styles.title}>Native rebuild required</Text>
            <Text style={styles.body}>
              The 3D battlefield needs <Text style={styles.code}>expo-gl</Text> linked into
              the native build. From the project root run:
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeLine}>npx expo prebuild --clean</Text>
              <Text style={styles.codeLine}>npx expo run:android</Text>
            </View>
            <Text style={styles.bodySmall}>(or run:ios for iOS)</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Battlefield failed to load</Text>
            <Text style={styles.body} numberOfLines={4}>{msg}</Text>
          </>
        )}
        <TouchableOpacity style={styles.btn} onPress={this.props.onBack} activeOpacity={0.85}>
          <Text style={styles.btnText}>BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#160f24',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: palette.redDeep,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    alignSelf: 'center',
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
  bodySmall: {
    color: palette.textMute,
    fontSize: 10,
    marginBottom: 10,
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
    marginBottom: 8,
  },
  codeLine: {
    color: '#bef07a',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  btn: {
    marginTop: 6,
    backgroundColor: palette.panelDeep,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.goldDark,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  btnText: {
    color: palette.gold,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

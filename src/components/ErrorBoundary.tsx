import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { GButton, ScreenBackground, Panel } from './ui';
import { palette } from '../theme';

interface Props {
  children: React.ReactNode;
  onRecover?: () => void;
}
interface State {
  error: Error | null;
}

// Catches render-time exceptions so a bad battle/screen can't hard-crash the
// app. Offers a one-tap recovery back to a safe screen.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.warn('[ErrorBoundary]', error?.message, error?.stack);
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onRecover?.();
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.fill}>
          <ScreenBackground />
          <View style={styles.center}>
            <Text style={styles.emoji}>🛡️</Text>
            <Text style={styles.title}>Something broke</Text>
            <Text style={styles.sub}>
              The battle hit an unexpected snag. Your progress is safe — tap below to return to base.
            </Text>
            <Panel style={{ width: '100%', marginVertical: 16 }}>
              <ScrollView style={{ maxHeight: 140 }}>
                <Text style={styles.err}>{this.state.error.message}</Text>
              </ScrollView>
            </Panel>
            <GButton label="Return to Base" variant="gold" wide onPress={this.reset} />
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: palette.bgBot },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: { color: palette.gold, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  sub: { color: palette.textSoft, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  err: { color: palette.red, fontSize: 12, fontFamily: 'monospace' },
});

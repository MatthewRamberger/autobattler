import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bar } from './ui';
import { palette } from '../theme';

interface Props {
  label: string;
  value: number;
  max: number;
  color: string;
}

export default function StatBar({ label, value, max, color }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Bar pct={value / max} colors={[color, color]} height={9} style={styles.track} />
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  label: { width: 30, color: palette.textMute, fontSize: 11, fontWeight: '700' },
  track: { flex: 1, marginHorizontal: 8 },
  value: { width: 38, color: palette.text, fontSize: 11, textAlign: 'right', fontWeight: '700' },
});

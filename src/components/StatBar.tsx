import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  value: number;
  max: number;
  color: string;
}

export default function StatBar({ label, value, max, color }: Props) {
  const pct = Math.min(1, value / max);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  label: { width: 28, color: '#aaa', fontSize: 11, fontWeight: '600' },
  track: { flex: 1, height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  fill: { height: '100%', borderRadius: 4 },
  value: { width: 36, color: '#fff', fontSize: 11, textAlign: 'right' },
});

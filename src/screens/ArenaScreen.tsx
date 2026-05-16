import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useGameStore, generateArenaWave } from '../store/gameStore';
import HeroPortrait from '../components/HeroPortrait';
import { Screen, TopBar, Panel, GButton, Plate, palette, spacing } from '../components/ui';

export default function ArenaScreen() {
  const { setScreen, arenaWave, arenaBestWave, setArenaWave, setCurrentLevel } = useGameStore();
  const preview = generateArenaWave(arenaWave);

  return (
    <Screen>
      <TopBar
        title="ARENA"
        onBack={() => setScreen('home')}
        right={<View style={styles.best}><Text style={styles.bestText}>★ {arenaBestWave}</Text></View>}
      />
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <Panel glow={palette.purple} style={{ alignItems: 'center' }}>
          <Text style={styles.waveLabel}>CURRENT WAVE</Text>
          <Text style={styles.waveNum}>{arenaWave}</Text>
          <Text style={styles.waveDesc}>Enemies scale each wave. Win to advance — a loss resets to wave 1.</Text>
          <Plate style={styles.rewards}>
            <Text style={styles.reward}>🪙 {30 + arenaWave * 15}</Text>
            <Text style={styles.reward}>⭐ {20 + arenaWave * 10}</Text>
            <Text style={styles.reward}>💎 2</Text>
          </Plate>
          <Text style={styles.previewTitle}>ENEMY PREVIEW</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
            {preview.map((e, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <HeroPortrait size={50} heroClass={e.heroClass} rarity="common" icon={e.icon}
                  element={e.element ?? 'physical'} seed={e.name.charCodeAt(0) + i} isEnemy level={e.level} stars={e.stars} />
                <Text style={styles.pName}>{e.heroClass}</Text>
              </View>
            ))}
          </ScrollView>
        </Panel>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.lg }}>
          <GButton label="↺ Reset" variant="purple" style={{ flex: 1 }}
            onPress={() => Alert.alert('Reset wave?', 'Restart from wave 1.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => setArenaWave(1) },
            ])} />
          <GButton label={`⚔ Fight Wave ${arenaWave}`} variant="red" style={{ flex: 2 }}
            onPress={() => { setCurrentLevel(-1); setScreen('battle-prep'); }} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  best: { backgroundColor: palette.panelDeep, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: palette.purpleDeep },
  bestText: { color: palette.purple, fontWeight: '900', fontSize: 12 },
  waveLabel: { color: palette.textMute, fontSize: 11, letterSpacing: 2, fontWeight: '800' },
  waveNum: { color: palette.purple, fontSize: 66, fontWeight: '900', marginVertical: 2 },
  waveDesc: { color: palette.textMute, fontSize: 11, textAlign: 'center', marginBottom: 14, lineHeight: 16 },
  rewards: { flexDirection: 'row', gap: 18, marginBottom: 16 },
  reward: { color: palette.gold, fontSize: 14, fontWeight: '800' },
  previewTitle: { color: palette.textMute, fontSize: 10, letterSpacing: 2, marginBottom: 8, fontWeight: '800' },
  pName: { color: palette.textMute, fontSize: 9, marginTop: 3, fontWeight: '700' },
});

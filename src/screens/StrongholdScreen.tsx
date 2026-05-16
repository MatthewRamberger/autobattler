import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { STRONGHOLD_BUILDINGS } from '../data/stronghold';
import { Screen, TopBar, Panel, GButton, Bar, CurrencyBar, palette, spacing } from '../components/ui';
import { gradients } from '../theme';

export default function StrongholdScreen() {
  const { setScreen, stronghold, upgradeStronghold, gold, gems } = useGameStore();
  return (
    <Screen>
      <TopBar title="STRONGHOLD" onBack={() => setScreen('home')} right={<CurrencyBar gold={gold} gems={gems} />} />
      <Text style={styles.help}>🏰 Permanent base upgrades — bonuses apply to every battle.</Text>
      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        {STRONGHOLD_BUILDINGS.map((b) => {
          const lvl = stronghold[b.id] ?? 0;
          const max = lvl >= b.maxLevel;
          const cost = b.costFor(lvl);
          const can = !max && gold >= cost.gold && (!cost.gems || gems >= cost.gems);
          return (
            <Panel key={b.id} style={{ marginBottom: spacing.md }}>
              <View style={styles.row}>
                <Text style={styles.icon}>{b.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{b.name} · Lv {lvl}/{b.maxLevel}</Text>
                  <Text style={styles.desc}>{b.description}</Text>
                  <Bar pct={lvl / b.maxLevel} colors={gradients.banner} height={7} style={{ marginTop: 6 }} />
                  <Text style={styles.effect}>Now: {b.effect(lvl)}</Text>
                  {!max && (
                    <Text style={styles.next}>
                      Next: {b.effect(lvl + 1)} · 🪙{cost.gold}{cost.gems ? ` 💎${cost.gems}` : ''}
                    </Text>
                  )}
                </View>
                <GButton small disabled={!can} variant={max ? 'purple' : 'gold'}
                  label={max ? 'MAX' : 'Upgrade'}
                  onPress={() => {
                    if (!can) { Alert.alert('Cannot afford', `Need 🪙${cost.gold}${cost.gems ? ` 💎${cost.gems}` : ''}.`); return; }
                    upgradeStronghold(b.id);
                  }} />
              </View>
            </Panel>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  help: { color: palette.textMute, fontSize: 11, paddingHorizontal: 16, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 32 },
  name: { color: palette.text, fontSize: 14, fontWeight: '800' },
  desc: { color: palette.textMute, fontSize: 11, marginTop: 2 },
  effect: { color: palette.green, fontSize: 11, marginTop: 4, fontWeight: '700' },
  next: { color: palette.purple, fontSize: 10, marginTop: 2, fontWeight: '700' },
});

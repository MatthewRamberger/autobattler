import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { STRONGHOLD_BUILDINGS } from '../data/stronghold';

export default function StrongholdScreen() {
  const { setScreen, stronghold, upgradeStronghold, gold, gems } = useGameStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>STRONGHOLD</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.gold}>💰 {gold}</Text>
          <Text style={[styles.gold, { color: '#bb8fce' }]}>💎 {gems}</Text>
        </View>
      </View>

      <Text style={styles.help}>
        Permanent base upgrades. Bonuses apply to every battle.
      </Text>

      <ScrollView contentContainerStyle={{ padding: 10 }}>
        {STRONGHOLD_BUILDINGS.map((b) => {
          const lvl = stronghold[b.id] ?? 0;
          const max = lvl >= b.maxLevel;
          const cost = b.costFor(lvl);
          const can = !max && gold >= cost.gold && (!cost.gems || gems >= cost.gems);
          return (
            <View key={b.id} style={styles.card}>
              <Text style={styles.icon}>{b.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{b.name} · Lv {lvl}/{b.maxLevel}</Text>
                <Text style={styles.desc}>{b.description}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(lvl / b.maxLevel) * 100}%` }]} />
                </View>
                <Text style={styles.effect}>Current: {b.effect(lvl)}</Text>
                {!max && (
                  <Text style={styles.next}>
                    Next: {b.effect(lvl + 1)} · {cost.gold}💰{cost.gems ? ` + ${cost.gems}💎` : ''}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.btn, !can && styles.btnDisabled]}
                disabled={!can}
                onPress={() => {
                  if (max) { Alert.alert('Maxed', 'This building is already maxed.'); return; }
                  if (!can) { Alert.alert('Cannot afford', `Need ${cost.gold} gold${cost.gems ? ` and ${cost.gems} gems` : ''}.`); return; }
                  upgradeStronghold(b.id);
                }}
              >
                <Text style={[styles.btnText, !can && { color: '#555' }]}>
                  {max ? 'MAX' : 'Upgrade'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 13 },
  title: { color: '#f39c12', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  gold: { color: '#f1c40f', fontWeight: '700', fontSize: 13 },
  help: { color: '#666', fontSize: 11, padding: 10 },
  card: {
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 12,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#333',
  },
  icon: { fontSize: 32 },
  name: { color: '#fff', fontSize: 14, fontWeight: '800' },
  desc: { color: '#888', fontSize: 11, marginTop: 2 },
  track: { height: 4, backgroundColor: '#222', borderRadius: 2, marginTop: 5, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#f39c12' },
  effect: { color: '#27ae60', fontSize: 11, marginTop: 4 },
  next: { color: '#7c83fd', fontSize: 10, marginTop: 2 },
  btn: { backgroundColor: '#f39c12', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  btnDisabled: { backgroundColor: '#1a1a2a' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});

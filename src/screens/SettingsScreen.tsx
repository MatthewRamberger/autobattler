import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { Screen, TopBar, Panel, SectionTitle, palette } from '../components/ui';

export default function SettingsScreen() {
  const { setScreen, settings, updateSettings, battleSpeed, setBattleSpeed } = useGameStore();

  return (
    <Screen>
      <TopBar title="SETTINGS" onBack={() => setScreen('home')} />
      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        <Panel>
          <SectionTitle>BATTLE</SectionTitle>
          <View style={styles.row}>
            <Text style={styles.label}>Default speed</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {([1, 2, 4] as const).map((s) => (
                <TouchableOpacity key={s} onPress={() => setBattleSpeed(s)}
                  style={[styles.speed, battleSpeed === s && styles.speedOn]}>
                  <Text style={[styles.speedText, battleSpeed === s && styles.speedTextOn]}>{s}×</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Toggle label="Particle effects" desc="Floating damage numbers and hit flashes."
            value={settings.particles} onChange={(v) => updateSettings({ particles: v })} />
          <Toggle label="Reduce motion" desc="Tone down movement & shake."
            value={settings.reduceMotion} onChange={(v) => updateSettings({ reduceMotion: v })} />
          <Toggle label="Auto fast-forward" desc="Skip animations after the first kill."
            value={settings.autoFastForward} onChange={(v) => updateSettings({ autoFastForward: v })} />
          <Toggle label="Turn-by-turn" desc="Pause after every unit's action — tap NEXT to advance."
            value={settings.turnByTurn} onChange={(v) => updateSettings({ turnByTurn: v })} />
        </Panel>
      </ScrollView>
    </Screen>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={() => onChange(!value)} activeOpacity={0.8}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {desc && <Text style={styles.desc}>{desc}</Text>}
      </View>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ffffff12' },
  label: { color: palette.text, fontSize: 13, fontWeight: '700' },
  desc: { color: palette.textMute, fontSize: 11, marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ffffff12' },
  toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: '#0007', padding: 3, justifyContent: 'center', borderWidth: 1, borderColor: '#0008' },
  toggleOn: { backgroundColor: palette.greenDeep },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  knobOn: { alignSelf: 'flex-end' },
  speed: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: palette.panelDeep, borderWidth: 1.5, borderColor: '#0007' },
  speedOn: { backgroundColor: palette.purpleDeep, borderColor: palette.purple },
  speedText: { color: palette.textMute, fontSize: 13, fontWeight: '800' },
  speedTextOn: { color: '#fff' },
});

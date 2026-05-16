import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function SettingsScreen() {
  const { setScreen, settings, updateSettings, battleSpeed, setBattleSpeed } = useGameStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>SETTINGS</Text>
        <View />
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <Section title="BATTLE">
          <Row label="Default speed">
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {([1, 2, 4] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.speedBtn, battleSpeed === s && styles.speedActive]}
                  onPress={() => setBattleSpeed(s)}
                >
                  <Text style={[styles.speedText, battleSpeed === s && styles.speedTextActive]}>{s}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Row>
          <Toggle
            label="Particle effects"
            description="Floating damage numbers and hit flashes."
            value={settings.particles}
            onChange={(v) => updateSettings({ particles: v })}
          />
          <Toggle
            label="Reduce motion"
            description="Tone down position animations & shake."
            value={settings.reduceMotion}
            onChange={(v) => updateSettings({ reduceMotion: v })}
          />
          <Toggle
            label="Auto fast-forward"
            description="Skip animations after the first kill."
            value={settings.autoFastForward}
            onChange={(v) => updateSettings({ autoFastForward: v })}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={() => onChange(!value)} activeOpacity={0.8}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 13 },
  title: { color: '#7c83fd', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  section: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 12, marginBottom: 10 },
  sectionTitle: { color: '#555', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  rowLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  rowDesc: { color: '#666', fontSize: 11, marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#333', padding: 2, justifyContent: 'center' },
  toggleOn: { backgroundColor: '#27ae60' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  knobOn: { alignSelf: 'flex-end' },
  speedBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, backgroundColor: '#1a1a2a', borderWidth: 1, borderColor: '#333' },
  speedActive: { backgroundColor: '#7c83fd33', borderColor: '#7c83fd' },
  speedText: { color: '#888', fontSize: 12, fontWeight: '700' },
  speedTextActive: { color: '#7c83fd' },
});

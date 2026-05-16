import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { ABILITIES } from '../data/abilities';
import { CLASS_COLORS, CLASS_DESCRIPTIONS } from '../data/heroes';
import { RARITY_COLORS } from '../data/equipment';
import HeroPortrait from '../components/HeroPortrait';

type Tab = 'heroes' | 'enemies' | 'classes' | 'abilities';

export default function CodexScreen() {
  const { setScreen, heroes } = useGameStore();
  const [tab, setTab] = useState<Tab>('heroes');

  // Build enemy roster across all levels (deduped by name).
  const enemyMap: Record<string, { name: string; heroClass: string; icon: string; element?: string; maxLevel: number; appearsIn: string[] }> = {};
  for (const lv of LEVELS) {
    const allEnemies = [...lv.enemies, ...(lv.waves ?? []).flat()];
    for (const e of allEnemies) {
      const key = e.name;
      if (!enemyMap[key]) {
        enemyMap[key] = { name: e.name, heroClass: e.heroClass, icon: e.icon, element: e.element, maxLevel: e.level, appearsIn: [lv.name] };
      } else {
        enemyMap[key].maxLevel = Math.max(enemyMap[key].maxLevel, e.level);
        if (!enemyMap[key].appearsIn.includes(lv.name)) enemyMap[key].appearsIn.push(lv.name);
      }
    }
  }
  const enemies = Object.values(enemyMap);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>CODEX</Text>
        <View />
      </View>

      <View style={styles.tabRow}>
        {(['heroes', 'enemies', 'classes', 'abilities'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {tab === 'heroes' && Object.values(heroes).map((h) => (
          <View key={h.id} style={styles.card}>
            <HeroPortrait
              size={64}
              heroClass={h.heroClass}
              rarity={h.rarity}
              icon={h.icon}
              element={h.baseStats.element}
              seed={h.portraitSeed}
              stars={h.stars}
              dimmed={!h.unlocked}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardName, { color: RARITY_COLORS[h.rarity] }]}>
                {h.unlocked ? h.name : '???'}
              </Text>
              <Text style={styles.cardMeta}>
                {h.heroClass} · {h.baseStats.element} · {h.rarity}
              </Text>
              {h.unlocked && (
                <Text style={styles.cardDesc}>{h.description}</Text>
              )}
            </View>
          </View>
        ))}

        {tab === 'enemies' && enemies.map((e) => (
          <View key={e.name} style={styles.card}>
            <HeroPortrait
              size={56}
              heroClass={e.heroClass as any}
              rarity="common"
              icon={e.icon}
              element={(e.element ?? 'physical') as any}
              seed={e.name.charCodeAt(0) * 37}
              isEnemy
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardName, { color: '#e74c3c' }]}>{e.name}</Text>
              <Text style={styles.cardMeta}>{e.heroClass} · {e.element ?? 'physical'}</Text>
              <Text style={styles.cardDesc}>Max level seen: {e.maxLevel}</Text>
              <Text style={styles.cardSmall}>Appears in: {e.appearsIn.join(', ')}</Text>
            </View>
          </View>
        ))}

        {tab === 'classes' && Object.entries(CLASS_DESCRIPTIONS).map(([cls, desc]) => (
          <View key={cls} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: CLASS_COLORS[cls] ?? '#888' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardName, { color: CLASS_COLORS[cls] ?? '#fff' }]}>{cls}</Text>
              <Text style={styles.cardDesc}>{desc}</Text>
            </View>
          </View>
        ))}

        {tab === 'abilities' && Object.values(ABILITIES).map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.abilityIcon}>{a.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{a.name}</Text>
              <Text style={styles.cardMeta}>{a.manaCost} MP · {a.cooldownTicks}t CD · {a.element}</Text>
              <Text style={styles.cardDesc}>{a.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 13 },
  title: { color: '#16a085', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  tabRow: { flexDirection: 'row', padding: 8, gap: 4 },
  tab: { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: '#1e1e2e', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  tabActive: { backgroundColor: '#16a08522', borderColor: '#16a085' },
  tabText: { color: '#666', fontSize: 10, fontWeight: '600' },
  tabTextActive: { color: '#16a085' },
  list: { padding: 10 },
  card: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#2a2a3e' },
  cardName: { fontSize: 14, fontWeight: '800' },
  cardMeta: { color: '#888', fontSize: 10, marginTop: 2 },
  cardDesc: { color: '#aaa', fontSize: 11, marginTop: 4, lineHeight: 14 },
  cardSmall: { color: '#666', fontSize: 9, marginTop: 3 },
  abilityIcon: { fontSize: 28, width: 40, textAlign: 'center' },
});

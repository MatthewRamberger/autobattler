import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useGameStore, getHeroEffectiveStats } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { ABILITIES } from '../data/abilities';
import { CLASS_COLORS, CLASS_DESCRIPTIONS } from '../data/heroes';
import { RARITY_COLORS } from '../data/equipment';
import HeroPortrait from '../components/HeroPortrait';

type Tab = 'heroes' | 'enemies' | 'classes' | 'abilities' | 'compare';

export default function CodexScreen() {
  const store = useGameStore();
  const { setScreen, heroes } = store;
  const [tab, setTab] = useState<Tab>('heroes');
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

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
        {(['heroes', 'enemies', 'classes', 'abilities', 'compare'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.slice(0, 4).toUpperCase()}</Text>
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

        {tab === 'compare' && (
          <CompareTab
            heroes={heroes}
            store={store}
            a={compareA} b={compareB}
            setA={setCompareA} setB={setCompareB}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CompareTab({ heroes, store, a, b, setA, setB }: any) {
  const unlocked = Object.values(heroes).filter((h: any) => h.unlocked);
  const heroA = a ? heroes[a] : null;
  const heroB = b ? heroes[b] : null;
  const statsA = heroA ? getHeroEffectiveStats(heroA.id, store) : null;
  const statsB = heroB ? getHeroEffectiveStats(heroB.id, store) : null;

  return (
    <View>
      <Text style={compareStyles.label}>HERO A</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={compareStyles.picker}>
        {unlocked.map((h: any) => (
          <TouchableOpacity key={h.id} onPress={() => setA(h.id === a ? null : h.id)} style={[compareStyles.pickerItem, a === h.id && compareStyles.picked]}>
            <HeroPortrait size={42} heroClass={h.heroClass} rarity={h.rarity} icon={h.icon} element={h.baseStats.element} seed={h.portraitSeed} showFrame={false} />
            <Text style={compareStyles.pickerName}>{h.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={compareStyles.label}>HERO B</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={compareStyles.picker}>
        {unlocked.map((h: any) => (
          <TouchableOpacity key={h.id} onPress={() => setB(h.id === b ? null : h.id)} style={[compareStyles.pickerItem, b === h.id && compareStyles.picked]}>
            <HeroPortrait size={42} heroClass={h.heroClass} rarity={h.rarity} icon={h.icon} element={h.baseStats.element} seed={h.portraitSeed} showFrame={false} />
            <Text style={compareStyles.pickerName}>{h.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {statsA && statsB && (
        <View style={compareStyles.compareCard}>
          <View style={compareStyles.compareHeader}>
            <Text style={[compareStyles.compareName, { color: '#27ae60' }]}>{heroA.name}</Text>
            <Text style={compareStyles.vs}>vs</Text>
            <Text style={[compareStyles.compareName, { color: '#3498db' }]}>{heroB.name}</Text>
          </View>
          {[
            ['HP', statsA.maxHp, statsB.maxHp],
            ['ATK', statsA.attack, statsB.attack],
            ['DEF', statsA.defense, statsB.defense],
            ['SPD', statsA.speed, statsB.speed],
            ['CRIT%', Math.round(statsA.critRate * 100), Math.round(statsB.critRate * 100)],
            ['DODGE%', Math.round(statsA.dodge * 100), Math.round(statsB.dodge * 100)],
            ['MP', statsA.maxMana, statsB.maxMana],
            ['POWER', statsA.power, statsB.power],
          ].map(([label, va, vb], i) => {
            const aWin = (va as number) > (vb as number);
            const bWin = (vb as number) > (va as number);
            return (
              <View key={i} style={compareStyles.compareRow}>
                <Text style={[compareStyles.colA, aWin && compareStyles.winA]}>{va}</Text>
                <Text style={compareStyles.colMid}>{label}</Text>
                <Text style={[compareStyles.colB, bWin && compareStyles.winB]}>{vb}</Text>
              </View>
            );
          })}
        </View>
      )}
      {!statsA || !statsB ? (
        <Text style={compareStyles.hint}>Pick two unlocked heroes to compare side-by-side.</Text>
      ) : null}
    </View>
  );
}

const compareStyles = StyleSheet.create({
  label: { color: '#555', fontSize: 10, letterSpacing: 2, marginTop: 8, marginBottom: 4 },
  picker: { gap: 6 },
  pickerItem: { alignItems: 'center', padding: 4, borderRadius: 6, borderWidth: 1, borderColor: 'transparent' },
  picked: { borderColor: '#7c83fd' },
  pickerName: { color: '#888', fontSize: 9, marginTop: 2, maxWidth: 50, textAlign: 'center' },
  compareCard: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 12, marginTop: 12 },
  compareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  compareName: { fontSize: 14, fontWeight: '800', flex: 1, textAlign: 'center' },
  vs: { color: '#444', fontSize: 11, paddingHorizontal: 8 },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#2a2a3e' },
  colA: { color: '#aaa', fontSize: 14, fontWeight: '600', width: 60, textAlign: 'left' },
  colMid: { color: '#666', fontSize: 11, flex: 1, textAlign: 'center' },
  colB: { color: '#aaa', fontSize: 14, fontWeight: '600', width: 60, textAlign: 'right' },
  winA: { color: '#27ae60', fontWeight: '900' },
  winB: { color: '#3498db', fontWeight: '900' },
  hint: { color: '#555', fontSize: 11, textAlign: 'center', padding: 20 },
});

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

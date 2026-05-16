import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useGameStore, getHeroEffectiveStats } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import { ABILITIES } from '../data/abilities';
import { CLASS_COLORS, CLASS_DESCRIPTIONS } from '../data/heroes';
import HeroPortrait from '../components/HeroPortrait';
import { Screen, TopBar, Panel, palette, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

type Tab = 'heroes' | 'enemies' | 'classes' | 'abilities' | 'compare';

export default function CodexScreen() {
  const store = useGameStore();
  const { setScreen, heroes } = store;
  const [tab, setTab] = useState<Tab>('heroes');
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

  const enemyMap: Record<string, { name: string; heroClass: string; icon: string; element?: string; maxLevel: number; appearsIn: string[] }> = {};
  for (const lv of LEVELS) {
    for (const e of [...lv.enemies, ...(lv.waves ?? []).flat()]) {
      if (!enemyMap[e.name]) enemyMap[e.name] = { name: e.name, heroClass: e.heroClass, icon: e.icon, element: e.element, maxLevel: e.level, appearsIn: [lv.name] };
      else {
        enemyMap[e.name].maxLevel = Math.max(enemyMap[e.name].maxLevel, e.level);
        if (!enemyMap[e.name].appearsIn.includes(lv.name)) enemyMap[e.name].appearsIn.push(lv.name);
      }
    }
  }
  const enemies = Object.values(enemyMap);

  return (
    <Screen>
      <TopBar title="CODEX" onBack={() => setScreen('home')} />
      <View style={styles.tabRow}>
        {(['heroes', 'enemies', 'classes', 'abilities', 'compare'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t.slice(0, 4).toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        {tab === 'heroes' && Object.values(heroes).map((h) => {
          const g = rarityGradient[h.rarity] ?? rarityGradient.common;
          return (
            <Panel key={h.id} style={styles.card}>
              <View style={styles.cardRow}>
                <HeroPortrait size={60} heroClass={h.heroClass} rarity={h.rarity} icon={h.icon}
                  element={h.baseStats.element} seed={h.portraitSeed} stars={h.stars} dimmed={!h.unlocked} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: g[0] }]}>{h.unlocked ? h.name : '???'}</Text>
                  <Text style={styles.meta}>{h.heroClass} · {h.baseStats.element} · {h.rarity}</Text>
                  {h.unlocked && <Text style={styles.desc}>{h.description}</Text>}
                </View>
              </View>
            </Panel>
          );
        })}

        {tab === 'enemies' && enemies.map((e) => (
          <Panel key={e.name} style={styles.card}>
            <View style={styles.cardRow}>
              <HeroPortrait size={54} heroClass={e.heroClass as any} rarity="common" icon={e.icon}
                element={(e.element ?? 'physical') as any} seed={e.name.charCodeAt(0) * 37} isEnemy showFrame={false} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: palette.red }]}>{e.name}</Text>
                <Text style={styles.meta}>{e.heroClass} · {e.element ?? 'physical'} · max Lv {e.maxLevel}</Text>
                <Text style={styles.small}>Appears in: {e.appearsIn.join(', ')}</Text>
              </View>
            </View>
          </Panel>
        ))}

        {tab === 'classes' && Object.entries(CLASS_DESCRIPTIONS).map(([cls, d]) => (
          <Panel key={cls} style={styles.card}>
            <View style={[styles.cardRow, { borderLeftWidth: 4, borderLeftColor: CLASS_COLORS[cls] ?? '#888', paddingLeft: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: CLASS_COLORS[cls] ?? '#fff' }]}>{cls}</Text>
                <Text style={styles.desc}>{d}</Text>
              </View>
            </View>
          </Panel>
        ))}

        {tab === 'abilities' && Object.values(ABILITIES).map((a) => (
          <Panel key={a.id} style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.abilityIcon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: palette.gold }]}>{a.name}</Text>
                <Text style={styles.meta}>{a.manaCost} MP · {a.cooldownTicks}t CD · {a.element}</Text>
                <Text style={styles.desc}>{a.description}</Text>
              </View>
            </View>
          </Panel>
        ))}

        {tab === 'compare' && (
          <CompareTab heroes={heroes} store={store} a={compareA} b={compareB} setA={setCompareA} setB={setCompareB} />
        )}
      </ScrollView>
    </Screen>
  );
}

function CompareTab({ heroes, store, a, b, setA, setB }: any) {
  const unlocked = Object.values(heroes).filter((h: any) => h.unlocked);
  const heroA = a ? heroes[a] : null;
  const heroB = b ? heroes[b] : null;
  const statsA = heroA ? getHeroEffectiveStats(heroA.id, store) : null;
  const statsB = heroB ? getHeroEffectiveStats(heroB.id, store) : null;

  const Picker = ({ sel, set }: { sel: string | null; set: (id: string | null) => void }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
      {unlocked.map((h: any) => (
        <TouchableOpacity key={h.id} onPress={() => set(h.id === sel ? null : h.id)}
          style={[cs.pick, sel === h.id && cs.picked]}>
          <HeroPortrait size={42} heroClass={h.heroClass} rarity={h.rarity} icon={h.icon}
            element={h.baseStats.element} seed={h.portraitSeed} showFrame={false} />
          <Text style={cs.pickName} numberOfLines={1}>{h.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View>
      <Text style={cs.label}>HERO A</Text>
      <Picker sel={a} set={setA} />
      <Text style={cs.label}>HERO B</Text>
      <Picker sel={b} set={setB} />
      {statsA && statsB ? (
        <Panel style={{ marginTop: 12 }}>
          <View style={cs.head}>
            <Text style={[cs.cName, { color: palette.green }]}>{heroA.name}</Text>
            <Text style={cs.vs}>VS</Text>
            <Text style={[cs.cName, { color: palette.blue }]}>{heroB.name}</Text>
          </View>
          {[
            ['HP', statsA.maxHp, statsB.maxHp], ['ATK', statsA.attack, statsB.attack],
            ['DEF', statsA.defense, statsB.defense], ['SPD', statsA.speed, statsB.speed],
            ['CRIT%', Math.round(statsA.critRate * 100), Math.round(statsB.critRate * 100)],
            ['DODGE%', Math.round(statsA.dodge * 100), Math.round(statsB.dodge * 100)],
            ['MP', statsA.maxMana, statsB.maxMana], ['POWER', statsA.power, statsB.power],
          ].map(([label, va, vb], i) => (
            <View key={i} style={cs.row}>
              <Text style={[cs.colA, (va as number) > (vb as number) && cs.winA]}>{va}</Text>
              <Text style={cs.colMid}>{label}</Text>
              <Text style={[cs.colB, (vb as number) > (va as number) && cs.winB]}>{vb}</Text>
            </View>
          ))}
        </Panel>
      ) : (
        <Text style={cs.hint}>Pick two unlocked heroes to compare.</Text>
      )}
    </View>
  );
}

const cs = StyleSheet.create({
  label: { color: palette.gold, fontSize: 10, letterSpacing: 2, marginTop: 8, marginBottom: 4, fontWeight: '800' },
  pick: { alignItems: 'center', padding: 4, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', width: 56 },
  picked: { borderColor: palette.gold },
  pickName: { color: palette.textMute, fontSize: 8, marginTop: 2, textAlign: 'center' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cName: { fontSize: 14, fontWeight: '900', flex: 1, textAlign: 'center' },
  vs: { color: palette.textDim, fontSize: 11, paddingHorizontal: 8, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#ffffff12' },
  colA: { color: palette.textSoft, fontSize: 14, fontWeight: '700', width: 60 },
  colMid: { color: palette.textMute, fontSize: 11, flex: 1, textAlign: 'center', fontWeight: '700' },
  colB: { color: palette.textSoft, fontSize: 14, fontWeight: '700', width: 60, textAlign: 'right' },
  winA: { color: palette.green, fontWeight: '900' },
  winB: { color: palette.blue, fontWeight: '900' },
  hint: { color: palette.textDim, fontSize: 11, textAlign: 'center', padding: 20 },
});

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 4, paddingBottom: 4 },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 7, backgroundColor: palette.panelDeep, alignItems: 'center', borderWidth: 1.5, borderColor: '#0007' },
  tabOn: { backgroundColor: palette.greenDeep, borderColor: palette.green },
  tabText: { color: palette.textMute, fontSize: 10, fontWeight: '800' },
  tabTextOn: { color: '#fff' },
  card: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 14, fontWeight: '900' },
  meta: { color: palette.textMute, fontSize: 10, marginTop: 2, fontWeight: '600' },
  desc: { color: palette.textSoft, fontSize: 11, marginTop: 4, lineHeight: 15 },
  small: { color: palette.textDim, fontSize: 9, marginTop: 3 },
  abilityIcon: { fontSize: 28, width: 42, textAlign: 'center' },
});

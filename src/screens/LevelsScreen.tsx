import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import HeroPortrait from '../components/HeroPortrait';
import {
  Screen, TopBar, Panel, GButton, Tag, palette, radius, spacing, shadow,
} from '../components/ui';
import { difficultyGradient } from '../theme';

export default function LevelsScreen() {
  const { setScreen, levelProgress, setCurrentLevel, autoResolveLevel, placedHeroes, autoPlace, quickFight } = useGameStore();
  const [grinding, setGrinding] = useState<number | null>(null);

  async function handleAutoResolve(levelId: number, times: number) {
    // Set the level context BEFORE auto-placing so the placement cap and
    // grid bounds match the level we're about to fight (siege vs small).
    setCurrentLevel(levelId);
    if (Object.keys(placedHeroes).length === 0) autoPlace();
    setGrinding(levelId);
    const r = await autoResolveLevel(levelId, times);
    setGrinding(null);
    Alert.alert(`Auto-resolve ×${times}`, `Wins: ${r.wins}\nLosses: ${r.losses}\nGold: +${r.goldGained}`);
  }

  const cleared = Object.values(levelProgress).filter((p) => p.completed).length;

  return (
    <Screen>
      <TopBar
        title="CAMPAIGN"
        onBack={() => setScreen('home')}
        right={<View style={styles.prog}><Text style={styles.progText}>{cleared}/{LEVELS.length}</Text></View>}
      />
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {LEVELS.map((level, idx) => {
          const progress = levelProgress[level.id];
          const isCompleted = !!progress?.completed;
          const prevCompleted = idx === 0 || !!levelProgress[LEVELS[idx - 1].id]?.completed;
          const isLocked = !prevCompleted;
          const grad = difficultyGradient[level.difficulty] ?? difficultyGradient.easy;

          return (
            <View key={level.id} style={styles.row}>
              <View style={styles.nodeCol}>
                <LinearGradient
                  colors={isLocked ? (['#3a3550', '#272338'] as const) : grad}
                  style={styles.node}
                >
                  <Text style={styles.nodeNum}>{isLocked ? '🔒' : level.id}</Text>
                </LinearGradient>
                {idx < LEVELS.length - 1 && <View style={[styles.connector, isCompleted && styles.connectorOn]} />}
              </View>

              <TouchableOpacity
                activeOpacity={isLocked ? 1 : 0.85}
                onPress={() => { if (!isLocked) { setCurrentLevel(level.id); setScreen('battle-prep'); } }}
                style={{ flex: 1 }}
              >
                <Panel padded={false} style={[styles.card, isLocked && { opacity: 0.55 }]}>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={styles.levelName} numberOfLines={1}>{level.name}</Text>
                      <Tag label={level.difficulty.toUpperCase()} colors={grad} small />
                    </View>
                    <Text style={styles.levelDesc} numberOfLines={2}>
                      {isLocked ? 'Complete the previous battle to unlock.' : level.description}
                    </Text>

                    {!isLocked && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                        {level.enemies.map((e, i) => (
                          <View key={i} style={{ marginRight: 5 }}>
                            <HeroPortrait
                              size={30} heroClass={e.heroClass} rarity="common" icon={e.icon}
                              element={e.element ?? 'physical'} seed={e.name.charCodeAt(0) + i}
                              isEnemy showFrame={false} stars={e.stars}
                            />
                          </View>
                        ))}
                      </ScrollView>
                    )}

                    <View style={styles.rewardRow}>
                      <Text style={styles.reward}>🪙 {level.rewards.gold}</Text>
                      {!!level.recommendedPower && <Text style={styles.reward}>⚡ {level.recommendedPower}</Text>}
                      {level.bossMechanic && !isLocked && (
                        <Text style={styles.boss}>👑 {level.bossMechanic.toUpperCase()}</Text>
                      )}
                    </View>

                    {isCompleted && (
                      <View style={styles.actions}>
                        <Text style={styles.stars}>⭐⭐⭐</Text>
                        <GButton small label={grinding === level.id ? '…' : '×5'} variant="purple"
                          onPress={() => handleAutoResolve(level.id, 5)} />
                        <GButton small label="⚡ Quick" variant="green"
                          onPress={() => quickFight(level.id)} />
                      </View>
                    )}
                    {!isCompleted && !isLocked && (
                      <View style={styles.actions}>
                        <GButton small label="BATTLE ▶" variant="gold"
                          onPress={() => { setCurrentLevel(level.id); setScreen('battle-prep'); }} />
                      </View>
                    )}
                  </View>
                </Panel>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  prog: { backgroundColor: palette.panelDeep, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: palette.goldDark },
  progText: { color: palette.gold, fontWeight: '900', fontSize: 12 },
  list: { padding: spacing.md, paddingBottom: 30 },
  row: { flexDirection: 'row', gap: 10 },
  nodeCol: { alignItems: 'center', width: 44 },
  node: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#ffffff55', ...shadow.button,
  },
  nodeNum: { color: '#fff', fontWeight: '900', fontSize: 16, textShadowColor: '#0007', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  connector: { width: 4, flex: 1, backgroundColor: '#ffffff1a', marginVertical: 2, borderRadius: 2, minHeight: 26 },
  connectorOn: { backgroundColor: palette.gold + 'aa' },
  card: { marginBottom: spacing.md },
  cardBody: { padding: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  levelName: { color: '#fff', fontWeight: '900', fontSize: 15, flex: 1 },
  levelDesc: { color: palette.textMute, fontSize: 11, lineHeight: 15 },
  rewardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4, alignItems: 'center' },
  reward: { color: palette.textSoft, fontSize: 11, fontWeight: '700' },
  boss: { color: palette.purple, fontSize: 10, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  stars: { fontSize: 12, marginRight: 'auto' },
});

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import HeroPortrait from '../components/HeroPortrait';
import { Screen, TopBar, Panel, GButton, Pill, palette, gradients, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

export default function SummonScreen() {
  const { setScreen, gems, summonHero, heroes } = useGameStore();
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<{ heroId?: string; reward?: any } | null>(null);
  const glow = useRef(new Animated.Value(0)).current;

  const lockedCount = Object.values(heroes).filter((h) => !h.unlocked).length;
  const totalCount = Object.keys(heroes).length;

  async function handlePull() {
    if (gems < 100) { Alert.alert('Not enough gems', 'A summon costs 100 gems.'); return; }
    setPulling(true);
    setResult(null);
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(glow, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
      { iterations: 3 },
    ).start();
    setTimeout(async () => {
      const r = await summonHero();
      setResult(r);
      setPulling(false);
    }, 900);
  }

  const summoned = result?.heroId ? heroes[result.heroId] : null;
  const sg = summoned ? (rarityGradient[summoned.rarity] ?? rarityGradient.common) : rarityGradient.common;

  return (
    <Screen>
      <TopBar title="SUMMON" onBack={() => setScreen('home')} right={<Pill icon="💎" value={gems} tint={palette.blue} />} />
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <Panel glow={palette.purple} style={{ alignItems: 'center' }}>
          <Animated.View style={{
            shadowColor: palette.purple,
            shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [6, 26] }),
            shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
            shadowOffset: { width: 0, height: 0 }, elevation: 12,
          }}>
            <LinearGradient colors={gradients.purpleBtn} style={styles.altar}>
              <Text style={styles.altarIcon}>🔮</Text>
            </LinearGradient>
          </Animated.View>
          <Text style={styles.altarText}>
            {lockedCount > 0 ? `${lockedCount} / ${totalCount} heroes still to discover` : 'All heroes discovered — pulls give bonus loot.'}
          </Text>
          <Text style={styles.chances}>Common 50 · Rare 30 · Epic 15 · Legendary 4 · Mythic 1</Text>
          <GButton label={pulling ? 'SUMMONING…' : '🔮 SUMMON · 100💎'} variant="purple" wide
            disabled={pulling || gems < 100} onPress={handlePull} style={{ marginTop: 14 }} />
        </Panel>

        {summoned && (
          <Panel glow={sg[0]} style={[styles.resultCard, { marginTop: spacing.lg }]}>
            <Text style={styles.resultTitle}>✦ YOU SUMMONED ✦</Text>
            <HeroPortrait size={120} heroClass={summoned.heroClass} rarity={summoned.rarity} icon={summoned.icon}
              element={summoned.baseStats.element} seed={summoned.portraitSeed} level={summoned.level} stars={summoned.stars} />
            <Text style={[styles.resultName, { color: sg[0] }]}>{summoned.name}</Text>
            <Text style={styles.resultClass}>{summoned.heroClass} · {summoned.rarity.toUpperCase()}</Text>
            <Text style={styles.resultDesc}>{summoned.description}</Text>
          </Panel>
        )}
        {result?.reward && (
          <Panel glow={palette.gold} style={{ marginTop: spacing.lg, alignItems: 'center' }}>
            <Text style={styles.resultTitle}>BONUS REWARD</Text>
            <Text style={[styles.resultName, { color: palette.gold }]}>
              {result.reward.kind === 'gold' && `🪙 +${result.reward.value} gold`}
              {result.reward.kind === 'gems' && `💎 +${result.reward.value} gems`}
              {result.reward.kind === 'shards' && `◆ +${result.reward.value} shards`}
            </Text>
          </Panel>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  altar: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#ffffff55', marginBottom: 12 },
  altarIcon: { fontSize: 52 },
  altarText: { color: palette.textSoft, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  chances: { color: palette.textDim, fontSize: 10, marginTop: 6, textAlign: 'center' },
  resultCard: { alignItems: 'center' },
  resultTitle: { color: palette.textMute, fontSize: 11, letterSpacing: 2, marginBottom: 12, fontWeight: '800' },
  resultName: { fontSize: 22, fontWeight: '900', marginTop: 12 },
  resultClass: { color: palette.textMute, fontSize: 12, marginTop: 4, fontWeight: '700' },
  resultDesc: { color: palette.textSoft, fontSize: 11, marginTop: 8, textAlign: 'center', lineHeight: 15 },
});

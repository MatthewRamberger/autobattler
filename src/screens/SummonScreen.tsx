import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import HeroPortrait from '../components/HeroPortrait';
import { Screen, TopBar, Panel, GButton, Pill, palette, gradients, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

type SummonResult = { heroId: string; isNew: boolean; cardCount: number };

export default function SummonScreen() {
  const { setScreen, gems, summonHero, heroes } = useGameStore();
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<SummonResult | null>(null);
  const glow = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  const lockedCount = Object.values(heroes).filter((h) => !h.unlocked).length;
  const totalCount = Object.keys(heroes).length;

  async function handlePull() {
    if (gems < 100) { Alert.alert('Not enough gems', 'A summon costs 100 gems.'); return; }
    setPulling(true);
    setResult(null);
    pop.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 320, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(glow, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]),
      { iterations: 3 },
    ).start();
    setTimeout(async () => {
      const r = await summonHero();
      setResult(r);
      setPulling(false);
      if (r) {
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 70 }).start();
      }
    }, 900);
  }

  const summoned = result ? heroes[result.heroId] : null;
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
            {lockedCount > 0
              ? `${lockedCount} / ${totalCount} heroes still to discover`
              : 'All heroes discovered — every pull is bonus cards.'}
          </Text>
          <Text style={styles.chances}>Each pull yields a hero card. Common 50 · Rare 30 · Epic 15 · Legendary 4 · Mythic 1</Text>
          <GButton label={pulling ? 'SUMMONING…' : '🔮 SUMMON · 100💎'} variant="purple" wide
            disabled={pulling || gems < 100} onPress={handlePull} style={{ marginTop: 14 }} />
        </Panel>

        {summoned && result && (
          <Animated.View style={{
            marginTop: spacing.lg,
            opacity: pop,
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          }}>
            <Panel glow={sg[0]} style={styles.resultCard}>
              <Text style={styles.resultTitle}>✦ {result.isNew ? 'NEW HERO' : 'HERO CARD'} ✦</Text>
              <HeroPortrait size={120} heroClass={summoned.heroClass} rarity={summoned.rarity} icon={summoned.icon}
                element={summoned.baseStats.element} seed={summoned.portraitSeed} level={summoned.level} stars={summoned.stars} />
              <Text style={[styles.resultName, { color: sg[0] }]}>{summoned.name}</Text>
              <Text style={styles.resultClass}>{summoned.heroClass} · {summoned.rarity.toUpperCase()}</Text>
              <View style={[styles.cardBadge, { borderColor: sg[0] }]}>
                <Text style={[styles.cardBadgeText, { color: sg[0] }]}>
                  🃏 +{result.cardCount} {summoned.name} card{result.cardCount > 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.resultDesc}>
                {result.isNew
                  ? summoned.description
                  : 'Combine cards in the Heroes screen to rank this hero up.'}
              </Text>
            </Panel>
          </Animated.View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  altar: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#ffffff55', marginBottom: 12 },
  altarIcon: { fontSize: 52 },
  altarText: { color: palette.textSoft, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  chances: { color: palette.textDim, fontSize: 10, marginTop: 6, textAlign: 'center', lineHeight: 14 },
  resultCard: { alignItems: 'center' },
  resultTitle: { color: palette.textMute, fontSize: 11, letterSpacing: 2, marginBottom: 12, fontWeight: '800' },
  resultName: { fontSize: 22, fontWeight: '900', marginTop: 12 },
  resultClass: { color: palette.textMute, fontSize: 12, marginTop: 4, fontWeight: '700' },
  cardBadge: {
    marginTop: 10, borderWidth: 1.5, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 5, backgroundColor: palette.panelDeep,
  },
  cardBadgeText: { fontSize: 12, fontWeight: '900' },
  resultDesc: { color: palette.textSoft, fontSize: 11, marginTop: 8, textAlign: 'center', lineHeight: 15 },
});

import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Animated, Easing, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { RARITY_COLORS } from '../data/equipment';
import HeroPortrait from '../components/HeroPortrait';

export default function SummonScreen() {
  const { setScreen, gems, summonHero, heroes, equipment } = useGameStore();
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<{ heroId?: string; reward?: any } | null>(null);
  const glow = useRef(new Animated.Value(0)).current;

  const lockedCount = Object.values(heroes).filter((h) => !h.unlocked).length;
  const totalCount = Object.keys(heroes).length;

  async function handlePull() {
    if (gems < 100) {
      Alert.alert('Not enough gems', 'A summon costs 100 gems.');
      return;
    }
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

  const summonedHero = result?.heroId ? heroes[result.heroId] : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>SUMMON</Text>
        <Text style={[styles.gold, { color: '#bb8fce' }]}>💎 {gems}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <View style={styles.altarBox}>
          <Animated.View
            style={[
              styles.altar,
              {
                shadowColor: '#bb8fce',
                shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [4, 20] }),
                shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] }),
                shadowOffset: { width: 0, height: 0 },
                elevation: 10,
              },
            ]}
          >
            <Text style={styles.altarIcon}>🔮</Text>
          </Animated.View>
          <Text style={styles.altarText}>
            {lockedCount > 0
              ? `${lockedCount} / ${totalCount} heroes still to discover`
              : 'All heroes discovered! Future pulls give rewards.'}
          </Text>
          <Text style={styles.rarityChances}>
            Common 50 · Rare 30 · Epic 15 · Legendary 4 · Mythic 1
          </Text>

          <TouchableOpacity
            style={[styles.pullBtn, (pulling || gems < 100) && styles.pullDisabled]}
            disabled={pulling || gems < 100}
            onPress={handlePull}
          >
            <Text style={styles.pullText}>{pulling ? 'SUMMONING…' : '🔮 SUMMON (100💎)'}</Text>
          </TouchableOpacity>
        </View>

        {summonedHero && (
          <View style={[styles.resultCard, { borderColor: RARITY_COLORS[summonedHero.rarity] }]}>
            <Text style={styles.resultTitle}>YOU SUMMONED</Text>
            <HeroPortrait
              size={120}
              heroClass={summonedHero.heroClass}
              rarity={summonedHero.rarity}
              icon={summonedHero.icon}
              element={summonedHero.baseStats.element}
              seed={summonedHero.portraitSeed}
              level={summonedHero.level}
              stars={summonedHero.stars}
            />
            <Text style={[styles.resultName, { color: RARITY_COLORS[summonedHero.rarity] }]}>
              {summonedHero.name}
            </Text>
            <Text style={styles.resultClass}>
              {summonedHero.heroClass} · {summonedHero.rarity.toUpperCase()}
            </Text>
            <Text style={styles.resultDesc}>{summonedHero.description}</Text>
          </View>
        )}

        {result?.reward && (
          <View style={[styles.resultCard, { borderColor: '#f1c40f' }]}>
            <Text style={styles.resultTitle}>BONUS REWARD</Text>
            <Text style={[styles.resultName, { color: '#f1c40f' }]}>
              {result.reward.kind === 'gold' && `💰 +${result.reward.value} gold`}
              {result.reward.kind === 'gems' && `💎 +${result.reward.value} gems`}
              {result.reward.kind === 'shards' && `◆ +${result.reward.value} shards`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 13 },
  title: { color: '#bb8fce', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  gold: { fontWeight: '700', fontSize: 13 },
  altarBox: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#bb8fce' },
  altar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#2a1a3e', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  altarIcon: { fontSize: 50 },
  altarText: { color: '#bb8fce', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  rarityChances: { color: '#666', fontSize: 10, marginBottom: 16, textAlign: 'center' },
  pullBtn: { backgroundColor: '#bb8fce', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
  pullDisabled: { backgroundColor: '#333' },
  pullText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 2 },
  resultCard: { backgroundColor: '#1e1e2e', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 14, borderWidth: 2 },
  resultTitle: { color: '#888', fontSize: 10, letterSpacing: 2, marginBottom: 10 },
  resultName: { fontSize: 20, fontWeight: '800', marginTop: 10 },
  resultClass: { color: '#888', fontSize: 12, marginTop: 4 },
  resultDesc: { color: '#aaa', fontSize: 11, marginTop: 8, textAlign: 'center', lineHeight: 14 },
});

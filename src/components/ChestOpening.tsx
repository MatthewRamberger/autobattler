import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Equipment, Hero } from '../types';
import { ChestReward } from '../store/gameStore';
import { rarityGradient } from '../theme';
import { palette } from './ui';

// Full-screen animated chest-opening sequence:
//   shaking  → the chest rattles, glow swells
//   burst    → flash + light rays, the lid flips open
//   reveal   → loot cards pop in one by one, staggered
// A tap (or the Collect button) dismisses it.

export interface ChestTheme {
  id: string;
  name: string;
  wood: readonly [string, string, string];
  metal: string;
  glow: string;
}

interface LootCard {
  key: string;
  icon: string;
  name: string;
  sub: string;
  qty: number;
  color: string;
}

interface Props {
  theme: ChestTheme;
  reward: ChestReward;
  heroes: Record<string, Hero>;
  equipment: Record<string, Equipment>;
  onClose: () => void;
}

export default function ChestOpening({ theme, reward, heroes, equipment, onClose }: Props) {
  const [phase, setPhase] = useState<'shaking' | 'burst' | 'reveal'>('shaking');

  const shake = useRef(new Animated.Value(0)).current;
  const chestScale = useRef(new Animated.Value(0.4)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const lid = useRef(new Animated.Value(0)).current;       // 0 closed → 1 open
  const rays = useRef(new Animated.Value(0)).current;

  // Flatten the reward into a list of loot cards.
  const loot = useMemo<LootCard[]>(() => {
    const out: LootCard[] = [];
    for (const it of reward.items) {
      const eq = equipment[it.id];
      if (!eq) continue;
      out.push({
        key: `eq-${it.id}`, icon: eq.icon, name: eq.name,
        sub: eq.rarity, qty: it.qty,
        color: (rarityGradient[eq.rarity] ?? rarityGradient.common)[0],
      });
    }
    for (const hc of reward.heroCards) {
      const h = heroes[hc.heroId];
      if (!h) continue;
      out.push({
        key: `hc-${hc.heroId}`, icon: h.icon, name: `${h.name}`,
        sub: 'hero card', qty: hc.qty,
        color: (rarityGradient[h.rarity] ?? rarityGradient.common)[0],
      });
    }
    if (reward.gold > 0) out.push({ key: 'gold', icon: '🪙', name: 'Gold', sub: 'currency', qty: reward.gold, color: palette.gold });
    if (reward.gems > 0) out.push({ key: 'gems', icon: '💎', name: 'Gems', sub: 'currency', qty: reward.gems, color: palette.blue });
    return out;
  }, [reward, heroes, equipment]);

  const cardAnims = useRef(loot.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Pop the chest in + start the rattle.
    Animated.spring(chestScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 70 }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.35, duration: 360, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence(
        [1, -1, 1, -1, 0.6, -0.6, 0].map((v, i) =>
          Animated.timing(shake, { toValue: v, duration: 55 + i * 4, useNativeDriver: true, easing: Easing.linear })
        )
      )
    ).start();

    // After the build-up, burst open.
    timers.push(setTimeout(() => {
      if (!alive) return;
      setPhase('burst');
      shake.stopAnimation();
      shake.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 110, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0, duration: 420, useNativeDriver: true }),
        ]),
        Animated.timing(lid, { toValue: 1, duration: 420, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.timing(rays, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(chestScale, { toValue: 1.16, duration: 130, useNativeDriver: true }),
          Animated.timing(chestScale, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
      ]).start();
    }, 1150));

    // Then stagger the loot cards in.
    timers.push(setTimeout(() => {
      if (!alive) return;
      setPhase('reveal');
      Animated.stagger(
        130,
        cardAnims.map((a) =>
          Animated.spring(a, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 })
        )
      ).start();
    }, 1650));

    return () => { alive = false; timers.forEach(clearTimeout); };
  }, []);

  const rayLoop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rayLoop, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  return (
    <Pressable
      style={styles.overlay}
      onPress={phase === 'reveal' ? onClose : undefined}
    >
      {/* Light rays behind the chest */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          opacity: rays.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] }),
          transform: [
            { scale: rays.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.6] }) },
            { rotate: rayLoop.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 4, height: 320, marginLeft: -2, marginTop: -160,
              backgroundColor: theme.glow,
              opacity: 0.5,
              transform: [{ rotate: `${i * 30}deg` }],
            }}
          />
        ))}
      </Animated.View>

      {/* The chest */}
      <Animated.View
        style={{
          transform: [
            { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] }) },
            { scale: chestScale },
          ],
        }}
      >
        <Animated.View
          style={[styles.chestGlow, {
            shadowColor: theme.glow,
            shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [10, 38] }),
            shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
          }]}
        >
          <ChestArt theme={theme} lid={lid} />
        </Animated.View>
      </Animated.View>

      {/* Loot reveal */}
      {phase === 'reveal' && (
        <View style={styles.lootWrap}>
          <Text style={styles.lootTitle}>✦ {theme.name.toUpperCase()} ✦</Text>
          <View style={styles.lootGrid}>
            {loot.map((card, i) => (
              <Animated.View
                key={card.key}
                style={{
                  opacity: cardAnims[i],
                  transform: [
                    { scale: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                    { translateY: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
                  ],
                }}
              >
                <LootCardView card={card} />
              </Animated.View>
            ))}
          </View>
          <View style={styles.collectBtn}>
            <Text style={styles.collectText}>TAP TO COLLECT</Text>
          </View>
        </View>
      )}

      {/* White burst flash */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]} />
    </Pressable>
  );
}

function LootCardView({ card }: { card: LootCard }) {
  return (
    <View style={[styles.loot, { borderColor: card.color }]}>
      <View style={[styles.lootGlow, { shadowColor: card.color }]} />
      <LinearGradient
        colors={[card.color + '33', '#0e0a1a'] as const}
        style={styles.lootInner}
      >
        <Text style={styles.lootIcon}>{card.icon}</Text>
        <Text style={[styles.lootName, { color: card.color }]} numberOfLines={1}>{card.name}</Text>
        <Text style={styles.lootSub}>{card.sub}</Text>
        <View style={[styles.qtyChip, { backgroundColor: card.color }]}>
          <Text style={styles.qtyText}>×{card.qty}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Layered chest art with a hinged lid that flips open.
// ---------------------------------------------------------------------------
function ChestArt({ theme, lid }: { theme: ChestTheme; lid: Animated.Value }) {
  const W = 168;
  const bodyH = 96;
  const lidH = 60;
  const lidRotate = lid.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-118deg'] });
  return (
    <View style={{ width: W, height: bodyH + lidH, alignItems: 'center' }}>
      {/* inner glow visible once open */}
      <Animated.View
        style={{
          position: 'absolute', top: lidH - 6, width: W - 28, height: bodyH * 0.6,
          borderRadius: 12, backgroundColor: theme.glow,
          opacity: lid.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.2, 0.9] }),
        }}
      />
      {/* lid — hinged at its top edge */}
      <Animated.View
        style={{
          width: W, height: lidH,
          transformOrigin: 'center top',
          transform: [{ perspective: 700 }, { rotateX: lidRotate }],
        } as any}
      >
        <LinearGradient
          colors={theme.wood}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={{ width: W, height: lidH, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 2, borderColor: '#00000055' }}
        />
        {/* metal band on the lid */}
        <View style={{ position: 'absolute', left: W / 2 - 13, top: 0, width: 26, height: lidH, backgroundColor: theme.metal, opacity: 0.9 }} />
        <View style={{ position: 'absolute', left: 8, top: lidH - 9, width: W - 16, height: 7, borderRadius: 4, backgroundColor: theme.metal }} />
      </Animated.View>

      {/* body */}
      <View style={{ width: W, height: bodyH, position: 'absolute', bottom: 0 }}>
        <LinearGradient
          colors={[theme.wood[1], theme.wood[2]] as const}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={{ width: W, height: bodyH, borderRadius: 12, borderWidth: 2, borderColor: '#00000066' }}
        />
        {/* metal corners */}
        {[[6, 6], [W - 22, 6], [6, bodyH - 22], [W - 22, bodyH - 22]].map(([l, t], i) => (
          <View key={i} style={{ position: 'absolute', left: l, top: t, width: 16, height: 16, backgroundColor: theme.metal, borderRadius: 3 }} />
        ))}
        {/* vertical metal band */}
        <View style={{ position: 'absolute', left: W / 2 - 13, top: 0, width: 26, height: bodyH, backgroundColor: theme.metal, opacity: 0.9 }} />
        {/* lock plate */}
        <View style={{
          position: 'absolute', left: W / 2 - 15, top: -8, width: 30, height: 30, borderRadius: 7,
          backgroundColor: '#f6c945', borderWidth: 2, borderColor: '#8a6212',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <View style={{ width: 8, height: 10, borderRadius: 3, backgroundColor: '#5a3c08' }} />
        </View>
        {/* wood grain highlight */}
        <View style={{ position: 'absolute', left: 10, top: 8, width: W - 20, height: 10, borderRadius: 6, backgroundColor: '#ffffff22' }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#05030ce8',
    alignItems: 'center', justifyContent: 'center',
  },
  chestGlow: {
    shadowOffset: { width: 0, height: 0 }, elevation: 18,
  },
  flash: { backgroundColor: '#ffffff' },
  lootWrap: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  lootTitle: { color: palette.gold, fontSize: 13, fontWeight: '900', letterSpacing: 3, marginBottom: 12 },
  lootGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  loot: { width: 96, borderRadius: 12, borderWidth: 2, overflow: 'hidden' },
  lootGlow: {
    ...StyleSheet.absoluteFillObject, borderRadius: 12,
    shadowOpacity: 0.9, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  lootInner: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  lootIcon: { fontSize: 30 },
  lootName: { fontSize: 11, fontWeight: '900', marginTop: 4 },
  lootSub: { color: palette.textMute, fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
  qtyChip: { marginTop: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  qtyText: { color: '#1a1020', fontSize: 10, fontWeight: '900' },
  collectBtn: {
    marginTop: 16, backgroundColor: palette.goldDeep, borderRadius: 999,
    paddingHorizontal: 22, paddingVertical: 8, borderWidth: 2, borderColor: palette.gold,
  },
  collectText: { color: '#1a1020', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
});

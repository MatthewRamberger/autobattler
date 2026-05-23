import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { MAX_ITEM_TIER, ITEMS_PER_COMBINE } from '../data/equipment';
import { Screen, TopBar, Panel, GButton, CurrencyBar, palette, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

export default function ForgeScreen() {
  const { setScreen, equipment, gold, gems, combineEquipment, enchantEquipment } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');

  const items = Object.values(equipment).filter((e) =>
    (filter === 'all' || e.type === filter) && (e.owned > 0 || e.level > 1)
  );

  return (
    <Screen>
      <TopBar title="FORGE" onBack={() => setScreen('home')} right={<CurrencyBar gold={gold} gems={gems} />} />
      <Text style={styles.help}>
        🃏 Combine {ITEMS_PER_COMBINE} identical items to advance them one tier (+20% stats). Max T{MAX_ITEM_TIER}. Enchant with gems for a random affix.
      </Text>
      <View style={styles.filterRow}>
        {(['all', 'weapon', 'armor', 'accessory'] as const).map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.fBtn, filter === f && styles.fBtnOn]}>
            <Text style={[styles.fText, filter === f && styles.fTextOn]}>{f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <Text style={styles.empty}>No combinable items yet.{'\n'}Win battles to find gear.</Text>
        ) : items.map((item) => {
          const grad = rarityGradient[item.rarity] ?? rarityGradient.common;
          const maxed = item.level >= MAX_ITEM_TIER;
          const have = item.owned;
          const need = ITEMS_PER_COMBINE;
          const can = !maxed && have >= need;
          const pct = Math.min(1, have / need);
          return (
            <Panel key={item.id} style={{ marginBottom: spacing.md }}>
              <View style={styles.row}>
                <LinearGradient colors={grad} style={styles.iconBg}>
                  <Text style={styles.icon}>{item.icon}</Text>
                  {item.level > 1 && (
                    <View style={styles.tierBadge}><Text style={styles.tierBadgeText}>T{item.level}</Text></View>
                  )}
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: grad[0] }]}>
                    {item.name} {item.level > 1 && `· T${item.level}`}
                  </Text>
                  <Text style={styles.bonus} numberOfLines={1}>
                    {Object.entries(item.statBonus).map(([k, v]) => `+${v} ${k}`).join(' · ')}
                  </Text>
                  <View style={styles.progBar}>
                    <View style={[styles.progFill, { width: `${pct * 100}%` }]} />
                  </View>
                  <Text style={styles.meta}>
                    {maxed ? `MAX TIER (×${have} extra)` : `${have} / ${need} copies · T${item.level}/${MAX_ITEM_TIER}`}
                  </Text>
                </View>
                <View style={{ gap: 5, alignItems: 'stretch', minWidth: 96 }}>
                  <GButton small variant="gold" disabled={!can}
                    label={maxed ? 'MAX' : `🃏 Combine`}
                    onPress={() => {
                      if (maxed) { Alert.alert('Maxed', 'This item is already at the top tier.'); return; }
                      if (have < need) { Alert.alert('Need more copies', `Collect ${need} of this item to combine.`); return; }
                      combineEquipment(item.id);
                    }} />
                  <GButton small variant="purple" disabled={gems < 25 || item.owned <= 0}
                    label="Enchant 25💎"
                    onPress={() => {
                      if (gems < 25) { Alert.alert('Not enough gems'); return; }
                      if (item.owned <= 0) { Alert.alert('Item is equipped', 'Unequip first.'); return; }
                      enchantEquipment(item.id);
                    }} />
                </View>
              </View>
            </Panel>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  help: { color: palette.textMute, fontSize: 11, paddingHorizontal: 16, lineHeight: 15, paddingBottom: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 6, paddingVertical: 4 },
  fBtn: { flex: 1, paddingVertical: 6, borderRadius: 7, backgroundColor: palette.panelDeep, alignItems: 'center', borderWidth: 1.5, borderColor: '#0007' },
  fBtnOn: { backgroundColor: palette.goldDeep, borderColor: palette.gold },
  fText: { color: palette.textMute, fontSize: 11, fontWeight: '800' },
  fTextOn: { color: '#fff' },
  empty: { color: palette.textDim, textAlign: 'center', padding: 40, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBg: { width: 46, height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff44' },
  icon: { fontSize: 22 },
  tierBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: palette.goldDeep, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: '#fff' },
  tierBadgeText: { color: '#fff', fontWeight: '900', fontSize: 9 },
  name: { fontSize: 13, fontWeight: '800' },
  bonus: { color: '#8fd0ff', fontSize: 11, marginTop: 2, fontWeight: '600' },
  progBar: { marginTop: 5, height: 5, backgroundColor: palette.panelDeep, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: '#0006' },
  progFill: { height: '100%', backgroundColor: palette.gold },
  meta: { color: palette.textDim, fontSize: 10, marginTop: 3 },
});

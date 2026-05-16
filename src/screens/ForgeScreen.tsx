import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { MAX_FORGE_LEVEL, forgeShardsRequired } from '../data/equipment';
import { Screen, TopBar, Panel, GButton, CurrencyBar, palette, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

export default function ForgeScreen() {
  const { setScreen, equipment, gold, gems, forgeEquipment, enchantEquipment } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');

  const items = Object.values(equipment).filter((e) =>
    (filter === 'all' || e.type === filter) && (e.owned > 0 || e.shards > 0 || e.level > 0)
  );

  return (
    <Screen>
      <TopBar title="FORGE" onBack={() => setScreen('home')} right={<CurrencyBar gold={gold} gems={gems} />} />
      <Text style={styles.help}>🔨 Forge with shards & gold for +20% stats per level (max +5). Enchant with gems for a random affix.</Text>
      <View style={styles.filterRow}>
        {(['all', 'weapon', 'armor', 'accessory'] as const).map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.fBtn, filter === f && styles.fBtnOn]}>
            <Text style={[styles.fText, filter === f && styles.fTextOn]}>{f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <Text style={styles.empty}>No forgeable items yet.{'\n'}Win battles to find shards.</Text>
        ) : items.map((item) => {
          const grad = rarityGradient[item.rarity] ?? rarityGradient.common;
          const maxed = item.level >= MAX_FORGE_LEVEL;
          const cost = maxed ? 0 : forgeShardsRequired(item.level);
          const goldCost = 50 * (item.level + 1);
          const can = !maxed && item.shards >= cost && gold >= goldCost;
          return (
            <Panel key={item.id} style={{ marginBottom: spacing.md }}>
              <View style={styles.row}>
                <LinearGradient colors={grad} style={styles.iconBg}><Text style={styles.icon}>{item.icon}</Text></LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: grad[0] }]}>{item.name}{item.level > 0 && ` +${item.level}`}</Text>
                  <Text style={styles.bonus} numberOfLines={1}>
                    {Object.entries(item.statBonus).map(([k, v]) => `+${v} ${k}`).join(' · ')}
                  </Text>
                  <Text style={styles.meta}>×{item.owned} · ◆{item.shards} · Lv {item.level}/{MAX_FORGE_LEVEL}</Text>
                </View>
                <View style={{ gap: 5, alignItems: 'stretch', minWidth: 92 }}>
                  <GButton small variant="gold" disabled={!can}
                    label={maxed ? 'MAX' : `Forge +${item.level + 1}`}
                    onPress={() => {
                      if (!can) { Alert.alert('Cannot forge', maxed ? 'Already maxed.' : `Need ◆${cost} & 🪙${goldCost}.`); return; }
                      forgeEquipment(item.id);
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
  name: { fontSize: 13, fontWeight: '800' },
  bonus: { color: '#8fd0ff', fontSize: 11, marginTop: 2, fontWeight: '600' },
  meta: { color: palette.textDim, fontSize: 10, marginTop: 3 },
});

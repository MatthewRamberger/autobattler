import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { Equipment, Hero } from '../types';
import { EQUIPMENT_SETS, MAX_ITEM_TIER } from '../data/equipment';
import { Screen, TopBar, Panel, SectionTitle, GButton, palette, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

// Inventory: roomy responsive grid of items the player owns. Tapping a
// tile opens a detail modal with stats, set info, and where the item is
// equipped. Mirrors the look of the heroes grid in CollectionScreen.
export default function EquipmentScreen() {
  const { setScreen, equipment, heroes } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const { width: screenW } = useWindowDimensions();

  // Build a map from equipment id → hero ids currently wearing it, so the
  // detail modal can show where each copy is.
  const equippedOn: Record<string, string[]> = {};
  for (const h of Object.values(heroes)) {
    for (const id of [h.weaponId, h.armorId, h.accessoryId]) {
      if (id) (equippedOn[id] ??= []).push(h.id);
    }
  }
  const filtered = Object.values(equipment).filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (rarityFilter !== 'all' && item.rarity !== rarityFilter) return false;
    return item.owned > 0 || (equippedOn[item.id]?.length ?? 0) > 0;
  });

  // 3-col on wider screens, 2-col on phones.
  const cols = screenW >= 600 ? 3 : 2;
  const gridGap = 8;
  const tileW = Math.floor((screenW - 28 - gridGap * (cols - 1)) / cols);

  const sel = selected ? equipment[selected] : null;

  return (
    <Screen>
      <TopBar
        title="GEAR"
        onBack={() => setScreen('home')}
        right={<View style={styles.count}><Text style={styles.countText}>{filtered.length}</Text></View>}
      />

      <View style={styles.filterRow}>
        {(['all', 'weapon', 'armor', 'accessory'] as const).map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.fBtn, filter === f && styles.fBtnOn]}>
            <Text style={[styles.fText, filter === f && styles.fTextOn]}>
              {f === 'all' ? 'ALL' : f === 'weapon' ? '⚔️' : f === 'armor' ? '🛡️' : '💍'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.rarityRow}>
        {['all', 'common', 'rare', 'epic', 'legendary', 'mythic'].map((r) => (
          <TouchableOpacity key={r} onPress={() => setRarityFilter(r)}
            style={[styles.rBtn, rarityFilter === r && styles.rBtnOn]}>
            <Text style={[styles.rText, rarityFilter === r && styles.rTextOn]}>{r[0].toUpperCase() + r.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No items.{'\n'}Win battles to earn equipment!</Text>
        ) : (
          <View style={[styles.grid, { gap: gridGap }]}>
            {filtered.map((item) => {
              const grad = rarityGradient[item.rarity] ?? rarityGradient.common;
              const onCount = (equippedOn[item.id] ?? []).length;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => setSelected(item.id)}
                  style={[styles.tile, { width: tileW, borderColor: grad[1] }]}
                >
                  <LinearGradient colors={grad} style={[styles.tileIcon, { width: tileW - 28, height: tileW - 28 }]}>
                    <Text style={[styles.tileIconText, { fontSize: (tileW - 28) * 0.45 }]}>{item.icon}</Text>
                    {item.level > 1 && (
                      <View style={styles.tierBadge}>
                        <Text style={styles.tierBadgeText}>T{item.level}</Text>
                      </View>
                    )}
                  </LinearGradient>
                  <Text style={[styles.tileName, { color: grad[0] }]} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.tileFooter}>
                    <Text style={styles.tileType}>{item.type[0].toUpperCase()}</Text>
                    <Text style={styles.tileCount}>×{item.owned}{onCount > 0 ? `+${onCount}` : ''}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
      <Text style={styles.tip}>💡 Equip from HEROES · Combine 4 copies in FORGE</Text>

      {sel && (
        <ItemDetailModal
          item={sel}
          equippedOn={equippedOn[sel.id] ?? []}
          heroes={heroes}
          onClose={() => setSelected(null)}
        />
      )}
    </Screen>
  );
}

function ItemDetailModal({
  item, equippedOn, heroes, onClose,
}: {
  item: Equipment;
  equippedOn: string[];
  heroes: Record<string, Hero>;
  onClose: () => void;
}) {
  const grad = rarityGradient[item.rarity] ?? rarityGradient.common;
  const set = item.setId ? EQUIPMENT_SETS[item.setId] : null;
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose} visible>
      <TouchableOpacity activeOpacity={1} style={modalStyles.backdrop} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: '90%', maxWidth: 480 }}>
          <Panel style={modalStyles.card}>
            <View style={modalStyles.head}>
              <LinearGradient colors={grad} style={modalStyles.icon}>
                <Text style={modalStyles.iconText}>{item.icon}</Text>
                {item.level > 1 && (
                  <View style={modalStyles.tierBadge}>
                    <Text style={modalStyles.tierBadgeText}>T{item.level}</Text>
                  </View>
                )}
              </LinearGradient>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[modalStyles.name, { color: grad[0] }]}>{item.name}</Text>
                <Text style={modalStyles.meta}>
                  {item.type.toUpperCase()} · {item.rarity.toUpperCase()} · T{item.level}/{MAX_ITEM_TIER}
                </Text>
                <Text style={modalStyles.meta}>
                  Owned: {item.owned}{equippedOn.length > 0 ? ` · Equipped: ${equippedOn.length}` : ''}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <SectionTitle>STATS</SectionTitle>
              {Object.entries(item.statBonus).map(([k, v]) => {
                const isPct = k === 'critRate' || k === 'dodge' || k === 'critDamage';
                const display = isPct ? `+${Math.round((v as number) * 100)}%` : `+${v}`;
                return (
                  <View key={k} style={modalStyles.statRow}>
                    <Text style={modalStyles.statKey}>{k.toUpperCase()}</Text>
                    <Text style={modalStyles.statVal}>{display}</Text>
                  </View>
                );
              })}
            </View>

            {set && (
              <View style={{ marginTop: spacing.md }}>
                <SectionTitle>SET · {set.name.toUpperCase()}</SectionTitle>
                <Text style={modalStyles.setDesc}>{set.description}</Text>
              </View>
            )}

            {item.requiredClass && item.requiredClass.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <SectionTitle>REQUIRED CLASS</SectionTitle>
                <Text style={modalStyles.classText}>{item.requiredClass.join(' · ')}</Text>
              </View>
            )}

            {equippedOn.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <SectionTitle>EQUIPPED ON</SectionTitle>
                <Text style={modalStyles.classText}>
                  {equippedOn.map((id) => heroes[id]?.name ?? '?').join(' · ')}
                </Text>
              </View>
            )}

            <GButton wide variant="gold" label="Close" onPress={onClose} style={{ marginTop: spacing.lg }} />
          </Panel>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  count: { backgroundColor: palette.panelDeep, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: palette.goldDark },
  countText: { color: palette.gold, fontWeight: '900', fontSize: 12 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 6 },
  fBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: palette.panelDeep, alignItems: 'center', borderWidth: 1.5, borderColor: '#0007' },
  fBtnOn: { backgroundColor: palette.greenDeep, borderColor: palette.green },
  fText: { color: palette.textMute, fontSize: 13, fontWeight: '800' },
  fTextOn: { color: '#fff' },
  rarityRow: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 6, gap: 4 },
  rBtn: { flex: 1, paddingVertical: 5, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#0007', backgroundColor: palette.panelDeep },
  rBtnOn: { backgroundColor: palette.purpleDeep, borderColor: palette.purple },
  rText: { color: palette.textDim, fontSize: 9, fontWeight: '700' },
  rTextOn: { color: '#fff' },
  empty: { color: palette.textDim, fontSize: 14, textAlign: 'center', lineHeight: 22, padding: 50 },
  tip: { color: palette.textDim, fontSize: 11, textAlign: 'center', padding: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    backgroundColor: palette.panel, borderWidth: 2, borderRadius: 12,
    padding: 10, alignItems: 'center',
  },
  tileIcon: {
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#ffffff44',
  },
  tileIconText: { textAlign: 'center' },
  tierBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: palette.goldDeep, borderRadius: 6,
    paddingHorizontal: 4, paddingVertical: 1,
    borderWidth: 1, borderColor: '#fff',
  },
  tierBadgeText: { color: '#fff', fontWeight: '900', fontSize: 9 },
  tileName: { fontSize: 12, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  tileFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginTop: 4,
  },
  tileType: { color: palette.textMute, fontSize: 10, fontWeight: '800' },
  tileCount: { color: palette.gold, fontSize: 11, fontWeight: '900' },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: '#000a',
    alignItems: 'center', justifyContent: 'center',
  },
  card: { padding: spacing.md },
  head: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: {
    width: 64, height: 64, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#ffffff55',
  },
  iconText: { fontSize: 32 },
  tierBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: palette.goldDeep, borderRadius: 6,
    paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: '#fff',
  },
  tierBadgeText: { color: '#fff', fontWeight: '900', fontSize: 9 },
  name: { fontSize: 17, fontWeight: '900' },
  meta: { color: palette.textMute, fontSize: 11, marginTop: 3, fontWeight: '600' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#0006' },
  statKey: { color: palette.textSoft, fontSize: 12, fontWeight: '700' },
  statVal: { color: '#8fd0ff', fontSize: 12, fontWeight: '900' },
  setDesc: { color: palette.gold, fontSize: 11, fontWeight: '700' },
  classText: { color: palette.textSoft, fontSize: 12, fontWeight: '600' },
});

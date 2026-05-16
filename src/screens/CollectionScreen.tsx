import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Modal, Alert,
} from 'react-native';
import { useGameStore, getHeroEffectiveStats } from '../store/gameStore';
import { RARITY_COLORS } from '../data/equipment';
import { CLASS_COLORS } from '../data/heroes';
import StatBar from '../components/StatBar';
import EquipmentCard from '../components/EquipmentCard';

const UNLOCK_COSTS: Record<string, number> = {
  common: 100,
  rare: 200,
  epic: 400,
  legendary: 800,
};

export default function CollectionScreen() {
  const store = useGameStore();
  const { heroes, gold, setScreen, unlockHero, levelUpHero, unequipItem, equipItem } = store;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [equipTab, setEquipTab] = useState<'weapon' | 'armor'>('weapon');

  const heroList = Object.values(heroes);
  const selectedHero = selectedId ? heroes[selectedId] : null;
  const effectiveStats = selectedId ? getHeroEffectiveStats(selectedId, store) : null;

  const ownedEquipment = Object.values(store.equipment).filter(
    (e) => e.type === equipTab && (e.owned > 0 || e.id === selectedHero?.weaponId || e.id === selectedHero?.armorId)
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>HEROES</Text>
        <Text style={styles.gold}>💰 {gold}</Text>
      </View>

      <View style={styles.body}>
        {/* Hero list */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {heroList.map((hero) => {
            const rarityColor = RARITY_COLORS[hero.rarity];
            const classColor = CLASS_COLORS[hero.heroClass];
            const isSelected = hero.id === selectedId;
            return (
              <TouchableOpacity
                key={hero.id}
                style={[styles.heroRow, { borderColor: isSelected ? '#fff' : rarityColor }]}
                onPress={() => setSelectedId(isSelected ? null : hero.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.heroIcon, { backgroundColor: classColor + '33' }]}>
                  <Text style={styles.iconText}>{hero.icon}</Text>
                </View>
                <View style={styles.heroInfo}>
                  <Text style={[styles.heroName, { color: rarityColor }]}>{hero.name}</Text>
                  <Text style={styles.heroClass}>{hero.heroClass} · Lv.{hero.level}</Text>
                </View>
                {!hero.unlocked && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.lockCost}>{UNLOCK_COSTS[hero.rarity]}g</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Detail Panel */}
        {selectedHero && effectiveStats ? (
          <ScrollView style={styles.detail} showsVerticalScrollIndicator={false}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailIcon}>{selectedHero.icon}</Text>
              <View>
                <Text style={[styles.detailName, { color: RARITY_COLORS[selectedHero.rarity] }]}>
                  {selectedHero.name}
                </Text>
                <Text style={styles.detailClass}>{selectedHero.heroClass}</Text>
              </View>
            </View>

            {!selectedHero.unlocked ? (
              <TouchableOpacity
                style={styles.unlockBtn}
                onPress={() => {
                  const cost = UNLOCK_COSTS[selectedHero.rarity];
                  if (gold < cost) { Alert.alert('Not enough gold!'); return; }
                  unlockHero(selectedHero.id, cost);
                }}
              >
                <Text style={styles.unlockBtnText}>🔓 Unlock for {UNLOCK_COSTS[selectedHero.rarity]}g</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.sectionTitle}>STATS (Effective)</Text>
                <StatBar label="HP" value={effectiveStats.maxHp} max={400} color="#e74c3c" />
                <StatBar label="ATK" value={effectiveStats.attack} max={100} color="#e67e22" />
                <StatBar label="DEF" value={effectiveStats.defense} max={60} color="#3498db" />
                <StatBar label="SPD" value={effectiveStats.speed} max={10} color="#2ecc71" />
                <StatBar label="RNG" value={effectiveStats.range} max={5} color="#9b59b6" />

                <TouchableOpacity
                  style={styles.levelBtn}
                  onPress={() => {
                    const cost = selectedHero.level * 50;
                    if (gold < cost) { Alert.alert('Not enough gold!'); return; }
                    levelUpHero(selectedHero.id);
                  }}
                >
                  <Text style={styles.levelBtnText}>⬆ Level Up  ({selectedHero.level * 50}g)</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>EQUIPMENT</Text>
                <View style={styles.equipSlots}>
                  <View style={styles.equipSlot}>
                    <Text style={styles.slotLabel}>Weapon</Text>
                    {selectedHero.weaponId ? (
                      <TouchableOpacity onPress={() => unequipItem(selectedHero.id, 'weapon')} style={styles.slotFilled}>
                        <Text style={styles.slotIcon}>{store.equipment[selectedHero.weaponId]?.icon}</Text>
                        <Text style={styles.slotName} numberOfLines={1}>{store.equipment[selectedHero.weaponId]?.name}</Text>
                        <Text style={styles.slotRemove}>✕</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.slotEmpty}><Text style={styles.slotEmptyText}>Empty</Text></View>
                    )}
                  </View>
                  <View style={styles.equipSlot}>
                    <Text style={styles.slotLabel}>Armor</Text>
                    {selectedHero.armorId ? (
                      <TouchableOpacity onPress={() => unequipItem(selectedHero.id, 'armor')} style={styles.slotFilled}>
                        <Text style={styles.slotIcon}>{store.equipment[selectedHero.armorId]?.icon}</Text>
                        <Text style={styles.slotName} numberOfLines={1}>{store.equipment[selectedHero.armorId]?.name}</Text>
                        <Text style={styles.slotRemove}>✕</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.slotEmpty}><Text style={styles.slotEmptyText}>Empty</Text></View>
                    )}
                  </View>
                </View>

                <View style={styles.tabRow}>
                  {(['weapon', 'armor'] as const).map((t) => (
                    <TouchableOpacity key={t} style={[styles.tab, equipTab === t && styles.tabActive]} onPress={() => setEquipTab(t)}>
                      <Text style={[styles.tabText, equipTab === t && styles.tabTextActive]}>{t.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {ownedEquipment.map((item) => {
                  const isEquippedOnThis =
                    item.id === selectedHero.weaponId || item.id === selectedHero.armorId;
                  const canEquip = item.owned > 0 && !isEquippedOnThis &&
                    (!item.requiredClass || item.requiredClass.includes(selectedHero.heroClass));
                  return (
                    <EquipmentCard
                      key={item.id}
                      item={item}
                      equipped={isEquippedOnThis}
                      onPress={() => {
                        if (isEquippedOnThis) return;
                        if (!canEquip) { Alert.alert('Cannot equip', 'Wrong class or none available.'); return; }
                        equipItem(selectedHero.id, item.id);
                      }}
                    />
                  );
                })}
              </>
            )}
          </ScrollView>
        ) : (
          <View style={styles.noDetail}>
            <Text style={styles.noDetailText}>Select a hero{'\n'}to view details</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 14 },
  title: { color: '#f1c40f', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  gold: { color: '#f1c40f', fontWeight: '700' },
  body: { flex: 1, flexDirection: 'row' },
  list: { width: 160, borderRightWidth: 1, borderRightColor: '#1e1e2e', padding: 8 },
  heroRow: {
    backgroundColor: '#1e1e2e', borderRadius: 10, borderWidth: 2,
    padding: 8, marginBottom: 8, alignItems: 'center',
  },
  heroIcon: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  iconText: { fontSize: 24 },
  heroInfo: { alignItems: 'center' },
  heroName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  heroClass: { color: '#666', fontSize: 10, marginTop: 1 },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000099', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  lockIcon: { fontSize: 18 },
  lockCost: { color: '#f1c40f', fontSize: 10, marginTop: 2 },
  detail: { flex: 1, padding: 14 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  detailIcon: { fontSize: 40 },
  detailName: { fontSize: 20, fontWeight: '800' },
  detailClass: { color: '#888', fontSize: 13 },
  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 14, marginBottom: 6 },
  levelBtn: { backgroundColor: '#f1c40f22', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#f1c40f' },
  levelBtnText: { color: '#f1c40f', fontWeight: '700', fontSize: 14 },
  unlockBtn: { backgroundColor: '#27ae6022', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: '#27ae60' },
  unlockBtnText: { color: '#27ae60', fontWeight: '700', fontSize: 16 },
  equipSlots: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  equipSlot: { flex: 1 },
  slotLabel: { color: '#666', fontSize: 10, marginBottom: 4 },
  slotFilled: { backgroundColor: '#1e1e2e', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#333' },
  slotIcon: { fontSize: 18 },
  slotName: { flex: 1, color: '#ccc', fontSize: 11 },
  slotRemove: { color: '#e74c3c', fontWeight: '700' },
  slotEmpty: { backgroundColor: '#1e1e2e', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a', borderStyle: 'dashed' },
  slotEmptyText: { color: '#444', fontSize: 11 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e1e2e', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  tabActive: { backgroundColor: '#2a2a4e', borderColor: '#7c83fd' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#7c83fd' },
  noDetail: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noDetailText: { color: '#333', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

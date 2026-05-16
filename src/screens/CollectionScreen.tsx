import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert,
} from 'react-native';
import { useGameStore, getHeroEffectiveStats } from '../store/gameStore';
import { RARITY_COLORS } from '../data/equipment';
import { CLASS_COLORS, CLASS_DESCRIPTIONS } from '../data/heroes';
import { ABILITIES } from '../data/abilities';
import { TALENTS, TALENT_UNLOCK_LEVELS, availableTalentTier } from '../data/talents';
import StatBar from '../components/StatBar';
import EquipmentCard from '../components/EquipmentCard';
import HeroPortrait from '../components/HeroPortrait';

const UNLOCK_COSTS: Record<string, number> = {
  common: 100,
  rare: 250,
  epic: 500,
  legendary: 1000,
  mythic: 2500,
};

export default function CollectionScreen() {
  const store = useGameStore();
  const { heroes, gold, gems, setScreen, unlockHero, levelUpHero, ascendHero, unequipItem, equipItem, toggleFavorite, autoEquipBest, pickTalent, respecTalents } = store;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [equipTab, setEquipTab] = useState<'weapon' | 'armor' | 'accessory'>('weapon');
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'favorite'>('all');

  const heroList = Object.values(heroes).filter((h) => {
    if (filter === 'unlocked') return h.unlocked;
    if (filter === 'favorite') return h.favorite;
    return true;
  });
  const selectedHero = selectedId ? heroes[selectedId] : null;
  const effectiveStats = selectedId ? getHeroEffectiveStats(selectedId, store) : null;
  const ability = selectedHero ? ABILITIES[selectedHero.abilityId] : null;

  const ownedEquipment = Object.values(store.equipment).filter((e) => {
    if (e.type !== equipTab) return false;
    return e.owned > 0
      || e.id === selectedHero?.weaponId
      || e.id === selectedHero?.armorId
      || e.id === selectedHero?.accessoryId;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>HEROES</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Text style={styles.gold}>💰 {gold}</Text>
          <Text style={[styles.gold, { color: '#bb8fce' }]}>💎 {gems}</Text>
        </View>
      </View>

      <View style={styles.filterBar}>
        {(['all', 'unlocked', 'favorite'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.body}>
        {/* Hero list */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          {heroList.map((hero) => {
            const isSelected = hero.id === selectedId;
            return (
              <TouchableOpacity
                key={hero.id}
                onPress={() => setSelectedId(isSelected ? null : hero.id)}
                activeOpacity={0.85}
                style={{ alignItems: 'center', marginBottom: 8 }}
              >
                <HeroPortrait
                  size={88}
                  heroClass={hero.heroClass}
                  rarity={hero.rarity}
                  icon={hero.icon}
                  element={hero.baseStats.element}
                  seed={hero.portraitSeed}
                  level={hero.level}
                  stars={hero.stars}
                  dimmed={!hero.unlocked}
                  selected={isSelected}
                />
                <Text style={[styles.benchName, { color: RARITY_COLORS[hero.rarity] }]} numberOfLines={1}>
                  {hero.name}
                </Text>
                <Text style={styles.benchClass}>{hero.heroClass}</Text>
                {hero.favorite && <Text style={styles.favStar}>⭐</Text>}
                {!hero.unlocked && (
                  <View style={styles.lockChip}>
                    <Text style={styles.lockChipText}>🔒 {UNLOCK_COSTS[hero.rarity]}g</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Detail */}
        {selectedHero && effectiveStats ? (
          <ScrollView style={styles.detail} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
            <View style={styles.detailHeader}>
              <HeroPortrait
                size={96}
                heroClass={selectedHero.heroClass}
                rarity={selectedHero.rarity}
                icon={selectedHero.icon}
                element={selectedHero.baseStats.element}
                seed={selectedHero.portraitSeed}
                level={selectedHero.level}
                stars={selectedHero.stars}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailName, { color: RARITY_COLORS[selectedHero.rarity] }]}>
                  {selectedHero.name}
                </Text>
                <Text style={styles.detailClass}>{selectedHero.heroClass} · {selectedHero.baseStats.element}</Text>
                <Text style={styles.detailDesc} numberOfLines={3}>{selectedHero.description}</Text>
                <View style={styles.tagRow}>
                  <View style={[styles.tag, { backgroundColor: CLASS_COLORS[selectedHero.heroClass] + '44' }]}>
                    <Text style={[styles.tagText, { color: CLASS_COLORS[selectedHero.heroClass] }]}>
                      {selectedHero.heroClass}
                    </Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: RARITY_COLORS[selectedHero.rarity] + '44' }]}>
                    <Text style={[styles.tagText, { color: RARITY_COLORS[selectedHero.rarity] }]}>
                      {selectedHero.rarity.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              {selectedHero.unlocked && (
                <TouchableOpacity onPress={() => toggleFavorite(selectedHero.id)}>
                  <Text style={{ fontSize: 22 }}>{selectedHero.favorite ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              )}
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
                <Text style={styles.sectionTitle}>STATS · Power {effectiveStats.power}</Text>
                <StatBar label="HP" value={effectiveStats.maxHp} max={600} color="#e74c3c" />
                <StatBar label="ATK" value={effectiveStats.attack} max={130} color="#e67e22" />
                <StatBar label="DEF" value={effectiveStats.defense} max={80} color="#3498db" />
                <StatBar label="SPD" value={effectiveStats.speed} max={12} color="#2ecc71" />
                <StatBar label="RNG" value={effectiveStats.range} max={5} color="#9b59b6" />
                <StatBar label="CRT" value={Math.round(effectiveStats.critRate * 100)} max={100} color="#f1c40f" />
                <StatBar label="DGE" value={Math.round(effectiveStats.dodge * 100)} max={100} color="#7c83fd" />
                <StatBar label="MP" value={effectiveStats.maxMana} max={300} color="#3498db" />

                {effectiveStats.setNames.length > 0 && (
                  <View style={styles.setRow}>
                    {effectiveStats.setNames.map((n) => (
                      <View key={n} style={styles.setChip}>
                        <Text style={styles.setText}>SET: {n.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {ability && (
                  <View style={styles.abilityCard}>
                    <View style={styles.abilityHeader}>
                      <Text style={styles.abilityIcon}>{ability.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.abilityName}>{ability.name}</Text>
                        <Text style={styles.abilityMeta}>
                          {ability.manaCost} MP · {ability.cooldownTicks}t CD · {ability.element}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.abilityDesc}>{ability.description}</Text>
                    {selectedHero.passiveDesc && (
                      <Text style={styles.passive}>⚜ Passive: {selectedHero.passiveDesc}</Text>
                    )}
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.levelBtn}
                    onPress={() => {
                      const cost = selectedHero.level * 50;
                      if (gold < cost) { Alert.alert('Not enough gold!'); return; }
                      levelUpHero(selectedHero.id);
                    }}
                  >
                    <Text style={styles.levelBtnText}>⬆ Level Up ({selectedHero.level * 50}g)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ascendBtn, selectedHero.stars >= 5 && { opacity: 0.4 }]}
                    onPress={() => {
                      if (selectedHero.stars >= 5) return;
                      const cost = (selectedHero.stars + 1) * 30;
                      if (gems < cost) { Alert.alert('Not enough gems!'); return; }
                      ascendHero(selectedHero.id);
                    }}
                  >
                    <Text style={styles.ascendBtnText}>
                      ★ Ascend ({(selectedHero.stars + 1) * 30}💎)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Talents */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.sectionTitle}>TALENTS · {availableTalentTier(selectedHero.level)}/4 unlocked</Text>
                  <TouchableOpacity
                    style={styles.respecBtn}
                    onPress={() => {
                      if (gems < 50) { Alert.alert('Not enough gems', 'Respec costs 50 gems.'); return; }
                      respecTalents(selectedHero.id);
                    }}
                  >
                    <Text style={styles.respecText}>↺ Respec (50💎)</Text>
                  </TouchableOpacity>
                </View>
                {TALENT_UNLOCK_LEVELS.map((reqLvl, tier) => {
                  const unlocked = selectedHero.level >= reqLvl;
                  const options = TALENTS[selectedHero.heroClass]?.[tier] ?? [];
                  const choice = selectedHero.talentChoices?.[tier] ?? -1;
                  return (
                    <View key={tier} style={styles.talentTier}>
                      <Text style={styles.talentTierLabel}>
                        TIER {tier + 1} {unlocked ? '' : `· Lv${reqLvl}`}
                      </Text>
                      <View style={styles.talentRow}>
                        {options.map((opt, optIdx) => {
                          const picked = choice === optIdx;
                          return (
                            <TouchableOpacity
                              key={opt.id}
                              disabled={!unlocked}
                              style={[
                                styles.talentBtn,
                                picked && styles.talentPicked,
                                !unlocked && styles.talentLocked,
                              ]}
                              onPress={() => pickTalent(selectedHero.id, tier, optIdx)}
                            >
                              <Text style={[styles.talentName, picked && { color: '#27ae60' }]}>
                                {opt.name}
                              </Text>
                              <Text style={styles.talentDesc}>{opt.description}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.sectionTitle}>EQUIPMENT</Text>
                  <TouchableOpacity
                    style={styles.autoEquipBtn}
                    onPress={() => autoEquipBest(selectedHero.id)}
                  >
                    <Text style={styles.autoEquipText}>✨ Auto-equip best</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.equipSlots}>
                  <EquipSlot
                    label="Weapon"
                    itemId={selectedHero.weaponId}
                    onRemove={() => unequipItem(selectedHero.id, 'weapon')}
                  />
                  <EquipSlot
                    label="Armor"
                    itemId={selectedHero.armorId}
                    onRemove={() => unequipItem(selectedHero.id, 'armor')}
                  />
                  <EquipSlot
                    label="Accessory"
                    itemId={selectedHero.accessoryId}
                    onRemove={() => unequipItem(selectedHero.id, 'accessory')}
                  />
                </View>

                <View style={styles.tabRow}>
                  {(['weapon', 'armor', 'accessory'] as const).map((t) => (
                    <TouchableOpacity key={t} style={[styles.tab, equipTab === t && styles.tabActive]} onPress={() => setEquipTab(t)}>
                      <Text style={[styles.tabText, equipTab === t && styles.tabTextActive]}>{t.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {ownedEquipment.length === 0 ? (
                  <Text style={styles.empty}>No {equipTab}s owned.</Text>
                ) : ownedEquipment.map((item) => {
                  const isEquippedOnThis =
                    item.id === selectedHero.weaponId ||
                    item.id === selectedHero.armorId ||
                    item.id === selectedHero.accessoryId;
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
            <Text style={styles.noDetailText}>Select a hero to view details</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function EquipSlot({ label, itemId, onRemove }: { label: string; itemId: string | null; onRemove: () => void }) {
  const store = useGameStore();
  const item = itemId ? store.equipment[itemId] : null;
  return (
    <View style={styles.equipSlot}>
      <Text style={styles.slotLabel}>{label}</Text>
      {item ? (
        <TouchableOpacity onPress={onRemove} style={styles.slotFilled}>
          <Text style={styles.slotIcon}>{item.icon}</Text>
          <Text style={styles.slotName} numberOfLines={1}>{item.name}{item.level > 0 && ` +${item.level}`}</Text>
          <Text style={styles.slotRemove}>✕</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.slotEmpty}><Text style={styles.slotEmptyText}>Empty</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#888', fontSize: 13 },
  title: { color: '#f1c40f', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  gold: { color: '#f1c40f', fontWeight: '700', fontSize: 13 },
  filterBar: { flexDirection: 'row', padding: 8, gap: 6 },
  filterBtn: { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: '#1e1e2e', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  filterBtnActive: { backgroundColor: '#2a2a4e', borderColor: '#7c83fd' },
  filterText: { color: '#666', fontSize: 11, fontWeight: '600' },
  filterTextActive: { color: '#7c83fd' },
  body: { flex: 1, flexDirection: 'row' },
  list: { width: 120, borderRightWidth: 1, borderRightColor: '#1e1e2e', padding: 8 },
  benchName: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  benchClass: { color: '#666', fontSize: 9, marginTop: 1 },
  favStar: { fontSize: 12, position: 'absolute', right: 14, top: 4 },
  lockChip: { backgroundColor: '#000a', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginTop: 2 },
  lockChipText: { color: '#f1c40f', fontSize: 9 },
  detail: { flex: 1, padding: 12 },
  detailHeader: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  detailName: { fontSize: 17, fontWeight: '800' },
  detailClass: { color: '#888', fontSize: 11, marginTop: 1 },
  detailDesc: { color: '#999', fontSize: 11, lineHeight: 14, marginTop: 4 },
  tagRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 9, fontWeight: '700' },
  sectionTitle: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 12, marginBottom: 6 },
  setRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  setChip: { backgroundColor: '#f1c40f44', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  setText: { color: '#f1c40f', fontSize: 9, fontWeight: '700' },
  abilityCard: { backgroundColor: '#2a2a4e', borderRadius: 10, padding: 10, marginTop: 12, borderWidth: 1, borderColor: '#7c83fd' },
  abilityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  abilityIcon: { fontSize: 22 },
  abilityName: { color: '#7c83fd', fontWeight: '800', fontSize: 13 },
  abilityMeta: { color: '#888', fontSize: 9, marginTop: 1 },
  abilityDesc: { color: '#bbb', fontSize: 11, marginTop: 6, lineHeight: 14 },
  passive: { color: '#f9e79f', fontSize: 10, marginTop: 6, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  levelBtn: { flex: 1, backgroundColor: '#f1c40f22', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#f1c40f' },
  levelBtnText: { color: '#f1c40f', fontWeight: '700', fontSize: 11 },
  ascendBtn: { flex: 1, backgroundColor: '#bb8fce22', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#bb8fce' },
  ascendBtnText: { color: '#bb8fce', fontWeight: '700', fontSize: 11 },
  unlockBtn: { backgroundColor: '#27ae6022', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 14, borderWidth: 1, borderColor: '#27ae60' },
  unlockBtnText: { color: '#27ae60', fontWeight: '700', fontSize: 15 },
  equipSlots: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  equipSlot: { flex: 1 },
  slotLabel: { color: '#666', fontSize: 9, marginBottom: 4 },
  slotFilled: { backgroundColor: '#1e1e2e', borderRadius: 8, padding: 6, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#333' },
  slotIcon: { fontSize: 14 },
  slotName: { flex: 1, color: '#ccc', fontSize: 10 },
  slotRemove: { color: '#e74c3c', fontWeight: '700', fontSize: 10 },
  slotEmpty: { backgroundColor: '#1e1e2e', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a', borderStyle: 'dashed' },
  slotEmptyText: { color: '#444', fontSize: 10 },
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: '#1e1e2e', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  tabActive: { backgroundColor: '#2a2a4e', borderColor: '#7c83fd' },
  tabText: { color: '#666', fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: '#7c83fd' },
  empty: { color: '#444', fontSize: 12, textAlign: 'center', padding: 20 },
  noDetail: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noDetailText: { color: '#333', fontSize: 13, textAlign: 'center' },
  autoEquipBtn: { backgroundColor: '#3498db33', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#3498db' },
  autoEquipText: { color: '#3498db', fontSize: 10, fontWeight: '700' },
  respecBtn: { backgroundColor: '#bb8fce33', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#bb8fce' },
  respecText: { color: '#bb8fce', fontSize: 10, fontWeight: '700' },
  talentTier: { marginVertical: 4 },
  talentTierLabel: { color: '#666', fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  talentRow: { flexDirection: 'row', gap: 6 },
  talentBtn: { flex: 1, backgroundColor: '#1e1e2e', borderRadius: 8, padding: 6, borderWidth: 1, borderColor: '#333' },
  talentPicked: { borderColor: '#27ae60', backgroundColor: '#0d2a0d' },
  talentLocked: { opacity: 0.4 },
  talentName: { color: '#fff', fontSize: 10, fontWeight: '700' },
  talentDesc: { color: '#888', fontSize: 9, marginTop: 2, lineHeight: 11 },
});

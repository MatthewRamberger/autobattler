import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useGameStore, getHeroEffectiveStats } from '../store/gameStore';
import { CLASS_COLORS } from '../data/heroes';
import { ABILITIES } from '../data/abilities';
import { TALENTS, TALENT_UNLOCK_LEVELS, availableTalentTier } from '../data/talents';
import { KILL_MILESTONES, BATTLE_MILESTONES, nextKillMilestone } from '../data/milestones';
import StatBar from '../components/StatBar';
import EquipmentCard from '../components/EquipmentCard';
import HeroPortrait from '../components/HeroPortrait';
import { Screen, TopBar, Panel, GButton, CurrencyBar, SectionTitle, palette, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

const UNLOCK_COSTS: Record<string, number> = { common: 100, rare: 250, epic: 500, legendary: 1000, mythic: 2500 };

export default function CollectionScreen() {
  const store = useGameStore();
  const { heroes, gold, gems, setScreen, unlockHero, levelUpHero, ascendHero, unequipItem, equipItem, toggleFavorite, autoEquipBest, pickTalent, respecTalents } = store;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [equipTab, setEquipTab] = useState<'weapon' | 'armor' | 'accessory'>('weapon');
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'favorite'>('all');

  const heroList = Object.values(heroes).filter((h) =>
    filter === 'unlocked' ? h.unlocked : filter === 'favorite' ? h.favorite : true);
  const hero = selectedId ? heroes[selectedId] : null;
  const stats = selectedId ? getHeroEffectiveStats(selectedId, store) : null;
  const ability = hero ? ABILITIES[hero.abilityId] : null;
  const ownedEquipment = Object.values(store.equipment).filter((e) =>
    e.type === equipTab && (e.owned > 0 || e.id === hero?.weaponId || e.id === hero?.armorId || e.id === hero?.accessoryId));

  return (
    <Screen>
      <TopBar title="HEROES" onBack={() => setScreen('home')} right={<CurrencyBar gold={gold} gems={gems} />} />
      <View style={styles.filterBar}>
        {(['all', 'unlocked', 'favorite'] as const).map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.fBtn, filter === f && styles.fBtnOn]}>
            <Text style={[styles.fText, filter === f && styles.fTextOn]}>{f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.body}>
        <ScrollView style={styles.listPane} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30, gap: 4 }}>
          {heroList.map((h) => {
            const sel = h.id === selectedId;
            const g = rarityGradient[h.rarity] ?? rarityGradient.common;
            return (
              <TouchableOpacity key={h.id} activeOpacity={0.85} onPress={() => setSelectedId(sel ? null : h.id)}
                style={[styles.listItem, sel && styles.listItemOn]}>
                <HeroPortrait size={76} heroClass={h.heroClass} rarity={h.rarity} icon={h.icon}
                  element={h.baseStats.element} seed={h.portraitSeed} level={h.level} stars={h.stars}
                  dimmed={!h.unlocked} selected={sel} />
                <Text style={[styles.listName, { color: g[0] }]} numberOfLines={1}>{h.name}</Text>
                <Text style={styles.listClass}>{h.heroClass}</Text>
                {h.favorite && <Text style={styles.fav}>⭐</Text>}
                {!h.unlocked && <Text style={styles.lockChip}>🔒 {UNLOCK_COSTS[h.rarity]}g</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {hero && stats ? (
          <ScrollView style={styles.detailPane} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 70 }}>
            <Panel style={{ marginBottom: spacing.md }}>
              <View style={styles.dHead}>
                <HeroPortrait size={88} heroClass={hero.heroClass} rarity={hero.rarity} icon={hero.icon}
                  element={hero.baseStats.element} seed={hero.portraitSeed} level={hero.level} stars={hero.stars} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dName, { color: (rarityGradient[hero.rarity] ?? rarityGradient.common)[0] }]}>{hero.name}</Text>
                  <Text style={styles.dClass}>{hero.heroClass} · {hero.baseStats.element}</Text>
                  <Text style={styles.dDesc} numberOfLines={3}>{hero.description}</Text>
                </View>
                {hero.unlocked && (
                  <TouchableOpacity onPress={() => toggleFavorite(hero.id)}>
                    <Text style={{ fontSize: 22 }}>{hero.favorite ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Panel>

            {!hero.unlocked ? (
              <GButton wide variant="green" label={`🔓 Unlock for ${UNLOCK_COSTS[hero.rarity]}g`}
                onPress={() => {
                  const c = UNLOCK_COSTS[hero.rarity];
                  if (gold < c) { Alert.alert('Not enough gold!'); return; }
                  unlockHero(hero.id, c);
                }} />
            ) : (
              <>
                <Panel style={{ marginBottom: spacing.md }}>
                  <SectionTitle>STATS · POWER {stats.power}</SectionTitle>
                  <StatBar label="HP" value={stats.maxHp} max={600} color="#ff6a55" />
                  <StatBar label="ATK" value={stats.attack} max={130} color="#ff9a4a" />
                  <StatBar label="DEF" value={stats.defense} max={80} color="#3da4ff" />
                  <StatBar label="SPD" value={stats.speed} max={12} color="#56d364" />
                  <StatBar label="CRT" value={Math.round(stats.critRate * 100)} max={100} color={palette.gold} />
                  <StatBar label="DGE" value={Math.round(stats.dodge * 100)} max={100} color={palette.purple} />
                  <StatBar label="MP" value={stats.maxMana} max={300} color="#3da4ff" />
                  {stats.setNames.length > 0 && (
                    <View style={styles.setRow}>
                      {stats.setNames.map((n) => (
                        <View key={n} style={styles.setChip}><Text style={styles.setText}>SET: {n.toUpperCase()}</Text></View>
                      ))}
                    </View>
                  )}
                </Panel>

                {ability && (
                  <Panel glow={palette.purple} style={{ marginBottom: spacing.md }}>
                    <View style={styles.abilityHead}>
                      <Text style={styles.abilityIcon}>{ability.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.abilityName}>{ability.name}</Text>
                        <Text style={styles.abilityMeta}>{ability.manaCost} MP · {ability.cooldownTicks}t · {ability.element}</Text>
                      </View>
                    </View>
                    <Text style={styles.abilityDesc}>{ability.description}</Text>
                    {hero.passiveDesc && <Text style={styles.passive}>⚜ {hero.passiveDesc}</Text>}
                  </Panel>
                )}

                <View style={styles.actionRow}>
                  <GButton variant="gold" label={`⬆ Level (${hero.level * 50}g)`} style={{ flex: 1 }}
                    onPress={() => { if (gold < hero.level * 50) { Alert.alert('Not enough gold!'); return; } levelUpHero(hero.id); }} />
                  <GButton variant="purple" label={`★ Ascend (${(hero.stars + 1) * 30}💎)`} style={{ flex: 1 }}
                    disabled={hero.stars >= 5}
                    onPress={() => { if (gems < (hero.stars + 1) * 30) { Alert.alert('Not enough gems!'); return; } ascendHero(hero.id); }} />
                </View>

                <Panel style={{ marginTop: spacing.md }}>
                  <SectionTitle>MILESTONES · ⚔{hero.kills ?? 0} · 🛡{hero.battlesUsed ?? 0}</SectionTitle>
                  <View style={styles.mRow}>
                    {KILL_MILESTONES.map((m, i) => {
                      const done = (hero.kills ?? 0) >= m.threshold;
                      return (
                        <View key={`k${i}`} style={[styles.mItem, done && styles.mDone]}>
                          <Text style={[styles.mText, done && { color: palette.green }]}>{m.threshold}⚔</Text>
                          <Text style={styles.mEff}>+{m.attackBonus}atk</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.mRow}>
                    {BATTLE_MILESTONES.map((m, i) => {
                      const done = (hero.battlesUsed ?? 0) >= m.threshold;
                      return (
                        <View key={`b${i}`} style={[styles.mItem, done && styles.mDone]}>
                          <Text style={[styles.mText, done && { color: palette.green }]}>{m.threshold}🛡</Text>
                          <Text style={styles.mEff}>+{m.hpBonus}hp</Text>
                        </View>
                      );
                    })}
                  </View>
                  {nextKillMilestone(hero.kills ?? 0) && (
                    <Text style={styles.mNext}>Next ⚔: {hero.kills ?? 0} / {nextKillMilestone(hero.kills ?? 0)!.threshold}</Text>
                  )}
                </Panel>

                <Panel style={{ marginTop: spacing.md }}>
                  <View style={styles.sectRow}>
                    <SectionTitle>TALENTS · {availableTalentTier(hero.level)}/4</SectionTitle>
                    <GButton small variant="purple" label="↺ Respec 50💎"
                      onPress={() => { if (gems < 50) { Alert.alert('Not enough gems'); return; } respecTalents(hero.id); }} />
                  </View>
                  {TALENT_UNLOCK_LEVELS.map((reqLvl, tier) => {
                    const unlocked = hero.level >= reqLvl;
                    const options = TALENTS[hero.heroClass]?.[tier] ?? [];
                    const choice = hero.talentChoices?.[tier] ?? -1;
                    return (
                      <View key={tier} style={{ marginVertical: 4 }}>
                        <Text style={styles.tTier}>TIER {tier + 1}{unlocked ? '' : ` · Lv${reqLvl}`}</Text>
                        <View style={styles.tRow}>
                          {options.map((opt, oi) => {
                            const picked = choice === oi;
                            return (
                              <TouchableOpacity key={opt.id} disabled={!unlocked}
                                onPress={() => pickTalent(hero.id, tier, oi)}
                                style={[styles.tBtn, picked && styles.tPicked, !unlocked && { opacity: 0.4 }]}>
                                <Text style={[styles.tName, picked && { color: palette.green }]}>{opt.name}</Text>
                                <Text style={styles.tDesc}>{opt.description}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </Panel>

                <View style={[styles.sectRow, { marginTop: spacing.md }]}>
                  <SectionTitle>EQUIPMENT</SectionTitle>
                  <GButton small variant="blue" label="✨ Auto-equip" onPress={() => autoEquipBest(hero.id)} />
                </View>
                <View style={styles.slots}>
                  <EquipSlot label="Weapon" itemId={hero.weaponId} onRemove={() => unequipItem(hero.id, 'weapon')} />
                  <EquipSlot label="Armor" itemId={hero.armorId} onRemove={() => unequipItem(hero.id, 'armor')} />
                  <EquipSlot label="Trinket" itemId={hero.accessoryId} onRemove={() => unequipItem(hero.id, 'accessory')} />
                </View>
                <View style={styles.eqTabs}>
                  {(['weapon', 'armor', 'accessory'] as const).map((t) => (
                    <TouchableOpacity key={t} onPress={() => setEquipTab(t)} style={[styles.eqTab, equipTab === t && styles.eqTabOn]}>
                      <Text style={[styles.eqTabText, equipTab === t && styles.eqTabTextOn]}>{t.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {ownedEquipment.length === 0 ? (
                  <Text style={styles.empty}>No {equipTab}s owned.</Text>
                ) : ownedEquipment.map((item) => {
                  const onThis = item.id === hero.weaponId || item.id === hero.armorId || item.id === hero.accessoryId;
                  const canEquip = item.owned > 0 && !onThis && (!item.requiredClass || item.requiredClass.includes(hero.heroClass));
                  return (
                    <EquipmentCard key={item.id} item={item} equipped={onThis}
                      onPress={() => {
                        if (onThis) return;
                        if (!canEquip) { Alert.alert('Cannot equip', 'Wrong class or none available.'); return; }
                        equipItem(hero.id, item.id);
                      }} />
                  );
                })}
              </>
            )}
          </ScrollView>
        ) : (
          <View style={styles.noDetail}><Text style={styles.noDetailText}>Select a hero{'\n'}to view details</Text></View>
        )}
      </View>
    </Screen>
  );
}

function EquipSlot({ label, itemId, onRemove }: { label: string; itemId: string | null; onRemove: () => void }) {
  const store = useGameStore();
  const item = itemId ? store.equipment[itemId] : null;
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.slotLabel}>{label}</Text>
      {item ? (
        <TouchableOpacity onPress={onRemove} style={styles.slotFilled}>
          <Text style={styles.slotIcon}>{item.icon}</Text>
          <Text style={styles.slotName} numberOfLines={1}>{item.name}{item.level > 0 && ` +${item.level}`}</Text>
          <Text style={styles.slotX}>✕</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.slotEmpty}><Text style={styles.slotEmptyText}>Empty</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, paddingBottom: 4 },
  fBtn: { flex: 1, paddingVertical: 6, borderRadius: 7, backgroundColor: palette.panelDeep, alignItems: 'center', borderWidth: 1.5, borderColor: '#0007' },
  fBtnOn: { backgroundColor: palette.goldDeep, borderColor: palette.gold },
  fText: { color: palette.textMute, fontSize: 11, fontWeight: '800' },
  fTextOn: { color: '#fff' },
  body: { flex: 1, flexDirection: 'row' },
  listPane: { width: 116, paddingHorizontal: 6, paddingTop: 6 },
  listItem: { alignItems: 'center', padding: 6, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  listItemOn: { backgroundColor: palette.panel, borderColor: palette.gold },
  listName: { fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 3 },
  listClass: { color: palette.textMute, fontSize: 8, marginTop: 1 },
  fav: { fontSize: 11, position: 'absolute', right: 8, top: 6 },
  lockChip: { color: palette.gold, fontSize: 8, marginTop: 2, fontWeight: '700' },
  detailPane: { flex: 1, padding: 12 },
  dHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dName: { fontSize: 17, fontWeight: '900' },
  dClass: { color: palette.textMute, fontSize: 11, marginTop: 1, fontWeight: '600' },
  dDesc: { color: palette.textSoft, fontSize: 11, lineHeight: 15, marginTop: 4 },
  setRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  setChip: { backgroundColor: palette.goldDark + '66', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  setText: { color: palette.gold, fontSize: 9, fontWeight: '800' },
  abilityHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  abilityIcon: { fontSize: 24 },
  abilityName: { color: palette.purple, fontWeight: '900', fontSize: 14 },
  abilityMeta: { color: palette.textMute, fontSize: 9, marginTop: 1 },
  abilityDesc: { color: palette.textSoft, fontSize: 11, marginTop: 6, lineHeight: 15 },
  passive: { color: '#f9e79f', fontSize: 10, marginTop: 6, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 8 },
  sectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mRow: { flexDirection: 'row', gap: 4, marginVertical: 3 },
  mItem: { flex: 1, backgroundColor: palette.panelDeep, borderRadius: 6, padding: 4, alignItems: 'center', borderWidth: 1, borderColor: '#0006' },
  mDone: { backgroundColor: palette.greenDeep + '44', borderColor: palette.green },
  mText: { color: palette.textMute, fontSize: 10, fontWeight: '800' },
  mEff: { color: palette.textDim, fontSize: 8, marginTop: 1 },
  mNext: { color: palette.textDim, fontSize: 9, marginTop: 4 },
  tTier: { color: palette.textMute, fontSize: 9, letterSpacing: 1, marginBottom: 4, fontWeight: '700' },
  tRow: { flexDirection: 'row', gap: 6 },
  tBtn: { flex: 1, backgroundColor: palette.panelDeep, borderRadius: 8, padding: 6, borderWidth: 1.5, borderColor: '#0006' },
  tPicked: { borderColor: palette.green, backgroundColor: palette.greenDeep + '33' },
  tName: { color: palette.text, fontSize: 10, fontWeight: '800' },
  tDesc: { color: palette.textMute, fontSize: 9, marginTop: 2, lineHeight: 12 },
  slots: { flexDirection: 'row', gap: 6, marginBottom: 10, marginTop: 6 },
  slotLabel: { color: palette.textMute, fontSize: 9, marginBottom: 4, fontWeight: '700' },
  slotFilled: { backgroundColor: palette.panelDeep, borderRadius: 8, padding: 6, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#0007' },
  slotIcon: { fontSize: 14 },
  slotName: { flex: 1, color: palette.textSoft, fontSize: 10, fontWeight: '600' },
  slotX: { color: palette.red, fontWeight: '900', fontSize: 10 },
  slotEmpty: { backgroundColor: palette.panelDeep, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#0006', borderStyle: 'dashed' },
  slotEmptyText: { color: palette.textDim, fontSize: 10 },
  eqTabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  eqTab: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: palette.panelDeep, alignItems: 'center', borderWidth: 1.5, borderColor: '#0007' },
  eqTabOn: { backgroundColor: palette.blueDeep, borderColor: palette.blue },
  eqTabText: { color: palette.textMute, fontSize: 11, fontWeight: '800' },
  eqTabTextOn: { color: '#fff' },
  empty: { color: palette.textDim, fontSize: 12, textAlign: 'center', padding: 20 },
  noDetail: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noDetailText: { color: palette.textDim, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

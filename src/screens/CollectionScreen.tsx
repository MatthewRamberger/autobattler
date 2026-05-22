import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, useWindowDimensions,
} from 'react-native';
import {
  useGameStore, getHeroEffectiveStats, deployableCopies,
  MAX_HERO_TIER, CARDS_PER_COMBINE, EffectiveStats,
} from '../store/gameStore';
import { Hero } from '../types';
import { ABILITIES } from '../data/abilities';
import { TALENTS, TALENT_UNLOCK_LEVELS, availableTalentTier } from '../data/talents';
import { KILL_MILESTONES, BATTLE_MILESTONES, nextKillMilestone } from '../data/milestones';
import StatBar from '../components/StatBar';
import EquipmentCard from '../components/EquipmentCard';
import HeroPortrait from '../components/HeroPortrait';
import { Screen, TopBar, Panel, GButton, CurrencyBar, SectionTitle, palette, spacing } from '../components/ui';
import { rarityGradient } from '../theme';

const UNLOCK_COSTS: Record<string, number> = {
  common: 100, rare: 250, epic: 500, legendary: 1000, mythic: 2500,
};

// Two-mode screen:
//  - GRID mode (no hero selected): a roomy 2-column grid of all heroes so
//    the user can browse without horizontal cramping.
//  - DETAIL mode (a hero selected): a single full-width scroll view with
//    every panel, sized so descriptions and ability text never wrap into
//    a tiny side column.
export default function CollectionScreen() {
  const store = useGameStore();
  const {
    heroes, heroCards, gold, gems, setScreen, unlockHero,
    combineHeroCards, unequipItem, equipItem, toggleFavorite,
    autoEquipBest, pickTalent, respecTalents,
  } = store;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [equipTab, setEquipTab] = useState<'weapon' | 'armor' | 'accessory'>('weapon');
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'favorite'>('all');
  const { width: screenW } = useWindowDimensions();

  const heroList = Object.values(heroes).filter((h) =>
    filter === 'unlocked' ? h.unlocked : filter === 'favorite' ? h.favorite : true);
  const hero = selectedId ? heroes[selectedId] : null;
  const stats = selectedId ? getHeroEffectiveStats(selectedId, store) : null;

  if (hero && stats) {
    return (
      <HeroDetail
        hero={hero}
        stats={stats}
        gold={gold}
        gems={gems}
        cards={heroCards[hero.id] ?? 0}
        equipTab={equipTab}
        setEquipTab={setEquipTab}
        onBack={() => setSelectedId(null)}
        onHome={() => setScreen('home')}
        onUnlock={(cost) => {
          if (gold < cost) { Alert.alert('Not enough gold!'); return; }
          unlockHero(hero.id, cost);
        }}
        onCombine={() => combineHeroCards(hero.id)}
        onToggleFav={() => toggleFavorite(hero.id)}
        onAutoEquip={() => autoEquipBest(hero.id)}
        onUnequip={(slot) => unequipItem(hero.id, slot)}
        onEquip={(itemId) => equipItem(hero.id, itemId)}
        onPickTalent={(tier, choice) => pickTalent(hero.id, tier, choice)}
        onRespec={() => {
          if (gems < 50) { Alert.alert('Not enough gems'); return; }
          respecTalents(hero.id);
        }}
      />
    );
  }

  // Grid view. 2 columns on phones, 3 on wider screens.
  const cols = screenW >= 600 ? 3 : 2;
  const gridGap = 8;
  const tileW = Math.floor((screenW - 28 - gridGap * (cols - 1)) / cols);

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

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.grid, { gap: gridGap }]}>
          {heroList.map((h) => {
            const g = rarityGradient[h.rarity] ?? rarityGradient.common;
            const cards = heroCards[h.id] ?? 0;
            return (
              <TouchableOpacity
                key={h.id}
                activeOpacity={0.85}
                onPress={() => setSelectedId(h.id)}
                style={[styles.tile, { width: tileW, borderColor: g[1] }]}
              >
                <HeroPortrait
                  size={tileW - 24}
                  heroClass={h.heroClass} rarity={h.rarity} icon={h.icon}
                  element={h.baseStats.element} seed={h.portraitSeed}
                  level={h.level}
                  dimmed={!h.unlocked}
                />
                <Text style={[styles.tileName, { color: g[0] }]} numberOfLines={1}>{h.name}</Text>
                <Text style={styles.tileClass}>{h.heroClass}</Text>
                <View style={styles.tileFooter}>
                  <Text style={styles.tileChip}>T{h.level}</Text>
                  {h.unlocked
                    ? <Text style={styles.tileCards}>🃏 {cards}</Text>
                    : <Text style={styles.tileLock}>🔒 {UNLOCK_COSTS[h.rarity]}g</Text>}
                </View>
                {h.favorite && <Text style={styles.fav}>⭐</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

interface DetailProps {
  hero: Hero;
  stats: EffectiveStats;
  gold: number;
  gems: number;
  cards: number;
  equipTab: 'weapon' | 'armor' | 'accessory';
  setEquipTab: (t: 'weapon' | 'armor' | 'accessory') => void;
  onBack: () => void;
  onHome: () => void;
  onUnlock: (cost: number) => void;
  onCombine: () => void;
  onToggleFav: () => void;
  onAutoEquip: () => void;
  onUnequip: (slot: 'weapon' | 'armor' | 'accessory') => void;
  onEquip: (itemId: string) => void;
  onPickTalent: (tier: number, choice: number) => void;
  onRespec: () => void;
}

function HeroDetail({
  hero, stats, gold, gems, cards, equipTab, setEquipTab,
  onBack, onHome, onUnlock, onCombine, onToggleFav, onAutoEquip,
  onUnequip, onEquip, onPickTalent, onRespec,
}: DetailProps) {
  const store = useGameStore();
  const ability = ABILITIES[hero.abilityId];
  const grad = rarityGradient[hero.rarity] ?? rarityGradient.common;
  const maxed = hero.level >= MAX_HERO_TIER;
  const canCombine = !maxed && cards >= CARDS_PER_COMBINE;
  const copies = deployableCopies(hero.unlocked, cards);
  const cardsForNext = Math.max(0, CARDS_PER_COMBINE - cards);

  const ownedEquipment = Object.values(store.equipment).filter((e) =>
    e.type === equipTab && (e.owned > 0 || e.id === hero.weaponId || e.id === hero.armorId || e.id === hero.accessoryId));

  return (
    <Screen>
      <TopBar
        title={hero.name.toUpperCase()}
        onBack={onBack}
        right={
          <TouchableOpacity onPress={onHome} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.homeBtn}>🏠</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Panel style={{ marginBottom: spacing.md }}>
          <View style={styles.dHead}>
            <HeroPortrait
              size={104}
              heroClass={hero.heroClass} rarity={hero.rarity} icon={hero.icon}
              element={hero.baseStats.element} seed={hero.portraitSeed}
              level={hero.level}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.dName, { color: grad[0] }]}>{hero.name}</Text>
              <Text style={styles.dClass}>{hero.heroClass} · {hero.baseStats.element}</Text>
              <Text style={styles.dRarity}>{hero.rarity.toUpperCase()} · T{hero.level}/{MAX_HERO_TIER}</Text>
              {hero.unlocked && (
                <TouchableOpacity onPress={onToggleFav} style={styles.favBtn}>
                  <Text style={{ fontSize: 22 }}>{hero.favorite ? '⭐ Favorite' : '☆ Favorite'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.dDesc}>{hero.description}</Text>
        </Panel>

        {!hero.unlocked ? (
          <GButton
            wide variant="green"
            label={`🔓 Unlock for ${UNLOCK_COSTS[hero.rarity]}g`}
            onPress={() => onUnlock(UNLOCK_COSTS[hero.rarity])}
          />
        ) : (
          <>
            <Panel glow={palette.blue} style={{ marginBottom: spacing.md }}>
              <SectionTitle>HERO CARDS · TIER {hero.level} / {MAX_HERO_TIER}</SectionTitle>
              <View style={styles.cardRow}>
                <View style={styles.cardStack}>
                  <Text style={styles.cardStackIcon}>🃏</Text>
                  <Text style={styles.cardStackNum}>{cards}</Text>
                  <Text style={styles.cardStackLbl}>CARDS</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rankPips}>
                    {Array.from({ length: MAX_HERO_TIER }).map((_, i) => (
                      <View key={i} style={[styles.rankPip, i < hero.level && styles.rankPipOn]} />
                    ))}
                  </View>
                  <Text style={styles.cardHint}>
                    {maxed
                      ? 'Maximum tier reached. Cards now only feed multi-deploy.'
                      : `Combine ${CARDS_PER_COMBINE} cards to reach Tier ${hero.level + 1}. Each tier compounds +35% HP, +25% ATK/DEF.`}
                  </Text>
                  <Text style={styles.cardHint2}>
                    🛡 Deploy up to {copies} cop{copies === 1 ? 'y' : 'ies'} per battle.
                  </Text>
                </View>
              </View>
              {!maxed && (
                <GButton
                  wide variant="blue"
                  label={canCombine
                    ? `🃏 COMBINE ${CARDS_PER_COMBINE} CARDS → TIER ${hero.level + 1}`
                    : `Need ${cardsForNext} more card${cardsForNext === 1 ? '' : 's'} to combine`}
                  disabled={!canCombine}
                  onPress={onCombine}
                />
              )}
            </Panel>

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
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.abilityName}>{ability.name}</Text>
                    <Text style={styles.abilityMeta}>
                      {ability.manaCost} MP · {ability.cooldownTicks}t · {ability.element}
                    </Text>
                  </View>
                </View>
                <Text style={styles.abilityDesc}>{ability.description}</Text>
                {hero.passiveDesc && <Text style={styles.passive}>⚜ {hero.passiveDesc}</Text>}
              </Panel>
            )}

            <Panel style={{ marginBottom: spacing.md }}>
              <SectionTitle>MILESTONES · ⚔ {hero.kills ?? 0} · 🛡 {hero.battlesUsed ?? 0}</SectionTitle>
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

            <Panel style={{ marginBottom: spacing.md }}>
              <View style={styles.sectRow}>
                <SectionTitle>TALENTS · {availableTalentTier(hero.level)}/4</SectionTitle>
                <GButton small variant="purple" label="↺ Respec 50💎" onPress={onRespec} />
              </View>
              {TALENT_UNLOCK_LEVELS.map((reqTier, tier) => {
                const unlocked = hero.level >= reqTier;
                const options = TALENTS[hero.heroClass]?.[tier] ?? [];
                const choice = hero.talentChoices?.[tier] ?? -1;
                return (
                  <View key={tier} style={{ marginVertical: 4 }}>
                    <Text style={styles.tTier}>
                      TIER {tier + 1}{unlocked ? '' : ` · Reach T${reqTier}`}
                    </Text>
                    <View style={styles.tRow}>
                      {options.map((opt, oi) => {
                        const picked = choice === oi;
                        return (
                          <TouchableOpacity
                            key={opt.id} disabled={!unlocked}
                            onPress={() => onPickTalent(tier, oi)}
                            style={[styles.tBtn, picked && styles.tPicked, !unlocked && { opacity: 0.4 }]}
                          >
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

            <Panel style={{ marginBottom: spacing.md }}>
              <View style={styles.sectRow}>
                <SectionTitle>EQUIPMENT</SectionTitle>
                <GButton small variant="blue" label="✨ Auto-equip" onPress={onAutoEquip} />
              </View>
              <View style={styles.slots}>
                <EquipSlot label="Weapon" itemId={hero.weaponId} onRemove={() => onUnequip('weapon')} />
                <EquipSlot label="Armor" itemId={hero.armorId} onRemove={() => onUnequip('armor')} />
                <EquipSlot label="Trinket" itemId={hero.accessoryId} onRemove={() => onUnequip('accessory')} />
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
                  <EquipmentCard
                    key={item.id} item={item} equipped={onThis}
                    onPress={() => {
                      if (onThis) return;
                      if (!canEquip) { Alert.alert('Cannot equip', 'Wrong class or none available.'); return; }
                      onEquip(item.id);
                    }}
                  />
                );
              })}
            </Panel>
          </>
        )}
      </ScrollView>
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
          <Text style={styles.slotName} numberOfLines={1}>
            {item.name}{item.level > 1 && ` T${item.level}`}
          </Text>
          <Text style={styles.slotX}>✕</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.slotEmpty}><Text style={styles.slotEmptyText}>Empty</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: { flexDirection: 'row', paddingHorizontal: 14, gap: 6, paddingBottom: 6 },
  fBtn: { flex: 1, paddingVertical: 7, borderRadius: 7, backgroundColor: palette.panelDeep, alignItems: 'center', borderWidth: 1.5, borderColor: '#0007' },
  fBtnOn: { backgroundColor: palette.goldDeep, borderColor: palette.gold },
  fText: { color: palette.textMute, fontSize: 11, fontWeight: '800' },
  fTextOn: { color: '#fff' },

  // ---------- grid (list) view ----------
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    backgroundColor: palette.panel, borderWidth: 2, borderRadius: 12,
    padding: 12, alignItems: 'center', position: 'relative',
  },
  tileName: { fontSize: 12, fontWeight: '900', marginTop: 6, textAlign: 'center' },
  tileClass: { color: palette.textMute, fontSize: 10, marginTop: 1 },
  tileFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginTop: 6,
  },
  tileChip: {
    color: palette.gold, fontSize: 11, fontWeight: '900',
    backgroundColor: palette.panelDeep, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: palette.goldDark,
  },
  tileCards: { color: palette.blue, fontSize: 11, fontWeight: '800' },
  tileLock: { color: palette.gold, fontSize: 10, fontWeight: '800' },
  fav: { fontSize: 12, position: 'absolute', right: 8, top: 8 },

  // ---------- detail view ----------
  homeBtn: { fontSize: 22 },
  dHead: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  dName: { fontSize: 22, fontWeight: '900' },
  dClass: { color: palette.textSoft, fontSize: 13, marginTop: 2, fontWeight: '600' },
  dRarity: { color: palette.textMute, fontSize: 11, marginTop: 2, fontWeight: '700', letterSpacing: 1 },
  favBtn: { marginTop: 8 },
  dDesc: { color: palette.textSoft, fontSize: 13, lineHeight: 18, marginTop: 10 },
  setRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  setChip: { backgroundColor: palette.goldDark + '66', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  setText: { color: palette.gold, fontSize: 9, fontWeight: '800' },
  abilityHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  abilityIcon: { fontSize: 28 },
  abilityName: { color: palette.purple, fontWeight: '900', fontSize: 15 },
  abilityMeta: { color: palette.textMute, fontSize: 11, marginTop: 1 },
  abilityDesc: { color: palette.textSoft, fontSize: 12, marginTop: 8, lineHeight: 17 },
  passive: { color: '#f9e79f', fontSize: 11, marginTop: 8, fontStyle: 'italic', lineHeight: 16 },
  cardRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 12 },
  cardStack: {
    width: 76, height: 76, borderRadius: 14, backgroundColor: palette.panelDeep,
    borderWidth: 2, borderColor: palette.blueDeep, alignItems: 'center', justifyContent: 'center',
  },
  cardStackIcon: { fontSize: 22 },
  cardStackNum: { color: palette.text, fontSize: 22, fontWeight: '900', marginTop: -2 },
  cardStackLbl: { color: palette.textMute, fontSize: 7, fontWeight: '800', letterSpacing: 1 },
  rankPips: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  rankPip: { flex: 1, height: 10, borderRadius: 5, backgroundColor: palette.panelDeep, borderWidth: 1, borderColor: '#0007' },
  rankPipOn: { backgroundColor: palette.gold, borderColor: palette.goldDeep },
  cardHint: { color: palette.textSoft, fontSize: 11, lineHeight: 15, fontWeight: '600' },
  cardHint2: { color: palette.blue, fontSize: 11, fontWeight: '700', marginTop: 4 },
  sectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mRow: { flexDirection: 'row', gap: 4, marginVertical: 3 },
  mItem: { flex: 1, backgroundColor: palette.panelDeep, borderRadius: 6, padding: 4, alignItems: 'center', borderWidth: 1, borderColor: '#0006' },
  mDone: { backgroundColor: palette.greenDeep + '44', borderColor: palette.green },
  mText: { color: palette.textMute, fontSize: 10, fontWeight: '800' },
  mEff: { color: palette.textDim, fontSize: 9, marginTop: 1 },
  mNext: { color: palette.textDim, fontSize: 10, marginTop: 6 },
  tTier: { color: palette.textMute, fontSize: 10, letterSpacing: 1, marginBottom: 4, fontWeight: '700' },
  tRow: { flexDirection: 'row', gap: 6 },
  tBtn: { flex: 1, backgroundColor: palette.panelDeep, borderRadius: 8, padding: 8, borderWidth: 1.5, borderColor: '#0006' },
  tPicked: { borderColor: palette.green, backgroundColor: palette.greenDeep + '33' },
  tName: { color: palette.text, fontSize: 11, fontWeight: '800' },
  tDesc: { color: palette.textMute, fontSize: 10, marginTop: 3, lineHeight: 13 },
  slots: { flexDirection: 'row', gap: 8, marginBottom: 12, marginTop: 6 },
  slotLabel: { color: palette.textMute, fontSize: 10, marginBottom: 5, fontWeight: '700' },
  slotFilled: { backgroundColor: palette.panelDeep, borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#0007' },
  slotIcon: { fontSize: 16 },
  slotName: { flex: 1, color: palette.textSoft, fontSize: 11, fontWeight: '600' },
  slotX: { color: palette.red, fontWeight: '900', fontSize: 11 },
  slotEmpty: { backgroundColor: palette.panelDeep, borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#0006', borderStyle: 'dashed' },
  slotEmptyText: { color: palette.textDim, fontSize: 11 },
  eqTabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  eqTab: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: palette.panelDeep, alignItems: 'center', borderWidth: 1.5, borderColor: '#0007' },
  eqTabOn: { backgroundColor: palette.blueDeep, borderColor: palette.blue },
  eqTabText: { color: palette.textMute, fontSize: 11, fontWeight: '800' },
  eqTabTextOn: { color: '#fff' },
  empty: { color: palette.textDim, fontSize: 12, textAlign: 'center', padding: 20 },
});

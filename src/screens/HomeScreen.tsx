import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { LEVELS, DIFFICULTY_COLORS } from '../data/levels';
import {
  Screen, palette, gradients, radius, spacing, shadow,
} from '../components/ui';

// Mobile-game home: a single tap-to-play hero banner is the focus,
// secondary play modes get bigger cards, and a single horizontally
// scrollable shelf gathers all the supporting screens (collection,
// economy, meta, settings) so the surface stays uncluttered.
export default function HomeScreen() {
  const {
    setScreen, gold, gems, heroes, levelProgress, arenaBestWave,
    totalVictories, totalBattles, totalDamageDealt, totalKills, reset,
    dailyQuests, dailyQuestProgress, achievements, loginStreak,
    setCurrentLevel,
  } = useGameStore();

  const unlockedCount = Object.values(heroes).filter((h) => h.unlocked).length;
  const totalHeroes = Object.keys(heroes).length;
  const completedLevels = Object.values(levelProgress).filter((p) => p.completed).length;
  const winRate = totalBattles > 0 ? Math.round((totalVictories / totalBattles) * 100) : 0;
  const claimableQuests = dailyQuests.filter((q) => {
    const ap = dailyQuestProgress[q.id];
    return ap && ap.progress >= q.goal && !ap.claimed;
  }).length;
  const claimableAchievements = Object.entries(achievements).filter(([, ap]) => !ap.claimed && ap.progress > 0).length;

  // Next level the player has not yet cleared — drives the hero banner.
  const nextLevel = useMemo(() => {
    return LEVELS.find((l) => !levelProgress[l.id]?.completed) ?? LEVELS[LEVELS.length - 1];
  }, [levelProgress]);
  const nextDiffColors = (DIFFICULTY_COLORS[nextLevel.difficulty] ?? '#888');

  const playerLevel = Math.max(1, Math.floor(totalVictories / 5) + 1);

  const playNext = () => {
    setCurrentLevel(nextLevel.id);
    setScreen('battle-prep');
  };

  return (
    <Screen>
      {/* --- Top profile + currency strip ---------------------------- */}
      <View style={styles.topBar}>
        <View style={styles.profileWrap}>
          <View style={styles.avatar}>
            <LinearGradient colors={['#ffd24a', '#a16a14'] as const} style={StyleSheet.absoluteFill} />
            <Text style={styles.avatarIcon}>⚔️</Text>
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.profileName}>Commander</Text>
            <View style={styles.lvlPill}>
              <Text style={styles.lvlText}>LVL {playerLevel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.currencyStack}>
          <View style={styles.currencyPill}>
            <Text style={styles.currencyIcon}>🪙</Text>
            <Text style={styles.currencyText}>{gold}</Text>
            <View style={styles.plusBtn}><Text style={styles.plusTxt}>+</Text></View>
          </View>
          <View style={[styles.currencyPill, { marginTop: 6 }]}>
            <Text style={styles.currencyIcon}>💎</Text>
            <Text style={styles.currencyText}>{gems}</Text>
            <View style={styles.plusBtn}><Text style={styles.plusTxt}>+</Text></View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.settingsBtn}
          activeOpacity={0.85}
          onPress={() => setScreen('settings')}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Hero banner: featured next campaign battle ------------ */}
        <TouchableOpacity activeOpacity={0.9} onPress={playNext} style={styles.heroWrap}>
          <LinearGradient
            colors={[nextDiffColors, '#1b1027'] as readonly [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroBgGlow} pointerEvents="none" />
            <View style={styles.heroTop}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>NEXT BATTLE</Text>
              </View>
              <Text style={styles.heroDifficulty}>{nextLevel.difficulty.toUpperCase()}</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={1}>{nextLevel.name}</Text>
            <Text style={styles.heroDesc} numberOfLines={2}>{nextLevel.description}</Text>
            <View style={styles.heroBottom}>
              <View style={styles.heroProgress}>
                <Text style={styles.heroProgressText}>
                  CAMPAIGN  ·  {completedLevels}/{LEVELS.length}
                </Text>
                <View style={styles.heroBar}>
                  <View
                    style={[styles.heroBarFill, {
                      width: `${Math.round((completedLevels / LEVELS.length) * 100)}%`,
                    }]}
                  />
                </View>
              </View>
              <View style={styles.playBtn}>
                <LinearGradient colors={['#54e06a', '#1a7a2a'] as const} style={styles.playBtnGrad}>
                  <Text style={styles.playBtnText}>▶ PLAY</Text>
                </LinearGradient>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* --- Mode select: Arena + Summon --------------------------- */}
        <View style={styles.modeRow}>
          <ModeCard
            colors={['#ff6aa8', '#c0246b']}
            icon="🏟️"
            title="ARENA"
            sub={`Wave ${arenaBestWave}`}
            onPress={() => setScreen('arena')}
          />
          <ModeCard
            colors={['#b89bff', '#6a3fd0']}
            icon="🔮"
            title="SUMMON"
            sub="Pull heroes"
            onPress={() => setScreen('summon')}
          />
        </View>

        {/* --- Roster row: Heroes / Equipment / Forge ---------------- */}
        <SectionLabel>ROSTER</SectionLabel>
        <View style={styles.gridRow}>
          <SmallCard
            colors={['#54b8ff', '#1f6fd6']}
            icon="🦸"
            title="HEROES"
            sub={`${unlockedCount}/${totalHeroes}`}
            onPress={() => setScreen('collection')}
          />
          <SmallCard
            colors={['#5ed36a', '#2c9c3a']}
            icon="🎒"
            title="GEAR"
            sub="Equip"
            onPress={() => setScreen('equipment')}
          />
          <SmallCard
            colors={['#ffb74d', '#e0791a']}
            icon="🔨"
            title="FORGE"
            sub="Upgrade"
            onPress={() => setScreen('forge')}
          />
        </View>

        {/* --- Economy row: Shop / Chests / Stronghold --------------- */}
        <SectionLabel>ECONOMY</SectionLabel>
        <View style={styles.gridRow}>
          <SmallCard
            colors={['#ffd24a', '#e0a016']}
            icon="🏪"
            title="SHOP"
            sub="Daily"
            onPress={() => setScreen('shop')}
          />
          <SmallCard
            colors={['#c07bff', '#7a3fd0']}
            icon="📦"
            title="CHESTS"
            sub="Open loot"
            onPress={() => setScreen('chests')}
          />
          <SmallCard
            colors={['#f6c945', '#d29a1c']}
            icon="🏰"
            title="BASE"
            sub="Stronghold"
            onPress={() => setScreen('stronghold')}
          />
        </View>

        {/* --- Quests row: Daily / Awards ---------------------------- */}
        <SectionLabel>QUESTS</SectionLabel>
        <View style={styles.questRow}>
          <QuestCard
            colors={['#ff8f5a', '#d8542a']}
            icon="📅"
            title="DAILY"
            sub={`Streak 🔥 ${loginStreak}`}
            badge={claimableQuests}
            onPress={() => setScreen('daily')}
          />
          <QuestCard
            colors={['#c07bff', '#7a3fd0']}
            icon="🏆"
            title="AWARDS"
            sub="Claim milestones"
            badge={claimableAchievements}
            onPress={() => setScreen('achievements')}
          />
        </View>

        {/* --- Footer pills: Codex / Stats --------------------------- */}
        <View style={styles.footerPills}>
          <FooterPill icon="📖" label="Codex" onPress={() => setScreen('codex')} />
          <FooterPill icon="📊" label="Stats" onPress={() => setScreen('stats')} />
        </View>

        {/* --- Live stats summary ------------------------------------ */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📜  LIFETIME</Text>
          <View style={styles.statsGrid}>
            <StatCell label="Battles" value={`${totalBattles}`} />
            <StatCell label="Win rate" value={`${winRate}%`} />
            <StatCell label="Damage" value={`${totalDamageDealt}`} />
            <StatCell label="Kills" value={`${totalKills}`} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.reset}
          onPress={() => Alert.alert('Reset save?', 'This wipes all progress.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Wipe', style: 'destructive', onPress: reset },
          ])}
        >
          <Text style={styles.resetText}>Reset progress</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

// --------------------------------------------------------------------
// Reusable building blocks
// --------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function ModeCard({
  colors, icon, title, sub, onPress,
}: { colors: readonly [string, string]; icon: string; title: string; sub: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.modeCard} activeOpacity={0.85} onPress={onPress}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modeCardGrad}>
        <View style={styles.modeGloss} pointerEvents="none" />
        <View style={styles.modeIconWrap}>
          <Text style={styles.modeIcon}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.modeTitle}>{title}</Text>
          <Text style={styles.modeSub}>{sub}</Text>
        </View>
        <Text style={styles.modeArrow}>›</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function SmallCard({
  colors, icon, title, sub, onPress,
}: { colors: readonly [string, string]; icon: string; title: string; sub: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.smallCard} activeOpacity={0.85} onPress={onPress}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.smallCardGrad}>
        <View style={styles.smallGloss} pointerEvents="none" />
        <Text style={styles.smallIcon}>{icon}</Text>
        <Text style={styles.smallTitle}>{title}</Text>
        <Text style={styles.smallSub} numberOfLines={1}>{sub}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function QuestCard({
  colors, icon, title, sub, badge, onPress,
}: { colors: readonly [string, string]; icon: string; title: string; sub: string; badge: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.questCard} activeOpacity={0.85} onPress={onPress}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.questCardGrad}>
        <View style={styles.smallGloss} pointerEvents="none" />
        <Text style={styles.questIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.questTitle}>{title}</Text>
          <Text style={styles.questSub} numberOfLines={1}>{sub}</Text>
        </View>
        {badge > 0 && (
          <View style={styles.questBadge}>
            <Text style={styles.questBadgeText}>{badge}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function FooterPill({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.footerPill} activeOpacity={0.8} onPress={onPress}>
      <Text style={styles.footerPillIcon}>{icon}</Text>
      <Text style={styles.footerPillText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statKey}>{label}</Text>
    </View>
  );
}

// --------------------------------------------------------------------
const styles = StyleSheet.create({
  // ---- top bar ----
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 38,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  profileWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, borderColor: '#fff8',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    ...shadow.card,
  },
  avatarIcon: { fontSize: 22 },
  profileName: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  lvlPill: {
    marginTop: 3,
    backgroundColor: '#0007',
    borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 1,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#ffffff22',
  },
  lvlText: { color: palette.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },

  currencyStack: { alignItems: 'flex-end' },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1530',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#ffffff22',
    paddingLeft: 6, paddingRight: 4, paddingVertical: 2,
    minWidth: 88,
    ...shadow.card,
  },
  currencyIcon: { fontSize: 13, marginRight: 4 },
  currencyText: { color: '#fff', fontWeight: '900', fontSize: 11, flex: 1, textAlign: 'right', marginRight: 4 },
  plusBtn: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: palette.green,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#fff7',
  },
  plusTxt: { color: '#fff', fontWeight: '900', fontSize: 12, marginTop: -2 },

  settingsBtn: {
    width: 38, height: 38, borderRadius: 19,
    marginLeft: 8,
    backgroundColor: '#1c1530',
    borderWidth: 1.5, borderColor: '#ffffff22',
    alignItems: 'center', justifyContent: 'center',
    ...shadow.card,
  },
  settingsIcon: { color: palette.textSoft, fontSize: 18, fontWeight: '900' },

  // ---- scroll body ----
  scroll: { paddingHorizontal: 14, paddingBottom: 30 },

  // ---- hero card ----
  heroWrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff33',
    marginTop: 6,
    ...shadow.card,
  },
  heroCard: {
    padding: 16,
    minHeight: 168,
  },
  heroBgGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
    backgroundColor: '#ffffff20',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBadge: {
    backgroundColor: '#000a',
    borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: '#ffffff33',
  },
  heroBadgeText: { color: palette.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  heroDifficulty: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, opacity: 0.7 },
  heroTitle: {
    color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 0.5, marginTop: 10,
    textShadowColor: '#0008', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3,
  },
  heroDesc: {
    color: '#fff', fontSize: 12, fontWeight: '600', opacity: 0.85, marginTop: 4,
    minHeight: 32,
  },
  heroBottom: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12,
  },
  heroProgress: { flex: 1 },
  heroProgressText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, opacity: 0.85 },
  heroBar: {
    height: 6, borderRadius: 3, backgroundColor: '#0006', marginTop: 4,
    overflow: 'hidden', borderWidth: 1, borderColor: '#ffffff22',
  },
  heroBarFill: { height: '100%', backgroundColor: palette.gold },
  playBtn: { borderRadius: 999, overflow: 'hidden', borderWidth: 2, borderColor: '#fff8' },
  playBtnGrad: {
    paddingHorizontal: 22, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  playBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1.2, textShadowColor: '#0007', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  // ---- mode row (Arena / Summon) ----
  modeRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modeCard: {
    flex: 1, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 2, borderColor: '#ffffff33',
    ...shadow.card,
  },
  modeCardGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
  },
  modeGloss: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: '#ffffff22',
  },
  modeIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#00000033',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#ffffff55',
    marginRight: 8,
  },
  modeIcon: { fontSize: 18 },
  modeTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  modeSub: { color: '#ffffffcc', fontSize: 10, fontWeight: '600', marginTop: 1 },
  modeArrow: { color: '#fff', fontSize: 22, fontWeight: '900', opacity: 0.6, marginLeft: 4 },

  // ---- section header ----
  sectionLabel: {
    color: palette.textMute, fontSize: 9, fontWeight: '900', letterSpacing: 2,
    marginTop: 16, marginBottom: 6, marginLeft: 4,
  },

  // ---- small 3-up cards ----
  gridRow: { flexDirection: 'row', gap: 8 },
  smallCard: {
    flex: 1, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 2, borderColor: '#ffffff33',
    ...shadow.card,
  },
  smallCardGrad: {
    padding: 10, alignItems: 'center', minHeight: 90, justifyContent: 'center',
  },
  smallGloss: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
    backgroundColor: '#ffffff22',
  },
  smallIcon: { fontSize: 26, marginBottom: 2 },
  smallTitle: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 0.5, textShadowColor: '#0007', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  smallSub: { color: '#ffffffcc', fontSize: 9, fontWeight: '600', marginTop: 1, textAlign: 'center' },

  // ---- quest row ----
  questRow: { flexDirection: 'row', gap: 8 },
  questCard: {
    flex: 1, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 2, borderColor: '#ffffff33',
    ...shadow.card,
  },
  questCardGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
  },
  questIcon: { fontSize: 22, marginRight: 10 },
  questTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  questSub: { color: '#ffffffcc', fontSize: 10, fontWeight: '600', marginTop: 1 },
  questBadge: {
    backgroundColor: palette.red, borderRadius: 11,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5, borderWidth: 2, borderColor: '#fff',
  },
  questBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  // ---- footer pills ----
  footerPills: { flexDirection: 'row', gap: 8, marginTop: 14 },
  footerPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: '#1c1530',
    borderWidth: 1.5, borderColor: '#ffffff22',
  },
  footerPillIcon: { fontSize: 14 },
  footerPillText: { color: palette.textSoft, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // ---- stats card ----
  statsCard: {
    marginTop: 14, padding: 12, borderRadius: radius.lg,
    backgroundColor: '#1c1530',
    borderWidth: 1.5, borderColor: '#ffffff14',
  },
  statsTitle: { color: palette.gold, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statCell: { alignItems: 'center', flex: 1 },
  statValue: { color: palette.text, fontWeight: '900', fontSize: 15 },
  statKey: { color: palette.textMute, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },

  // ---- reset ----
  reset: { padding: 16, alignItems: 'center', marginTop: 4 },
  resetText: { color: palette.textDim, fontSize: 11 },
});

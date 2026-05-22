import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingNumber from '../FloatingNumber';
import { ABILITIES } from '../../data/abilities';
import { StatusEffectType, HeroClass } from '../../types';
import { LiveUnit, UnitAnims, VfxNumber } from '../../hooks/useBattleReplay';
import { HexLayout, hexCenter } from '../../utils/hex';
import { palette } from '../../theme';
import { ELEMENT_COLORS } from '../../data/heroes';

const STATUS_ICON: Record<StatusEffectType, string> = {
  poison: '☠️', burn: '🔥', stun: '💫', freeze: '❄️', slow: '🐌', regen: '💚',
  shield: '🛡️', taunt: '😡', rage: '💢', bleed: '🩸', blind: '🌑', silence: '🤐', fortify: '🪨',
};

// Per-class avatar style: gradient backdrop colors + a class glyph that
// reads at glance even at small sizes. The character icon (hero.icon) is
// kept as the primary big read; the backdrop carries the class identity.
interface ClassStyle {
  bg: readonly [string, string, string];
  rim: readonly [string, string];
  glyph: string;        // small badge in the corner
  accent: string;       // for accent ring / star colors
}

const CLASS_STYLES: Record<HeroClass, ClassStyle> = {
  Warrior:     { bg: ['#ff9a55', '#c2521a', '#3a1a06'], rim: ['#ffd6a5', '#a85c1a'], glyph: '⚔️', accent: '#ffb066' },
  Archer:      { bg: ['#7ddc70', '#2a8a4a', '#0a2a14'], rim: ['#caefb8', '#27735a'], glyph: '🏹', accent: '#7ddc70' },
  Mage:        { bg: ['#c994ff', '#5a2eb0', '#1a0a3a'], rim: ['#e7c8ff', '#6837cc'], glyph: '🔮', accent: '#c994ff' },
  Paladin:     { bg: ['#ffe07a', '#d29a1c', '#3a2e0c'], rim: ['#fff2c0', '#a87a14'], glyph: '✨', accent: '#ffd24a' },
  Rogue:       { bg: ['#6b7184', '#3a3f4f', '#0a0c14'], rim: ['#aab3c5', '#3a3f4f'], glyph: '🗡️', accent: '#9aa7c5' },
  Berserker:   { bg: ['#ff6a55', '#a82820', '#3a0a06'], rim: ['#ffb09c', '#a82820'], glyph: '🪓', accent: '#ff6a55' },
  Cleric:      { bg: ['#fff2c0', '#c8a058', '#5a3c08'], rim: ['#ffffff', '#c8a058'], glyph: '✚', accent: '#ffea9c' },
  Druid:       { bg: ['#9ee07a', '#2a9c5a', '#0a3a1a'], rim: ['#d3f5b8', '#2a9c5a'], glyph: '🌿', accent: '#9ee07a' },
  Necromancer: { bg: ['#a47fff', '#3a1c70', '#0c0420'], rim: ['#cbb0ff', '#3a1c70'], glyph: '💀', accent: '#a47fff' },
  Monk:        { bg: ['#ffd07a', '#b06f1a', '#3a2208'], rim: ['#ffe9c0', '#b06f1a'], glyph: '👊', accent: '#ffd07a' },
};

interface Props {
  unit: LiveUnit;
  anims?: UnitAnims;
  vfx: VfxNumber[];
  layout: HexLayout;
}

// Position is rendered directly from `unit.position` via hexCenter on every
// React commit. The Animated.Values drive small visual polish (scale,
// opacity, flash, bob, shake, lunge) all on the native driver.
function UnitAvatarBase({ unit, anims, vfx, layout }: Props) {
  const { hexW, hexH } = layout;
  const cellW = hexW;
  const cellH = hexH;

  const { cx, cy } = hexCenter(unit.position, layout);
  const left = cx - cellW / 2;
  const top = cy - cellH / 2;

  const facing = anims?.facing ?? (unit.isPlayer ? 1 : -1);
  const lunge = anims
    ? anims.punch.interpolate({
        inputRange: [-1, 0, 1, 1.5],
        outputRange: [-facing * (cellW * 0.22), 0, facing * (cellW * 0.32), facing * (cellW * 0.48)],
      })
    : 0;
  const bobY = anims ? anims.bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) : 0;
  const rotateDeg = anims
    ? anims.rotate.interpolate({
        inputRange: [-1, 0, 1, 1.25, 1.5, 1.75, 2],
        outputRange: [
          `${-facing * 35}deg`,
          '0deg',
          `${facing * 35}deg`,
          `${facing * 200}deg`,
          `${facing * 380}deg`,
          `${facing * 560}deg`,
          `${facing * 720}deg`,
        ],
      })
    : '0deg';

  const teamColor = unit.isPlayer ? palette.blue : palette.red;
  const teamColorDeep = unit.isPlayer ? '#1f6fd6' : '#a82820';
  const ability = unit.abilityId ? ABILITIES[unit.abilityId] : null;
  const ready = !!ability && unit.ticksUntilAbility === 0 && unit.mana >= ability.manaCost && unit.isAlive;
  const hpPct = Math.max(0, Math.min(1, unit.hp / Math.max(1, unit.maxHp)));
  const mpPct = unit.maxMana > 0 ? Math.max(0, Math.min(1, unit.mana / unit.maxMana)) : 0;
  const hpLow = hpPct < 0.35;

  // Sprite is now a layered illustrated avatar: gradient disc, rim ring,
  // emoji icon centered. Size proportional to the hex cell so the unit
  // sits comfortably.
  const portraitSize = Math.min(cellW, cellH) * 0.86;
  const elementTint = unit.element && unit.element !== 'physical' ? ELEMENT_COLORS[unit.element] : undefined;
  const classStyle = CLASS_STYLES[unit.heroClass] ?? CLASS_STYLES.Warrior;

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { width: cellW, height: cellH, left, top }]}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          transform: [
            { translateX: anims?.shake ?? 0 },
            { translateX: lunge ?? 0 },
            { translateY: bobY ?? 0 },
            { rotate: rotateDeg },
            { scale: anims?.scale ?? 1 },
          ],
          opacity: anims?.opacity ?? 1,
        }}
      >
        {/* Ground shadow — wider, soft */}
        <View style={[styles.shadow, {
          width: portraitSize * 0.95,
          height: portraitSize * 0.22,
          bottom: -portraitSize * 0.06,
        }]} />

        {unit.isAlive ? (
          <>
            {/* HP bar — chunky, rounded, with shield overlay */}
            <View style={[styles.hpWrap, { width: portraitSize * 1.0, borderColor: teamColorDeep }]}>
              <LinearGradient
                colors={
                  hpLow
                    ? ['#ff6a55', '#cf3623'] as const
                    : (unit.isPlayer ? ['#7df09a', '#2c9c3a'] as const : ['#ffb14a', '#cf6a16'] as const)
                }
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ width: `${hpPct * 100}%`, height: '100%' }}
              />
              {unit.shield > 0 && (
                <View style={styles.hpShield} />
              )}
            </View>

            {/* Mana bar — thin */}
            {unit.maxMana > 0 && (
              <View style={[styles.mpWrap, { width: portraitSize * 0.86 }]}>
                <LinearGradient
                  colors={['#7ad6ff', '#1f6fd6'] as any}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ width: `${mpPct * 100}%`, height: '100%' }}
                />
              </View>
            )}

            {/* Stat: damage-dealt badge — a tiny number above the HP bar,
                color-coded by team. Off when 0 to reduce clutter. */}
            {unit.damageDealt > 0 && (
              <View style={styles.dmgBadge}>
                <Text style={styles.dmgBadgeText}>⚔ {compactNum(unit.damageDealt)}</Text>
              </View>
            )}

            {/* Team rim glow behind the portrait */}
            <View style={[styles.teamGlow, {
              width: portraitSize + 6, height: portraitSize + 6,
              borderRadius: (portraitSize + 6) / 2,
              shadowColor: teamColor,
              borderColor: teamColor + '88',
            }]} />

            {/* Caster glow ring (cast_burst / cast_heal animations) */}
            {anims?.cast && (
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: portraitSize * 1.25, height: portraitSize * 1.25,
                  borderRadius: portraitSize * 0.7,
                  borderWidth: 3,
                  borderColor: elementTint ?? classStyle.accent,
                  opacity: anims.cast.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] }),
                  transform: [{ scale: anims.cast.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.15] }) }],
                  shadowColor: elementTint ?? classStyle.accent,
                  shadowOpacity: 1, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
                  elevation: 10,
                }}
              />
            )}

            {/* Portrait disc */}
            <View style={[styles.portraitWrap, {
              width: portraitSize, height: portraitSize, borderRadius: portraitSize / 2,
              borderColor: teamColorDeep,
            }]}>
              {/* Gradient backdrop */}
              <LinearGradient
                colors={classStyle.bg}
                start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                style={{ ...StyleSheet.absoluteFillObject, borderRadius: portraitSize / 2 }}
              />
              {/* Rim highlight inside the disc */}
              <View style={{
                position: 'absolute',
                left: portraitSize * 0.05, top: portraitSize * 0.05,
                width: portraitSize * 0.9, height: portraitSize * 0.4,
                borderRadius: portraitSize / 2,
                backgroundColor: classStyle.rim[0],
                opacity: 0.22,
              }} pointerEvents="none" />
              {/* Ambient occlusion — bottom inner shadow gives the disc roundness */}
              <LinearGradient
                pointerEvents="none"
                colors={['transparent', '#00000099'] as const}
                start={{ x: 0.5, y: 0.42 }} end={{ x: 0.5, y: 1 }}
                style={{ ...StyleSheet.absoluteFillObject, borderRadius: portraitSize / 2 }}
              />
              {/* Glossy crown highlight */}
              <View pointerEvents="none" style={{
                position: 'absolute', top: portraitSize * 0.07, alignSelf: 'center',
                width: portraitSize * 0.5, height: portraitSize * 0.19,
                borderRadius: 999, backgroundColor: '#ffffff', opacity: 0.34,
              }} />

              {/* Big hero icon — emoji rendered crisp at portrait scale */}
              <View
                style={{
                  position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                  alignItems: 'center', justifyContent: 'center',
                  transform: [{ scaleX: unit.isPlayer ? 1 : -1 }],
                }}
                pointerEvents="none"
              >
                <Text style={{
                  fontSize: portraitSize * 0.6,
                  textShadowColor: '#000a',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}>
                  {unit.icon}
                </Text>
              </View>

              {/* Damage flash overlay */}
              {anims?.flash && (
                <Animated.View
                  pointerEvents="none"
                  style={[StyleSheet.absoluteFillObject, {
                    borderRadius: portraitSize / 2,
                    backgroundColor: '#ff5a5a',
                    opacity: anims.flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
                  }]}
                />
              )}

              {/* Element tint overlay — very subtle */}
              {elementTint && (
                <View
                  pointerEvents="none"
                  style={[StyleSheet.absoluteFillObject, {
                    borderRadius: portraitSize / 2,
                    backgroundColor: elementTint,
                    opacity: 0.14,
                  }]}
                />
              )}
            </View>

            {/* Impact ring — a shockwave that expands & fades on every hit */}
            {anims?.flash && (
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: portraitSize * 1.4, height: portraitSize * 1.4,
                  borderRadius: portraitSize * 0.7,
                  borderWidth: 3, borderColor: '#ffffff',
                  opacity: anims.flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] }),
                  transform: [{ scale: anims.flash.interpolate({ inputRange: [0, 1], outputRange: [1.5, 0.75] }) }],
                }}
              />
            )}

            {/* Stars indicator — small dots above */}
            {unit.stars > 0 && (
              <View style={styles.stars}>
                {Array.from({ length: unit.stars }).map((_, i) => (
                  <Text key={i} style={[styles.starDot, { color: classStyle.accent }]}>★</Text>
                ))}
              </View>
            )}

            {/* Ability ready glow */}
            {ready && (
              <View style={[styles.readyGlow, {
                width: portraitSize + 12, height: portraitSize + 12,
                borderRadius: (portraitSize + 12) / 2,
              }]} />
            )}

            {/* Status icon strip */}
            {unit.statuses.length > 0 && (
              <View style={styles.statusStrip}>
                {unit.statuses.slice(0, 4).map((s, i) => (
                  <Text key={i} style={styles.statusIcon}>{STATUS_ICON[s.type]}</Text>
                ))}
              </View>
            )}

            {/* Ability cooldown / ready pip */}
            {ability && (
              <View style={[styles.abilityPip, ready && styles.abilityPipReady]}>
                <Text style={styles.abilityPipText}>
                  {unit.ticksUntilAbility === 0 ? (ability.icon ?? '✦') : unit.ticksUntilAbility}
                </Text>
              </View>
            )}

            {/* Class badge — bottom-left tiny glyph */}
            <View style={[styles.classBadge, { backgroundColor: classStyle.bg[2] + 'dd', borderColor: classStyle.accent }]}>
              <Text style={styles.classBadgeText}>{classStyle.glyph}</Text>
            </View>
          </>
        ) : (
          // Death state: faded portrait + gravestone marker
          <View style={{ width: portraitSize, height: portraitSize, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{
              width: portraitSize, height: portraitSize, borderRadius: portraitSize / 2,
              backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: '#3a2a2a',
            }}>
              <Text style={{ fontSize: portraitSize * 0.55, opacity: 0.7 }}>🪦</Text>
            </View>
          </View>
        )}

        {/* Floating VFX (damage / heal numbers) */}
        <View style={styles.vfxLayer} pointerEvents="none">
          {vfx.map((v) => (
            <FloatingNumber key={v.id} text={v.text} color={v.color} fontSize={v.fontSize} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// A small standalone class-themed portrait used by prep screens & previews
// (no animations, no HP bar). Same visual language as the battle avatar.
export function MiniUnitPortrait({
  icon, heroClass, isPlayer, size, stars = 0,
}: {
  icon: string;
  heroClass: HeroClass;
  isPlayer: boolean;
  size: number;
  stars?: number;
}) {
  const classStyle = CLASS_STYLES[heroClass] ?? CLASS_STYLES.Warrior;
  const teamColor = isPlayer ? palette.blue : palette.red;
  const teamColorDeep = isPlayer ? '#1f6fd6' : '#a82820';
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', bottom: size * 0.05,
        width: size * 0.85, height: size * 0.14,
        borderRadius: 999, backgroundColor: '#00000088',
      }} pointerEvents="none" />
      <View style={{
        position: 'absolute',
        width: size + 4, height: size + 4, borderRadius: (size + 4) / 2,
        borderWidth: 1.5, borderColor: teamColor + '88',
        shadowColor: teamColor, shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
      }} pointerEvents="none" />
      <View style={{
        width: size * 0.85, height: size * 0.85, borderRadius: size * 0.43,
        overflow: 'hidden', borderWidth: 2, borderColor: teamColorDeep,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <LinearGradient
          colors={classStyle.bg}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={{ ...StyleSheet.absoluteFillObject }}
        />
        <View style={{
          position: 'absolute',
          left: size * 0.04, top: size * 0.04,
          width: size * 0.72, height: size * 0.32,
          borderRadius: size * 0.4,
          backgroundColor: classStyle.rim[0],
          opacity: 0.22,
        }} pointerEvents="none" />
        <View style={{
          transform: [{ scaleX: isPlayer ? 1 : -1 }],
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{
            fontSize: size * 0.5,
            textShadowColor: '#000a', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
          }}>{icon}</Text>
        </View>
      </View>
      {stars > 0 && (
        <View style={{
          position: 'absolute', top: -2, flexDirection: 'row', gap: 1,
        }}>
          {Array.from({ length: stars }).map((_, i) => (
            <Text key={i} style={{
              color: classStyle.accent, fontSize: size * 0.18, fontWeight: '900',
              textShadowColor: '#000a', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1,
            }}>★</Text>
          ))}
        </View>
      )}
    </View>
  );
}

function compactNum(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n / 1000)}k`;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  shadow: {
    position: 'absolute', borderRadius: 999, backgroundColor: '#000000aa',
  },
  portraitWrap: {
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5,
    shadowColor: '#000', shadowOpacity: 0.65, shadowRadius: 5, shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  teamGlow: {
    position: 'absolute',
    borderWidth: 2,
    shadowOpacity: 0.85, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 5,
  },
  readyGlow: {
    position: 'absolute',
    borderWidth: 2, borderColor: '#c9a3ff',
    shadowColor: '#b388ff', shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 9,
  },
  hpWrap: {
    height: 8, borderRadius: 5, backgroundColor: '#10131d', borderWidth: 1.5,
    overflow: 'hidden', marginBottom: 2,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  hpShield: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    borderColor: '#ffd24a', borderWidth: 1.5, borderRadius: 5,
  },
  mpWrap: { height: 3, borderRadius: 2, backgroundColor: '#10131d', overflow: 'hidden', marginBottom: 3, borderWidth: 1, borderColor: '#0007' },
  dmgBadge: {
    position: 'absolute', top: -16, alignSelf: 'center',
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5,
    backgroundColor: '#1a1228dd', borderWidth: 1, borderColor: '#ffd24a88',
  },
  dmgBadgeText: { color: '#ffd24a', fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  stars: {
    position: 'absolute', top: -10, flexDirection: 'row', gap: 1, alignItems: 'center',
  },
  starDot: { fontSize: 9, fontWeight: '900', textShadowColor: '#000a', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
  statusStrip: {
    position: 'absolute', top: -6, flexDirection: 'row', gap: 1,
    backgroundColor: '#000a', borderRadius: 4, paddingHorizontal: 2,
  },
  statusIcon: { fontSize: 9 },
  abilityPip: {
    position: 'absolute', bottom: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#000c', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#5a5570', paddingHorizontal: 3,
  },
  abilityPipReady: {
    borderColor: '#fff', backgroundColor: palette.purple,
    shadowColor: palette.purple, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  abilityPipText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  classBadge: {
    position: 'absolute', bottom: -2, left: -2, minWidth: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  classBadgeText: { fontSize: 8 },
  vfxLayer: { position: 'absolute', top: -10, left: 0, right: 0, alignItems: 'center' },
});

export default React.memo(UnitAvatarBase);

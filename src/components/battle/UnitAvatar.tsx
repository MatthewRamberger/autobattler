import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Sprite from './spriteRenderer';
import { spriteFor } from './spriteLibrary';
import FloatingNumber from '../FloatingNumber';
import { ABILITIES } from '../../data/abilities';
import { StatusEffectType } from '../../types';
import { LiveUnit, UnitAnims, VfxNumber } from '../../hooks/useBattleReplay';
import { HexLayout, hexCenter } from '../../utils/hex';
import { palette } from '../../theme';
import { ELEMENT_COLORS } from '../../data/heroes';

const STATUS_ICON: Record<StatusEffectType, string> = {
  poison: '☠️', burn: '🔥', stun: '💫', freeze: '❄️', slow: '🐌', regen: '💚',
  shield: '🛡️', taunt: '😡', rage: '💢', bleed: '🩸', blind: '🌑', silence: '🤐', fortify: '🪨',
};

interface Props {
  unit: LiveUnit;
  anims?: UnitAnims;
  vfx: VfxNumber[];
  layout: HexLayout;
}

function UnitAvatarBase({ unit, anims, vfx, layout }: Props) {
  const { hexW, hexH } = layout;
  // The avatar wrapper is sized to a full hex cell so badges/HP bars align
  // to its bounds rather than the sprite's pixel art.
  const cellW = hexW;
  const cellH = hexH;

  // In hex mode the anims `x`/`y` are PIXEL CENTER coordinates of the unit
  // in board space (not grid coords) — this lets us tween between cells
  // along an arbitrary screen-space line without worrying about the
  // odd-row half-cell offset.
  const cx = anims?.x ?? new Animated.Value(hexCenter(unit.position, layout).cx);
  const cy = anims?.y ?? new Animated.Value(hexCenter(unit.position, layout).cy);
  const shake = anims?.shake ?? new Animated.Value(0);
  const flash = anims?.flash ?? new Animated.Value(0);
  const punch = anims?.punch ?? new Animated.Value(0);
  const scale = anims?.scale ?? new Animated.Value(1);
  const opacity = anims?.opacity ?? new Animated.Value(1);
  const bob = anims?.bob ?? new Animated.Value(0);
  const facing = anims?.facing ?? (unit.isPlayer ? 1 : -1);

  const left = Animated.subtract(cx, cellW / 2);
  const top = Animated.subtract(cy, cellH / 2);

  const lunge = punch.interpolate({ inputRange: [0, 1], outputRange: [0, facing * (cellW * 0.32)] });
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const ring = unit.isPlayer ? palette.blue : palette.red;
  const ability = unit.abilityId ? ABILITIES[unit.abilityId] : null;
  const ready = !!ability && unit.ticksUntilAbility === 0 && unit.mana >= ability.manaCost && unit.isAlive;
  const hpPct = Math.max(0, Math.min(1, unit.hp / Math.max(1, unit.maxHp)));
  const mpPct = unit.maxMana > 0 ? Math.max(0, Math.min(1, unit.mana / unit.maxMana)) : 0;

  const def = spriteFor({
    heroId: unit.heroId,
    icon: unit.icon,
    heroClass: unit.heroClass,
    isPlayer: unit.isPlayer,
  });
  const spriteH = Math.min(cellW, cellH) * 0.92;
  const elementTint = unit.element && unit.element !== 'physical' ? ELEMENT_COLORS[unit.element] : undefined;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          width: cellW, height: cellH, left, top,
          transform: [{ translateX: Animated.add(shake, lunge) }],
        },
      ]}
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ translateY: bobY }, { scale }], opacity }}>
        {/* Hex-ish ground shadow under the sprite */}
        <View style={[styles.shadow, { width: spriteH * 0.85, height: spriteH * 0.16, bottom: -spriteH * 0.04 }]} />

        {unit.isAlive ? (
          <>
            {/* floating HP bar */}
            <View style={[styles.hpWrap, { width: spriteH * 0.92, borderColor: ring }]}>
              <View style={[styles.hpFill, { width: `${hpPct * 100}%`, backgroundColor: unit.isPlayer ? '#54e06a' : '#ff6a55' }]} />
              {unit.shield > 0 && <View style={styles.hpShield} />}
            </View>
            {unit.maxMana > 0 && (
              <View style={[styles.mpWrap, { width: spriteH * 0.78 }]}>
                <View style={[styles.mpFill, { width: `${mpPct * 100}%` }]} />
              </View>
            )}

            {/* Team rim glow behind the sprite */}
            <View style={[styles.rim, {
              width: spriteH, height: spriteH,
              borderRadius: spriteH / 2,
              shadowColor: ring,
            }]} />

            <View style={[styles.spriteSlot, { width: spriteH, height: spriteH }]}>
              <Sprite
                def={def}
                size={spriteH}
                flip={!unit.isPlayer}
                tint={elementTint}
                tintOpacity={0.18}
              />
              <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, {
                  backgroundColor: '#ff5a5a',
                  opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
                }]}
              />
            </View>

            {ready && <View style={[styles.readyGlow, { width: spriteH + 8, height: spriteH + 8, borderRadius: (spriteH + 8) / 2 }]} />}

            {unit.statuses.length > 0 && (
              <View style={styles.statusStrip}>
                {unit.statuses.slice(0, 4).map((s, i) => (
                  <Text key={i} style={styles.statusIcon}>{STATUS_ICON[s.type]}</Text>
                ))}
              </View>
            )}
            {ability && (
              <View style={[styles.abilityPip, ready && styles.abilityPipReady]}>
                <Text style={styles.abilityPipText}>
                  {unit.ticksUntilAbility === 0 ? (ability.icon ?? '✦') : unit.ticksUntilAbility}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={{ width: spriteH, height: spriteH, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: spriteH * 0.5, opacity: 0.7 }}>🪦</Text>
          </View>
        )}

        <View style={styles.vfxLayer} pointerEvents="none">
          {vfx.map((v) => (
            <FloatingNumber key={v.id} text={v.text} color={v.color} fontSize={v.fontSize} />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  shadow: { position: 'absolute', borderRadius: 999, backgroundColor: '#00000077' },
  spriteSlot: {
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  rim: {
    position: 'absolute',
    shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  readyGlow: {
    position: 'absolute', top: -4, borderWidth: 2, borderColor: '#c9a3ff',
    shadowColor: '#b388ff', shadowOpacity: 1, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 9,
  },
  hpWrap: {
    height: 7, borderRadius: 4, backgroundColor: '#10131d', borderWidth: 1.5,
    overflow: 'hidden', marginBottom: 2,
  },
  hpFill: { height: '100%' },
  hpShield: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderColor: '#ffd24a', borderWidth: 1.5, borderRadius: 4 },
  mpWrap: { height: 3, borderRadius: 2, backgroundColor: '#10131d', overflow: 'hidden', marginBottom: 3 },
  mpFill: { height: '100%', backgroundColor: '#3da4ff' },
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
  abilityPipText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  vfxLayer: { position: 'absolute', top: -10, left: 0, right: 0, alignItems: 'center' },
});

export default React.memo(UnitAvatarBase);

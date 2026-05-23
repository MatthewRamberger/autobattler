// Renders a single UnitEntity as a stack of Animated.Views: drop shadow,
// team-color aura ring, class-tinted body, weapon, head, and a status
// strip floating above the head. Everything below the head plate is
// driven entirely by the engine's Animated.Values — there is no
// per-frame setState here, so motion runs natively on the UI thread.
//
// The body is procedurally assembled from simple gradient slabs
// (no images, no SVG). Each class gets a distinct silhouette via
// shape/color overrides in `classBlueprint`.

import React from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HeroClass } from '../../types';
import { UnitEntity } from '../Engine';
import { ClassPalette, classPalette } from '../themes';
import { palette } from '../../theme';

interface Props {
  unit: UnitEntity;
  cellSize: number;
}

const UnitRenderer = React.memo(function UnitRenderer({ unit, cellSize }: Props) {
  const pal = classPalette(unit.heroClass);
  const teamColor = unit.isPlayer ? palette.blue : palette.red;
  const teamColorDeep = unit.isPlayer ? '#1f6fd6' : '#a82820';

  const size = cellSize * 0.94;
  const facing = unit.facing;
  const a = unit.anims;

  // Derived interpolations — all on native side.
  const bobY = a.bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const lungeX = a.lunge.interpolate({ inputRange: [-1, 0, 1, 1.5], outputRange: [-facing * 8, 0, facing * 14, facing * 22] });
  const weaponRot = a.weaponSwing.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [`${-facing * 50}deg`, '0deg', `${facing * 95}deg`],
  });
  const auraOpacity = a.cast.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          transform: [
            { translateX: Animated.add(a.tx, Animated.add(a.shake, lungeX)) as any },
            { translateY: Animated.add(a.ty, bobY) as any },
            { scale: a.scale },
          ],
          opacity: a.opacity,
        },
      ]}
    >
      {/* Drop shadow — flat ellipse beneath the unit. */}
      <View style={[styles.shadow, { width: size * 0.6, height: size * 0.18, borderRadius: size * 0.3 }]} />

      {/* Team aura ring (also drives cast-ready glow). */}
      <Animated.View
        style={[
          styles.aura,
          {
            width: size * 1.05,
            height: size * 0.4,
            borderRadius: size * 0.5,
            borderColor: pal.aura,
            shadowColor: pal.aura,
            opacity: auraOpacity,
          },
        ]}
      />

      {/* Body — a vertical stack of gradient bands so the silhouette
          reads from a distance. We center it inside the unit cell. */}
      <ClassBody
        size={size}
        heroClass={unit.heroClass}
        pal={pal}
        teamColor={teamColor}
        teamColorDeep={teamColorDeep}
        facing={facing}
      />

      {/* Weapon — anchored to the body's right hand, rotates on attack. */}
      <Animated.View
        style={[
          styles.weaponMount,
          {
            left: size * (0.5 + 0.2 * facing) - size * 0.1,
            top: size * 0.36,
            width: size * 0.2,
            height: size * 0.55,
            transform: [
              { rotateZ: weaponRot },
              { scaleX: facing as any },
            ],
          },
        ]}
      >
        <ClassWeapon heroClass={unit.heroClass} pal={pal} size={size} />
      </Animated.View>

      {/* Hit flash — full-rect white overlay on top of the body. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size, height: size,
          borderRadius: size * 0.45,
          backgroundColor: '#ffffff',
          opacity: a.flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.75] }),
        }}
      />
    </Animated.View>
  );
});

export default UnitRenderer;

// ---------------------------------------------------------------------
// Procedural body builder. Each class gets a different silhouette —
// boxy heavy armor for Warrior / Paladin, slim hooded shape for
// Archer / Rogue, robed cone for Mage / Cleric / Druid / Necromancer.
// ---------------------------------------------------------------------
function ClassBody({
  size, heroClass, pal, teamColor, teamColorDeep, facing,
}: {
  size: number; heroClass: HeroClass; pal: ClassPalette;
  teamColor: string; teamColorDeep: string; facing: 1 | -1;
}) {
  const blueprint = classBlueprint(heroClass);
  const torsoColors = [pal.body, pal.bodyDark] as const;
  const trimColors = [pal.trim, pal.trimDark] as const;

  // Body shape: a tall rounded "card" with a head circle on top.
  // The card has a colored skirt at the bottom for robed classes.
  const headSize = size * 0.32;
  const torsoH = size * 0.52;
  const torsoW = size * 0.5;
  const skirtH = blueprint.robed ? size * 0.22 : 0;

  return (
    <View pointerEvents="none" style={{
      position: 'absolute',
      width: size, height: size,
      alignItems: 'center', justifyContent: 'flex-end',
      paddingBottom: size * 0.04,
    }}>
      {/* Skirt (robe) — only for robed classes. Slightly flared cone via
          a trapezoidal Linear gradient. */}
      {blueprint.robed && (
        <View style={{
          width: torsoW * 1.4, height: skirtH,
          borderTopLeftRadius: torsoW * 0.6,
          borderTopRightRadius: torsoW * 0.6,
          borderBottomLeftRadius: torsoW * 0.4,
          borderBottomRightRadius: torsoW * 0.4,
          overflow: 'hidden',
          marginBottom: -skirtH * 0.05,
        }}>
          <LinearGradient
            colors={torsoColors}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* Torso — main body card. */}
      <View style={{
        width: torsoW, height: torsoH,
        borderRadius: torsoW * 0.4,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: teamColorDeep,
      }}>
        <LinearGradient
          colors={torsoColors}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Belt / sash across the middle. */}
        <View style={{
          position: 'absolute', left: 0, right: 0,
          top: torsoH * 0.55, height: torsoH * 0.12,
          backgroundColor: pal.trim,
          opacity: 0.85,
        }} />
        {/* Class glyph centered on the chest. */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{
            color: pal.trim,
            fontSize: torsoW * 0.45,
            fontWeight: '900',
            textShadowColor: '#0009',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            {pal.glyph}
          </Text>
        </View>

        {/* Shoulder pauldrons — for heavy classes only. */}
        {blueprint.pauldrons && (
          <>
            <View style={{
              position: 'absolute', left: -torsoW * 0.18, top: -2,
              width: torsoW * 0.4, height: torsoW * 0.3,
              borderRadius: torsoW * 0.2,
              backgroundColor: pal.trim,
              borderWidth: 1.5, borderColor: pal.trimDark,
            }} />
            <View style={{
              position: 'absolute', right: -torsoW * 0.18, top: -2,
              width: torsoW * 0.4, height: torsoW * 0.3,
              borderRadius: torsoW * 0.2,
              backgroundColor: pal.trim,
              borderWidth: 1.5, borderColor: pal.trimDark,
            }} />
          </>
        )}
      </View>

      {/* Head — sits above torso. Casters get a pointed hat instead. */}
      <View style={{
        position: 'absolute',
        top: size * 0.06,
        width: headSize,
        height: headSize,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {blueprint.hat === 'pointy' && (
          <View style={{
            position: 'absolute',
            top: -headSize * 0.8,
            width: 0, height: 0,
            borderLeftWidth: headSize * 0.4,
            borderRightWidth: headSize * 0.4,
            borderBottomWidth: headSize * 0.95,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: pal.bodyDark,
            transform: [{ rotateZ: '180deg' }],
          }} />
        )}
        {blueprint.hat === 'hood' && (
          <View style={{
            position: 'absolute',
            top: -headSize * 0.18,
            width: headSize * 1.4,
            height: headSize * 1.25,
            borderTopLeftRadius: headSize * 0.7,
            borderTopRightRadius: headSize * 0.7,
            backgroundColor: pal.bodyDark,
          }} />
        )}
        {blueprint.hat === 'halo' && (
          <View style={{
            position: 'absolute',
            top: -headSize * 0.25,
            width: headSize * 1.5,
            height: headSize * 0.15,
            borderRadius: headSize,
            backgroundColor: pal.trim,
            shadowColor: pal.trim,
            shadowOpacity: 0.9,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          }} />
        )}
        <View style={{
          width: headSize * 0.9, height: headSize * 0.9,
          borderRadius: headSize * 0.5,
          backgroundColor: pal.trim,
          borderWidth: 2, borderColor: teamColorDeep,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Eye dots */}
          <View style={{
            flexDirection: 'row', gap: headSize * 0.18,
            transform: [{ scaleX: facing as any }],
          }}>
            <View style={{ width: headSize * 0.1, height: headSize * 0.1, borderRadius: 999, backgroundColor: '#1a1a1a' }} />
            <View style={{ width: headSize * 0.1, height: headSize * 0.1, borderRadius: 999, backgroundColor: '#1a1a1a' }} />
          </View>
        </View>
        {blueprint.hat === 'crown' && (
          <View style={{
            position: 'absolute',
            top: -headSize * 0.1,
            width: headSize * 1.05,
            height: headSize * 0.22,
            backgroundColor: pal.trim,
            borderTopLeftRadius: headSize * 0.4,
            borderTopRightRadius: headSize * 0.4,
            borderWidth: 1.5,
            borderColor: pal.trimDark,
          }} />
        )}
      </View>
    </View>
  );
}

interface ClassBlueprint {
  robed: boolean;
  pauldrons: boolean;
  hat: 'none' | 'pointy' | 'hood' | 'halo' | 'crown';
}

function classBlueprint(cls: HeroClass): ClassBlueprint {
  switch (cls) {
    case 'Warrior':     return { robed: false, pauldrons: true,  hat: 'crown' };
    case 'Paladin':     return { robed: false, pauldrons: true,  hat: 'halo' };
    case 'Berserker':   return { robed: false, pauldrons: true,  hat: 'none' };
    case 'Archer':      return { robed: false, pauldrons: false, hat: 'hood' };
    case 'Rogue':       return { robed: false, pauldrons: false, hat: 'hood' };
    case 'Monk':        return { robed: false, pauldrons: false, hat: 'none' };
    case 'Mage':        return { robed: true,  pauldrons: false, hat: 'pointy' };
    case 'Necromancer': return { robed: true,  pauldrons: false, hat: 'pointy' };
    case 'Cleric':      return { robed: true,  pauldrons: false, hat: 'halo' };
    case 'Druid':       return { robed: true,  pauldrons: false, hat: 'hood' };
    default:            return { robed: false, pauldrons: false, hat: 'none' };
  }
}

// ---------------------------------------------------------------------
// Per-class weapon, drawn as plain Views. The whole weapon Group is
// rotated by the engine's weaponSwing value.
// ---------------------------------------------------------------------
function ClassWeapon({ heroClass, pal, size }: { heroClass: HeroClass; pal: ClassPalette; size: number }) {
  switch (heroClass) {
    case 'Warrior':
    case 'Paladin': {
      // Sword: blade rectangle + guard.
      return (
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: size * 0.04, height: size * 0.38, backgroundColor: pal.weapon, borderRadius: 2 }} />
          <View style={{ width: size * 0.12, height: size * 0.04, backgroundColor: pal.weaponDark, marginTop: -2 }} />
          <View style={{ width: size * 0.02, height: size * 0.1, backgroundColor: pal.bodyDark }} />
        </View>
      );
    }
    case 'Berserker': {
      // Axe.
      return (
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: size * 0.16, height: size * 0.14, backgroundColor: pal.weapon, borderRadius: 3, marginBottom: -2 }} />
          <View style={{ width: size * 0.025, height: size * 0.35, backgroundColor: pal.weaponDark }} />
        </View>
      );
    }
    case 'Archer': {
      // Bow: curved arc with string.
      return (
        <View style={{ alignItems: 'center', width: size * 0.2, height: size * 0.45 }}>
          <View style={{
            position: 'absolute',
            width: size * 0.18, height: size * 0.4,
            borderTopLeftRadius: size * 0.18,
            borderBottomLeftRadius: size * 0.18,
            borderLeftWidth: 3, borderTopWidth: 3, borderBottomWidth: 3,
            borderColor: pal.weapon,
            borderStyle: 'solid',
          }} />
          <View style={{
            position: 'absolute',
            left: size * 0.05, top: 0,
            width: 1, height: size * 0.4,
            backgroundColor: '#eae0c8',
          }} />
        </View>
      );
    }
    case 'Rogue':
    case 'Monk': {
      // Dagger.
      return (
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 0, height: 0,
            borderLeftWidth: size * 0.04,
            borderRightWidth: size * 0.04,
            borderBottomWidth: size * 0.22,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: pal.weapon,
            transform: [{ rotateZ: '180deg' }],
          }} />
          <View style={{ width: size * 0.1, height: size * 0.03, backgroundColor: pal.weaponDark, marginTop: -2 }} />
          <View style={{ width: size * 0.025, height: size * 0.08, backgroundColor: pal.bodyDark }} />
        </View>
      );
    }
    case 'Mage':
    case 'Necromancer':
    case 'Cleric':
    case 'Druid': {
      // Staff with glowing orb.
      return (
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: size * 0.13, height: size * 0.13, borderRadius: size * 0.07,
            backgroundColor: pal.aura,
            shadowColor: pal.aura,
            shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
            elevation: 6,
          }} />
          <View style={{ width: size * 0.025, height: size * 0.4, backgroundColor: pal.weapon, marginTop: -3 }} />
        </View>
      );
    }
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: '#00000088',
  },
  aura: {
    position: 'absolute',
    bottom: 2,
    borderWidth: 2,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  weaponMount: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Detailed procedural unit sprite — used by the battle engine's
// UnitRenderer AND by the pre-battle placement screen so units look
// identical in both contexts.
//
// Built from layered Views (no images, no SVG library) so it works
// in pure React Native. Each class gets a distinct silhouette via
// the `blueprintFor` switch: heavy plate for Warrior/Paladin, bare-
// chested fur for Berserker, hooded leather for Archer/Rogue, robed
// cone for casters, etc. Common pieces (legs, boots, arms, head,
// face, cape, weapon, shield, accessories) are composed on top of
// a shared body skeleton.
//
// Sprites face right by default; pass `facing: -1` to mirror.

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HeroClass } from '../../types';
import { ClassPalette, classPalette } from '../themes';
import { palette } from '../../theme';

export interface UnitSpriteProps {
  heroClass: HeroClass;
  isPlayer: boolean;
  size: number;
  facing?: 1 | -1;
  stars?: number;
  // When true, skip the team-colored ground ring + drop shadow so the
  // sprite can sit on top of a tile that already has its own border.
  bare?: boolean;
}

const UnitSprite = React.memo(function UnitSprite({
  heroClass, isPlayer, size, facing = 1, stars = 0, bare = false,
}: UnitSpriteProps) {
  const pal = classPalette(heroClass);
  const teamColor = isPlayer ? palette.blue : palette.red;
  const teamDeep = isPlayer ? '#1f6fd6' : '#a82820';
  const bp = blueprintFor(heroClass);

  // The sprite is laid out inside a `size × size` box. We mirror by
  // applying scaleX to the entire box so left/right is consistent.
  return (
    <View
      pointerEvents="none"
      style={[
        styles.box,
        { width: size, height: size, transform: [{ scaleX: facing }] },
      ]}
    >
      {!bare && <DropShadow size={size} />}
      {!bare && <GroundRing size={size} color={teamColor} deep={teamDeep} />}

      {/* CAPE first so it sits behind the body. */}
      {bp.cape && <Cape size={size} colors={bp.cape} pal={pal} />}

      {/* LEGS + BOOTS — drawn beneath the torso. */}
      <Legs size={size} pal={pal} bp={bp} teamDeep={teamDeep} />

      {/* TORSO — the main body card. */}
      <Torso size={size} pal={pal} bp={bp} teamDeep={teamDeep} />

      {/* OFF-HAND (shield) — sits between body and on-hand. */}
      {bp.shield && <Shield size={size} pal={pal} teamColor={teamColor} teamDeep={teamDeep} />}

      {/* ARMS — short stubby armored sleeves. */}
      <Arms size={size} pal={pal} bp={bp} />

      {/* WEAPON — held in the right hand. The renderer can override
          this transform to swing on attack. */}
      <View
        style={[
          styles.weaponSlot,
          {
            width: size * 0.36,
            height: size * 0.6,
            right: size * 0.04,
            bottom: size * 0.18,
          },
        ]}
      >
        <Weapon heroClass={heroClass} size={size} pal={pal} />
      </View>

      {/* HEAD — the most expressive part. Eyes, mouth, beard, hat. */}
      <Head size={size} pal={pal} bp={bp} teamDeep={teamDeep} facing={facing} />

      {/* STAR badges (for graded enemies) — counter-mirror so they
          read left-to-right regardless of facing. */}
      {stars > 0 && (
        <View style={[styles.stars, { top: size * 0.02, left: size * 0.02, transform: [{ scaleX: facing }] }]}>
          {Array.from({ length: Math.min(5, stars) }).map((_, i) => (
            <Text key={i} style={{ color: palette.gold, fontSize: size * 0.13, marginRight: -2, textShadowColor: '#0009', textShadowRadius: 2 }}>★</Text>
          ))}
        </View>
      )}
    </View>
  );
});

export default UnitSprite;

// =====================================================================
// Sub-pieces
// =====================================================================

function DropShadow({ size }: { size: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: size * 0.18, right: size * 0.18,
        bottom: size * 0.04,
        height: size * 0.07,
        borderRadius: size,
        backgroundColor: '#00000099',
      }}
    />
  );
}

function GroundRing({ size, color, deep }: { size: number; color: string; deep: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: size * 0.12, right: size * 0.12,
        bottom: size * 0.06,
        height: size * 0.13,
        borderRadius: size,
        borderWidth: 2,
        borderColor: color,
        shadowColor: deep,
        shadowOpacity: 0.7,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

function Cape({ size, colors, pal }: { size: number; colors: [string, string]; pal: ClassPalette }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: size * 0.5 - size * 0.28,
        top: size * 0.25,
        width: size * 0.56,
        height: size * 0.55,
        borderTopLeftRadius: size * 0.2,
        borderTopRightRadius: size * 0.2,
        borderBottomLeftRadius: size * 0.32,
        borderBottomRightRadius: size * 0.32,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#0008',
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Cape collar trim. */}
      <View style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: size * 0.04,
        backgroundColor: pal.trim, opacity: 0.85,
      }} />
    </View>
  );
}

function Legs({ size, pal, bp, teamDeep }: { size: number; pal: ClassPalette; bp: Blueprint; teamDeep: string }) {
  const legW = size * 0.13;
  const legH = bp.robed ? size * 0.08 : size * 0.22;
  const top = size * 0.62;
  const colors = bp.legColors ?? [pal.bodyDark, '#1a1a1a'] as const;
  const boot = bp.bootColor ?? '#221a14';
  return (
    <>
      <View style={{
        position: 'absolute', left: size * 0.5 - legW - size * 0.02, top,
        width: legW, height: legH, borderRadius: legW * 0.3,
        overflow: 'hidden', borderWidth: 1, borderColor: teamDeep + '88',
      }}>
        <LinearGradient colors={[colors[0], colors[1]]} style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      </View>
      <View style={{
        position: 'absolute', left: size * 0.5 + size * 0.02, top,
        width: legW, height: legH, borderRadius: legW * 0.3,
        overflow: 'hidden', borderWidth: 1, borderColor: teamDeep + '88',
      }}>
        <LinearGradient colors={[colors[0], colors[1]]} style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      </View>
      {!bp.robed && (
        <>
          <View style={{
            position: 'absolute', left: size * 0.5 - legW - size * 0.035, top: top + legH - size * 0.03,
            width: legW * 1.25, height: size * 0.07, borderRadius: 3,
            backgroundColor: boot, borderWidth: 1, borderColor: '#000a',
          }} />
          <View style={{
            position: 'absolute', left: size * 0.5 + size * 0.01, top: top + legH - size * 0.03,
            width: legW * 1.25, height: size * 0.07, borderRadius: 3,
            backgroundColor: boot, borderWidth: 1, borderColor: '#000a',
          }} />
        </>
      )}
    </>
  );
}

function Torso({ size, pal, bp, teamDeep }: { size: number; pal: ClassPalette; bp: Blueprint; teamDeep: string }) {
  const torsoW = size * (bp.bulky ? 0.58 : 0.5);
  const torsoH = size * (bp.robed ? 0.46 : 0.34);
  const left = size * 0.5 - torsoW / 2;
  const top = size * (bp.robed ? 0.32 : 0.38);
  const torsoColors = bp.torsoColors ?? [pal.body, pal.bodyDark] as const;
  return (
    <View
      style={{
        position: 'absolute', left, top, width: torsoW, height: torsoH,
        borderTopLeftRadius: torsoW * 0.38,
        borderTopRightRadius: torsoW * 0.38,
        borderBottomLeftRadius: bp.robed ? torsoW * 0.55 : torsoW * 0.15,
        borderBottomRightRadius: bp.robed ? torsoW * 0.55 : torsoW * 0.15,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: teamDeep,
      }}
    >
      <LinearGradient
        colors={[torsoColors[0], torsoColors[1]]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Inner highlight (chest plate glow). */}
      <View style={{
        position: 'absolute', left: torsoW * 0.18, top: torsoH * 0.1,
        width: torsoW * 0.3, height: torsoH * 0.25,
        borderRadius: torsoW * 0.2,
        backgroundColor: '#ffffff22',
      }} />

      {/* Belt across the waist. */}
      {!bp.robed && (
        <View style={{
          position: 'absolute', left: 0, right: 0, bottom: torsoH * 0.08,
          height: torsoH * 0.14, backgroundColor: pal.shoulder,
          borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#0009',
        }}>
          {/* Belt buckle */}
          <View style={{
            position: 'absolute', left: '50%', marginLeft: -torsoW * 0.07, top: torsoH * 0.01,
            width: torsoW * 0.14, height: torsoH * 0.1,
            backgroundColor: pal.trim, borderWidth: 1, borderColor: '#0009', borderRadius: 2,
          }} />
        </View>
      )}

      {/* Sash / robe trim across the middle. */}
      {bp.robed && (
        <View style={{
          position: 'absolute', left: 0, right: 0, top: torsoH * 0.42,
          height: torsoH * 0.1, backgroundColor: pal.trim, opacity: 0.85,
        }} />
      )}

      {/* Class glyph emblem on chest. */}
      <View style={{
        position: 'absolute', left: 0, right: 0, top: torsoH * 0.18,
        alignItems: 'center',
      }}>
        <Text style={{
          color: pal.trim,
          fontSize: torsoW * 0.42,
          fontWeight: '900',
          textShadowColor: '#0009',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
          // Counter-mirror the glyph so emoji read upright when facing left.
          transform: [{ scaleX: 1 }],
        }}>
          {pal.glyph}
        </Text>
      </View>

      {/* Pauldrons for heavy classes. */}
      {bp.pauldrons && (
        <>
          <View style={{
            position: 'absolute', left: -torsoW * 0.13, top: -2,
            width: torsoW * 0.36, height: torsoW * 0.3, borderRadius: torsoW * 0.18,
            backgroundColor: pal.trim, borderWidth: 1.5, borderColor: pal.trimDark,
            shadowColor: '#000a', shadowOpacity: 0.5, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
          }}>
            {/* Pauldron rivet */}
            <View style={{
              position: 'absolute', left: '50%', top: '50%',
              marginLeft: -2, marginTop: -2,
              width: 4, height: 4, borderRadius: 2, backgroundColor: pal.trimDark,
            }} />
          </View>
          <View style={{
            position: 'absolute', right: -torsoW * 0.13, top: -2,
            width: torsoW * 0.36, height: torsoW * 0.3, borderRadius: torsoW * 0.18,
            backgroundColor: pal.trim, borderWidth: 1.5, borderColor: pal.trimDark,
          }}>
            <View style={{
              position: 'absolute', left: '50%', top: '50%',
              marginLeft: -2, marginTop: -2,
              width: 4, height: 4, borderRadius: 2, backgroundColor: pal.trimDark,
            }} />
          </View>
        </>
      )}
    </View>
  );
}

function Shield({ size, pal, teamColor, teamDeep }: { size: number; pal: ClassPalette; teamColor: string; teamDeep: string }) {
  return (
    <View style={{
      position: 'absolute',
      left: size * 0.06,
      top: size * 0.4,
      width: size * 0.22,
      height: size * 0.3,
      borderTopLeftRadius: size * 0.11,
      borderTopRightRadius: size * 0.11,
      borderBottomLeftRadius: size * 0.06,
      borderBottomRightRadius: size * 0.06,
      backgroundColor: teamColor,
      borderWidth: 2, borderColor: teamDeep,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <View style={{
        width: size * 0.04, height: size * 0.2,
        backgroundColor: pal.trim, opacity: 0.9,
      }} />
      <View style={{
        position: 'absolute',
        width: size * 0.16, height: size * 0.04,
        backgroundColor: pal.trim, opacity: 0.9,
        top: size * 0.07,
      }} />
    </View>
  );
}

function Arms({ size, pal, bp }: { size: number; pal: ClassPalette; bp: Blueprint }) {
  const armW = size * 0.1;
  const armH = size * 0.18;
  const colors = bp.armColors ?? bp.torsoColors ?? [pal.body, pal.bodyDark] as const;
  return (
    <>
      {/* Back-arm tucked behind torso. Just a stub. */}
      <View style={{
        position: 'absolute',
        left: size * 0.22, top: size * 0.46,
        width: armW * 0.7, height: armH * 0.7,
        borderRadius: armW * 0.4,
        backgroundColor: colors[1],
        opacity: 0.85,
      }} />
      {/* Front-arm holding weapon. */}
      <View style={{
        position: 'absolute',
        right: size * 0.12, top: size * 0.46,
        width: armW, height: armH,
        borderRadius: armW * 0.5,
        overflow: 'hidden',
        borderWidth: 1, borderColor: '#0009',
      }}>
        <LinearGradient colors={[colors[0], colors[1]]} style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      </View>
      {/* Glove / hand at the bottom of the front arm. */}
      <View style={{
        position: 'absolute',
        right: size * 0.11, top: size * 0.6,
        width: armW * 1.1, height: armW * 0.85,
        borderRadius: armW * 0.5,
        backgroundColor: pal.shoulder,
        borderWidth: 1, borderColor: '#000a',
      }} />
    </>
  );
}

function Head({
  size, pal, bp, teamDeep, facing,
}: { size: number; pal: ClassPalette; bp: Blueprint; teamDeep: string; facing: 1 | -1 }) {
  const headSize = size * 0.32;
  const left = size * 0.5 - headSize / 2;
  const top = size * 0.12;
  const skin = bp.skin ?? '#f0c5a5';
  return (
    <View style={{ position: 'absolute', left, top, width: headSize, height: headSize }}>
      {/* Hood (drawn behind head). */}
      {bp.hat === 'hood' && (
        <View style={{
          position: 'absolute',
          left: -headSize * 0.2, top: -headSize * 0.1,
          width: headSize * 1.4, height: headSize * 1.15,
          borderTopLeftRadius: headSize * 0.7,
          borderTopRightRadius: headSize * 0.7,
          borderBottomLeftRadius: headSize * 0.4,
          borderBottomRightRadius: headSize * 0.4,
          backgroundColor: pal.bodyDark,
          borderWidth: 2, borderColor: '#0009',
        }} />
      )}

      {/* Wizard hat (pointed). */}
      {bp.hat === 'pointy' && <PointyHat size={headSize} pal={pal} />}

      {/* Crown. */}
      {bp.hat === 'crown' && (
        <View style={{
          position: 'absolute',
          left: -headSize * 0.05, top: -headSize * 0.18,
          width: headSize * 1.1, height: headSize * 0.32,
          backgroundColor: pal.trim,
          borderTopLeftRadius: 3, borderTopRightRadius: 3,
          borderWidth: 1.5, borderColor: pal.trimDark,
          shadowColor: pal.trim, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
        }}>
          {/* Crown spikes */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', position: 'absolute', top: -headSize * 0.12, left: 0, right: 0 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{
                width: 0, height: 0,
                borderLeftWidth: headSize * 0.06,
                borderRightWidth: headSize * 0.06,
                borderBottomWidth: headSize * 0.18,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: pal.trim,
              }} />
            ))}
          </View>
          {/* Crown jewel */}
          <View style={{
            position: 'absolute', left: '50%', marginLeft: -headSize * 0.05, top: headSize * 0.05,
            width: headSize * 0.1, height: headSize * 0.1, borderRadius: 999,
            backgroundColor: '#ff5252', borderWidth: 1, borderColor: '#0009',
          }} />
        </View>
      )}

      {/* Helmet (warrior visor). */}
      {bp.hat === 'helmet' && (
        <View style={{
          position: 'absolute',
          left: -headSize * 0.08, top: -headSize * 0.05,
          width: headSize * 1.16, height: headSize * 0.7,
          borderTopLeftRadius: headSize * 0.6,
          borderTopRightRadius: headSize * 0.6,
          backgroundColor: pal.weapon,
          borderWidth: 2, borderColor: pal.weaponDark,
        }}>
          {/* Visor slit */}
          <View style={{
            position: 'absolute', left: headSize * 0.15, right: headSize * 0.15, top: headSize * 0.4,
            height: headSize * 0.08, backgroundColor: '#000',
          }} />
          {/* Plume */}
          <View style={{
            position: 'absolute', left: '50%', marginLeft: -headSize * 0.04, top: -headSize * 0.28,
            width: headSize * 0.08, height: headSize * 0.32,
            borderRadius: headSize * 0.06,
            backgroundColor: '#c22626',
          }} />
        </View>
      )}

      {/* Horned helm (berserker). */}
      {bp.hat === 'horns' && (
        <>
          <View style={{
            position: 'absolute',
            left: -headSize * 0.08, top: headSize * 0.05,
            width: headSize * 1.16, height: headSize * 0.5,
            borderTopLeftRadius: headSize * 0.5,
            borderTopRightRadius: headSize * 0.5,
            backgroundColor: pal.weaponDark,
            borderWidth: 2, borderColor: '#0009',
          }} />
          {/* Left horn */}
          <View style={{
            position: 'absolute',
            left: -headSize * 0.18, top: headSize * 0.05,
            width: headSize * 0.3, height: headSize * 0.15,
            borderTopLeftRadius: headSize * 0.18,
            borderTopRightRadius: headSize * 0.08,
            backgroundColor: '#e8dec0',
            borderWidth: 1.5, borderColor: '#7a5a30',
            transform: [{ rotateZ: '-22deg' }],
          }} />
          {/* Right horn */}
          <View style={{
            position: 'absolute',
            right: -headSize * 0.18, top: headSize * 0.05,
            width: headSize * 0.3, height: headSize * 0.15,
            borderTopRightRadius: headSize * 0.18,
            borderTopLeftRadius: headSize * 0.08,
            backgroundColor: '#e8dec0',
            borderWidth: 1.5, borderColor: '#7a5a30',
            transform: [{ rotateZ: '22deg' }],
          }} />
        </>
      )}

      {/* Antlers (druid). */}
      {bp.hat === 'antlers' && (
        <>
          <View style={{
            position: 'absolute', left: -headSize * 0.12, top: -headSize * 0.4,
            width: headSize * 0.05, height: headSize * 0.5,
            backgroundColor: '#caa86e', borderRadius: 2,
            transform: [{ rotateZ: '-20deg' }],
          }} />
          <View style={{
            position: 'absolute', left: -headSize * 0.22, top: -headSize * 0.25,
            width: headSize * 0.18, height: headSize * 0.04,
            backgroundColor: '#caa86e', borderRadius: 2,
            transform: [{ rotateZ: '-50deg' }],
          }} />
          <View style={{
            position: 'absolute', right: -headSize * 0.12, top: -headSize * 0.4,
            width: headSize * 0.05, height: headSize * 0.5,
            backgroundColor: '#caa86e', borderRadius: 2,
            transform: [{ rotateZ: '20deg' }],
          }} />
          <View style={{
            position: 'absolute', right: -headSize * 0.22, top: -headSize * 0.25,
            width: headSize * 0.18, height: headSize * 0.04,
            backgroundColor: '#caa86e', borderRadius: 2,
            transform: [{ rotateZ: '50deg' }],
          }} />
        </>
      )}

      {/* Halo (paladin/cleric). */}
      {bp.hat === 'halo' && (
        <View style={{
          position: 'absolute',
          left: -headSize * 0.18, top: -headSize * 0.18,
          width: headSize * 1.36, height: headSize * 0.16,
          borderRadius: headSize, backgroundColor: pal.trim,
          shadowColor: pal.trim, shadowOpacity: 1, shadowRadius: 7, shadowOffset: { width: 0, height: 0 },
        }} />
      )}

      {/* Skull mask (necromancer). */}
      {bp.hat === 'skull' && (
        <View style={{
          position: 'absolute',
          left: -headSize * 0.05, top: -headSize * 0.08,
          width: headSize * 1.1, height: headSize * 0.6,
          borderTopLeftRadius: headSize * 0.55,
          borderTopRightRadius: headSize * 0.55,
          backgroundColor: '#e0d8c0',
          borderWidth: 1.5, borderColor: '#5a4a30',
        }}>
          {/* Skull eyes */}
          <View style={{ position: 'absolute', left: headSize * 0.18, top: headSize * 0.18, width: headSize * 0.15, height: headSize * 0.15, borderRadius: 999, backgroundColor: '#000' }} />
          <View style={{ position: 'absolute', right: headSize * 0.18, top: headSize * 0.18, width: headSize * 0.15, height: headSize * 0.15, borderRadius: 999, backgroundColor: '#000' }} />
        </View>
      )}

      {/* Head core — skin-toned circle with face. */}
      <View style={{
        position: 'absolute',
        left: headSize * 0.1, top: headSize * 0.15,
        width: headSize * 0.8, height: headSize * 0.8,
        borderRadius: headSize * 0.45,
        backgroundColor: skin,
        borderWidth: 1.5, borderColor: teamDeep,
        overflow: 'hidden',
      }}>
        {bp.hat !== 'skull' && (
          <>
            {/* Eyes — counter-mirror so they still face the same way */}
            <View style={{
              position: 'absolute', left: headSize * 0.14, top: headSize * 0.25,
              width: headSize * 0.13, height: headSize * 0.16, borderRadius: 999,
              backgroundColor: '#ffffff',
              borderWidth: 1, borderColor: '#0009',
            }}>
              <View style={{
                position: 'absolute', left: facing === 1 ? '40%' : '10%', top: '25%',
                width: headSize * 0.06, height: headSize * 0.07, borderRadius: 999, backgroundColor: '#0a0a18',
              }} />
            </View>
            <View style={{
              position: 'absolute', right: headSize * 0.14, top: headSize * 0.25,
              width: headSize * 0.13, height: headSize * 0.16, borderRadius: 999,
              backgroundColor: '#ffffff',
              borderWidth: 1, borderColor: '#0009',
            }}>
              <View style={{
                position: 'absolute', left: facing === 1 ? '40%' : '10%', top: '25%',
                width: headSize * 0.06, height: headSize * 0.07, borderRadius: 999, backgroundColor: '#0a0a18',
              }} />
            </View>
            {/* Mouth */}
            <View style={{
              position: 'absolute', left: '50%', marginLeft: -headSize * 0.1, top: headSize * 0.5,
              width: headSize * 0.2, height: headSize * 0.05, borderRadius: 999,
              backgroundColor: '#8b3a2a',
            }} />
            {/* Beard / hair */}
            {bp.beard && (
              <View style={{
                position: 'absolute', left: '50%', marginLeft: -headSize * 0.22, top: headSize * 0.45,
                width: headSize * 0.44, height: headSize * 0.4,
                borderBottomLeftRadius: headSize * 0.22,
                borderBottomRightRadius: headSize * 0.22,
                backgroundColor: bp.beardColor ?? '#3a2e1a',
              }} />
            )}
          </>
        )}
      </View>

      {/* Hair tuft on top for some classes. */}
      {bp.hairTuft && (
        <View style={{
          position: 'absolute',
          left: '50%', marginLeft: -headSize * 0.18, top: -headSize * 0.05,
          width: headSize * 0.36, height: headSize * 0.18,
          borderTopLeftRadius: headSize * 0.18,
          borderTopRightRadius: headSize * 0.18,
          backgroundColor: bp.hairColor ?? '#2a1a08',
        }} />
      )}

      {/* Halo (cleric variant — drawn in front of head). */}
      {bp.hat === 'haloFront' && (
        <View style={{
          position: 'absolute',
          left: -headSize * 0.15, top: -headSize * 0.05,
          width: headSize * 1.3, height: headSize * 0.14,
          borderRadius: headSize, backgroundColor: pal.trim,
          shadowColor: pal.trim, shadowOpacity: 1, shadowRadius: 9, shadowOffset: { width: 0, height: 0 },
        }} />
      )}
    </View>
  );
}

function PointyHat({ size, pal }: { size: number; pal: ClassPalette }) {
  return (
    <>
      {/* Hat cone (triangle). */}
      <View style={{
        position: 'absolute',
        left: '50%', marginLeft: -size * 0.45,
        top: -size * 0.85,
        width: 0, height: 0,
        borderLeftWidth: size * 0.45,
        borderRightWidth: size * 0.45,
        borderBottomWidth: size * 1.0,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: pal.bodyDark,
        transform: [{ rotateZ: '180deg' }],
      }} />
      {/* Hat brim. */}
      <View style={{
        position: 'absolute', left: -size * 0.2, top: -size * 0.05,
        width: size * 1.4, height: size * 0.12,
        backgroundColor: pal.bodyDark,
        borderRadius: size * 0.06,
        borderWidth: 1.5, borderColor: '#0009',
      }} />
      {/* Hat star. */}
      <Text style={{
        position: 'absolute', left: '50%', marginLeft: -size * 0.08, top: -size * 0.45,
        color: pal.aura, fontSize: size * 0.2, fontWeight: '900',
        textShadowColor: pal.aura, textShadowRadius: 4, textShadowOffset: { width: 0, height: 0 },
      }}>★</Text>
    </>
  );
}

// =====================================================================
// Weapon (per class). Right-handed, anchored bottom-left.
// =====================================================================
function Weapon({ heroClass, size, pal }: { heroClass: HeroClass; size: number; pal: ClassPalette }) {
  switch (heroClass) {
    case 'Warrior':
    case 'Paladin':
      return (
        <View style={{ position: 'absolute', left: '50%', top: 0, alignItems: 'center' }}>
          {/* Blade tip (triangle). */}
          <View style={{
            width: 0, height: 0,
            borderLeftWidth: size * 0.04,
            borderRightWidth: size * 0.04,
            borderBottomWidth: size * 0.1,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: pal.weapon,
            transform: [{ rotateZ: '180deg' }],
          }} />
          {/* Blade body. */}
          <View style={{ width: size * 0.06, height: size * 0.36, backgroundColor: pal.weapon, borderWidth: 1, borderColor: pal.weaponDark }}>
            <View style={{ position: 'absolute', left: '50%', marginLeft: -1, top: 0, bottom: 0, width: 2, backgroundColor: pal.weaponDark, opacity: 0.6 }} />
          </View>
          {/* Guard. */}
          <View style={{ width: size * 0.18, height: size * 0.05, backgroundColor: pal.trim, borderWidth: 1, borderColor: '#0009', marginTop: -2 }} />
          {/* Handle. */}
          <View style={{ width: size * 0.03, height: size * 0.1, backgroundColor: pal.shoulder }} />
          <View style={{ width: size * 0.07, height: size * 0.05, backgroundColor: pal.trim, borderRadius: 2, borderWidth: 1, borderColor: '#0009' }} />
        </View>
      );
    case 'Berserker':
      return (
        <View style={{ position: 'absolute', left: '50%', marginLeft: -size * 0.1, top: 0, alignItems: 'center' }}>
          {/* Axe head (asymmetric). */}
          <View style={{
            width: size * 0.22, height: size * 0.18,
            backgroundColor: pal.weapon,
            borderTopLeftRadius: size * 0.04,
            borderTopRightRadius: size * 0.1,
            borderBottomLeftRadius: size * 0.04,
            borderBottomRightRadius: size * 0.15,
            borderWidth: 1.5, borderColor: pal.weaponDark,
          }} />
          {/* Haft. */}
          <View style={{ width: size * 0.035, height: size * 0.32, backgroundColor: '#6c4a2a', marginTop: -2 }} />
          {/* Grip wrap. */}
          <View style={{ width: size * 0.05, height: size * 0.06, backgroundColor: '#3a2a18', borderRadius: 2 }} />
        </View>
      );
    case 'Archer':
      return (
        <View style={{ position: 'absolute', left: '50%', marginLeft: -size * 0.07, top: 0 }}>
          {/* Bow arc (a curve emulated with a partial border). */}
          <View style={{
            width: size * 0.14, height: size * 0.5,
            borderTopLeftRadius: size * 0.14,
            borderBottomLeftRadius: size * 0.14,
            borderLeftWidth: size * 0.025,
            borderTopWidth: size * 0.025,
            borderBottomWidth: size * 0.025,
            borderColor: pal.weapon,
          }} />
          {/* Bowstring. */}
          <View style={{
            position: 'absolute',
            left: size * 0.025, top: size * 0.025,
            width: 1.5, height: size * 0.45,
            backgroundColor: '#f0e6c2',
          }} />
          {/* Arrow nocked. */}
          <View style={{
            position: 'absolute',
            left: -size * 0.04, top: size * 0.22,
            width: size * 0.22, height: 2,
            backgroundColor: '#caa86e',
          }} />
          {/* Arrow tip. */}
          <View style={{
            position: 'absolute',
            left: -size * 0.06, top: size * 0.215,
            width: 0, height: 0,
            borderTopWidth: 3, borderBottomWidth: 3,
            borderRightWidth: 5,
            borderTopColor: 'transparent', borderBottomColor: 'transparent',
            borderRightColor: pal.weapon,
          }} />
        </View>
      );
    case 'Rogue':
      return (
        <View style={{ position: 'absolute', left: '50%', marginLeft: -size * 0.05, top: size * 0.1, alignItems: 'center' }}>
          {/* Dagger blade. */}
          <View style={{
            width: 0, height: 0,
            borderLeftWidth: size * 0.05,
            borderRightWidth: size * 0.05,
            borderBottomWidth: size * 0.24,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: pal.weapon,
            transform: [{ rotateZ: '180deg' }],
          }} />
          <View style={{ width: size * 0.14, height: size * 0.025, backgroundColor: pal.weaponDark, marginTop: -2 }} />
          <View style={{ width: size * 0.03, height: size * 0.08, backgroundColor: '#1a1a1a' }} />
        </View>
      );
    case 'Monk':
      // Fist with knuckle wraps.
      return (
        <View style={{ position: 'absolute', left: '50%', marginLeft: -size * 0.07, top: size * 0.12, alignItems: 'center' }}>
          <View style={{
            width: size * 0.14, height: size * 0.14,
            backgroundColor: pal.weapon,
            borderRadius: size * 0.04,
            borderWidth: 1.5, borderColor: '#0009',
          }}>
            <View style={{ position: 'absolute', left: '20%', right: '20%', top: '25%', height: 2, backgroundColor: '#0009' }} />
            <View style={{ position: 'absolute', left: '20%', right: '20%', top: '55%', height: 2, backgroundColor: '#0009' }} />
          </View>
        </View>
      );
    case 'Mage':
    case 'Necromancer':
    case 'Cleric':
    case 'Druid':
      // Staff with glowing orb on top.
      return (
        <View style={{ position: 'absolute', left: '50%', marginLeft: -size * 0.07, top: 0, alignItems: 'center' }}>
          <View style={{
            width: size * 0.18, height: size * 0.18, borderRadius: size * 0.09,
            backgroundColor: pal.aura,
            shadowColor: pal.aura,
            shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
            elevation: 8,
            borderWidth: 1.5, borderColor: '#ffffff66',
          }}>
            {/* Orb inner highlight. */}
            <View style={{
              position: 'absolute', left: '20%', top: '15%',
              width: size * 0.05, height: size * 0.05, borderRadius: 999,
              backgroundColor: '#ffffffcc',
            }} />
          </View>
          <View style={{ width: size * 0.04, height: size * 0.5, backgroundColor: pal.weapon, borderWidth: 1, borderColor: pal.weaponDark, marginTop: -3 }} />
          {/* Staff wraps. */}
          <View style={{ position: 'absolute', left: '50%', marginLeft: -size * 0.04, top: size * 0.35, width: size * 0.08, height: size * 0.03, backgroundColor: pal.trim }} />
          <View style={{ position: 'absolute', left: '50%', marginLeft: -size * 0.04, top: size * 0.5, width: size * 0.08, height: size * 0.03, backgroundColor: pal.trim }} />
        </View>
      );
    default:
      return null;
  }
}

// =====================================================================
// Blueprint registry — per-class silhouette overrides
// =====================================================================
interface Blueprint {
  bulky: boolean;
  robed: boolean;
  pauldrons: boolean;
  shield: boolean;
  cape?: [string, string];
  hat: 'none' | 'pointy' | 'hood' | 'crown' | 'helmet' | 'horns' | 'antlers' | 'halo' | 'haloFront' | 'skull';
  skin?: string;
  beard?: boolean;
  beardColor?: string;
  hairTuft?: boolean;
  hairColor?: string;
  torsoColors?: [string, string];
  legColors?: [string, string];
  armColors?: [string, string];
  bootColor?: string;
}

function blueprintFor(cls: HeroClass): Blueprint {
  switch (cls) {
    case 'Warrior':
      return {
        bulky: true, robed: false, pauldrons: true, shield: true, hat: 'helmet',
        torsoColors: ['#9b9fa8', '#5a606e'],
        legColors: ['#3a3a44', '#1a1a22'],
        armColors: ['#9b9fa8', '#5a606e'],
        bootColor: '#2a1a10',
      };
    case 'Paladin':
      return {
        bulky: true, robed: false, pauldrons: true, shield: true, hat: 'halo',
        cape: ['#c22626', '#7a1414'],
        torsoColors: ['#e8d188', '#b08a30'],
        legColors: ['#7a5a20', '#3a2a0a'],
        armColors: ['#e8d188', '#b08a30'],
        bootColor: '#3a2a0a', beard: true, beardColor: '#c8a86a',
      };
    case 'Berserker':
      return {
        bulky: true, robed: false, pauldrons: false, shield: false, hat: 'horns',
        torsoColors: ['#a85a3a', '#5a2a18'],
        legColors: ['#5a3a1a', '#2a1a08'],
        armColors: ['#a85a3a', '#5a2a18'],
        skin: '#dca06a', beard: true, beardColor: '#5a1a08',
        bootColor: '#2a1a08',
      };
    case 'Archer':
      return {
        bulky: false, robed: false, pauldrons: false, shield: false, hat: 'hood',
        torsoColors: ['#4a8a4a', '#1a4a1a'],
        legColors: ['#2a4a2a', '#0a2a0a'],
        armColors: ['#4a8a4a', '#1a4a1a'],
        bootColor: '#2a1a0a',
      };
    case 'Rogue':
      return {
        bulky: false, robed: false, pauldrons: false, shield: false, hat: 'hood',
        cape: ['#2a2a3a', '#0a0a18'],
        torsoColors: ['#3a3f4f', '#16181f'],
        legColors: ['#1a1a22', '#0a0a10'],
        armColors: ['#3a3f4f', '#16181f'],
        bootColor: '#0a0a10',
      };
    case 'Monk':
      return {
        bulky: false, robed: false, pauldrons: false, shield: false, hat: 'none',
        torsoColors: ['#c8782a', '#7a3a08'],
        legColors: ['#a86a1a', '#5a2a08'],
        armColors: ['#dca06a', '#a86a3a'],
        skin: '#dca06a', beard: true, beardColor: '#3a2a18',
        bootColor: '#3a2a18',
      };
    case 'Mage':
      return {
        bulky: false, robed: true, pauldrons: false, shield: false, hat: 'pointy',
        cape: ['#5a2eb0', '#28145a'],
        torsoColors: ['#6a3ec8', '#2c1462'],
        legColors: ['#3a1c70', '#1a0a3a'],
        armColors: ['#6a3ec8', '#2c1462'],
        skin: '#e8caa8', beard: true, beardColor: '#ddd2c8', hairTuft: false,
      };
    case 'Necromancer':
      return {
        bulky: false, robed: true, pauldrons: false, shield: false, hat: 'skull',
        cape: ['#2a0a40', '#0a0218'],
        torsoColors: ['#3a1c70', '#180a32'],
        legColors: ['#1a0a3a', '#0a0218'],
        armColors: ['#3a1c70', '#180a32'],
        skin: '#a89cb8',
      };
    case 'Cleric':
      return {
        bulky: false, robed: true, pauldrons: false, shield: false, hat: 'haloFront',
        cape: ['#e6d0a0', '#a88a4a'],
        torsoColors: ['#f0e0b8', '#a8884a'],
        legColors: ['#a8884a', '#5a4828'],
        armColors: ['#f0e0b8', '#a8884a'],
        skin: '#f0c5a5', beard: false, hairTuft: true, hairColor: '#caa86e',
      };
    case 'Druid':
      return {
        bulky: false, robed: true, pauldrons: false, shield: false, hat: 'antlers',
        cape: ['#2a6a36', '#0a2a14'],
        torsoColors: ['#3a8a48', '#0a3a18'],
        legColors: ['#2a4a28', '#0a2210'],
        armColors: ['#3a8a48', '#0a3a18'],
        skin: '#e0b890', beard: true, beardColor: '#cad0a8',
      };
    default:
      return { bulky: false, robed: false, pauldrons: false, shield: false, hat: 'none' };
  }
}

const styles = StyleSheet.create({
  box: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  weaponSlot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  stars: {
    position: 'absolute',
    flexDirection: 'row',
  },
});

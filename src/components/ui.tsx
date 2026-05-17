import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle,
  ScrollView, StyleProp, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { palette, gradients, radius, spacing, shadow, font } from '../theme';

// ----------------------------------------------------------------
// Screen background — layered gradient with soft vignette
// ----------------------------------------------------------------
export function ScreenBackground({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={gradients.screen} style={[StyleSheet.absoluteFill, style]}>
      <View style={uiStyles.vignette} pointerEvents="none" />
      {children}
    </LinearGradient>
  );
}

// ----------------------------------------------------------------
// Gold-framed banner title
// ----------------------------------------------------------------
export function Banner({ title, size = 18 }: { title: string; size?: number }) {
  return (
    <LinearGradient colors={gradients.banner} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={uiStyles.banner}>
      <View style={uiStyles.bannerInner}>
        <Text style={[uiStyles.bannerText, { fontSize: size }]} numberOfLines={1}>{title}</Text>
      </View>
    </LinearGradient>
  );
}

// ----------------------------------------------------------------
// Top bar: back chevron · banner title · right slot
// ----------------------------------------------------------------
export function TopBar({
  title, onBack, right, titleSize,
}: { title: string; onBack?: () => void; right?: React.ReactNode; titleSize?: number }) {
  return (
    <View style={uiStyles.topbar}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={uiStyles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <LinearGradient colors={gradients.panel} style={uiStyles.backBtnBg}>
            <Text style={uiStyles.backChevron}>‹</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : <View style={uiStyles.backBtn} />}
      <View style={uiStyles.topbarCenter}>
        <Banner title={title} size={titleSize} />
      </View>
      <View style={uiStyles.topbarRight}>{right}</View>
    </View>
  );
}

// ----------------------------------------------------------------
// Currency pill (gold / gem / generic)
// ----------------------------------------------------------------
export function Pill({
  icon, value, tint = palette.gold, style,
}: { icon: string; value: React.ReactNode; tint?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[uiStyles.pill, style]}>
      <View style={[uiStyles.pillIconWrap, { backgroundColor: tint }]}>
        <Text style={uiStyles.pillIcon}>{icon}</Text>
      </View>
      <Text style={uiStyles.pillValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export function CurrencyBar({ gold, gems, style }: { gold: number; gems: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[uiStyles.currencyBar, style]}>
      <Pill icon="🪙" value={gold} tint={palette.gold} />
      <Pill icon="💎" value={gems} tint={palette.blue} />
    </View>
  );
}

// ----------------------------------------------------------------
// Bevelled gradient button (Clash signature control)
// ----------------------------------------------------------------
type BtnVariant = 'gold' | 'blue' | 'green' | 'red' | 'purple';
const BTN_GRADIENT: Record<BtnVariant, readonly string[]> = {
  gold: gradients.goldBtn,
  blue: gradients.blueBtn,
  green: gradients.greenBtn,
  red: gradients.redBtn,
  purple: gradients.purpleBtn,
};
const BTN_TEXT: Record<BtnVariant, string> = {
  gold: '#5a3c08', blue: '#fff', green: '#0d3a13', red: '#fff', purple: '#fff',
};

export function GButton({
  label, onPress, variant = 'blue', disabled, small, wide, icon, style,
}: {
  label: string; onPress?: () => void; variant?: BtnVariant; disabled?: boolean;
  small?: boolean; wide?: boolean; icon?: string; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        uiStyles.btnWrap,
        wide && { alignSelf: 'stretch' },
        disabled && { opacity: 0.45 },
        pressed && !disabled && { transform: [{ translateY: 2 }] },
        style,
      ]}
    >
      <LinearGradient
        colors={BTN_GRADIENT[variant] as any}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[uiStyles.btn, small && uiStyles.btnSmall, shadow.button]}
      >
        <View style={uiStyles.btnGloss} pointerEvents="none" />
        <Text style={[uiStyles.btnText, small && { fontSize: 12 }, { color: BTN_TEXT[variant] }]} numberOfLines={1}>
          {icon ? `${icon}  ` : ''}{label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

// ----------------------------------------------------------------
// Gold-framed panel (Clash of Clans card)
// ----------------------------------------------------------------
export function Panel({
  children, style, padded = true, glow,
}: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean; glow?: string }) {
  return (
    <View style={[uiStyles.panelOuter, glow ? shadow.glow(glow) : shadow.card, style]}>
      <LinearGradient colors={gradients.panel} style={uiStyles.panelInner}>
        <View style={[uiStyles.panelBody, padded && { padding: spacing.md }]}>{children}</View>
      </LinearGradient>
    </View>
  );
}

// Inset "stone" surface for stat blocks / logs
export function Plate({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[uiStyles.plate, style]}>{children}</View>;
}

// ----------------------------------------------------------------
// Section heading
// ----------------------------------------------------------------
export function SectionTitle({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <View style={uiStyles.sectionRow}>
      <View style={uiStyles.sectionTick} />
      <Text style={[uiStyles.sectionText, style]}>{children}</Text>
    </View>
  );
}

// ----------------------------------------------------------------
// Gradient tag (difficulty / rarity)
// ----------------------------------------------------------------
export function Tag({ label, colors, small }: { label: string; colors: readonly string[]; small?: boolean }) {
  return (
    <LinearGradient colors={colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[uiStyles.tag, small && { paddingHorizontal: 6, paddingVertical: 2 }]}>
      <Text style={[uiStyles.tagText, small && { fontSize: 8 }]}>{label}</Text>
    </LinearGradient>
  );
}

// ----------------------------------------------------------------
// Progress bar with gradient fill
// ----------------------------------------------------------------
export function Bar({
  pct, colors = ['#5ed36a', '#2c9c3a'], height = 10, track = palette.trackBg, style,
}: { pct: number; colors?: readonly string[]; height?: number; track?: string; style?: StyleProp<ViewStyle> }) {
  const w = Math.max(0, Math.min(1, Number.isFinite(pct) ? pct : 0));
  return (
    <View style={[{ height, backgroundColor: track, borderRadius: height, overflow: 'hidden', borderWidth: 1, borderColor: '#0006' }, style]}>
      <LinearGradient colors={colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${w * 100}%`, height: '100%' }} />
    </View>
  );
}

// ----------------------------------------------------------------
// Generic vertical screen scaffold. Wraps content in a SafeAreaView so
// notches, status bars, and home-indicator gestures don't clip the UI.
// `edges` defaults to all four sides; battle/scrolling screens can opt
// out of bottom inset to keep their own padding control.
// ----------------------------------------------------------------
export function Screen({
  children,
  edges = ['top', 'right', 'bottom', 'left'],
}: { children: React.ReactNode; edges?: ReadonlyArray<Edge> }) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.bgBot }}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={edges as Edge[]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const uiStyles = StyleSheet.create({
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    borderWidth: 80,
    borderColor: '#00000022',
  },
  topbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm,
  },
  topbarCenter: { flex: 1, alignItems: 'center' },
  topbarRight: { minWidth: 44, alignItems: 'flex-end' },
  backBtn: { width: 44, height: 44 },
  backBtnBg: {
    width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: palette.goldDeep, ...shadow.button,
  },
  backChevron: { color: palette.gold, fontSize: 26, fontWeight: '900', marginTop: -3 },
  banner: {
    borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 7,
    borderWidth: 2, borderColor: '#fff6', ...shadow.button,
  },
  bannerInner: { alignItems: 'center' },
  bannerText: { color: '#5a3c08', ...font.title, textShadowColor: '#fff7', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
  pill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: palette.panelDeep,
    borderRadius: radius.pill, paddingRight: spacing.md, paddingLeft: 3, paddingVertical: 3,
    borderWidth: 1.5, borderColor: '#0007', minWidth: 64,
  },
  pillIconWrap: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  pillIcon: { fontSize: 13 },
  pillValue: { color: palette.text, fontWeight: '800', fontSize: 13 },
  currencyBar: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  btnWrap: { borderRadius: radius.md },
  btn: {
    borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff55',
    overflow: 'hidden',
  },
  btnSmall: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.sm },
  btnGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%', backgroundColor: '#ffffff33' },
  btnText: { fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  panelOuter: { borderRadius: radius.lg, borderWidth: 2, borderColor: palette.goldDeep },
  panelInner: { borderRadius: radius.lg - 2, overflow: 'hidden' },
  panelBody: { borderRadius: radius.lg - 2 },
  plate: {
    backgroundColor: palette.panelDeep, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: '#0006',
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  sectionTick: { width: 5, height: 16, borderRadius: 3, backgroundColor: palette.gold },
  sectionText: { color: palette.gold, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  tag: { borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#ffffff44' },
  tagText: { color: '#fff', fontWeight: '900', fontSize: 9, letterSpacing: 0.5 },
});

export { palette, gradients, radius, spacing, shadow } from '../theme';

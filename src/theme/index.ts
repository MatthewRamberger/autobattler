// ============================================================
// Clash-style design tokens (Royale battle + Clash-of-Clans warm menus)
// ============================================================

export const palette = {
  // Deep night-arena base
  bgTop: '#241b3a',
  bgMid: '#1b1730',
  bgBot: '#120f22',

  // Warm "wood & stone" panel surfaces (Clash of Clans menus)
  panel: '#3a2f4d',
  panelAlt: '#322843',
  panelDeep: '#241d33',
  panelEdge: '#16111f',

  // Signature gold (frames, headings, currency)
  gold: '#f6c945',
  goldDeep: '#d29a1c',
  goldDark: '#8a6212',

  // Royale blue (primary action / arena)
  blue: '#3da4ff',
  blueDeep: '#1f6fd6',
  blueDark: '#16447f',

  green: '#56d364',
  greenDeep: '#2c9c3a',
  red: '#ff6a55',
  redDeep: '#cf3623',
  purple: '#9b6dff',
  purpleDeep: '#6a3fd0',

  // Text
  text: '#ffffff',
  textSoft: '#d8cfe8',
  textMute: '#9b90b4',
  textDim: '#6f6685',

  // Misc
  shadow: '#000000',
  trackBg: '#1c1530',
  white: '#ffffff',
} as const;

// Linear-gradient color tuples (use with expo-linear-gradient).
export const gradients = {
  screen: ['#2a2046', '#1b1730', '#100d1f'] as const,
  arenaPlayer: ['#1d3a52', '#16263f'] as const,
  arenaEnemy: ['#4a1f2e', '#321526'] as const,
  gold: ['#ffe07a', '#f3b62a', '#d9961a'] as const,
  goldBtn: ['#ffe486', '#f4b62c', '#d2891a'] as const,
  blueBtn: ['#6cc0ff', '#2f8be8', '#1c5fae'] as const,
  greenBtn: ['#8bf07d', '#42c24c', '#258a2f'] as const,
  redBtn: ['#ff8f7a', '#ef5440', '#bc2c1e'] as const,
  purpleBtn: ['#b89bff', '#8257e6', '#5a36b0'] as const,
  panel: ['#43365a', '#2e2540'] as const,
  panelDeep: ['#2c2440', '#1f1930'] as const,
  banner: ['#f4b62c', '#d2891a'] as const,
} as const;

export const radius = { sm: 8, md: 12, lg: 18, xl: 26, pill: 999 };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 };

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  button: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  }),
} as const;

export const font = {
  title: { fontWeight: '900' as const, letterSpacing: 1 },
  heading: { fontWeight: '800' as const, letterSpacing: 0.5 },
  body: { fontWeight: '600' as const },
};

export const difficultyGradient: Record<string, readonly [string, string]> = {
  easy: ['#5ed36a', '#2c9c3a'],
  medium: ['#f6c945', '#d29a1c'],
  hard: ['#ff8f5a', '#d8542a'],
  boss: ['#b06bff', '#6a3fd0'],
  nightmare: ['#ff6aa8', '#c0246b'],
};

export const rarityGradient: Record<string, readonly [string, string]> = {
  common: ['#9aa0ad', '#6c7280'],
  rare: ['#54b8ff', '#1f6fd6'],
  epic: ['#c07bff', '#7a3fd0'],
  legendary: ['#ffce5a', '#e08a16'],
  mythic: ['#ff6f9c', '#c0246b'],
};

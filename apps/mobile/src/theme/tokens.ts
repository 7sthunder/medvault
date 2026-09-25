/**
 * Design tokens, ported from the web app's `src/app/globals.css` (Stitch §5.3–§5.7).
 *
 * Tailwind cannot reach React Native, so the token *values* are mirrored here as plain
 * objects and consumed through `useTheme()`. Same hexes, same names, so a change on the
 * web side has an obvious counterpart here and the two clients stay visibly identical.
 *
 * Two deliberate differences from the web build:
 *  - fonts fall back to the platform UI face. Plus Jakarta Sans is loaded through
 *    `next/font`, which has no Expo equivalent; `fonts` is a single token so swapping in
 *    a bundled `.ttf` later is a one-line change.
 *  - shadows are split into the iOS `shadow*` / Android `elevation` pair, because React
 *    Native has no unified box-shadow.
 */

export type ThemeName = "light" | "dark";

export interface Palette {
  /* Surfaces */
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  borderStrong: string;
  input: string;
  bgSoft: string;
  surfaceDark: string;

  /* Brand */
  primary: string;
  primaryDark: string;
  primaryTint: string;
  primaryTint2: string;
  primarySoft: string;
  primaryForeground: string;
  secondary: string;
  secondaryTint: string;
  secondarySoft: string;

  /* Accents */
  magenta: string;
  magentaTint: string;
  violet: string;
  blue: string;
  blueTint: string;
  amber: string;
  amberTint: string;
  teal: string;
  red: string;
  redTint: string;
  destructive: string;
  destructiveForeground: string;

  /* Ink ramp */
  ink900: string;
  ink800: string;
  ink700: string;
  ink600: string;
  ink500: string;
  ink400: string;

  /* Charts */
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

/** Ink ramp + accents are theme-independent, so they live outside the light/dark split. */
const ACCENTS = {
  primary: "#10b981",
  primaryDark: "#059669",
  primaryTint: "#d1fae5",
  primaryTint2: "#a7f3d0",
  primarySoft: "#f0fdf4",
  primaryForeground: "#ffffff",
  secondary: "#06b6d4",
  secondaryTint: "#cffafe",
  secondarySoft: "#f0f9ff",
  magenta: "#f472b6",
  magentaTint: "#fce7f3",
  violet: "#8b5cf6",
  blue: "#3b82f6",
  blueTint: "#dbeafe",
  amber: "#f59e0b",
  amberTint: "#fef3c7",
  teal: "#14b8a6",
  red: "#ef4444",
  redTint: "#fee2e2",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  ink900: "#0f172a",
  ink800: "#1e293b",
  ink700: "#334155",
  ink600: "#475569",
  ink500: "#64748b",
  ink400: "#94a3b8",
  chart1: "#10b981",
  chart2: "#06b6d4",
  chart3: "#f472b6",
  chart4: "#f59e0b",
  chart5: "#8b5cf6",
} as const;

export const LIGHT: Palette = {
  ...ACCENTS,
  background: "#f8fafc",
  foreground: "#0f172a",
  card: "#ffffff",
  cardForeground: "#0f172a",
  popover: "#ffffff",
  popoverForeground: "#0f172a",
  muted: "#f1f5f9",
  mutedForeground: "#64748b",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  input: "#e2e8f0",
  bgSoft: "#f1f5f9",
  surfaceDark: "#0f172a",
};

export const DARK: Palette = {
  ...ACCENTS,
  background: "#0f172a",
  foreground: "#f8fafc",
  card: "#1e293b",
  cardForeground: "#e2e8f0",
  popover: "#1e293b",
  popoverForeground: "#e2e8f0",
  muted: "#25303f",
  mutedForeground: "#94a3b8",
  border: "#334155",
  borderStrong: "#475569",
  input: "#334155",
  bgSoft: "#25303f",
  surfaceDark: "#0f172a",
};

/** §5.4 base radius 14px, derived steps from `globals.css`. */
export const radius = {
  sm: 8,
  md: 11,
  lg: 14,
  xl: 20,
  "2xl": 25,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
} as const;

/** 4pt type scale. `weight` is RN's numeric fontWeight, not CSS. */
export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: "700" },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: "600" },
  subheading: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "600" },
  small: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  smallStrong: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: "500" },
  /** All-caps eyebrow / section label. */
  overline: { fontSize: 11, lineHeight: 14, fontWeight: "700", letterSpacing: 0.8 },
  mono: { fontSize: 15, lineHeight: 20, fontWeight: "600", fontVariant: ["tabular-nums"] },
} as const;

export type TypographyVariant = keyof typeof typography;

/** §5.4 shadow recipes, expressed for both platforms. */
export const shadows = {
  cardSm: {
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  primaryBtn: {
    shadowColor: ACCENTS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  fab: {
    shadowColor: ACCENTS.primary,
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  logo: {
    shadowColor: ACCENTS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
} as const;

export const fonts = {
  sans: undefined,
  heading: undefined,
} as const;

/** A medication's picked accent, resolved to a tint/foreground pair for chips. */
export const MED_ACCENTS: Record<string, { fg: string; bg: string; solid: string }> = {
  primary: { fg: ACCENTS.primaryDark, bg: ACCENTS.primaryTint, solid: ACCENTS.primary },
  red: { fg: ACCENTS.red, bg: ACCENTS.redTint, solid: ACCENTS.red },
  blue: { fg: ACCENTS.blue, bg: ACCENTS.blueTint, solid: ACCENTS.blue },
  violet: { fg: ACCENTS.violet, bg: "#ede9fe", solid: ACCENTS.violet },
  amber: { fg: ACCENTS.amber, bg: ACCENTS.amberTint, solid: ACCENTS.amber },
  teal: { fg: "#0f766e", bg: "#ccfbf1", solid: ACCENTS.teal },
  magenta: { fg: "#db2777", bg: ACCENTS.magentaTint, solid: ACCENTS.magenta },
  slate: { fg: ACCENTS.ink500, bg: "#f1f5f9", solid: ACCENTS.ink500 },
};

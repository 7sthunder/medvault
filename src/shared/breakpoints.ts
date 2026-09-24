/**
 * Breakpoint constants — single source for responsive behavior (plan §16).
 *
 * Values match the Tailwind v4 defaults (`sm 640 · md 768 · lg 1024 · xl 1280`),
 * which correspond exactly to the Stitch export breakpoints used in `Landingpage/`.
 *
 * Stitch facts to preserve (§16, verified in docs/stitch-analysis.md §8):
 * - nav center links hidden < 768 (md)
 * - sidebar persistent ≥ 1024 (lg); bottom nav < 768 (md)
 * - auth left image panel hidden < 900 px (custom — not a Tailwind tier)
 * - hero phone heights: 820 px desktop / 580 px < 768
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Non-Tailwind Stitch-specific widths (see doc comment above). */
export const STITCH_BREAKPOINTS = {
  /** Auth split-screen left image panel. */
  authImagePanel: 900,
  /** Hero phone mockup min height, desktop. */
  heroPhoneDesktop: 820,
  /** Hero phone mockup min height, below md. */
  heroPhoneMobile: 580,
} as const;
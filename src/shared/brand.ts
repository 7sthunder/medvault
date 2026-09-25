/**
 * Brand constants — plan §5.1 (verified docs/stitch-analysis.md §7.1).
 * Consumed by components/brand and the marketing/app shell headers.
 */
export const BRAND = {
  /** Product name — always rendered as wordmark, never a raw string alone */
  name: "MediTrack AI",
  /** Wordmark split so the accent syllable can be recoloured (MediTrack + AI) */
  wordmark: { active: "MediTrack", accent: "AI" },
  /** Subline used on marketing/empty states */
  tagline: "Medication reminders & health tracking, beautifully simple.",
  /** AI assistant brand (§5.1) */
  ai: { name: "MediTrack AI", gradient: "linear-gradient(135deg,#10b981,#059669)" },
} as const;

export interface LogoConfig {
  /** Logo tile size, px (36–44 per §5.1; default 40) */
  size: number;
  /** Tile radius, px (10–12 per §5.1) */
  radius: number;
  /** Tile gradient (§5.1) */
  gradient: string;
  /** Tile shadow (§5.4 shadow-logo) */
  shadow: string;
  /** Icon colour inside the tile */
  iconColor: string;
  /** Icon size as a fraction of the tile */
  iconScale: number;
}

export const LOGO: LogoConfig = {
  size: 40,
  radius: 11,
  gradient: "linear-gradient(135deg,#10b981,#06b6d4)",
  shadow: "0 4px 12px rgba(16,185,129,0.25)",
  iconColor: "#ffffff",
  iconScale: 0.6,
};

/** Home route the logo lockup links to. */
export const BRAND_HREF = "/";

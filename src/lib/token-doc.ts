/**
 * Machine-readable design-token map (plan §5).
 *
 * Source of truth: plan.md §5.3/§5.4/§5.7 values, verified against the Stitch export in
 * `docs/stitch-analysis.md` §7. Used by the token test to assert `globals.css` carries
 * exactly these definitions (no drift), and by future tooling.
 *
 * `provenance`: "stitch" = value exists verbatim in the export; "extended" = plan-introduced
 * (§12 status tints only — see docs/stitch-analysis.md §7.1).
 */
export interface TokenDocEntry {
  /** Logical label used across plan/token-doc (stable, UI-agnostic) */
  label: string;
  /** CSS custom property as it must appear in globals.css */
  cssVar: string;
  /** Expected value (whitespace-insensitive when compared) */
  value: string;
  provenance: "stitch" | "extended";
  /** One-line usage, plan §5.3 */
  usage: string;
}

export const COLOR_TOKENS: TokenDocEntry[] = [
  {
    label: "primary",
    cssVar: "--color-primary",
    value: "#10b981",
    provenance: "stitch",
    usage: "Primary actions, active states, links, checks",
  },
  {
    label: "primary-dark",
    cssVar: "--color-primary-dark",
    value: "#059669",
    provenance: "stitch",
    usage: "Hover/gradient end",
  },
  {
    label: "primary-tint",
    cssVar: "--color-primary-tint",
    value: "#d1fae5",
    provenance: "stitch",
    usage: "Emerald chip backgrounds",
  },
  {
    label: "primary-tint-2",
    cssVar: "--color-primary-tint-2",
    value: "#a7f3d0",
    provenance: "stitch",
    usage: "Chip gradient end",
  },
  {
    label: "primary-soft",
    cssVar: "--color-primary-soft",
    value: "#f0fdf4",
    provenance: "stitch",
    usage: "Soft backgrounds, chat bubbles, hero start",
  },
  {
    label: "primary-ring",
    cssVar: "--color-primary-ring",
    value: "rgba(16,185,129,0.12)",
    provenance: "stitch",
    usage: "Focus ring (4px)",
  },
  {
    label: "secondary",
    cssVar: "--color-secondary",
    value: "#06b6d4",
    provenance: "stitch",
    usage: "Second gradient color, cyan accents",
  },
  {
    label: "secondary-tint",
    cssVar: "--color-secondary-tint",
    value: "#cffafe",
    provenance: "stitch",
    usage: "Cyan chips",
  },
  {
    label: "secondary-soft",
    cssVar: "--color-secondary-soft",
    value: "#f0f9ff",
    provenance: "stitch",
    usage: "Hero end",
  },
  {
    label: "magenta",
    cssVar: "--color-magenta",
    value: "#f472b6",
    provenance: "stitch",
    usage: "Reminders feature accent",
  },
  {
    label: "magenta-tint",
    cssVar: "--color-magenta-tint",
    value: "#fce7f3",
    provenance: "stitch",
    usage: "Magenta chip background",
  },
  {
    label: "violet",
    cssVar: "--color-violet",
    value: "#8b5cf6",
    provenance: "stitch",
    usage: "Discover feature accent, 'AI' accents",
  },
  {
    label: "blue",
    cssVar: "--color-blue",
    value: "#3b82f6",
    provenance: "stitch",
    usage: "Upcoming dose, appointments",
  },
  {
    label: "blue-tint",
    cssVar: "--color-blue-tint",
    value: "#dbeafe",
    provenance: "stitch",
    usage: "Blue chip background",
  },
  {
    label: "red",
    cssVar: "--color-red",
    value: "#ef4444",
    provenance: "stitch",
    usage: "Missed dose, destructive",
  },
  {
    label: "red-tint",
    cssVar: "--color-red-tint",
    value: "#fee2e2",
    provenance: "extended",
    usage: "Missed chip bg (§12)",
  },
  {
    label: "amber",
    cssVar: "--color-amber",
    value: "#f59e0b",
    provenance: "stitch",
    usage: "Snoozed, ratings stars",
  },
  {
    label: "amber-tint",
    cssVar: "--color-amber-tint",
    value: "#fef3c7",
    provenance: "extended",
    usage: "Snoozed chip bg (§12)",
  },
  {
    label: "teal",
    cssVar: "--color-teal",
    value: "#14b8a6",
    provenance: "stitch",
    usage: "Alternate accent",
  },
  {
    label: "ink-900",
    cssVar: "--color-ink-900",
    value: "#0f172a",
    provenance: "stitch",
    usage: "Headings, primary text (footer bg)",
  },
  {
    label: "ink-800",
    cssVar: "--color-ink-800",
    value: "#1e293b",
    provenance: "stitch",
    usage: "Labels, strong body",
  },
  {
    label: "ink-700",
    cssVar: "--color-ink-700",
    value: "#334155",
    provenance: "stitch",
    usage: "Strong list text",
  },
  {
    label: "ink-600",
    cssVar: "--color-ink-600",
    value: "#475569",
    provenance: "stitch",
    usage: "Body secondary",
  },
  {
    label: "ink-500",
    cssVar: "--color-ink-500",
    value: "#64748b",
    provenance: "stitch",
    usage: "Body tertiary, placeholders",
  },
  {
    label: "ink-400",
    cssVar: "--color-ink-400",
    value: "#94a3b8",
    provenance: "stitch",
    usage: "Muted",
  },
  {
    label: "phone-muted",
    cssVar: "--color-phone-muted",
    value: "#9ab5ad",
    provenance: "stitch",
    usage: "Phone-mockup muted text",
  },
  {
    label: "phone-ink",
    cssVar: "--color-phone-ink",
    value: "#0d1f1a",
    provenance: "stitch",
    usage: "Phone-mockup headings",
  },
  {
    label: "border",
    cssVar: "--border",
    value: "#e2e8f0",
    provenance: "stitch",
    usage: "Cards, inputs, nav bottom edge",
  },
  {
    label: "border-strong",
    cssVar: "--color-border-strong",
    value: "#cbd5e1",
    provenance: "stitch",
    usage: "Hover borders",
  },
  {
    label: "bg",
    cssVar: "--background",
    value: "#f8fafc",
    provenance: "stitch",
    usage: "Page background",
  },
  { label: "bg-card", cssVar: "--card", value: "#ffffff", provenance: "stitch", usage: "Cards" },
  {
    label: "bg-input",
    cssVar: "--input",
    value: "#e2e8f0",
    provenance: "stitch",
    usage: "Input border/resting",
  },
  {
    label: "bg-soft",
    cssVar: "--color-bg-soft",
    value: "#f1f5f9",
    provenance: "stitch",
    usage: "Scrollbar track, dividers",
  },
  {
    label: "footer-bg",
    cssVar: "--color-surface-dark",
    value: "#0f172a",
    provenance: "stitch",
    usage: "Dark footer / dark surfaces",
  },
  {
    label: "hero-gradient",
    cssVar: "--hero-gradient",
    value: "linear-gradient(150deg,#f0fdf4 0%,#f8fafc 50%,#f0f9ff 100%)",
    provenance: "stitch",
    usage: "Marketing hero; app auth hero band",
  },
];

export const SHADOW_TOKENS: TokenDocEntry[] = [
  {
    label: "card-sm",
    cssVar: "--shadow-card-sm",
    value: "0 2px 12px rgba(0,0,0,0.05)",
    provenance: "stitch",
    usage: "Testimonial card",
  },
  {
    label: "card",
    cssVar: "--shadow-card",
    value: "0 12px 48px rgba(0,0,0,0.04)",
    provenance: "stitch",
    usage: "Feature card",
  },
  {
    label: "glass",
    cssVar: "--shadow-glass",
    value: "0 8px 32px rgba(16,185,129,0.13)",
    provenance: "stitch",
    usage: "Insight/notification glass cards",
  },
  {
    label: "glass-lg",
    cssVar: "--shadow-glass-lg",
    value: "0 20px 50px rgba(0,0,0,0.15)",
    provenance: "stitch",
    usage: "Dashboard hero motif",
  },
  {
    label: "primary-btn",
    cssVar: "--shadow-primary-btn",
    value: "0 12px 24px rgba(16,185,129,0.25)",
    provenance: "stitch",
    usage: "Auth/form primary button",
  },
  {
    label: "primary-btn-lg",
    cssVar: "--shadow-primary-btn-lg",
    value: "0 12px 40px rgba(16,185,129,0.6)",
    provenance: "stitch",
    usage: "Primary button hover",
  },
  {
    label: "fab",
    cssVar: "--shadow-fab",
    value: "0 8px 28px rgba(16,185,129,0.6)",
    provenance: "stitch",
    usage: "AI chat FAB",
  },
  {
    label: "leafs",
    cssVar: "--shadow-leafs",
    value: "0 4px 12px rgba(16,185,129,0.1)",
    provenance: "stitch",
    usage: "App focus states",
  },
  {
    label: "logo",
    cssVar: "--shadow-logo",
    value: "0 4px 12px rgba(16,185,129,0.25)",
    provenance: "stitch",
    usage: "Logo tile",
  },
];

export const DESIGN_CONSTANTS = {
  radiusBase: "0.875rem",
  heroGradientVar: "--hero-gradient",
  logoGradientVar: "--logo-gradient",
} as const;

/** Flattened lookup by label. */
export const TOKEN_MAP: ReadonlyMap<string, TokenDocEntry> = new Map(
  [...COLOR_TOKENS, ...SHADOW_TOKENS].map((t) => [t.label, t]),
);

/** Every $5 token-doc entry, in definition order. */
export const ALL_TOKENS: readonly TokenDocEntry[] = [...COLOR_TOKENS, ...SHADOW_TOKENS];

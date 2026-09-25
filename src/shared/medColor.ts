/**
 * Phase 14 — a medication's picked accent hex (§11.6 color swatches) mapped to a
 * Tailwind semantic prefix. `NAMED` covers the editor swatches + brand default;
 * brand green is materialized as `primary` so dose/dashboard accents stay on-token.
 */

const hexChannels = (hex: string): { r: number; g: number; b: number } | null => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  return {
    r: parseInt(m[1]!.slice(0, 2), 16),
    g: parseInt(m[1]!.slice(2, 4), 16),
    b: parseInt(m[1]!.slice(4, 6), 16),
  };
};

const heat = (hex: string) => {
  const c = hexChannels(hex);
  return c ? (c.r * 299 + c.g * 587 + c.b * 114) / 1000 : NaN;
};

const NAMED: Readonly<Record<string, string>> = {
  "#10b981": "primary",
  "#ef4444": "red",
  "#3b82f6": "blue",
  "#06b6d4": "blue",
  "#8b5cf6": "violet",
  "#f59e0b": "amber",
  "#64748b": "slate",
  "#0f766e": "teal",
  "#0ea5e9": "sky",
};

/**
 * Tailwind semantic prefix for a med accent: exact swatch overrides, otherwise a
 * channel heuristic. Returned prefix is used as `var(--<prefix>)/-tint/-tint-2` so
 * only the token family lives in the class string (never the raw hex).
 */
export function medColorPrefix(hex: string): string {
  const exact = NAMED[hex.toLowerCase()];
  if (exact) return exact;
  const c = hexChannels(hex);
  if (!c) return "slate";
  const { r, g, b } = c;
  if (r >= 200 && g < 120 && b < 120) return "red";
  if (r < 120 && g >= 150 && b < 140 && heat(hex) >= 150) return "primary";
  if (r < 120 && g < 140 && b >= 200) return "blue";
  if (r >= 140 && g < 120 && b >= 180) return "violet";
  return "slate";
}

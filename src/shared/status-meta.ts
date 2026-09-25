/**
 * Dose-status display data, free of any icon dependency.
 *
 * This is the single source for status → label / tone / a11y string / hexes. It is
 * deliberately separate from `status.ts` (which attaches lucide components) so that
 * non-DOM clients — notably the Expo app in `apps/mobile` — can render statuses without
 * pulling `lucide-react` into a React Native bundle. The web app keeps importing
 * `DOSE_STATUS_META` from `status.ts`, which re-exports this data unchanged.
 *
 * The §12 table is the single source for status → color. Chip backgrounds use the Stitch
 * tint tokens (bg/fg classes) so statuses stay consistent across light/dark and the token
 * set stays the only colour authority. Colours are never the only signal: every status
 * ships a label and an icon alongside them.
 */

import { DOSE_STATUSES } from "./enums";
import type { DoseStatus } from "./enums";

export type StatusTone = "emerald" | "blue" | "red" | "amber" | "slate" | "neutral";

export interface StatusDisplayMeta {
  /** Human label (plan §12 header row) */
  label: string;
  /** A11y + grouping tone — colours are NEVER the only signal (§12 colour-not-alone rule) */
  tone: StatusTone;
  /** Full a11y description, e.g. "Dose taken" */
  aria: string;
  /** Chip header/border classes per §12 tint recipe */
  fg: string;
  /** Chip background classes */
  bg: string;
  /** Pulse dot class for due-now (animate-ping), else null */
  ping: string | null;
  /** Raw §12 hexes for reference/testing/export */
  fgHex: string;
  bgHex: string;
  pulseHex: string | null;
}

export const DOSE_STATUS_DISPLAY: Readonly<Record<DoseStatus, StatusDisplayMeta>> = {
  taken: {
    label: "Taken",
    tone: "emerald",
    aria: "Dose taken",
    fg: "text-primary-dark",
    bg: "bg-primary-tint",
    ping: null,
    fgHex: "#10b981",
    bgHex: "#d1fae5",
    pulseHex: null,
  },
  upcoming: {
    label: "Upcoming",
    tone: "blue",
    aria: "Upcoming dose",
    fg: "text-blue",
    bg: "bg-blue-tint",
    ping: null,
    fgHex: "#3b82f6",
    bgHex: "#dbeafe",
    pulseHex: null,
  },
  "due-now": {
    label: "Due Now",
    tone: "emerald",
    aria: "Dose due now",
    fg: "text-primary-dark",
    bg: "bg-primary-tint",
    ping: "bg-primary",
    fgHex: "#10b981",
    bgHex: "#d1fae5",
    pulseHex: "rgba(16,185,129,0.4)",
  },
  missed: {
    label: "Missed",
    tone: "red",
    aria: "Dose missed",
    fg: "text-red",
    bg: "bg-red-tint",
    ping: null,
    fgHex: "#ef4444",
    bgHex: "#fee2e2",
    pulseHex: null,
  },
  skipped: {
    label: "Skipped",
    tone: "slate",
    aria: "Dose skipped",
    fg: "text-ink-400",
    bg: "bg-bg-soft",
    ping: null,
    fgHex: "#94a3b8",
    bgHex: "#f1f5f9",
    pulseHex: null,
  },
  snoozed: {
    label: "Snoozed",
    tone: "amber",
    aria: "Dose snoozed",
    fg: "text-amber",
    bg: "bg-amber-tint",
    ping: null,
    fgHex: "#f59e0b",
    bgHex: "#fef3c7",
    pulseHex: null,
  },
  paused: {
    label: "Paused",
    tone: "neutral",
    aria: "Dose schedule paused",
    fg: "text-ink-500",
    bg: "bg-border",
    ping: null,
    fgHex: "#64748b",
    bgHex: "#e2e8f0",
    pulseHex: null,
  },
  canceled: {
    label: "Canceled",
    tone: "neutral",
    aria: "Dose canceled",
    fg: "text-ink-400",
    bg: "bg-background border border-border",
    ping: null,
    fgHex: "#94a3b8",
    bgHex: "#f8fafc",
    pulseHex: null,
  },
} as const;

export { DOSE_STATUSES };
export type { DoseStatus };

export function isDoseStatus(value: string): value is DoseStatus {
  return (DOSE_STATUSES as readonly string[]).includes(value);
}

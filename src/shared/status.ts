import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  AlertCircle,
  Ban,
  BellRing,
  CheckCircle2,
  Clock,
  MinusCircle,
  PauseCircle,
} from "lucide-react";

import { DOSE_STATUSES } from "./enums";
import type { DoseStatus } from "./enums";

export { DOSE_STATUSES };
export type { DoseStatus };

/**
 * Medication dose statuses for the app shell + history (plan §12).
 *
 * The display union itself lives in `shared/enums.ts` (Phase 07 single source);
 * this module maps each status to its §12 colour/icon/meta recipe.
 *
 * The §12 table is the single source for status → color/icon. Chip backgrounds use the
 * Stitch tint tokens (bg/fg classes) so statuses stay consistent across light/dark and
 * the token set stays the only colour authority.
 */

export type StatusTone =
  | "emerald"
  | "blue"
  | "red"
  | "amber"
  | "slate"
  | "neutral";

export interface StatusMeta {
  /** Human label (plan §12 header row) */
  label: string;
  /** A11y + grouping tone — colours are NEVER the only signal (§12 colour-not-alone rule) */
  tone: StatusTone;
  /** Full a11y description, e.g. "Dose taken" */
  aria: string;
  /** Icon component (lucide) — icons + text ships with every status */
  Icon: LucideIcon;
  /** Chip header/border classes per §12 tint recipe */
  fg: string;
  /** Chip background classes */
  bg: string;
  /** Pulse dot colour for due-now (animate-ping), else null */
  ping: string | null;
  /** Raw §12 hexes for reference/testing/export */
  fgHex: string;
  bgHex: string;
  pulseHex: string | null;
}

export const DOSE_STATUS_META: Readonly<Record<DoseStatus, StatusMeta>> = {
  taken: {
    label: "Taken",
    tone: "emerald",
    aria: "Dose taken",
    Icon: CheckCircle2,
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
    Icon: Clock,
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
    Icon: BellRing,
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
    Icon: AlertCircle,
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
    Icon: MinusCircle,
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
    Icon: AlarmClock,
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
    Icon: PauseCircle,
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
    Icon: Ban,
    fg: "text-ink-400",
    bg: "bg-background border border-border",
    ping: null,
    fgHex: "#94a3b8",
    bgHex: "#f8fafc",
    pulseHex: null,
  },
};

export function isDoseStatus(value: string): value is DoseStatus {
  return (DOSE_STATUSES as readonly string[]).includes(value);
}

export function statusMeta(status: DoseStatus): StatusMeta {
  return DOSE_STATUS_META[status];
}
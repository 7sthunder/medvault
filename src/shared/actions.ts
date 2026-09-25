/**
 * Phase 14 — display meta for the dose-action audit log (§8.6 row labels).
 * Pure display labels/tones, no React — mirrors status.ts's shape for the log.
 */

import type { DoseActionType } from "./enums";

export interface DoseActionMeta {
  /** Human label for log rows (§8.6). */
  label: string;
  /** Tone family for row chips. */
  tone: "emerald" | "blue" | "amber" | "slate" | "neutral";
}

export const DOSE_ACTION_META: Readonly<Record<DoseActionType, DoseActionMeta>> = {
  take: { label: "Taken", tone: "emerald" },
  skip: { label: "Skipped", tone: "slate" },
  snooze: { label: "Snoozed", tone: "amber" },
  unsnooze: { label: "Unsnoozed", tone: "blue" },
  missed_auto: { label: "Missed (auto)", tone: "slate" },
  restored: { label: "Restored", tone: "blue" },
  voided: { label: "Canceled", tone: "neutral" },
  demo: { label: "Recorded", tone: "blue" },
};

export function actionMeta(action: DoseActionType): DoseActionMeta {
  return DOSE_ACTION_META[action];
}
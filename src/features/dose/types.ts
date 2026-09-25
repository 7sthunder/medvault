"use client";

import type { DoseActionType, DoseStatus } from "@/shared/enums";
import { DOSE_ACTION_META } from "@/shared/actions";

export interface DoseEventSummary {
  id: string;
  status: DoseStatus;
  scheduledFor: string;
  medName: string;
  dosage: string | null;
  color: string;
  snoozeUntil?: string | null;
  medStatus?: "active" | "paused";
}

export interface DoseActionSummary {
  id: string;
  action: DoseActionType;
  occurredAt: string;
  metaLabel?: string;
  medName?: string;
  dosage?: string;
  color?: string;
}

/** Window a dose is actionable in — due-now/snoozed only, per §10.4. */
export function actionableStatus(status: DoseStatus): "due" | "snoozed" | "none" {
  switch (status) {
    case "due-now":
      return "due";
    case "snoozed":
      return "snoozed";
    default:
      return "none";
  }
}

/** `metaLabel`-style snippet for an action row (e.g. `"Snoozed 10m"`). */
export function actionLabel(tag: DoseActionType): string {
  return DOSE_ACTION_META[tag]?.label ?? tag;
}
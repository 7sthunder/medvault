/**
 * Phase 13 — Pure dose state transition rules (plan §10.3).
 *
 * Implements deterministic transition gates and status machines:
 * upcoming -> due -> snoozed <-> due -> missed | taken | skipped.
 * Pure and timezone-agnostic.
 */

import type { DoseEventStatus } from "../enums";

/**
 * Plan §10.3 rule 4:
 * Taking a dose is allowed from due, snoozed, upcoming, or missed (taking late).
 */
export function canTakeDose(status: DoseEventStatus): boolean {
  return status === "due" || status === "snoozed" || status === "upcoming" || status === "missed";
}

/**
 * Plan §10.3 rule 3:
 * Snoozing is allowed from due, snoozed (if snoozeCount < maxSnoozes), and upcoming.
 * Once missed, skipped, taken, or canceled, it cannot be snoozed.
 */
export function canSnoozeDose(
  status: DoseEventStatus,
  snoozeCount: number,
  maxSnoozes: number,
): boolean {
  if (status !== "due" && status !== "snoozed" && status !== "upcoming") {
    return false;
  }
  return snoozeCount < maxSnoozes;
}

/**
 * Plan §10.3 rule 5 & Grill-Me decision:
 * Skipping is allowed from due, snoozed, and upcoming.
 * Missed doses CANNOT be skipped without explicit re-opening.
 */
export function canSkipDose(status: DoseEventStatus): boolean {
  return status === "due" || status === "snoozed" || status === "upcoming";
}

export interface CalculateSnoozeParams {
  now: Date;
  snoozeMinutes: number;
  currentMissedDeadline: Date;
  missedAfterMinutes: number;
}

export interface CalculateSnoozeResult {
  snoozeUntil: Date;
  missedDeadline: Date;
}

/**
 * Calculate new snoozeUntil and updated missedDeadline.
 * §10.3 rule 3: missedDeadline = max(missedDeadline, snoozeUntil + missedAfterMinutes)
 * Snoozing extends grace so users aren't immediately penalized.
 */
export function calculateSnoozeTimes(params: CalculateSnoozeParams): CalculateSnoozeResult {
  const snoozeUntil = new Date(params.now.getTime() + params.snoozeMinutes * 60 * 1000);
  const extendedDeadline = new Date(snoozeUntil.getTime() + params.missedAfterMinutes * 60 * 1000);

  const missedDeadline =
    extendedDeadline.getTime() > params.currentMissedDeadline.getTime()
      ? extendedDeadline
      : params.currentMissedDeadline;

  return { snoozeUntil, missedDeadline };
}

/**
 * Check if an unresolved dose should be marked missed given current instant:
 * now > missedDeadline and status in ('upcoming', 'due', 'snoozed').
 */
export function isDoseMissed(
  now: Date,
  missedDeadline: Date | null,
  status: DoseEventStatus,
): boolean {
  if (!missedDeadline) return false;
  if (status !== "upcoming" && status !== "due" && status !== "snoozed") return false;
  return now.getTime() > missedDeadline.getTime();
}

/**
 * Check if an upcoming dose is now due:
 * now >= scheduledFor and status is upcoming.
 */
export function isDoseDue(now: Date, scheduledFor: Date, status: DoseEventStatus): boolean {
  if (status !== "upcoming") return false;
  return now.getTime() >= scheduledFor.getTime();
}

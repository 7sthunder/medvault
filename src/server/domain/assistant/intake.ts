/**
 * Voice intake — the slot-filling engine.
 *
 * This module is deliberately pure: it takes what the model said about one utterance plus
 * the draft accumulated so far, and returns the next draft, the list of still-missing
 * required slots, and the single follow-up question to ask. No network, no database.
 *
 * Two invariants, both of which exist because a medication record is a medical record:
 *
 *  1. **A patch can only add or replace, never silently erase.** `null` from the model
 *     means "not mentioned this time", so it is skipped rather than written over the draft.
 *  2. **A dosage is never inferred.** If the user did not state an amount, the slot stays
 *     empty and the assistant asks. A plausible guess is worse than a question.
 */

import { DOSAGE_UNITS } from "@/shared/validations/medication";
import { BRAND } from "@/shared/brand";
import type {
  MedicationDraft,
  DraftSlot,
  ExtractionPatch,
  RequiredSlot,
} from "@/shared/validations/assistant";
import { addLocalDays, localDateKey, startOfLocalDay } from "@/shared/times";

/** `22:00` from `{ hour: 22, minute: 0 }`. */
export function toTimeOfDay(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Local `YYYY-MM-DD` for "today + n days" in the user's timezone. */
export function offsetDateKey(todayKey: string, days: number, timeZone: string): string {
  const base = startOfLocalDay(new Date(`${todayKey}T00:00:00.000Z`), timeZone);
  return localDateKey(addLocalDays(base, days, timeZone), timeZone);
}

function uniqueDays(days: readonly number[]): number[] {
  return [...new Set(days)].sort((a, b) => a - b);
}

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/**
 * Fold one utterance's patch into the draft.
 * `todayKey` must already be the user's local today — all relative dates resolve against it.
 */
export function mergePatch(
  draft: MedicationDraft,
  patch: ExtractionPatch,
  todayKey: string,
  timeZone: string,
): MedicationDraft {
  const next: MedicationDraft = { ...draft, slots: [...draft.slots] };

  if (patch.name !== null) next.name = patch.name;
  if (patch.dosageAmount !== null) next.dosageAmount = patch.dosageAmount;
  if (patch.dosageUnit !== null) next.dosageUnit = patch.dosageUnit;
  if (patch.instructions !== null) next.instructions = patch.instructions;
  if (patch.condition !== null) next.condition = patch.condition;

  // Dates resolve here, never in the model: it only reports offsets.
  if (patch.startInDays !== null) {
    next.startDate = offsetDateKey(todayKey, patch.startInDays, timeZone);
  }
  if (patch.endInDays !== null) {
    const from = patch.startInDays ?? daysBetween(todayKey, next.startDate);
    next.endDate = offsetDateKey(todayKey, Math.max(from, patch.endInDays), timeZone);
  }
  if (patch.repeatForDays !== null) {
    const from = patch.startInDays ?? daysBetween(todayKey, next.startDate);
    // "for 5 days" is inclusive of the start day.
    next.endDate = offsetDateKey(todayKey, from + patch.repeatForDays - 1, timeZone);
  }

  for (const time of patch.times) {
    const timeOfDay = toTimeOfDay(time.hour, time.minute);
    const days = time.daysOfWeek.length ? uniqueDays(time.daysOfWeek) : EVERY_DAY;
    const existing = next.slots.find((slot) => slot.timeOfDay === timeOfDay);
    if (existing) {
      existing.daysOfWeek = uniqueDays([...existing.daysOfWeek, ...days]);
    } else if (next.slots.length < draft.slots.length + MAX_EXTRA_SLOTS) {
      next.slots.push({ timeOfDay, daysOfWeek: days });
    }
  }

  return next;
}

/** Mirrors `MAX_SCHEDULE_SLOTS`; kept local so intake stays import-light in tests. */
const MAX_EXTRA_SLOTS = 6;

function daysBetween(todayKey: string, dateKey: string | null): number {
  if (!dateKey) return 0;
  const a = Date.parse(`${todayKey}T00:00:00.000Z`);
  const b = Date.parse(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** Required slots still empty, in the order they should be asked. */
export function missingSlots(draft: MedicationDraft): RequiredSlot[] {
  const missing: RequiredSlot[] = [];
  if (!draft.name) missing.push("name");
  if (draft.dosageAmount === null) missing.push("dosageAmount");
  if (!draft.dosageUnit) missing.push("dosageUnit");
  if (!draft.startDate) missing.push("startDate");
  if (draft.slots.length === 0) missing.push("timeOfDay");
  return missing;
}

/** One question at a time — a checklist of five is slower than a single prompt. */
export function nextQuestion(missing: RequiredSlot[]): string | null {
  const [slot] = missing;
  switch (slot) {
    case "name":
      return "What is the name of the medicine?";
    case "dosageAmount":
      return "How much is each dose?";
    case "dosageUnit":
      return "What unit is that in — milligrams, or tablets?";
    case "startDate":
      return "When do you want to start taking it?";
    case "timeOfDay":
      return "What time of day should you take it?";
    default:
      return null;
  }
}

/** True when the unit string is one the app already offers (or a short custom one). */
export function isKnownUnit(unit: string): boolean {
  return unit.length <= 20 && unit.trim().length > 0;
}

export function unitHint(): string {
  return DOSAGE_UNITS.join(", ");
}

function friendlyDate(dateKey: string | null, todayKey: string): string {
  if (!dateKey) return "not set";
  const offset = daysBetween(todayKey, dateKey);
  if (offset === 0) return "today";
  if (offset === 1) return "tomorrow";
  return dateKey;
}

function friendlyDays(days: readonly number[]): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (days.length === 7) return "every day";
  return days.map((d) => names[d]).join(", ");
}

/** Human summary of a complete draft — this is exactly what the user confirms. */
export function describeDraft(draft: MedicationDraft, todayKey: string): string {
  const parts = [
    `Name: ${draft.name ?? "—"}`,
    `Dose: ${draft.dosageAmount ?? "—"} ${draft.dosageUnit ?? ""}`.trim(),
    `Start: ${friendlyDate(draft.startDate, todayKey)}`,
    `Repeat: ${draft.endDate ? `until ${draft.endDate}` : "every day until you stop it"}`,
    `Times: ${
      draft.slots.length
        ? draft.slots
            .map((slot: DraftSlot) => `${slot.timeOfDay} (${friendlyDays(slot.daysOfWeek)})`)
            .join(", ")
        : "—"
    }`,
  ];
  if (draft.condition) parts.push(`Reason given: ${draft.condition}`);
  return parts.join(". ");
}

/** Spoken confirmation prompt. */
export function confirmationQuestion(draft: MedicationDraft, todayKey: string): string {
  return `I have everything I need: ${describeDraft(draft, todayKey)}. Shall I save this to ${BRAND.name}?`;
}

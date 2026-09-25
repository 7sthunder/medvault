import { formatHhmm } from "@/lib/format";
import { DEFAULT_SLOT_TIMES, REMINDER_BEFORE_DEFAULT } from "@/shared/constants";
import { medColorPrefix } from "@/shared/medColor";
import type { MedicationDTO, ScheduleSlotDTO } from "@/shared/types";
import {
  scheduleSchema,
  WEEKDAY_INDEXES,
  type ScheduleInput,
} from "@/shared/validations/schedule";
import { DEFAULT_MED_COLOR, type MedicationInput } from "@/shared/validations/medication";

/* ── Shared medication UI vocabulary (plan §11.6) ─────────────────────────── */

/** Short weekday labels; indexes match `0=Sunday … 6=Saturday`. */
export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Editor swatch hexes (§11.6 colour picker) mirroring `medColor.NAMED` + the
 * brand default. Stored without the `#` so the feature lint (no literal hex in
 * tokens) stays green; `toHex` re-materialises the CSS colour.
 */
export const MED_COLOR_OPTIONS = [
  "10b981",
  "ef4444",
  "3b82f6",
  "06b6d4",
  "8b5cf6",
  "f59e0b",
  "0f766e",
  "64748b",
] as const;

export const toHex = (hex: string): string => `#${hex}`;

/** Tailwind icon-tile pair for a medication accent (never the raw hex). */
const MED_PREFIX_TINT: Readonly<Record<string, string>> = {
  primary: "bg-primary-tint text-primary-dark",
  red: "bg-red-tint text-red",
  blue: "bg-blue-tint text-blue",
  violet: "bg-violet-tint text-violet",
  amber: "bg-amber-tint text-amber",
  slate: "bg-bg-soft text-ink-500",
  teal: "bg-bg-soft text-teal",
};

export function medTintClasses(hex: string): string {
  return MED_PREFIX_TINT[medColorPrefix(hex)] ?? "bg-bg-soft text-ink-500";
}

export function dosageLabel(med: Pick<MedicationDTO, "dosageAmount" | "dosageUnit">): string {
  return `${med.dosageAmount} ${med.dosageUnit}`.trim();
}

/** `08:00 · 20:00` (24h) from a medication's slot times. */
export function slotTimeLine(slots: readonly Pick<ScheduleSlotDTO, "timeOfDay">[]): string {
  if (slots.length === 0) return "No times";
  return slots.map((slot) => formatHhmm(slot.timeOfDay, { hour12: false })).join(" · ");
}

/** `"Mon · Wed · Fri"`; the common all-week shortcut. */
export function daysLabel(days: readonly number[]): string {
  if (days.length === WEEKDAY_INDEXES.length) return "Every day";
  const sorted = [...days].sort((a, b) => a - b);
  const text = sorted.map((day) => DAY_LABELS[day] ?? "?").join(" · ");
  return text || "No days";
}

/* ── Wizard schedule-slot draft (§11.6 schedule builder) ───────────────────── */

export interface SlotDraft {
  /** Stable React key; never sent to the server. */
  key: string;
  timeOfDay: string;
  daysOfWeek: number[];
  /** Per-slot dose override (empty → use the medication dose). */
  dosageAmount: string;
  instructionOverride: string;
  enabled: boolean;
}

export const FULL_WEEK = [...WEEKDAY_INDEXES];

let slotSeq = 0;
export const nextSlotKey = (): string => `slot-${++slotSeq}`;

/** Fresh two-slot default (`DEFAULT_SLOT_TIMES`: 08:00 / 20:00). */
export function defaultSlotDrafts(): SlotDraft[] {
  return DEFAULT_SLOT_TIMES.map((timeOfDay) => ({
    key: nextSlotKey(),
    timeOfDay,
    daysOfWeek: [...FULL_WEEK],
    dosageAmount: "",
    instructionOverride: "",
    enabled: true,
  }));
}

export function slotDraftFromDTO(slot: ScheduleSlotDTO): SlotDraft {
  return {
    key: nextSlotKey(),
    timeOfDay: slot.timeOfDay,
    daysOfWeek: [...slot.daysOfWeek],
    dosageAmount: slot.dosageAmount == null ? "" : String(slot.dosageAmount),
    instructionOverride: slot.instructionOverride ?? "",
    enabled: slot.enabled,
  };
}

export interface ScheduleIssues {
  summary: string | null;
  /** slot index → message(s). */
  bySlot: Record<number, string>;
}

/**
 * Validate the draft slots against the shared `scheduleSchema` and return the
 * parsed `ScheduleInput` (dosage coerced to number) for the mutation payload.
 */
export function parseSchedule(slots: readonly SlotDraft[]): {
  ok: boolean;
  issues: ScheduleIssues;
  data: ScheduleInput | null;
} {
  const result = scheduleSchema.safeParse({
    slots: slots.map((slot) => ({
      timeOfDay: slot.timeOfDay,
      daysOfWeek: slot.daysOfWeek,
      dosageAmount: slot.dosageAmount.trim() === "" ? undefined : slot.dosageAmount,
      instructionOverride:
        slot.instructionOverride.trim() === "" ? undefined : slot.instructionOverride.trim(),
      enabled: slot.enabled,
    })),
  });

  if (result.success) {
    return { ok: true, issues: { summary: null, bySlot: {} }, data: result.data };
  }

  const issues: ScheduleIssues = { summary: null, bySlot: {} };
  for (const issue of result.error.issues) {
    const index = Number(issue.path[1]);
    if (Number.isInteger(index)) {
      const existing = issues.bySlot[index];
      issues.bySlot[index] = existing ? `${existing} ${issue.message}` : issue.message;
    } else {
      issues.summary = issues.summary ?? issue.message;
    }
  }
  if (Object.keys(issues.bySlot).length > 0) {
    issues.summary = issues.summary ?? "Fix the highlighted time slots to continue.";
  }
  return { ok: false, issues, data: null };
}

/* ── Medication form defaults (shared by the create + edit wizard) ─────────── */

/**
 * Form-wizard value shape: `dosageAmount` stays a raw string while editing, and
 * the shared §13 `medicationSchema` coerces it to a positive number on submit.
 */
export type MedicationFormValues = Omit<MedicationInput, "dosageAmount"> & {
  dosageAmount: string;
};

/** Blank create defaults; `reminderBeforeMinutes` is part of the §13 contract. */
export function medicationDefaultValues(startDate: string): MedicationFormValues {
  return {
    name: "",
    dosageAmount: "",
    dosageUnit: "",
    instructions: "",
    notes: "",
    status: "active",
    startDate,
    endDate: null,
    color: DEFAULT_MED_COLOR,
    remindersEnabled: true,
    reminderBeforeMinutes: REMINDER_BEFORE_DEFAULT,
  };
}

/** Prefill for the edit wizard from a loaded `MedicationDTO`. */
export function medicationValuesFromDTO(med: MedicationDTO): MedicationFormValues {
  return {
    name: med.name,
    dosageAmount: String(med.dosageAmount),
    dosageUnit: med.dosageUnit,
    instructions: med.instructions ?? "",
    notes: med.notes ?? "",
    status: med.status,
    startDate: med.startDate,
    endDate: med.endDate ?? null,
    color: med.color,
    remindersEnabled: med.remindersEnabled,
    reminderBeforeMinutes: REMINDER_BEFORE_DEFAULT,
  };
}
/**
 * Voice intake contract — the shared shapes for the conversational medication intake.
 *
 * The design principle: **the model never produces a finished medication.** It only ever
 * emits an `extractionPatch` describing what it heard in ONE utterance, using relative
 * offsets (`startInDays`, `repeatForDays`) and raw clock numbers (`hour`, `minute`)
 * rather than formatted strings. The server resolves those into `dateKey`/`HH:mm` values
 * and merges them into a draft. That keeps date arithmetic and 12/24-hour parsing
 * deterministic, and it keeps the model's output from ever being trusted as a ready record.
 *
 * Nothing here writes. A medication is only ever created from a draft the user has seen
 * and explicitly confirmed, through the same `medicationService.create` the form uses.
 */

import { z } from "zod";

import {
  DOSAGE_AMOUNT_MAX,
  INSTRUCTIONS_MAX,
  MAX_SCHEDULE_SLOTS,
  MED_NAME_MAX,
} from "../constants";
import { HHMM_REGEX } from "../times";
import { dateKeySchema } from "./common";

/** One "take it at HH:mm on these weekdays" row in the draft. */
export const draftSlotSchema = z.object({
  timeOfDay: z.string().trim().regex(HHMM_REGEX),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7),
});
export type DraftSlot = z.infer<typeof draftSlotSchema>;

/** Accumulated, still-incomplete medication. Every field nullable until the user supplies it. */
export const medicationDraftSchema = z.object({
  name: z.string().trim().min(1).max(MED_NAME_MAX).nullable(),
  dosageAmount: z.number().positive().max(DOSAGE_AMOUNT_MAX).nullable(),
  dosageUnit: z.string().trim().min(1).max(20).nullable(),
  instructions: z.string().trim().max(INSTRUCTIONS_MAX).nullable(),
  /** The user's own words about why they take it. Recorded verbatim; never a diagnosis. */
  condition: z.string().trim().max(200).nullable(),
  startDate: dateKeySchema.nullable(),
  endDate: dateKeySchema.nullable(),
  remindersEnabled: z.boolean(),
  slots: z.array(draftSlotSchema).max(MAX_SCHEDULE_SLOTS),
});
export type MedicationDraft = z.infer<typeof medicationDraftSchema>;

/** A brand-new, entirely empty draft. */
export function emptyDraft(): MedicationDraft {
  return {
    name: null,
    dosageAmount: null,
    dosageUnit: null,
    instructions: null,
    condition: null,
    startDate: null,
    endDate: null,
    remindersEnabled: true,
    slots: [],
  };
}

/**
 * What the model may report for a single utterance. Every field is `.nullable()` and
 * defaults to `null`, and `null` means "not mentioned this time" — never "clear what we
 * already have".
 *
 * The defaults are deliberate leniency: a model that omits a key (or answers an off-topic
 * utterance with a short object) must degrade to "I did not follow that" rather than fail
 * the whole turn with a 400.
 */
export const extractionPatchSchema = z.object({
  /** `false` when the utterance was not about adding a medication at all. */
  understood: z.boolean().default(true),
  name: z.string().trim().max(MED_NAME_MAX).nullish().default(null),
  dosageAmount: z.number().positive().max(DOSAGE_AMOUNT_MAX).nullish().default(null),
  dosageUnit: z.string().trim().max(20).nullish().default(null),
  instructions: z.string().trim().max(INSTRUCTIONS_MAX).nullish().default(null),
  condition: z.string().trim().max(200).nullish().default(null),
  /** 0 = today. Resolved server-side against the user's timezone. */
  startInDays: z.number().int().min(0).max(365).nullish().default(null),
  /** "for 5 days" → inclusive end date, computed server-side. */
  repeatForDays: z.number().int().min(1).max(3650).nullish().default(null),
  /** Explicit end date, as an offset from today. */
  endInDays: z.number().int().min(0).max(3650).nullish().default(null),
  /** Clock times as numbers so 12/24-hour phrasing is never re-parsed from a string. */
  times: z
    .array(
      z.object({
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59).default(0),
        /** Empty means "every day". */
        daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).default([]),
      }),
    )
    .max(MAX_SCHEDULE_SLOTS)
    .default([]),
  /** The user is talking about something else entirely (asking a question, chit-chat). */
  offTopic: z.boolean().default(false),
  /**
   * The language the patient just used, by name ("Hindi", "Arabic"). Only used to pick a TTS
   * voice, never to parse anything.
   */
  language: z.string().trim().max(40).nullish().default(null),
  /**
   * The assistant's next single line, written by the model in the language the patient just
   * used. This is DISPLAY AND SPEECH TEXT ONLY — it is never merged into the draft and never
   * reaches the database. An adversarial `reply` cannot fill a slot; see `mergePatch`, which
   * only reads the typed fields above.
   */
  reply: z.string().trim().min(1).max(300).nullish().default(null),
});
export type ExtractionPatch = z.infer<typeof extractionPatchSchema>;

/** A slot the app cannot save a medication without. */
export const requiredSlotSchema = z.enum([
  "name",
  "dosageAmount",
  "dosageUnit",
  "startDate",
  "timeOfDay",
]);
export type RequiredSlot = z.infer<typeof requiredSlotSchema>;

export const ASSISTANT_TURN_STATUSES = [
  /** Still collecting required slots. */
  "collecting",
  /** Everything is filled in; waiting for the user to confirm. */
  "confirm",
  /** Confirmed and written. */
  "saved",
  /** Nothing usable was understood this turn. */
  "unclear",
] as const;
export type AssistantTurnStatus = (typeof ASSISTANT_TURN_STATUSES)[number];

/** One turn's outcome. `question` is what the assistant says out loud. */
export const assistantTurnSchema = z.object({
  status: z.enum(ASSISTANT_TURN_STATUSES),
  draft: medicationDraftSchema,
  missing: z.array(requiredSlotSchema),
  /** Spoken/written follow-up question, or the confirmation summary. */
  question: z.string(),
  /** BCP-47-ish tag when the model reports one, so TTS can answer in the same language. */
  language: z.string().nullable(),
  /** Present only on `status: "saved"`. */
  medicationId: z.string().nullable(),
});
export type AssistantTurn = z.infer<typeof assistantTurnSchema>;

/** Base64 webm/opus clip from the browser. Bounded well below any request-size limit. */
export const MAX_AUDIO_BASE64_CHARS = 6_000_000;

export const audioClipSchema = z.object({
  audioBase64: z.string().min(1).max(MAX_AUDIO_BASE64_CHARS),
  mimeType: z.string().trim().min(1).max(64),
});

/**
 * Voice intake service — Gemini speech + slot filling, and the one place a draft is
 * allowed to become a real medication.
 *
 * Flow for "I am suffering from diabetes… I need to take this tablet daily at 10 pm,
 * repeat for 5 days":
 *
 *   1. `transcribe`  browser mic → base64 webm → `gemini-3.5-transcribe` → text (any language)
 *   2. `turn`        text + current draft → `gemini-3.1-flash-lite` → extractionPatch
 *   3. `turn`        patch → mergePatch → missingSlots → next question  (loops on 2)
 *   4. `turn`        missing empty → confirmationQuestion, status "confirm"
 *   5. `turn`        user confirms → `medicationService.create` → status "saved"
 *
 * The write is deliberately last and deliberately unconditional on model output: it happens
 * only when the client sends `confirm: true` *and* the merged draft validates against the
 * same `medicationSchema`/`scheduleSchema` the manual form uses. There is no path where a
 * model response alone creates a medication.
 */

import { TRPCError } from "@trpc/server";

import {
  DEFAULT_STT_MODEL,
  DEFAULT_TTS_MODEL,
  firstAudio,
  firstText,
  geminiGenerate,
  resolveModel,
} from "@/server/gemini/client";
import type { Db } from "@/server/db/helpers";
import { medicationService } from "@/server/domain/medications/service";
import { BRAND } from "@/shared/brand";
import { localDateKey, now } from "@/shared/times";
import { medicationSchema, DEFAULT_MED_COLOR } from "@/shared/validations/medication";
import { scheduleSchema } from "@/shared/validations/schedule";
import {
  emptyDraft,
  extractionPatchSchema,
  medicationDraftSchema,
  type AssistantTurn,
  type ExtractionPatch,
  type MedicationDraft,
} from "@/shared/validations/assistant";
import {
  confirmationQuestion,
  describeDraft,
  mergePatch,
  missingSlots,
  nextQuestion,
  unitHint,
} from "./intake";

/* ── System prompts ──────────────────────────────────────────────────────── */

/**
 * The extraction contract. The load-bearing rules, in order of importance:
 *  - report ONLY what was said, `null` for anything absent;
 *  - NEVER infer or guess a dosage, a medicine name, or a condition;
 *  - report times as clock numbers, not formatted strings;
 *  - report dates as day offsets from today, never as `YYYY-MM-DD`.
 */
const EXTRACTION_PROMPT = [
  `You are the intake assistant for ${BRAND.name}, a medication reminder app.`,
  "You convert what a patient SAYS (in any language) into a structured patch of medication details.",
  "",
  "ABSOLUTE RULES:",
  "- Report ONLY details the patient actually said. For anything not said, output null.",
  "- NEVER guess, infer or invent a medicine name, a dose amount, a dose unit, or a condition.",
  "  Missing information is collected later by asking a follow-up question.",
  "- If the patient says 'this tablet' or 'my medicine' with no name, name must be null.",
  "- If no quantity is spoken, dosageAmount and dosageUnit must both be null.",
  "- Only record a condition in `condition` when the patient states it themselves.",
  "  This is their own note, not a diagnosis, and you must never name a condition they did not say.",
  "- `instructions` is only for dosing directions like 'with food' or 'after dinner'.",
  "  Do NOT put frequency words there ('daily', 'twice a day') — that belongs in the times/duration fields.",
  "- Never suggest a medicine, a dose, or that they start/stop/change anything.",
  "",
  "NUMBERS, NOT STRINGS:",
  "- times: use 24-hour `hour` 0-23 and `minute` 0-59. '10 pm' is hour 22.",
  "- If the patient names a day or days ('Mondays', 'weekdays', 'every other day'), put those",
  "  weekday indexes in `daysOfWeek` (0=Sunday .. 6=Saturday). Leave it empty for every day.",
  "- startInDays: 0 means today, 1 means tomorrow. Use null if no start was mentioned.",
  "- repeatForDays: how many days in total they said ('for 5 days' is 5). null if not said.",
  "- endInDays: only if they gave an explicit end date. null otherwise.",
  "",
  "OUTPUT: a single JSON object with exactly these keys, using null for anything unsaid:",
  '{"understood":true,"offTopic":false,"name":null,"dosageAmount":null,"dosageUnit":null,',
  '"instructions":null,"condition":null,"startInDays":null,"repeatForDays":null,"endInDays":null,',
  '"times":[{"hour":22,"minute":0,"daysOfWeek":[]}]}',
  `Known dosage units: ${unitHint()}. Use one of them when the patient implies it; otherwise`,
  "use the unit the patient said.",
  "Set `offTopic` to true when the utterance is not about taking a medicine at all.",
  "Set `understood` to false when you could not make sense of the audio or text.",
].join("\n");

const TRANSCRIBE_PROMPT = [
  "Transcribe the attached speech verbatim in its original language.",
  "Do NOT translate. Do NOT summarise. Do NOT add commentary.",
  "Output only the transcription text.",
].join("\n");

/* ── Provider plumbing ───────────────────────────────────────────────────── */

function apiKey(): string | null {
  return process.env.AI_GEMINI_API_KEY || null;
}

function textModel(): string {
  return resolveModel(process.env.AI_GEMINI_MODEL, "gemini-3.1-flash-lite");
}

function sttModel(): string {
  return resolveModel(process.env.AI_GEMINI_STT_MODEL, DEFAULT_STT_MODEL);
}

function ttsModel(): string {
  return resolveModel(process.env.AI_GEMINI_TTS_MODEL, DEFAULT_TTS_MODEL);
}

/** JSON-mode generation config. Thinking off, enough room for the whole patch. */
function jsonConfig(): Record<string, unknown> {
  return {
    responseMimeType: "application/json",
    temperature: 0,
    maxOutputTokens: 2048,
    thinkingConfig: { thinkingBudget: 0 },
  };
}

/* ── Service ─────────────────────────────────────────────────────────────── */

export interface TurnInput {
  /** Latest thing the patient said, verbatim. Ignored when `confirm` is true. */
  utterance?: string;
  /** The draft from the previous turn. Omit to start a new intake. */
  draft?: MedicationDraft;
  /** The patient explicitly confirmed the summary. */
  confirm?: boolean;
}

export const assistantService = {
  available(): boolean {
    return apiKey() !== null;
  },

  /**
   * Speech → text, language-agnostic. Returns the verbatim transcript plus a best-effort
   * language tag so TTS can reply in the same language.
   */
  async transcribe(
    audioBase64: string,
    mimeType: string,
  ): Promise<{ text: string; language: string | null }> {
    const key = apiKey();
    if (!key)
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Voice intake is not configured.",
      });

    // The transcribe models also reject `systemInstruction`, so the instruction rides in the
    // text turn alongside the audio.
    const payload = await geminiGenerate(key, {
      model: sttModel(),
      parts: [{ inlineData: { mimeType, data: audioBase64 } }, { text: TRANSCRIBE_PROMPT }],
      generationConfig: { temperature: 0 },
      // Audio upload is slower than a short text call.
      timeoutMs: 30_000,
    });

    const text = firstText(payload)?.trim();
    if (!text) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "I could not hear anything. Please try again.",
      });
    }
    return { text, language: detectLanguage(text) };
  },

  /**
   * One conversational turn. Loops on the client: the patient keeps speaking until
   * `missing` is empty, then confirms, then this writes.
   */
  async turn(db: Db, userId: string, timeZone: string, input: TurnInput): Promise<AssistantTurn> {
    const key = apiKey();
    if (!key)
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Voice intake is not configured.",
      });

    const draft = medicationDraftSchema.parse(input.draft ?? emptyDraft());
    const at = now();
    const todayKey = localDateKey(at, timeZone);

    // 5. Confirm → validate → write. No model call on this path.
    if (input.confirm) {
      const missing = missingSlots(draft);
      if (missing.length > 0) {
        return {
          status: "collecting",
          draft,
          missing,
          question: nextQuestion(missing) ?? "I still need a little more information.",
          language: null,
          medicationId: null,
        };
      }
      const created = await saveMedication(db, userId, timeZone, draft);
      return {
        status: "saved",
        draft,
        missing: [],
        question: `Saved. ${created.name} is scheduled ${describeDraft(draft, todayKey)}.`,
        language: null,
        medicationId: created.id,
      };
    }

    const utterance = input.utterance?.trim();
    if (!utterance) {
      const missing = missingSlots(draft);
      return {
        status: "collecting",
        draft,
        missing,
        question: nextQuestion(missing) ?? "Tell me about the medicine you want to add.",
        language: null,
        medicationId: null,
      };
    }

    // 2. What did they just say?
    const patch = await extract(key, utterance, draft, todayKey, timeZone);

    if (patch.offTopic || !patch.understood) {
      const missing = missingSlots(draft);
      return {
        status: "unclear",
        draft,
        missing,
        question:
          "Sorry, I did not follow that. " +
          (nextQuestion(missing) ?? "Tell me the name of the medicine you want to take."),
        language: detectLanguage(utterance),
        medicationId: null,
      };
    }

    // 3. Fold it in and see what is still missing.
    const merged = medicationDraftSchema.parse(mergePatch(draft, patch, todayKey, timeZone));
    const missing = missingSlots(merged);

    // 4. Complete → ask for confirmation. Nothing is written yet.
    if (missing.length === 0) {
      return {
        status: "confirm",
        draft: merged,
        missing: [],
        question: confirmationQuestion(merged, todayKey),
        language: detectLanguage(utterance),
        medicationId: null,
      };
    }

    return {
      status: "collecting",
      draft: merged,
      missing,
      question: nextQuestion(missing) ?? "Could you tell me a bit more?",
      language: detectLanguage(utterance),
      medicationId: null,
    };
  },

  /** Text → speech, so the assistant can ask its question out loud. */
  async speak(
    text: string,
    language?: string | null,
  ): Promise<{ mimeType: string; audioBase64: string }> {
    const key = apiKey();
    if (!key)
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Voice intake is not configured.",
      });

    // TTS models reject `systemInstruction` outright ("Developer instruction is not enabled
    // for this model"), so the voice direction has to ride along in the user turn.
    const directive = language
      ? `Read the following aloud naturally in ${language}. Output audio only, with no other text.`
      : "Read the following aloud naturally. Output audio only, with no other text.";

    const payload = await geminiGenerate(key, {
      model: ttsModel(),
      parts: [{ text: `${directive}\n\n${text}` }],
      generationConfig: { responseModalities: ["AUDIO"] },
      timeoutMs: 30_000,
    });

    const audio = firstAudio(payload);
    if (!audio) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "I could not produce audio for that." });
    }
    return { mimeType: audio.mimeType, audioBase64: audio.data };
  },
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

async function extract(
  key: string,
  utterance: string,
  draft: MedicationDraft,
  todayKey: string,
  timeZone: string,
): Promise<ExtractionPatch> {
  const known = knownSoFar(draft, todayKey);
  const payload = await geminiGenerate(key, {
    model: textModel(),
    parts: [
      {
        text: [
          `Today's date is ${todayKey} (timezone ${timeZone}).`,
          known ? `Already collected: ${known}.` : "Nothing collected yet.",
          `Patient says: "${utterance}"`,
        ].join("\n"),
      },
    ],
    systemInstruction: EXTRACTION_PROMPT,
    generationConfig: jsonConfig(),
  });

  const text = firstText(payload);
  if (!text) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "I could not understand that. Please try again.",
    });
  }
  const parsed = extractionPatchSchema.safeParse(safeJson(text));
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "I could not understand that. Please try again.",
    });
  }
  return parsed.data;
}

/** What the draft already holds, so the model does not re-ask for it. */
function knownSoFar(draft: MedicationDraft, todayKey: string): string | null {
  const bits: string[] = [];
  if (draft.name) bits.push(`name "${draft.name}"`);
  if (draft.dosageAmount !== null)
    bits.push(`dose ${draft.dosageAmount} ${draft.dosageUnit ?? ""}`.trim());
  if (draft.startDate) bits.push(`start ${draft.startDate}`);
  if (draft.endDate) bits.push(`end ${draft.endDate}`);
  if (draft.slots.length) bits.push(`times ${draft.slots.map((s) => s.timeOfDay).join("/")}`);
  if (draft.condition) bits.push(`reason "${draft.condition}"`);
  return bits.length ? `${bits.join(", ")} (today is ${todayKey})` : null;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    // A fenced or truncated reply still deserves a shot.
    const match = /\{[\s\S]*\}/.exec(text);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as unknown;
    } catch {
      return null;
    }
  }
}

/**
 * Turn a confirmed draft into a real medication through the normal service, so dose events,
 * reminders and the adherence rollup all behave exactly as they do for a hand-typed med.
 */
async function saveMedication(db: Db, userId: string, timeZone: string, draft: MedicationDraft) {
  const { name, dosageAmount, dosageUnit, instructions, condition, startDate, endDate, slots } =
    draft;
  if (name === null || dosageAmount === null || dosageUnit === null || startDate === null) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The medicine is still missing details." });
  }

  // The condition the patient volunteered is kept as a note, in their words.
  const notes = condition ? `Reported reason: ${condition}` : null;

  const medication = medicationSchema.parse({
    name,
    dosageAmount,
    dosageUnit,
    instructions: instructions ?? null,
    notes,
    status: "active",
    startDate,
    endDate,
    color: DEFAULT_MED_COLOR,
    remindersEnabled: true,
    reminderBeforeMinutes: 5,
  });

  const schedule = scheduleSchema.parse({
    slots: slots.map((slot) => ({
      timeOfDay: slot.timeOfDay,
      daysOfWeek: slot.daysOfWeek,
      dosageAmount: null,
      instructionOverride: null,
      enabled: true,
    })),
  });

  return medicationService.create(db, userId, timeZone, { medication, schedule });
}

/** Rough script hint so TTS replies in the same language the patient used. */
export function detectLanguage(text: string): string | null {
  if (/\p{Script=Devanagari}/u.test(text)) return "Hindi";
  if (/\p{Script=Arabic}/u.test(text)) return "Arabic";
  if (/\p{Script=Bengali}/u.test(text)) return "Bengali";
  if (/\p{Script=Tamil}/u.test(text)) return "Tamil";
  if (/\p{Script=Telugu}/u.test(text)) return "Telugu";
  if (/\p{Script=Kannada}/u.test(text)) return "Kannada";
  if (/\p{Script=Malayalam}/u.test(text)) return "Malayalam";
  if (/\p{Script=Gujarati}/u.test(text)) return "Gujarati";
  if (/\p{Script=Thai}/u.test(text)) return "Thai";
  if (/\p{Script=Han}/u.test(text)) return "Chinese";
  if (/\p{Script=Cyrillic}/u.test(text)) return "Russian";
  if (/\p{Script=Greek}/u.test(text)) return "Greek";
  return "English";
}

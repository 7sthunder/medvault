/**
 * Phase 17 — provider-agnostic AI client for insights (§10.10).
 *
 * The provider boundary keeps the LLM call out of the business logic: the insights
 * service only knows `AiInsightProvider.generate(snapshot) → parsed JSON (or throw)`.
 * The bundled Gemini implementation talks to the REST API over `fetch` and is gated on
 * `AI_GEMINI_API_KEY`; a different `anomaly` provider can be swapped in via
 * `resolveAiProvider` without touching the service or the fallback engine.
 *
 * The SYSTEM PROMPT is the behavioral boundary: never diagnose/prescribe/recommend
 * medication changes — only behavioral observations + encouragement.
 */

import { INSIGHT_CATEGORIES, SUGGESTED_ACTIONS } from "@/shared/enums";
import { BRAND } from "@/shared/brand";
import {
  firstText,
  geminiGenerate as geminiRequest,
  GEMINI_TIMEOUT_MS,
} from "@/server/gemini/client";
import type { InsightItem, InsightSnapshot } from "@/shared/validations/insight";

/** Fixed, in-code coaching prompt (§10.10). Behavioral only. */
export const AI_SYSTEM_PROMPT = [
  `You are ${BRAND.name}'s adherence coach. You help a patient notice patterns in how reliably they take their medication.`,
  "STRICT RULES:",
  "- Do NOT diagnose any condition.",
  "- Do NOT prescribe, dose, or recommend starting, stopping or changing any medication or dosage.",
  "- Only behavioral observations and encouragement (timing, routine, reminders, consistency).",
  "- If the data does not support an observation, say so plainly rather than guessing.",
  "Respond ONLY with a JSON object with the shape:",
  '{"tone":"neutral"|"encouraging","insights":[{"category":"<one of ' +
    INSIGHT_CATEGORIES.join("|") +
    '>","summary":"<one sentence, <= 200 chars>","detail":"<optional, <= 800 chars>","suggestedActionType":"<one of ' +
    SUGGESTED_ACTIONS.join("|") +
    ' or null>"}]}',
  "The input is the patient's last-30-days adherence snapshot (JSON).",
].join("\n");

export interface AiInsightProvider {
  readonly name: string;
  readonly available: boolean;
  /** Returns the raw parsed JSON object from the model (validated by the service). */
  generate(snapshot: InsightSnapshot): Promise<unknown>;
}

export const AI_REQUEST_TIMEOUT_MS = GEMINI_TIMEOUT_MS;

/**
 * Default text model. Every `gemini-2.x` model now 404s for newly issued API keys
 * ("no longer available to new users"), so the old hardcoded `gemini-2.0-flash` could only
 * ever fall through to the rule engine. `gemini-3.1-flash-lite` is a verified-stable
 * free-tier choice; the `3.5+` flash line intermittently returns 503 under load.
 * Override with `AI_GEMINI_MODEL`.
 */
export const AI_DEFAULT_MODEL = "gemini-3.1-flash-lite";

/** Provider resolution — null (fallback) unless a Gemini key is configured. */
export function resolveAiProvider(): AiInsightProvider | null {
  const key = process.env.AI_GEMINI_API_KEY;
  if (!key) return null;
  return {
    name: "gemini",
    available: true,
    generate: (snapshot) => geminiGenerate(key, snapshot),
  };
}

async function geminiGenerate(key: string, snapshot: InsightSnapshot): Promise<unknown> {
  const model = process.env.AI_GEMINI_MODEL || AI_DEFAULT_MODEL;
  const payload = await geminiRequest(key, {
    model,
    parts: [{ text: `${AI_SYSTEM_PROMPT}\n\nSnapshot:\n${JSON.stringify(snapshot)}` }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 2048,
      // Current flash models spend tokens on hidden reasoning first. Left unbudgeted it eats
      // the response budget (a tight cap returns `content: {}` + MAX_TOKENS, so the text is
      // missing and the service silently drops to the fallback engine).
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  const text = firstText(payload);
  if (!text) throw new Error("gemini returned no text candidate");
  return JSON.parse(text) as unknown;
}

/** Make a bespoke item for tests/tooling without touching the LLM. */
export function fallbackItem(input: InsightItem): InsightItem {
  return input;
}

export type { InsightItem };

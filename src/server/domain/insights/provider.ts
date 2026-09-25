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

export const AI_REQUEST_TIMEOUT_MS = 10_000;

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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${AI_SYSTEM_PROMPT}\n\nSnapshot:\n${JSON.stringify(snapshot)}` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      throw new Error(`gemini generateContent failed: ${res.status}`);
    }
    const payload = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("gemini returned no text candidate");
    return JSON.parse(text) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

/** Make a bespoke item for tests/tooling without touching the LLM. */
export function fallbackItem(input: InsightItem): InsightItem {
  return input;
}

export type { InsightItem };

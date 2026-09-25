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
import { log } from "@/lib/log";
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

/**
 * Default text model. Every `gemini-2.x` model now 404s for newly issued API keys
 * ("no longer available to new users"), so the old hardcoded `gemini-2.0-flash` could only
 * ever fall through to the rule engine. `gemini-3.1-flash-lite` is a verified-stable
 * free-tier choice; the `3.5+` flash line intermittently returns 503 under load.
 * Override with `AI_GEMINI_MODEL`.
 */
export const AI_DEFAULT_MODEL = "gemini-3.1-flash-lite";

/** Backoff before retrying a retryable response (503 high demand / 429 rate limit). */
const AI_RETRY_DELAYS_MS = [400, 1200] as const;

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
  const model = process.env.AI_GEMINI_MODEL || AI_DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [{ text: `${AI_SYSTEM_PROMPT}\n\nSnapshot:\n${JSON.stringify(snapshot)}` }],
      },
    ],
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
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body,
    signal: controller.signal,
  };
  try {
    const res = await fetchWithRetry(url, init);
    if (!res.ok) {
      // Log the body, not just the status: "no longer available to new users" was invisible
      // behind a bare 404 and every insight shipped from the rule engine instead.
      const detail = await res.text().catch(() => "");
      log.warn("Gemini generateContent failed", { model, status: res.status, body: detail });
      throw new Error(`gemini generateContent failed: ${res.status} (${model})`);
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

/** Retry only the transient statuses — a 400/404 will not fix itself. */
function isRetryable(status: number): boolean {
  return status === 429 || status === 500 || status === 503;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Bounded retry for free-tier 503 "high demand" and 429 rate limits. Every attempt shares the
 * caller's AbortSignal, so the overall request still dies at `AI_REQUEST_TIMEOUT_MS`.
 */
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let last: Response | undefined;
  for (let attempt = 0; attempt <= AI_RETRY_DELAYS_MS.length; attempt++) {
    last = await fetch(url, init);
    if (last.ok || !isRetryable(last.status)) return last;
    const delay = AI_RETRY_DELAYS_MS[attempt];
    if (delay === undefined) return last;
    // Drain the body so the socket can be reused, then back off.
    await last.text().catch(() => "");
    log.warn("Gemini retryable error", { status: last.status, attempt: attempt + 1 });
    await sleep(delay);
  }
  return last as Response;
}

/** Make a bespoke item for tests/tooling without touching the LLM. */
export function fallbackItem(input: InsightItem): InsightItem {
  return input;
}

export type { InsightItem };

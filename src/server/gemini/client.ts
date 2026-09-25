/**
 * Shared Gemini REST client.
 *
 * One place that owns the API key header, the request timeout, and the bounded retry for
 * free-tier `503 "high demand"` / `429` responses. Every Gemini-backed feature (insights,
 * voice intake speech-to-text / text-to-speech) goes through here, so a model fix or a
 * tier change lands in one spot.
 *
 * Deliberately raw `fetch` rather than an SDK: the Live API needs a WebSocket and
 * `bidiGenerateContent`, which the Vercel AI SDK does not model.
 */

import { log } from "@/lib/log";

/** Whole-request budget, shared by every attempt. */
export const GEMINI_TIMEOUT_MS = 10_000;

/** Speech-to-text and text-to-speech models (defaults; override per env). */
export const DEFAULT_STT_MODEL = "gemini-3.5-transcribe";
export const DEFAULT_TTS_MODEL = "gemini-3.8-flash-tts";

/** Backoff before each retry of a retryable response. */
const RETRY_DELAYS_MS = [400, 1200] as const;

const BASE = "https://generativelanguage.googleapis.com/v1beta";

/** 400/404 will not fix themselves; only transport-level and throttling failures retry. */
function isRetryable(status: number): boolean {
  return status === 429 || status === 500 || status === 503;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  /** The transcribe models return the transcript under this key, not `text`. */
  audioTranscription?: { text?: string };
}

export interface GeminiRequest {
  model: string;
  parts: GeminiPart[];
  systemInstruction?: string;
  generationConfig?: Record<string, unknown>;
  timeoutMs?: number;
}

export class GeminiError extends Error {
  constructor(
    readonly status: number,
    readonly model: string,
    readonly detail: string,
  ) {
    super(`gemini ${model} failed: ${status}`);
    this.name = "GeminiError";
  }
}

export function resolveModel(explicit: string | undefined, fallback: string): string {
  return explicit || fallback;
}

/**
 * POST to `models/{model}:generateContent` and return the raw parsed body.
 * Throws `GeminiError` with the response body attached — a bare status is not enough to
 * diagnose "this model is no longer available to new users" behind a 404.
 */
export async function geminiGenerate(
  key: string,
  { model, parts, systemInstruction, generationConfig, timeoutMs }: GeminiRequest,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? GEMINI_TIMEOUT_MS);
  const url = `${BASE}/models/${model}:generateContent`;
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      ...(generationConfig ? { generationConfig } : {}),
    }),
    signal: controller.signal,
  };
  try {
    const res = await fetchWithRetry(url, init, model);
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      log.warn("Gemini request failed", { model, status: res.status, body: detail });
      throw new GeminiError(res.status, model, detail);
    }
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(url: string, init: RequestInit, model: string): Promise<Response> {
  let last: Response | undefined;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    last = await fetch(url, init);
    if (last.ok || !isRetryable(last.status)) return last;
    const delay = RETRY_DELAYS_MS[attempt];
    if (delay === undefined) return last;
    // Drain the body so the socket can be reused, then back off.
    await last.text().catch(() => "");
    log.warn("Gemini retryable error", { model, status: last.status, attempt: attempt + 1 });
    await sleep(delay);
  }
  return last as Response;
}

export interface GeminiCandidate {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

/** First usable text across all candidates, or `undefined`. */
export function firstText(payload: unknown): string | undefined {
  const candidates = (payload as { candidates?: { content?: { parts?: GeminiPart[] } }[] })
    .candidates;
  for (const candidate of candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.text) return part.text;
      // Speech-to-text models answer with `audioTranscription`, not a text part.
      if (part.audioTranscription?.text) return part.audioTranscription.text;
    }
  }
  return undefined;
}

/** First inline audio blob across all candidates, or `undefined`. */
export function firstAudio(payload: unknown): { mimeType: string; data: string } | undefined {
  const candidates = (payload as { candidates?: { content?: { parts?: GeminiPart[] } }[] })
    .candidates;
  for (const candidate of candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) return part.inlineData;
    }
  }
  return undefined;
}

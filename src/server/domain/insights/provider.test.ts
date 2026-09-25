import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AI_DEFAULT_MODEL, AI_SYSTEM_PROMPT, resolveAiProvider } from "./provider";
import type { InsightSnapshot } from "@/shared/validations/insight";

/**
 * Network-level contract for the Gemini provider. The insights service swallows provider
 * failures and falls back to the rule engine, so a broken model pin (every `gemini-2.x` model
 * 404s for newly issued API keys) is invisible in the product — it only shows up as
 * `source: 'fallback'`. These tests pin the request shape and the failure behaviour so that
 * regression cannot pass silently.
 */

const snapshot = {
  windowDays: 30,
  generatedAt: "2026-01-01T00:00:00.000Z",
  totals: { scheduled: 10, taken: 9, missed: 1, skipped: 0, snoozed: 0, adherencePercent: 90 },
  daily: [],
  medications: [],
  buckets: [],
  streak: { current: 3, longest: 5 },
  snoozeActionsLast7d: 1,
} as unknown as InsightSnapshot;

function okResponse(text: string): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
    text: async () => text,
  } as unknown as Response;
}

function errorResponse(status: number, body = ""): Response {
  return {
    ok: false,
    status,
    text: async () => body,
    json: async () => ({}),
  } as unknown as Response;
}

const validPayload = JSON.stringify({
  tone: "neutral",
  insights: [{ category: "consistency", summary: "Mostly on time.", suggestedActionType: null }],
});

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  process.env.AI_GEMINI_API_KEY = "test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.AI_GEMINI_API_KEY;
  delete process.env.AI_GEMINI_MODEL;
  vi.useRealTimers();
});

describe("resolveAiProvider", () => {
  it("returns null without a key so the service uses the fallback engine", () => {
    delete process.env.AI_GEMINI_API_KEY;
    expect(resolveAiProvider()).toBeNull();
  });

  it("returns a gemini provider when a key is configured", () => {
    const provider = resolveAiProvider();
    expect(provider?.name).toBe("gemini");
    expect(provider?.available).toBe(true);
  });
});

describe("gemini request shape", () => {
  it("defaults to a model that is not retired for new API keys", async () => {
    fetchMock.mockResolvedValue(okResponse(validPayload));
    await resolveAiProvider()!.generate(snapshot);

    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toContain(`models/${AI_DEFAULT_MODEL}:generateContent`);
    expect(url).not.toMatch(/gemini-2\./);
  });

  it("honours an AI_GEMINI_MODEL override", async () => {
    process.env.AI_GEMINI_MODEL = "gemini-3.6-flash";
    fetchMock.mockResolvedValue(okResponse(validPayload));
    await resolveAiProvider()!.generate(snapshot);

    expect(fetchMock.mock.calls[0]![0]).toContain("models/gemini-3.6-flash:generateContent");
  });

  it("disables thinking and leaves room for a JSON answer", async () => {
    fetchMock.mockResolvedValue(okResponse(validPayload));
    await resolveAiProvider()!.generate(snapshot);

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string) as {
      generationConfig: { maxOutputTokens: number; thinkingConfig?: { thinkingBudget: number } };
    };
    expect(body.generationConfig.thinkingConfig?.thinkingBudget).toBe(0);
    expect(body.generationConfig.maxOutputTokens).toBeGreaterThan(1024);
  });

  it("keeps the system prompt's no-diagnosis / no-prescribe boundary on the wire", async () => {
    fetchMock.mockResolvedValue(okResponse(validPayload));
    await resolveAiProvider()!.generate(snapshot);

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string) as {
      contents: { parts: { text: string }[] }[];
    };
    const text = body.contents[0]!.parts[0]!.text;
    expect(text).toMatch(/Do NOT diagnose/i);
    expect(text).toMatch(/changing any medication or dosage/i);
    expect(text).toContain(AI_SYSTEM_PROMPT);
  });

  it("parses a well-formed model reply", async () => {
    fetchMock.mockResolvedValue(okResponse(validPayload));
    await expect(resolveAiProvider()!.generate(snapshot)).resolves.toEqual(
      JSON.parse(validPayload),
    );
  });
});

describe("gemini failure handling", () => {
  it("retries a 503 and succeeds on the next attempt", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(errorResponse(503))
      .mockResolvedValueOnce(okResponse(validPayload));

    const pending = resolveAiProvider()!.generate(snapshot);
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toEqual(JSON.parse(validPayload));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after the retry budget is exhausted", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(errorResponse(503));

    // Attach the handler before advancing timers, or the rejection lands while nothing is
    // listening yet and vitest reports it as an unhandled error.
    const pending = expect(resolveAiProvider()!.generate(snapshot)).rejects.toThrow(/503/);
    await vi.runAllTimersAsync();
    await pending;
    // 1 initial attempt + 2 retries.
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry a non-retryable status such as a retired model", async () => {
    fetchMock.mockResolvedValue(errorResponse(404, "no longer available to new users"));

    await expect(resolveAiProvider()!.generate(snapshot)).rejects.toThrow(/404/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects when the model returns no text candidate", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: {} }] }),
      text: async () => "",
    } as unknown as Response);

    await expect(resolveAiProvider()!.generate(snapshot)).rejects.toThrow(/no text candidate/i);
  });
});

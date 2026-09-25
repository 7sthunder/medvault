import { afterEach, describe, expect, it, vi } from "vitest";

import { log, redact } from "@/lib/log";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("redact", () => {
  it("redacts sensitive keys recursively", () => {
    const value = redact({
      email: "person@example.com",
      password: "correct horse battery staple",
      nested: { accessToken: "token-value", safe: "ok" },
      list: [{ authorization: "Bearer token-value" }],
    });

    expect(value).toEqual({
      email: "[REDACTED]",
      password: "[REDACTED]",
      nested: { accessToken: "[REDACTED]", safe: "ok" },
      list: [{ authorization: "[REDACTED]" }],
    });
  });

  it("handles errors and circular objects without throwing", () => {
    const error = new Error("request failed for person@example.com");
    const circular: { self?: unknown; error: Error } = { error };
    circular.self = circular;

    expect(redact(circular)).toEqual({
      error: {
        name: "Error",
        message: "request failed for [REDACTED]",
        stack: expect.any(String),
      },
      self: "[Circular]",
    });
  });
});

describe("log", () => {
  it("writes structured JSON through the level-specific console method", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);

    log.debug("scheduler tick", { password: "hidden", durationMs: 12 });

    expect(debug).toHaveBeenCalledOnce();
    const entry = JSON.parse(debug.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(entry).toMatchObject({
      level: "debug",
      message: "scheduler tick",
      context: { password: "[REDACTED]", durationMs: 12 },
    });
    expect(typeof entry.timestamp).toBe("string");
  });
});

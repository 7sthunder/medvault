import { describe, expect, it } from "vitest";

import { hasOnboarded, safeNext } from "@/features/auth/flow";

describe("safeNext (plan §14 post-auth redirect)", () => {
  const opts = { onboardingCompleted: true };

  it("falls back to /dashboard when no next is present and onboarding is done", () => {
    expect(safeNext(null, opts)).toBe("/dashboard");
    expect(safeNext(undefined, { onboardingCompleted: false })).toBe("/onboarding");
  });

  it("preserves an in-app relative path", () => {
    expect(safeNext("/medications?tab=active", opts)).toBe("/medications?tab=active");
  });

  it("rejects absolute URLs and protocol-relative paths (open-redirect guard)", () => {
    expect(safeNext("https://evil.example", opts)).toBe("/dashboard");
    expect(safeNext("//evil.example", opts)).toBe("/dashboard");
    expect(safeNext("/\\evil.example", opts)).toBe("/dashboard");
  });

  it("never redirects back into the auth screens", () => {
    expect(safeNext("/login", opts)).toBe("/dashboard");
    expect(safeNext("/login?next=/dashboard", opts)).toBe("/dashboard");
    expect(safeNext("/register", { onboardingCompleted: false })).toBe("/onboarding");
  });
});

describe("hasOnboarded", () => {
  it("reads the onboarding_completed flag off a session user", () => {
    expect(hasOnboarded({ onboardingCompleted: true })).toBe(true);
    expect(hasOnboarded({ onboardingCompleted: false })).toBe(false);
    expect(hasOnboarded(undefined)).toBe(false);
    expect(hasOnboarded(null)).toBe(false);
  });
});

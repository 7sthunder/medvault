/**
 * Phase 06 — post-auth redirect resolution (plan §14). Only same-origin
 * relative paths are honoured as `next`; anything else falls back to the
 * onboarding/dashboard split based on the user's completed state.
 */
export function safeNext(
  next: string | null | undefined,
  opts: { onboardingCompleted: boolean; role?: "patient" | "caregiver" },
): string {
  const fallback =
    opts.role === "caregiver"
      ? "/caregiver"
      : opts.onboardingCompleted
        ? "/dashboard"
        : "/onboarding";
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  if (
    next === "/login" ||
    next.startsWith("/login?") ||
    next === "/register" ||
    next.startsWith("/register?")
  ) {
    return fallback;
  }
  return next;
}

/**
 * Reads the DB-owned `role` field off a session user, defaulting to 'patient'.
 */
export function getUserRole(user: Record<string, unknown> | null | undefined): "patient" | "caregiver" {
  return (user?.role as "patient" | "caregiver") || "patient";
}

/**
 * Reads the DB-owned `onboarding_completed` profile flag off a session user.
 * Better Auth's client type can't express additionalFields, so the check is a
 * guarded property read rather than a typed field.
 */
export function hasOnboarded(user: Record<string, unknown> | null | undefined): boolean {
  return user?.onboardingCompleted === true;
}
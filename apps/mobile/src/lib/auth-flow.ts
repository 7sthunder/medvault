import type { Theme } from "@shared/enums";

/**
 * Port of the web `features/auth/auth-error.ts`.
 *
 * Kept byte-identical in behaviour so a user who hits an error on the phone sees the
 * same sentence they would on the web. Codes are matched case-insensitively because the
 * Better Auth SDK returns both snake_case and SCREAMING forms across versions.
 */
export function authErrorMessage(code: string | null | undefined): string {
  const key = (code ?? "").toLowerCase();
  switch (key) {
    case "invalid_email_or_password":
    case "invalid_password":
    case "invalid_credentials":
      return "That email or password is incorrect. Try again.";
    case "user_already_exists":
    case "user_exists":
      return "An account with this email already exists. Try logging in instead.";
    case "password_too_short":
    case "weak_password":
      return "Password must be at least 8 characters with a letter and a number.";
    case "missing_email_or_password":
      return "Enter your email and password.";
    case "invalid_email":
      return "Enter a valid email address.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/**
 * Post-auth destination.
 *
 * Expo Router paths are absolute and typed, so the web version's "honour `next` only if
 * it is a same-origin relative path" logic becomes "is this a route in this app?". A deep
 * link (`meditrack://medications/123`) is honoured; anything unrecognised falls back to
 * the onboarding/dashboard split.
 */
export function safeNext(
  next: string | null | undefined,
  opts: { onboardingCompleted: boolean },
): string {
  const fallback = opts.onboardingCompleted ? "/(tabs)" : "/onboarding";
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
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

/** Reads the DB-owned `onboarding_completed` flag off a session user. */
export function hasOnboarded(user: Record<string, unknown> | null | undefined): boolean {
  return user?.onboardingCompleted === true;
}

/** Device-local appearance fallback used before the server preference has loaded. */
export function systemThemeToPreference(scheme: "light" | "dark" | null | undefined): Theme {
  return scheme === "dark" ? "dark" : "light";
}

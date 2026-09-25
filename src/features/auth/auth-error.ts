/**
 * Phase 06 — maps Better Auth error codes to §5 Alert copy. Codes are matched
 * case-insensitively because the SDK returns both snake_case and SCREAMING forms
 * across versions.
 */
export function authErrorMessage(
  code: string | null | undefined,
  message?: string | null | undefined,
): string {
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
    case "email_not_verified":
      return "Please verify your email address before logging in.";
    case "too_many_requests":
    case "rate_limit_exceeded":
      return "Too many attempts. Please wait a moment and try again.";
    case "user_not_found":
      return "No account found with this email. Please check or sign up.";
    default:
      if (message && typeof message === "string" && message.trim().length > 0) {
        return message;
      }
      return "Something went wrong. Please try again.";
  }
}
/**
 * Phase 06 — maps Better Auth error codes to §5 Alert copy. Codes are matched
 * case-insensitively because the SDK returns both snake_case and SCREAMING forms
 * across versions.
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
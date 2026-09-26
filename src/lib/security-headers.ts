export type SecurityEnvironment = "development" | "production";

export interface SecurityHeader {
  key: string;
  value: string;
}

function contentSecurityPolicy(environment: SecurityEnvironment): string {
  const connectSources = environment === "development" ? "'self' ws: wss:" : "'self'";
  const scriptSources =
    environment === "development"
      ? "'self' 'unsafe-inline' 'unsafe-eval'"
      : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function buildSecurityHeaders(
  environment: SecurityEnvironment = process.env.NODE_ENV === "production"
    ? "production"
    : "development",
): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(environment) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Microphone is deliberately NOT disabled here. The voice assistant records medication
    // details, so it needs mic access, and `microphone=()` makes every getUserMedia call fail
    // with NotAllowedError in every browser regardless of the user's own site setting. The
    // allowlist form (`microphone=(self)`) keeps the feature off third-party frames, which is
    // the actual threat this header exists to stop.
    { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  ];

  if (environment === "production") {
    headers.push(
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      { key: "Upgrade-Insecure-Requests", value: "1" },
    );
  }

  return headers;
}

export const createSecurityHeaders = buildSecurityHeaders;

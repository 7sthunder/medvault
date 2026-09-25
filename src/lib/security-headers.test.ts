import { describe, expect, it } from "vitest";

import { buildSecurityHeaders } from "@/lib/security-headers";

function headerValue(
  headers: readonly { key: string; value: string }[],
  key: string,
): string | undefined {
  return headers.find((header) => header.key === key)?.value;
}

describe("buildSecurityHeaders", () => {
  it("sets the baseline browser security headers", () => {
    const headers = buildSecurityHeaders("production");
    const csp = headerValue(headers, "Content-Security-Policy");

    expect(headerValue(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue(headers, "X-Frame-Options")).toBe("DENY");
    expect(headerValue(headers, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headerValue(headers, "Permissions-Policy")).toContain("camera=()");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it("adds HSTS only in production", () => {
    expect(
      headerValue(buildSecurityHeaders("development"), "Strict-Transport-Security"),
    ).toBeUndefined();
    expect(headerValue(buildSecurityHeaders("production"), "Strict-Transport-Security")).toContain(
      "max-age=",
    );
  });

  it("allows the development server websocket and eval sources", () => {
    const developmentCsp = headerValue(
      buildSecurityHeaders("development"),
      "Content-Security-Policy",
    );
    const productionCsp = headerValue(
      buildSecurityHeaders("production"),
      "Content-Security-Policy",
    );

    expect(developmentCsp).toContain("ws:");
    expect(developmentCsp).toContain("'unsafe-eval'");
    expect(productionCsp).not.toContain("'unsafe-eval'");
  });
});

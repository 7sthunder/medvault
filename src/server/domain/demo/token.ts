import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Phase 18 — demo session token (plan §10.8).
 *
 * `/demo` is reachable while signed out, so it cannot rely on the Better Auth session. Instead a
 * short-lived HMAC-signed cookie (`meditrackai_demo_session`) carries the demo user id.
 *
 * Two properties matter, and neither is about secrecy of the demo data (which is public sample
 * data by design):
 *
 *  1. **A forged cookie must not work.** Without the server secret the signature cannot be
 *     produced, so `verify` fails closed and the viewer falls back to the real session.
 *  2. **A cookie must never widen access.** The id inside the token is only ever *looked up*;
 *     every demo query is still scoped to the demo user's own rows, so a valid token can at
 *     worst re-enter the demo workspace, never reach a real account.
 */

export const DEMO_COOKIE = "meditrackai_demo_session";

/** Demo sessions are short-lived by design; a stale link should not keep a shared machine in demo mode. */
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

interface DemoTokenPayload {
  userId: string;
  issuedAt: number;
}

function secret(): string {
  // A stable per-deployment value. Falls back to a fixed dev string so local/demo builds work
  // without extra env setup; production should always set BETTER_AUTH_SECRET (or this).
  return process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? "meditrackai-demo-dev-secret";
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function encode(payload: DemoTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Mint a token for the demo user. */
export function issueDemoToken(userId: string, issuedAt: number = Date.now()): string {
  return encode({ userId, issuedAt });
}

/** Verify + decode. Returns `null` for anything malformed, forged or expired. */
export function verifyDemoToken(
  token: string | undefined | null,
  now: number = Date.now(),
): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(body);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: DemoTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as DemoTokenPayload;
  } catch {
    return null;
  }

  if (typeof payload.userId !== "string" || payload.userId.length === 0) return null;
  if (typeof payload.issuedAt !== "number") return null;
  if (now - payload.issuedAt > TOKEN_TTL_MS) return null;
  return payload.userId;
}

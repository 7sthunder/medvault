import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/server/auth/server";

/**
 * Phase 06 — Better Auth API surface under `/api/auth/*` (plan §14).
 *
 * Adds one thing on top of the stock handler: the Expo app (apps/mobile) has no browser
 * `Origin` to send, because React Native's `fetch` does not invent one. It sends
 * `expo-origin: meditrack://` instead, and Better Auth's origin check rejects any
 * cookie-bearing request whose `Origin` is missing or untrusted — which would mean every
 * mobile sign-in failing with `MISSING_OR_NULL_ORIGIN` for no visible reason.
 *
 * So the header is promoted to a real `Origin` here, at the single edge where requests
 * enter. `meditrack://` is listed in `trustedOrigins` on the server, which keeps the check
 * meaningful: only the app's own scheme is accepted, and a browser page cannot forge it
 * (a custom scheme is not a valid HTTP origin).
 */
const handler = toNextJsHandler(auth);

function promoteExpoOrigin(request: Request): Request {
  // An existing `Origin` always wins — never let a client override what the browser said.
  if (request.headers.has("origin")) return request;
  const expoOrigin = request.headers.get("expo-origin");
  if (!expoOrigin) return request;

  const headers = new Headers(request.headers);
  headers.set("origin", expoOrigin);
  return new Request(request, { headers });
}

export async function GET(request: Request) {
  return handler.GET(promoteExpoOrigin(request));
}

export async function POST(request: Request) {
  return handler.POST(promoteExpoOrigin(request));
}

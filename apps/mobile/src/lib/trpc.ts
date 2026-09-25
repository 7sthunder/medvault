import { createTRPCReact } from "@trpc/react-query";

import { EXPO_ORIGIN } from "@shared/expo";
import type { AppRouter } from "@server/trpc/root";

import { getSessionCookieHeader } from "@/lib/auth";
import { TRPC_URL } from "@/lib/config";

/**
 * tRPC client for the Expo app.
 *
 * The `AppRouter` type is imported straight from the server, so a procedure rename or a
 * DTO change breaks this app at compile time instead of at runtime. It is a type-only
 * import, so none of the server code is bundled.
 */
export const api = createTRPCReact<AppRouter>();

export type { AppRouter };
export { TRPC_URL };

/**
 * `httpBatchLink` with the session attached.
 *
 * Two headers matter here:
 *  - `Cookie` — React Native's fetch has no cookie jar, so without this every protected
 *    procedure resolves an anonymous user;
 *  - `expo-origin` — the marker the server's Better Auth `expo()` plugin rewrites into
 *    `Origin`, so origin/CSRF checks pass for a request that has no browser origin.
 */
export function trpcHeaders(): Promise<Record<string, string>> {
  return getSessionCookieHeader().then((cookie) => ({
    ...(cookie ? { cookie } : {}),
    "expo-origin": EXPO_ORIGIN,
  }));
}

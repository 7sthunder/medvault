import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { EXPO_SCHEME } from "@shared/expo";

import { AUTH_URL } from "@/lib/config";

/**
 * Better Auth client for the Expo app — the SAME server instance the web app uses
 * (`src/server/auth/server.ts`), just spoken to over an absolute URL.
 *
 * `expoClient` is what makes auth work outside a browser:
 *  - it keeps the session cookie in SecureStore instead of a browser cookie jar, so the
 *    session survives an app restart;
 *  - it replays that cookie as a `Cookie` header on every request and captures `Set-Cookie`
 *    off the response (React Native's fetch has no cookie jar of its own);
 *  - it sends `expo-origin`, which the server's `expo()` plugin needs to accept requests
 *    that carry no `Origin` header.
 *
 * Session is still verified server-side on every protected procedure — the cached copy
 * here is only so the UI can avoid a spinner on cold start.
 */
export const authClient = createAuthClient({
  baseURL: AUTH_URL,
  plugins: [
    expoClient({
      scheme: EXPO_SCHEME,
      storage: SecureStore,
      // Must match the server's `cookiePrefix` (Better Auth's default), or the plugin will
      // not recognise the `Set-Cookie` it receives and will never persist a session.
      storagePrefix: "meditrack",
    }),
  ],
});

/** SecureStore keys the expo plugin writes, per its `${storagePrefix}` convention. */
const COOKIE_KEY = "meditrack_cookie";
const SESSION_CACHE_KEY = "meditrack_session_data";

/**
 * The current session cookie as a `Cookie` header value, or `""` when signed out.
 *
 * tRPC requests need this explicitly: unlike the browser, React Native's `fetch` keeps no
 * cookie jar, so the session is invisible to the server unless we attach it by hand. The
 * expo plugin injects it for its *own* calls; this covers every other request.
 *
 * Delegates to the plugin's own `getCookie()` rather than reading SecureStore directly.
 * That matters for two reasons: the plugin splits large values across chunked keys (1800
 * bytes each) and reassembles them on read, and it drops expired entries. Parsing the raw
 * key here would silently send a truncated `Cookie` header for a big session payload —
 * which surfaces as a random sign-out rather than as an obvious error.
 */
export async function getSessionCookieHeader(): Promise<string> {
  try {
    return (await authClient.getCookie()) ?? "";
  } catch {
    // SecureStore is unavailable (web preview) or the value is corrupt — treat as signed
    // out rather than crashing a render.
    return "";
  }
}

/**
 * Wipe every trace of the session from the device.
 *
 * `signOut()` alone is not enough: the expo plugin's cookie write is best-effort, so a
 * network failure mid-sign-out leaves the cookie behind and the next person to open the app
 * lands in the previous account. Sign-out calls this afterwards.
 */
export async function clearStoredSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(COOKIE_KEY).catch(() => undefined),
    SecureStore.deleteItemAsync(SESSION_CACHE_KEY).catch(() => undefined),
  ]);
}

/**
 * Where the Expo client points.
 *
 * The mobile app is a *client* of the Next.js server, not a replacement for it, so it
 * needs an absolute origin — the web app's relative `/api/trpc` cannot resolve from a
 * device. `EXPO_PUBLIC_API_URL` is inlined by Metro at bundle time.
 *
 * Gotcha worth knowing before testing on a real phone: `localhost` on a handset is the
 * *handset*. A physical device needs your machine's LAN address, and that same address
 * has to be in the server's `BETTER_AUTH_URL` or Better Auth rejects the session cookie
 * as cross-origin. An Android emulator reaches the host at `10.0.2.2`.
 */

import { Platform } from "react-native";

const DEFAULT_PORT = 3000;

/** `http://192.168.1.20:3000` → origin only, no trailing slash, no `/api`. */
function normalize(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Android emulators alias the host loopback; iOS simulators answer to localhost. */
function emulatorAware(host: string, port: number): string {
  if (Platform.OS !== "android") return host;
  if (host === "localhost" || host === "127.0.0.1") return `10.0.2.2:${port}`;
  return host;
}

function fromEnv(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (raw) return normalize(raw);

  // No env var: fall back to the dev-server host, which is what Expo Go already has open.
  // Metro's host is the machine the packager runs on, so this also works on a real device
  // on the same LAN once `EXPO_PUBLIC_API_URL` is set — this is only the convenience path.
  const host = process.env.EXPO_PUBLIC_API_HOST?.trim() || "localhost";
  return normalize(`http://${emulatorAware(host, DEFAULT_PORT)}`);
}

/** Base origin for every request, e.g. `http://192.168.1.20:3000`. */
export const API_URL = fromEnv();

/** Full tRPC endpoint. */
export const TRPC_URL = `${API_URL}/api/trpc`;

/** Better Auth's base URL — identical to the API origin, by design. */
export const AUTH_URL = API_URL;

/** True when pointing at a local machine rather than a deployed environment. */
export const IS_LOCAL_API = /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:|\/|$)/.test(API_URL);

/**
 * Android emulators cannot see the host's `localhost`. Callers that build a URL from a
 * user-typed host should route it through here so emulator testing "just works".
 */
export function resolveHostForPlatform(host: string, platform: "ios" | "android" | "web"): string {
  if (platform !== "android") return host;
  if (host === "localhost" || host === "127.0.0.1") return "10.0.2.2";
  return host;
}

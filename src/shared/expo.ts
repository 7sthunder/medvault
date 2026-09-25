/**
 * Constants shared by the Expo app and the server that authenticates it.
 *
 * These live in `shared/` because both sides must agree exactly: the client sends
 * `expo-origin: meditrack://` on every request and the server's Better Auth `expo()` plugin
 * validates that header against this same origin. Duplicating the string on either side
 * produces a confusing origin rejection with no useful error message.
 *
 * Kept dependency-free so `shared/` stays safe to import from any client.
 */

/** Custom URL scheme declared in `apps/mobile/app.json`; opens the app via `meditrack://`. */
export const EXPO_ORIGIN = "meditrack://";

/** Deep-link prefix, e.g. `meditrack://medications/123`. */
export const EXPO_SCHEME = "meditrack";

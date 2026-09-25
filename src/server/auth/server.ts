import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { BRAND } from "@shared/brand";
import { EXPO_ORIGIN } from "@shared/expo";

try {
  process.loadEnvFile();
} catch {
  /* no .env — env must already be present */
}

/**
 * Origins allowed to call the auth endpoints.
 *
 * The web origin plus the Expo app's custom scheme. The scheme is needed because the Expo
 * client has no browser `Origin` to send — it sends `expo-origin: meditrack://` instead,
 * and the auth route rewrites that into a real `Origin`
 * (`app/api/auth/[...all]/route.ts`). Better Auth rejects any cookie-bearing request whose
 * origin is not trusted, which is a genuine protection on the web, so it stays enabled.
 */
const trustedOrigins: string[] = [process.env.BETTER_AUTH_URL, EXPO_ORIGIN].filter(
  (origin): origin is string => !!origin,
);

/**
 * Phase 06 — Better Auth server instance (plan §14). Email/password over the
 * Drizzle adapter. Session cookies: sameSite lax (default), secure in prod.
 * `timezone`/`onboardingCompleted`/`isDemo` are DB-owned profile columns exposed
 * on the session user (read-only from the client side).
 *
 * Shared by the web app and the Expo app (apps/mobile) — the mobile client is a consumer
 * of this same server, not a separate auth system.
 */
export const auth = betterAuth({
  appName: BRAND.name,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [...trustedOrigins],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      timezone: {
        type: "string",
        required: false,
        defaultValue: "UTC",
        input: false,
      },
      onboardingCompleted: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      isDemo: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});

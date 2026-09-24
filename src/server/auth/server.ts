import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";

try {
  process.loadEnvFile();
} catch {
  /* no .env — env must already be present */
}

/**
 * Phase 06 — Better Auth server instance (plan §14). Email/password over the
 * Drizzle adapter. Session cookies: sameSite lax (default), secure in prod.
 * `timezone`/`onboardingCompleted`/`isDemo` are DB-owned profile columns exposed
 * on the session user (read-only from the client side).
 */
export const auth = betterAuth({
  appName: "MedVault",
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
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
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
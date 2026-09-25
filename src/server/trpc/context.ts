import type { inferAsyncReturnType } from "@trpc/server";
import { headers } from "next/headers";

import { auth } from "@/server/auth/server";
import { db } from "@/server/db/client";

import { getDemoState, getDemoUser, DEMO_COOKIE_NAME } from "@/server/domain/demo/service";
import { resetNowImpl, setNowImpl } from "@/shared/times";

/**
 * Phase 06/25 — tRPC context (plan §14, §10.8): resolves the Better Auth session from
 * request headers so every procedure sees `{ user, session, db }`.
 * When the demo session cookie or /demo referer is present, binds automatically to
 * the isolated Arun Kumar demo user and threads demoNow.
 */
export async function createContext() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  const cookieHeader = reqHeaders.get("cookie") ?? "";
  const refererHeader = reqHeaders.get("referer") ?? "";
  const isDemoRequest =
    cookieHeader.includes(`${DEMO_COOKIE_NAME}=1`) ||
    cookieHeader.includes(`${DEMO_COOKIE_NAME}=true`) ||
    refererHeader.includes("/demo");

  if (isDemoRequest) {
    try {
      const demoUser = await getDemoUser(db);
      const demoState = await getDemoState(db, demoUser.id);
      if (demoState.simulationNow) {
        setNowImpl(() => new Date(demoState.simulationNow!));
      } else {
        resetNowImpl();
      }

      return {
        db,
        user: {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          timezone: demoUser.timezone,
          onboardingCompleted: demoUser.onboardingCompleted,
          isDemo: true,
          emailVerified: true,
          createdAt: demoUser.createdAt,
          updatedAt: demoUser.updatedAt,
          image: null,
        },
        session: {
          id: "demo-session",
          userId: demoUser.id,
          token: "demo-session-token",
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    } catch {
      // Fallback to normal session context if demo user fails to resolve
    }
  }

  resetNowImpl();
  return {
    db,
    user: session?.user ?? null,
    session: session?.session ?? null,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
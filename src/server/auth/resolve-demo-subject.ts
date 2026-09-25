import { cookies, headers } from "next/headers";

import { auth } from "@/server/auth/server";
import { db } from "@/server/db/client";
import { ensureDemoUser, resolveSimulationNow } from "@/server/domain/demo/service";
import { DEMO_COOKIE, verifyDemoToken } from "@/server/domain/demo/token";
import { resetNowImpl, setNowImpl } from "@/shared/times";
import type { ShellUser } from "@/components/layout/shell-context";

/**
 * Phase 18 — subject resolution for the `/demo` route (plan §10.8).
 *
 * `/demo` serves the real signed-in experience to a signed-out visitor, so it cannot use
 * `requireUser`. This resolves the subject the same way the tRPC context does and — importantly —
 * installs the same `now()` override, so server-rendered and client-fetched data agree about what
 * "today" means.
 *
 * A real session always wins, so signing in while browsing the demo drops you into your own
 * account rather than silently continuing as the demo user.
 */
export interface ResolvedSubject {
  user: ShellUser;
  isDemo: boolean;
}

export async function resolveDemoSubject(): Promise<ResolvedSubject | null> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    resetNowImpl();
    return {
      isDemo: false,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email ?? "",
        image: session.user.image ?? null,
        timezone: session.user.timezone ?? "UTC",
        onboardingCompleted: session.user.onboardingCompleted ?? false,
      },
    };
  }

  const store = await cookies();
  const demoUserId = verifyDemoToken(store.get(DEMO_COOKIE)?.value);
  if (!demoUserId) return null;

  const demo = await ensureDemoUser(db).catch(() => null);
  if (!demo || demo.id !== demoUserId) return null;

  const simulationNow = await resolveSimulationNow(db, demo.id).catch(() => null);
  if (simulationNow) setNowImpl(() => simulationNow);
  else resetNowImpl();

  return {
    isDemo: true,
    user: {
      id: demo.id,
      name: demo.name,
      email: demo.email,
      image: demo.image,
      timezone: demo.timezone,
      onboardingCompleted: demo.onboardingCompleted,
    },
  };
}

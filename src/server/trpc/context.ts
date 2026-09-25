import type { inferAsyncReturnType } from "@trpc/server";
import { cookies, headers } from "next/headers";

import { auth } from "@/server/auth/server";
import { db } from "@/server/db/client";
import { ensureDemoUser, resolveSimulationNow } from "@/server/domain/demo/service";
import { DEMO_COOKIE, verifyDemoToken } from "@/server/domain/demo/token";
import { resetNowImpl, setNowImpl } from "@/shared/times";

/**
 * Phase 06 — tRPC context (plan §14): resolves the Better Auth session from
 * request headers so every procedure sees `{ user, session, db }`.
 *
 * Phase 18 (plan §10.8) adds demo mode. `/demo` is reachable while signed out, so the context
 * also resolves a *demo subject* from the signed `medvault_demo_session` cookie. When one is
 * present and that browser is not authenticated, every procedure runs as the demo user and the
 * shared clock is overridden with `demo_state.simulationNow`, which is what makes the schedule,
 * dashboard and adherence views respond live to the demo clock.
 *
 * Two guarantees hold by construction:
 *  - a real session always wins over the demo cookie, so signing in mid-demo is safe;
 *  - the demo user id is only ever *looked up* from the well-known demo email, never read out
 *    of the cookie payload into a query, so a forged token cannot reach another account.
 */
export async function createContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  const cookieStore = await cookies();
  const demoUserId = verifyDemoToken(cookieStore.get(DEMO_COOKIE)?.value);

  if (session?.user) {
    // Real session: make sure a lingering demo clock from an earlier demo visit can't leak in.
    resetNowImpl();
    return { db, user: session.user, session: session.session, demo: null };
  }

  if (demoUserId) {
    const demo = await ensureDemoUser(db).catch(() => null);
    if (demo && demo.id === demoUserId) {
      const simulationNow = await resolveSimulationNow(db, demo.id).catch(() => null);
      if (simulationNow) setNowImpl(() => simulationNow);
      else resetNowImpl();
      return { db, user: demo, session: null, demo: { userId: demo.id } };
    }
  }

  resetNowImpl();
  return { db, user: null, session: null, demo: null };
}

export type Context = inferAsyncReturnType<typeof createContext>;

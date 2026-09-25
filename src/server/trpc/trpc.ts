import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Phase 06 — requires a valid Better Auth session (plan §14). Unauthenticated
 * calls fail with UNAUTHORIZED; UI visibility is never the enforcement point.
 *
 * This is the *strict* gate: a demo subject is never enough. Use it for the handful of
 * procedures that must never run inside the demo sandbox (`caregiver.invite`,
 * `caregiver.accept`, `settings.deleteAccount`) because they reach outside the demo
 * user's own rows.
 */
export const sessionProcedure = t.procedure.use((opts) => {
  if (!opts.ctx.user || !opts.ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." });
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      user: opts.ctx.user,
      session: opts.ctx.session,
    },
  });
});

/**
 * Phase 18 (plan §10.8) — allows a real session *or* a validated demo subject.
 *
 * `/demo/workspace` re-uses the exact same feature components and tRPC procedures as the
 * signed-in app, so the usual "session required" gate is too strict there: without this the
 * whole demo workspace renders UNAUTHORIZED for a signed-out visitor.
 *
 * This widens *authentication*, never *authorization*. The demo branch is only reachable when
 * the context has already verified the signed httpOnly cookie **and** resolved the well-known
 * demo user id from the database, so every handler still scopes its reads and writes to
 * `ctx.user.id` — the sandbox account. A real session always wins over the demo cookie
 * (see `context.ts`), and endpoints that can escape the sandbox use `sessionProcedure`.
 */
export const protectedProcedure = t.procedure.use((opts) => {
  const { user, session, demo } = opts.ctx;
  if (session && user) {
    return opts.next({ ctx: { ...opts.ctx, user, session, demo: null } });
  }
  if (demo && user) {
    return opts.next({ ctx: { ...opts.ctx, user, session: null, demo } });
  }
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in or open the demo to continue." });
});

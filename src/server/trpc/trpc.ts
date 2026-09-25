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
 */
export const protectedProcedure = t.procedure.use((opts) => {
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
 * `/demo` has to serve the whole signed-in experience to a signed-out visitor, so the usual
 * "session required" gate is too strict there. The demo branch is only reachable when the tRPC
 * context has already verified the signed cookie and resolved the demo user, so this widens
 * *authentication*, never *authorization*: every demo handler resolves its own subject from the
 * well-known demo user, and any read/write stays scoped to that user's rows.
 */
export const demoProcedure = t.procedure.use((opts) => {
  const { user, session, demo } = opts.ctx;
  if (session && user) {
    return opts.next({ ctx: { ...opts.ctx, user, session, demo: null } });
  }
  if (demo && user) {
    return opts.next({ ctx: { ...opts.ctx, user, session: null, demo } });
  }
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in or open the demo to continue." });
});
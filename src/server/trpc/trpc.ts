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
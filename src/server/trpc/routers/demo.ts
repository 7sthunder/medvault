import { TRPCError } from "@trpc/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { DEMO_COOKIE, issueDemoToken } from "@/server/domain/demo/token";
import { DemoError, demoService, ensureDemoUser, readState, resolveSimulationNow } from "@/server/domain/demo/service";
import {
  demoActionSchema,
  demoScenarioSchema,
  demoTimeSchema,
} from "@/shared/validations/settings";
import { publicProcedure, router } from "../trpc";

/**
 * Phase 18 — demo router (plan §10.8).
 *
 * Every procedure is `publicProcedure` on purpose: the *router* never decides who you are. It
 * delegates to the demo service, which resolves the demo user server-side from the well-known
 * demo email. So the worst a caller can do is poke the shared demo workspace — the same thing any
 * signed-out visitor can already do by loading `/demo`.
 *
 * `enter` is the only place a cookie is written, and `leave` the only place it is cleared, which
 * keeps "real session is untouched" easy to audit.
 */

/** 12h matches the token TTL so the cookie can outlive a long demo session but not a shared machine. */
const COOKIE_MAX_AGE_SECONDS = 12 * 60 * 60;

const cookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE_SECONDS,
};

export const demoRouter = router({
  /**
   * Enter the demo workspace: seed it if needed and issue the scoped cookie. Idempotent — calling
   * it again simply refreshes the cookie.
   */
  enter: publicProcedure.mutation(async ({ ctx }) => {
    const demo = await ensureDemoUser(ctx.db);
    const store = await cookies();
    store.set(DEMO_COOKIE, issueDemoToken(demo.id), cookieOptions);
    return { userId: demo.id, name: demo.name };
  }),

  /** Leave the demo workspace: clear the cookie. The demo data itself is left for the next visit. */
  leave: publicProcedure.mutation(async () => {
    const store = await cookies();
    store.set(DEMO_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return { left: true };
  }),

  /** Dock + clock payload. Readable signed-out so the `/demo` landing page can render the teaser. */
  state: publicProcedure.query(async ({ ctx }) => {
    const demo = await ensureDemoUser(ctx.db);
    return readState(ctx.db, demo.id);
  }),

  /** The effective simulated instant, or `null` when the demo clock is off. */
  simulationNow: publicProcedure.query(async ({ ctx }) => {
    const demo = await ensureDemoUser(ctx.db);
    return { simulationNow: await resolveSimulationNow(ctx.db, demo.id) };
  }),

  /** §10.8 `simulate.action` — take / miss / skip / snooze the next due (or a named) dose. */
  simulateAction: publicProcedure.input(demoActionSchema).mutation(async ({ ctx, input }) => {
    try {
      return await demoService.simulateAction(ctx.db, input);
    } catch (error) {
      throw mapDemoError(error);
    }
  }),

  /** §10.8 `generate.adherenceChange` — reshape the last 14 days. */
  applyScenario: publicProcedure.input(demoScenarioSchema).mutation(async ({ ctx, input }) => {
    try {
      return await demoService.applyScenario(ctx.db, input.scenario);
    } catch (error) {
      throw mapDemoError(error);
    }
  }),

  /** §10.8 `generate.caregiverAlert` — link the demo caregiver and raise a real alert. */
  generateCaregiverAlert: publicProcedure.mutation(async ({ ctx }) => {
    try {
      return await demoService.generateCaregiverAlert(ctx.db);
    } catch (error) {
      throw mapDemoError(error);
    }
  }),

  /** §10.8 `generate.aiInsight` — run the real insights pipeline over demo data. */
  generateInsight: publicProcedure.mutation(async ({ ctx }) => {
    try {
      return await demoService.generateInsight(ctx.db);
    } catch (error) {
      throw mapDemoError(error);
    }
  }),

  /**
   * §10.8 `setTime` — pin the simulated clock, or release it back to real time by passing
   * `simulationNow: null`.
   */
  setTime: publicProcedure
    .input(z.union([demoTimeSchema, z.object({ simulationNow: z.null() })]))
    .mutation(async ({ ctx, input }) => {
        try {
        return await demoService.setTime(ctx.db, input.simulationNow);
      } catch (error) {
        throw mapDemoError(error);
      }
    }),

  /** The dock's "+1 day" / "-1 day" affordance. */
  advanceDays: publicProcedure
    .input(z.object({ days: z.coerce.number().int().min(-365).max(365) }))
    .mutation(async ({ ctx, input }) => {
        try {
        return await demoService.advanceDays(ctx.db, input.days);
      } catch (error) {
        throw mapDemoError(error);
      }
    }),

  /** §10.8 `reset` — wipe and reseed the demo workspace. */
  reset: publicProcedure.mutation(async ({ ctx }) => {
    try {
      return await demoService.reset(ctx.db);
    } catch (error) {
      throw mapDemoError(error);
    }
  }),
});

function mapDemoError(error: unknown): TRPCError {
  if (error instanceof DemoError) {
    const code =
      error.kind === "not_found"
        ? "NOT_FOUND"
        : error.kind === "conflict"
          ? "CONFLICT"
          : error.kind === "forbidden"
            ? "FORBIDDEN"
            : "BAD_REQUEST";
    return new TRPCError({ code, message: error.message });
  }
  throw error;
}

import { eq } from "drizzle-orm";

import { users } from "@/server/db/schema";

import { protectedProcedure, publicProcedure, router } from "../trpc";

/**
 * Phase 06 — auth procedures (plan "Files: routers/auth.ts (me, whoami)").
 * `setOnboardingComplete` keeps the post-register redirect loop functional until
 * the real onboarding flow lands in a later phase.
 */
export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),
  whoami: protectedProcedure.query(({ ctx }) => ctx.user),
  setOnboardingComplete: protectedProcedure.mutation(async ({ ctx }) => {
    const [updated] = await ctx.db
      .update(users)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id))
      .returning({ id: users.id, onboardingCompleted: users.onboardingCompleted });
    return updated;
  }),
});

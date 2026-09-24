import { authRouter } from "./routers/auth";
import { router } from "./trpc";

/**
 * Phase 06 — root router. Routers are shelved per-plan and merged here as the
 * API surface grows (medications, doses, reports, …).
 */
export const appRouter = router({
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
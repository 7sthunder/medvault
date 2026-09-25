import { aadhiRouters } from "./routers/aadhi";
import { authRouter } from "./routers/auth";
import { balaRouters } from "./routers/bala";
import { hpRouters } from "./routers/hp";
import { router } from "./trpc";

/**
 * Phase 06 — root router.
 *
 * COLLISION RULE: root.ts is a frozen composition. Routers are added ONLY inside
 * the per-track records `routers/{aadhi,bala,hp}.ts` (each track owns its own
 * file and never edits the others or this file). The spread below joins them.
 */
export const appRouter = router({
  auth: authRouter,
  ...aadhiRouters,
  ...balaRouters,
  ...hpRouters,
});

export type AppRouter = typeof appRouter;

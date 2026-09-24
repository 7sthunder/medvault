/**
 * AADHI track — Phases 09–15 (core medication spine).
 *
 * This file is the ONLY place the aadhi track registers routers. When the three
 * tracks merge, `root.ts` spreads aadhi/bala/hp records, so routers composed here
 * auto-join the shared API surface without editing `root.ts`.
 *
 * Each value is a `router({ ... })` result (nested-router composition). Example:
 *   export const aadhiRouters = { schedule: scheduleRouter, dose: doseRouter };
 */
import { medicationRouter } from "./medication";

export const aadhiRouters = {
  medication: medicationRouter,
};
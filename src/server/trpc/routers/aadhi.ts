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
import { onboardingRouter } from "./onboarding";
import { adherenceRouter } from "./adherence";
import { scheduleRouter } from "./schedule";
import { doseRouter } from "./dose";
import { dashboardRouter } from "./dashboard";

export const aadhiRouters = {
  medication: medicationRouter,
  onboarding: onboardingRouter,
  adherence: adherenceRouter,
  schedule: scheduleRouter,
  dose: doseRouter,
  dashboard: dashboardRouter,
};
/**
 * BALA track — Phases 16–20, 24, 26 (insights & reporting).
 *
 * This file is the ONLY place the bala track registers routers. When the three
 * tracks merge, `root.ts` spreads aadhi/bala/hp records, so routers composed here
 * auto-join the shared API surface without editing `root.ts`.
 */
import { appointmentsRouter } from "./appointments";
import { reportsRouter } from "./reports";
import { settingsRouter } from "./settings";

export const balaRouters = {
  appointments: appointmentsRouter,
  reports: reportsRouter,
  settings: settingsRouter,
};
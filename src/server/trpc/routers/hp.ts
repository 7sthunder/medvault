/**
 * HP track — Phases 21–23, 25, 27–30 (ecosystem & delivery).
 *
 * This file is the ONLY place the hp track registers routers. When the three
 * tracks merge, `root.ts` spreads aadhi/bala/hp records, so routers composed here
 * auto-join the shared API surface without editing `root.ts`.
 */
import { caregiverRouter } from "./caregiver";
import { demoRouter } from "./demo";
import { insightsRouter } from "./insights";
import { notificationsRouter } from "./notifications";

export const hpRouters = {
  caregiver: caregiverRouter,
  demo: demoRouter,
  insights: insightsRouter,
  notifications: notificationsRouter,
};
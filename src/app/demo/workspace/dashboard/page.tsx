import type { Metadata } from "next";

import { DashboardPage } from "@/features/dashboard/DashboardPage";

export const metadata: Metadata = { title: "Dashboard" };

/** Phase 18 (§10.8) - the demo workspace renders the real screen; the layout above it has
 *  already resolved the demo subject, so no equireUser() gate applies here. */
export default function DemodashboardPage() {
  return <DashboardPage />;
}

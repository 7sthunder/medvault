import type { Metadata } from "next";

import { ReportsPage } from "@/features/reports/ReportsPage";

export const metadata: Metadata = { title: "Reports" };

/** Phase 18 (plan §10.8) — the demo workspace renders the real screen; the layout above it has
 *  already resolved the demo subject, so no `requireUser()` gate applies here. */
export default function DemoReportsPage() {
  return <ReportsPage />;
}

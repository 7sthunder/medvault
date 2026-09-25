import type { Metadata } from "next";

import { InsightsPage } from "@/features/insights/InsightsPage";

export const metadata: Metadata = { title: "AI Insights" };

/** Phase 18 (§10.8) - the demo workspace renders the real screen; the layout above it has
 *  already resolved the demo subject, so no equireUser() gate applies here. */
export default function DemoinsightsPage() {
  return <InsightsPage />;
}

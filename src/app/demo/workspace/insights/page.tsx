import type { Metadata } from "next";

import { InsightsPage } from "@/features/insights/InsightsPage";

export const metadata: Metadata = { title: "AI Insights" };

/** Phase 18 (plan §10.8) — the demo workspace renders the real screen; the layout above it has
 *  already resolved the demo subject, so no `requireUser()` gate applies here. */
export default function DemoInsightsPage() {
  return <InsightsPage />;
}

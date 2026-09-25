import type { Metadata } from "next";

import { SchedulePage } from "@/features/schedule/SchedulePage";

export const metadata: Metadata = { title: "Today's Schedule" };

/** Phase 18 (plan §10.8) — the demo workspace renders the real screen; the layout above it has
 *  already resolved the demo subject, so no `requireUser()` gate applies here. */
export default function DemoSchedulePage() {
  return <SchedulePage />;
}

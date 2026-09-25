import type { Metadata } from "next";

import { AdherencePage } from "@/features/adherence/AdherencePage";

export const metadata: Metadata = { title: "Adherence" };

/** Phase 18 (plan §10.8) — the demo workspace renders the real screen; the layout above it has
 *  already resolved the demo subject, so no `requireUser()` gate applies here. */
export default function DemoAdherencePage() {
  return <AdherencePage />;
}

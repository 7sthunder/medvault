import type { Metadata } from "next";

import { AdherencePage } from "@/features/adherence/AdherencePage";

export const metadata: Metadata = { title: "Adherence" };

/** Phase 18 (§10.8) - the demo workspace renders the real screen; the layout above it has
 *  already resolved the demo subject, so no equireUser() gate applies here. */
export default function DemoadherencePage() {
  return <AdherencePage />;
}

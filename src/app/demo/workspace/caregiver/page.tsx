import type { Metadata } from "next";

import { CaregiverOverview } from "@/features/caregiver/CaregiverOverview";

export const metadata: Metadata = { title: "Caregiver" };

/** Phase 18 (§10.8) - the demo workspace renders the real screen; the layout above it has
 *  already resolved the demo subject, so no equireUser() gate applies here. */
export default function DemocaregiverPage() {
  return <CaregiverOverview />;
}

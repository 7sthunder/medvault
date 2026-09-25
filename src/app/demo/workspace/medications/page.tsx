import type { Metadata } from "next";

import { MedicationsPage } from "@/features/medications/MedicationsPage";

export const metadata: Metadata = { title: "Medications" };

/** Phase 18 (§10.8) - the demo workspace renders the real screen; the layout above it has
 *  already resolved the demo subject, so no equireUser() gate applies here. */
export default function DemomedicationsPage() {
  return <MedicationsPage />;
}

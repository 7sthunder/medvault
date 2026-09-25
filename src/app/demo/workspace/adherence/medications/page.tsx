import type { Metadata } from "next";

import { MedicationAdherencePage } from "@/features/adherence/MedicationAdherencePage";

export const metadata: Metadata = { title: "Medication adherence" };

/** Phase 19 — the demo workspace's per-medication adherence table. */
export default function DemoMedicationAdherencePage() {
  return <MedicationAdherencePage />;
}

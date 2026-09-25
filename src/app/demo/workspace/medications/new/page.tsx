import type { Metadata } from "next";

import { MedicationWizard } from "@/features/medications/MedicationWizard";

export const metadata: Metadata = { title: "Add Medication" };

/**
 * Phase 19 — the demo workspace's add-medication screen. Without it the sidebar/bottom-nav "Add"
 * link and the dashboard quick action 404'd inside the demo.
 */
export default function DemoNewMedicationPage() {
  return <MedicationWizard mode="create" />;
}

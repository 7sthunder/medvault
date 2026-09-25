import type { Metadata } from "next";

import { MedicationWizard } from "@/features/medications/MedicationWizard";

export const metadata: Metadata = { title: "Edit Medication" };

/** Phase 19 — the demo workspace's edit-medication screen. */
export default async function DemoEditMedicationRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MedicationWizard mode="edit" medicationId={id} />;
}

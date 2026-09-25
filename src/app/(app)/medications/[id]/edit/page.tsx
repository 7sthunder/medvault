import type { Metadata } from "next";

import { MedicationWizard } from "@/features/medications/MedicationWizard";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Edit Medication" };

export default async function EditMedicationRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  return <MedicationWizard mode="edit" medicationId={id} />;
}
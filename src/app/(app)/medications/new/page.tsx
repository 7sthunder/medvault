import type { Metadata } from "next";

import { MedicationWizard } from "@/features/medications/MedicationWizard";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Add Medication" };

export default async function NewMedicationRoutePage() {
  await requireUser();

  return <MedicationWizard mode="create" />;
}
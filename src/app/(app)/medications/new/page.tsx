import type { Metadata } from "next";
import { MedicationForm } from "@/features/medications/MedicationForm";

export const metadata: Metadata = {
  title: "Add Medication · MedVault",
  description: "Create a new prescription or supplement and set its daily schedule.",
};

export default async function NewMedicationPage({
  searchParams,
}: {
  searchParams: Promise<{ patientUserId?: string; patientName?: string }>;
}) {
  const { patientUserId, patientName } = await searchParams;
  return <MedicationForm mode="new" patientUserId={patientUserId} patientName={patientName} />;
}

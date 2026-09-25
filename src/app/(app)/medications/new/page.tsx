import type { Metadata } from "next";
import { MedicationForm } from "@/features/medications/MedicationForm";

export const metadata: Metadata = {
  title: "Add Medication · MedVault",
  description: "Create a new prescription or supplement and set its daily schedule.",
};

export default function NewMedicationPage() {
  return <MedicationForm mode="new" />;
}

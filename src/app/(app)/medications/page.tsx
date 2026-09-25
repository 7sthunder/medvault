import type { Metadata } from "next";
import { MedicationListPage } from "@/features/medications/MedicationListPage";

export const metadata: Metadata = {
  title: "Medications · MedVault",
  description: "View and manage active and archived medications, doses, and schedules.",
};

export default function MedicationsPage() {
  return <MedicationListPage />;
}

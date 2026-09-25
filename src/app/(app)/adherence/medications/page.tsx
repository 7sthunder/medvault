import type { Metadata } from "next";
import { MedicationPerformanceTable } from "@/features/adherence/MedicationPerformanceTable";

export const metadata: Metadata = {
  title: "Medication Performance · MedVault",
  description: "View adherence rates, completion rates, and timing patterns per prescription.",
};

export default function AdherenceMedicationsPage() {
  return <MedicationPerformanceTable />;
}

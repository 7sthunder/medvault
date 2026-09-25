import type { Metadata } from "next";
import { MedicationDetailPage as DetailView } from "@/features/medications/MedicationDetailPage";

export const metadata: Metadata = {
  title: "Medication Details · MedVault",
  description: "View prescription schedule, active slots, and dose history.",
};

export default async function MedicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetailView id={id} />;
}

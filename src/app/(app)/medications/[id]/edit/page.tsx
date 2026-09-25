import type { Metadata } from "next";
import { MedicationEditPage as EditView } from "@/features/medications/MedicationEditPage";

export const metadata: Metadata = {
  title: "Edit Medication · MedVault",
  description: "Update prescription details, dosages, and schedule times.",
};

export default async function MedicationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditView id={id} />;
}

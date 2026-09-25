import type { Metadata } from "next";

import { MedicationAdherencePage } from "@/features/adherence/MedicationAdherencePage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Medication adherence" };

export default async function MedicationAdherenceRoute() {
  await requireUser();
  return <MedicationAdherencePage />;
}
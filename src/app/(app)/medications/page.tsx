import type { Metadata } from "next";

import { MedicationsPage } from "@/features/medications/MedicationsPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Medications" };

export default async function MedicationsRoutePage() {
  await requireUser();

  return <MedicationsPage />;
}

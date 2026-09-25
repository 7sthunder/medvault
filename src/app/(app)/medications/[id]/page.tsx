import type { Metadata } from "next";

import { MedicationDetailPage } from "@/features/medications/MedicationDetailPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Medication" };

export default async function MedicationDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  return <MedicationDetailPage medicationIdPromise={Promise.resolve(id)} />;
}

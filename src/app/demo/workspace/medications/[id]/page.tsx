import type { Metadata } from "next";

import { MedicationDetailPage } from "@/features/medications/MedicationDetailPage";

export const metadata: Metadata = { title: "Medication" };

/** Phase 19 — the demo workspace's per-medication detail screen. */
export default async function DemoMedicationDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MedicationDetailPage medicationIdPromise={Promise.resolve(id)} />;
}

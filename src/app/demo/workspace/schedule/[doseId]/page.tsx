import type { Metadata } from "next";

import { DoseDetailPage } from "@/features/dose/DoseDetailPage";

export const metadata: Metadata = { title: "Dose details" };

/** Phase 19 — the demo workspace's per-dose detail screen (reached from the schedule feed). */
export default async function DemoDoseDetailRoute({
  params,
}: {
  params: Promise<{ doseId: string }>;
}) {
  const { doseId } = await params;
  return <DoseDetailPage doseIdPromise={Promise.resolve(doseId)} />;
}

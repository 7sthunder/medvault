import type { Metadata } from "next";

import { AlertDetailPage } from "@/features/caregiver/AlertDetailPage";

export const metadata: Metadata = { title: "Caregiver alert" };

/** Phase 19 — the demo workspace's caregiver alert detail screen. */
export default async function DemoCaregiverAlertRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AlertDetailPage alertIdPromise={Promise.resolve(id)} />;
}

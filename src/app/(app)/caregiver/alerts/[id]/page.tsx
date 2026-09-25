import type { Metadata } from "next";

import { AlertDetailPage } from "@/features/caregiver/AlertDetailPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Caregiver alert" };

export default async function CaregiverAlertRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  return <AlertDetailPage alertIdPromise={Promise.resolve(id)} />;
}

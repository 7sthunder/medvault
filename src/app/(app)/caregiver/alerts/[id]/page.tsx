import type { Metadata } from "next";
import { AlertDetailPage } from "@/features/caregiver/AlertDetailPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = {
  title: "Caregiver Alert · MedVault",
  description: "View missed dose alert details, patient status, and resolution history.",
};

export default async function CaregiverAlertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  return <AlertDetailPage alertId={id} />;
}

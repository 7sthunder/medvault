import type { Metadata } from "next";
import { CaregiverPage as CaregiverView } from "@/features/caregiver/CaregiverPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = {
  title: "Caregiver Network · MedVault",
  description: "Manage caregivers, monitor loved ones' adherence, and respond to missed dose alerts.",
};

export default async function CaregiverPage() {
  await requireUser();

  return <CaregiverView />;
}

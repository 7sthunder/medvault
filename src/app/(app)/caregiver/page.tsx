import type { Metadata } from "next";

import { CaregiverOverview } from "@/features/caregiver/CaregiverOverview";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Caregiver" };

export default async function CaregiverRoutePage() {
  await requireUser();

  return <CaregiverOverview />;
}

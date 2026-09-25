import type { Metadata } from "next";

import { CaregiverSettings } from "@/features/settings/CaregiverSettings";

export const metadata: Metadata = { title: "Caregiver" };

export default function CaregiverSettingsPage() {
  return <CaregiverSettings />;
}

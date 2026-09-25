import type { Metadata } from "next";
import { CaregiverSettings } from "@/features/settings/CaregiverSettings";

export const metadata: Metadata = {
  title: "Caregiver Settings · MedVault",
  description: "Configure caregiver alerts, digests, and access sharing.",
};

export default function CaregiverSettingsPage() {
  return <CaregiverSettings />;
}

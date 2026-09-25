import type { Metadata } from "next";
import { ProfileForm } from "@/features/settings/ProfileForm";

export const metadata: Metadata = {
  title: "Profile Settings · MedVault",
  description: "Manage your personal profile, credentials, and local timezone.",
};

export default function ProfileSettingsPage() {
  return <ProfileForm />;
}

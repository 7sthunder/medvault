import type { Metadata } from "next";
import { AppearancePanel } from "@/features/settings/AppearancePanel";

export const metadata: Metadata = {
  title: "Appearance Settings · MedVault",
  description: "Customize theme, interface density, and motion preferences.",
};

export default function AppearanceSettingsPage() {
  return <AppearancePanel />;
}

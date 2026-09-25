import type { Metadata } from "next";

import { AppearancePanel } from "@/features/settings/AppearancePanel";

export const metadata: Metadata = { title: "Appearance" };

export default function AppearancePage() {
  return <AppearancePanel />;
}

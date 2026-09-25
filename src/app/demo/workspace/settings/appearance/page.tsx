import type { Metadata } from "next";

import { AppearancePanel } from "@/features/settings/AppearancePanel";

export const metadata: Metadata = { title: "Appearance" };

/** Phase 19 — the demo workspace's Settings › Appearance screen. */
export default function DemoSettingsAppearancePage() {
  return <AppearancePanel />;
}

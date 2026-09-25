import type { Metadata } from "next";

import { CaregiverSettings } from "@/features/settings/CaregiverSettings";

export const metadata: Metadata = { title: "Caregiver" };

/** Phase 19 — the demo workspace's Settings › Caregiver screen. */
export default function DemoSettingsCaregiverPage() {
  return <CaregiverSettings />;
}

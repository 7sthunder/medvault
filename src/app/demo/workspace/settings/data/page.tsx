import type { Metadata } from "next";

import { DataOverview } from "@/features/settings/DataOverview";

export const metadata: Metadata = { title: "Your data" };

/** Phase 19 — the demo workspace's Settings › Your data screen. */
export default function DemoSettingsDataPage() {
  return <DataOverview />;
}

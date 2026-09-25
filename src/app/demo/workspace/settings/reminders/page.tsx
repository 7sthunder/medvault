import type { Metadata } from "next";

import { ReminderSettings } from "@/features/settings/ReminderSettings";

export const metadata: Metadata = { title: "Reminders" };

/** Phase 19 — the demo workspace's Settings › Reminders screen. */
export default function DemoSettingsRemindersPage() {
  return <ReminderSettings />;
}

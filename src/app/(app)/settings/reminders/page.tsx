import type { Metadata } from "next";

import { ReminderSettings } from "@/features/settings/ReminderSettings";

export const metadata: Metadata = { title: "Reminders" };

export default function RemindersPage() {
  return <ReminderSettings />;
}

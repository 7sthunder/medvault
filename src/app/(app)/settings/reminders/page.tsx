import type { Metadata } from "next";
import { ReminderSettings } from "@/features/settings/ReminderSettings";

export const metadata: Metadata = {
  title: "Reminder Settings · MedVault",
  description: "Configure schedule windows, snooze durations, and dose notifications.",
};

export default function ReminderSettingsPage() {
  return <ReminderSettings />;
}

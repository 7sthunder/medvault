import type { Metadata } from "next";
import { NotificationsPage as NotificationsView } from "@/features/notifications/NotificationsPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = {
  title: "Notification Center · MedVault",
  description: "Dose reminders, refill notices, and caregiver alerts in real-time.",
};

export default async function NotificationsPage() {
  await requireUser();

  return <NotificationsView />;
}

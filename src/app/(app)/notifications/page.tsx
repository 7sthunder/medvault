import type { Metadata } from "next";

import { requireUser } from "@/server/auth/require-user";
import { NotificationsPage } from "@/features/notifications/NotificationsPage";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsRoute() {
  await requireUser();
  return <NotificationsPage />;
}

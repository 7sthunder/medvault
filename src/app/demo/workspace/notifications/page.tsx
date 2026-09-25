import type { Metadata } from "next";

import { NotificationsPage } from "@/features/notifications/NotificationsPage";

export const metadata: Metadata = { title: "Notifications" };

/**
 * Phase 19 — the demo workspace's Notifications screen. The layout above has already resolved the
 * demo subject, so this renders the shared screen directly instead of going through `requireUser()`.
 */
export default function DemoNotificationsPage() {
  return <NotificationsPage />;
}

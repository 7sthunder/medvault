import Link from "next/link";
import { Bell } from "lucide-react";

/**
 * Notification bell stub (shared on `main`).
 *
 * OWNERSHIP: exists so aadhi's Phase 09 TopNav can compile against it. aadhi must
 * NOT edit this file; hp re-implements it live in Phase 22 (its own merge step).
 */
export function NotificationBell() {
  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-muted hover:text-ink-700"
    >
      <Bell className="h-5 w-5" aria-hidden />
    </Link>
  );
}
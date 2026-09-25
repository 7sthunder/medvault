import type { ReactNode } from "react";
import { requireUser } from "@/server/auth/require-user";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Phase 09 — protected shell for the post-auth app (plan §7). Every route under
 * this route group is gated server-side; unauthenticated visits are sent to
 * `/login?next=…`. Authenticated visits render inside the AppShell.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();

  return (
    <AppShell user={session.user}>
      {children}
    </AppShell>
  );
}
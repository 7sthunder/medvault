import type { ReactNode } from "react";

import { requireUser } from "@/server/auth/require-user";

/**
 * Phase 06 — protected shell for the post-auth app (plan §14). Every route under
 * a child page here is gated server-side; unauthenticated visits are sent to
 * `/login?next=…`.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
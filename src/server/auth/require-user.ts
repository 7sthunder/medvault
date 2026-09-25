import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth/server";

/**
 * Server-side route gate (plan §14). Redirects unauthenticated requests to
 * `/login?next=…`, preserving the attempted path (from `next` or the
 * middleware-injected `x-pathname` header) so login can route back.
 * `next` is guarded against open-redirect values.
 */
export async function requireUser(next?: string | null) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) {
    const attempted =
      next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
        ? next
        : h.get("x-pathname");
    const suffix =
      attempted && attempted !== "/" && attempted !== "/login"
        ? `?next=${encodeURIComponent(attempted)}`
        : "";
    redirect(`/login${suffix}`);
  }
  return session;
}

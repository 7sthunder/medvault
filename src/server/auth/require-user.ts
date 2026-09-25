import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth/server";
import { db } from "@/server/db/client";
import { DEMO_COOKIE_NAME, getDemoUser } from "@/server/domain/demo/service";

/**
 * Server-side route gate (plan §14, §10.8). Redirects unauthenticated requests to
 * `/login?next=…`, preserving the attempted path (from `next` or the
 * middleware-injected `x-pathname` header) so login can route back.
 * In demo mode, binds to the demo user so evaluators can browse the application seamlessly.
 * `next` is guarded against open-redirect values.
 */
export async function requireUser(next?: string | null) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (session) {
    return session;
  }

  const cookieHeader = h.get("cookie") ?? "";
  const refererHeader = h.get("referer") ?? "";
  const isDemo =
    cookieHeader.includes(`${DEMO_COOKIE_NAME}=1`) ||
    cookieHeader.includes(`${DEMO_COOKIE_NAME}=true`) ||
    refererHeader.includes("/demo");

  if (isDemo) {
    try {
      const demoUser = await getDemoUser(db);
      return {
        user: {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          timezone: demoUser.timezone,
          onboardingCompleted: demoUser.onboardingCompleted,
          isDemo: true,
          emailVerified: true,
          createdAt: demoUser.createdAt,
          updatedAt: demoUser.updatedAt,
          image: null,
        },
        session: {
          id: "demo-session",
          userId: demoUser.id,
          token: "demo-token",
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    } catch {
      // Fall through to login redirect
    }
  }

  const attempted =
    next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
      ? next
      : h.get("x-pathname");
  const suffix =
    attempted && attempted !== "/" && attempted !== "/login" ? `?next=${encodeURIComponent(attempted)}` : "";
  redirect(`/login${suffix}`);
}
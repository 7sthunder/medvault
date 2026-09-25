import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/AuthShell";
import { auth } from "@/server/auth/server";

/**
 * Phase 06 — `/login` + `/register` shell (Stitch split layout, plan §14).
 * Authed users are bounced to their post-login target instead of the forms.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect(session.user.onboardingCompleted ? "/dashboard" : "/onboarding");
  }
  return <AuthShell>{children}</AuthShell>;
}

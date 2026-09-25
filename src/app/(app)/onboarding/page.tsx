import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import { requireUser } from "@/server/auth/require-user";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

export const metadata: Metadata = { title: "Welcome" };

/**
 * Phase 10 — onboarding entry (plan §11.4). Completed users are bounced straight
 * to the dashboard; fresh users get the pre-shell (app) wizard. The completed
 * flag is read from the DB rather than the session user (Better Auth caches the
 * user in the session token at sign-in, so the wizard's own update wouldn't be
 * visible on a later visit).
 */
export default async function OnboardingPage() {
  const session = await requireUser();

  const [profile] = await db
    .select({ onboardingCompleted: users.onboardingCompleted })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (profile?.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <OnboardingWizard
      userName={session.user.name}
      initialTimezone={session.user.timezone ?? "UTC"}
    />
  );
}

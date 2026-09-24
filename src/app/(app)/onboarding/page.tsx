import type { Metadata } from "next";

import { SkipOnboardingButton } from "@/features/auth/SkipOnboardingButton";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const session = await requireUser();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-heading text-2xl font-extrabold text-ink-900">
        Welcome, {session.user.name.split(" ")[0]}
      </h1>
      <p className="mt-4 text-muted-foreground">
        Medication reminders, schedules and insights are on their way — your onboarding flow arrives
        in a later phase.
      </p>
      <div className="mt-8">
        <SkipOnboardingButton />
      </div>
    </main>
  );
}
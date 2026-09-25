import type { Metadata } from "next";
import { requireUser } from "@/server/auth/require-user";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Welcome to MedVault · Personalize Setup",
};

export default async function OnboardingPage() {
  const session = await requireUser();

  return (
    <main className="w-full">
      <OnboardingWizard
        initialName={session.user.name}
        initialTimezone={session.user.timezone}
      />
    </main>
  );
}

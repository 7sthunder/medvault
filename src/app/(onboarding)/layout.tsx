import type { ReactNode } from "react";
import { requireUser } from "@/server/auth/require-user";

/**
 * Phase 10 — standalone pre-shell layout for onboarding (plan §7, §14).
 * Enforces authenticated session without rendering the global AppShell navigation.
 */
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-tint/20 via-background to-secondary-tint/20 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {children}
    </div>
  );
}

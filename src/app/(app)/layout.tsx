import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { requireUser } from "@/server/auth/require-user";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();
  const user = session.user;

  return (
    <AppShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email ?? "",
        image: user.image ?? null,
        timezone: user.timezone ?? "UTC",
        onboardingCompleted: user.onboardingCompleted ?? false,
      }}
    >
      {children}
    </AppShell>
  );
}
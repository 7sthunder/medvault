import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { AppearanceController } from "@/features/settings/appearance-controller";
import { settingsService } from "@/server/domain/settings/service";
import { requireUser } from "@/server/auth/require-user";
import { db } from "@/server/db/client";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();
  const user = session.user;
  // Read on the server so the very first paint already carries the right theme tokens (§5.7).
  const appearance = await settingsService.getAppearance(db, user.id).catch(() => null);

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
      {appearance && <AppearanceController appearance={appearance} />}
      {children}
    </AppShell>
  );
}

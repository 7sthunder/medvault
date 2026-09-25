import type { Metadata } from "next";
import { headers } from "next/headers";

import { AppShell } from "@/components/layout/AppShell";
import { HelpContent } from "@/features/help/HelpContent";
import { AppearanceController } from "@/features/settings/appearance-controller";
import { auth } from "@/server/auth/server";
import { db } from "@/server/db/client";
import { settingsService } from "@/server/domain/settings/service";
import { BRAND } from "@/shared/brand";

export const metadata: Metadata = {
  title: "Help & how it works",
  description: `How ${BRAND.name} works — setting up medications, taking and snoozing doses, understanding adherence, caregiver access, and your data.`,
};

/**
 * Phase 18 — `/help` (plan §11.15).
 *
 * There is deliberately **one** route, not two. `(app)/help` and `(marketing)/help` would resolve to
 * the same URL, and route groups do not namespace paths — Next rejects the duplicate outright. The
 * plan's "accessible to all" requirement is better met by one page that renders the right chrome
 * for whoever is asking: a signed-in reader keeps the sidebar and bottom nav (so the nav's Help link
 * never dumps them out of the app), a signed-out reader from the marketing footer gets a bare,
 * dependency-free page. Both render the same `HelpContent`, so the copy cannot drift.
 *
 * Sitting outside both groups also means no group layout forces a `bg-white` wrapper over a
 * dark-mode surface.
 */
export default async function HelpPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) return <HelpContent />;

  const user = session.user;
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
      <HelpContent />
    </AppShell>
  );
}

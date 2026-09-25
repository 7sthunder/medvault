import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { DemoBanner } from "@/features/demo/DemoBanner";
import { DemoDock } from "@/features/demo/DemoDock";
import { resolveDemoSubject } from "@/server/auth/resolve-demo-subject";
import { DEMO_COOKIE, verifyDemoToken } from "@/server/domain/demo/token";
import { BRAND } from "@/shared/brand";

export const metadata: Metadata = {
  title: "Demo workspace",
  description: `A fully populated sample ${BRAND.name} workspace you can simulate against.`,
};
/**
 * Phase 18 — `/demo/workspace/*` shell (plan §10.8).
 *
 * The workspace deliberately reuses the *real* screens: `basePath` makes the nav resolve under
 * `/demo/workspace`, so `/demo/workspace/schedule` renders the same `SchedulePage` a real user
 * gets. That is the whole point of a demo — the app under it is not a mock.
 *
 * Gate: a real session is always allowed (you keep your own account and the banner says so);
 * otherwise a valid signed demo cookie is required, and anything else is sent back to `/demo` to
 * be introduced properly instead of landing on a half-populated dashboard.
 */
export default async function DemoWorkspaceLayout({ children }: { children: ReactNode }) {
  const subject = await resolveDemoSubject();

  if (!subject) {
    const store = await cookies();
    const hasCookie = Boolean(verifyDemoToken(store.get(DEMO_COOKIE)?.value));
    if (!hasCookie) redirect("/demo#enter");
  }

  return (
    <AppShell
      user={subject!.user}
      isDemo={subject!.isDemo}
      basePath="/demo/workspace"
      overlay={<DemoDock />}
      simulationNow={subject!.simulationNow}
    >
      <DemoBanner />
      {children}
    </AppShell>
  );
}

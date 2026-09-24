import type { Metadata } from "next";
import Link from "next/link";

import { SignOutButton } from "@/features/auth/SignOutButton";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireUser();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-extrabold text-ink-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <p className="mt-8 text-muted-foreground">
        Your session is live — the full dashboard (medications, schedules, adherence) lands in a
        later phase.
      </p>
      <p className="mt-4">
        <Link href="/onboarding" className="font-semibold text-primary hover:underline">
          Continue onboarding →
        </Link>
      </p>
    </main>
  );
}
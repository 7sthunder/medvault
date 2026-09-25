"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { useNow } from "@/components/layout/clock-context";
import { useAppHref, useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import type { DoseEventDTO } from "@/shared/types";

import { useDoseActions } from "../dose/useDoseActions";
import { AdherenceWidget } from "./AdherenceWidget";
import { CaregiverStatus } from "./CaregiverStatus";
import { InsightWidget } from "./InsightWidget";
import { MedSummary } from "./MedSummary";
import { NextDoseHero } from "./NextDoseHero";
import { QuickActions } from "./QuickActions";
import { StatRail } from "./StatRail";
import { TodayFeed } from "./TodayFeed";

/**
 * §11.4 `/dashboard` — one `dashboard.get` call renders the full priority-ordered
 * page: hero (next/current dose) → stat rail → today's schedule feed → 7-day trend →
 * meds summary → latest AI insight → caregiver status → quick actions. Dose actions reuse
 * the shared `useDoseActions` (invalidates dashboard + schedule + adherence together).
 */
export function DashboardPage() {
  const { user } = useShell();
  const router = useRouter();
  const href = useAppHref();
  const now = useNow();
  const timeZone = user.timezone;
  const { data, isLoading, isError, error, refetch } = api.dashboard.get.useQuery(undefined, {
    staleTime: 30_000,
  });
  const { take, snooze, skip, isPending } = useDoseActions();

  const heroDose: DoseEventDTO | null = data?.nextDose ?? data?.dueNow?.[0] ?? null;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl">
        <div className="grid gap-6">
          <Skeleton className="h-40 rounded-xl shadow-card-sm" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-5xl">
        <h1 className="font-heading text-2xl font-extrabold text-ink-900">Dashboard</h1>
        <ErrorState
          className="mt-8"
          title="Couldn't load your dashboard"
          description={error?.message ?? "Something went wrong while loading your dashboard."}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-ink-900">
            {user.name ? `${user.name.split(" ")[0]}'s Dashboard` : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Your doses at a glance.</p>
        </div>
        <Button onClick={() => router.push(href("/medications/new"))}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add medication
        </Button>
      </header>

      {data.medications.length === 0 ? (
        <EmptyState
          className="mt-16"
          title="Set up your first medication"
          description="Add a medication to generate today's schedule and start tracking adherence."
          action={
            <Button onClick={() => router.push(href("/medications/new"))}>
              <Plus data-icon="inline-start" aria-hidden="true" />
              Add your first medication
            </Button>
          }
        />
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <NextDoseHero
            dose={heroDose}
            medStatus="active"
            timeZone={timeZone}
            now={now}
            busy={isPending}
            onTake={(dose) => void take(dose.id)}
            onSnooze={(dose) => void snooze(dose.id)}
            onSkip={(id, reason) => skip(id, reason)}
          />
          <StatRail stats={data.stats} timeZone={timeZone} />
          <TodayFeed events={data.today} timeZone={timeZone} />
          <AdherenceWidget week={data.week} />
          <div className="grid gap-6 lg:grid-cols-2">
            <MedSummary medications={data.medications} timeZone={timeZone} />
            <div className="grid content-start gap-6">
              <InsightWidget insight={data.latestInsight} timeZone={timeZone} />
              <CaregiverStatus caregiver={data.caregiver} />
            </div>
          </div>
          <QuickActions />
        </div>
      )}
    </main>
  );
}

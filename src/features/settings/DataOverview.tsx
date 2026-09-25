"use client";

import { Database } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useShell } from "@/components/layout/shell-context";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { DeleteFlow } from "@/features/settings/DeleteFlow";
import { ExportButtons } from "@/features/settings/ExportButtons";
import { api } from "@/lib/trpc";
import { formatCount, formatInstant } from "@/lib/format";

/**
 * Phase 18 — `/settings/data` (§11.14): what is stored, export it, then the two delete flows.
 * Counts come straight from the service, so the numbers here are the same ones the wipe acts on.
 */
export function DataOverview() {
  const { timezone } = useShell().user;
  const query = api.settings.dataOverview.useQuery();

  if (query.isLoading) return <Skeleton className="h-96 w-full rounded-xl" aria-busy="true" />;

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn't load your data"
        description="Your storage summary could not be loaded right now."
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const data = query.data;
  const span =
    data.firstDoseAt && data.lastDoseAt
      ? `${formatInstant(data.firstDoseAt, timezone)} → ${formatInstant(data.lastDoseAt, timezone)}`
      : "No dose history yet";

  return (
    <div className="grid gap-5">
      <Card className="shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-ink-900">What we store</CardTitle>
          <CardDescription>
            Your history spans {span}. Everything here is exportable and deletable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Medications" value={formatCount(data.medications)} icon={Database} />
            <StatCard title="Dose events" value={formatCount(data.doseEvents)} />
            <StatCard title="Dose actions" value={formatCount(data.doseActions)} />
            <StatCard title="Insights" value={formatCount(data.insights)} />
            <StatCard title="Notifications" value={formatCount(data.notifications)} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-ink-900">Export</CardTitle>
          <CardDescription>
            Download your data as CSV to keep, share with a clinician, or move elsewhere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportButtons />
        </CardContent>
      </Card>

      <DeleteFlow hasDemoData={data.hasDemoData} />

      <Card className="shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-ink-900">Not ready to add your own yet?</CardTitle>
          <CardDescription>
            The demo runs on a separate shared sample workspace. Nothing you do there reaches this
            account, and you can reset it at any time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/demo">
            <Button variant="outline">Open the demo</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

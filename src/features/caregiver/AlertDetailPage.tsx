"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, BellRing, Check, CheckCheck, History } from "lucide-react";
import { toast } from "sonner";

import { useAppHref, useShell } from "@/components/layout/shell-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { actionMeta } from "@/shared/actions";
import { formatInstant } from "@/lib/format";
import type { CaregiverAlertDetailDTO } from "@/shared/types";

import { ALERT_TYPE_LABEL, alertStatusTone, alertTypeTone } from "./AlertFeed";

const ALERT_STATUS_LABEL: Readonly<Record<CaregiverAlertDetailDTO["status"], string>> = {
  new: "New",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

export function AlertDetailPage({ alertIdPromise }: { alertIdPromise: Promise<string> }) {
  const alertId = use(alertIdPromise);
  const { user } = useShell();
  const href = useAppHref();
  const utils = api.useUtils();
  const detail = api.caregiver.alertDetail.useQuery({ alertId }, { staleTime: 15_000 });
  const action = api.caregiver.alertAction.useMutation({
    onSuccess: (_result, variables) => {
      toast.success(variables.action === "resolve" ? "Alert resolved" : "Alert acknowledged");
      void utils.caregiver.alertDetail.invalidate();
      void utils.caregiver.overview.invalidate();
      void utils.caregiver.patientOverview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (detail.isLoading) return <AlertDetailSkeleton />;

  if (detail.isError) {
    return (
      <main className="mx-auto max-w-3xl">
        <BackLink />
        <ErrorState
          className="mt-8"
          title="Couldn't load this alert"
          description={detail.error?.message ?? "The alert could not be loaded right now."}
          action={
            <Button variant="outline" onClick={() => void detail.refetch()}>
              Try again
            </Button>
          }
        />
      </main>
    );
  }

  if (!detail.data) {
    return (
      <main className="mx-auto max-w-3xl">
        <BackLink />
        <EmptyState
          className="mt-8"
          icon={BellRing}
          title="Alert not found"
          description="This alert may have been removed or you may no longer have access to it."
          action={
            <Link href={href("/caregiver")}>
              <Button variant="outline">Back to caregiver</Button>
            </Link>
          }
        />
      </main>
    );
  }

  const alert = detail.data;
  const pendingAction = action.isPending ? action.variables?.action : null;

  return (
    <main className="mx-auto max-w-3xl">
      <BackLink />

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <SectionLabel
            tone="magenta"
            leading={<BellRing className="size-3.5" aria-hidden="true" />}
          >
            Caregiver alert
          </SectionLabel>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-ink-900">{alert.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {alert.patientName} · {formatDateTime(alert.createdAt, user.timezone)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={alertTypeTone(alert.type)}>{ALERT_TYPE_LABEL[alert.type]}</Chip>
          <Chip tone={alertStatusTone(alert.status)}>{ALERT_STATUS_LABEL[alert.status]}</Chip>
        </div>
      </header>

      <Card className="mt-6 shadow-card-sm">
        <CardHeader>
          <CardTitle>What happened</CardTitle>
          <CardDescription>
            Shared by {alert.patientName} with you as their caregiver.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="text-sm leading-6 text-ink-800">{alert.body}</p>

          <dl className="grid gap-3 rounded-xl bg-bg-soft p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Patient
              </dt>
              <dd className="mt-1 font-medium text-ink-900">{alert.patientName}</dd>
            </div>
            {alert.medicationName && (
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Medication
                </dt>
                <dd className="mt-1 font-medium text-ink-900">{alert.medicationName}</dd>
              </div>
            )}
            {alert.scheduledFor && (
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Scheduled for
                </dt>
                <dd className="mt-1 font-medium text-ink-900">
                  {formatDateTime(alert.scheduledFor, user.timezone)}
                </dd>
              </div>
            )}
            {alert.resolvedAt && (
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Resolved
                </dt>
                <dd className="mt-1 font-medium text-ink-900">
                  {formatDateTime(alert.resolvedAt, user.timezone)}
                </dd>
              </div>
            )}
          </dl>

          {action.isError && (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t update this alert</AlertTitle>
              <AlertDescription>{action.error?.message ?? "Please try again."}</AlertDescription>
            </Alert>
          )}

          <AlertActions
            status={alert.status}
            pendingAction={pendingAction}
            onAcknowledge={() => action.mutate({ alertId, action: "acknowledge" })}
            onResolve={() => action.mutate({ alertId, action: "resolve" })}
          />
        </CardContent>
      </Card>

      <section aria-labelledby="alert-history-heading" className="mt-8">
        <div>
          <SectionLabel tone="blue" leading={<History className="size-3.5" aria-hidden="true" />}>
            Dose history
          </SectionLabel>
          <h2 id="alert-history-heading" className="mt-1 text-lg font-semibold text-ink-900">
            Activity around this alert
          </h2>
        </div>
        <div className="mt-3">
          {alert.history.length === 0 ? (
            <EmptyState
              compact
              icon={History}
              title="No dose history"
              description="There are no recorded actions for the dose connected to this alert."
            />
          ) : (
            <Card className="shadow-card-sm">
              <CardContent className="p-2">
                <ol className="flex flex-col">
                  {alert.history.map((item) => {
                    const meta = actionMeta(item.action);
                    return (
                      <li
                        key={item.id}
                        className="flex gap-3 border-b border-border/60 px-3 py-3 last:border-b-0"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink-900">{meta.label}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.medication.name} · {formatInstant(item.occurredAt, user.timezone)}
                          </p>
                        </div>
                        <Chip tone={meta.tone}>{meta.label}</Chip>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}

function AlertActions({
  status,
  pendingAction,
  onAcknowledge,
  onResolve,
}: {
  status: CaregiverAlertDetailDTO["status"];
  pendingAction: "acknowledge" | "resolve" | null | undefined;
  onAcknowledge: () => void;
  onResolve: () => void;
}) {
  if (status === "resolved") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-primary-tint px-3 py-2 text-sm font-medium text-primary-dark">
        <CheckCheck className="size-4" aria-hidden="true" />
        This alert has been resolved.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "new" && (
        <Button
          type="button"
          variant="outline"
          onClick={onAcknowledge}
          disabled={pendingAction !== null && pendingAction !== undefined}
        >
          <Check data-icon="inline-start" aria-hidden="true" />
          {pendingAction === "acknowledge" ? "Acknowledging…" : "Acknowledge"}
        </Button>
      )}
      <Button
        type="button"
        onClick={onResolve}
        disabled={pendingAction !== null && pendingAction !== undefined}
      >
        <CheckCheck data-icon="inline-start" aria-hidden="true" />
        {pendingAction === "resolve" ? "Resolving…" : "Resolve alert"}
      </Button>
    </div>
  );
}

function BackLink() {
  const href = useAppHref();
  return (
    <Link
      href={href("/caregiver")}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-ink-800"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to caregiver
    </Link>
  );
}

function formatDateTime(value: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function AlertDetailSkeleton() {
  return (
    <main className="mx-auto max-w-3xl">
      <Skeleton className="h-5 w-36 rounded-md" />
      <Skeleton className="mt-6 h-8 w-72 max-w-full rounded-md" />
      <Skeleton className="mt-2 h-5 w-52 max-w-full rounded-md" />
      <Skeleton className="mt-6 h-64 rounded-xl" />
      <Skeleton className="mt-8 h-40 rounded-xl" />
    </main>
  );
}

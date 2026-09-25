"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Pill,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { api } from "@/lib/trpc";

interface AlertDetailPageProps {
  alertId: string;
}

export function AlertDetailPage({ alertId }: AlertDetailPageProps) {
  const utils = api.useUtils();

  const alertQuery = api.caregiver.getAlert.useQuery({ alertId });

  const updateAlertMutation = api.caregiver.updateAlert.useMutation({
    onSuccess: (updated) => {
      toast.success(
        updated.status === "acknowledged"
          ? "Alert acknowledged."
          : "Alert marked as resolved.",
      );
      utils.caregiver.getAlert.invalidate({ alertId });
      utils.caregiver.listAlerts.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update alert.");
    },
  });

  if (alertQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (alertQuery.isError || !alertQuery.data) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ErrorState
          icon={AlertTriangle}
          title="Alert Not Found"
          description={alertQuery.error?.message || "This alert does not exist or you do not have permission to view it."}
          action={
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/caregiver" />}>
              Back to Caregiver Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const alert = alertQuery.data;
  const isNew = alert.status === "new";
  const isAck = alert.status === "acknowledged";
  const isResolved = alert.status === "resolved";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/caregiver" />}
          className="gap-1.5 text-xs text-muted-foreground hover:text-ink-900"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Caregiver Hub</span>
        </Button>
      </div>

      {/* Main Alert Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card-sm space-y-6">
        <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex size-11 items-center justify-center rounded-2xl ${
                isResolved
                  ? "bg-primary-tint text-primary-dark dark:text-primary"
                  : "bg-rose-500/10 text-rose-600"
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="size-6" />
              ) : (
                <AlertTriangle className="size-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-heading text-xl font-bold text-ink-900 dark:text-ink-100">
                  {alert.title}
                </h1>
                <Badge
                  variant="secondary"
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isNew
                      ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                      : isAck
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "border-primary/20 bg-primary-tint text-primary-dark dark:text-primary"
                  }`}
                >
                  {alert.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Triggered on {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isNew && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateAlertMutation.mutate({
                    alertId: alert.id,
                    action: "acknowledge",
                  })
                }
                disabled={updateAlertMutation.isPending}
              >
                Acknowledge
              </Button>
            )}

            {!isResolved && (
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  updateAlertMutation.mutate({
                    alertId: alert.id,
                    action: "resolve",
                  })
                }
                disabled={updateAlertMutation.isPending}
              >
                Mark as Resolved
              </Button>
            )}
          </div>
        </div>

        {/* Alert description / body */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
          <p className="text-sm text-ink-900 dark:text-ink-100 leading-relaxed font-medium">
            {alert.body}
          </p>
        </div>

        {/* Snapshot details grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border/80 p-3.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-secondary-tint text-secondary">
              <User className="size-4.5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                {alert.patientName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/80 p-3.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary-tint text-primary-dark dark:text-primary">
              <Pill className="size-4.5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Medication</p>
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                {alert.medicationName || "Scheduled dose"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/80 p-3.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Clock className="size-4.5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Scheduled Time</p>
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                {alert.scheduledFor
                  ? new Date(alert.scheduledFor).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/80 p-3.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Calendar className="size-4.5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resolved Status</p>
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                {alert.resolvedAt
                  ? `Resolved on ${new Date(alert.resolvedAt).toLocaleDateString()}`
                  : "Pending resolution"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

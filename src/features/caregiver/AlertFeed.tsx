"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Eye,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/trpc";

interface AlertFeedProps {
  patientUserId?: string;
  className?: string;
}

export function AlertFeed({ patientUserId, className }: AlertFeedProps) {
  const [filter, setFilter] = useState<"all" | "new" | "resolved">("all");

  const utils = api.useUtils();

  const alertsQuery = api.caregiver.listAlerts.useQuery({
    patientUserId,
    status: filter === "all" ? undefined : filter === "new" ? "new" : "resolved",
  });

  const updateAlertMutation = api.caregiver.updateAlert.useMutation({
    onSuccess: (updated) => {
      toast.success(
        updated.status === "acknowledged"
          ? "Alert acknowledged."
          : "Alert marked as resolved.",
      );
      utils.caregiver.listAlerts.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update alert status.");
    },
  });

  const alerts = alertsQuery.data ?? [];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header and Filter Buttons */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
            <ShieldAlert className="size-4" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
              Caregiver Alerts
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Notifications triggered by missed doses or adherence drops
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card/80 p-0.5 text-xs shadow-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
              filter === "all"
                ? "bg-card text-ink-900 shadow-card-sm dark:text-ink-100"
                : "text-slate-700 hover:text-ink-900 dark:text-slate-300 dark:hover:text-ink-100"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("new")}
            className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
              filter === "new"
                ? "bg-card text-ink-900 shadow-card-sm dark:text-ink-100"
                : "text-slate-700 hover:text-ink-900 dark:text-slate-300 dark:hover:text-ink-100"
            }`}
          >
            New
          </button>
          <button
            type="button"
            onClick={() => setFilter("resolved")}
            className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
              filter === "resolved"
                ? "bg-card text-ink-900 shadow-card-sm dark:text-ink-100"
                : "text-slate-700 hover:text-ink-900 dark:text-slate-300 dark:hover:text-ink-100"
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {alertsQuery.isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <EmptyState
            icon={Bell}
            title="All Clear — No Alerts"
            description="No missed dose alerts found in this view. Patient intake is on track."
            compact
          />
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-2xl border border-border bg-card shadow-card-sm">
          {alerts.map((alert) => {
            const isNew = alert.status === "new";
            const isAck = alert.status === "acknowledged";
            const isResolved = alert.status === "resolved";

            return (
              <div
                key={alert.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                      isResolved
                        ? "bg-primary-tint text-primary-dark dark:text-primary"
                        : "bg-rose-500/10 text-rose-600"
                    }`}
                  >
                    {isResolved ? (
                      <CheckCircle2 className="size-4.5" />
                    ) : (
                      <AlertTriangle className="size-4.5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm font-semibold text-ink-900 dark:text-ink-100">
                        {alert.title}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          isNew
                            ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                            : isAck
                              ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              : "border-primary/20 bg-primary-tint text-primary-dark dark:text-primary"
                        }`}
                      >
                        {alert.status}
                      </Badge>
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        for <strong>{alert.patientName}</strong>
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {alert.body}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.medicationName && (
                        <span>• Med: {alert.medicationName}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
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
                      className="text-xs h-8"
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
                      className="text-xs h-8"
                    >
                      Resolve
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    nativeButton={false}
                    render={<Link href={`/caregiver/alerts/${alert.id}`} />}
                  >
                    <Eye className="size-3.5 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

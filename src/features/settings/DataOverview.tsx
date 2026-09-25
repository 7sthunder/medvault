"use client";

import { Bell, FileSpreadsheet, Pill, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";

export function DataOverview() {
  const { data, isLoading } = api.settings.getDataOverview.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Medications",
      count: data?.medicationCount ?? 0,
      icon: Pill,
      color: "text-primary",
    },
    {
      label: "Dose Logs",
      count: data?.doseEventCount ?? 0,
      icon: FileSpreadsheet,
      color: "text-blue-500",
    },
    {
      label: "AI Insights",
      count: data?.insightCount ?? 0,
      icon: Sparkles,
      color: "text-violet-500",
    },
    {
      label: "Notifications",
      count: data?.notificationCount ?? 0,
      icon: Bell,
      color: "text-amber-500",
    },
    {
      label: "Caregivers",
      count: data?.caregiverCount ?? 0,
      icon: Users,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Vault Summary
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-1 shadow-xs"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{stat.label}</span>
              <stat.icon className={`size-4 ${stat.color}`} />
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">
              {stat.count}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <ShieldCheck className="size-5 shrink-0 text-primary mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Client Data Isolation: </span>
          All records stored in your vault are scoped strictly to your account. Demo accounts cannot view or alter real user logs.
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import type { DemoScenario } from "@/shared/enums";

interface ScenarioControlProps {
  currentScenario: DemoScenario;
}

export function ScenarioControl({ currentScenario }: ScenarioControlProps) {
  const [isApplying, setIsApplying] = useState(false);
  const utils = api.useUtils();

  const scenarioMutation = api.demo.applyScenario.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      void utils.demo.getState.invalidate();
      void utils.dashboard.get.invalidate();
      void utils.adherence.summary.invalidate();
      void utils.caregiver.listAlerts.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to apply scenario.");
    },
    onSettled: () => {
      setIsApplying(false);
    },
  });

  const handleApply = (scenario: DemoScenario) => {
    setIsApplying(true);
    scenarioMutation.mutate({ scenario });
  };

  const scenarios: { key: DemoScenario; label: string; icon: typeof Sparkles; desc: string }[] = [
    {
      key: "baseline",
      label: "Baseline (90.5%)",
      icon: CheckCircle2,
      desc: "Standard §19 benchmark with 7-day streak.",
    },
    {
      key: "decline",
      label: "Missed Adherence",
      icon: TrendingDown,
      desc: "Simulates recent missed doses and warnings.",
    },
    {
      key: "improvement",
      label: "Full Recovery",
      icon: TrendingUp,
      desc: "Converts missed doses to achieve 100% streak.",
    },
    {
      key: "caregiver_demo",
      label: "Caregiver Triage",
      icon: ShieldAlert,
      desc: "Dr. Patel connection + urgent missed alert.",
    },
  ];

  return (
    <div data-testid="scenario-control" className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-violet-500" />
          <span>Apply Scenarios</span>
        </label>
        {isApplying && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {scenarios.map((sc) => {
          const isActive = currentScenario === sc.key;
          const Icon = sc.icon;

          return (
            <button
              key={sc.key}
              type="button"
              disabled={isApplying}
              onClick={() => handleApply(sc.key)}
              className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                  : "border-border/80 bg-background/50 hover:bg-muted/60"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`size-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-[11px] font-bold text-foreground truncate">{sc.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                {sc.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

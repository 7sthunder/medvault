"use client";

import { useState } from "react";
import {
  AlarmClock,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MinusCircle,
  ShieldAlert,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import { DemoClock } from "./DemoClock";
import { ResetButton } from "./ResetButton";
import { ScenarioControl } from "./ScenarioControl";

export function DemoDock() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isActing, setIsActing] = useState(false);

  const { data: demoInfo } = api.demo.getState.useQuery();
  const utils = api.useUtils();

  const simulateMutation = api.demo.simulate.useMutation({
    onSuccess: (data) => {
      toast.success(`Simulated action: marked dose as ${data.action.toUpperCase()}`);
      void utils.dashboard.get.invalidate();
      void utils.dose.today.invalidate();
      void utils.adherence.summary.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Simulation action failed.");
    },
    onSettled: () => {
      setIsActing(false);
    },
  });

  const alertMutation = api.demo.generateAlert.useMutation({
    onSuccess: () => {
      toast.success("Dispatched urgent caregiver alert to Dr. Priya Patel!");
      void utils.caregiver.listAlerts.invalidate();
      void utils.notifications.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to trigger alert.");
    },
  });

  const insightMutation = api.demo.generateInsight.useMutation({
    onSuccess: (insights) => {
      toast.success(`Generated ${insights.length} fresh adherence insight${insights.length > 1 ? "s" : ""}!`);
      void utils.insights.list.invalidate();
      void utils.insights.latest.invalidate();
      void utils.dashboard.get.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate demo insight.");
    },
  });

  const handleSimulate = (action: "take" | "miss" | "skip" | "snooze") => {
    setIsActing(true);
    simulateMutation.mutate({ action });
  };

  const simulationNow = demoInfo?.state?.simulationNow ? new Date(demoInfo.state.simulationNow) : null;
  const currentScenario = demoInfo?.state?.scenario || "baseline";

  return (
    <aside
      data-testid="demo-dock"
      aria-label="Demo simulation dock"
      className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl transition-all overflow-hidden"
    >
      {/* Dock Header */}
      <div className="flex items-center justify-between p-3.5 bg-primary/10 border-b border-border/80">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary text-primary-foreground">
            <Sliders className="size-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Simulation Dock
              <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] font-mono text-primary font-bold">
                LIVE
              </span>
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          data-testid="toggle-dock-collapse"
          aria-label={isExpanded ? "Collapse dock" : "Expand dock"}
        >
          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Clock Controller */}
          <DemoClock simulationNow={simulationNow} />

          {/* Quick Dose Simulators */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-500" />
              <span>Simulate Next Dose</span>
            </label>

            <div className="grid grid-cols-4 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isActing}
                onClick={() => handleSimulate("take")}
                className="h-9 px-1 text-[11px] font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                data-testid="simulate-take-button"
              >
                <CheckCircle2 className="size-3.5 mr-1" />
                Take
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isActing}
                onClick={() => handleSimulate("miss")}
                className="h-9 px-1 text-[11px] font-semibold border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                data-testid="simulate-miss-button"
              >
                <AlertCircle className="size-3.5 mr-1" />
                Miss
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isActing}
                onClick={() => handleSimulate("skip")}
                className="h-9 px-1 text-[11px] font-semibold border-slate-500/30 text-muted-foreground hover:bg-muted"
                data-testid="simulate-skip-button"
              >
                <MinusCircle className="size-3.5 mr-1" />
                Skip
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isActing}
                onClick={() => handleSimulate("snooze")}
                className="h-9 px-1 text-[11px] font-semibold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                data-testid="simulate-snooze-button"
              >
                <AlarmClock className="size-3.5 mr-1" />
                Snooze
              </Button>
            </div>
          </div>

          {/* Scenario Picker */}
          <ScenarioControl currentScenario={currentScenario} />

          {/* Generator Shortcuts */}
          <div className="space-y-1.5 pt-1 border-t border-border/60">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={alertMutation.isPending}
                onClick={() => alertMutation.mutate()}
                className="h-8 text-[11px] gap-1.5 border-amber-500/25 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                data-testid="simulate-caregiver-alert-button"
              >
                <ShieldAlert className="size-3.5 text-amber-500" />
                <span>+ Caregiver Alert</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={insightMutation.isPending}
                onClick={() => insightMutation.mutate()}
                className="h-8 text-[11px] gap-1.5 border-violet-500/25 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10"
                data-testid="simulate-ai-insight-button"
              >
                <Sparkles className="size-3.5 text-violet-500" />
                <span>+ AI Insight</span>
              </Button>
            </div>
          </div>

          {/* Reset Workspace */}
          <div className="pt-2 border-t border-border/60">
            <ResetButton />
          </div>
        </div>
      )}
    </aside>
  );
}

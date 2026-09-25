"use client";

import { useState } from "react";
import {
  AlarmClock,
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  RotateCcw,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { formatCount, formatInstant } from "@/lib/format";
import { DEMO_SCENARIOS, type DemoScenario } from "@/shared/enums";
import { DEMO_ACTIONS } from "@/shared/validations/settings";
import type { DemoActionResultDTO } from "@/shared/types";

/**
 * Phase 18 — the floating simulation dock (plan §10.8).
 *
 * Collapsed it is a single pill showing the simulated clock; expanded it exposes the four dose
 * actions, the three adherence scenarios, the two "generate" affordances and reset. Every button
 * calls a real domain service through the demo router, so the app under it behaves exactly as it
 * would for a real user — the dock only *decides what happened*, never how it is stored.
 */

/** The demo user is seeded in Asia/Kolkata; the clock reads in that zone so it matches the seed. */
const DEMO_ZONE = "Asia/Kolkata";

const SCENARIO_LABELS: Record<DemoScenario, { label: string; hint: string }> = {
  baseline: { label: "Baseline", hint: "Everything on time" },
  decline: { label: "Decline", hint: "Evening doses slipping" },
  improvement: { label: "Improvement", hint: "Recovering over 14 days" },
  caregiver_demo: { label: "Caregiver", hint: "Focus on caregiver alerts" },
};

/**
 * A simulation that changed nothing is not an error — it is the dock telling you the app is in a
 * state where that action has no target. `info` communicates that without implying a failure.
 */
function report(result: DemoActionResultDTO): void {
  if (result.ok) toast.success(result.detail);
  else toast.info(result.detail);
}

export function DemoDock() {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const utils = api.useUtils();
  const state = api.demo.state.useQuery(undefined, { refetchInterval: 30_000 });

  const refresh = () => {
    void utils.invalidate();
  };

  const simulate = api.demo.simulateAction.useMutation({
    onSuccess: (result) => {
      report(result);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const scenario = api.demo.applyScenario.useMutation({
    onSuccess: (result) => {
      toast.success(result.detail);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const caregiverAlert = api.demo.generateCaregiverAlert.useMutation({
    onSuccess: (result) => {
      report(result);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const insight = api.demo.generateInsight.useMutation({
    onSuccess: (result) => {
      report(result);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const advance = api.demo.advanceDays.useMutation({
    onSuccess: () => refresh(),
    onError: (error) => toast.error(error.message),
  });

  const releaseClock = api.demo.setTime.useMutation({
    onSuccess: () => {
      toast.success("Demo clock released — back to real time");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const reset = api.demo.reset.useMutation({
    onSuccess: () => {
      setConfirmReset(false);
      toast.success("Demo workspace reset to the sample dataset");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const busy =
    simulate.isPending ||
    scenario.isPending ||
    caregiverAlert.isPending ||
    insight.isPending ||
    advance.isPending ||
    reset.isPending;

  const data = state.data;
  const simulated = data?.simulationNow ?? null;
  const clockLabel = simulated ? formatInstant(simulated, DEMO_ZONE) : "Real time";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 md:justify-end md:px-6 md:pb-6">
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-card-lg">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted"
        >
          <AlarmClock className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Demo clock
            </span>
            <span className="block truncate text-sm font-medium text-ink-900">{clockLabel}</span>
          </span>
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
        </button>

        {open && (
          <div className="grid gap-4 border-t border-border px-4 py-4">
            {state.isLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" aria-busy="true" />
            ) : (
              <>
                <section className="grid gap-2">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Simulate a dose
                  </h2>
                  <div className="grid grid-cols-4 gap-2">
                    {DEMO_ACTIONS.map((action) => (
                      <Button
                        key={action}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => simulate.mutate({ action })}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Acts on the next due dose. Move the clock forward to reach one.
                  </p>
                </section>

                <section className="grid gap-2">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Demo clock
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => advance.mutate({ days: -1 })}
                    >
                      <Minus className="size-4" aria-hidden />1 day
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => advance.mutate({ days: 1 })}
                    >
                      1 day
                      <Check className="size-4" aria-hidden />
                    </Button>
                    {simulated && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => releaseClock.mutate({ simulationNow: null })}
                      >
                        Real time
                      </Button>
                    )}
                  </div>
                </section>

                <section className="grid gap-2">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Adherence scenario
                  </h2>
                  <div className="grid gap-1.5">
                    {DEMO_SCENARIOS.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        size="sm"
                        variant={data?.scenario === option ? "default" : "outline"}
                        disabled={busy}
                        className="justify-between"
                        onClick={() => scenario.mutate({ scenario: option })}
                      >
                        {SCENARIO_LABELS[option].label}
                        <span className="text-xs font-normal opacity-80">
                          {SCENARIO_LABELS[option].hint}
                        </span>
                      </Button>
                    ))}
                  </div>
                </section>

                <section className="grid gap-2">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Generate
                  </h2>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => caregiverAlert.mutate()}
                  >
                    <UserPlus className="size-4" aria-hidden />
                    Caregiver alert
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => insight.mutate()}
                  >
                    <Sparkles className="size-4" aria-hidden />
                    AI insight
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => setConfirmReset(true)}
                  >
                    <RotateCcw className="size-4" aria-hidden />
                    Reset demo data
                  </Button>
                </section>

                {data && (
                  <p className="text-xs text-muted-foreground">
                    {formatCount(data.totals.scheduled)} scheduled ·{" "}
                    {formatCount(data.totals.taken)} taken · {formatCount(data.totals.missed)}{" "}
                    missed · {formatCount(data.totals.skipped)} skipped
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <ConfirmationDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset the demo workspace?"
        description="Every simulated change is discarded and the sample dataset is seeded again — doses, adherence, the AI insight, the caregiver alert and the demo clock all go back to their starting state. This cannot be undone."
        confirmLabel="Reset demo data"
        cancelLabel="Keep exploring"
        confirmDisabled={reset.isPending}
        onConfirm={() => reset.mutate()}
      />
    </div>
  );
}

/** Compact variant used by the `/demo` landing page before entering the workspace. */
export function DemoClockBadge() {
  const state = api.demo.state.useQuery();
  if (state.isLoading) return <Skeleton className="h-6 w-40 rounded-full" />;
  const simulated = state.data?.simulationNow ?? null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-ink-900">
      <AlarmClock className="size-3.5" aria-hidden />
      {simulated ? `Simulating ${formatInstant(simulated, DEMO_ZONE)}` : "Real time"}
    </span>
  );
}

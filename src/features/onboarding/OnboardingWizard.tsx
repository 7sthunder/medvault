"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand/Brand";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ProfileStep } from "./steps/ProfileStep";
import { RemindersStep } from "./steps/RemindersStep";
import { FinishStep } from "./steps/FinishStep";
import { DEFAULT_ONBOARDING_STATE, type OnboardingWizardState, type OnboardingWizardStep } from "./types";

export interface OnboardingWizardProps {
  initialName?: string | null;
  initialTimezone?: string | null;
}

const STEP_LABELS = [
  { step: 1, label: "Timezone & Profile" },
  { step: 2, label: "Reminder Habits" },
  { step: 3, label: "First Medication" },
];

export function OnboardingWizard({ initialName, initialTimezone }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingWizardStep>(1);
  const [state, setState] = useState<OnboardingWizardState>({
    ...DEFAULT_ONBOARDING_STATE,
    name: initialName,
    timezone: (initialTimezone as typeof DEFAULT_ONBOARDING_STATE.timezone) || DEFAULT_ONBOARDING_STATE.timezone,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateState = useCallback((patch: Partial<OnboardingWizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSkip = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/trpc/auth.setOnboardingComplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Failed to skip onboarding. Please try completing the setup.");
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/trpc/onboarding.complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            timezone: state.timezone,
            missedAfterMinutes: state.missedAfterMinutes,
            snoozeMinutes: state.snoozeMinutes,
            maxSnoozes: state.maxSnoozes,
            reminderBeforeMinutes: state.reminderBeforeMinutes,
            addSampleMed: state.addSampleMed,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.error?.json?.message ||
          errorData?.error?.message ||
          `HTTP ${res.status}`
        );
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-card-lg space-y-6">
      {/* Top Header with Brand Lockup & Skip */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <Brand size={36} href="/dashboard" />
        <button
          type="button"
          onClick={handleSkip}
          disabled={submitting}
          aria-label="Skip for now (continue to dashboard)"
          className="text-xs font-semibold text-muted-foreground hover:text-ink-900 dark:hover:text-ink-100 transition-colors disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>

      {/* Progress Stepper Pills */}
      <div className="grid grid-cols-3 gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
        {STEP_LABELS.map((item) => {
          const isDone = item.step < step;
          const isCurrent = item.step === step;

          return (
            <div
              key={item.step}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                isCurrent && "bg-primary-tint text-primary shadow-xs",
                isDone && "bg-muted text-muted-foreground",
                !isCurrent && !isDone && "text-muted-foreground/60 bg-muted/40",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[11px] font-bold shrink-0",
                  isCurrent && "bg-primary text-white",
                  isDone && "bg-primary/20 text-primary",
                  !isCurrent && !isDone && "bg-muted-foreground/20 text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-3" strokeWidth={3} /> : item.step}
              </span>
              <span className="hidden sm:inline truncate">{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="py-2">
        {step === 1 && <ProfileStep state={state} onChange={updateState} />}
        {step === 2 && <RemindersStep state={state} onChange={updateState} />}
        {step === 3 && <FinishStep state={state} onChange={updateState} />}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Setup error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Bottom Nav Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        {step > 1 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((prev) => (prev - 1) as OnboardingWizardStep)}
            disabled={submitting}
            className="gap-2 text-xs"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </Button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <Button
            type="button"
            variant="default"
            onClick={() => setStep((prev) => (prev + 1) as OnboardingWizardStep)}
            disabled={submitting}
            className="gap-2 shadow-primary-btn"
          >
            <span>Continue</span>
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            onClick={handleComplete}
            disabled={submitting}
            className="gap-2 shadow-primary-btn"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            <span>Launch Dashboard</span>
          </Button>
        )}
      </div>
    </div>
  );
}

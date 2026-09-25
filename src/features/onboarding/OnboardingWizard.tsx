"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { api } from "@/lib/trpc";
import {
  MAX_SNOOZES_DEFAULT,
  MISSED_AFTER_DEFAULT,
  REMINDER_BEFORE_DEFAULT,
  SNOOZE_MIN_DEFAULT,
} from "@/shared/constants";
import { onboardingSchema, type OnboardingInput } from "@/shared/validations/onboarding";

import { FinishStep } from "./steps/FinishStep";
import { ProfileStep } from "./steps/ProfileStep";
import { RemindersStep } from "./steps/RemindersStep";

const STEPS = ["Profile", "Reminders", "Finish"] as const;

export function OnboardingWizard({
  userName,
  initialTimezone,
}: {
  userName: string;
  initialTimezone: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema) as Resolver<OnboardingInput>,
    defaultValues: {
      timezone: initialTimezone,
      missedAfterMinutes: MISSED_AFTER_DEFAULT,
      snoozeMinutes: SNOOZE_MIN_DEFAULT,
      maxSnoozes: MAX_SNOOZES_DEFAULT,
      reminderBeforeMinutes: REMINDER_BEFORE_DEFAULT,
      addSampleMed: false,
    },
  });

  const complete = api.onboarding.complete.useMutation();

  const canNext = step < STEPS.length - 1;

  const goNext = async () => {
    setServerError(null);
    const fields = step === 0 ? (["timezone"] as const) : (["missedAfterMinutes", "snoozeMinutes", "maxSnoozes", "reminderBeforeMinutes"] as const);
    const ok = await trigger(fields);
    if (ok) setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    setServerError(null);
    complete.mutate(getValues(), {
      onSuccess: () => {
        router.push("/dashboard");
        router.refresh();
      },
      onError: () => setServerError("Couldn't finish setting up your vault right now. Please try again."),
    });
  };

  const values = watch();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header>
        <h1 className="font-heading text-2xl font-extrabold text-ink-900">Welcome, {userName.split(" ")[0]}</h1>
        <p className="mt-2 text-muted-foreground">A few quick choices and your vault is ready.</p>
      </header>

      <nav aria-label="Onboarding steps" className="mt-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            <span
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
                i === step && "bg-primary text-primary-foreground",
                i < step && "bg-primary/15 text-primary",
                i > step && "bg-muted text-muted-foreground",
              )}
            >
              {i < step && <Check className="size-3.5" aria-hidden="true" />}
              <span>{label}</span>
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" aria-hidden="true" />}
          </span>
        ))}
      </nav>

      <div className="mt-10">
        {serverError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {step === 0 && (
          <ProfileStep
            value={values.timezone}
            error={errors.timezone?.message}
            onValueChange={(tz) => setValue("timezone", tz)}
          />
        )}
        {step === 1 && (
          <RemindersStep
            register={register}
            setValue={setValue}
            addSampleMed={values.addSampleMed}
            errors={errors}
          />
        )}
        {step === 2 && <FinishStep values={values} />}
      </div>

      <footer className="mt-10 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || complete.isPending}>
          Back
        </Button>
        {canNext ? (
          <Button type="button" onClick={goNext}>
            Next
          </Button>
        ) : (
          <Button type="button" onClick={finish} disabled={complete.isPending}>
            {complete.isPending ? "Saving…" : "Continue to dashboard"}
          </Button>
        )}
      </footer>
    </main>
  );
}
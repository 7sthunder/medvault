"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Pill } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useShell } from "@/components/layout/shell-context";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { localDateKey } from "@/shared/times";
import { medicationSchema } from "@/shared/validations/medication";

import { BasicsStep } from "./steps/BasicsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { ScheduleStep } from "./steps/ScheduleStep";
import {
  defaultSlotDrafts,
  medicationDefaultValues,
  medicationValuesFromDTO,
  parseSchedule,
  slotDraftFromDTO,
  type MedicationFormValues,
  type ScheduleIssues,
  type SlotDraft,
} from "./medication-utils";

const STEPS = ["Basics", "Schedule", "Review"] as const;

export type WizardMode = "create" | "edit";

export interface MedicationWizardProps {
  mode: WizardMode;
  medicationId?: string;
}

/**
 * §11.6 create/edit wizard — Basics → Schedule → Review, shared by `/medications/new`
 * and `/medications/[id]/edit`. Create starts from two default slots (08:00/20:00);
 * edit prefills from the loaded `MedicationDTO`. Submission validates through the
 * shared §13 schemas and posts `{ medication, schedule }` to the tRPC router.
 */
export function MedicationWizard({ mode, medicationId }: MedicationWizardProps) {
  const router = useRouter();
  const { user } = useShell();
  const [defaultStartDate] = useState(() => localDateKey(new Date(), user.timezone));

  const editQuery = api.medication.get.useQuery(
    { id: medicationId ?? "" },
    { enabled: mode === "edit" && Boolean(medicationId) },
  );
  const create = api.medication.create.useMutation();
  const update = api.medication.update.useMutation();
  const utils = api.useUtils();

  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotDraft[]>(defaultSlotDrafts);
  const [scheduleIssues, setScheduleIssues] = useState<ScheduleIssues | null>(null);
  const [unitMode, setUnitMode] = useState<"preset" | "custom">("preset");

  const {
    register,
    trigger,
    getValues,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema) as unknown as Resolver<MedicationFormValues>,
    defaultValues: medicationDefaultValues(defaultStartDate),
  });

  const loaded = editQuery.data;
  useEffect(() => {
    if (mode === "edit" && loaded) {
      reset(medicationValuesFromDTO(loaded));
      setSlots(loaded.slots.length > 0 ? loaded.slots.map(slotDraftFromDTO) : defaultSlotDrafts());
      setStep(0);
      setServerError(null);
      setScheduleIssues(null);
    }
  }, [mode, loaded, reset]);

  if (mode === "edit") {
    if (editQuery.isLoading) {
      return (
        <div className="grid gap-5">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" aria-hidden="true" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
        </div>
      );
    }
    if (!loaded) {
      return (
        <EmptyState
          icon={Pill}
          title="Medication not found"
          description="This medication could not be loaded. It may have been archived or removed."
          action={
            <Button variant="outline" onClick={() => router.push("/medications")}>
              Back to medications
            </Button>
          }
        />
      );
    }
  }

  const values = watch();
  const canNext = step < STEPS.length - 1;
  const isMutating = create.isPending || update.isPending;

  const refreshViews = () => {
    void utils.medication.list.invalidate();
    void utils.schedule.day.invalidate();
    void utils.schedule.get.invalidate();
  };

  const goNext = async () => {
    setServerError(null);
    if (step === 0) {
      const ok = await trigger([
        "name",
        "dosageAmount",
        "dosageUnit",
        "startDate",
        "endDate",
        "reminderBeforeMinutes",
      ]);
      if (ok) setStep((current) => current + 1);
    } else if (step === 1) {
      const parsed = parseSchedule(slots);
      setScheduleIssues(parsed.issues);
      if (parsed.ok) setStep((current) => current + 1);
    }
  };

  const goBack = () => {
    setServerError(null);
    setStep((current) => Math.max(0, current - 1));
  };

  const submit = () => {
    setServerError(null);
    const medication = medicationSchema.safeParse(getValues());
    const schedule = parseSchedule(slots);
    if (!medication.success || !schedule.ok || !schedule.data) {
      setScheduleIssues(schedule.issues);
      setServerError("Please review the highlighted fields and try again.");
      return;
    }

    const payload = { medication: medication.data, schedule: schedule.data };

    const onSuccess = () => {
      void refreshViews();
      toast.success(mode === "create" ? "Medication added" : "Medication updated");
      router.push(mode === "create" ? "/medications" : `/medications/${medicationId}`);
    };
    const onError = (error: unknown) =>
      setServerError(error instanceof Error ? error.message : "Couldn't save your medication right now.");

    if (mode === "create") {
      create.mutate(payload, { onSuccess, onError });
    } else if (medicationId) {
      update.mutate({ id: medicationId, ...payload }, { onSuccess, onError });
    }
  };

  return (
    <main className="mx-auto max-w-3xl">
      <header>
        <h1 className="font-heading text-2xl font-extrabold text-ink-900">
          {mode === "create" ? "Add a medication" : `Edit ${loaded?.name ?? "medication"}`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "create"
            ? "Tell us about your medication and when you take it."
            : "Update the details or schedule — future doses will be regenerated."}
        </p>
      </header>

      <nav aria-label="Wizard steps" className="mt-6 flex items-center gap-2">
        {STEPS.map((label, index) => (
          <span key={label} className="flex items-center gap-2">
            <span
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
                index === step && "bg-primary text-primary-foreground",
                index < step && "bg-primary/15 text-primary",
                index > step && "bg-muted text-muted-foreground",
              )}
            >
              {index < step && <Check className="size-3.5" aria-hidden="true" />}
              <span>{label}</span>
            </span>
            {index < STEPS.length - 1 && <span className="h-px w-6 bg-border" aria-hidden="true" />}
          </span>
        ))}
      </nav>

      <div className="mt-8">
        {serverError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {step === 0 && (
          <BasicsStep
            register={register}
            setValue={setValue}
            values={values}
            errors={errors}
            unitMode={unitMode}
            onUnitModeChange={setUnitMode}
          />
        )}
        {step === 1 && <ScheduleStep slots={slots} onChange={setSlots} issues={scheduleIssues} />}
        {step === 2 && <ReviewStep values={values} slots={slots} />}
      </div>

      <footer className="mt-10 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || isMutating}>
          Back
        </Button>
        {canNext ? (
          <Button type="button" onClick={() => void goNext()}>
            Next
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={isMutating}>
            {isMutating
              ? "Saving…"
              : mode === "create"
                ? "Add medication"
                : "Save changes"}
          </Button>
        )}
      </footer>
    </main>
  );
}
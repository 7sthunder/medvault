"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";
import { MEDICATION_COLORS } from "@/shared/colors";
import type { MedicationDTO } from "@/shared/types";
import {
  DEFAULT_MED_COLOR,
  DOSAGE_UNITS,
} from "@/shared/validations/medication";
import { ScheduleBuilder } from "./ScheduleBuilder";
import type { MedicationFormData } from "./types";

export interface MedicationFormProps {
  mode: "new" | "edit";
  initialData?: MedicationDTO;
  patientUserId?: string;
  patientName?: string;
  onSuccess?: (medId: string) => void;
}

export function MedicationForm({
  mode,
  initialData,
  patientUserId,
  patientName,
  onSuccess,
}: MedicationFormProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<MedicationFormData>(() => {
    const today = new Date().toISOString().split("T")[0] ?? "2026-03-01";
    if (initialData) {
      return {
        name: initialData.name,
        dosageAmount: initialData.dosageAmount,
        dosageUnit: initialData.dosageUnit,
        instructions: initialData.instructions ?? "",
        notes: initialData.notes ?? "",
        status: initialData.status,
        startDate: initialData.startDate,
        endDate: initialData.endDate ?? "",
        color: initialData.color ?? DEFAULT_MED_COLOR,
        remindersEnabled: initialData.remindersEnabled,
        reminderBeforeMinutes: 5,
        slots: initialData.slots.map((s) => ({
          timeOfDay: s.timeOfDay,
          daysOfWeek: [...s.daysOfWeek],
          dosageAmount: s.dosageAmount,
          instructionOverride: s.instructionOverride,
          enabled: s.enabled,
        })),
      };
    }
    return {
      name: "",
      dosageAmount: 500,
      dosageUnit: "mg",
      instructions: "",
      notes: "",
      status: "active",
      startDate: today,
      endDate: "",
      color: DEFAULT_MED_COLOR,
      remindersEnabled: true,
      reminderBeforeMinutes: 5,
      slots: [
        {
          timeOfDay: "08:00",
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          enabled: true,
        },
      ],
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = api.medication.create.useMutation({
    onSuccess: (med) => {
      toast.success(
        patientName
          ? `Medication added to ${patientName}'s schedule.`
          : "Medication added to your schedule.",
      );
      void utils.medication.list.invalidate();
      void utils.dose.today.invalidate();
      if (onSuccess) {
        onSuccess(med.id);
      } else if (patientUserId) {
        router.push("/caregiver");
      } else {
        router.push(`/medications/${med.id}`);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create medication.");
    },
  });

  const updateMutation = api.medication.update.useMutation({
    onSuccess: () => {
      toast.success("Medication updated successfully.");
      void utils.medication.list.invalidate();
      void utils.medication.get.invalidate({ id: initialData?.id ?? "" });
      void utils.dose.today.invalidate();
      router.push(`/medications/${initialData?.id}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update medication.");
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Validation functions for steps
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Medication name is required.";
    }
    if (!formData.dosageAmount || formData.dosageAmount <= 0) {
      newErrors.dosageAmount = "Dosage must be greater than 0.";
    }
    if (!formData.dosageUnit.trim()) {
      newErrors.dosageUnit = "Unit is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required.";
    }
    if (formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "End date must be after the start date.";
    }
    if (!formData.slots || formData.slots.length === 0) {
      newErrors.slots = "At least one dose time is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    const payload = {
      patientUserId,
      name: formData.name.trim(),
      dosageAmount: formData.dosageAmount,
      dosageUnit: formData.dosageUnit.trim(),
      instructions: formData.instructions.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate ? formData.endDate : undefined,
      color: formData.color,
      remindersEnabled: formData.remindersEnabled,
      reminderBeforeMinutes: formData.reminderBeforeMinutes,
      slots: formData.slots,
    };

    if (mode === "new") {
      createMutation.mutate(payload);
    } else if (mode === "edit" && initialData) {
      updateMutation.mutate({
        id: initialData.id,
        ...payload,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={
              <Link
                href={
                  patientUserId
                    ? "/caregiver"
                    : mode === "edit" && initialData
                      ? `/medications/${initialData.id}`
                      : "/medications"
                }
              />
            }
          >
            <ArrowLeft className="size-4 mr-1" />
            {mode === "edit" ? "Cancel" : patientUserId ? "Back to Caregiver" : "Medications"}
          </Button>
          <h1 className="font-heading text-2xl font-bold text-ink-900 dark:text-ink-100">
            {mode === "edit"
              ? "Edit Medication"
              : patientName
                ? `Add Medication for ${patientName}`
                : "Add Medication"}
          </h1>
        </div>
      </div>

      {/* Wizard Step Progress (only for new mode) */}
      {mode === "new" && (
        <div className="flex items-center justify-between border-b border-border pb-4">
          {[
            { num: 1, label: "Basics" },
            { num: 2, label: "Schedule" },
            { num: 3, label: "Reminders" },
            { num: 4, label: "Review" },
          ].map(({ num, label }) => {
            const isDone = step > num;
            const isCurrent = step === num;
            return (
              <div
                key={num}
                className="flex items-center gap-2"
                onClick={() => {
                  if (num < step) setStep(num);
                }}
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : isDone
                        ? "bg-primary-tint text-primary cursor-pointer"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="size-3.5" /> : num}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:inline ${
                    isCurrent
                      ? "text-ink-900 dark:text-ink-100 font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basics (or section 1 in edit mode) */}
        {(mode === "edit" || step === 1) && (
          <Card className="p-6 space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
                Medication Basics
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter the medication name, strength, and appearance.
              </p>
            </div>

            <FormField label="Medication Name" required error={errors.name}>
              <Input
                placeholder="e.g. Metformin, Lisinopril, Atorvastatin"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Dosage Amount" required error={errors.dosageAmount}>
                <Input
                  type="number"
                  min="0.1"
                  step="any"
                  placeholder="500"
                  value={formData.dosageAmount || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dosageAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </FormField>

              <FormField label="Unit" required error={errors.dosageUnit}>
                <div className="space-y-2">
                  <Input
                    placeholder="mg, ml, tablet, etc."
                    value={formData.dosageUnit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, dosageUnit: e.target.value }))
                    }
                  />
                  <div className="flex flex-wrap gap-1">
                    {DOSAGE_UNITS.map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, dosageUnit: unit }))
                        }
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                          formData.dosageUnit === unit
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </FormField>
            </div>

            {/* Pill Color Selector */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-ink-800">
                Color Tag
              </label>
              <div className="flex items-center gap-2">
                {MEDICATION_COLORS.map((c) => {
                  const isSelected = formData.color === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      title={c.name}
                      aria-label={`Color ${c.name}`}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, color: c.value }))
                      }
                      className="relative flex size-7 items-center justify-center rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c.value }}
                    >
                      {isSelected && (
                        <Check className="size-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <FormField label="Instructions" hint="e.g. Take with food or a full glass of water">
              <Input
                placeholder="Optional instructions..."
                value={formData.instructions}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, instructions: e.target.value }))
                }
              />
            </FormField>

            <FormField label="Doctor's Notes" hint="Optional notes, prescription refills, or clinical advice">
              <Textarea
                placeholder="Prescribed by Dr. ... for ..."
                rows={2}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </FormField>
          </Card>
        )}

        {/* Step 2: Schedule & Dates (or section 2 in edit mode) */}
        {(mode === "edit" || step === 2) && (
          <Card className="p-6 space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
                Schedule & Frequency
              </h2>
              <p className="text-xs text-muted-foreground">
                Set active start and end dates, and configure dose times.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Start Date" required error={errors.startDate}>
                <DatePicker
                  value={formData.startDate}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, startDate: val }))
                  }
                  aria-label="Medication start date"
                />
              </FormField>

              <FormField
                label="End Date (Optional)"
                hint="Leave empty for continuous / chronic medications"
                error={errors.endDate}
              >
                <DatePicker
                  value={formData.endDate}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, endDate: val }))
                  }
                  aria-label="Medication end date"
                />
              </FormField>
            </div>

            <div className="border-t border-border pt-4">
              <ScheduleBuilder
                slots={formData.slots}
                onChange={(slots) =>
                  setFormData((prev) => ({ ...prev, slots }))
                }
                error={errors.slots}
              />
            </div>
          </Card>
        )}

        {/* Step 3: Reminders (or section 3 in edit mode) */}
        {(mode === "edit" || step === 3) && (
          <Card className="p-6 space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
                Reminders & Notifications
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure alerts and lead time before scheduled doses.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-card-tint p-4">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                  Dose Reminders
                </span>
                <p className="text-xs text-muted-foreground">
                  Receive push notifications and in-app alerts when doses are upcoming.
                </p>
              </div>
              <Switch
                checked={formData.remindersEnabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, remindersEnabled: checked }))
                }
                aria-label="Enable dose reminders"
              />
            </div>

            {formData.remindersEnabled && (
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-ink-800">
                  Remind Me Before Dose
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { mins: 0, label: "At dose time" },
                    { mins: 5, label: "5 min before" },
                    { mins: 15, label: "15 min before" },
                    { mins: 30, label: "30 min before" },
                  ].map(({ mins, label }) => (
                    <Button
                      key={mins}
                      type="button"
                      variant={
                        formData.reminderBeforeMinutes === mins
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="w-full text-xs"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          reminderBeforeMinutes: mins,
                        }))
                      }
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Step 4: Review & Summary (only in new mode) */}
        {mode === "new" && step === 4 && (
          <Card className="p-6 space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
                Review Medication
              </h2>
              <p className="text-xs text-muted-foreground">
                Confirm your prescription details before creating the schedule.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card-tint p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className="size-4 rounded-full shrink-0"
                  style={{ backgroundColor: formData.color }}
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-heading text-base font-bold text-ink-900 dark:text-ink-100">
                    {formData.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formData.dosageAmount} {formData.dosageUnit}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border text-xs sm:grid-cols-2">
                <div className="flex items-center gap-1.5 text-ink-700 dark:text-ink-300">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span>
                    {formData.slots.length} dose{formData.slots.length > 1 ? "s" : ""}/day:{" "}
                    {formData.slots.map((s) => s.timeOfDay).join(", ")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-ink-700 dark:text-ink-300">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span>Starts: {formData.startDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink-700 dark:text-ink-300">
                  <Bell className="size-3.5 text-muted-foreground" />
                  <span>
                    Reminders:{" "}
                    {formData.remindersEnabled
                      ? `${formData.reminderBeforeMinutes}m before`
                      : "Off"}
                  </span>
                </div>
              </div>

              {formData.instructions && (
                <p className="text-xs italic text-muted-foreground pt-1">
                  &ldquo;{formData.instructions}&rdquo;
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {mode === "new" ? (
            <>
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleNext}
                  className="gap-1.5"
                >
                  <span>Next</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="size-4" />
                  <span>{isSubmitting ? "Creating..." : "Create Medication"}</span>
                </Button>
              )}
            </>
          ) : (
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/medications/${initialData?.id}`} />}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5"
              >
                <Save className="size-4" />
                <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

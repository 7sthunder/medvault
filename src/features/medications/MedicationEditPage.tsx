"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { MedicationForm } from "./MedicationForm";

export interface MedicationEditPageProps {
  id: string;
}

export function MedicationEditPage({ id }: MedicationEditPageProps) {
  const { data: medication, isLoading, error } = api.medication.get.useQuery({ id });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !medication) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" render={<Link href="/medications" />}>
          <ArrowLeft className="size-4 mr-1" />
          Back to Medications
        </Button>
        <div className="rounded-2xl border border-red/20 bg-red-tint/20 p-8 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-tint text-red">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-ink-900 dark:text-ink-100">
            Medication Not Found
          </h2>
          <p className="text-sm text-muted-foreground">
            This medication may have been deleted or does not belong to your account.
          </p>
        </div>
      </div>
    );
  }

  return <MedicationForm mode="edit" initialData={medication} />;
}

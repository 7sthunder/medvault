"use client";

import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { triggerFileDownload } from "@/lib/download";
import { api } from "@/lib/trpc";
import type { ExportScope } from "@/shared/validations/settings";

/**
 * Phase 18 — CSV export buttons (§11.14).
 *
 * The CSV itself is built server-side (the rows are only queryable there) and delivered as a
 * client-side Blob download, so the same file is produced for a real user and for a demo session.
 * `triggerFileDownload` owns the Safari-safe deferred `URL.revokeObjectURL`.
 */

const SCOPES: readonly { value: ExportScope; label: string; hint: string }[] = [
  { value: "medications", label: "Medications", hint: "Name, dose, schedule and status" },
  { value: "dose_events", label: "Dose history", hint: "Every logged taken/missed/snoozed dose" },
  { value: "all", label: "Everything", hint: "Medications and dose history in one file" },
];

export function ExportButtons() {
  const exportCsv = api.settings.exportCsv.useMutation({
    onSuccess: ({ filename, csv }) => {
      triggerFileDownload(filename, csv);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {SCOPES.map((scope) => (
        <div key={scope.value} className="rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-ink-900">{scope.label}</p>
          <p className="mt-0.5 min-h-8 text-xs text-muted-foreground">{scope.hint}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            disabled={exportCsv.isPending}
            onClick={() => exportCsv.mutate({ scope: scope.value })}
          >
            {exportCsv.isPending && exportCsv.variables?.scope === scope.value ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            Download CSV
          </Button>
        </div>
      ))}
    </div>
  );
}

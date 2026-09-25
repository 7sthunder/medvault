"use client";

import { useState } from "react";
import { FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import type { ExportDataPayload } from "@/server/domain/settings/service";

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const s = String(val).replace(/"/g, '""');
  return `"${s}"`;
}

function convertMedicationsToCsv(payload: ExportDataPayload): string {
  const headers = [
    "ID",
    "Name",
    "Dosage Amount",
    "Dosage Unit",
    "Instructions",
    "Status",
    "Start Date",
    "End Date",
    "Reminders Enabled",
    "Created At",
  ];

  const rows = payload.medications.map((m) => [
    escapeCsvCell(m.id),
    escapeCsvCell(m.name),
    escapeCsvCell(m.dosageAmount),
    escapeCsvCell(m.dosageUnit),
    escapeCsvCell(m.instructions),
    escapeCsvCell(m.status),
    escapeCsvCell(m.startDate),
    escapeCsvCell(m.endDate),
    escapeCsvCell(m.remindersEnabled),
    escapeCsvCell(m.createdAt),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function convertDoseEventsToCsv(payload: ExportDataPayload): string {
  const headers = [
    "ID",
    "Medication ID",
    "Scheduled For",
    "Missed Deadline",
    "Taken At",
    "Status",
    "Snooze Count",
    "Skipped Reason",
    "Source",
    "Status Updated At",
  ];

  const rows = payload.doseEvents.map((d) => [
    escapeCsvCell(d.id),
    escapeCsvCell(d.medicationId),
    escapeCsvCell(d.scheduledFor),
    escapeCsvCell(d.missedDeadline),
    escapeCsvCell(d.takenAt),
    escapeCsvCell(d.status),
    escapeCsvCell(d.snoozeCount),
    escapeCsvCell(d.skippedReason),
    escapeCsvCell(d.source),
    escapeCsvCell(d.statusUpdatedAt),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function ExportButtons() {
  const [isExporting, setIsExporting] = useState(false);
  const utils = api.useUtils();

  const handleExportMedsCsv = async () => {
    setIsExporting(true);
    try {
      const data = await utils.settings.exportData.fetch();
      const csv = convertMedicationsToCsv(data);
      triggerDownload(csv, `medvault-medications-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8;");
      toast.success("Medications exported successfully!");
    } catch {
      toast.error("Failed to generate medications export.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDosesCsv = async () => {
    setIsExporting(true);
    try {
      const data = await utils.settings.exportData.fetch();
      const csv = convertDoseEventsToCsv(data);
      triggerDownload(csv, `medvault-dose-events-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8;");
      toast.success("Dose history exported successfully!");
    } catch {
      toast.error("Failed to generate dose events export.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const data = await utils.settings.exportData.fetch();
      const json = JSON.stringify(data, null, 2);
      triggerDownload(json, `medvault-full-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json;charset=utf-8;");
      toast.success("Complete vault backup downloaded!");
    } catch {
      toast.error("Failed to generate full backup.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data Portability & Export
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Download your complete clinical history in standard spreadsheet and JSON formats.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isExporting}
          onClick={handleExportMedsCsv}
          className="h-auto py-3.5 flex flex-col items-center gap-1.5 justify-center border-border hover:border-primary/50"
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <FileSpreadsheet className="size-5 text-primary" />
          )}
          <span className="text-xs font-semibold">Export Medications</span>
          <span className="text-[10px] text-muted-foreground font-mono">.csv file</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isExporting}
          onClick={handleExportDosesCsv}
          className="h-auto py-3.5 flex flex-col items-center gap-1.5 justify-center border-border hover:border-primary/50"
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin text-blue-500" />
          ) : (
            <FileSpreadsheet className="size-5 text-blue-500" />
          )}
          <span className="text-xs font-semibold">Export Dose Logs</span>
          <span className="text-[10px] text-muted-foreground font-mono">.csv file</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isExporting}
          onClick={handleExportJson}
          className="h-auto py-3.5 flex flex-col items-center gap-1.5 justify-center border-border hover:border-primary/50"
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin text-amber-500" />
          ) : (
            <FileJson className="size-5 text-amber-500" />
          )}
          <span className="text-xs font-semibold">Full Vault Archive</span>
          <span className="text-[10px] text-muted-foreground font-mono">.json bundle</span>
        </Button>
      </div>
    </div>
  );
}

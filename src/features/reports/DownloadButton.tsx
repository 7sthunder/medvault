"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ReportGranularity } from "@/shared/enums";

interface DownloadButtonProps {
  from: string;
  to: string;
  granularity: ReportGranularity;
  medicationId?: string | null;
  disabled?: boolean;
}

/**
 * Phase 20 — Download CSV export button (plan §10.9, §11.11, §20).
 *
 * Requests the authenticated CSV stream from `/api/reports/export` and initiates
 * a browser file download. Displays toast notification on network/server errors.
 */
export function DownloadButton({
  from,
  to,
  granularity,
  medicationId,
  disabled = false,
}: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);

    try {
      const params = new URLSearchParams({
        from,
        to,
        granularity,
      });
      if (medicationId) {
        params.set("medicationId", medicationId);
      }

      const url = `/api/reports/export?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Export failed with HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `medvault-report-${granularity}-${from}-to-${to}.csv`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success("CSV export downloaded successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export report CSV. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={disabled || downloading}
      className="gap-2"
      aria-label="Download CSV report"
    >
      {downloading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      <span>{downloading ? "Exporting..." : "Download CSV"}</span>
    </Button>
  );
}

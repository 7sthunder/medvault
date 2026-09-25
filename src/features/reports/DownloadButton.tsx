"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * §11.11 CSV download — navigates to the authenticated CSV export route with exactly
 * the controls the current report used, so the file matches what's on screen.
 */
export function DownloadButton({
  from,
  to,
  granularity,
  medicationId,
}: {
  from: string;
  to: string;
  granularity: string;
  medicationId?: string | null;
}) {
  const [downloading, setDownloading] = useState(false);

  const params = new URLSearchParams({ from, to, granularity });
  if (medicationId) params.set("medicationId", medicationId);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/reports/export?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `medvault-report-${from}_${to}-${granularity}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed — try again in a moment.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void handleDownload()} disabled={downloading}>
      <Download className="size-4" />
      {downloading ? "Preparing…" : "Download CSV"}
    </Button>
  );
}
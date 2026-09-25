"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { triggerFileDownload } from "@/lib/download";
import { toast } from "sonner";

/**
 * §11.11 CSV download — fetches the authenticated CSV export route with exactly the controls the
 * current report used, so the file matches what's on screen. The route resolves the demo subject as
 * well as a real session, so this button works identically inside `/demo/workspace`.
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
      const res = await fetch(`/api/reports/export?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error);
      triggerFileDownload(`meditrackai-report-${from}_${to}-${granularity}.csv`, await res.blob());
    } catch {
      toast.error("Export failed — try again in a moment.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void handleDownload()}
      disabled={downloading}
    >
      <Download className="size-4" />
      {downloading ? "Preparing…" : "Download CSV"}
    </Button>
  );
}

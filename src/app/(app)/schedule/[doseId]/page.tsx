import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dose Details · MedVault" };

export default async function DoseDetailPage({
  params,
}: {
  params: Promise<{ doseId: string }>;
}) {
  const { doseId } = await params;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/schedule" />}>
          <ArrowLeft className="size-4 mr-1" />
          Schedule
        </Button>
        <h1 className="font-heading text-2xl font-bold text-ink-900 dark:text-ink-100">
          Dose Details
        </h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 space-y-2">
        <p className="text-xs text-muted-foreground uppercase font-semibold">Dose ID</p>
        <p className="font-mono text-sm">{doseId}</p>
        <p className="text-sm text-muted-foreground pt-2">
          Detailed action logs and status changes arrive in Phase 14.
        </p>
      </div>
    </div>
  );
}

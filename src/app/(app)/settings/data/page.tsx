import type { Metadata } from "next";
import { DataOverview } from "@/features/settings/DataOverview";
import { DeleteFlow } from "@/features/settings/DeleteFlow";
import { ExportButtons } from "@/features/settings/ExportButtons";

export const metadata: Metadata = {
  title: "Data & Privacy Settings · MedVault",
  description: "Export clinical logs, manage vault backups, and data governance.",
};

export default function DataSettingsPage() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-8">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">
          Vault Data & Privacy
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          View your clinical record counts, download full compliance exports, or reset your vault data.
        </p>
      </div>

      <DataOverview />
      <ExportButtons />
      <DeleteFlow />
    </div>
  );
}

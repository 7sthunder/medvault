import type { Metadata } from "next";
import { AdherenceOverviewPage } from "@/features/adherence/AdherenceOverviewPage";

export const metadata: Metadata = {
  title: "Adherence Analytics · MedVault",
  description: "Monitor regimen adherence rates, consecutive streaks, and dose trends.",
};

export default function AdherencePage() {
  return <AdherenceOverviewPage />;
}

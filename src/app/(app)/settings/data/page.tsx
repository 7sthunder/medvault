import type { Metadata } from "next";

import { DataOverview } from "@/features/settings/DataOverview";

export const metadata: Metadata = { title: "Your data" };

export default function DataPage() {
  return <DataOverview />;
}

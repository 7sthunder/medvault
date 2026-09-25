import type { Metadata } from "next";

import { AdherencePage } from "@/features/adherence/AdherencePage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Adherence" };

export default async function AdherenceRoute() {
  await requireUser();
  return <AdherencePage />;
}
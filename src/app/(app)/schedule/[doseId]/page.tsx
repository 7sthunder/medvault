import type { Metadata } from "next";

import { DoseDetailPage } from "@/features/dose/DoseDetailPage";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Dose details" };

export default async function DoseDetailRoute({ params }: { params: Promise<{ doseId: string }> }) {
  await requireUser();
  const { doseId } = await params;

  return <DoseDetailPage doseIdPromise={Promise.resolve(doseId)} />;
}

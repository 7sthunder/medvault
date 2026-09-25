import type { Metadata } from "next";
import { AcceptInvite } from "@/features/caregiver/AcceptInvite";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = {
  title: "Accept Caregiver Invitation · MedVault",
  description: "Connect to a loved one's vault to monitor adherence and receive urgent alerts.",
};

export default async function CaregiverAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const returnPath = token ? `/caregiver/accept?token=${encodeURIComponent(token)}` : "/caregiver/accept";

  await requireUser(returnPath);

  return <AcceptInvite />;
}

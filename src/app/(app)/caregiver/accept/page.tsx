import type { Metadata } from "next";

import { AcceptInvite } from "@/features/caregiver/AcceptInvite";
import { requireUser } from "@/server/auth/require-user";

export const metadata: Metadata = { title: "Accept caregiver invitation" };

export default async function AcceptCaregiverRoutePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawToken = params.token;
  const token = (Array.isArray(rawToken) ? rawToken[0] : rawToken)?.trim() ?? "";
  const nextPath = token
    ? `/caregiver/accept?token=${encodeURIComponent(token)}`
    : "/caregiver/accept";

  await requireUser(nextPath);

  return <AcceptInvite token={token} nextPath={nextPath} />;
}

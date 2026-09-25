"use client";

import Link from "next/link";
import { ArrowLeft, Link2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { PermissionsEditor } from "./PermissionsEditor";

export function AcceptInvite({ token, nextPath }: { token: string; nextPath?: string }) {
  const { user } = useShell();
  const router = useRouter();
  const utils = api.useUtils();
  const destination = nextPath ?? (token ? `/caregiver/accept?token=${encodeURIComponent(token)}` : "/caregiver/accept");
  const preview = api.caregiver.preview.useQuery(
    { token },
    { enabled: token.length > 0, staleTime: 15_000, retry: false },
  );
  const accept = api.caregiver.accept.useMutation({
    onSuccess: (relationship) => {
      toast.success(`You're now caring for ${relationship.patientName}.`);
      void utils.caregiver.overview.invalidate();
      router.push("/caregiver");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  if (!token) {
    return (
      <main className="mx-auto max-w-2xl">
        <BackLink />
        <EmptyState
          className="mt-8"
          icon={Link2}
          title="Invitation link is incomplete"
          description="Ask the person who invited you to send a new caregiver invitation link."
          action={
            <Link href="/caregiver">
              <Button variant="outline">Back to caregiver</Button>
            </Link>
          }
        />
        <AuthLinks nextPath={destination} />
      </main>
    );
  }

  if (preview.isLoading) {
    return <AcceptInviteSkeleton />;
  }

  if (preview.isError) {
    return (
      <main className="mx-auto max-w-2xl">
        <BackLink />
        <ErrorState
          className="mt-8"
          title="Couldn't load this invitation"
          description="The invitation could not be checked right now. Try again in a moment."
          action={
            <Button variant="outline" onClick={() => void preview.refetch()}>
              Try again
            </Button>
          }
        />
        <AuthLinks nextPath={destination} />
      </main>
    );
  }

  if (!preview.data) {
    return (
      <main className="mx-auto max-w-2xl">
        <BackLink />
        <EmptyState
          className="mt-8"
          icon={Link2}
          title="Invitation unavailable"
          description="This invitation is invalid, expired, or has already been used. Ask for a new link to continue."
          action={
            <Link href="/caregiver">
              <Button variant="outline">Back to caregiver</Button>
            </Link>
          }
        />
        <AuthLinks nextPath={destination} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl">
      <BackLink />
      <header className="mt-6">
        <SectionLabel tone="violet" leading={<ShieldCheck className="size-3.5" aria-hidden="true" />}>
          Caregiver invitation
        </SectionLabel>
        <h1 className="mt-1 font-heading text-2xl font-extrabold text-ink-900">Care for {preview.data.patientName}?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review the access below before connecting.</p>
      </header>

      <Card className="mt-6 shadow-card-sm">
        <CardHeader>
          <CardTitle>Invitation from {preview.data.patientName}</CardTitle>
          <CardDescription>
            This invitation expires {formatDateTime(preview.data.expiresAt, user.timezone)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {preview.data.message && (
            <div className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-ink-800">
              <p className="mb-1 text-xs font-semibold tracking-wide text-primary-dark uppercase">Message</p>
              <p>“{preview.data.message}”</p>
            </div>
          )}

          <section aria-labelledby="invite-access-heading">
            <SectionLabel tone="blue">Access granted</SectionLabel>
            <h2 id="invite-access-heading" className="mt-1 text-sm font-semibold text-ink-900">
              What this caregiver can see
            </h2>
            <div className="mt-3 rounded-xl border border-border bg-background p-3">
              <PermissionsEditor permissions={preview.data.permissions} onChange={() => undefined} disabled />
            </div>
          </section>

          {accept.isError && (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t accept invitation</AlertTitle>
              <AlertDescription>{accept.error?.message ?? "Please try again."}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/caregiver">
              <Button type="button" variant="outline" disabled={accept.isPending}>
                Not now
              </Button>
            </Link>
            <Button type="button" onClick={() => accept.mutate({ token })} disabled={accept.isPending}>
              {accept.isPending ? "Accepting…" : "Accept invitation"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <AuthLinks nextPath={destination} />
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/caregiver"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-ink-800"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to caregiver
    </Link>
  );
}

function AuthLinks({ nextPath }: { nextPath: string }) {
  const query = `?next=${encodeURIComponent(nextPath)}`;
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Need to use another account? <Link className="font-semibold text-primary hover:underline" href={`/login${query}`}>Log in</Link> or <Link className="font-semibold text-primary hover:underline" href={`/register${query}`}>Register</Link>.
    </p>
  );
}

function formatDateTime(value: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function AcceptInviteSkeleton() {
  return (
    <main className="mx-auto max-w-2xl">
      <Skeleton className="h-5 w-36 rounded-md" />
      <Skeleton className="mt-6 h-8 w-72 max-w-full rounded-md" />
      <Skeleton className="mt-2 h-5 w-64 max-w-full rounded-md" />
      <Skeleton className="mt-6 h-96 rounded-xl" />
    </main>
  );
}

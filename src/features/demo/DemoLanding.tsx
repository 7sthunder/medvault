"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Check,
  FlaskConical,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoClockBadge } from "@/features/demo/DemoDock";
import { api, TRPCProvider } from "@/lib/trpc";
import { BRAND } from "@/shared/brand";

/**
 * Phase 18 - `/demo` landing (plan 10.8, 11.16).
 *
 * Signed-out entry point: pressing "Enter the demo" calls `demo.enter`, which seeds the workspace
 * and issues the scoped cookie, then hands off to `/demo/workspace`. The page is honest about what
 * the demo is before the click, because health data deserves a clear label.
 *
 * The tRPC provider is mounted here rather than inherited: this is a marketing page with no
 * `AppShell`, and `demo.enter` is the call that mints the httpOnly demo cookie.
 */
const HIGHLIGHTS = [
  {
    icon: CalendarClock,
    title: "A schedule that already exists",
    body: "Four medications, six weeks of history, and a live day view you can take, snooze or skip right away.",
  },
  {
    icon: BarChart3,
    title: "Charts you can move",
    body: "Reshape the last 14 days into a declining or recovering pattern and watch adherence recalculate.",
  },
  {
    icon: Sparkles,
    title: "Insights from real data",
    body: "Generate an adherence insight from the same pipeline a real account uses, including the afternoon-miss pattern.",
  },
  {
    icon: Users,
    title: "The caregiver loop",
    body: "Link a demo caregiver and raise a genuine missed-dose alert, then work it through as the caregiver.",
  },
];

const SIMULATIONS = [
  "Take, miss, skip or snooze the next due dose",
  "Move the clock a day forward or backward",
  "Reshape 14 days into a decline or a recovery",
  "Raise a real caregiver missed-dose alert",
  "Generate a real adherence insight",
  "Reset the workspace to its starting state",
];

export function DemoLanding() {
  return (
    <TRPCProvider>
      <DemoLandingView />
    </TRPCProvider>
  );
}

/**
 * Split from the provider: `useMutation` is called in this component's body, which Next also
 * executes when it server-renders the page, so the provider has to sit one level up. Folding them
 * together renders fine in the browser and throws "Unable to find tRPC Context" on the server.
 */
function DemoLandingView() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const enter = api.demo.enter.useMutation({
    onSuccess: () => {
      router.push("/demo/workspace/dashboard");
      router.refresh();
    },
    onError: (error) => {
      setEntering(false);
      toast.error(error.message);
    },
  });

  const start = () => {
    setEntering(true);
    enter.mutate();
  };

  const cta = entering ? "Preparing your workspace..." : "Enter the demo";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
          <FlaskConical className="size-3.5" aria-hidden />
          Sample data
        </span>
        <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          Try {BRAND.name} with someone else&apos;s data
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
          A complete, pre-filled workspace you can simulate against. No sign-up, nothing saved to
          your account, and a floating dock to make things happen on demand.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button id="enter" size="lg" disabled={entering} onClick={start}>
            {cta}
          </Button>
          <DemoClockBadge />
        </div>
      </header>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold">This is not a medical record.</span> The workspace belongs
          to a shared demo user, and every action you take is visible to anyone else exploring the
          demo at the same time. Reset it any time from the dock.
        </p>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="shadow-card-sm">
              <CardHeader>
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-tint text-primary-dark">
                  <Icon className="size-4" aria-hidden />
                </span>
                <CardTitle className="pt-2 text-ink-900">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.body}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-8 rounded-xl border border-border bg-muted/40 px-4 py-4">
        <h2 className="text-sm font-semibold text-ink-900">What you can simulate</h2>
        <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
          {SIMULATIONS.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
        <Button className="mt-4" disabled={entering} onClick={start}>
          {cta}
        </Button>
      </section>
    </main>
  );
}

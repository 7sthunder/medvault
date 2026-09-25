"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

import { api } from "@/lib/trpc";
import { now as sharedNow, resetNowImpl, setNowImpl } from "@/shared/times";

/**
 * Phase 19 — the *client* half of the demo clock.
 *
 * `src/shared/times.ts` already routes every "now" through an indirection, but that state lives in
 * the module instance of whichever bundle is executing. The server installs the simulated instant
 * (`setNowImpl`) while rendering; the browser got a fresh module instance and therefore always saw
 * the real wall clock. That is why the dashboard hero, schedule page, reports window and dose
 * invalidation keys all disagreed with the server the moment the demo clock moved.
 *
 * This provider closes that gap: it mirrors the server's simulated instant into the browser's own
 * `now()` implementation and publishes it through context so React components re-render when the
 * simulation advances. It subscribes to `demo.simulationNow` so the dock's "1 day" / "Real time"
 * controls move the UI clock immediately (`utils.invalidate()` in the dock refreshes it for free).
 */

export interface ClockState {
  /** Current instant — simulated in the demo, real everywhere else. */
  now: Date;
  /** True when `now` is a simulated instant rather than the wall clock. */
  isSimulated: boolean;
}

const ClockContext = createContext<ClockState | null>(null);

export function ClockProvider({
  enabled,
  initialSimulationNow,
  children,
}: {
  /** Only the demo shell subscribes; the signed-in app never queries the demo router. */
  enabled: boolean;
  /** Server-resolved instant, so the first paint already matches the server's "today". */
  initialSimulationNow?: Date | null;
  children: ReactNode;
}) {
  const query = api.demo.simulationNow.useQuery(undefined, { enabled });
  // Tracked as a timestamp so a refetch returning an equal instant does not churn the context.
  // `undefined` means "no answer yet" (query not resolved, or demo disabled) and must never
  // overwrite the server-resolved initial value; `null` is a real answer meaning "clock released".
  const remoteMs =
    !enabled || query.data === undefined
      ? undefined
      : query.data.simulationNow
        ? new Date(query.data.simulationNow).getTime()
        : null;

  // Fully derived. `remoteMs` already distinguishes "the server has not answered" (`undefined`)
  // from a real answer, and nothing else writes this value, so mirroring it into state and copying
  // it across in an effect was pure overhead — and a cascading render on every refetch.
  const simulatedMs =
    remoteMs === undefined
      ? initialSimulationNow
        ? new Date(initialSimulationNow).getTime()
        : null
      : remoteMs;

  // Keep the shared indirection in step so non-React client code (formatters, event handlers
  // outside the tree) sees the same instant the components render.
  useEffect(() => {
    if (simulatedMs === null) {
      resetNowImpl();
      return;
    }
    const at = new Date(simulatedMs);
    setNowImpl(() => at);
  }, [simulatedMs]);

  const value = useMemo<ClockState>(
    () =>
      simulatedMs === null
        ? { now: new Date(), isSimulated: false }
        : { now: new Date(simulatedMs), isSimulated: true },
    [simulatedMs],
  );

  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
}

/**
 * Current instant for a client component. Falls back to the shared `now()` outside a provider so
 * isolated component tests and the `/demo` landing page (no `AppShell`) keep working.
 */
export function useNow(): Date {
  const ctx = useContext(ClockContext);
  return ctx ? ctx.now : sharedNow();
}

export function useClock(): ClockState {
  const ctx = useContext(ClockContext);
  return ctx ?? { now: sharedNow(), isSimulated: false };
}

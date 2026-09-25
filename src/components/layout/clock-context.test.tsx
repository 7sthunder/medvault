/* @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * `queryState.data === undefined` models "the tRPC query has not resolved yet", which is what the
 * real hook returns before the first successful fetch. That distinction matters: the component must
 * not treat "no answer yet" as "the clock was released".
 */
const queryState = vi.hoisted(() => ({
  data: undefined as { simulationNow: Date | null } | undefined,
  seenEnabled: [] as boolean[],
}));

vi.mock("@/lib/trpc", () => ({
  api: {
    demo: {
      simulationNow: {
        useQuery: (_input: unknown, opts: { enabled: boolean }) => {
          queryState.seenEnabled.push(opts.enabled);
          return { data: opts.enabled ? queryState.data : undefined };
        },
      },
    },
  },
}));

import { ClockProvider, useClock } from "@/components/layout/clock-context";
import { now as sharedNow, resetNowImpl } from "@/shared/times";

function Probe() {
  const { now, isSimulated } = useClock();
  return (
    <div>
      <span data-testid="iso">{now.toISOString()}</span>
      <span data-testid="simulated">{String(isSimulated)}</span>
      <span data-testid="shared">{sharedNow().toISOString()}</span>
    </div>
  );
}

const SIMULATED = new Date("2026-03-10T08:00:00.000Z");

function renderClock(props: { enabled: boolean; initialSimulationNow?: Date | null }) {
  return render(
    <ClockProvider enabled={props.enabled} initialSimulationNow={props.initialSimulationNow}>
      <Probe />
    </ClockProvider>,
  );
}

describe("ClockProvider", () => {
  it("uses the real clock and disables the demo query outside the demo shell", () => {
    queryState.data = { simulationNow: SIMULATED };
    renderClock({ enabled: false });

    expect(queryState.seenEnabled).toContain(false);
    expect(screen.getByTestId("simulated").textContent).toBe("false");
    const rendered = new Date(screen.getByTestId("iso").textContent!).getTime();
    expect(Math.abs(rendered - Date.now())).toBeLessThan(5_000);
  });

  it("publishes the server-resolved instant on first paint, before the query resolves", () => {
    queryState.data = undefined;
    renderClock({ enabled: true, initialSimulationNow: SIMULATED });

    expect(screen.getByTestId("iso").textContent).toBe(SIMULATED.toISOString());
    expect(screen.getByTestId("simulated").textContent).toBe("true");
  });

  it("installs the simulation into the shared now() so non-React code agrees", () => {
    queryState.data = undefined;
    renderClock({ enabled: true, initialSimulationNow: SIMULATED });

    expect(sharedNow().toISOString()).toBe(SIMULATED.toISOString());
    expect(screen.getByTestId("shared").textContent).toBe(SIMULATED.toISOString());
    resetNowImpl();
  });

  it("adopts the instant the dock pushed, without a prop change", () => {
    queryState.data = undefined;
    const view = renderClock({ enabled: true, initialSimulationNow: SIMULATED });

    const advanced = new Date("2026-03-12T08:00:00.000Z");
    queryState.data = { simulationNow: advanced };
    view.rerender(
      <ClockProvider enabled initialSimulationNow={SIMULATED}>
        <Probe />
      </ClockProvider>,
    );

    expect(screen.getByTestId("iso").textContent).toBe(advanced.toISOString());
    expect(sharedNow().toISOString()).toBe(advanced.toISOString());
    resetNowImpl();
  });

  it("returns to the real clock when the simulation is released", () => {
    queryState.data = undefined;
    const view = renderClock({ enabled: true, initialSimulationNow: SIMULATED });

    queryState.data = { simulationNow: null };
    view.rerender(
      <ClockProvider enabled initialSimulationNow={SIMULATED}>
        <Probe />
      </ClockProvider>,
    );

    expect(screen.getByTestId("simulated").textContent).toBe("false");
    expect(
      Math.abs(new Date(screen.getByTestId("iso").textContent!).getTime() - Date.now()),
    ).toBeLessThan(5_000);
    resetNowImpl();
  });

  it("useClock() works without a provider via the shared indirection", () => {
    queryState.data = undefined;
    resetNowImpl();
    render(<Probe />);
    expect(screen.getByTestId("simulated").textContent).toBe("false");
  });
});

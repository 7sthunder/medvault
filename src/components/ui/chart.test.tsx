/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { TrendChart, type TrendChartProps } from "@/components/ui/chart";

beforeEach(() => {
  // Recharts ResponsiveContainer measures its host element via ResizeObserver.
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    static takeRecords() {
      return [];
    }
  }
  Object.defineProperty(globalThis, "ResizeObserver", {
    value: ResizeObserverStub,
    writable: true,
  });
  // Element with a fixed size so the chart lays out + renders an <svg>.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 600,
    bottom: 240,
    width: 600,
    height: 240,
    toJSON: () => ({}),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const SERIES = [
  { key: "taken", name: "Taken" },
  { key: "missed", name: "Missed" },
];

function renderChart(props: Partial<TrendChartProps> = {}) {
  return render(
    <TrendChart data={[]} xKey="day" series={SERIES} formatValue={(v) => `${v}%`} {...props} />,
  );
}

describe("TrendChart", () => {
  it("renders an empty state instead of a blank canvas when data is empty", () => {
    renderChart();
    expect(screen.getByText("No data in this range")).toBeTruthy();
    expect(
      screen.getByText("Expand the date range or add medications to see trends here."),
    ).toBeTruthy();
    expect(
      screen.queryByText("Expand the date range or add medications to see trends here."),
    ).toBeTruthy();
  });

  it("accepts custom empty-state copy", () => {
    renderChart({ emptyTitle: "No adherence yet", emptyDescription: "Start logging doses." });
    expect(screen.getByText("No adherence yet")).toBeTruthy();
    expect(screen.getByText("Start logging doses.")).toBeTruthy();
  });

  it("renders an SVG when data is present (area, default)", async () => {
    renderChart({
      data: [
        { day: "05-14", taken: 88, missed: 12 },
        { day: "05-15", taken: 96, missed: 4 },
      ],
    });
    await waitFor(() => expect(document.querySelector("svg")).toBeTruthy());
    expect(screen.queryByText("No data in this range")).toBeNull();
  });
});

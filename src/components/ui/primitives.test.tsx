/* @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Pill, BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ListRow } from "@/components/ui/list-row";
import { SectionLabel } from "@/components/ui/section-label";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { TimePicker } from "@/components/ui/time-picker";
import { DatePicker } from "@/components/ui/date-picker";

describe("Phase 03 custom primitives (smoke)", () => {
  it("renders Chip with tone data attribute + content", () => {
    const { getByText, getByTestId } = render(
      <span data-testid="chip-host"><Chip tone="magenta">Chronic</Chip></span>,
    );
    expect(getByText("Chronic")).toBeTruthy();
    expect(getByTestId("chip-host").querySelector("[data-slot='chip']")?.getAttribute("data-tone")).toBe("magenta");
  });

  it("renders SectionLabel kicker with uppercase tracking classes", () => {
    const { getByText } = render(<SectionLabel tone="cyan">Insights</SectionLabel>);
    const el = getByText("Insights");
    expect(el.className).toContain("text-[13px]");
    expect(el.className).toContain("tracking-[0.12em]");
    expect(el.className).toContain("uppercase");
  });

  it("renders StatCard with value + accessory tile", () => {
    const { getByText } = render(
      <StatCard title="Doses today" value="6" icon={BellRing} subtitle="1 due now" />,
    );
    expect(getByText("Doses today")).toBeTruthy();
    expect(getByText("6")).toBeTruthy();
    expect(getByText("1 due now")).toBeTruthy();
  });

  it("ListRow is a button when onClick is set (a11y)", () => {
    const { getByText } = render(
      <ListRow icon={Pill} title="Metformin 500mg" right={<StatusBadge status="taken" />} onClick={() => {}} />,
    );
    const row = getByText("Metformin 500mg").closest("[data-slot='list-row']");
    expect(row?.getAttribute("role")).toBe("button");
    expect(row?.getAttribute("tabindex")).toBe("0");
    // trailing slot accepts the a11y status badge (§12)
    expect(row?.querySelector("span[role='img']")).toBeTruthy();
  });

  it("ListRow renders as a plain div when not interactive", () => {
    const { getByText } = render(<ListRow icon={Pill} title="Static row" />);
    const row = getByText("Static row").closest("[data-slot='list-row']");
    expect(row?.getAttribute("role")).toBeNull();
    expect(row?.getAttribute("tabindex")).toBeNull();
  });

  it("EmptyState + ErrorState expose title + role", () => {
    const { getByText } = render(
      <EmptyState icon={Pill} title="No medications yet" description="Add one." />,
    );
    expect(getByText("No medications yet")).toBeTruthy();

    const err = render(<ErrorState title="Failed to load" />);
    const alert = err.getByRole("alert");
    expect(alert.textContent).toContain("Failed to load");
  });

  it("time/date pickers keep the native input for a11y", () => {
    const { getByLabelText } = render(<TimePicker aria-label="Pick time" />);
    const time = getByLabelText("Pick time");
    expect(time.tagName).toBe("INPUT");
    expect(time.getAttribute("type")).toBe("time");

    const { getByLabelText: getDate } = render(<DatePicker aria-label="Pick date" />);
    expect(getDate("Pick date").getAttribute("type")).toBe("date");
  });

  it("Button renders the Stitch default + secondary variants", () => {
    const { container } = render(
      <>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
      </>,
    );
    const buttons = Array.from(container.querySelectorAll("[data-slot='button']"));
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.className).toContain("bg-primary");
    expect(buttons[1]?.className).toContain("bg-background");
  });
});
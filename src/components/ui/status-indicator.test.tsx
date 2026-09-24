/* @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { StatusBadge } from "@/components/ui/status-badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { DOSE_STATUSES, DOSE_STATUS_META, isDoseStatus } from "@/shared/status";

describe("dose statuses (§12)", () => {
  it("status table covers exactly the 8 §12 states", () => {
    expect(DOSE_STATUSES).toHaveLength(8);
    const labels = DOSE_STATUSES.map((s) => DOSE_STATUS_META[s].label);
    expect(labels).toEqual([
      "Taken",
      "Upcoming",
      "Due Now",
      "Missed",
      "Skipped",
      "Snoozed",
      "Paused",
      "Canceled",
    ]);
  });

  it("isDoseStatus guards only known states", () => {
    expect(isDoseStatus("missed")).toBe(true);
    expect(isDoseStatus("archived")).toBe(false);
  });

  for (const status of DOSE_STATUSES) {
    const meta = DOSE_STATUS_META[status];

    it(`StatusIndicator exposes '${meta.aria}' (icon + label + aria) for ${status}`, () => {
      const { getByRole, getByText } = render(<StatusIndicator status={status} />);
      const el = getByRole("img", { name: meta.aria });
      expect(el).toBeTruthy();
      expect(getByText(meta.label)).toBeTruthy();
      // icon present: two svg/circle children at minimum on tint badges
      expect(el.querySelectorAll("*[aria-hidden='true']").length).toBeGreaterThan(0);
    });

    it(`StatusBadge renders train-readable chip for '${status}'`, () => {
      const { getByRole, getByText } = render(<StatusBadge status={status} />);
      const chip = getByRole("img", { name: meta.aria });
      expect(chip).toBeTruthy();
      expect(getByText(meta.label)).toBeTruthy();
      expect(chip.dataset.status).toBe(status);
      // §12: colour always accompanies icon + text, never substitutes them.
      expect(meta.tone).toBeTruthy();
      expect(meta.Icon).toBeTruthy();
    });
  }
});
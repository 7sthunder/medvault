/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { RangePicker, type DateRange } from "@/components/ui/range-picker";

const NOW = new Date("2026-05-20T12:00:00.000Z");
const TZ = "UTC";

const LAST_7D: DateRange = { from: "2026-05-14", to: "2026-05-20" };

function stubMatchMedia(matchesAll: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matchesAll ? true : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderPicker(current: DateRange, onChange = () => {}) {
  return render(<RangePicker value={current} onChange={onChange} timeZone={TZ} now={NOW} />);
}

describe("RangePicker (desktop, inline)", () => {
  it("detects the matching preset for the current range", () => {
    renderPicker(LAST_7D);
    const seven = screen.getByRole("button", { name: "Last 7 days" });
    expect(seven.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Last 30 days" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    // Custom date inputs stay hidden until "Custom range" is chosen.
    expect(screen.queryByLabelText("From date")).toBeNull();
  });

  it("applies a preset via shared rangeByPreset math", () => {
    const onChange = vi.fn();
    renderPicker({ from: "2026-01-01", to: "2026-01-10" }, onChange);
    fireEvent.click(screen.getByRole("button", { name: "Last 7 days" }));
    expect(onChange).toHaveBeenCalledWith(LAST_7D);
  });

  it("does not fire onChange for a redundant selection", () => {
    const onChange = vi.fn();
    renderPicker(LAST_7D, onChange);
    fireEvent.click(screen.getByRole("button", { name: "Last 7 days" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reveals custom date inputs and reports edits", () => {
    const onChange = vi.fn();
    renderPicker(LAST_7D, onChange);
    fireEvent.click(screen.getByRole("button", { name: "Custom range" }));
    expect(screen.getByLabelText("From date")).toBeTruthy();
    expect(screen.getByLabelText("To date")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-05-01" } });
    expect(onChange).toHaveBeenCalledWith({ from: "2026-05-01", to: "2026-05-20" });
  });
});

describe("RangePicker (mobile, drawer)", () => {
  beforeEach(() => stubMatchMedia(true));

  it("renders a bottom-sheet trigger with the current summary", () => {
    renderPicker(LAST_7D);
    expect(screen.getByRole("button", { name: /May 14 – May 20, 2026/i })).toBeTruthy();
  });
});

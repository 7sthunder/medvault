/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  announceToLiveRegion,
  focusRingClass,
  formatAccessibleDoseStatus,
  skipLinkClass,
  usePrefersReducedMotion,
  visuallyHiddenClass,
} from "./a11y";

describe("Phase 26 — Accessibility Utilities (a11y.ts)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.documentElement.removeAttribute("data-reduce-motion");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exports valid accessibility CSS classes", () => {
    expect(visuallyHiddenClass).toBe("sr-only");
    expect(focusRingClass).toContain("focus-visible:ring-2");
    expect(skipLinkClass).toContain("sr-only");
    expect(skipLinkClass).toContain("focus:not-sr-only");
  });

  describe("formatAccessibleDoseStatus", () => {
    it("formats taken status clearly", () => {
      const res = formatAccessibleDoseStatus("taken", "Metformin", "08:00 AM");
      expect(res).toBe("Metformin scheduled for 08:00 AM: Taken as prescribed.");
    });

    it("formats missed status with action indicator", () => {
      const res = formatAccessibleDoseStatus("missed", "Lisinopril", "09:00 AM");
      expect(res).toBe("Lisinopril scheduled for 09:00 AM: Missed dose. Action required.");
    });

    it("formats due-now status prompting user action", () => {
      const res = formatAccessibleDoseStatus("due-now", "Vitamin D", "10:00 AM");
      expect(res).toBe("Vitamin D scheduled for 10:00 AM: Due now. Please take dose.");
    });

    it("formats snoozed and skipped statuses", () => {
      expect(formatAccessibleDoseStatus("snoozed", "Aspirin")).toBe(
        "Aspirin: Temporarily snoozed.",
      );
      expect(formatAccessibleDoseStatus("skipped", "Aspirin")).toBe(
        "Aspirin: Skipped.",
      );
    });
  });

  describe("announceToLiveRegion", () => {
    it("creates polite aria-live element and updates message", async () => {
      vi.useFakeTimers();

      announceToLiveRegion("Dose marked as taken", "polite");

      const region = document.getElementById("aria-live-polite-region");
      expect(region).toBeDefined();
      expect(region?.getAttribute("aria-live")).toBe("polite");

      vi.advanceTimersByTime(100);
      expect(region?.textContent).toBe("Dose marked as taken");

      vi.useRealTimers();
    });

    it("creates assertive aria-live element for urgent alerts", async () => {
      vi.useFakeTimers();

      announceToLiveRegion("Missed dose alert dispatched", "assertive");

      const region = document.getElementById("aria-live-assertive-region");
      expect(region).toBeDefined();
      expect(region?.getAttribute("aria-live")).toBe("assertive");

      vi.advanceTimersByTime(100);
      expect(region?.textContent).toBe("Missed dose alert dispatched");

      vi.useRealTimers();
    });
  });

  describe("usePrefersReducedMotion", () => {
    it("defaults to false when system media query does not match", () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(false);
    });

    it("returns true when data-reduce-motion='true' is set on documentElement", () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      document.documentElement.setAttribute("data-reduce-motion", "true");

      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(true);
    });
  });
});

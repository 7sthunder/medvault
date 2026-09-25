/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DoseEventDTO } from "@/shared/types";
import { DoseCard } from "./DoseCard";
import { ScheduleFilterTabs } from "./ScheduleFilterTabs";
import { ScheduleProgressCard } from "./ScheduleProgressCard";
import { SkipDialog } from "./SkipDialog";
import { SnoozeDialog } from "./SnoozeDialog";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

describe("Phase 14 — Schedule UI Components", () => {
  const sampleDose: DoseEventDTO = {
    id: "dose-1",
    medicationId: "med-1",
    scheduleId: "slot-1",
    scheduledFor: new Date("2026-03-01T08:00:00Z"),
    status: "due",
    missedDeadline: new Date("2026-03-01T08:30:00Z"),
    takenAt: null,
    skippedAt: null,
    skippedReason: null,
    snoozeCount: 0,
    snoozeUntil: null,
    statusUpdatedAt: new Date("2026-03-01T08:00:00Z"),
    source: "generated",
    medication: {
      id: "med-1",
      name: "Metformin",
      dosageAmount: 500,
      dosageUnit: "mg",
      color: "var(--color-emerald-500)",
      archivedAt: null,
    },
  };

  describe("DoseCard", () => {
    it("renders medication information, time, and action buttons for due doses", () => {
      const onTake = vi.fn();
      const onOpenSnooze = vi.fn();
      const onOpenSkip = vi.fn();

      render(
        <DoseCard
          dose={sampleDose}
          onTake={onTake}
          onOpenSnooze={onOpenSnooze}
          onOpenSkip={onOpenSkip}
        />,
      );

      expect(screen.getByText("Metformin")).toBeInTheDocument();
      expect(screen.getByText("500 mg")).toBeInTheDocument();
      expect(screen.getByText("Take")).toBeInTheDocument();
      expect(screen.getByText("Snooze")).toBeInTheDocument();
      expect(screen.getByText("Skip")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Take"));
      expect(onTake).toHaveBeenCalledWith("dose-1");

      fireEvent.click(screen.getByText("Snooze"));
      expect(onOpenSnooze).toHaveBeenCalledWith(sampleDose);

      fireEvent.click(screen.getByText("Skip"));
      expect(onOpenSkip).toHaveBeenCalledWith(sampleDose);
    });

    it("displays taken state with timestamp and hides action buttons", () => {
      const takenDose: DoseEventDTO = {
        ...sampleDose,
        status: "taken",
        takenAt: new Date("2026-03-01T08:05:00Z"),
      };

      render(
        <DoseCard
          dose={takenDose}
          onTake={vi.fn()}
          onOpenSnooze={vi.fn()}
          onOpenSkip={vi.fn()}
        />,
      );

      expect(screen.queryByText("Take")).not.toBeInTheDocument();
      expect(screen.queryByText("Snooze")).not.toBeInTheDocument();
      expect(screen.getByText(/Taken at/i)).toBeInTheDocument();
    });

    it("displays 'Take Late' button for missed doses", () => {
      const missedDose: DoseEventDTO = {
        ...sampleDose,
        status: "missed",
      };

      render(
        <DoseCard
          dose={missedDose}
          onTake={vi.fn()}
          onOpenSnooze={vi.fn()}
          onOpenSkip={vi.fn()}
        />,
      );

      expect(screen.getByText("Take Late")).toBeInTheDocument();
      // Skipping missed doses is disallowed
      expect(screen.queryByText("Skip")).not.toBeInTheDocument();
    });
  });

  describe("SnoozeDialog", () => {
    it("renders snooze dialog and triggers onConfirm on button click", async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onOpenChange = vi.fn();

      render(
        <SnoozeDialog
          open={true}
          onOpenChange={onOpenChange}
          dose={sampleDose}
          onConfirm={onConfirm}
        />,
      );

      expect(screen.getByText(/Snooze Metformin/i)).toBeInTheDocument();
      expect(screen.getByText(/Snooze 10 min/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Snooze 10 min/i));
      expect(onConfirm).toHaveBeenCalledWith("dose-1");
    });
  });

  describe("SkipDialog", () => {
    it("renders skip reasons and submits selected reason", async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onOpenChange = vi.fn();

      render(
        <SkipDialog
          open={true}
          onOpenChange={onOpenChange}
          dose={sampleDose}
          onConfirm={onConfirm}
        />,
      );

      expect(screen.getByText(/Skip Metformin/i)).toBeInTheDocument();
      expect(screen.getByText("Side effects")).toBeInTheDocument();

      // Click preset reason
      fireEvent.click(screen.getByText("Side effects"));
      fireEvent.click(screen.getByText("Skip Dose"));

      expect(onConfirm).toHaveBeenCalledWith("dose-1", "Side effects");
    });
  });

  describe("ScheduleFilterTabs", () => {
    it("renders all tabs with badge counts and switches on click", () => {
      const onTabChange = vi.fn();

      render(
        <ScheduleFilterTabs
          activeTab="all"
          onTabChange={onTabChange}
          counts={{ all: 4, due: 2, taken: 1, missed: 1 }}
        />,
      );

      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("Due / Next")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Taken"));
      expect(onTabChange).toHaveBeenCalledWith("taken");
    });
  });

  describe("ScheduleProgressCard", () => {
    it("renders adherence progress and percentage", () => {
      const onRefresh = vi.fn();

      render(
        <ScheduleProgressCard
          totalCount={4}
          takenCount={3}
          onRefresh={onRefresh}
        />,
      );

      expect(screen.getByText("3 of 4 doses completed (75%)")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");

      fireEvent.click(screen.getByText("Refresh"));
      expect(onRefresh).toHaveBeenCalled();
    });
  });
});

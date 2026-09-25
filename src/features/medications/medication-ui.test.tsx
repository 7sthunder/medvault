/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MedicationDTO } from "@/shared/types";
import { ArchiveDialog } from "./ArchiveDialog";
import { MedicationCard } from "./MedicationCard";
import { MedicationForm } from "./MedicationForm";
import { ScheduleBuilder } from "./ScheduleBuilder";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock trpc
vi.mock("@/lib/trpc", () => ({
  api: {
    useUtils: () => ({
      medication: {
        list: { invalidate: vi.fn() },
        get: { invalidate: vi.fn() },
      },
      dose: {
        today: { invalidate: vi.fn() },
      },
    }),
    medication: {
      create: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
      update: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

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

describe("Phase 15 — Medication CRUD UI Components", () => {
  const sampleMed: MedicationDTO = {
    id: "med-1",
    name: "Metformin",
    dosageAmount: 500,
    dosageUnit: "mg",
    instructions: "Take with food",
    notes: "Prescribed for glucose management",
    status: "active",
    frequencyLabel: "twice-daily",
    startDate: "2026-01-01",
    endDate: null,
    color: "var(--color-emerald-500)",
    remindersEnabled: true,
    archivedAt: null,
    createdAt: new Date("2026-01-01T08:00:00Z"),
    nextDoseAt: null,
    adherencePercent: null,
    slots: [
      {
        id: "slot-1",
        medicationId: "med-1",
        timeOfDay: "08:00",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        dosageAmount: 500,
        instructionOverride: null,
        enabled: true,
      },
      {
        id: "slot-2",
        medicationId: "med-1",
        timeOfDay: "20:00",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        dosageAmount: 500,
        instructionOverride: null,
        enabled: true,
      },
    ],
  };

  describe("MedicationCard", () => {
    it("renders medication details, dosage, frequency, and triggers status toggle", () => {
      const onToggleStatus = vi.fn();
      const onOpenArchive = vi.fn();

      render(
        <MedicationCard
          medication={sampleMed}
          onToggleStatus={onToggleStatus}
          onOpenArchive={onOpenArchive}
        />,
      );

      expect(screen.getByText("Metformin")).toBeInTheDocument();
      expect(screen.getByText("500 mg")).toBeInTheDocument();
      expect(screen.getByText("Twice daily")).toBeInTheDocument();
      expect(screen.getByText(/Take with food/i)).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();

      const pauseBtn = screen.getByText("Pause");
      fireEvent.click(pauseBtn);
      expect(onToggleStatus).toHaveBeenCalledWith("med-1", "active");

      const archiveBtn = screen.getByTitle("Archive medication");
      fireEvent.click(archiveBtn);
      expect(onOpenArchive).toHaveBeenCalledWith(sampleMed);
    });

    it("renders paused status badge and resume action for paused medications", () => {
      const pausedMed: MedicationDTO = {
        ...sampleMed,
        status: "paused",
      };
      const onToggleStatus = vi.fn();

      render(
        <MedicationCard
          medication={pausedMed}
          onToggleStatus={onToggleStatus}
          onOpenArchive={vi.fn()}
        />,
      );

      expect(screen.getByText("Paused")).toBeInTheDocument();
      const resumeBtn = screen.getByText("Resume");
      fireEvent.click(resumeBtn);
      expect(onToggleStatus).toHaveBeenCalledWith("med-1", "paused");
    });

    it("hides action buttons when medication is archived", () => {
      const archivedMed: MedicationDTO = {
        ...sampleMed,
        archivedAt: new Date("2026-03-01T00:00:00Z"),
      };

      render(
        <MedicationCard
          medication={archivedMed}
          onToggleStatus={vi.fn()}
          onOpenArchive={vi.fn()}
        />,
      );

      expect(screen.getByText("Archived")).toBeInTheDocument();
      expect(screen.queryByText("Pause")).not.toBeInTheDocument();
      expect(screen.queryByText("Resume")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Archive medication")).not.toBeInTheDocument();
    });
  });

  describe("ArchiveDialog", () => {
    it("renders confirmation details and historical preservation guarantee", () => {
      const onConfirm = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <ArchiveDialog
          open={true}
          onOpenChange={onOpenChange}
          medicationName="Metformin"
          onConfirm={onConfirm}
        />,
      );

      expect(screen.getByText(/Archive Metformin\?/i)).toBeInTheDocument();
      expect(
        screen.getByText(/All past taken, missed, and recorded doses are safely preserved/i),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByText("Archive Medication"));
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  describe("ScheduleBuilder", () => {
    it("updates slots when selecting Once daily preset", () => {
      const onChange = vi.fn();
      render(
        <ScheduleBuilder
          slots={sampleMed.slots.map((s) => ({
            timeOfDay: s.timeOfDay,
            daysOfWeek: [...s.daysOfWeek],
            enabled: s.enabled,
          }))}
          onChange={onChange}
        />,
      );

      fireEvent.click(screen.getByText("Once daily"));
      expect(onChange).toHaveBeenCalledWith([
        { timeOfDay: "08:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6], enabled: true },
      ]);
    });

    it("allows adding another dose time", () => {
      const onChange = vi.fn();
      render(
        <ScheduleBuilder
          slots={[
            { timeOfDay: "08:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6], enabled: true },
          ]}
          onChange={onChange}
        />,
      );

      fireEvent.click(screen.getByText(/Add time/i));
      expect(onChange).toHaveBeenCalled();
      const calledSlots = onChange.mock.calls[0]?.[0];
      expect(calledSlots).toHaveLength(2);
    });
  });

  describe("MedicationForm", () => {
    it("validates required name and dosage before allowing step advancement", () => {
      render(<MedicationForm mode="new" />);

      expect(screen.getByText(/Medication Basics/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Medication/i)).toBeInTheDocument();

      // Click Next without entering name
      fireEvent.click(screen.getByText("Next"));
      expect(screen.getByText("Medication name is required.")).toBeInTheDocument();

      // Enter name
      const nameInput = screen.getByPlaceholderText(/e\.g\. Metformin/i);
      fireEvent.change(nameInput, { target: { value: "Lisinopril" } });

      // Click Next again
      fireEvent.click(screen.getByText("Next"));
      // Should have advanced to Step 2
      expect(screen.getByText(/Schedule & Frequency/i)).toBeInTheDocument();
    });
  });
});

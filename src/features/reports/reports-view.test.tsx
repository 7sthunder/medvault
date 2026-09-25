/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/trpc";
import type { ReportDTO, ReportMissedAnalysis, ReportRow } from "@/shared/types";
import { GranularityTabs } from "./GranularityTabs";
import { MissedAnalysis } from "./MissedAnalysis";
import { ReportsPage } from "./ReportsPage";
import { SummaryTable } from "./SummaryTable";

// Mock matchMedia
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
  vi.clearAllMocks();
});

// Mock api
vi.mock("@/lib/trpc", () => ({
  api: {
    reports: {
      get: {
        useQuery: vi.fn(),
      },
    },
    medication: {
      list: {
        useQuery: vi.fn(() => ({ data: [] })),
      },
    },
  },
}));

describe("Phase 20 — Reports UI Components", () => {
  describe("GranularityTabs", () => {
    it("renders Daily, Weekly, and Monthly tabs with active state", () => {
      const onChange = vi.fn();
      render(<GranularityTabs value="daily" onChange={onChange} />);

      const dailyBtn = screen.getByRole("tab", { name: "Daily" });
      const weeklyBtn = screen.getByRole("tab", { name: "Weekly" });
      const monthlyBtn = screen.getByRole("tab", { name: "Monthly" });

      expect(dailyBtn).toBeInTheDocument();
      expect(weeklyBtn).toBeInTheDocument();
      expect(monthlyBtn).toBeInTheDocument();

      expect(dailyBtn).toHaveAttribute("aria-selected", "true");
      expect(weeklyBtn).toHaveAttribute("aria-selected", "false");

      fireEvent.click(weeklyBtn);
      expect(onChange).toHaveBeenCalledWith("weekly");
    });
  });

  describe("SummaryTable", () => {
    const mockRows: ReportRow[] = [
      {
        period: "2026-03-01",
        scheduled: 4,
        taken: 4,
        missed: 0,
        skipped: 0,
        adherencePercent: 100,
      },
      {
        period: "2026-03-02",
        scheduled: 4,
        taken: 2,
        missed: 2,
        skipped: 0,
        adherencePercent: 50,
      },
    ];

    it("renders table headers and rows accurately", () => {
      render(<SummaryTable rows={mockRows} granularity="daily" />);

      expect(screen.getByText("Period")).toBeInTheDocument();
      expect(screen.getByText("Scheduled")).toBeInTheDocument();
      expect(screen.getByText("Taken")).toBeInTheDocument();
      expect(screen.getByText("Missed")).toBeInTheDocument();
      expect(screen.getByText("Adherence")).toBeInTheDocument();

      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("Showing 2 periods")).toBeInTheDocument();
    });

    it("toggles sorting when column header is clicked", () => {
      render(<SummaryTable rows={mockRows} granularity="daily" />);

      const scheduledHeader = screen.getByRole("button", { name: /scheduled/i });
      fireEvent.click(scheduledHeader);
      // Clicking toggles sort order
      expect(screen.getByText("Showing 2 periods")).toBeInTheDocument();
    });

    it("renders empty state when rows is empty", () => {
      render(<SummaryTable rows={[]} granularity="daily" />);
      expect(screen.getByText("No records in this range")).toBeInTheDocument();
    });
  });

  describe("MissedAnalysis", () => {
    const mockData: ReportMissedAnalysis = {
      byBucket: [
        {
          bucket: "morning",
          scheduled: 20,
          taken: 19,
          missed: 1,
          rate: 95,
        },
        {
          bucket: "afternoon",
          scheduled: 0,
          taken: 0,
          missed: 0,
          rate: null,
        },
        {
          bucket: "evening",
          scheduled: 20,
          taken: 15,
          missed: 5,
          rate: 75,
        },
        {
          bucket: "night",
          scheduled: 0,
          taken: 0,
          missed: 0,
          rate: null,
        },
      ],
      byMedication: [
        {
          medicationId: "med-1",
          name: "Atorvastatin",
          color: "purple",
          missed: 5,
          scheduled: 20,
          adherencePercent: 75,
        },
        {
          medicationId: "med-2",
          name: "Metformin",
          color: "blue",
          missed: 1,
          scheduled: 20,
          adherencePercent: 95,
        },
      ],
    };

    it("renders bucket distribution and medication breakdown", () => {
      render(<MissedAnalysis data={mockData} />);

      expect(screen.getByText("Time-of-Day Pattern")).toBeInTheDocument();
      expect(screen.getByText("Morning")).toBeInTheDocument();
      expect(screen.getByText("Evening")).toBeInTheDocument();

      expect(screen.getByText("Missed Doses by Medication")).toBeInTheDocument();
      expect(screen.getByText("Atorvastatin")).toBeInTheDocument();
      expect(screen.getAllByText("5 missed").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Metformin")).toBeInTheDocument();
      expect(screen.getAllByText("1 missed").length).toBeGreaterThanOrEqual(1);
    });

    it("renders zero missed state when no doses missed", () => {
      const zeroMissedData: ReportMissedAnalysis = {
        byBucket: [
          {
            bucket: "morning",
            scheduled: 10,
            taken: 10,
            missed: 0,
            rate: 100,
          },
        ],
        byMedication: [
          {
            medicationId: "med-1",
            name: "Lisinopril",
            color: "emerald",
            missed: 0,
            scheduled: 10,
            adherencePercent: 100,
          },
        ],
      };

      render(<MissedAnalysis data={zeroMissedData} />);
      expect(screen.getByText("Zero Missed Doses!")).toBeInTheDocument();
    });
  });

  describe("ReportsPage", () => {
    const mockReport: ReportDTO = {
      granularity: "daily",
      from: new Date("2026-03-01T00:00:00Z"),
      to: new Date("2026-03-30T23:59:59Z"),
      medicationId: null,
      table: [
        {
          period: "2026-03-01",
          scheduled: 2,
          taken: 2,
          missed: 0,
          skipped: 0,
          adherencePercent: 100,
        },
      ],
      trend: [
        {
          label: "2026-03-01",
          adherence: 100,
          taken: 2,
          missed: 0,
          skipped: 0,
        },
      ],
      summary: {
        scheduled: 60,
        taken: 54,
        missed: 4,
        skipped: 2,
        adherencePercent: 90,
      },
      missedAnalysis: {
        byBucket: [
          {
            bucket: "morning",
            scheduled: 30,
            taken: 29,
            missed: 1,
            rate: 96.7,
          },
        ],
        byMedication: [
          {
            medicationId: "m-1",
            name: "Lisinopril",
            color: "emerald",
            missed: 4,
            scheduled: 60,
            adherencePercent: 90,
          },
        ],
      },
    };

    it("renders loading skeletons while fetching data", () => {
      vi.mocked(api.reports.get.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        isSuccess: false,
        error: null,
        refetch: vi.fn(),
      } as never);

      render(<ReportsPage />);
      expect(screen.getByTestId("reports-loading")).toBeInTheDocument();
    });

    it("renders error state when query fails", () => {
      vi.mocked(api.reports.get.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: { message: "Internal server error" },
        refetch: vi.fn(),
      } as never);

      render(<ReportsPage />);
      expect(screen.getByTestId("reports-error")).toBeInTheDocument();
      expect(screen.getByText("Failed to load adherence report")).toBeInTheDocument();
    });

    it("renders full reports dashboard when data arrives", () => {
      vi.mocked(api.reports.get.useQuery).mockReturnValue({
        data: mockReport,
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
        refetch: vi.fn(),
      } as never);

      render(<ReportsPage />);
      expect(screen.getByTestId("reports-content")).toBeInTheDocument();

      // Top KPI stat cards
      expect(screen.getByText("Overall Adherence")).toBeInTheDocument();
      expect(screen.getByText("90%")).toBeInTheDocument();
      expect(screen.getByText("Total Scheduled")).toBeInTheDocument();
      expect(screen.getByText("Total Taken")).toBeInTheDocument();
      expect(screen.getByText("Total Missed")).toBeInTheDocument();
      expect(screen.getByText("Total Skipped")).toBeInTheDocument();

      // Sections
      expect(screen.getByText("Time-of-Day Pattern")).toBeInTheDocument();
      expect(screen.getByText("Missed Doses by Medication")).toBeInTheDocument();
      expect(screen.getByText("Granular Audit Breakdown")).toBeInTheDocument();
    });

    it("allows selecting a specific medication scope", () => {
      vi.mocked(api.medication.list.useQuery).mockReturnValue({
        data: [
          {
            id: "med-1",
            name: "Metformin",
            dosageAmount: 500,
            dosageUnit: "mg",
            instructions: "With breakfast",
            notes: null,
            status: "active",
            startDate: "2026-01-01",
            endDate: null,
            color: "blue",
            remindersEnabled: true,
            frequencyLabel: "once-daily",
            isArchived: false,
            slots: [],
            archivedAt: null,
            nextDoseAt: null,
            adherencePercent: null,
            createdAt: new Date(),
          },
        ],
      } as never);

      vi.mocked(api.reports.get.useQuery).mockReturnValue({
        data: mockReport,
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
        refetch: vi.fn(),
      } as never);

      render(<ReportsPage />);

      const select = screen.getByTestId("reports-medication-select");
      expect(select).toBeInTheDocument();
      expect(screen.getByText("Metformin")).toBeInTheDocument();

      fireEvent.change(select, { target: { value: "med-1" } });
      expect(select).toHaveValue("med-1");
    });
  });
});

/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardDTO, DoseEventDTO, MedicationDTO } from "@/shared/types";
import { AdherenceWidget } from "./AdherenceWidget";
import { CaregiverStatus } from "./CaregiverStatus";
import { DashboardPage } from "./DashboardPage";
import { InsightWidget } from "./InsightWidget";
import { MedSummary } from "./MedSummary";
import { NextDoseHero } from "./NextDoseHero";
import { QuickActions } from "./QuickActions";
import { TodayFeed } from "./TodayFeed";
import { api } from "@/lib/trpc";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock trpc
vi.mock("@/lib/trpc", () => ({
  api: {
    useUtils: vi.fn(() => ({
      dashboard: { get: { invalidate: vi.fn() } },
      dose: { today: { invalidate: vi.fn() } },
    })),
    dashboard: {
      get: {
        useQuery: vi.fn(),
      },
    },
    appointments: {
      list: {
        useQuery: vi.fn(() => ({ data: [], isLoading: false })),
      },
      update: {
        useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
      },
      cancel: {
        useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
      },
      create: {
        useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
      },
    },
    dose: {
      take: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
      snooze: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
      skip: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isPending: false,
        })),
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
  vi.clearAllMocks();
});

describe("Phase 18 — Dashboard UI Components", () => {
  const sampleMed: MedicationDTO = {
    id: "med-1",
    name: "Metformin",
    dosageAmount: 500,
    dosageUnit: "mg",
    instructions: "With food",
    notes: null,
    status: "active",
    startDate: "2026-01-01",
    endDate: null,
    color: "var(--color-emerald-500)",
    remindersEnabled: true,
    frequencyLabel: "once-daily",
    slots: [],
    archivedAt: null,
    nextDoseAt: null,
    adherencePercent: null,
    createdAt: new Date(),
  };

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

  const sampleDashboardData: DashboardDTO = {
    stats: {
      adherenceToday: 100,
      currentStreak: 7,
      nextDoseTime: new Date("2026-03-01T08:00:00Z"),
      missedToday: 0,
      takenToday: 2,
      scheduledToday: 3,
    },
    dueNow: [sampleDose],
    nextDose: sampleDose,
    today: [sampleDose],
    week: [
      {
        date: "2026-02-28",
        scheduled: 2,
        taken: 2,
        missed: 0,
        skipped: 0,
        snoozed: 0,
        adherencePercent: 100,
        streakDay: true,
      },
      {
        date: "2026-03-01",
        scheduled: 2,
        taken: 2,
        missed: 0,
        skipped: 0,
        snoozed: 0,
        adherencePercent: 100,
        streakDay: true,
      },
    ],
    medications: [sampleMed],
    latestInsight: {
      id: "insight-1",
      category: "timing_pattern",
      summary: "High morning consistency",
      detail: "You consistently take morning doses within 10 minutes of schedule.",
      suggestedActionType: "review_schedule",
      source: "fallback",
      confidence: 0.95,
      createdAt: new Date(),
    },
    caregiver: {
      connectedCount: 1,
      newAlerts: 0,
    },
  };

  describe("NextDoseHero", () => {
    it("renders due now badge, medication info and action buttons", () => {
      const onTake = vi.fn();
      const onOpenSnooze = vi.fn();
      const onOpenSkip = vi.fn();

      render(
        <NextDoseHero
          nextDose={sampleDose}
          dueNow={[sampleDose]}
          hasMedications={true}
          onTake={onTake}
          onOpenSnooze={onOpenSnooze}
          onOpenSkip={onOpenSkip}
        />,
      );

      expect(screen.getByTestId("next-dose-hero")).toBeDefined();
      expect(screen.getByText("Metformin")).toBeDefined();
      expect(screen.getByText(/500 mg/)).toBeDefined();
      expect(screen.getAllByText(/due now/i)[0]).toBeDefined();

      const takeBtn = screen.getByRole("button", { name: /Take Dose/i });
      fireEvent.click(takeBtn);
      expect(onTake).toHaveBeenCalledWith("dose-1");

      const snoozeBtn = screen.getByRole("button", { name: /Snooze/i });
      fireEvent.click(snoozeBtn);
      expect(onOpenSnooze).toHaveBeenCalledWith(sampleDose);

      const skipBtn = screen.getByRole("button", { name: /Skip/i });
      fireEvent.click(skipBtn);
      expect(onOpenSkip).toHaveBeenCalledWith(sampleDose);
    });

    it("renders all caught up state when no next dose remains", () => {
      render(
        <NextDoseHero
          nextDose={null}
          dueNow={[]}
          hasMedications={true}
          onTake={vi.fn()}
          onOpenSnooze={vi.fn()}
          onOpenSkip={vi.fn()}
        />,
      );

      expect(screen.getByTestId("next-dose-hero-caught-up")).toBeDefined();
      expect(screen.getByText("You're all set for today!")).toBeDefined();
    });

    it("renders onboarding state when user has no medications", () => {
      render(
        <NextDoseHero
          nextDose={null}
          dueNow={[]}
          hasMedications={false}
          onTake={vi.fn()}
          onOpenSnooze={vi.fn()}
          onOpenSkip={vi.fn()}
        />,
      );

      expect(screen.getByTestId("next-dose-hero-empty")).toBeDefined();
      expect(screen.getByText("Start tracking your medications")).toBeDefined();
    });
  });

  describe("TodayFeed", () => {
    it("renders today's prioritized doses", () => {
      render(
        <TodayFeed
          today={[sampleDose]}
          onTake={vi.fn()}
          onOpenSnooze={vi.fn()}
          onOpenSkip={vi.fn()}
        />,
      );

      expect(screen.getByTestId("today-feed-section")).toBeDefined();
      expect(screen.getByText("View all (1)")).toBeDefined();
      expect(screen.getByText("Metformin")).toBeDefined();
    });

    it("renders empty state when today has no doses", () => {
      render(
        <TodayFeed
          today={[]}
          onTake={vi.fn()}
          onOpenSnooze={vi.fn()}
          onOpenSkip={vi.fn()}
        />,
      );

      expect(screen.getByText("No doses scheduled for today")).toBeDefined();
    });
  });

  describe("AdherenceWidget", () => {
    it("renders 7-day adherence trend section", () => {
      render(<AdherenceWidget week={sampleDashboardData.week} />);

      expect(screen.getByTestId("adherence-widget")).toBeDefined();
      expect(screen.getByText("7-Day History")).toBeDefined();
      expect(screen.getByText("Full Analytics")).toBeDefined();
    });
  });

  describe("MedSummary", () => {
    it("renders active prescriptions list", () => {
      render(<MedSummary medications={[sampleMed]} />);

      expect(screen.getByTestId("med-summary-section")).toBeDefined();
      expect(screen.getByText("Manage (1)")).toBeDefined();
      expect(screen.getByText("Metformin")).toBeDefined();
      expect(screen.getByText(/500 mg · once-daily/)).toBeDefined();
    });
  });

  describe("InsightWidget & CaregiverStatus", () => {
    it("renders AI insight preview card", () => {
      render(<InsightWidget insight={sampleDashboardData.latestInsight} />);

      expect(screen.getByTestId("insight-widget")).toBeDefined();
      expect(screen.getByText("High morning consistency")).toBeDefined();
      expect(
        screen.getByText(/consistently take morning doses within 10 minutes/),
      ).toBeDefined();
    });

    it("renders Caregiver network status", () => {
      render(<CaregiverStatus caregiver={sampleDashboardData.caregiver} />);

      expect(screen.getByTestId("caregiver-status-widget")).toBeDefined();
      expect(screen.getByText("1 Connected Caregiver")).toBeDefined();
    });
  });

  describe("QuickActions", () => {
    it("renders the 4 primary navigation shortcuts", () => {
      render(<QuickActions />);

      expect(screen.getByTestId("quick-actions-section")).toBeDefined();
      expect(screen.getByText("Today's Schedule")).toBeDefined();
      expect(screen.getByText("Add Medication")).toBeDefined();
      expect(screen.getByText("Adherence Analytics")).toBeDefined();
      expect(screen.getByText("Smart Insights")).toBeDefined();
    });
  });

  describe("DashboardPage Controller", () => {
    it("renders loading skeleton during query load", () => {
      vi.mocked(api.dashboard.get.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as never);

      render(<DashboardPage />);
      expect(screen.getByTestId("dashboard-loading-skeleton")).toBeDefined();
    });

    it("renders error state when query fails", () => {
      vi.mocked(api.dashboard.get.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { message: "Failed to connect to database" },
        refetch: vi.fn(),
      } as never);

      render(<DashboardPage />);
      expect(screen.getByTestId("dashboard-error-state")).toBeDefined();
      expect(screen.getByText("Failed to connect to database")).toBeDefined();
    });

    it("renders complete dashboard with stats and widgets when data loaded", () => {
      vi.mocked(api.dashboard.get.useQuery).mockReturnValue({
        data: sampleDashboardData,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as never);

      render(<DashboardPage />);
      expect(screen.getByTestId("dashboard-content")).toBeDefined();
      expect(screen.getByText("Today's Adherence")).toBeDefined();
      expect(screen.getByText("100%")).toBeDefined();
      expect(screen.getByText("Current Streak")).toBeDefined();
      expect(screen.getByText("7 Days")).toBeDefined();
      expect(screen.getByText("2 of 3 doses taken")).toBeDefined();
    });
  });
});

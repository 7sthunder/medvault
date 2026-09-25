/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DoseActionDTO, MedicationDTO } from "@/shared/types";
import { FilterBar } from "./FilterBar";
import { HistoryPage } from "./HistoryPage";
import { HistoryRowMenu } from "./HistoryRowMenu";
import { HistoryTimeline } from "./HistoryTimeline";
import { api } from "@/lib/trpc";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/history",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock trpc
vi.mock("@/lib/trpc", () => ({
  api: {
    medication: {
      list: {
        useQuery: vi.fn(() => ({ data: [] })),
      },
    },
    history: {
      query: {
        useInfiniteQuery: vi.fn(),
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

describe("Phase 19 — History UI Components", () => {
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
    color: "blue",
    remindersEnabled: true,
    frequencyLabel: "once-daily",
    slots: [],
    archivedAt: null,
    nextDoseAt: null,
    adherencePercent: null,
    createdAt: new Date(),
  };

  const sampleAction1: DoseActionDTO = {
    id: "act-1",
    doseEventId: "dose-1",
    action: "take",
    occurredAt: new Date("2026-03-01T08:05:00Z"),
    meta: { wasLate: false },
    medication: {
      id: "med-1",
      name: "Metformin",
      dosageAmount: 500,
      dosageUnit: "mg",
      color: "blue",
      archivedAt: null,
    },
    eventStatus: "taken",
    eventScheduledFor: new Date("2026-03-01T08:00:00Z"),
  };

  const sampleAction2: DoseActionDTO = {
    id: "act-2",
    doseEventId: "dose-2",
    action: "skip",
    occurredAt: new Date("2026-03-01T14:00:00Z"),
    meta: { reason: "Felt nauseous" },
    medication: {
      id: "med-archived",
      name: "Lisinopril",
      dosageAmount: 10,
      dosageUnit: "mg",
      color: "rose",
      archivedAt: new Date("2026-03-02T00:00:00Z"),
    },
    eventStatus: "skipped",
    eventScheduledFor: new Date("2026-03-01T14:00:00Z"),
  };

  describe("FilterBar", () => {
    it("renders filter controls and triggers onChange on selection", () => {
      const onChange = vi.fn();
      render(
        <FilterBar
          filters={{ rangePreset: "all", action: "all" }}
          onChange={onChange}
          medications={[sampleMed]}
        />,
      );

      expect(screen.getByTestId("history-filter-bar")).toBeDefined();
      expect(screen.getByText("All Time")).toBeDefined();
      expect(screen.getByText("7 Days")).toBeDefined();
      expect(screen.getByText("Taken")).toBeDefined();

      // Click 7 Days
      const btn7d = screen.getByText("7 Days");
      fireEvent.click(btn7d);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rangePreset: "7d",
        }),
      );

      // Click Taken
      const btnTaken = screen.getByText("Taken");
      fireEvent.click(btnTaken);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "take",
        }),
      );

      // Select medication
      const select = screen.getByTestId("medication-filter-select");
      fireEvent.change(select, { target: { value: "med-1" } });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          medicationId: "med-1",
        }),
      );
    });

    it("renders reset button when filters are active and clears filters", () => {
      const onChange = vi.fn();
      render(
        <FilterBar
          filters={{ rangePreset: "7d", action: "take", medicationId: "med-1" }}
          onChange={onChange}
          medications={[sampleMed]}
        />,
      );

      const resetBtn = screen.getByText("Reset filters");
      expect(resetBtn).toBeDefined();

      fireEvent.click(resetBtn);
      expect(onChange).toHaveBeenCalledWith({
        rangePreset: "all",
        action: "all",
        medicationId: undefined,
        from: undefined,
        to: undefined,
      });
    });
  });

  describe("HistoryRowMenu", () => {
    it("renders more options button", () => {
      render(<HistoryRowMenu action={sampleAction1} />);
      expect(screen.getByRole("button", { name: /more options/i })).toBeDefined();
    });
  });

  describe("HistoryTimeline", () => {
    it("renders grouped actions with badges, verbs, and medication details", () => {
      render(
        <HistoryTimeline
          items={[sampleAction1, sampleAction2]}
          totalCount={2}
          hasNextPage={false}
          isFetchingNextPage={false}
          onLoadMore={vi.fn()}
        />,
      );

      expect(screen.getByTestId("history-timeline")).toBeDefined();
      expect(screen.getByText(/Took Metformin/)).toBeDefined();
      expect(screen.getByText(/Skipped Lisinopril/)).toBeDefined();
      expect(screen.getByText(/Felt nauseous/)).toBeDefined();
      expect(screen.getByText("Archived")).toBeDefined();
      expect(screen.getByText(/Showing all 2 events/)).toBeDefined();
    });

    it("renders load more button when hasNextPage is true", () => {
      const onLoadMore = vi.fn();
      render(
        <HistoryTimeline
          items={[sampleAction1]}
          totalCount={5}
          hasNextPage={true}
          isFetchingNextPage={false}
          onLoadMore={onLoadMore}
        />,
      );

      const loadMoreBtn = screen.getByRole("button", { name: /Load More Entries/i });
      expect(loadMoreBtn).toBeDefined();
      fireEvent.click(loadMoreBtn);
      expect(onLoadMore).toHaveBeenCalled();
    });

    it("renders empty state when no items exist", () => {
      const onReset = vi.fn();
      render(
        <HistoryTimeline
          items={[]}
          totalCount={0}
          hasNextPage={false}
          isFetchingNextPage={false}
          onLoadMore={vi.fn()}
          onResetFilters={onReset}
        />,
      );

      expect(screen.getByTestId("history-empty-state")).toBeDefined();
      expect(screen.getByText("No activity recorded")).toBeDefined();

      const clearBtn = screen.getByText("Clear All Filters");
      fireEvent.click(clearBtn);
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe("HistoryPage Controller", () => {
    it("renders loading skeleton during query", () => {
      vi.mocked(api.history.query.useInfiniteQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: vi.fn(),
      } as never);

      render(<HistoryPage />);
      expect(screen.getByTestId("history-loading-skeleton")).toBeDefined();
    });

    it("renders error state when query fails", () => {
      vi.mocked(api.history.query.useInfiniteQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { message: "Server connection failed" },
        refetch: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: vi.fn(),
      } as never);

      render(<HistoryPage />);
      expect(screen.getByTestId("history-error-state")).toBeDefined();
      expect(screen.getByText("Failed to load dose history")).toBeDefined();
    });

    it("renders timeline with items when data is loaded", () => {
      vi.mocked(api.history.query.useInfiniteQuery).mockReturnValue({
        data: {
          pages: [
            {
              items: [sampleAction1],
              nextCursor: null,
              totalCount: 1,
            },
          ],
          pageParams: [undefined],
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: vi.fn(),
      } as never);

      render(<HistoryPage />);
      expect(screen.getByTestId("history-page")).toBeDefined();
      expect(screen.getByText(/Took Metformin/)).toBeDefined();
    });
  });
});

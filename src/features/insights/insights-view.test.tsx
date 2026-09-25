/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/trpc";
import type { InsightDTO } from "@/shared/types";
import { InsightCard } from "./InsightCard";
import { InsightsPage } from "./InsightsPage";
import { RegenerateButton } from "./RegenerateButton";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockAiInsight: InsightDTO = {
  id: "ins-ai",
  category: "timing_pattern",
  summary: "Consistent morning timing",
  detail: "Pairing doses with breakfast improves adherence.",
  suggestedActionType: "review_schedule",
  source: "ai",
  confidence: 0.94,
  createdAt: new Date("2026-09-25T08:00:00Z"),
};

const mockFallbackInsight: InsightDTO = {
  id: "ins-fallback",
  category: "snooze_pattern",
  summary: "Frequent snoozing detected",
  detail: "Consider shifting reminder times.",
  suggestedActionType: "review_reminders",
  source: "fallback",
  confidence: 0.85,
  createdAt: new Date("2026-09-25T07:30:00Z"),
};

vi.mock("@/lib/trpc", () => ({
  api: {
    useUtils: vi.fn(() => ({
      insights: {
        list: { invalidate: vi.fn() },
        latest: { invalidate: vi.fn() },
      },
      dashboard: {
        get: { invalidate: vi.fn() },
      },
    })),
    insights: {
      list: {
        useQuery: vi.fn(),
      },
      latest: {
        useQuery: vi.fn(),
      },
      regenerate: {
        useMutation: vi.fn(),
      },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Phase 23 — Insights UI Views", () => {
  describe("InsightCard", () => {
    it("renders AI-generated insight card with AI badge and action button", () => {
      render(<InsightCard insight={mockAiInsight} />);

      expect(screen.getByTestId("insight-card-ins-ai")).toBeDefined();
      expect(screen.getByText("Consistent morning timing")).toBeDefined();
      expect(screen.getByText("Pairing doses with breakfast improves adherence.")).toBeDefined();
      expect(screen.getByTestId("insight-source-ai")).toBeDefined();
      expect(screen.getByText("94% conf")).toBeDefined();
      expect(screen.getByText("Timing Pattern")).toBeDefined();
      expect(screen.getByText("Review Schedule")).toBeDefined();
    });

    it("renders fallback insight card with Pattern Analysis badge", () => {
      render(<InsightCard insight={mockFallbackInsight} />);

      expect(screen.getByTestId("insight-card-ins-fallback")).toBeDefined();
      expect(screen.getByText("Frequent snoozing detected")).toBeDefined();
      expect(screen.getByTestId("insight-source-fallback")).toBeDefined();
      expect(screen.getByText("85% conf")).toBeDefined();
      expect(screen.getByText("Snooze Pattern")).toBeDefined();
      expect(screen.getByText("Adjust Reminders")).toBeDefined();
    });
  });

  describe("RegenerateButton", () => {
    it("triggers regenerate mutation on click", () => {
      const mutate = vi.fn();
      vi.mocked(api.insights.regenerate.useMutation).mockReturnValue({
        mutate,
        isPending: false,
      } as never);

      render(<RegenerateButton />);
      const btn = screen.getByTestId("regenerate-insights-button");
      fireEvent.click(btn);

      expect(mutate).toHaveBeenCalledTimes(1);
    });
  });

  describe("InsightsPage", () => {
    it("renders loading skeletons when query is loading", () => {
      vi.mocked(api.insights.list.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as never);

      vi.mocked(api.insights.regenerate.useMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as never);

      render(<InsightsPage />);
      expect(screen.getByTestId("insights-loading-skeleton")).toBeDefined();
      expect(screen.getByTestId("insights-disclaimer")).toBeDefined();
    });

    it("renders empty state when no insights exist", () => {
      vi.mocked(api.insights.list.useQuery).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
      } as never);

      vi.mocked(api.insights.regenerate.useMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as never);

      render(<InsightsPage />);
      expect(screen.getByTestId("insights-empty-state")).toBeDefined();
      expect(screen.getByText("No Insights Generated Yet")).toBeDefined();
    });

    it("renders grid of insight cards when data is available", () => {
      vi.mocked(api.insights.list.useQuery).mockReturnValue({
        data: [mockAiInsight, mockFallbackInsight],
        isLoading: false,
        isError: false,
      } as never);

      vi.mocked(api.insights.regenerate.useMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as never);

      render(<InsightsPage />);
      expect(screen.getByTestId("insights-grid")).toBeDefined();
      expect(screen.getByText("Consistent morning timing")).toBeDefined();
      expect(screen.getByText("Frequent snoozing detected")).toBeDefined();
    });

    it("renders error state when query errors", () => {
      vi.mocked(api.insights.list.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { message: "Database timeout" },
      } as never);

      vi.mocked(api.insights.regenerate.useMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as never);

      render(<InsightsPage />);
      expect(screen.getByText("Unable to load adherence insights")).toBeDefined();
      expect(screen.getByText("Database timeout")).toBeDefined();
    });
  });
});

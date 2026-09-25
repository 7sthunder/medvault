/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoClock } from "./DemoClock";
import { DemoDock } from "./DemoDock";
import { DemoShell } from "./DemoShell";
import { ResetButton } from "./ResetButton";
import { ScenarioControl } from "./ScenarioControl";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: mockRefresh,
  }),
  usePathname: () => "/demo",
  useSearchParams: () => new URLSearchParams(),
}));

const mockSimulateMutate = vi.fn();
const mockSetTimeMutate = vi.fn();
const mockApplyScenarioMutate = vi.fn();
const mockResetMutate = vi.fn();
const mockAlertMutate = vi.fn();
const mockInsightMutate = vi.fn();
const mockLeaveMutate = vi.fn();

const mockDemoState = {
  demoUser: {
    id: "demo-user-123",
    name: "Arun Kumar",
    email: "demo@medvault.demo",
    timezone: "UTC",
  },
  state: {
    id: "state-123",
    userId: "demo-user-123",
    simulationNow: "2026-06-15T09:00:00.000Z",
    timeMultiplier: 1,
    scenario: "baseline" as const,
    hasCaregiverDemoData: false,
  },
};

vi.mock("@/lib/trpc", () => ({
  api: {
    useUtils: () => ({
      demo: { getState: { invalidate: vi.fn() } },
      dashboard: { get: { invalidate: vi.fn() } },
      dose: { today: { invalidate: vi.fn() } },
      medication: { list: { invalidate: vi.fn() } },
      adherence: { summary: { invalidate: vi.fn() } },
      caregiver: { listAlerts: { invalidate: vi.fn() } },
      insights: { list: { invalidate: vi.fn() }, latest: { invalidate: vi.fn() } },
      notifications: { list: { invalidate: vi.fn() } },
    }),
    notifications: {
      unreadCount: {
        useQuery: vi.fn(() => ({
          data: 0,
          isLoading: false,
        })),
      },
      list: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
        })),
      },
      markAllRead: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
      markRead: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
    },
    demo: {
      getState: {
        useQuery: vi.fn(() => ({
          data: mockDemoState,
          isLoading: false,
        })),
      },
      simulate: {
        useMutation: vi.fn((opts?: { onSuccess?: (data: { action: string }) => void; onSettled?: () => void }) => ({
          mutate: (args: { action: string }) => {
            mockSimulateMutate(args);
            opts?.onSuccess?.(args);
            opts?.onSettled?.();
          },
          isPending: false,
        })),
      },
      setTime: {
        useMutation: vi.fn((opts?: { onSuccess?: (data: { simulationNow: string | null }) => void; onSettled?: () => void }) => ({
          mutate: (args: { time: string | null }) => {
            mockSetTimeMutate(args);
            opts?.onSuccess?.({ simulationNow: args.time });
            opts?.onSettled?.();
          },
          isPending: false,
        })),
      },
      applyScenario: {
        useMutation: vi.fn((opts?: { onSuccess?: (data: { message: string }) => void; onSettled?: () => void }) => ({
          mutate: (args: { scenario: string }) => {
            mockApplyScenarioMutate(args);
            opts?.onSuccess?.({ message: "Applied scenario" });
            opts?.onSettled?.();
          },
          isPending: false,
        })),
      },
      reset: {
        useMutation: vi.fn((opts?: { onSuccess?: () => void; onSettled?: () => void }) => ({
          mutate: () => {
            mockResetMutate();
            opts?.onSuccess?.();
            opts?.onSettled?.();
          },
          isPending: false,
        })),
      },
      generateAlert: {
        useMutation: vi.fn((opts?: { onSuccess?: () => void; onSettled?: () => void }) => ({
          mutate: () => {
            mockAlertMutate();
            opts?.onSuccess?.();
            opts?.onSettled?.();
          },
          isPending: false,
        })),
      },
      generateInsight: {
        useMutation: vi.fn((opts?: { onSuccess?: (insights: unknown[]) => void; onSettled?: () => void }) => ({
          mutate: () => {
            mockInsightMutate();
            opts?.onSuccess?.([]);
            opts?.onSettled?.();
          },
          isPending: false,
        })),
      },
      leave: {
        useMutation: vi.fn((opts?: { onSuccess?: () => void; onSettled?: () => void }) => ({
          mutate: () => {
            mockLeaveMutate();
            opts?.onSuccess?.();
            opts?.onSettled?.();
          },
          isPending: false,
        })),
      },
    },
  },
}));

describe("Phase 25 — Demo Feature Components", () => {
  describe("DemoDock", () => {
    it("renders simulation dock with header and live indicator", () => {
      render(<DemoDock />);

      expect(screen.getByTestId("demo-dock")).toBeDefined();
      expect(screen.getByText("Simulation Dock")).toBeDefined();
      expect(screen.getByText("LIVE")).toBeDefined();
    });

    it("collapses and expands dock when toggle is clicked", () => {
      render(<DemoDock />);

      const toggleBtn = screen.getByTestId("toggle-dock-collapse");
      expect(screen.getByTestId("simulate-take-button")).toBeDefined();

      // Collapse
      fireEvent.click(toggleBtn);
      expect(screen.queryByTestId("simulate-take-button")).toBeNull();

      // Expand
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId("simulate-take-button")).toBeDefined();
    });

    it("fires simulation mutations on dose action buttons", () => {
      render(<DemoDock />);

      fireEvent.click(screen.getByTestId("simulate-take-button"));
      expect(mockSimulateMutate).toHaveBeenCalledWith({ action: "take" });

      fireEvent.click(screen.getByTestId("simulate-miss-button"));
      expect(mockSimulateMutate).toHaveBeenCalledWith({ action: "miss" });

      fireEvent.click(screen.getByTestId("simulate-skip-button"));
      expect(mockSimulateMutate).toHaveBeenCalledWith({ action: "skip" });

      fireEvent.click(screen.getByTestId("simulate-snooze-button"));
      expect(mockSimulateMutate).toHaveBeenCalledWith({ action: "snooze" });
    });

    it("triggers caregiver alert and ai insight generation", () => {
      render(<DemoDock />);

      fireEvent.click(screen.getByTestId("simulate-caregiver-alert-button"));
      expect(mockAlertMutate).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId("simulate-ai-insight-button"));
      expect(mockInsightMutate).toHaveBeenCalled();
    });
  });

  describe("DemoClock", () => {
    it("renders custom clock time and shift buttons", () => {
      const simDate = new Date("2026-06-15T12:00:00.000Z");
      render(<DemoClock simulationNow={simDate} />);

      expect(screen.getByTestId("demo-clock")).toBeDefined();
      expect(screen.getByText("Custom Clock")).toBeDefined();

      // Click +4h
      fireEvent.click(screen.getByRole("button", { name: "+4h" }));
      expect(mockSetTimeMutate).toHaveBeenCalledWith(
        expect.objectContaining({ time: expect.any(String) }),
      );

      // Click Reset clock
      fireEvent.click(screen.getByRole("button", { name: "Reset" }));
      expect(mockSetTimeMutate).toHaveBeenCalledWith({ time: null });
    });
  });

  describe("ScenarioControl", () => {
    it("renders scenarios and applies clicked scenario", () => {
      render(<ScenarioControl currentScenario="baseline" />);

      expect(screen.getByTestId("scenario-control")).toBeDefined();
      expect(screen.getByText("Baseline (90.5%)")).toBeDefined();
      expect(screen.getByText("Missed Adherence")).toBeDefined();
      expect(screen.getByText("Full Recovery")).toBeDefined();
      expect(screen.getByText("Caregiver Triage")).toBeDefined();

      fireEvent.click(screen.getByText("Missed Adherence"));
      expect(mockApplyScenarioMutate).toHaveBeenCalledWith({ scenario: "decline" });

      fireEvent.click(screen.getByText("Full Recovery"));
      expect(mockApplyScenarioMutate).toHaveBeenCalledWith({ scenario: "improvement" });
    });
  });

  describe("ResetButton", () => {
    it("calls reset mutation when clicked", () => {
      render(<ResetButton />);

      const btn = screen.getByTestId("reset-demo-button");
      expect(btn).toBeDefined();

      fireEvent.click(btn);
      expect(mockResetMutate).toHaveBeenCalled();
    });
  });

  describe("DemoShell", () => {
    it("renders top demo banner with user info, reset and exit buttons", () => {
      const demoUser = {
        id: "demo-user-123",
        name: "Arun Kumar",
        email: "demo@medvault.demo",
      };

      render(
        <DemoShell demoUser={demoUser}>
          <div data-testid="demo-content">Test App Content</div>
        </DemoShell>,
      );

      expect(screen.getByText("DEMO MODE")).toBeDefined();
      expect(screen.getAllByText("Arun Kumar").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId("demo-content")).toBeDefined();

      // Reset seed button in banner
      fireEvent.click(screen.getByTestId("banner-reset-button"));
      expect(mockResetMutate).toHaveBeenCalled();

      // Exit button in banner
      fireEvent.click(screen.getByTestId("banner-exit-button"));
      expect(mockLeaveMutate).toHaveBeenCalled();
    });
  });
});

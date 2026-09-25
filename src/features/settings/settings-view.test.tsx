/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/trpc";
import { AppearancePanel } from "./AppearancePanel";
import { DataOverview } from "./DataOverview";
import { DeleteFlow } from "./DeleteFlow";
import { ProfileForm } from "./ProfileForm";
import { ReminderSettings } from "./ReminderSettings";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/settings/profile",
  useSearchParams: () => new URLSearchParams(),
}));

const mockProfile = {
  id: "user-1",
  name: "Eleanor Vance",
  email: "eleanor@medvault.test",
  timezone: "America/New_York",
  createdAt: new Date(),
};

const mockReminders = {
  missedAfterMinutes: 30,
  snoozeMinutes: 10,
  maxSnoozes: 3,
  reminderBeforeMinutes: 5,
  notificationPrefs: {
    doseReminders: true,
    caregiverMissedAlerts: true,
    insights: true,
    sounds: true,
  },
  medications: [
    { id: "med-1", name: "Metformin", color: "blue", remindersEnabled: true },
  ],
};

const mockPreferences = {
  theme: "light",
  uiDensity: "comfortable",
  reduceMotion: false,
  caregiverAlertPrefs: { missedDoseOn: true, dailyDigest: false },
};

const mockDataOverview = {
  medicationCount: 3,
  doseEventCount: 15,
  insightCount: 4,
  notificationCount: 6,
  caregiverCount: 2,
};

vi.mock("@/lib/trpc", () => ({
  api: {
    useUtils: vi.fn(() => ({
      settings: {
        getProfile: { invalidate: vi.fn() },
        getReminders: { invalidate: vi.fn() },
        getPreferences: { invalidate: vi.fn() },
        getDataOverview: { invalidate: vi.fn() },
      },
      dashboard: { get: { invalidate: vi.fn() } },
    })),
    settings: {
      getProfile: { useQuery: vi.fn() },
      updateProfile: { useMutation: vi.fn() },
      getReminders: { useQuery: vi.fn() },
      updateReminders: { useMutation: vi.fn() },
      getPreferences: { useQuery: vi.fn() },
      updateAppearance: { useMutation: vi.fn() },
      updateCaregiverPrefs: { useMutation: vi.fn() },
      getDataOverview: { useQuery: vi.fn() },
      deleteAllData: { useMutation: vi.fn() },
      deleteAccount: { useMutation: vi.fn() },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Phase 24 — Settings UI Views", () => {
  describe("ProfileForm", () => {
    it("renders profile details and enables save on modification", () => {
      vi.mocked(api.settings.getProfile.useQuery).mockReturnValue({
        data: mockProfile,
        isLoading: false,
        isError: false,
      } as never);

      const mutate = vi.fn();
      vi.mocked(api.settings.updateProfile.useMutation).mockReturnValue({
        mutate,
        isPending: false,
      } as never);

      render(<ProfileForm />);

      const nameInput = screen.getByLabelText("Display Name") as HTMLInputElement;
      expect(nameInput.value).toBe("Eleanor Vance");

      const saveBtn = screen.getByTestId("save-profile-button") as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(true);

      fireEvent.change(nameInput, { target: { value: "Eleanor Vance Modified" } });
      expect(saveBtn.disabled).toBe(false);

      fireEvent.click(saveBtn);
      expect(mutate).toHaveBeenCalledWith({
        name: "Eleanor Vance Modified",
        timezone: "America/New_York",
      });
    });
  });

  describe("ReminderSettings", () => {
    it("renders reminder thresholds and responds to preset clicks", () => {
      vi.mocked(api.settings.getReminders.useQuery).mockReturnValue({
        data: mockReminders,
        isLoading: false,
        isError: false,
      } as never);

      vi.mocked(api.settings.updateReminders.useMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as never);

      render(<ReminderSettings />);

      expect(screen.getByText("Reminder & Dose Windows")).toBeDefined();
      expect(screen.getByText("30 min")).toBeDefined();

      const preset45 = screen.getByText("45m");
      fireEvent.click(preset45);

      expect(screen.getByText("45 min")).toBeDefined();
    });
  });

  describe("AppearancePanel", () => {
    it("renders themes and switches to dark theme", () => {
      vi.mocked(api.settings.getPreferences.useQuery).mockReturnValue({
        data: mockPreferences,
        isLoading: false,
        isError: false,
      } as never);

      const mutate = vi.fn();
      vi.mocked(api.settings.updateAppearance.useMutation).mockReturnValue({
        mutate,
        isPending: false,
      } as never);

      render(<AppearancePanel />);

      const darkBtn = screen.getByTestId("theme-dark");
      fireEvent.click(darkBtn);

      expect(mutate).toHaveBeenCalledWith({
        theme: "dark",
        uiDensity: "comfortable",
        reduceMotion: false,
      });
    });
  });

  describe("DataOverview", () => {
    it("renders data metrics overview", () => {
      vi.mocked(api.settings.getDataOverview.useQuery).mockReturnValue({
        data: mockDataOverview,
        isLoading: false,
      } as never);

      render(<DataOverview />);

      expect(screen.getByText("3")).toBeDefined(); // Medications
      expect(screen.getByText("15")).toBeDefined(); // Dose Logs
      expect(screen.getByText("4")).toBeDefined(); // AI Insights
    });
  });

  describe("DeleteFlow", () => {
    it("requires exact typed confirmation for data deletion", () => {
      const mutate = vi.fn();
      vi.mocked(api.settings.deleteAllData.useMutation).mockReturnValue({
        mutate,
        isPending: false,
      } as never);
      vi.mocked(api.settings.deleteAccount.useMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as never);

      render(<DeleteFlow />);

      // Open Delete Data Modal
      const openBtn = screen.getByTestId("open-delete-data-modal");
      fireEvent.click(openBtn);

      const confirmBtn = screen.getByTestId("confirm-delete-data-button") as HTMLButtonElement;
      expect(confirmBtn.disabled).toBe(true);

      const input = screen.getByTestId("confirm-delete-data-input");
      fireEvent.change(input, { target: { value: "WRONG PHRASE" } });
      expect(confirmBtn.disabled).toBe(true);

      fireEvent.change(input, { target: { value: "DELETE ALL DATA" } });
      expect(confirmBtn.disabled).toBe(false);

      fireEvent.click(confirmBtn);
      expect(mutate).toHaveBeenCalledWith({ confirmPhrase: "DELETE ALL DATA" });
    });
  });
});

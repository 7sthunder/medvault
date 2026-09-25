/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingWizard } from "./OnboardingWizard";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Phase 10 — OnboardingWizard", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it("renders Step 1 initially with name and timezone select", () => {
    render(<OnboardingWizard initialName="Arun Kumar" initialTimezone="Asia/Kolkata" />);

    expect(screen.getByText("Confirm Timezone & Profile")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Arun Kumar")).toBeInTheDocument();
    expect(screen.getByLabelText("Your Timezone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Continue$/i })).toBeInTheDocument();
  });

  it("progresses through Step 1 -> Step 2 -> Step 3 and back", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard initialName="Arun Kumar" initialTimezone="Asia/Kolkata" />);

    // Step 1 -> Step 2
    await user.click(screen.getByRole("button", { name: /^Continue$/i }));
    expect(screen.getByText("Personalize Reminder Habits")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Strict")).toBeInTheDocument();

    // Step 2 -> Step 3
    await user.click(screen.getByRole("button", { name: /^Continue$/i }));
    expect(screen.getByText("Ready to Launch Your Vault")).toBeInTheDocument();
    expect(screen.getByText("Metformin 500mg")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Launch Dashboard/i })).toBeInTheDocument();

    // Step 3 -> Step 2 via Back
    await user.click(screen.getByRole("button", { name: /Back/i }));
    expect(screen.getByText("Personalize Reminder Habits")).toBeInTheDocument();
  });

  it("switches reminder habit presets in Step 2", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard initialName="Arun Kumar" />);

    await user.click(screen.getByRole("button", { name: /^Continue$/i }));
    expect(screen.getByText("Personalize Reminder Habits")).toBeInTheDocument();

    // Default is Balanced (30 min missed after)
    const missedInput = screen.getByLabelText(/Missed Dose Grace/i) as HTMLInputElement;
    expect(missedInput.value).toBe("30");

    // Click Strict preset (15 min missed after)
    await user.click(screen.getByText("Strict"));
    expect(missedInput.value).toBe("15");

    // Click Relaxed preset (45 min missed after)
    await user.click(screen.getByText("Relaxed"));
    expect(missedInput.value).toBe("45");
  });

  it("toggles sample medication option in Step 3", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard initialName="Arun Kumar" />);

    await user.click(screen.getByRole("button", { name: /^Continue$/i }));
    await user.click(screen.getByRole("button", { name: /^Continue$/i }));

    const medCard = screen.getByText("Metformin 500mg").closest("div[class*='cursor-pointer']")!;
    expect(medCard).toBeInTheDocument();

    // Click to toggle off
    await user.click(medCard);
    // Click to toggle on
    await user.click(medCard);
  });

  it("completes onboarding and navigates to /dashboard", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: { data: { success: true } } }),
    } as Response);

    render(<OnboardingWizard initialName="Arun Kumar" initialTimezone="Asia/Kolkata" />);

    // Advance to Step 3
    await user.click(screen.getByRole("button", { name: /^Continue$/i }));
    await user.click(screen.getByRole("button", { name: /^Continue$/i }));

    // Click Launch
    await user.click(screen.getByRole("button", { name: /Launch Dashboard/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/trpc/onboarding.complete",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("allows skipping onboarding directly to /dashboard", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: { data: { success: true } } }),
    } as Response);

    render(<OnboardingWizard initialName="Arun Kumar" />);

    const skipBtn = screen.getByRole("button", { name: /Skip for now/i });
    await user.click(skipBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/trpc/auth.setOnboardingComplete",
        expect.objectContaining({ method: "POST" }),
      );
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});

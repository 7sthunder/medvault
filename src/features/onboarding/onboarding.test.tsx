/* @vitest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  completeMutate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  api: {
    onboarding: {
      complete: {
        useMutation: () => ({
          mutate: mocks.completeMutate,
          isPending: false,
          error: null,
        }),
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

describe("OnboardingWizard (phase 10)", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.completeMutate.mockReset();
  });

  it("walks Profile → Reminders → Finish and submits the collected defaults", async () => {
    mocks.completeMutate.mockImplementation((_values, opts) => opts.onSuccess?.());
    const user = userEvent.setup();
    render(<OnboardingWizard userName="Sarah Jenkins" initialTimezone="UTC" />);

    expect(screen.getByRole("heading", { name: /Welcome, Sarah/i })).toBeInTheDocument();
    expect(screen.getByText("Time zone")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.getByText("Missed-after")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.getByText("Continue to dashboard")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Continue to dashboard/i }));

    await waitFor(() => {
      expect(mocks.completeMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: "UTC",
          missedAfterMinutes: 30,
          snoozeMinutes: 10,
          maxSnoozes: 3,
          reminderBeforeMinutes: 5,
          addSampleMed: false,
        }),
        expect.anything(),
      );
      expect(mocks.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("offers the sample-medication toggle and reflects it on the finish step", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard userName="Sarah Jenkins" initialTimezone="UTC" />);

    await user.click(screen.getByRole("button", { name: /Next/i }));
    await user.click(screen.getByRole("switch", { name: /Add Metformin sample medication/i }));
    await user.click(screen.getByRole("button", { name: /Next/i }));

    expect(screen.getByText(/08:00/)).toBeInTheDocument();
    expect(screen.getByText(/Metformin/i)).toBeInTheDocument();
  });

  it("blocks advancing past Reminders when a reminder number is below the allowed range", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard userName="Sarah Jenkins" initialTimezone="UTC" />);

    await user.click(screen.getByRole("button", { name: /Next/i }));

    const snooze = screen.getByRole("spinbutton", { name: /Snooze/ });
    await user.clear(snooze);
    await user.type(snooze, "0");
    await user.click(screen.getByRole("button", { name: /Next/i }));

    expect(await screen.findByText("Snooze must be at least 1.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continue to dashboard/i })).not.toBeInTheDocument();
  });
});
/* @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AssistantPanel } from "@/features/assistant/AssistantPanel";
import { AssistantProvider } from "@/features/assistant/assistant-context";

/**
 * Regression cover for a real outage: a refactor of `AppShell` dropped `AssistantProvider`, and
 * `/assistant` threw "useAssistant must be used inside <AssistantProvider>" instead of
 * rendering. The panel now supplies its own store when the shell did not, so these assertions
 * pin both that fallback and the shared case.
 */

vi.mock("@/lib/trpc", () => ({
  api: {
    assistant: {
      status: { useQuery: () => ({ isLoading: false, data: { enabled: true } }) },
      turn: { useMutation: () => ({ mutateAsync: async () => ({}), isPending: false }) },
      transcribe: { useMutation: () => ({ mutateAsync: async () => ({}), isPending: false }) },
      speak: { useMutation: () => ({ mutateAsync: async () => ({}), isPending: false }) },
    },
    medication: { list: { invalidate: async () => {} } },
    useUtils: () => ({ medication: { list: { invalidate: async () => {} } } }),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("AssistantPanel", () => {
  it("renders without an AssistantProvider above it", () => {
    // No wrapper on purpose: this is the case that took the page down.
    render(<AssistantPanel variant="page" />);

    expect(screen.getByRole("heading", { name: /voice assistant/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^speak$/i })).toBeInTheDocument();
  });

  it("uses the shell's conversation when one is present", () => {
    render(
      <AssistantProvider>
        <AssistantPanel variant="sheet" />
      </AssistantProvider>,
    );

    expect(screen.getByText(/add a medication by talking/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /voice assistant/i })).toBeNull();
  });
});

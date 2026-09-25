/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RichErrorBoundary } from "./rich-error-boundary";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Phase 26 — RichErrorBoundary Component", () => {
  const mockError = new Error("Test database timeout failure");
  (mockError as Error & { digest?: string }).digest = "test-digest-123";
  const mockReset = vi.fn();

  it("renders error state with alert semantics, title, and description", () => {
    render(
      <RichErrorBoundary
        error={mockError}
        reset={mockReset}
        title="Custom Failure"
        description="Friendly explanation for users."
      />,
    );

    const alertRegion = screen.getByRole("alert");
    expect(alertRegion).toBeDefined();
    expect(alertRegion.getAttribute("aria-live")).toBe("assertive");
    expect(screen.getByText("Custom Failure")).toBeDefined();
    expect(screen.getByText("Friendly explanation for users.")).toBeDefined();
  });

  it("triggers reset callback when Try Again is clicked", () => {
    render(<RichErrorBoundary error={mockError} reset={mockReset} />);

    const retryBtn = screen.getByTestId("error-retry-button");
    fireEvent.click(retryBtn);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("toggles technical details accordion and exposes error stack and digest", () => {
    render(<RichErrorBoundary error={mockError} reset={mockReset} />);

    const toggleBtn = screen.getByText("Show technical details");
    expect(toggleBtn).toBeDefined();
    expect(screen.queryByText(/Digest: test-digest-123/)).toBeNull();

    // Open details
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Digest: test-digest-123/)).toBeDefined();
    // Message appears in both the summary <p> and the stack <pre>; just confirm at least one match
    expect(screen.getAllByText(/Test database timeout failure/).length).toBeGreaterThan(0);

    // Close details
    const hideBtn = screen.getByText("Hide technical details");
    fireEvent.click(hideBtn);
    expect(screen.queryByText(/Digest: test-digest-123/)).toBeNull();
  });

  it("copies details to clipboard when copy button is pressed", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
    });

    render(<RichErrorBoundary error={mockError} reset={mockReset} />);

    // Open accordion first
    fireEvent.click(screen.getByText("Show technical details"));

    const copyBtn = screen.getByText("Copy");
    fireEvent.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledWith(
      expect.stringContaining("Test database timeout failure"),
    );
  });
});

/* @vitest-environment jsdom */
/**
 * Phase 27 — Component tests for EmptyState, ErrorState, FormField, StatCard.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pill } from "lucide-react";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
describe("EmptyState", () => {
  it("renders title text", () => {
    render(<EmptyState title="No medications found" />);
    expect(screen.getByText("No medications found")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="Add your first medication." />);
    expect(screen.getByText("Add your first medication.")).toBeDefined();
  });

  it("renders icon when provided", () => {
    const { container } = render(<EmptyState title="Empty" icon={Pill} />);
    // Icon is rendered inside aria-hidden span
    const iconSpan = container.querySelector('[aria-hidden="true"]');
    expect(iconSpan).not.toBeNull();
  });

  it("renders action slot when provided", () => {
    render(<EmptyState title="Empty" action={<button>Add</button>} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeDefined();
  });

  it("does not render description or action when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("applies compact variant class", () => {
    const { container } = render(<EmptyState title="Compact" compact />);
    const root = container.querySelector('[data-slot="empty-state"]');
    expect(root?.className).toContain("p-4");
  });

  it("applies full-size class when not compact", () => {
    const { container } = render(<EmptyState title="Full" />);
    const root = container.querySelector('[data-slot="empty-state"]');
    expect(root?.className).toContain("p-8");
  });
});

// ---------------------------------------------------------------------------
// ErrorState
// ---------------------------------------------------------------------------
describe("ErrorState", () => {
  it("renders with default title and description", () => {
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText(/The page couldn't be loaded/)).toBeDefined();
  });

  it("renders custom title and description", () => {
    render(<ErrorState title="Load failed" description="Network error." />);
    expect(screen.getByText("Load failed")).toBeDefined();
    expect(screen.getByText("Network error.")).toBeDefined();
  });

  it("has role=alert for screen readers", () => {
    render(<ErrorState />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
  });

  it("renders icon when provided", () => {
    const { container } = render(<ErrorState icon={Pill} />);
    const iconSpan = container.querySelector('[aria-hidden="true"]');
    expect(iconSpan).not.toBeNull();
  });

  it("renders action slot", () => {
    render(<ErrorState action={<button>Retry</button>} />);
    expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
  });

  it("applies compact size classes", () => {
    const { container } = render(<ErrorState compact />);
    const root = container.querySelector('[data-slot="error-state"]');
    expect(root?.className).toContain("p-4");
  });
});

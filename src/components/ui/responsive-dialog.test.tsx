/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

function stubMatchMedia(small: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: small ? true : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderDialog(isMobile: boolean) {
  stubMatchMedia(isMobile);
  return render(
    <ResponsiveDialog
      open
      onOpenChange={() => {}}
      title="Adjust reminders"
      description="Future doses only."
      footer={<button>Save</button>}
    >
      <p>Body content</p>
    </ResponsiveDialog>,
  );
}

describe("ResponsiveDialog", () => {
  it("renders a centered dialog on desktop (md+)", () => {
    renderDialog(false);
    expect(screen.getByText("Adjust reminders")).toBeTruthy();
    expect(screen.getByText("Body content")).toBeTruthy();
    // Portals mount into document.body, so the container query would miss them.
    expect(document.querySelector("[data-slot='dialog-content']")).toBeTruthy();
    expect(document.querySelector("[data-slot='drawer-content']")).toBeNull();
  });

  it("renders a bottom sheet on mobile (< md)", () => {
    renderDialog(true);
    expect(screen.getByText("Adjust reminders")).toBeTruthy();
    expect(screen.getByText("Body content")).toBeTruthy();
    expect(document.querySelector("[data-slot='drawer-content']")).toBeTruthy();
    expect(document.querySelector("[data-slot='dialog-content']")).toBeNull();
  });
});

/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { pathname, router } = vi.hoisted(() => ({
  pathname: { current: "/dashboard" },
  router: { push: vi.fn(), refresh: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => router,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: { signOut: vi.fn().mockResolvedValue(undefined) },
}));

import { AppShell } from "@/components/layout/AppShell";

const user = {
  id: "u-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: null,
  timezone: "America/New_York",
  onboardingCompleted: true,
};

function renderShell() {
  return render(
    <AppShell user={user}>
      <p>Page body</p>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("renders the sidebar, top header and page content", () => {
    renderShell();

    expect(screen.getByText("Page body")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Medications" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Today's Schedule" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "History" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Notifications" })).toBeTruthy();
    // Phase 16 replaced the top-header /notifications link with the live `NotificationBell`
    // popover trigger, so the second affordance is a button, not a link.
    expect(screen.getByRole("button", { name: "Notifications" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Settings" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Help" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Bottom navigation" })).toBeTruthy();
  });

  it("marks the current page as active in the sidebar", () => {
    renderShell();
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Medications" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("re-activates the nav when the pathname changes", () => {
    const view = renderShell();
    pathname.current = "/schedule";
    view.rerender(
      <AppShell user={user}>
        <p>Page body</p>
      </AppShell>,
    );
    expect(
      screen.getByRole("link", { name: "Today's Schedule" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("aria-current")).toBeNull();
  });

  it("renders a breadcrumb trail for the current page", () => {
    pathname.current = "/settings/reminders";
    renderShell();
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumbs" });
    expect(crumbs.textContent).toContain("Settings");
    expect(crumbs.textContent).toContain("Reminders");
    expect(crumbs.textContent).toContain("Home");
  });

  it("opens the More bottom sheet on the mobile More action", async () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Menu" })).toBeTruthy());
    expect(screen.getByText("Everything in your vault.")).toBeTruthy();
    expect(document.querySelector("[data-slot='drawer-content']")).toBeTruthy();
  });

  it("opens the profile menu with user details and sign out", async () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Open profile menu" }));
    await waitFor(() => expect(screen.getByText("ada@example.com")).toBeTruthy());
    expect(screen.getByRole("menuitem", { name: /Settings/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: /Sign out/ }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
  });

  it("exposes a skip link pointing at a focusable main-content target (WCAG 2.4.1)", () => {
    renderShell();

    // The shell must not add its own <main>: each feature page owns that landmark, and a second
    // one (or a nested one) is invalid and fails axe's duplicate-main rule.
    expect(document.querySelectorAll("main")).toHaveLength(0);

    const target = document.getElementById("main-content");
    expect(target).toBeTruthy();
    // Focusable so the fragment navigation moves focus, not just the scroll position.
    expect(target?.getAttribute("tabindex")).toBe("-1");

    const skip = screen.getByRole("link", { name: /skip to main content/i });
    expect(skip.getAttribute("href")).toBe("#main-content");
    // Hidden until focused, but still in the a11y tree so it stays discoverable.
    expect(skip.className).toContain("sr-only");
    expect(skip.className).toContain("focus:not-sr-only");
  });

  describe("desktop sidebar collapse", () => {
    // The choice is persisted, so each case has to start from a clean slate.
    beforeEach(() => {
      localStorage.clear();
    });

    it("starts expanded and toggles to a collapsed icon rail", async () => {
      renderShell();
      const aside = document.getElementById("sidebar");
      expect(aside?.getAttribute("data-collapsed")).toBe("false");

      const toggle = screen.getByRole("button", { name: "Collapse sidebar" });
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      expect(toggle.getAttribute("aria-controls")).toBe("sidebar");

      fireEvent.click(toggle);

      await waitFor(() =>
        expect(document.getElementById("sidebar")?.getAttribute("data-collapsed")).toBe("true"),
      );
      expect(
        screen.getByRole("button", { name: "Expand sidebar" }).getAttribute("aria-expanded"),
      ).toBe("false");
    });

    it("keeps nav links reachable by accessible name when collapsed", async () => {
      renderShell();
      fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      await waitFor(() =>
        expect(document.getElementById("sidebar")?.getAttribute("data-collapsed")).toBe("true"),
      );

      // The label is visually hidden but must stay in the a11y tree, otherwise the icon-only
      // links become unlabelled and unusable with a screen reader.
      const link = screen.getByRole("link", { name: "Dashboard" });
      expect(link.getAttribute("href")).toBe("/dashboard");
      expect(link.getAttribute("title")).toBe("Dashboard");
      expect(link.querySelector("span")?.className).toContain("sr-only");
    });

    it("persists the collapsed choice", async () => {
      renderShell();
      fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      await waitFor(() =>
        expect(localStorage.getItem("meditrackai.sidebar-collapsed")).toBe("true"),
      );

      fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
      await waitFor(() =>
        expect(localStorage.getItem("meditrackai.sidebar-collapsed")).toBe("false"),
      );
    });
  });
});

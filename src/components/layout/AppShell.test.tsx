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

/**
 * The sidebar primitive decides "desktop" with `useIsDesktop()` (a matchMedia query at the `lg`
 * breakpoint) and routes the trigger accordingly: collapse the rail on desktop, open the drawer
 * below it. jsdom's matchMedia never matches, which would make every trigger click open the
 * (invisible) drawer, so the breakpoint is stubbed and the collapse cases opt into desktop.
 */
let isDesktop = true;

const matchMediaStub = (query: string) => ({
  matches: query.includes("1024px") ? isDesktop : false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

// Assigned on `window` rather than through `vi.stubGlobal`: under vitest's jsdom environment
// `globalThis` and the jsdom `window` are distinct objects, and `useMediaQuery` reads
// `window.matchMedia`.
vi.stubGlobal("matchMedia", matchMediaStub);
window.matchMedia = matchMediaStub as unknown as typeof window.matchMedia;

function resetSidebarCookie() {
  document.cookie = "sidebar_state=; path=/; max-age=0";
}

/** The persistent desktop rail, as opposed to the below-`lg` drawer. */
const rail = () => document.querySelector("[data-slot='sidebar-desktop']");

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
  beforeEach(() => {
    isDesktop = true;
    resetSidebarCookie();
  });

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
    // The rail only exists at/above `lg`, and the choice is persisted in a cookie, so each case
    // starts from a known viewport and a clean cookie.
    beforeEach(() => {
      pathname.current = "/dashboard";
      resetSidebarCookie();
    });

    it("starts expanded, with no collapsed-rail styling applied", () => {
      renderShell();

      expect(rail()?.getAttribute("data-state")).toBe("expanded");
      // The `data-collapsible` bit is what every descendant keys its collapsed styling off, so it
      // must be absent (not "icon") while the rail is open.
      expect(rail()?.getAttribute("data-collapsible")).toBe("");

      const trigger = screen.getByRole("button", { name: "Toggle Sidebar" });
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });

    it("flips data-collapsible to icon when the trigger collapses it", async () => {
      renderShell();

      fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));

      await waitFor(() => expect(rail()?.getAttribute("data-state")).toBe("collapsed"));
      expect(rail()?.getAttribute("data-collapsible")).toBe("icon");
      expect(
        screen.getByRole("button", { name: "Toggle Sidebar" }).getAttribute("aria-expanded"),
      ).toBe("false");
    });

    it("toggles with Ctrl+B", async () => {
      renderShell();

      fireEvent.keyDown(window, { key: "b", ctrlKey: true });

      await waitFor(() => expect(rail()?.getAttribute("data-state")).toBe("collapsed"));

      fireEvent.keyDown(window, { key: "b", metaKey: true });
      await waitFor(() => expect(rail()?.getAttribute("data-state")).toBe("expanded"));
    });

    it("keeps nav links reachable by accessible name when collapsed", async () => {
      renderShell();
      fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
      await waitFor(() => expect(rail()?.getAttribute("data-state")).toBe("collapsed"));

      // The label is visually hidden but must stay in the a11y tree, otherwise the icon-only links
      // become unlabelled and unusable with a screen reader. This is the deliberate deviation from
      // the reference, which uses `hidden` and drops the name entirely.
      const link = screen.getByRole("link", { name: "Dashboard" });
      expect(link.getAttribute("href")).toBe("/dashboard");
      expect(link.querySelector("span")?.className).toContain(
        "group-data-[collapsible=icon]:sr-only",
      );
    });

    it("turns collapsed links into tooltip triggers, since the label is no longer visible", async () => {
      renderShell();

      // base-ui marks tooltip triggers with its own attribute; `data-slot` is not usable here
      // because `useRender` sets it from the button's own state.
      expect(
        screen
          .getByRole("link", { name: "Dashboard" })
          .hasAttribute("data-base-ui-tooltip-trigger"),
      ).toBe(false);

      fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
      await waitFor(() => expect(rail()?.getAttribute("data-state")).toBe("collapsed"));

      expect(
        screen
          .getByRole("link", { name: "Dashboard" })
          .hasAttribute("data-base-ui-tooltip-trigger"),
      ).toBe(true);
    });

    it("persists the collapsed choice in a cookie and restores it on mount", async () => {
      const { unmount } = renderShell();

      fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
      await waitFor(() => expect(document.cookie).toContain("sidebar_state=false"));

      unmount();

      // Re-mounting picks the stored choice back up, so the rail does not silently reset.
      renderShell();
      await waitFor(() => expect(rail()?.getAttribute("data-state")).toBe("collapsed"));
    });
  });

  describe("below the lg breakpoint", () => {
    beforeEach(() => {
      isDesktop = false;
      pathname.current = "/dashboard";
      resetSidebarCookie();
    });

    it("mounts no rail and opens the drawer from the same trigger", async () => {
      renderShell();

      // Only one navigation tree may exist at a time, so the rail is absent rather than merely
      // hidden — a second copy of every nav link in the a11y tree is a screen-reader bug.
      await waitFor(() => expect(rail()).toBeNull());

      fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));

      await waitFor(() => expect(screen.getByRole("link", { name: "Dashboard" })).toBeTruthy());
      expect(document.querySelector("[data-slot='sidebar-mobile']")).toBeTruthy();
    });

    it("closes the drawer when a nav link is followed", async () => {
      renderShell();

      fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
      const link = await screen.findByRole("link", { name: "Dashboard" });

      fireEvent.click(link);

      // Otherwise the drawer would sit on top of the page it just navigated to.
      await waitFor(() =>
        expect(document.querySelector("[data-slot='sidebar-mobile']")).toBeNull(),
      );
    });
  });
});

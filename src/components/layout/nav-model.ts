import { NAV_ITEMS, SETTINGS_NAV } from "@shared/nav";

export interface ShellCrumb {
  label: string;
  href?: string;
}

export interface ShellPageContext {
  title: string;
  crumbs: ShellCrumb[];
}

const SECTION_ROOTS = new Set(["/medications", "/schedule", "/adherence", "/caregiver"]);

const CHILD_LABELS: Readonly<Record<string, string>> = {
  new: "New",
  edit: "Edit",
  accept: "Accept Invitation",
  alerts: "Alerts",
};

function normalize(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function tailOf(p: string): string {
  const i = p.lastIndexOf("/");
  return i === -1 ? p : p.slice(i + 1);
}

function childLabel(rest: string): string {
  const parts = rest.split("/");
  const last = parts[parts.length - 1] ?? "";
  if (last.startsWith("[") || last.includes("-") || /\d{8,}/.test(last)) return "Details";
  return last in CHILD_LABELS ? (CHILD_LABELS[last] ?? "Details") : titleCase(last);
}

function titleCase(segment: string): string {
  if (!segment) return "Vault";
  const text = segment.split(/[-_]/).filter(Boolean).join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const PAGE_TITLES: Readonly<Record<string, string>> = Object.fromEntries([
  ...NAV_ITEMS.map((i) => [i.href, i.label]),
  ...SETTINGS_NAV.map((i) => [i.href, i.label]),
]);

/**
 * Phase 18 (§10.8) — the demo workspace serves the *same* screens under `/demo/workspace/…`.
 *
 * Rather than forking the nav, the shell carries a `basePath` and every href/active-check is
 * resolved through these two helpers. One place to reason about means a demo link can never point
 * at a route that only exists for real accounts, and the route-manifest test keeps working because
 * the underlying `NAV_ITEMS` are unchanged.
 */
export function stripBasePath(pathname: string, basePath?: string): string {
  if (!basePath) return normalize(pathname);
  const p = normalize(pathname);
  if (p === basePath) return "/dashboard";
  if (p.startsWith(`${basePath}/`)) return p.slice(basePath.length);
  return p;
}

export function withBasePath(href: string, basePath?: string): string {
  if (!basePath || href === "more") return href;
  return `${basePath}${href}`;
}

export function isNavItemActive(itemHref: string, pathname: string, basePath?: string): boolean {
  return isNavItemActiveRaw(stripBasePath(pathname, basePath), itemHref);
}

function isNavItemActiveRaw(p: string, itemHref: string): boolean {
  if (itemHref === p) return true;
  if (itemHref === "/settings/profile" && p.startsWith("/settings/")) return true;
  if (SECTION_ROOTS.has(itemHref) && p.startsWith(itemHref + "/")) return true;
  return false;
}

export function getPageContext(pathname: string, basePath?: string): ShellPageContext {
  const p = stripBasePath(pathname, basePath);
  const home = withBasePath("/dashboard", basePath);
  const settings = withBasePath("/settings/profile", basePath);

  if (p === "/dashboard") {
    return { title: "Dashboard", crumbs: [{ label: "Dashboard" }] };
  }

  if (p.startsWith("/settings/")) {
    const label = PAGE_TITLES[p] ?? titleCase(tailOf(p));
    return {
      title: label,
      crumbs: [
        { label: "Home", href: home },
        { label: "Settings", href: settings },
        { label },
      ],
    };
  }

  const exact = PAGE_TITLES[p];
  if (exact) {
    return {
      title: exact,
      crumbs: [
        { label: "Home", href: home },
        { label: exact },
      ],
    };
  }

  const root = [...SECTION_ROOTS].find((r) => p.startsWith(r + "/"));
  if (root) {
    const sectionTitle = PAGE_TITLES[root] ?? titleCase(tailOf(root));
    return {
      title: sectionTitle,
      crumbs: [
        { label: "Home", href: home },
        { label: sectionTitle, href: withBasePath(root, basePath) },
        { label: childLabel(p.slice(root.length + 1)) },
      ],
    };
  }

  const title = titleCase(tailOf(p));
  return {
    title,
    crumbs: [
      { label: "Home", href: home },
      { label: title },
    ],
  };
}
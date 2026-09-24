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

export function isNavItemActive(itemHref: string, pathname: string): boolean {
  const p = normalize(pathname);
  if (itemHref === p) return true;
  if (itemHref === "/settings/profile" && p.startsWith("/settings/")) return true;
  if (SECTION_ROOTS.has(itemHref) && p.startsWith(itemHref + "/")) return true;
  return false;
}

export function getPageContext(pathname: string): ShellPageContext {
  const p = normalize(pathname);

  if (p === "/dashboard") {
    return { title: "Dashboard", crumbs: [{ label: "Dashboard" }] };
  }

  if (p.startsWith("/settings/")) {
    const label = PAGE_TITLES[p] ?? titleCase(tailOf(p));
    return {
      title: label,
      crumbs: [
        { label: "Home", href: "/dashboard" },
        { label: "Settings", href: "/settings/profile" },
        { label },
      ],
    };
  }

  const exact = PAGE_TITLES[p];
  if (exact) {
    return {
      title: exact,
      crumbs: [
        { label: "Home", href: "/dashboard" },
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
        { label: "Home", href: "/dashboard" },
        { label: sectionTitle, href: root },
        { label: childLabel(p.slice(root.length + 1)) },
      ],
    };
  }

  const title = titleCase(tailOf(p));
  return {
    title,
    crumbs: [
      { label: "Home", href: "/dashboard" },
      { label: title },
    ],
  };
}
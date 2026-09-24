/**
 * Phase 08 — pure pagination math for DataTable + list pages.
 * React-free; unit tests live in `pagination.test.ts`.
 */

export type PageItem = number | "ellipsis";

/** Clamp `page` into `[1, pageCount]` (1 when there are no pages). */
export function clampPage(page: number, pageCount: number): number {
  if (!Number.isFinite(pageCount) || pageCount <= 0) return 1;
  return Math.min(Math.max(1, Math.floor(page)), pageCount);
}

/** Slice `items` for a 1-based `page` of `pageSize`. */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): readonly T[] {
  if (pageSize <= 0) return items;
  const start = (clampPage(page, Math.ceil(items.length / pageSize)) - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/**
 * Window of page numbers around `current` with ellipsis gaps, e.g.
 * `[1, "ellipsis", 4, 5, 6, "ellipsis", 20]`. `maxSlots` bounds the window size.
 */
export function getPageItems(current: number, pageCount: number, maxSlots = 7): PageItem[] {
  if (pageCount <= 0) return [];
  const page = clampPage(current, pageCount);
  if (pageCount <= maxSlots) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const span = Math.max(maxSlots - 2, 1); // slots available for the middle window
  const half = Math.floor(span / 2);

  let start = page - half;
  let end = page + half;
  // If the window overflows at the start, pin pages 1..end and put ellipsis at the end.
  if (start < 2) {
    start = 1;
    end = span + 2 > pageCount ? pageCount : span;
  } else if (end > pageCount - 1) {
    // Overflow at the end: pin last pages, ellipsis at the front.
    end = pageCount;
    start = Math.max(pageCount - span + 1, 2);
  }

  const items: PageItem[] = [];
  if (start > 1) {
    items.push(1);
  }
  if (start > 2) {
    items.push("ellipsis");
  }
  for (let i = start; i <= Math.min(end, pageCount); i++) items.push(i);
  if (end < pageCount - 1) {
    items.push("ellipsis");
  }
  if (end < pageCount) {
    items.push(pageCount);
  }
  return items;
}

export interface PageSummary {
  page: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
  items: PageItem[];
}

/** Everything the UI needs for one page footer, derived from raw inputs. */
export function pageSummary(
  current: number,
  total: number,
  pageSize: number,
  maxSlots?: number,
): PageSummary {
  if (pageSize <= 0) {
    return { page: 1, pageCount: 1, total, from: total ? 1 : 0, to: total, items: [1] };
  }
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = clampPage(current, pageCount);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return { page, pageCount, total, from, to, items: getPageItems(page, pageCount, maxSlots) };
}
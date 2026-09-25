import { describe, expect, it } from "vitest";

import { clampPage, getPageItems, pageSummary, paginate } from "@/lib/pagination";

describe("lib/pagination — clamp + slice", () => {
  it("clamps into [1, pageCount]", () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(3, 5)).toBe(3);
    expect(clampPage(99, 5)).toBe(5);
    expect(clampPage(2, 0)).toBe(1);
  });

  it("slices a 1-based page of items", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(paginate(items, 1, 4)).toEqual([1, 2, 3, 4]);
    expect(paginate(items, 3, 4)).toEqual([9, 10]);
    expect(paginate(items, 99, 4)).toEqual([9, 10]); // out-of-range clamps to the last page
    expect(paginate(items, 1, 0)).toEqual(items); // paging disabled
  });
});

describe("lib/pagination — page window", () => {
  it("renders every page when the count fits the window", () => {
    expect(getPageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("adds a leading ellipsis when current is near the end", () => {
    expect(getPageItems(9, 20)).toEqual([1, "ellipsis", 7, 8, 9, 10, 11, "ellipsis", 20]);
  });

  it("pins the first pages when current is near the start", () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
  });

  it("pins the last pages when current is near the end", () => {
    expect(getPageItems(20, 20)).toEqual([1, "ellipsis", 16, 17, 18, 19, 20]);
  });

  it("returns nothing for an empty result set", () => {
    expect(getPageItems(1, 0)).toEqual([]);
  });
});

describe("lib/pagination — summary", () => {
  it("computes from/to + window in one call", () => {
    const s = pageSummary(2, 240, 10);
    expect(s).toMatchObject({ page: 2, pageCount: 24, total: 240, from: 11, to: 20 });
    expect(s.items[0]).toBe(1);
  });

  it("handles empty tables without dividing by zero", () => {
    const s = pageSummary(1, 0, 10);
    expect(s).toMatchObject({ page: 1, pageCount: 1, total: 0, from: 0, to: 0 });
    expect(s.items).toEqual([1]);
  });
});

/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { triggerFileDownload } from "@/lib/download";

describe("triggerFileDownload", () => {
  const createObjectURL = vi.fn(() => "blob:medvault-test");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clicks a download anchor carrying the filename, then cleans the node up", () => {
    const clicks: HTMLAnchorElement[] = [];
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const node = realCreateElement(tag) as HTMLElement;
      if (tag === "a") {
        const anchor = node as HTMLAnchorElement;
        anchor.click = () => clicks.push(anchor);
        return node;
      }
      return node;
    });

    triggerFileDownload("medvault-report-2026-01-01_2026-01-30-daily.csv", "a,b\n1,2\n");

    expect(clicks).toHaveLength(1);
    expect(clicks[0]?.download).toBe("medvault-report-2026-01-01_2026-01-30-daily.csv");
    expect(clicks[0]?.href).toBe("blob:medvault-test");
    // The anchor is removed so it never accumulates in the document.
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("defers revokeObjectURL so Safari does not cancel the download", () => {
    vi.useFakeTimers();
    triggerFileDownload("x.csv", "data");

    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:medvault-test");
  });

  it("passes a Blob straight through instead of re-wrapping it", () => {
    const blob = new Blob(["a,b"], { type: "text/csv" });
    triggerFileDownload("x.csv", blob);
    expect(createObjectURL).toHaveBeenCalledWith(blob);
  });
});

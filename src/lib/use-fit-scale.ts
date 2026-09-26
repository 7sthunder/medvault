"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fits a fixed-size design inside whatever width its container actually has, by scaling it down
 * proportionally. Use this for artwork/compositions authored at a fixed pixel size (the landing
 * hero's 756×729 phone scene is the motivating case) rather than rebuilding them out of
 * percentages — the composition stays pixel-identical, it just gets smaller.
 *
 * The returned `ref` goes on the *available-space* element; the caller renders its fixed-size
 * content inside and applies `scale`. `scale` is never above 1, so a design is never blown up
 * past the size it was authored at.
 *
 * SSR-safe: returns `null` scale (caller should render the unscaled design) until mounted, so the
 * server and first client render agree. Requires a real `ResizeObserver`, so there is a
 * `ResizeObserver`-absent fallback that simply never scales — old browsers get a scrollbar rather
 * than a broken layout.
 */
export function useFitScale(designWidth: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // `clientWidth` excludes the scrollbar, which is what we want: it is the space actually
    // available to lay out in.
    const available = el.clientWidth;
    if (available <= 0) return;
    setScale(Math.min(1, available / designWidth));
  }, [designWidth]);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return { ref, scale };
}

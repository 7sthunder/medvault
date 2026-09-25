"use client";

import { useEffect, useState } from "react";

import { BREAKPOINTS } from "@shared/breakpoints";

/**
 * SSR-safe matchMedia hook. Returns `defaultMatches` on the server and on the
 * first client render (so hydration output always matches the server), then
 * re-evaluates once mounted and on every media-query change.
 */
export function useMediaQuery(query: string, defaultMatches = false): boolean {
  const [matches, setMatches] = useState(defaultMatches);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/** True on viewports below `md` (plan §16: bottom nav + mobile sheets). */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`, false);
}

/** True at/above `lg` (plan §16: persistent sidebar). */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`, false);
}

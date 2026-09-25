/**
 * Phase 08 — chart palette, single source for Recharts wrappers.
 *
 * Colours trace back to plan §5.3 (emerald primary, cyan secondary, magenta, amber,
 * violet from the `.dark` charts); grid is §5 table border `#e2e8f0`. CSS-var
 * references keep dark-mode switching free (values are declared in `globals.css`).
 */

export const CHART_PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
] as const;

/** §5 table border — CartesianGrid stroke. */
export const CHART_GRID = "#e2e8f0";

/** Axis tick + line colour (ink-400). */
export const CHART_AXIS = "#94a3b8";

/** Chart font matches the Plus Jakarta Sans body stack. */
export const CHART_FONT_FAMILY = "var(--font-jakarta), system-ui, sans-serif";

export function chartColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length] ?? CHART_PALETTE[0];
}

export interface ChartSeries {
  /** Key on each datum. */
  key: string;
  /** Tooltip/legend label. */
  name: string;
  /** Optional explicit colour (defaults to palette by index). */
  color?: string;
}

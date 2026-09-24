/**
 * Shared chart datum shape. Kept separate from `chart.tsx` so later phases can
 * reference the type without importing the client component module.
 */
export type ChartDatum = {
  [key: string]: string | number
}
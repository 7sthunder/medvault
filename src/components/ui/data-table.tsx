"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { getPageItems } from "@/lib/pagination"

type Align = "left" | "right" | "center"
type HideBelow = "sm" | "md" | "lg"

export interface DataTableColumn<T> {
  /** Stable id (also the sort key when `value` is provided). */
  key: string
  header: React.ReactNode
  /** Sort accessor. Omit (or set `sortable: false`) for non-sortable columns. */
  value?: (row: T) => string | number | null | undefined
  /** Custom cell renderer; defaults to `String(value(row))`. */
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  align?: Align
  /** Hide the whole column below the given Tailwind tier. */
  hideBelow?: HideBelow
  headerClassName?: string
  cellClassName?: string
}

export interface DataTableProps<T> {
  columns: readonly DataTableColumn<T>[]
  rows: readonly T[]
  rowKey: (row: T) => string
  /** Rows per page. `0` disables pagination. */
  pageSize?: number
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  /**
   * A11y name for the table + fallback text while sorting. Defaults to
   * `"data table"` — pass the real thing (`"Medication list"`).
   */
  ariaLabel?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  /** Leading content in the pagination footer (e.g. "showing 1–10 of 240"). */
  footer?: React.ReactNode
  className?: string
}

const HIDE_CLASSES: Record<HideBelow, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
}

const ALIGN_CLASSES: Record<Align, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
}

/**
 * Phase 08 DataTable — §5 table recipe (header `bg-bg-soft`, stripes-less rows,
 * hover `bg-primary-tint`, borders `--border`), typed columns, internal sort +
 * pagination state, composed loading/empty/error states, responsive scroll.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  pageSize = 10,
  isLoading = false,
  error = undefined,
  onRetry,
  ariaLabel = "data table",
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  footer,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    setPage(1)
  }, [sortKey, sortDir, pageSize])

  const sortedRows = React.useMemo(() => {
    if (!sortKey) return rows
    const column = columns.find((c) => c.key === sortKey)
    const accessor = column?.value
    if (!accessor) return rows
    const sign = sortDir === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign
      return String(av).localeCompare(String(bv)) * sign
    })
  }, [rows, columns, sortKey, sortDir])

  const paged = pageSize > 0 ? sortedRows.slice((page - 1) * pageSize, page * pageSize) : sortedRows
  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1

  const toggleSort = (column: DataTableColumn<T>) => {
    const sortable = column.sortable ?? Boolean(column.value)
    if (!sortable) return
    if (sortKey !== column.key) {
      setSortKey(column.key)
      setSortDir("asc")
    } else if (sortDir === "asc") {
      setSortDir("desc")
    } else {
      setSortKey(null)
    }
  }

  const headerCellClass = (column: DataTableColumn<T>) =>
    cn(
      "px-3 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase",
      ALIGN_CLASSES[column.align ?? "left"],
      column.sortable === false || !column.value ? "" : "select-none",
      column.hideBelow && HIDE_CLASSES[column.hideBelow],
      column.key === sortKey ? "text-primary-dark" : "",
      column.headerClassName,
    )

  return (
    <div
      data-slot="data-table"
      className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-card-sm", className)}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={ariaLabel}>
          <thead className="bg-bg-soft">
            <tr>
              {columns.map((column) => {
                const sortable = column.sortable ?? Boolean(column.value)
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      sortKey === column.key
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={headerCellClass(column)}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        aria-label={`Sort by ${column.header}`}
                        className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
                        onClick={() => toggleSort(column)}
                      >
                        {column.header}
                        {sortKey === column.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 text-ink-400" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: Math.min(pageSize || 4, 6) }, (_, i) => (
                  <tr key={`skeleton-${i}`} className="border-t border-border" aria-hidden="true">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-3 py-3",
                          ALIGN_CLASSES[column.align ?? "left"],
                          column.hideBelow && HIDE_CLASSES[column.hideBelow],
                        )}
                      >
                        <Skeleton className={cn("h-4", i % 2 ? "w-2/3" : "w-4/5")} />
                      </td>
                    ))}
                  </tr>
                ))
              : paged.length === 0 && !error
                ? null
                : paged.map((row) => (
                    <tr
                      key={rowKey(row)}
                      data-slot="data-table-row"
                      className="border-t border-border transition-colors hover:bg-primary-tint/50"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            "px-3 py-2.5 align-middle text-ink-800",
                            ALIGN_CLASSES[column.align ?? "left"],
                            column.hideBelow && HIDE_CLASSES[column.hideBelow],
                            column.cellClassName,
                          )}
                        >
                          {column.render ? column.render(row) : String(column.value?.(row) ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>

      {!isLoading && error !== undefined && (
        <ErrorState compact title="Couldn't load the data" action={onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>} />
      )}

      {!isLoading && !error && paged.length === 0 && (
        <div className="p-6" data-slot="data-table-empty">
          <EmptyState compact icon={undefined} title={emptyTitle} description={emptyDescription} action={emptyAction} />
        </div>
      )}

      {pageSize > 0 && !isLoading && !error && pageCount > 1 && (
        <div className="flex flex-col gap-2 border-t border-border bg-muted/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground" data-slot="data-table-summary">
            {footer ?? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, sortedRows.length)} of ${sortedRows.length}`}
          </p>
          <nav aria-label="Table pagination" className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft />
            </Button>
            {getPageItems(page, pageCount).map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="px-1 text-xs text-muted-foreground" aria-hidden="true">
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === page ? "default" : "ghost"}
                  size="icon-sm"
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => setPage(item)}
                >
                  {item}
                </Button>
              ),
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next page"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              <ChevronRight />
            </Button>
          </nav>
        </div>
      )}
    </div>
  )
}
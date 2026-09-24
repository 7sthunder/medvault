/* @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DataTable, type DataTableColumn, type DataTableProps } from "@/components/ui/data-table";

interface Med {
  name: string
  dose: number
  status: "taken" | "missed"
}

const ROWS: Med[] = Array.from({ length: 10 }, (_, i) => ({
  name: `Med ${String(i + 1).padStart(2, "0")}`,
  dose: (i % 3) * 5 + 5,
  status: i % 2 === 0 ? "taken" : "missed",
}))

const COLUMNS: DataTableColumn<Med>[] = [
  { key: "name", header: "Medication", value: (r) => r.name },
  { key: "dose", header: "Dose", value: (r) => r.dose },
  { key: "status", header: "Status", value: (r) => r.status },
]

const rowKey = (r: Med) => r.name

function renderTable(props: Partial<DataTableProps<Med>> = {}) {
  return render(
    <DataTable columns={COLUMNS} rows={ROWS} rowKey={rowKey} pageSize={4} ariaLabel="Medication list" {...props} />,
  )
}

describe("DataTable", () => {
  it("renders rows + a working pagination footer", () => {
    renderTable()
    expect(screen.getByLabelText("Medication list")).toBeTruthy()
    expect(screen.getByText("Med 01")).toBeTruthy()
    expect(screen.getByText("Med 04")).toBeTruthy()
    expect(screen.queryByText("Med 05")).toBeNull()
    expect(screen.getByText("1–4 of 10")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Next page" }))
    expect(screen.getByText("Med 05")).toBeTruthy()
    expect(screen.getByText("5–8 of 10")).toBeTruthy()
  })

  it("sorts ascending then descending on the same header", async () => {
    const user = userEvent.setup()
    renderTable()

    const headerButton = () => screen.getByRole("button", { name: /Sort by Dose/i })
    const sortTh = () => headerButton().closest("th")!

    await user.click(headerButton())
    expect(sortTh().getAttribute("aria-sort")).toBe("ascending")

    await user.click(headerButton())
    expect(sortTh().getAttribute("aria-sort")).toBe("descending")
  })

  it("renders the empty state when there are no rows", () => {
    renderTable({ rows: [] })
    expect(screen.getByText("Nothing here yet")).toBeTruthy()
  })

  it("renders skeleton rows while loading", () => {
    const { container } = renderTable({ isLoading: true, rows: [] })
    expect(container.querySelectorAll("tbody tr").length).toBeGreaterThan(0)
    expect(screen.queryByText("Nothing here yet")).toBeNull()
  })

  it("renders the error state with a retry action", () => {
    renderTable({ rows: [], error: new Error("boom"), onRetry: () => {} })
    expect(screen.getByRole("alert").textContent).toContain("Couldn't load the data")
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy()
  })
})
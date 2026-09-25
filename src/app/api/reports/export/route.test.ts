import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/server/auth/server";
import * as reportsService from "@/server/domain/reports/service";
import type { ReportDTO } from "@/shared/types";
import { GET } from "./route";

vi.mock("@/server/auth/server", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  db: {} as never,
}));

vi.mock("@/server/domain/reports/service");

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

describe("Phase 20 — Reports CSV Export Route Handler", () => {
  const mockReport: ReportDTO = {
    granularity: "daily",
    from: new Date("2026-03-01T00:00:00Z"),
    to: new Date("2026-03-05T23:59:59Z"),
    medicationId: null,
    table: [
      {
        period: "2026-03-01",
        scheduled: 2,
        taken: 2,
        missed: 0,
        skipped: 0,
        adherencePercent: 100,
      },
    ],
    trend: [],
    summary: {
      scheduled: 2,
      taken: 2,
      missed: 0,
      skipped: 0,
      adherencePercent: 100,
    },
    missedAnalysis: {
      byBucket: [],
      byMedication: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 Unauthorized when session is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

    const request = new NextRequest("http://localhost:3000/api/reports/export");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when query parameters violate schema", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-123" },
      session: { id: "sess-1" },
    } as never);

    const request = new NextRequest(
      "http://localhost:3000/api/reports/export?from=2026-03-31&to=2026-03-01",
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid report export parameters.");
  });

  it("streams CSV with correct attachment headers when authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-123" },
      session: { id: "sess-1" },
    } as never);

    vi.mocked(reportsService.getReportData).mockResolvedValue(mockReport);
    vi.mocked(reportsService.generateReportCsv).mockReturnValue(
      "Period,Scheduled,Taken,Missed,Skipped,Adherence Rate\r\n2026-03-01,2,2,0,0,100%\r\n",
    );

    const request = new NextRequest(
      "http://localhost:3000/api/reports/export?from=2026-03-01&to=2026-03-05&granularity=daily",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toContain(
      'attachment; filename="medvault-report-daily-2026-03-01-to-2026-03-05.csv"',
    );

    const text = await response.text();
    expect(text).toContain("Period,Scheduled,Taken,Missed,Skipped,Adherence Rate");
    expect(text).toContain("2026-03-01,2,2,0,0,100%");
  });
});

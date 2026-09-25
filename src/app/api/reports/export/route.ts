import { NextResponse } from "next/server";

import { auth } from "@/server/auth/server";
import { db } from "@/server/db/client";
import { reportsService } from "@/server/domain/reports/service";
import { localDateKey, now } from "@/shared/times";
import { reportsSchemaFor } from "@/shared/validations/reports";

/**
 * Phase 16 — CSV export (§10.9/§11.11). `GET /api/reports/export?from&to&granularity`
 * authenticates, validates with the server-clock schema, and streams the same
 * `reportsService.generate` report as an attachment CSV (deterministic column order).
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = reportsSchemaFor(localDateKey(now(), "UTC")).safeParse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    granularity: searchParams.get("granularity") ?? undefined,
    medicationId: searchParams.get("medicationId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const input = parsed.data;
  const timeZone = session.user.timezone ?? "UTC";
  const report = await reportsService.generate(db, session.user.id, timeZone, input);

  const header = ["period", "scheduled", "taken", "missed", "skipped", "adherence_percent"];
  const rows = report.table.map((row) => [
    row.period,
    String(row.scheduled),
    String(row.taken),
    String(row.missed),
    String(row.skipped),
    row.adherencePercent == null ? "" : row.adherencePercent.toFixed(1),
  ]);
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const filename = `medvault-report-${input.from}_${input.to}-${input.granularity}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
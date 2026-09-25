import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/server";
import { db } from "@/server/db/client";
import { generateReportCsv, getReportData } from "@/server/domain/reports/service";
import { reportsSchema } from "@/shared/validations/reports";

/**
 * Phase 20 — Reports CSV Export Route Handler (plan §10.9, §11.11, §20).
 *
 * GET /api/reports/export?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=daily|weekly|monthly&medicationId=UUID
 *
 * Authenticated session required. Generates deterministic RFC 4180 CSV
 * formatted adherence logs directly from the canonical reports service.
 */
export async function GET(request: NextRequest) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const defaultFrom = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

  const from = searchParams.get("from") || defaultFrom;
  const to = searchParams.get("to") || defaultTo;
  const granularity = searchParams.get("granularity") ?? "daily";
  const medicationId = searchParams.get("medicationId") || undefined;

  const parsed = reportsSchema.safeParse({
    from,
    to,
    granularity,
    medicationId,
  });

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid report export parameters.",
        details: parsed.error.issues,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const report = await getReportData(db, session.user.id, parsed.data);
  const csv = generateReportCsv(report);

  const filename = `medvault-report-${parsed.data.granularity}-${parsed.data.from}-to-${parsed.data.to}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

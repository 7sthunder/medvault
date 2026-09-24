# BALA — Insights & Reporting Track (Phases 16–20, 24, 26)

> Branch plan for **`bala`** derived from `plan.md` §21. Companion to `impl.md`.
> This track answers *"How well am I following my schedule?"*: the single-source adherence
> engine, its UI surfaces (adherence, dashboard, history, reports), the settings center,
> and the final global a11y/responsive sweep. It is **one of two tracks (with hp) that
> build on aadhi's spine** — Phase 09 shell + Phase 13 statuses are prerequisites.

| | |
|---|---|
| Branch | `bala` (base: `main` @ `ee1ee99`) |
| Assigned phases | **16, 17, 18, 19, 20, 24, 26** |
| Merge target | `main` — merge **after** aadhi lands |
| Working order | 16 → 17 → 20 → 19 → 18 → 24 → 26 (dashboard last composes everything) |

---

## Non-negotiables (from plan §21/§22)

- Every page handles the four §15 states (loading / empty / error / success).
- Every tRPC procedure is **authed + owner-checked** (`protectedProcedure`).
- **Adherence numbers must come from one source** — `adherence.summary` — never recomputed in a UI.
- Always import shared contracts via `@shared/*`; never duplicate business logic.
- Never hardcode brand hex/rgba in `src/features/**` (eslint gate, active since Phase 03).
- Phase DoD = `pnpm typecheck` + `pnpm lint` + `pnpm test` + `pnpm build` all green.
- On completion of each phase append the impl-log section to `impl.md` and flip the matrix row.

---

## Phase 16 — Adherence engine (domain + aggregation service)

**Dependencies:** 05, 07, 13 (statuses from aadhi). **DB:** reads dose_events, writes adherence_daily. **Routes:** tRPC only.

- **Files:** `src/shared/calc/adherence.ts`, `streaks.ts`, `performance.ts` (pure); `src/server/domain/adherence/{service,summary,materialize}.ts`; `src/server/trpc/routers/adherence.ts` (summary, byMedication, patterns).
- **Details:** exact §10.5 formulas; single `summary()` consumed by **every** surface (dashboard 18, adherence UI 17, reports 20, insights on hp 23). Materialization updated by dose-service hooks (aadhi Phase 13) and schedule changes (aadhi Phase 12) — add a documented idempotent `recomputeDay/range` that those call, plus prune-beyond-window. In-progress-today semantics for streaks.
- **Critical test:** the §19 seeded dataset must yield **exactly 84 / 76 / 5 / 3, 90.5% (1dp), 7-day streak**; streak edge cases (today in-progress, gaps, miss=0); bucket counts; per-med aggregation; materialize/prune correctness.
- **DoD:** aggregation single-sourced & matches §19 sample.

## Phase 17 — Adherence UI + medication performance

**Dependencies:** 08, 09 (aadhi shell), 16. **Routes:** `/adherence`, `/adherence/medications`.

- **Files:** `src/features/adherence/{AdherencePage,RangeSelector,StatRail,MissedHeatStrip,MedicationPerformanceTable,PerformanceCell}.tsx` (TrendChart + TimeOfDayPattern reuse the Phase 08 `TrendChart`/`DataTable`), tRPC wiring.
- **Details:** all values from the one `AdherenceSummaryDTO`; missing-data days render as **gaps, not zeros**; med rows link `/medications/[id]` (route owned by aadhi).
- **Testing:** component renders DTO numbers (text match `90.5%`); e2e seeded demo adherence shows 84/76/5/3/8.
- **DoD:** adherence page matches dashboard numbers (same DTO).

## Phase 20 — Reports

**Dependencies:** 16 (same aggregates), 08. **Routes:** `/reports`, `/api/reports/export`.

- **Files:** `src/server/domain/reports/service.ts`, `src/server/trpc/routers/reports.ts`, `src/app/api/reports/export/route.ts` (authed, streams attachment), `src/features/reports/{ReportsPage,GranularityTabs,SummaryTable,MissedAnalysis,TrendChartBlock,DownloadButton}.tsx`.
- **Details:** granularity/range/scope controls per §10.9; server builds `ReportDTO`; **server boundary must call `reportsSchemaFor(serverToday)`** (see impl.md Phase 07 hand-off — never the loose client schema). CSV consistent with dashboard (same adherence service).
- **Testing:** aggregation equals adherence service; CSV format snapshot; e2e download contains 84 rows.

## Phase 19 — History

**Dependencies:** 13 (audit, aadhi), 08, 09. **Routes:** `/history`.

- **Files:** `src/server/domain/doseActions/history.ts` (query + group, joins medications by id — soft delete keeps rows), `src/server/trpc/routers/history.ts`, `src/features/history/{HistoryPage,FilterBar,HistoryTimeline,HistoryRowMenu}.tsx`.
- **Details:** filters (range, med, status); take-late shows both events; pagination cursor (`HISTORY_PAGE_SIZE`); archived meds still listed.
- **Testing:** filter interactions; e2e create → take → history row present; archived med still listed.

## Phase 18 — Dashboard

**Dependencies:** 14 (dose UI, aadhi), 16, 17 (charts), 09 (shell). **Routes:** `/dashboard`.

- **Files:** `src/server/domain/dashboard/service.ts` (aggregates), `src/server/trpc/routers/dashboard.ts` (single `dashboard.get`), `src/features/dashboard/{DashboardPage,NextDoseHero,TodayFeed,AdherenceWidget,MedSummary,InsightWidget,CaregiverStatus,QuickActions}.tsx`.
- **Details:** §11.4 order/priority; one procedure; `demoNow()` respected. **`InsightWidget` + `CaregiverStatus` are stubs** (filled by hp 21/23) — ship the stub with a clean props/DTO seam. Caregiver variant = read-only when accessed by a caregiver (hp adds the guard; keep page tolerant).
- **Testing:** service composition test (all sections in DTO flags); component renders each §11.4 state; e2e seeded demo dashboard.
- **Acceptance:** dashboard answers both product questions instantly; numbers match adherence service.

## Phase 24 — Settings (profile/reminders/caregiver/appearance/data)

**Dependencies:** 07, 08, 09, 21 (caregiver mgmt reuse on hp), 05. **Routes:** `/settings/profile`, `/settings/reminders`, `/settings/caregiver`, `/settings/appearance`, `/settings/data`.

- **Files:** `src/server/trpc/routers/settings.ts` (get/update each area; export; delete), `src/server/domain/settings/service.ts`, `src/features/settings/{ProfileForm,ReminderSettings,CaregiverSettings,AppearancePanel,DataOverview,ExportButtons,DeleteFlow}.tsx`, `src/app/(app)/settings/layout.tsx` (menu).
- **Details:** appearance toggles `dark` class on `<html>` (§5.7 tokens ready); reminders per §11.14; data export streams CSV (meds+events); delete-all transactional (children first, keep account). **Cross-branch:** the caregiver section may need hp's caregiver router — implement against a stable settings get/update contract and wire the hp router on merge.
- **Testing:** forms + toggles; e2e theme persists, export downloads, delete-all empties but account remains.

## Phase 26 — Global states, accessibility & responsive refinement

**Dependencies:** all features exist (post all-merge). **Files:** touch `src/app/**/{error,loading,not-found,empty-state}.tsx`, `src/lib/a11y.ts` helpers, skip-link, focus-visible rings, reduced-motion, contrast fixes (`#64748b` minimum on white).

- **Details:** §16 responsive audit at 1280/1024/768/390; every status indicator = icon + text + aria; dialogs trap + restore focus; dexa etc. Use axe-core scan (Playwright) on representative routes + keyboard-only e2e on nav.
- **Acceptance:** zero critical a11y violations; audit report committed to `docs/`.

---

## Cross-branch contract (owned by bala — consumers rely on it)

| Surface | Phase | Consumer contract |
|---|---|---|
| `adherence.summary` (single DTO) | 16 | Dashboard (18), Reports (20), hp insights (23) consume it; **never duplicate the math** |
| `materialize.recomputeDay/range` | 16 | aadhi Phase 12/13 hooks call it on dose/schedule changes; keep idempotent |
| `adherence_daily` pruning | 16 | Matches §10.5 window; don't prune caller-visible history |
| `reportsSchemaFor(serverToday)` | 20 | Strict server-side ceiling; client uses loose `reportsSchema` |
| Dashboard `InsightWidget`/`CaregiverStatus` stubs | 18 | hp 21/23 fill them — define DTO props now, they conform |
| Settings appearance toggle | 24 | `dark` class only; §5.7 semantic surfaces already flip |

**Merge order:** `aadhi` → `main` first; then `bala`; then `hp`. Consolidation 26–30 in `impl.md` is balanced across branches — this branch owns **26**.
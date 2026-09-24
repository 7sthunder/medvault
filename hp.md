# HP — Ecosystem & Delivery Track (Phases 21–23, 25, 27–30)

> Branch plan for **`hp`** derived from `plan.md` §21. Companion to `impl.md`.
> This track ships the human-facing ecosystem (caregiver, notifications, AI insights),
> the college-demo mode, and the final delivery layers: test completion, the full e2e
> suite, integration verification, and deployment/handoff. It is **one of two tracks
> (with bala) that build on aadhi's spine** — attach your hooks to aadhi's defined seams.

| | |
|---|---|
| Branch | `hp` (base: `main` @ `ee1ee99`) |
| Assigned phases | **21, 22, 23, 25, 27, 28, 29, 30** |
| Merge target | `main` — merge **last** (depends on aadhi + bala) |
| Working order | 21 → 22 → 23 → 25 → then post-merge 27 → 28 → 29 → 30 |

---

## Non-negotiables (from plan §21/§22)

- Every page handles the four §15 states (loading / empty / error / success).
- Every tRPC procedure **authed + owner-checked**; caregiver = strongest authz boundary.
- **AI boundary:** insights only surface adherence patterns; never diagnose/prescribe. AI is called **server-side only**; output is zod-validated; no mutation of meds/schedules.
- Always import shared contracts via `@shared/*`; never duplicate business logic.
- Never hardcode brand hex/rgba in `src/features/**` (eslint gate).
- Phase DoD = `pnpm typecheck` + `pnpm lint` + `pnpm test` + `pnpm build` all green.
- On completion of each phase append the impl-log section to `impl.md` and flip the matrix row.

---

## Phase 21 — Caregiver system (domain + flows + UI)

**Dependencies:** 13 (missed→alert source on aadhi), 05, 08, 09. **Routes:** `/caregiver`, `/caregiver/accept`, `/caregiver/alerts/[id]`.

- **Files:** `src/server/domain/caregiver/service.ts` (invite/accept/revoke/permissions/alerts with **once-per-dose-relationship dedupe**), `src/server/trpc/routers/caregiver.ts` (**separate patient-scope vs caregiver-scope routers** — `requireCaregiverAccess(patientId)` guard), `src/features/caregiver/{InviteForm,AcceptInvite,RelationshipList,PermissionsEditor,AlertFeed,AlertDetailPage,CaregiverOverview}.tsx`, wire `src/shared/validations/caregiver.ts` (done in Phase 07).
- **Details:** invite → token → accept via `/caregiver/accept?token=`; revoke stops alerts; **attach to aadhi Phase 13's missed-dose hook** (it will call your alert creation for relationships with the right permission); alerts acknowledge/resolve. **Read-only enforcement is server-side** — a caregiver must not query another patient or mutate.
- **Testing:** unit invitation lifecycle + alert dedupe; unit tests assert cross-patient isolation; e2e: invite → redeem → real missed dose (demo clock) → alert + notification → revoke stops.
- **DoD:** caregiver read-only enforced server-side.

## Phase 22 — Notifications (domain + bell + center + preferences)

**Dependencies:** 13 (producers on aadhi), 10 (insights producer), 08/09 (bell stub — aadhi Phase 09 left a clean seam). **Routes:** `/notifications`.

- **Files:** `src/server/domain/notifications/service.ts` (+ `channels.ts` interface: in-app + console), `src/server/trpc/routers/notifications.ts` (list/unread/markRead/markAllRead), `src/features/notifications/{NotificationsPage,NotificationList}.tsx`, replace aadhi's `NotificationBell` stub, preference gating.
- **Details:** producers: missed (hook aadhi 13), insight ready (23), caregiver alert (21), due reminder, demo; **dedupe once per entity+objective**; preference filter at creation.
- **Testing:** unit dedupe/gating; bell count component; e2e missed → notification appears and opens.
- **DoD:** notification logic centralized — **no scattered `INSERT notifications` in features**.

## Phase 23 — AI insights (domain + service + UI)

**Dependencies:** 16 (snapshot data on bala), 08, 22. **Routes:** `/insights`.

- **Files:** `src/server/domain/insights/service.ts` (buildSnapshot, generate, fallback, validate, persist/prune), `src/shared/validations/insight.ts` (output schema), `src/server/trpc/routers/insights.ts`, `src/features/insights/{InsightsPage,InsightCard,RegenerateButton}.tsx`, fill bala's dashboard `InsightWidget` stub.
- **Details:** provider-agnostic AI SDK, env-selected provider (`AI_GEMINI_API_KEY`); system-prompt constant with explicit prohibitions; zod-validated output (strip unknown keys, constrain categories); **deterministic fallback rule engine** when AI fails; never-mutate boundary (functions receive read-only snapshot); `source` tag visible; snapshot stored; prune to `INSIGHT_MAX_ROWS`.
- **Testing:** snapshot builder from seeded data; fallback deterministic; schema rejects diagnostic/prescriptive text; never-mutate compile+test; e2e regenerate.

## Phase 25 — Demo mode (domain + seed reuse + UX)

**Dependencies:** 05 (demo seed), 13/16 (services on aadhi/bala), 08/09 shell, 21, 23, all main pages. **Routes:** `/demo` (reuses all `(app)` page components inside the demo shell).

- **Files:** `src/server/domain/demo/service.ts` (enter/leave/reset/action/scenario/time/insight/alert), `src/server/trpc/routers/demo.ts`, `src/app/demo/layout.tsx` (banner + dock), `src/features/demo/{DemoDock,DemoClock,ScenarioControl,ResetButton}.tsx`, demo cookie handling in `server/trpc/context.ts` + `@shared/times` (`demoNow()`).
- **Details:** short-lived demo cookie per §10.8; Arun Kumar (§19) demo user refreshed by reset; simulation actions **route through real services** (demo user + `demoNow`) so all surfaces react live; `setTime` shifts `simulationNow`; scenario buttons mutate recent days via seeded blocks (keeps totals semantics). **Isolation test:** after demo, real account data unchanged.
- **Testing:** scenario totals invariant; isolation; e2e full demo tour incl. each simulate button + reset.

## Phase 27 — Unit & component test completion

**Dependencies:** all shipped code (post-merge). **Files:** new `*.test.ts(x)` beside code; `vitest.config.ts` coverage thresholds (shared/calc ≥ 95%, domain ≥ 80%, key components ≥ 70%); transactional rollback DB helper.
- **Details:** exhaustive calc matrices; interaction tests (optimistic updates, disabling in flight, idempotent double-click); authz denial tests included.

## Phase 28 — End-to-end test suite

**Dependencies:** everything (post-merge). **Files:** `e2e/{register,onboarding,medication-lifecycle,dose-actions,missed-dose,adherence-consistency,caregiver,reports,demo,auth-guard,shell}.spec.ts` + `e2e/helpers/{demo-login,seed}.ts`.
- **Details:** deterministic time via demo clock; seeded DB snapshot per suite; **`adherence-consistency.spec` validates the §20 propagation matrix** (dashboard × adherence × history × reports numbers match); runs in CI chromium.

## Phase 29 — Integration verification & final consistency pass

**Dependencies:** all phases. **Files:** `docs/consistency-verification.md` log; scripted checks (a)–(g) from plan §21 Phase 29 (single-source adherence numbers, full med propagation, caregiver alert traceable to a real dose event, no feature imports raw db client, no hardcoded brand hex, every nav link real, brand via `brand.ts`). Full `pnpm build/typecheck/lint/test` run.

## Phase 30 — Deployment & handoff polish

**Dependencies:** 29. **Files:** `README.md` runbook (`pnpm install → db:migrate → db:seed → dev`), AI env keys optional note, demo flow docs, optional CI workflow. Acceptance: reproducible on a clean machine; clean repo (no secrets).

---

## Cross-branch hook points (aadhi/bala seams you attach to)

| Hook / seam | Set by | You use it |
|---|---|---|
| Missed-dose hook (`onMissedDose(dose, now)`) | aadhi Phase 13 | Notifications (22) + Caregiver alerts (21) attach here — enforce dedupe |
| `NotificationBell` count seam | aadhi Phase 09 stub | Replace with real `unreadCount` (22); poll on focus + dropdown of recent 5 |
| `adherence.summary` DTO | bala Phase 16 | Insight snapshot source (23) — never recompute |
| Dashboard `InsightWidget` / `CaregiverStatus` stubs | bala Phase 18 | Fill with real data (21/23) — conform to the DTO props bala defined |
| `reconcile` for demo day-shifting | aadhi Phase 13 | Demo can call reconcile as `simulationNow` changes to drive missed detection live |
| Demo seed (`seedDemoWorkspace`, §19 totals) | Phase 05 | Reset/re-seed for `/demo`; keep 84/76/5/3/8 + 90.5% invariants |

**Merge order:** `aadhi` → `main` first; then `bala`; then `hp` (you merge last — your Phases 27–30 run against the fully merged tree).
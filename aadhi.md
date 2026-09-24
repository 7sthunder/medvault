# AADHI — Core Medication Track (Phases 09–15)

> Branch plan for **`aadhi`** derived from `plan.md` §21. Companion to `impl.md`.
> This is the **spine** of the app: shell, onboarding, medication domain, schedule/dose
> generation, the dose state machine, and the two primary daily-use surfaces (Today's
> Schedule, Medication CRUD). Other branches (bala, hp) build analytics/ecosystem features
> **on top of** the merge of this branch, so correctness here is non-negotiable.

| | |
|---|---|
| Branch | `aadhi` (base: `main` @ `ee1ee99`) |
| Assigned phases | **09, 10, 11, 12, 13, 14, 15** |
| Merge target | `main` — merge **first** (bala/hp depend on this spine) |
| Working order | strictly 09 → 10 → 11 → 12 → 13 → 14 → 15 |

---

## Non-negotiables (from plan §21/§22)

- Every page handles the four §15 states (loading / empty / error / success).
- Every tRPC procedure is **authed + owner-checked** (`protectedProcedure`).
- Always import shared contracts via `@shared/*`; never duplicate business logic.
- Never hardcode brand hex/rgba in `src/features/**` (eslint gate, active since Phase 03).
- Phase DoD = `pnpm typecheck` + `pnpm lint` + `pnpm test` + `pnpm build` all green.
- On completion of each phase append the impl-log section to `impl.md` (same format as Phases 01–08) and flip the matrix row.

---

## Phase 09 — Global shell & navigation `(app)`

**Dependencies:** Phase 06 (auth), Phase 08 (primitives). **DB:** none.

- **Files:**
  - `src/app/(app)/layout.tsx` — `requireUser()` gate, mounts `<AppShell>`, group-level `loading.tsx` (skeleton), `error.tsx`, `not-found.tsx`.
  - `src/components/layout/{AppShell,Sidebar,TopNav,Breadcrumbs,NotificationBell,ProfileMenu,BottomNav,MoreSheet}.tsx`.
  - `src/shared/nav.ts` — finalize (Phase 07 started it; this phase locks nav model + `NavIconName` map).
- **Details:** shell covers `/dashboard`, `/medications…`, `/schedule…`, `/adherence…`, `/insights`, `/history`, `/reports`, `/caregiver…`, `/notifications`, `/settings…`. Active state from `usePathname`. `NotificationBell` = stub (count 0 + link) — **hp hooks it in Phase 22**; leave a clean `unreadCount` seam. Profile menu shows real user (session user, `src/lib/auth-client.ts`).
- **Testing:** nav model unit test (every href resolves to a route file); shell render test with `matchMedia` mock (desktop + mobile); e2e logged-in nav across 4 routes + bottom-nav on mobile viewport.
- **DoD:** nav test green; no dead links; all group pages render inside the shell.

## Phase 10 — Onboarding

**Dependencies:** 06, 07, 05, 11 (sample med). **DB:** `user_preferences` writes. **Routes:** `/onboarding`.

- **Files:** `src/app/(auth)/onboarding/page.tsx` (replaces placeholder from Phase 06), `src/features/onboarding/OnboardingWizard.tsx` + `steps/{ProfileStep,RemindersStep,FinishStep}.tsx`, tRPC `src/server/trpc/routers/onboarding.ts`, `src/server/domain/settings/get-or-createPreferences.ts`, `src/shared/validations/onboarding.ts` (exists — wire to RHF here).
- **Details:** upsert `user_preferences` (timezone, reminder defaults), set `onboardingCompleted = true` (keep the Phase 06 `setOnboardingComplete` mutation as completion path). Optional "Add Metformin 500mg 2×/day" → **implement Phase 11 service layer first** and call `medicationService.create` (plan §21 ordering prefers this over an inline minimal create).
- **Testing:** schema units; wizard step components; e2e full onboarding → dashboard.
- **DoD:** wizard completes; preferences persist.

## Phase 11 — Medication domain service (server)

**Dependencies:** 05, 07. **DB:** medications + slots reads/writes. **Routes:** tRPC only.

- **Files:** `src/server/domain/medications/{service,repo,mapper}.ts`, `src/server/trpc/routers/medication.ts` (`list`, `get`, `create`, `update`, `setStatus`, `archive`; each authed + owner-checked + archived excluded from default lists).
- **Details:** create → upsert schedule slots rows; **duplicate-name guard** (partial unique from Phase 05); dosage numeric validation; `frequencyLabel` derivation; archived bucket query. Leave a minimal `ensureDoseEvents` stub hook for Phase 12 (don't fake the generator).
- **Testing:** unit service (in-memory or DB): CRUD, archive keeps history, duplicate names rejected, ownership mismatch denied, numeric bounds.
- **DoD:** mapper complete; service unit-testable without the whole app.

## Phase 12 — Medication schedule & dose-event generation (domain)

**Dependencies:** 05, 07, 11. **DB:** dose_events writes. **Routes:** none (internal).

- **Files:** `src/shared/calc/schedule.ts` (pure), `src/server/domain/medicationSchedules/service.ts`, `src/server/domain/doseEvents/service.ts` (`ensureDoseEvents`, `voidFuture`, `extendHorizon`), `jobs/scheduler.ts` skeleton.
- **Details:** idempotent upsert on `(medicationId, scheduledFor)`; timezone-converted times (`@shared/times`); horizon §10.2 (14 days per `HORIZON_DAYS`); void on pause/change; `catchUp` entry point callable from read paths + job. Generation must be **deterministic**: same inputs → same events.
- **Testing:** pure expansion (once/twice/custom/start-end/leap + tz edges); ensure idempotency (run twice → no dup); void removes only unresolved.
- **Acceptance:** after seeding Metformin, exactly 2/day events across the horizon.

## Phase 13 — Dose state machine + reconcile (missed detection) (domain)

**Dependencies:** 05, 07, 12. **DB:** dose_events updates, dose_actions inserts. **Routes:** none.

- **Files:** `src/shared/calc/doseState.ts` (pure), `src/server/domain/doseEvents/reconcile.ts` (atomic apply), `src/server/domain/doseActions/service.ts` (take/snooze/skip/restore + audit), `jobs/scheduler.ts` (interval + on-read catchUp).
- **Details:** §10.3 status quoting + conditional updates prevent double-transitions; auto-miss writes an audit row and (for now) a `log guarded` notification hook — **hp wires the real notification in Phase 22**; take-late from missed event. §10.4 snooze deadline extension + max snooze (`MAX_SNOOZES_DEFAULT`).
- **Integration seam (hp):** keep the missed-event hook isolated (single function, e.g. `onMissedDose(dose, now)`) so Phase 22 (notifications) and Phase 21 (caregiver alerts, `requireCaregiverAccess`) can attach on merge without touching your transition logic.
- **Testing:** legal/illegal transition table; snooze math; deadline edges; take-late; repeated-take idempotency; audit rows recorded.
- **DoD:** deterministic, fully tested.

## Phase 14 — Today's Schedule page + dose UI

**Dependencies:** 08, 09, 13, 11/12. **Routes:** `/schedule`, `/schedule/[doseId]`.

- **Files:** `src/server/trpc/routers/schedule.ts` (day query, returns **reconciled** day DTO), `dose.ts` (take/snooze/skip), `src/features/schedule/{ScheduleDayView,DoseCard,ScheduleTimeGroup,DoseDetailPage}.tsx`, `src/features/dose/{DoseActions,SkipDialog,SnoozeFeedback}.tsx`.
- **Details:** sections per §11.7; DoseCard actions optimistic (react-query) with reconcile fallback on error; skip requires dialog + reason; snooze countdown from `statusUpdatedAt + snoozeMinutes` (server authoritative); respect `demoNow()` clock seam (`@shared/times`). React-query invalidation across all dose-related queries after any action.
- **Testing:** component (DoseCard buttons, skip dialog, disabled-while-in-flight); e2e take → state changes, snooze → moves group, skip → reason required.

## Phase 15 — Medication CRUD UI (list / detail / new / edit)

**Dependencies:** 08, 09, 11, 12 (+14 for invalidation patterns). **Routes:** `/medications`, `/medications/new`, `/medications/[id]`, `/medications/[id]/edit`.

- **Files:** `src/features/medications/{MedicationCard,MedicationListPage,MedicationForm,ScheduleBuilder,MedicationDetailPage,EvidenceRow,ArchiveDialog}.tsx`; extend tRPC `medication.ts`.
- **Details:** form wizard §11.6 (fields → schedule builder per-day time rows + weekday chips + presets); schedule diff triggers `ensureDoseEvents`/void + adherence recompute (leave an idempotent hook for bala's `materialize` on merge); optimistic list updates; archive confirmation; paused banner on detail; 409 duplicate surfaced.
- **Testing:** component form (add/remove slot, preset switch, validation msgs); e2e create Metformin → appears on list & schedule.
- **DoD:** propagation matrix rows 1–3 verified (see `plan.md` §20).

---

## Cross-branch contract (what the other tracks rely on — do NOT break)

| Surface | Owner | Consumer contract |
|---|---|---|
| `(app)/layout.tsx` shell + `AppShell` | aadhi (09) | bala/hp pages render inside it; export a stable `AppShell` that wraps children only |
| `src/shared/nav.ts` | aadhi (09) | Must list every route incl. bala/hp ones; icon names only, no React |
| `ensureDoseEvents` / `voidFuture` | aadhi (12) | bala materialize + aadhi UI call these; keep signatures stable |
| `reconcile.run(userId, now)` | aadhi (13) | Cheap + idempotent; all read paths may call it |
| `doseActions.service` (take/snooze/skip → audit) | aadhi (13) | History (bala 19) and demo (hp 25) consume audit rows |
| Missed-dose hook (on-direction) | aadhi (13) | hp 21/22 attach notifications + caregiver alerts here |
| `medicationService.create` | aadhi (11) | Used by onboarding (10) and hp demo seed |
| HTTP `Date` DTOs over tRPC | all | Server DTOs stay plain `Date`; client transformer lands in the phase that introduces the tRPC client (see impl.md Phase 08 hand-off note) |

**Merge order:** `aadhi` → `main` (first). Then bala, then hp. Consolidation phases 26–30 in `impl.md` matrix are balanced across all three branches — after the three merges, `main` owns the full §21 spec.
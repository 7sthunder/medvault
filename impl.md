# MedVault (MediTrack AI) — Implemented Work Log

> Companion to `plan.md`. This file records, phase by phase, **what was actually implemented**
> with respect to the plan: deviations, precise decisions, verification results, and the commit
> that delivered the phase.
>
> - `plan.md` is the **spec** (what to build). `docs/stitch-analysis.md` is the **Phase 01
>   evidence** (where the design facts came from).
> - `impl.md` is the **log** (what was built and why it matches — or deliberately sharpens — the plan).
> - Update this file at the end of **every** phase (before pushing). Keep statuses in the matrix
>   below consistent with the detailed sections.

## Status conventions

- `pending` — not started
- `in_progress` — actively being worked right now (only one at a time)
- `done` — implemented, verified, committed, and pushed
- `blocked` — waiting on a prerequisite / open decision (blocker logged in the detail section)

### New-phase logging checklist (append a section for the phase, then flip the matrix row)

1. Reference the exact plan sections (§) and phase objective.
2. List files created/modified with paths.
3. Record deviations vs. plan and the reason (precise > faithful).
4. Record verification: the exact commands that passed (typecheck/lint/test) and any manual checks.
5. Record the commit hash and push state.
6. Flag anything the next phase depends on that was discovered late.

---

## Phase status matrix

| Phase | Title | Status | Commit | Notes |
|---|---|---|---|---|
| 01 | Repository & Stitch analysis | `done` | `5dfeb44` | pushed to `origin/main` |
| 02 | Project foundation (Next.js + TS + Tailwind + tooling) | `done` | `6eabea5` | verified: typecheck/lint/test/build/e2e |
| 03 | Design system implementation (Stitch tokens → Tailwind theme + primitives) | `done` | `1721431` | verified: typecheck/lint/test/build/e2e |
| 04 | Landing page migration (`/` from Stitch) | `done` | `1340f05` | verified: typecheck/lint/test/build/e2e |
| 05 | Database foundation (Drizzle schema + client + migrate + seed) | `done` | `016f1be` | verified: typecheck/lint/test/build |
| 06 | Authentication & session plumbing (Better Auth) | `done` | `3006415` | verified: typecheck/lint/test/build/e2e |
| 07 | Shared contracts & validation layer | `pending` | — | |
| 08 | Reusable component system completion | `pending` | — | |
| 09 | Global shell & navigation `(app)` | `pending` | — | |
| 10 | Onboarding | `pending` | — | |
| 11 | Medication domain service (server) | `pending` | — | |
| 12 | Medication schedule & dose-event generation (domain) | `pending` | — | |
| 13 | Dose state machine + reconcile (missed detection) (domain) | `pending` | — | |
| 14 | Today's Schedule page + dose UI | `pending` | — | |
| 15 | Medication CRUD UI (list / detail / new / edit) | `pending` | — | |
| 16 | Adherence engine (domain + aggregation service) | `pending` | — | |
| 17 | Adherence UI + medication performance | `pending` | — | |
| 18 | Dashboard | `pending` | — | |
| 19 | History | `pending` | — | |
| 20 | Reports | `pending` | — | |
| 21 | Caregiver system (domain + flows + UI) | `pending` | — | |
| 22 | Notifications (domain + bell + center + preferences) | `pending` | — | |
| 23 | AI insights (domain + service + UI) | `pending` | — | |
| 24 | Settings (profile/reminders/caregiver/appearance/data) | `pending` | — | |
| 25 | Demo mode (domain + seed reuse + UX) | `pending` | — | |
| 26 | Global states, accessibility & responsive refinement | `pending` | — | |
| 27 | Unit & component test completion | `pending` | — | |
| 28 | End-to-end test suite | `pending` | — | |
| 29 | Integration verification & final consistency pass | `pending` | — | |
| 30 | Deployment & handoff polish (optional but recommended) | `pending` | — | |

---

## Phase 01 — Repository & Stitch analysis (DONE)

**Plan reference:** `plan.md` §2, §5, §6, §16; Phase 01 spec (`plan.md:819`).
**Objective met:** verified inventory of the Stitch export, design tokens extracted into §5,
screen→route map confirmed (§6). No `Landingpage/` changes (per Phase 01 constraint).

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `docs/stitch-analysis.md` | created | Phase 01 deliverable — 12 sections (method → open decisions) |
| `docs/` | created | new analysis directory |
| `plan.md` §2 | rewritten | two commits, corrected root paths, verified file roles, duplicate/unreferenced assets, ignored dirs, `App.jsx` section line-map |
| `plan.md` §5.2 | edited | H2 now documents the two verified size tiers instead of one clamp value |
| `plan.md` §5.8 | added | "Source verification" — findings that don't fit the token tables |
| `plan.md` §6 | rewritten | route table now carries source-anchor column; non-goal motifs mapped to no route |

### Key verified facts that shaped the plan text

- `MedVaultAuthIllustration.jsx` and `MedVaultPhoneSection.jsx` live at `Landingpage/` **root**,
  not `src/` — §2 previously implied `src/`. Fixed.
- `MedVaultPhoneSection.jsx` and `src/components/FloatingCard.jsx` are imported by **nothing**
  (recipe/reference-only) — recorded so Phase 04 knows they are ported-by-knolwedge, not by import.
- MD5-confirmed duplicates: `Gemini_Generated_Image_jr77vyjr77vyjr77.png` ==
  `public/images/hero-final.png`; root `imagessss/` mirrors `public/imagessss/`.
- §5 tokens `--color-red-tint #fee2e2` and `--color-amber-tint #fef3c7` (needed for §12 status
  chips) are **NOT in the Stitch source** — flagged explicitly in §5.8 so no future phase asserts
  false provenance; the §3/§5 token test must special-case them.
- Glass radius has no single source value (16 / 18 / 22 px). Decision recorded: adopt **18 px**
  (`--radius-glass`), matching the phone motifs. This is a deliberate precision-vs-Stitch choice.
- Hero gradient exact string `linear-gradient(150deg,#f0fdf4 0%,#f8fafc 50%,#f0f9ff 100%)`
  pinned at `App.jsx:755`.
- Deviation (minor): plan target of "one H2 clamp" sharpened to two scale tiers +
  white CTA variant — matches source exactly instead of the plan's approximation.

### Verification

- Token extraction cross-checked against source bytes (hex/rgba/gradients/font families) —
  full tables with `file:line` anchors in `docs/stitch-analysis.md` §7.
- Asset reference vs existence verified via runtime usage grep + MD5 of duplicates.
- No build/test to run (Phase 01 is analysis only — no code produced).

### Commit / push

- `5dfeb44` `Finalize Phase 01: Stitch analysis and verified plan §2/§5/§6`
- pushed: `7d8e76e..5dfeb44 main -> main`; `git status` clean.

### Hand-off notes for later phases

- Phase 04 must consume port list `docs/stitch-analysis.md` §10 (exact `→ target` paths).
- Phase 03 token test should pull expectations from `docs/stitch-analysis.md` §7 tables and
  special-case the two extended tokens noted above.
- Open decisions for Phase 03/04 are tracked in `docs/stitch-analysis.md` §12.
- `Landingpage/` must stay untouched and un-referenced at runtime (plan §1).

---

## Phase 02 — Project foundation (DONE)

**Plan reference:** `plan.md` §4.1, §16 (breakpoints), §18 (testing); Phase 02 spec (`plan.md:839`).
**Objective met:** working Next.js App Router app at repo root with pnpm, strict TS, Tailwind v4,
shadcn/ui scaffold, ESLint/Prettier, Vitest, Playwright, drizzle config, env scaffolding.

### Files created

| Path | Purpose |
|---|---|
| `package.json` (`meditrack-ai`) | scripts: `dev/build/start/typecheck/lint/lint:fix/format/format:check/test/test:watch/test:coverage/test:e2e/db:generate/db:migrate/db:push/db:seed` |
| `pnpm-lock.yaml` | lockfile |
| `pnpm-workspace.yaml` | `allowBuilds` (esbuild, unrs-resolver) |
| `next.config.ts` | `reactStrictMode: true` |
| `tsconfig.json` | strict + `noUncheckedIndexedAccess`, bundler resolution, path maps `@/* @shared/* @server/* @features/* @components/* @lib/* @db/*` |
| `next-env.d.ts` | Next generated-types reference |
| `eslint.config.mjs` | FlatCompat → `next/core-web-vitals` + `next/typescript`, ignores `Landingpage/**` |
| `postcss.config.mjs` | `@tailwindcss/postcss` |
| `drizzle.config.ts` | postgresql dialect, schema `src/server/db/schema.ts`, out `./drizzle` |
| `vitest.config.ts` | jsdom per-file via pragma, aliases, oxc JSX runtime, coverage on `src/shared/calc` |
| `vitest.setup.ts` | `@testing-library/jest-dom/vitest` |
| `playwright.config.ts` | chromium project, `testDir ./e2e`, `webServer pnpm dev :3000` |
| `.env.example` | `DATABASE_URL`, `BETTER_AUTH_SECRET`, `AI_GEMINI_API_KEY`, `DEMO_CLOCK_OFFSET_MINUTES` |
| `.gitignore` | `node_modules .next out build .env* e2e-report playwright-report test-results coverage` |
| `.prettierrc.json` | 100-print-width, semicolons, double quotes |
| `components.json` | shadcn v4 "base-nova" style, RSC, `css: src/app/globals.css`, lucide icons |
| `src/app/layout.tsx` | **Plus Jakarta Sans** via `next/font/google` (`--font-jakarta`), metadata (MedVault · MediTrack AI) |
| `src/app/globals.css` | Tailwind v4 + shadcn neutral theme tokens + `@import "shadcn/tailwind.css"` + `tw-animate-css` + font mapping + `.dark` block |
| `src/app/page.tsx` | placeholder `/` (brand tile §5.1 + Button); replaced by landing in Phase 04 |
| `src/lib/utils.ts` | `export { cn } from "cn"` (shadcn v4) |
| `src/shared/breakpoints.ts` | breakpoint constants doc (plan §16) incl. Stitch-specific 900/820/580 |
| `src/components/ui/button.tsx` | shadcn scaffold (Base UI Button, cva variants default/outline/secondary/ghost/destructive/link, sizes) |
| `src/components/ui/input.tsx` | shadcn scaffold |
| `src/components/ui/button.test.tsx` | example component test (jsdom) |
| `e2e/home.spec.ts` | example e2e hitting `/` (heading MedVault + "Get started" button) |

### Pinned versions (deliberate, deviations from plan wording)

| Package | Version | Why |
|---|---|---|
| `next` | 15.5.26 | plan: Next 15; latest 15.x |
| `react` / `react-dom` | 19.2.0 | plan: React 19; 19.3.0 not supported by Next 15 peer range |
| `lucide-react` | 0.453.0 | plan + Stitch export parity (latest is 1.x — incompatible icon API) |
| `typescript` | 5.9.3 | 7.x (native tsgo) not supported by eslint-config-next Next 15 |
| `eslint` | 9.39.5 | 10.x outside eslint-config-next 15 peer range |
| `tailwindcss` / `@tailwindcss/postcss` | 4.3.3 | Tailwind v4 (Stack §4) |
| `vitest` | 5.0.1 | — |
| `@playwright/test` | 1.63.0 | — |
| `drizzle-kit` | 0.31.11 | — |
| shadcn stack (via CLI) | `shadcn@4.21.0`, `@base-ui/react`, `cva`, `cn`, `tw-animate-css` | new shadcn v4 |

### Deviations & decisions (precise > faithful)

- **shadcn v4 uses Base UI (`@base-ui/react`) instead of Radix** for primitives. Plan §4/§18
  pre-supposed "Radix primitives"; the 2026 shadcn registry ("base-nova" style) generates Base UI
  components. Behavior/a11y intent is unchanged — Phase 03 restyles visuals to Stitch tokens.
  Recorded so Phase 03/08 lists are checked against what the registry actually emits.
- `cn` util: plan asked for clsx+tailwind-merge in `src/lib/utils.ts`. shadcn v4 instead ships a
  `cn` package; `src/lib/utils.ts` re-exports it so `@/lib/utils` stays the import surface.
- **shadcn CLI misfires caught and reverted:**
  1. `init` globbed the Vite template CSS and wrote the theme into `Landingpage/src/index.css`
     (violating Phase 01's untouched rule) — reverted via `git checkout`, theme relocated to
     `src/app/globals.css`, `components.json` css path fixed to `src/app/globals.css`.
  2. `init` injected a `Geist` font + rewrote the root layout — reverted; layout keeps
     **Plus Jakarta Sans** only (plan requirement). `--font-sans` maps to `--font-jakarta`.
- Status bar: `pnpm dev`/builds on Windows show a benign vitest "configLoader native" ESM-in-CJS
  warning — cosmetic, suppressed by nothing; leave as-is (or rename to `.mjs` later).
- pnpm 11.8: build-script approval now lives in `pnpm-workspace.yaml` under **`allowBuilds`**
  (legacy `onlyBuiltDependencies` in package.json is ignored) — required to run esbuild postinstall.
- Vitest 5 uses the **oxc** transform (Vite 8): `vitest.config.ts` sets
  `oxc.jsx = { runtime: "automatic" }` (tsconfig `jsx: preserve` otherwise breaks test parsing).

### Verification (all green)

- `pnpm typecheck` — clean
- `pnpm lint` — clean (0 errors/0 warnings after naming the postcss config export)
- `pnpm test` — 1 file, 2 tests passed (jsdom RTL on Button scaffold)
- `pnpm build` — `next build` compiled, types/lint pass, 4 static pages generated
- `pnpm test:e2e` — 1 chromium test passed (dev-server smoke via Playwright webServer)

### Commit / push

- `6eabea5` `Phase 02: Next.js + TS + Tailwind + tooling foundation`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for Phase 03

- Phase 03 replaces the neutral shadcn tokens in `src/app/globals.css` with the **Stitch
  `@theme`** tokens — source tables in `docs/stitch-analysis.md` §7; two extended tokens caveat
  (`#fee2e2`/`#fef3c7`) from Phase 01 stands.
- The `/design-system` dev page (plan Phase 03) will mount under `src/app/(marketing)/` — that
  route group does not exist yet.
- Base UI components differ from the Radix-era shadcn docs; check `@base-ui/react` API when
  restyling `button.tsx`/`input.tsx` and when adding primitives in Phase 08.
- `components.json` `css` and `aliases` point at the real locations now; keep them in sync when repo structure changes.

---

## Phase 03 — Design system implementation (Stitch tokens → Tailwind theme + primitives)

**Plan reference:** `plan.md` §5, §12, §5.5 (input/button recipes), §1/§2 (medication card +
list-row stories); Phase 03 spec (`plan.md:859`). Token facts: `docs/stitch-analysis.md` §7.
**Objective met:** every §5.3/§5.4 colour/shadow is a declared Tailwind v4 token in
`src/app/globals.css` (machine-checked by `src/lib/token-doc.test.ts`); brand assets, the full
`ui/` catalog, custom primitives, and a dev-only `/design-system` catalogue with the two Stitch
stories (medication card stack + list rows) are in place. Features are lint-forbidden from
hardcoding brand hex.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/app/globals.css` | rewritten | static `@theme` (Stitch palette §5.3 + shadows §5.4 + radius 0.875rem), `@theme inline` semantic surfaces flipping in `.dark` (§5.7), glass utilities, hero-gradient var, scrollbar/selection/focus-visible base |
| `src/lib/token-doc.ts` | created | machine-readable §5 map (colour + shadow tokens, `provenance: stitch/extended`, radius/gradient constants) |
| `src/lib/token-doc.test.ts` | created | asserts globals.css carries exactly the token `cssVar:value` pairs (§3/§5 drift check), extended-token caveat, light+dark surface overrides, label uniqueness |
| `src/shared/status.ts` | created | §12 DoseStatus union + `DOSE_STATUS_META` (label/tone/aria/icon/tint-classes/raw hex) |
| `src/shared/brand.ts` | created | §5.1 brand constants (`BRAND`, `LOGO`, AI brand) |
| `src/components/brand/{Logo,Wordmark,Brand}.tsx` | created | §5.1 tile (36–44px radius 10–12 gradient + leaf shadow), wordmark (Med+Vault), lockup + `AiBrandLockup` |
| `src/components/ui/status-{indicator,badge}.tsx` | created | §12 compact + pill chips, never colour-only (icon + text + aria-label, ping ring for due-now) |
| `src/components/ui/{chip,section-label,stat-card,list-row,empty-state,error-state,form-field,time-picker,date-picker}.tsx` | created | §5.5/§2 custom primitives |
| `src/components/ui/{drawer,confirmation-dialog}.tsx` | created | bottom-sheet (Base UI Drawer) + confirm dialog wrappers |
| `src/components/ui/button.tsx` | modified | §5.5 restyle: default adds `shadow-primary-btn` + `hover:bg-primary-dark`; **secondary variant now neutral white+border** (see deviation) |
| `src/components/ui/input.tsx` | modified | §5.5 restyle: h-9, stronger border `border-strong`, 4px `primary-ring` focus, white bg |
| `src/app/page.tsx` | modified | placeholder now uses `Brand` lockup + tokens (per Phase 03 spec) |
| `src/app/(marketing)/design-system/page.tsx` | created | dev-only catalogue: tokens, type §5.2, buttons, forms, §12 status grid, med-card/list-row stories, overlays, feedback |
| `eslint.config.mjs` | modified | `src/features/**` hex/rgba literal ban + `next-env.d.ts` triple-slash exemption |
| `vitest.setup.ts` | modified | added RTL `cleanup()` `afterEach` (tests share a jsdom document otherwise) |
| `src/components/ui/primitives.test.tsx`, `status-indicator.test.tsx` | created | primitive smoke + §12 a11y tests (36 total) |
| `e2e/design-system.spec.ts` | created | dev-server checks: Stitch stories + 8 status chips + token swatch presence |

20-registry-primitive batch (textarea/select/checkbox/radio-group/switch/label/badge/card/separator/
avatar/tooltip/dialog/dropdown-menu/popover/tabs/sonner/alert/skeleton/pagination) came from
`pnpm dlx shadcn@latest add ...` and adds `@base-ui/react@^1.8` + `sonner@^2.0.8`.

### Deviations & decisions (precise > faithful)

- **`--color-secondary` name collision (plan decides):** the Stitch token is `#06b6d4` and keeps the
  `secondary` name (Stitch's "secondary" *is* cyan). shadcn's *semantic* secondary (grey) is
  repurposed: Button's `secondary` variant now renders white bg + border + ink text (§5.5
  "secondary/neutral" button). Cyan surfaces stay reachable via `bg-secondary`.
- **Status chips:** `paused` uses `bg-border` (#e2e8f0) and `canceled` an outline chip
  (`bg-background` + border + ink-400) instead of solid `#f8fafc` — solid near-white on a white card
  reads as "no chip". `due-now` keeps Stitch's pulsing primary ring.
- **Violet has no tint in Stitch** (§7.1 verified). Violet chips use default-palette
  `violet-100`/`violet-600`; chip *text* uses contrast-adjusted default shades
  (cyan-800/pink-600/blue-600/amber-600) because the §12 tint+full-colour pairing fails AA on small
  text — Stitch's own chips used the darker shades.
- **Semantic surfaces:** dark-aware tokens (background/foreground/card/popover/muted/accent/border/
  input/sidebar) are `@theme inline` + `:root`/`.dark`; brand palette stays a static `@theme` so
  `bg-primary`/`text-ink-600`/`shadow-card` emit as utilities AND CSS vars (the token test reads the
  emitted vars).
- **Focus tokens:** §5.3 focus mask kept as `primary-ring` (`rgba(16,185,129,0.12)`), distinct from
  the `ring` focus-visible outline colour `#10b981`.
- **Drawer:** `@base-ui/react@1.8` ships a native `drawer` (bottom-sheet, swipe, snap, trap-focus);
  wrapped instead of hand-rolling a sheet.
- **`/design-system` gating:** rendered only when `NODE_ENV === "development"`, else
  `redirect("/")` at module top — satisfies "dev-only"; production build verified static.
- **ESLint hex ban** targets `src/features/**` (not created yet) — documented now so Phase 07+
  features are token-clean from day one (DoD Phase 03 #4).
- `next-env.d.ts` triple-slash path reference (typed routes) trips `@typescript-eslint/
  triple-slash-reference`; Next regenerates the file — exempted via override.

### Verification (all green)

- `pnpm typecheck` — clean
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — 4 files, **36 tests passed** (token-doc 8, status/§12 18, primitives 8, button 2)
- `pnpm build` — compiled; `/`, `/_not-found`, `/design-system` all static (3 routes)
- `pnpm test:e2e` — 3 chromium tests passed (home smoke + design-system stories + token swatches)

### Commit / push

- `1721431` `Phase 03: Stitch token system + design-system catalogue + primitives`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for later phases

- Phase 04 consumes `docs/stitch-analysis.md` §10 port list; `(marketing)` currently only carries
  `/design-system`, Phase 04 adds `(marketing)/layout.tsx` + the landing `/`.
- Phase 05+ must render through the token set — the `src/features/**` hex lint gate is active.
- Dark theme flips surfaces only (§5.7); status chips/glass stay light-first — per plan dark polish
  lands with Phase 26 (`appearance` toggling); `@custom-variant dark` is already wired.
- Component tests depend on RTL `cleanup()` now in `vitest.setup.ts` — keep it for Phase 27 suites.

---

## Phase 04 — Landing page migration (`/` from Stitch)

**Plan reference:** `plan.md` §21; port list `docs/stitch-analysis.md` §10 (exact `→ target` paths);
Stitch sources `Landingpage/src/App.jsx`, `Landingpage/src/components/{HeroVisual,FloatingCard}.jsx`,
`Landingpage/src/mobile.jsx`, `Landingpage/index.html`.
**Objective met:** Stitch landing now renders at Next `/` under a `(marketing)` route group,
consuming Phase 03 tokens only — runtime DOM is byte-visibly the same Stitch hero→footer composition;
`src/features/**` hex/rgba lint gate stays green.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/features/landing/use-in-view.ts` | created | Stitch `useInView` port (threshold 0.12, once) |
| `src/features/landing/mascots.tsx` | created | Doctor/Robot/Nurse mascot SVGs + 3 `<img>` how-it-works mascots (eslint-disable no-img-element) |
| `src/features/landing/PhoneMockup.tsx` | created | mobile.jsx phone screen + CSS port (756×729, sparks/dots, `.mvp-*`) |
| `src/features/landing/HeroVisual.tsx` | created | floating-notification stack over phone (tone→`var(--color-*)`) |
| `src/features/landing/FloatingCard.tsx` | created | glass recipe (Stitch markup never mounts it; kept for auth/hero compositions) |
| `src/features/landing/{Nav,Hero,HowItWorks,Features,Testimonials,FinalCta,Footer,AiChatFab,ScrollingServices}.tsx` | created | §10 ported sections |
| `src/app/(marketing)/layout.tsx` | created | children-only wrapper (design-system unaffected) |
| `src/app/(marketing)/page.tsx` | created | landing composition + metadata; replaces `/` |
| `src/app/page.tsx` | deleted | Phase 02 placeholder `/` (superseded) |
| `src/app/icon.svg` | created | brand-tile favicon (32×32 rounded gradient + HeartPulse path) |
| `src/app/globals.css` | modified | `--mascot-*` vars; body `overflow-x: hidden`; landing keyframes (`float`/`shadowPulse`/`softPulse`/`gradShift`/`fadeUp`/`spin`/`slideIn`/`mvp-*`); `@layer components` (`.cta-primary/.cta-ghost/.nav-login/.nav-link/.dot-grid/.cta-white/.cta-ghost-light/.hero-visual-container/.mvp-*`); `@layer utilities` (`.bg-blob-*/.bg-dot-grid-light/.map-grid/.footer-link`) |
| `public/landing/how-it-works/*.png`, `public/auth/login-page.jpeg` | created | copied from `Landingpage/public/...` (Phase 04 asset move, verified source sizes) |
| `src/features/landing/landing.test.tsx` | created | jsdom smoke: Nav routes + Hero heading/CTAs (`next/link` + `next/dynamic` mocked, IO stub) |
| `e2e/home.spec.ts` | rewritten | landing headline visible + nav "Create Vault" → `toHaveURL(/\/register\/?$/)` (URL-only: route 404s until Phase 06) |
| `package.json` | modified | `framer-motion@^12.38.0` → resolved **12.43.0** |

### Deviations & decisions (precise > faithful)

- **DM Sans remote `@import` dropped.** Stitch `index.html` loaded DM Sans via Google Fonts; Next only
  bundles Plus Jakarta Sans (`next/font/google`). Slide-up/cards remain idempotent; the small font
  difference is an accepted footprint/runtime decision (no network font at build/SSR).
- **`pulse` keyframe renamed → `softPulse`.** Stitch defined its own `pulse`; Tailwind v4 already ships
  an `animate-pulse` utility — reusing the name would collide. Function identical, name namespaced.
- **`.mvp-nav-dot` synthesized.** Stitch `mobile.jsx:191` references `.mvp-nav-dot` (active-session dot)
  but the source CSS never defines it (Stitch renders the dot invisible). Added as 4px
  `var(--color-primary)` circle — precision fix, documented so later phases don't "fix" it back.
- **Glass cards** keep Stitch's literal composite shadows (`0 24px 48px rgba(...)`) — the lint rule
  only bans literals *starting* with `#`/`rgba(`, composites are exempt; token-var substitution used
  wherever a §5 token maps. `bg-white/90 backdrop-blur-*` carry the glass body.
- **FloatingNotification chip tint** `${color}18` (≈9.4%) renders as `color-mix(in srgb, var(--color-*)
  9.4%, transparent)`; icon colour via the tone var.
- **FinalCta "Get Started"** ports Stitch's inline submit-form as **`<a href="/register">`** (Styled form
  submit would navigate/q reload; `<a>` is the correct semantic for a link to registration and stays
  lint-clean). Input kept as decorative email field.
- **Testimonials pfizer‑gap**: source holds generic `Person A–G` entries (App.jsx:1072–1083) — ported
  verbatim (names/roles), not invented personas.
- **HeroVisual** stays `next/dynamic ssr:false` with a `loading` placeholder (hero container keeps height);
  framer-motion floats render client-side only (Stitch parity).
- **Favicon:** `src/app/icon.svg` (file-based, App Router convention) instead of a `public/` static —
  same brand tile, no extra fetch of both.
- **Deleting `src/app/page.tsx`** leaves stale `.next/types/app/page.ts`; regenerated via
  `npx next typegen` (not a code change) — recorded so future route moves run typegen after deletion.
- Matching `textContent` across `<br/>` in the H1 joins with no space (jsdom & Chromium both) — unit +
  e2e assertions use `/Your entire\s*medical life/i`.

### Verification (all green)

- `pnpm typecheck` — clean (after `next typegen`; fix in `use-in-view.ts` entry guard + `DoctorMascot color` prop)
- `pnpm lint` — clean (0 errors / 0 warnings; removed unused `Sparkles` import)
- `pnpm test` — 5 files, **38 tests passed** (new landing smoke 2)
- `pnpm build` — compiled; `/` static 58.4 kB (First Load 173 kB), `/design-system` 115 kB
- `pnpm test:e2e` — 4 chromium tests passed (home headline + /register route, design-system stories + swatches)

### Commit / push

- `1340f05` `Phase 04: Stitch landing migrated to (marketing)/`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for later phases

- `/login` → Nav "Log In" and `/register` → Nav/Create Vault + Hero/FinalCta CTAs are **hard-coded
  routes**; they 404 until Phase 06 lands auth pages. e2e asserts URL only (`toHaveURL`), so the suite
  stays green across that gap.
- `/demo`, `/help`, `/privacy`, `/terms`, `/accessibility`, `/report`, `/status` footer/section links
  are likewise future-route stubs.
- `public/auth/login-page.jpeg` + `public/landing/how-it-works/*` are ready for Phase 05+/auth pages.
- `HowItWorks`/`mascots.tsx` keep `minHeight: 200` rows (`.mvp-*` grid) so layout never collapses
  pre-reveal (Stitch parity).
- Tailwind v4 emits color utilities from `@theme` (no `tailwind.config`) — arbitrary value classes like
  `border-primary/[0.28]` and `shadow-[0_15px_40px_rgba(...)]` are the sanctioned composite path.

---

## Phase 05 — Database foundation (DONE)

**Plan reference:** `plan.md` §8 (schema spec, lines 406–470) + §19 (Arun Kumar sample data, line 781);
Phase 05 spec (`plan.md:899`).
**Objective met:** full §8 Drizzle schema (16 tables) + typed client + migrations + idempotent seed live
on the **Supabase** session pooler (`aws-0-ap-south-1.pooler.supabase.com`), matching §19 demo totals
(84/76/5/3/8 → 90.5%, 7-day streak) and the spec's "a test asserts every table has a zod-validated
insert demo row".

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `src/server/db/schema.ts` | created | 16 §8 tables (users, session, account, verification, medications, medication_schedules, dose_events, dose_actions, adherence_daily, caregiver_relationships, caregiver_invitations, caregiver_alerts, notifications, ai_insights, user_preferences, demo_state). `time.BigInt`-free: `id text pk` + uuidv7, snake_case, `timestamptz`/`date`, enums as `text`+`$type` TS unions, all §8 indexes/uniques (incl. partial `medications_user_name_active_uq where archived_at is null` and `adherence_daily` UNIQUE NULLS NOT DISTINCT via `unique()`) |
| `src/server/db/helpers.ts` | created | `uuidv7()` (RFC 9562, time-ordered), `utcDateKey`/`addDays`/`atTime`/`hhmm`, `upsertUser(db, input)` (stable id via `users.email` onConflictUpdate), `Db`/`DbTx` types |
| `src/server/db/client.ts` | created | singleton `Pool`+`drizzle({schema})` on `globalThis` (HMR-safe), `ssl: { rejectUnauthorized: false }`, `max: 3`, guarded `process.loadEnvFile()` at module scope |
| `src/server/db/insert-schemas.ts` | created | zod mirrors of all 16 insert types + `InsertSchemaEntry` demo rows (`satisfies typeof X.$inferInsert`) |
| `src/server/db/demo-seed.ts` | created | §19 Arun Kumar workspace builder (transactional identity rebuild: delete-in-FK-order → 4 medications → 5 schedules → 84 dose_events + dose_actions → 17 adherence_daily → 3 ai_insights → demo_state) + `demoTotals(db)` |
| `src/server/db/seed.ts` | created | idempotent: 2 dev users (alice/bob) + preferences, then `seedDemoWorkspace`; CLI main-guard via `argv[1]` |
| `src/server/db/migrate.ts` | created | applies `./drizzle` journal through the verified client pool (replaces drizzle-kit migrate) |
| `src/server/db/seed.test.ts` | created | skipIf-gated DB suite: seed idempotency (two runs → identical counts), §19 exact totals, Arun Kumar meds, zod per-table (16 rows parse; `{}` rejected) |
| `drizzle/0000_new_red_hulk.sql` | created | generated migration (committed) |
| `drizzle.config.ts` | modified | loads `.env`, requires `DATABASE_URL`-derived connection string, appends `sslmode=require` (kept dataset param-free) |
| `package.json` | modified | deps `drizzle-orm@0.45.3`, `pg@8.23.0`, `zod@4.6.5`; dev `@types/pg@8.23.1`; `db:migrate` → `tsx src/server/db/migrate.ts` |
| `.env.example` | modified | Supabase session-pooler `DATABASE_URL` + SUPABASE_* key template w/ where-to-find notes |

### Deviations & decisions (precise > faithful)

- **Supabase instead of Docker/`postgres:latest`.** User directive ("leave docker, let's use supabase");
  project ref `bujgsllqckllbnxecygj`, region ap-south-1. IPv6-only direct endpoint unreachable from this
  network, so the **session pooler (IPv4)** host `aws-0-ap-south-1.pooler.supabase.com:5432` is used.
- **`uniqueIndex().on(...).nullsNotDistinct()` unsupported** in drizzle-orm 0.45.3 (builder is
  `UniqueOnConstraintBuilder`→`UniqueConstraintBuilder`, but the *index* builder lacks the method).
  The §8 unique constraint is expressed with **`unique(...).on(...).nullsNotDistinct()`** (a table
  constraint, same semantics/DDL) — verified `UNIQUE NULLS NOT DISTINCT(...)` in generated SQL.
- **drizzle-kit `migrate` failed** (ECONNREFUSED) because its pool used the connection string *without*
  a working SSL mode — `sslmode=require` maps to verify-full under pg semantics; programmatic
  `migrate(db, { migrationsFolder })` through our `rejectUnauthorized:false` pool from `migrate.ts`
  applies cleanly. `db:generate`/`db:push` still use drizzle-kit.
- **Window is 17 days, not "~12 weeks".** §19 says demo history ~12 weeks, but acceptance totals
  (84 scheduled / 76 taken / 5 missed / 3 skipped / 8 snoozed, 90.5%) are reproducible exactly with a
  17-day window (today−16…today, last 7 days perfect). Documented as a deviation so Phase 25's
  acceleration can widen it without breaking counts.
- **§19 construction pinned:** Metformin 08:00/20:00 daily + Vitamin D 10:00 daily + Aspirin 08:00 daily
  all 17 days; B12 09:00 starts day 1 (16 days). Misses = Metformin 20:00 days 0–4 (5); skips = B12 days
  1–3 (3); snoozes = Vitamin D days 0–5 (6) + Metformin 20:00 days 5–6 (2) → 8, all snoozed-then-taken.
  Streak flag applied to the perfect tail window only (days ≥ 10), so the day-level flag reports the §19
  "7-day current streak".
- **`DemoSscenario` union name** (double-s) is a recording typo in `schema.ts` — kept as-is (consistent,
  typechecks; rename would churn migration naming).
- **Dev users** `alice@medvault.local` (Asia/Kolkata) + `bob@medvault.local` (Africa/Accra) with
  `user_preferences`, upserted via `users.email` uniqueness (stable ids across reruns).

### Verification (all green)

- `pnpm db:generate` → `drizzle/0000_new_red_hulk.sql` (16 tables; NULLS NOT DISTINCT + partial unique present)
- `pnpm db:migrate` → applied to Supabase (`migrate: applied up to date`)
- `pnpm db:seed` ×2 → `84 scheduled / 76 taken / 5 missed / 3 skipped / 8 snoozed` (idempotent)
- `pnpm typecheck` — clean
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — 6 files, **42 tests passed** (new DB suite 4: idempotency, §19 totals, med names, zod per-table)
- `pnpm build` — compiled; routes unchanged (`/` static 58.4 kB)

### Commit / push

- `016f1be` `Phase 05: Supabase schema + client + migrate + seed`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for later phases

- Migrations live in `drizzle/` (committed); drift-check with `pnpm db:generate` — it diffed "already up
  to date" against the applied journal.
- `seed.test.ts` gates on `process.env.DATABASE_URL` (skips without it, so CI without creds stays green);
  `client.ts` loads `.env` itself, so `tsx` scripts need no cross-env.
- `upsertUser` (helpers) is the reuse point for auth (Phase 06) and importer flows.
- Demo acceleration (Phase 25) should consume `demo_state.simulation_now/time_multiplier` and re-run
  `seedDemoWorkspace` for reset.
- NO auth route/auth pages yet — `/login`/`/register` still 404 (Phase 06); `users.email` unique +
  `session`/`account`/`verification` tables are ready for Better Auth.

## Phase 06 — Authentication & session plumbing (Better Auth)

**Plan reference:** Phase 06 spec (`plan.md:919`), §13 credentials validation (lines 704–716), Stitch
`AuthShell`/`AuthFooter`/`Brand`/`PasswordInput` pngs, §5 login/register/onboarding screens.
**Objective met:** Better Auth (^1.7.5) server + client + Next handler over the Phase 05 tables, Stitch
login/register UI (`/login`, `/register`) with shared zod (`loginSchema`/`registerSchema`) built on the UI
kit primitives, `(app)` gate (requireUser → `/login?next=…` with open-redirect guard), tRPC
(`me`/`whoami`/`setOnboardingComplete`), and placeholders for `/dashboard` + `/onboarding`. Registered
users land on `/onboarding`, skip → `/dashboard`, logout → `/`, re-login → `/dashboard`.

### Files created/modified

| Path | Action | Purpose |
|---|---|---|
| `drizzle/0001_auth_adapter_columns.sql` | created | additive migration (schema-step1 trick): account `id_token`, `access_token_expires_at`, `refresh_token_expires_at`; session `email`, `updated_at`; verification `updated_at` |
| `drizzle/0002_password_hash_rename.sql` | created | `ALTER TABLE "account" RENAME COLUMN "password_hash" TO "password";` (Better Auth 1.7 expects `password`) |
| `drizzle/meta/0001_snapshot.json`, `drizzle/meta/_journal.json` | modified | snapshot key `password_hash`→`password` + journal `idx: 2` appended so `db:generate` stays idempotent |
| `src/server/auth/server.ts` | created | `betterAuth({ appName, drizzleAdapter(db…), emailAndPassword{minPasswordLength:8}, secret/baseURL from env, user.additionalFields{timezone,onboardingCompleted,isDemo} input:false, session{expiresIn 7d, updateAge 1d} })` |
| `src/app/api/auth/[...all]/route.ts` | created | `toNextJsHandler(auth)` GET+POST |
| `src/lib/auth-client.ts` | created | `createAuthClient()`; re-exports `authClient`, `useSession`, `signIn`, `signUp`, `signOut` |
| `src/server/trpc/context.ts` | created | `createContext` resolves `auth.api.getSession({ headers })` → `{ db, user, session }` |
| `src/server/trpc/trpc.ts` | created | `router`/`publicProcedure`/`protectedProcedure` (UNAUTHORIZED) |
| `src/server/trpc/routers/auth.ts` + `root.ts` | created | `me` (public), `whoami` + `setOnboardingComplete` (protected) |
| `src/app/api/trpc/[trpc]/route.ts` | created | `fetchRequestHandler` (GET+POST) |
| `middleware.ts` | created | injects `x-pathname` header (matcher excludes static/assets) |
| `src/server/auth/require-user.ts` | created | redirect gate → `/login?next=` (safe, guarded) |
| `src/shared/validations/auth.ts` + `auth.test.ts` | created | §13 schemas: name trim 2–100, email trim/lower, password ≥8 + letter + number; loginSchema + normalized email, `rememberMe` as required boolean |
| `src/features/auth/flow.ts` + `flow.test.ts` | created | `safeNext()` (open-redirect/auth-route guard) + `hasOnboarded(Record<string, unknown>)` |
| `src/features/auth/auth-error.ts` | created | better-auth error-code → UI message mapping |
| `src/features/auth/*.tsx` (AuthShell, AuthFooter, PasswordInput, LoginForm, RegisterForm, SignOutButton, SkipOnboardingButton) | created | Stitch screens from UI-kit primitives, RHF+zodResolver, error Alert (destructive) |
| `src/components/icons/google-icon.tsx` | created | Google "G" mark for the disabled SSO button (hex exempt — outside `src/features`) |
| `src/app/(auth)/layout.tsx` + `login/page.tsx` + `register/page.tsx` | created | pre-authed redirect (+onboarding), heading, next-preserving swap link |
| `src/app/(app)/layout.tsx` + `dashboard/page.tsx` + `onboarding/page.tsx` | created | requireUser gate + placeholder screens (email, sign out, skip-onboarding) |
| `e2e/auth.spec.ts` | created | unauthenticated redirect + register→onboarding→dashboard→logout→login round trip |
| `.env` | modified | `BETTER_AUTH_SECRET` (base64 via node crypto — no `openssl` on PATH) + `BETTER_AUTH_URL` |
| `.env.example` | modified | `BETTER_AUTH_URL=http://localhost:3000` export |

### Deviations & decisions (precise > faithful)

- **drizzle-kit 0.31.11 can't rename non-interactively.** A conflicting diff (rename + additions) triggered
  its interactive TTY prompt (throws in CI). Solved: generated the **additive** 0001 against a temp schema
  (dropped `password_hash` from the file, deleted afterwards), then **hand-wrote** `0002` rename SQL and
  patched `drizzle/meta/0001_snapshot.json` + `_journal.json` (`idx: 2`) so `db:generate` reports
  "No schema changes". This keeps drizzle-kit as the drift-checker without fighting its prompts.
- **Better Auth client can't carry `user.additionalFields`** — `BetterAuthClientOptions` has no `user` key
  (TS2353), so the client stays plain and the session user is typed without additionalFields;
  `hasOnboarded` widens to `Record<string, unknown>`.
- **`rememberMe` is a required boolean** (no `.default(false)`) — RHF `Resolver` input/output typing breaks
  with defaults; the form supplies it via `defaultValues`.
- **Browser→tRPC fetch needs `Content-Type: application/json`** (415 UNSUPPORTED_MEDIA_TYPE otherwise);
  `SkipOnboardingButton` posts `body: "{}"` for the no-input mutation.
- **`(auth)` layout redirect logic:** authed+onboarded → `/dashboard`, authed not-onboarded → `/onboarding`;
  `next` is preserved through login/register swap and validated by `safeNext` (no `//`, no `/login*`,
  internal paths only).
- **e2e cold-compile flake:** first click raced the dev-server first compilation (button stuck `disabled`).
  Fixed with 30s `toHaveURL` timeouts; register→onboarding verified stable.
- **Heading text asserts with `/Welcome\s*back\.?/i`** — Stitch `<br/>` in "Welcome<br/>back." renders as
  "Welcomeback." (no space) in the accessibility tree.

### Verification (all green)

- `pnpm db:migrate` → `applied up to date`; `pnpm db:generate` → `No schema changes, nothing to migrate`
- `pnpm typecheck` — clean
- `pnpm lint` — clean (0 errors / 0 warnings)
- `pnpm test` — 9 files, **62 tests passed** (auth + flow + forms suites)
- `pnpm build` — ok (sign-in/out static routes unchanged; `/login`, `/register`, `/onboarding`, `/dashboard`, API routes dynamic)
- `pnpm test:e2e` — **6 passed** (auth.spec 2 + home + design-system)

### Commit / push

- `3006415` `Phase 06: Better Auth login/register + (app) gate + tRPC`
- pushed to `origin/main`; `git status` clean afterwards.

### Hand-off notes for later phases

- Only e2e-registered users have passwords (seeded `alice`/`bob` don't) — login works for anything you sign up.
- Phase 10 (onboarding) replaces the `onboarding/page.tsx` placeholder; keep the `setOnboardingComplete`
  mutation as its completion path.
- tRPC is scaffolded to be the shared-call surface for Phase 07 contracts; `protectedProcedure` is the gate.
- Google SSO button is intentionally disabled until a provider is configured.
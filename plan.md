# MedVault (MediTrack AI) — Complete Implementation Plan

> Product: **MediTrack AI — AI Smart Medical Adherence & Tracker**
> Working brand (from the Stitch landing page): **MedVault**
> Tool: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Lucide · tRPC · TanStack Query · Better Auth · PostgreSQL · Drizzle ORM · Recharts · date-fns · Vercel AI SDK · Vitest · React Testing Library · Playwright · pnpm

This document is the single source of truth for building the application. A coding agent must be able to read **only** the repository, the Stitch export under `Landingpage/`, and this file, and implement the full application without guessing.

---

# TABLE OF CONTENTS

1. Reading Order & Conventions
2. Repository Inspection Summary (current state)
3. Product Purpose & Scope
4. Technology Stack & Architecture
5. Brand Identity & Design System (extracted from the Stitch landing page)
6. Screens → Routes Mapping
7. Global Application Shell
8. Database Schema
9. Shared Contracts, Types & Validation
10. Domain Logic Specifications
11. Route-by-Route Specification
12. Status System
13. Forms & Validation Requirements
14. Authentication & Authorization
15. Loading / Empty / Error / Success State Contract
16. Responsive Behavior Contract
17. Security & Data Integrity
18. Testing Strategy
19. Repository / Module Directory Layout
20. Cross-Feature Data Propagation Matrix
21. Implementation Phases (Phase 01 → Phase 30)
22. Global Definition of Done

---

## 1. READING ORDER & CONVENTIONS

- If you are implementing: read §5 (design system) first, then §7–§20 (contracts), then the phase you are executing. Every phase lists its exact accepting/depending files.
- The folders named in the plan are the target layout. The existing `Landingpage/` folder is the **design reference** and is never to be deleted or "cleaned up"; it contains the Stitch export we must not depend on at runtime, but from which source code is *ported* into the Next.js app.
- All shared strings/types (statuses, route paths, enums, dashboard quick actions) must be imported from `src/shared/`, never re-typed inline.
- All business rules live in `src/server/domain/**`. UI never computes adherence/status/streak itself; it calls tRPC procedures or imports pure shared helpers (`src/shared/calc/*`) that are also used by the domain services (the two must stay in sync — the domain service is the authority; the shared helpers are the same code paths, exported as pure functions).
- Language in the UI is English. Brand text uses the MedVault wordmark exactly as in the Stitch export.

---

## 2. REPOSITORY INSPECTION SUMMARY (current state)

The repository currently contains one commit (`621377a "Add MedVault landing page"`) and a single directory:

```
D:\My ShYts\MedVault\
├─ .git/                 (git repo, branch main)
└─ Landingpage/          (Stitch-generated Vite + React SPA — DESIGN REFERENCE)
```

`Landingpage/` is a **Vite + React 19 + Tailwind v4** single-page site. It is NOT a Next.js app and NOT the product app; it is the marketing/landing page plus the two design compositions that define the visual language. Key files:

| File | Role for this build |
|---|---|
| `src/App.jsx` (1304 lines) | Full landing page: nav, hero, "How It Works", "Features", testimonials, CTA, footer, floating AI chat. **Primary design token source.** |
| `src/components/HeroVisual.jsx` | Hero phone + floating notification chips. Defines the "notification card" motif. |
| `src/components/FloatingCard.jsx` | Glass card recipe (used as dashboard/insight card motif). |
| `src/mobile.jsx` | Full phone mockup (screen + bottom nav + floating cards). Defines the **mobile app UI visual** (feed rows, bottom nav, list chips). |
| `MedVaultAuthIllustration.jsx` | Login/Sign-up split screen. **Direct design reference for `/login` and `/register`.** |
| `MedVaultPhoneSection.jsx` | Additional phone mockup composition (sparkles, snooze pill, badge). |
| `src/index.css`, `src/App.css` | Left-over Vite template CSS (dark-mode CSS vars are **not** part of the design; ignore `--accent:#aa3bff`). |
| `public/favicon.svg` | Purple Vite-style bolt favicon (leftover). The MedVault favicon used in the nav is the **emerald→cyan gradient square + white HeartPulse** logo, defined in `App.jsx`. |
| `public/icons.svg` | Leftover Vite social sprite. Ignore. |
| `public/{hero,how-it-works,images,imagessss}` | PNG/JPG assets used by the landing page; port into the Next app `public/`. |
| `dist/` | Stale build output. Ignore (never reference at runtime). |

Screens designed by Stitch that MUST be honored:
1. **Landing page** (hero, how-it-works, features x3, trust, CTA, footer, AI chat FAB).
2. **Auth split screen** (image left, form right, logo, big headline, inputs with emerald focus ring, emerald primary button, Google button, back button).
3. **Mobile phone app UI** (feed/list rows with tinted icon chips, section labels with green `›`, bottom tab bar with active-dot, floating "AI Insight"/"Report Upload"/"Medicine reminder" glass cards, green snooze pill, 8:00 PM status badge).

There is **no existing application code** to build on top of; everything product-side is greenfield. The Next.js app will live at the repository root, with `Landingpage/` kept intact.

---

## 3. PRODUCT PURPOSE & SCOPE

MedVault is a **medication adherence and tracking** app. It answers two questions immediately: *"What medicine do I need to take now?"* and *"How well am I following my medication schedule?"*

**AI is strictly behavioral/adherence intelligence.** It may surface patterns in missed doses, timing, trends, reminder/snooze behavior, and medication-by-medication adherence. AI **must never** diagnose disease, recommend treatment, recommend changing a medication or dosage, prescribe, or make clinical decisions. This boundary is enforced by (a) the system prompt, (b) the input data schema (adherence-only), (c) the validated output schema, and (d) the fact that AI output is **read-only** — it can never mutate medications, schedules, or dose events.

**Deliberate non-goals:** medical diagnosis; treatment recommendations; appointment scheduling; document OCR/upload (the landing page mentions records/upload/OCR — out of scope for this product; the design language is retained, the features are not built).

### 3.1 Brand naming decision (documented, do not revisit)
- The Stitch export brands everything **MedVault** (logo: `linear-gradient(135deg,#10b981,#06b6d4)` rounded square + white `HeartPulse` icon; wordmark **MedVault** with *Vault* in `#10b981`; AI assistant named **MedVault AI**).
- **Decision:** the in-app UI, logo, favicon, wordmark, AI assistant name, and marketing copy all use the **MedVault** brand verbatim from the Stitch export.
- "MediTrack AI" is the product/project full name used in page metadata, `<title>`, SEO/OG, package name, and documentation (e.g., title tag `MediTrack AI · MedVault`).
- All brand usage goes through exactly one source: `src/shared/brand.ts` (name, tagline, colors, logo recipe) and one `Brand` component. Changing the product name later is a one-file change.

---

## 4. TECHNOLOGY STACK & ARCHITECTURE

Stack (exact):
- **Next.js 15+** App Router, React 19, TypeScript (strict).
- **Tailwind CSS v4** (CSS-first config via `@theme` in `globals.css`).
- **shadcn/ui** (non-visualized primitives: behavior/accessibility only, restyled to Stitch tokens) + **Radix UI** primitives it pulls in.
- **Lucide React** icons.
- **React Hook Form + Zod** for all forms; shared Zod schemas power both client and server.
- **tRPC v11** + **@tanstack/react-query** for all authenticated data operations.
- **Better Auth** (email/password + sessions; provider-capable) with the Drizzle adapter.
- **PostgreSQL** local, **Drizzle ORM**, **drizzle-kit** migrations, `pg` driver.
- **Recharts** charts, **date-fns** (v4, includes time zones) for dates/times.
- **Vercel AI SDK** (`ai` package) provider-agnostic LLM abstraction for insights; provider configured by env var.
- **Vitest + React Testing Library** (unit/component), **Playwright** (E2E), **pnpm** package manager.

Architecture: **modular monolith**, single Next.js app, strict layering:

```
UI (app/ pages + features/ components)
        ↓
Reusable Components (components/ui + components/layout)
        ↓
Route/Page Layer (app/**/page.tsx — thin, wires features + tRPC)
        ↓
tRPC Procedures (server/trpc/routers/**  — auth context + input validation)
        ↓
Validation (shared/validations/** ZOD)
        ↓
Domain/Service Layer (server/domain/**  — pure business logic + db access)
        ↓
Database Access (server/db/** drizzle query builders)
        ↓
Drizzle ORM → PostgreSQL
```

Rules:
- Presentation never touches SQL.
- Domain never imports React/Next.
- Domain services depend only on Drizzle types, `shared/`, and each other.
- tRPC routers are thin: parse input → authz check → call domain service → map/return DTO.
- Shared contracts in `src/shared/` are imported by BOTH server and client (they must stay dependency-free).
- Pure calculation helpers (status calc, adherence, streaks, schedule expansion) live in `src/shared/calc/` so the client and the domain service share the exact same math; the domain service is the only writer of state.

### 4.1 Directory layout (target)

```
D:\My ShYts\MedVault\
├─ plan.md
├─ Landingpage/                    # Stitch design reference (UNTOUCHED)
├─ package.json                    # root = the Next.js web app (name: meditrack-ai)
├─ pnpm-lock.yaml
├─ next.config.ts
├─ tsconfig.json
├─ drizzle.config.ts
├─ eslint.config.mjs
├─ vitest.config.ts
├─ playwright.config.ts
├─ .env.example                    # DATABASE_URL, BETTER_AUTH_SECRET, AI provider keys, DEMO_*
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                # root layout: fonts, providers, toaster
│  │  ├─ globals.css               # Tailwind v4 + @theme design tokens (Stitch)
│  │  ├─ (marketing)/              # "/" landing page (ported from Stitch) + help
│  │  ├─ (auth)/
│  │  │  ├─ login/
│  │  │  ├─ register/
│  │  │  └─ onboarding/
│  │  ├─ (app)/                    # authenticated shell layout (Sidebar+TopNav+bottom nav)
│  │  │  ├─ dashboard/
│  │  │  ├─ medications/  medications/new/ medications/[id]/ medications/[id]/edit/
│  │  │  ├─ schedule/    schedule/[doseId]/
│  │  │  ├─ adherence/   adherence/medications/
│  │  │  ├─ insights/  history/  reports/
│  │  │  ├─ caregiver/  caregiver/alerts/[id]/
│  │  │  ├─ notifications/
│  │  │  └─ settings/profile  settings/reminders  settings/caregiver
│  │  │     settings/appearance  settings/data
│  │  ├─ demo/                     # demo session + demo shell
│  │  └─ api/
│  │     ├─ auth/[...all]/route.ts # Better Auth handler
│  │     ├─ trpc/[trpc]/route.ts   # tRPC HTTP handler
│  │     └─ reports/export/route.ts # CSV export (authenticated)
│  ├─ components/
│  │  ├─ ui/                       # design-system primitives (Stitch-styled)
│  │  ├─ layout/                   # AppShell, Sidebar, TopNav, BottomNav, Breadcrumb
│  │  └─ brand/                    # Brand logo + wordmark
│  ├─ features/                    # feature-specific components + client hooks
│  │  ├─ auth/  onboarding/  dashboard/  medications/  schedule/  dose/
│  │  ├─ adherence/  history/  reports/  caregiver/  notifications/
│  │  ├─ insights/  settings/  demo/  help/
│  ├─ lib/                         # trpc client, utils (cn), formatting, logging
│  ├─ shared/
│  │  ├─ brand.ts                  # product/brand single source
│  │  ├─ enums.ts                  # dose status, med status, notification/caregiver types...
│  │  ├─ constants.ts              # defaults (missedAfter, snoozeMinutes, limits...)
│  │  ├─ types.ts                  # DTO/entity types
│  │  ├─ times.ts                  # date-fns helpers (local timezone, buckets)
│  │  ├─ calc/                     # PURE math (shared by client + domain)
│  │  │  ├─ schedule.ts            # schedule slot → occurrence expansion
│  │  │  ├─ doseState.ts           # status transition & due/missed logic
│  │  │  ├─ adherence.ts           # formulas
│  │  │  ├─ streaks.ts             # current/longest streak
│  │  │  └─ performance.ts         # per-medication perf, time-of-day patterns
│  │  └─ validations/              # Zod schemas (used by RHF + tRPC)
│  │     ├─ auth.ts  medication.ts  schedule.ts  doseAction.ts
│  │     ├─ caregiver.ts  settings.ts  reports.ts  onboarding.ts
│  ├─ server/
│  │  ├─ db/
│  │  │  ├─ client.ts  schema.ts  seed.ts  demo-seed.ts
│  │  ├─ auth/
│  │  │  ├─ server.ts              # Better Auth server instance
│  │  │  └─ session.ts             # getSession helpers for routes
│  │  ├─ trpc/
│  │  │  ├─ trpc.ts  context.ts  root.ts
│  │  │  └─ routers/ (medication.ts schedule.ts dose.ts adherence.ts dashboard.ts
│  │  │              history.ts reports.ts caregiver.ts notifications.ts
│  │  │              insights.ts settings.ts demo.ts onboarding.ts)
│  │  ├─ domain/                   # business logic
│  │  │  ├─ medications/  medicationSchedules/  doseEvents/  doseActions/
│  │  │  ├─ adherence/  caregiver/  notifications/  reports/  insights/
│  │  │  ├─ demo/  settings/
│  │  │  └─ jobs/                  # reconcile + backfill (server action / cron hook)
│  └─ styles/
├─ e2e/                            # Playwright specs
└─ drizzle/                        # generated migrations
```

---

## 5. BRAND IDENTITY & DESIGN SYSTEM (extracted from the Stitch landing page)

**The Stitch export is the visual source of truth.** shadcn/ui supplies behavior/accessibility; every color, radius, shadow, font weight, spacing value below is implemented as design tokens, and every component recipe below is reproduced. Do **not** restyle with generic shadcn defaults.

### 5.1 Brand
- **Logo tile:** 36–44px, `border-radius: 10–12px`, `background: linear-gradient(135deg, #10b981, #06b6d4)`, white `HeartPulse` (lucide) icon centered, shadow `0 4px 12px rgba(16,185,129,0.25)`.
- **Wordmark:** `Plus Jakarta Sans`, weight 900, ~20px, `#0f172a`, `letter-spacing: -0.02em`. Text = `Med` + `<span color:#10b981>Vault</span>`.
- **AI assistant brand:** "MedVault AI" with a `Bot` icon; header gradient `linear-gradient(135deg,#10b981,#059669)`; status text `rgba(255,255,255,0.8)`.

### 5.2 Typography
- Font family: **Plus Jakarta Sans** (400–900). Load via `next/font/google`. Fallback `system-ui, 'Segoe UI', Roboto, sans-serif`. Phone-mockup motif may use DM Sans but the app uses PJ Sans.
- Display/hero H1: `clamp(42px,5.5vw,72px)`, weight 900, `line-height 1.08`, `letter-spacing -0.03em`, color `#0f172a`.
- Section H2: `clamp(26px,4vw,52px)`, weight 900, `letter-spacing -0.025em`.
- Feature H3: `clamp(28px,3.5vw,44px)`, weight 800, `letter-spacing -0.025em`, `line-height 1.15`.
- Kicker/eyebrow: `13px`, weight 800, `letter-spacing 0.12em`, `uppercase`, colored per-section (`#10b981` emerald, `#f472b6` pink, `#06b6d4` cyan).
- Body: `15–17px`, weight 400–500, `#475569`/`#64748b`, `line-height 1.6–1.8`.
- Field labels: `14px`, weight 700, `#1e293b`.
- Field text: `15px`, weight 500.
- Card titles: `14–16px`, weight 700–800.
- Small/muted/helper: `11–13px` (e.g., `#94a3b8`).
- Stat numbers: `36px`, weight 900.
- Scale letters: weight 800 for chips, weight 600 for secondary buttons.

### 5.3 Color palette (canonical tokens → `@theme`)
| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#10b981` | Primary actions, active states, links, checks |
| `--color-primary-dark` | `#059669` | Hover/gradient end |
| `--color-primary-tint` | `#d1fae5` | Emerald chip backgrounds |
| `--color-primary-tint-2` | `#a7f3d0` | Chip gradient end |
| `--color-primary-soft` | `#f0fdf4` | Soft backgrounds, chat bubbles, hero start |
| `--color-primary-ring` | `rgba(16,185,129,0.12)` | Focus ring (4px) |
| `--color-secondary` | `#06b6d4` | Second gradient color, cyan accents |
| `--color-secondary-tint` | `#cffafe` | Cyan chips |
| `--color-secondary-soft` | `#f0f9ff` | Hero end |
| `--color-magenta` | `#f472b6` / tint `#fce7f3` | Reminders feature accent |
| `--color-violet` | `#8b5cf6` | Discover feature accent, "AI" accents |
| `--color-blue` | `#3b82f6` / tint `#dbeafe` | Upcoming dose, appointments |
| `--color-red` | `#ef4444` | Missed dose, destructive |
| `--color-red-tint` | `#fee2e2` | Missed chip bg |
| `--color-amber` | `#f59e0b` / tint `#fef3c7` | Snoozed, ratings stars |
| `--color-teal` | `#14b8a6` | Alternate accent |
| `--ink-900` | `#0f172a` | Headings, primary text (footer bg) |
| `--ink-800` | `#1e293b` | Labels, strong body |
| `--ink-700` | `#334155` | Strong list text |
| `--ink-600` | `#475569` | Body secondary |
| `--ink-500` | `#64748b` | Body tertiary, placeholders |
| `--ink-400` | `#94a3b8` | Muted |
| `--phone-muted` | `#9ab5ad` | Phone-mockup muted text |
| `--phone-ink` | `#0d1f1a` | Phone-mockup headings |
| `--border` | `#e2e8f0` | Cards, inputs, nav bottom edge |
| `--border-strong` | `#cbd5e1` | Hover borders |
| `--bg` | `#f8fafc` | Page background |
| `--bg-card` | `#ffffff` | Cards, inputs (focus) |
| `--bg-input` | `#f8fafc` | Input resting bg |
| `--bg-soft` | `#f1f5f9` | Scrollbar track, dividers |
| `--hero-gradient` | `linear-gradient(150deg,#f0fdf4 0%,#f8fafc 50%,#f0f9ff 100%)` | Marketing hero; app auth hero band |
| `--footer-bg` | `#0f172a` | Dark footer / dark surfaces |

**Status color system** (spec §12) maps: taken `#10b981`, upcoming `#3b82f6`, due `#10b981` (primary, pulsing), missed `#ef4444`, skipped `#94a3b8`, snoozed `#f59e0b`, paused `#64748b`.

### 5.4 Borders / Radius / Shadows
- **Pill buttons:** `border-radius: 100px` (marketing CTAs + "ghost" variant: `border:2px solid #e2e8f0`, `color:#475569`; hover border/color → `#10b981`).
- **Auth/primary form buttons:** `border-radius: 14px`, height ~48px, full-width, `bg #10b981` (hover `#059669`, translateY(-2px), shadow `0 12px 24px rgba(16,185,129,0.25)`), weight 700, arrow icon.
- **Inputs:** `padding:16px 18px`, `border-radius:14px`, `border:1.5px solid #e2e8f0` (→ `#10b981` on focus), `bg #f8fafc` (→ white on focus), `font-size:15px`, weight 500, `color:#0f172a`, focus shadow `0 0 0 4px rgba(16,185,129,0.12)`, transition all 0.25s.
- **Cards:** white, radius `20–24px`, `border:1px solid #e2e8f0`, shadows `0 12px 48px rgba(0,0,0,0.04)` (feature) / `0 2px 12px rgba(0,0,0,0.05)` (testimonial). Compact list rows: `border-radius:14px`, `border:0.5px solid #e2eeea`.
- **Glass cards** (insight/notification/dashboard hero motifs): `rgba(255,255,255,0.88–0.95)` + `backdrop-filter: blur(14px)`, radius `18–22px`, border `1px solid rgba(16,185,129,0.28)` (or white/30), shadow `0 8px 32px rgba(16,185,129,0.13)` / `0 20px 50px rgba(0,0,0,0.15)`.
- **Chips / icon tiles:** radius `6–14px`; icon chip `40–46px`, `linear-gradient(135deg,#d1fae5,#a7f3d0)` with `#10b981` icon.
- **Snooze pill:** `#10b981` bg, white `10px/700`, `padding:3px 18px`, radius `6px`.
- **Nav:** fixed, height `68px`, `rgba(255,255,255,0.95)` + `blur(16px)` when scrolled, `border-bottom:1px solid #e2e8f0`, shadow `0 4px 24px rgba(0,0,0,0.06)`.
- **Leaf-shadow used in app focus states:** soft `0 4px 12px rgba(16,185,129,0.10)`.

### 5.5 Component recipes (reproduce in components/ui)
- **PrimaryButton:** `bg:#10b981` → gradient `linear-gradient(135deg,#10b981,#059669)`, white, pill (100px) or 14px radius, shadow `0 8px 32px rgba(16,185,129,0.27)`; hover translateY(-2px) + `0 12px 40px rgba(16,185,129,0.6)`.
- **GhostButton:** transparent, `2px solid #e2e8f0`, `#475569`, pill.
- **TextButton ("Log In"):** no bg/border, `#475569`, weight 600, hover `#10b981`.
- **IconButton:** 44×44 circle, white, `1.5px solid #e2e8f0`, hover `#f1f5f9` (used for back button).
- **Input/Select/Textarea:** per §5.4 inputs; select mirrors input (chevron icon).
- **Checkbox:** `18×18`, `accentColor:#10b981`, radius 4.
- **Badge/StatusChip:** circle chip `24px`, tint bg + color icon; or pill badge w/ tint bg + colored text (uses §5.3 tint tokens).
- **ListRow (feed):** white, radius 14, `border:0.5px solid #e2eeea`, padding `10–13px`, left icon chip (32px, radius 8, tinted), title `12–14px/700`, sub `10–12px` muted, right meta; used for today's schedule, history, notifications.
- **SectionLabel:** `12px/700`, `#0d1f1a`-style ink, right chevron in `#10b981` (phone-mockup motif) — use for dashboard section headers ("Recent Reports ›" pattern → "Today's Schedule ›").
- **StatPill/StatCard:** number `36px/900` colored + label `12px` `#64748b` letter-spacing 0.04em.
- **Avatar:** 34–40px circle, `linear-gradient(135deg,<color>,<color>99)`, white initial, `border:2px solid white`, overlapping stack `-10px` margins.
- **NavigationLink:** `nav-link` hover treatment: pill background `linear-gradient(135deg,#10b98115,#06b6d415)` + `1px solid #10b98130`, color → `#10b981`, springy scale.
- **MirrowedInput** (search): input w/ leading icon.
- **FAB:** 56px circle, gradient, shadow `0 8px 28px rgba(16,185,129,0.6)` (used for AI chat FAB).
- **Tag/Pill:** `rgba(255,255,255,0.2)` pill on colored CTA (e.g., "Health Services & Tips...").
- **StarRating:** 5 amber `CheckCircle2` icons `fill:#f59e0b30`.
- **Divider:** `1px solid #e2e8f0`; subtle `0.5px #e8f0ee`.
- **EmptyState body:** muted text `#64748b`, weight 400–500, CTA primary pill.

### 5.6 Spacing & layout scale
- Base 4px. Section paddings: 80–140px vertical (marketing); app content `padding: 24–40px`.
- Card padding: 20–36px (app cards ~ `p-5`/`p-6`), radius 20–24.
- Gaps: 8/12/16/20/24. Nav `padding:0 4%`. Content max-width 1400px.
- App shell (desktop): sidebar ~ `w-64` persistent; topbar `h-16/h-[68px]` matching nav height; content max-width 1280–1400 with `p-6 md:p-8`.

### 5.7 Dark mode
Default = the Stitch light theme. `settings/appearance` offers light/dark/system. Dark variant maps tokens tastefully (page `#0f172a`, cards `#1e293b`, borders `#2e303a`-style, headings white, primary stays `#10b981` with brighter tints), matching the footer/dark surfaces of the Stitch export. No neon/cyberpunk.

---

## 6. SCREENS → ROUTES MAPPING

| Stitch screen | Product screen | Route(s) |
|---|---|---|
| Landing page | Marketing home | `/` (app `(marketing)` group) |
| Auth split screen | Login / Register | `/login`, `/register` |
| Phone feed (Recent Reports / Upcoming) | Today's Schedule / History feeds (same list-row motifs) | `/schedule`, `/history`, `/notifications` |
| Floating "AI Insight" glass card | AI Insight cards on Dashboard & `/insights` | `/dashboard`, `/insights` |
| "Medicine reminder … Snooze" card | DoseCard with Snooze/Take/Skip | `/schedule`, `/schedule/[doseId]`, `/dashboard` |
| Snooze pill + time badge | Dose action controls + Due time badge | all dose surfaces |
| Bottom nav (home active w/ dot) | Mobile bottom navigation | `(app)` shell on mobile |
| "AI chat" FAB | Help/insight chat entry (decorative→links to /help) | shell, `/help` |
| Footer / trust sections | /help and marketing footer (port) | `/`, `/help` |

Routes with no Stitch equivalent (dashboard grid, medication forms, tables, charts, caregiver, reports, settings, history filters, demo) inherit the design system from §5 (cards, tokens, inputs, status chips, charts use the palette).

---

## 7. GLOBAL APPLICATION SHELL (`(app)` route group)

Shared layout under `src/app/(app)/layout.tsx`, used by every authenticated page (dashboard…settings). Provides:
- **Desktop (≥1024px):** persistent left sidebar (w-64), top header, breadcrumb + page title, notification bell (unread badge), profile avatar dropdown, main scroll area.
- **Tablet (768–1023px):** same shell; sidebar collapsible (hamburger), overlay drawer when open, auto-collapse default.
- **Mobile (<768px):** compact top header (brand + bell + avatar), no sidebar; **bottom navigation bar** styled after the phone-mockup bottom nav (white, `border-top:0.5px solid #e8f0ee`, 4 items + active dot in `#10b981`): Home (Dashboard), Schedule, Add (medication), More (opens sheet with full nav). Settings/help live under the More sheet. Floating "Add medication" FAB on mobile where relevant.

Sidebar sections & links (must map to real routes):
- Overview: **Dashboard** `/dashboard`
- Management: **Medications** `/medications`, **Today's Schedule** `/schedule`, **History** `/history`
- Intelligence: **Adherence** `/adherence`, **AI Insights** `/insights`, **Reports** `/reports`
- Care: **Caregiver** `/caregiver`
- Bottom: **Notifications** `/notifications`, **Settings** `/settings/profile`, **Help** `/help`
- Caregiver-mode users see a compact patient-context bar (which patient, switch).

Active link: highlight via `nav-link` hover treatment persistently (tinted pill + emerald text), plus `aria-current="page"`.
Top header: page title + breadcrumb; bell dropdown (recent unread notifications, link to /notifications); profile menu (name/email, Settings, Log out).
All navigation data lives in `src/shared/nav.ts` (single map: label, href, icon, group) to prevent fake/dead links; a unit test asserts every href is a real route.

---

## 8. DATABASE SCHEMA (Drizzle, PostgreSQL)

Conventions: `id text primary key` (generate `uuidv7`/crypto.randomUUID); `timestamptz` for instants; `date` for calendar days; `createdAt/updatedAt` defaults `now()`. All user-owned tables have `userId` FK → `users.id` with `onDelete: 'cascade'` and are indexed by `(userId, …)`.

### 8.1 `users` (Better Auth required shape + profile)
- `id` text PK · `name` text · `email` text unique · `emailVerified` boolean default false · `image` text null · `createdAt`/`updatedAt` timestamptz
- Profile: `timezone` text default `'UTC'` · `onboardingCompleted` boolean default false · `isDemo` boolean default false (marks the demo user)

### 8.2 Better Auth support tables
`session` (id, token unique, userId FK, expiresAt, ipAddress, userAgent, createdAt), `account` (id, accountId, providerId, userId FK, accessToken/refreshToken, scope, createdAt, updatedAt, passwordHash null), `verification` (id, identifier, value, expiresAt, createdAt). Columns match the `better-auth/drizzle` adapter exactly.

### 8.3 `medications`
Purpose: the medication master record. Soft-deleted to preserve history.
- `id` PK · `userId` FK · `name` text (255) · `dosageAmount` numeric(10,2) · `dosageUnit` text(50) (e.g., `mg`, `mcg`, `IU`, `tablet`) · `instructions` text null · `notes` text null · `status` text `'active'|'paused'` default `'active'` · `startDate` date · `endDate` date null · `color` text (assigned UI accent for avatar/chip) · `remindersEnabled` bool default true · `archivedAt` timestamptz null (soft delete) · `createdAt`/`updatedAt` timestamptz
- Index: `(userId, archivedAt)`, `(userId, status)` · partial unique `(userId, name, archivedAt)` to avoid duplicate active names.
- Lifecycle: delete → sets `archivedAt`, keeps dose events; historical views join regardless of archive. Hard-delete only for demo-reset/account deletion (cascade wipes history intentionally).

### 8.4 `medication_schedules` (schedule slots)
Purpose: one row per daily dosing time for a medication (the schedule).
- `id` PK · `medicationId` FK → medications.id `onDelete: cascade` · `timeOfDay` text `'HH:mm'` (local to user timezone) · `daysOfWeek` smallint[] default `[0,1,2,3,4,5,6]` (0=Sunday) · `dosageAmount` numeric(10,2) null (per-slot override) · `instructionOverride` text null · `enabled` bool default true · `createdAt`/`updatedAt`
- Index: `(medicationId)`. Unique: `(medicationId, timeOfDay)` (per consistent day set).
- Frequency label derived: 1 enabled slot → "Once daily"; 2 → "Twice daily"; N → "N times daily"; non-full week → "Mon/Wed/Fri" style label.

### 8.5 `dose_events`
Purpose: materialized scheduled doses — the canonical object for all dose state, adherence, history, notifications.
- `id` PK · `userId` FK · `medicationId` FK (cascade) · `scheduleId` FK null (`onDelete: set null`) · `scheduledFor` timestamptz (day+time in user timezone) · `status` text (§12: `upcoming|due|snoozed|taken|missed|skipped|canceled`) default `upcoming` · `missedDeadline` timestamptz null (deterministic miss moment; set at creation = scheduledFor+missedAfter; updated on snooze) · `takenAt` timestamptz null · `skippedAt` timestamptz null · `skippedReason` text null · `snoozeCount` int default 0 · `snoozeUntil` timestamptz null · `statusUpdatedAt` timestamptz · `isDemo` boolean default false · `source` text `'generated'|'demo'`
- **Unique:** `(medicationId, scheduledFor)` (prevents duplicate generation) · Indexes: `(userId, scheduledFor)`, `(userId, status)`, `(userId, scheduledFor, status)`, `(isDemo)`.

### 8.6 `dose_actions` (audit / history / snooze history)
Purpose: an immutable append-only log of every state-changing action. Powers History and undo.
- `id` PK · `userId` FK · `doseEventId` FK → dose_events.id (`onDelete: cascade`) · `action` text `take|skip|snooze|unsnooze|missed_auto|restored|voided|demo` · `occurredAt` timestamptz · `meta` jsonb null (e.g., `{snoozeUntil, snoozeMin, skipReason, source, prevStatus}`)
- Indexes: `(userId, occurredAt)`, `(doseEventId)`.

### 8.7 `adherence_daily` (materialized daily summary)
Purpose: fast charts/reports/dashboard; **never trusted over raw computation** — always recomputed by the same service used for on-the-fly math.
- `id` PK · `userId` FK · `date` date · `medicationId` FK null (null = user-wide row) · `scheduled` int 0 · `taken` int · `missed` int · `skipped` int · `snoozed` int · `adherencePercent` numeric(5,2) null · `streakDay` bool · `updatedAt`
- Unique: `(userId, date, medicationId)`.
- Recompute triggers: after any dose action, after reconcile, after schedule changes (service recalculates affected range).

### 8.8 `caregiver_relationships`
- `id` PK · `patientUserId` FK → users · `caregiverUserId` FK → users · `status` text `'pending'|'active'|'declined'|'revoked'` · `relationType` text `'family'|'friend'|'professional'|'other'` · `permissions` jsonb (see §10.6) · `invitedByUserId` FK · `revokedAt`/`acceptedAt` timestamptz null · `createdAt`/`updatedAt`
- Index: `(patientUserId)`, `(caregiverUserId)` · Unique: `(patientUserId, caregiverUserId)`.

### 8.9 `caregiver_invitations`
- `id` PK · `patientUserId` FK · `email` text · `token` text unique · `message` text null · `status` text `'pending'|'accepted'|'expired'|'revoked'` · `expiresAt` timestamptz (default +7d) · `createdAt`
- Token = `crypto.randomBytes(24).toString('base64url')`; consumed once.

### 8.10 `caregiver_alerts`
Purpose: missed-dose / adherence-drop alerts a caregiver receives, originating from **actual dose state**.
- `id` PK · `patientUserId` FK · `caregiverUserId` FK · `relationshipId` FK null · `doseEventId` FK null · `type` text `'missed_dose'|'adherence_drop'|'insight'|'demo'` · `title` text · `body` text · `data` jsonb null (snapshots: patientName, medicationName, scheduledFor, adherenceBefore/After) · `status` text `'new'|'acknowledged'|'resolved'` · `createdAt`/`resolvedAt` null
- Index: `(caregiverUserId, status)`, `(patientUserId)`.

### 8.11 `notifications`
- `id` PK · `userId` FK · `type` text `'upcoming_dose'|'due_dose'|'missed_dose'|'caregiver_alert'|'system'|'insight'|'demo'` · `title` text · `body` text · `entityType` text null (`medication|doseEvent|insight|caregiverAlert`) · `entityId` text null · `readAt` timestamptz null · `createdAt`
- Index: `(userId, readAt)`, `(userId, createdAt desc)`.

### 8.12 `ai_insights`
- `id` PK · `userId` FK · `category` text `'timing_pattern'|'adherence_decline'|'adherence_improvement'|'snooze_pattern'|'medication_difference'|'missed_analysis'|'general'` · `summary` text · `detail` text null · `suggestedActionType` text null (`'review_schedule'|'review_reminders'|'encourage'|'review_caregiver'|null`) · `dataSnapshot` jsonb (input used) · `source` text `'ai'|'fallback'|'demo'` · `confidence` numeric(5,2) null · `createdAt`
- Index: `(userId, createdAt desc)`; keep last 20/user (prune).

### 8.13 `user_preferences` (1:1 users)
- `userId` PK/FK · `theme` text `'light'|'dark'|'system'` default `'light'` · `missedAfterMinutes` int default 30 · `snoozeMinutes` int default 10 · `maxSnoozes` int default 3 · `reminderBeforeMinutes` int default 5 · `notificationPrefs` jsonb `{doseReminders:true, caregiverMissedAlerts:true, insights:true, sounds:true}` · `caregiverAlertPrefs` jsonb `{missedDoseOn:true, adherenceDropThreshold:null, dailyDigest:false}` · `reduceMotion` bool false · `uiDensity` text `'comfortable'|'compact'` default `'comfortable'` · `updatedAt`

### 8.14 `demo_state` (1:1 demo workspace)
- `id` PK · `userId` FK (the demo user) · `simulationNow` timestamptz null (override of "now"; defaults to real now) · `timeMultiplier` int default 1 · `scenario` text `'baseline'|'decline'|'improvement'|'caregiver_demo'` default `'baseline'` · `hasCaregiverDemoData` bool · `updatedAt`
- Non-demo users: no row; demo isolation handled by the dedicated demo user (§10.8).

---

## 9. SHARED CONTRACTS, TYPES & VALIDATION

`src/shared/` holds every cross-layer contract. All are dependency-free (only date-fns where pure).

- `enums.ts`: `DoseStatus`, `MedicationStatus`, `NotificationType`, `CaregiverRelationshipStatus`, `CaregiverAlertType`, `InsightCategory`, `FrequencyLabel`, `TimeBucket`, `ReportGranularity`.
- `constants.ts`: `MISSED_AFTER_DEFAULT=30`, `SNOOZE_MIN_DEFAULT=10`, `MAX_SNOOZES_DEFAULT=3`, `REMINDER_BEFORE_DEFAULT=5`, `DEMO_USER_EMAIL`, `DEMO_PATIENT_*`, `HORIZON_DAYS=14` (dose generation lookahead), `RECENT_INSIGHTS=5`, `HISTORY_PAGE_SIZE`, `TIME_BUCKETS` bounds.
- `types.ts`: DTOs returned by tRPC: `MedicationDTO`, `ScheduleSlotDTO`, `DoseEventDTO`, `DoseActionDTO`, `AdherenceSummaryDTO`, `AdherenceDay`, `StreakSummaryDTO`, `MedicationPerformanceDTO`, `DashboardDTO`, `NotifDTO`, `CaregiverAlertDTO`, `InsightDTO`, `ReportPeriodDTO`, `UserProfileDTO`. Also `TimeRange { from?: Date; to?: Date; range?: '7d'|'30d'|'90d'|custom }`.
- `validations/*.ts` — Zod schemas (names below in §13; all exported for client + server).
- `calc/*.ts` — pure functions (§10).
- `times.ts` — helpers: `localDateKey(date, tz)`, `combineDateAndTime(dateKey, 'HH:mm', tz)`, `bucketOf(hour)`, `rangeByPreset`, `isSameLocalDay`. Uses date-fns v4 timezone (`TZDate`, `formatInTimeZone`).
- `nav.ts` — nav model for the shell.
- `brand.ts` — brand constants.

**DTO discipline:** pages never receive raw row types except through server-owned select mappers inside domain services. No `select *` to the client.

---

## 10. DOMAIN LOGIC SPECIFICATIONS

### 10.1 Medication domain (`server/domain/medications`)
- `listMedications(userId)` → include archived? default returns non-archived + a separate archived bucket for history.
- `getMedication(userId, id)` → medication + slots + derived `frequencyLabel` + `adherenceByMedication` (uses adherence service).
- `createMedication(ctx, input)` → validate → if `daysOfWeek` or times empty, default 1 slot `08:00` daily (per spec: initializing schedule + reminder config). Creates med, its schedule slots, and calls `ensureBackgroundDoseEvents(userId, medId, from=startDate, to=+HORIZON_DAYS)`.
- `updateMedication(ctx, id, input)` → updates allowed fields; if schedule slots changed, diff: void generated future events for removed slots/new times, regenerate for the horizon, recompute adherence for affected days bounds.
- `setStatus(ctx, id, 'active'|'paused')` → pause: void future unresolved events (`status:canceled`), keep history; resume: regenerate future events.
- `archiveMedication(ctx, id)` → soft delete (`archivedAt=now`, status paused); keeps all dose_events/dose_actions/adherence rows → history stays intact.
- Ownership enforced on every operation (`medication.userId === ctx.userId`).

### 10.2 Scheduling & dose-event generation (`server/domain/medicationSchedules`, `shared/calc/schedule.ts`)
- Model: a medication has 1..N `medication_schedules.slots`; each slot `(timeOfDay, daysOfWeek, enabled)`.
- `expandSchedule(med, slots, from, to, tz)` (pure): for each day `d ∈ [from, to]` where `med.startDate ≤ d ≤ (endDate ?? ∞)` and `slots.enabled` and `d.getDay() ∈ slot.daysOfWeek`, emit `{scheduledFor = combine(d, slot.timeOfDay, tz), scheduleId, dosageAmount: slot.dosageAmount ?? med.dosageAmount}`.
- `ensureDoseEvents(ctx, {medicationIds?, from?, to?})`: upsert generated events; unique `(medicationId, scheduledFor)` makes it idempotent. Called on: medication create/update, schedule change, resume, an on-demand "catch-up" inside `reconcile` job, and a periodic server-side job (`src/server/domain/jobs/scheduler.ts` — cron via `setInterval`/Next `unstable_after` hook; NOT a client timer).
- Horizon default: `startDate → today + 14 days`. When "now" passes a day with no generated event inside horizon, extend.
- Paused/expired meds: skip generation; any previously generated future event is voided (`canceled`) by reconcile.

### 10.3 Dose status machine (`shared/calc/doseState.ts` — pure; `server/domain/doseEvents/reconcile.ts` — applies)
Statuses: `upcoming → due → snoozed ⇄ due → missed | taken | skipped`; any unresolved → `canceled` (schedule changes/pause).

Rules (deterministic, timezone-aware, single set used everywhere):
1. `due` iff `status ∈ {upcoming}` and `now ≥ scheduledFor` (once reached it never goes back to upcoming).
2. `missedDeadline` initial = `scheduledFor + missedAfterMinutes`. A dose becomes **missed** when `now > missedDeadline` and `status ∈ {upcoming, due, snoozed}`; `missedAt = missedDeadline` (recorded retroactively for accuracy).
3. `snoozed`: user action only; sets `snoozeUntil = now + snoozeMinutes` (capped so that `snoozeUntil ≤ shared horizon`), `snoozeCount += 1`; updates `missedDeadline = min(missedDeadline, originalMissedDeadline)`? No — **missedDeadline = max(missedDeadline, snoozeUntil + missedAfterMinutes)** (snoozing extends grace). When `now ≥ snoozeUntil` and still not taken → back to `due` (and if `now > missedDeadline` → missed).
4. `take`: allowed from `due|snoozed|upcoming(within window)|missed`? — missed doses **can still be taken** ("taken late") which converts `missed` → `taken` with correct timestamps (audit trails the change); adherence counts the final state. Skipped is disallowed for already-`missed` rows without explicit re-open (kept simple: skip only from due/snoozed).
5. `skip`: allowed from `due|snoozed`; records `skippedAt`, reason optional; terminal.
6. `canceled`: only via pause/schedule-change/void; never counted in adherence; historical `dose_actions` keep a `voided` audit row.
- State transition engine rejects illegal transitions atomically (DB advisory lock or `WHERE status IN (...)` conditional update to prevent double-take): `UPDATE ... SET status='taken' WHERE id=? AND status IN ('due','snoozed','upcoming','missed')`; if 0 rows → idempotent no-op / notify "already taken".

### 10.4 Dose actions (`server/domain/doseActions`)
Each action = one transaction:
- **take**: conditional update (+ takenAt=now) + `dose_actions` row `{action:'take', meta:{fromStatus}}` + notification suppressed (it IS the completion) + `adherence.recomputeDay(userId, localDay)` + dashboard invalidations.
- **snooze**: validate `snoozeCount < maxSnoozes`, set snooze fields, audit row `{action:'snooze', meta:{snoozeUntil, snoozeMin}}`; if `snoozeUntil < now` (already passed) then immediately return to due (loop guard).
- **skip**: confirm in UI; audit `{action:'skip', meta:{reason}}`.
- **missed (auto)**: fired by reconcile when deadline passes; audit `{action:'missed_auto'}` + creates `notifications` (type `missed_dose`) + for active caregivers with permission → `caregiver_alerts` (type `missed_dose`, linked to doseEventId) + caregiver notification. Sends once (guard by checking existing alerts for the dose event).
- **undo/take-late**: reconcile converts missed→taken on user "Take" (audit `take` with prevStatus `missed`); history shows timeline (missed then taken-late).
- All writes are user-scoped; actions apply to owned dose events only (or dose events of an authorized patient for caregivers? no — caregivers only read).

### 10.5 Adherence engine (`shared/calc/adherence.ts` + `streaks.ts` + `performance.ts`; `server/domain/adherence`)
**Formulas (single source of truth, consistent across dashboard/adherence/reports/insights):**
- Period `[from, to]`, scope `user-wide` or `per-medication`:
  - `scheduled = #events in period with status IN (taken, missed, skipped)`
  - `taken/missed/skipped/snoozed(count)` = counts by status (snoozed = events currently snoozed within period window OR total snooze actions? **Definition:** snoozed count = number of resolved/unresolved events that were snoozed at least once in the period, tracked via `snoozeCount>0` events whose current/terminal occurrence fell in period — plus we surface "number of snooze actions" separately where needed).
  - `adherence% = taken / (taken + missed + skipped) × 100` (round to 1 dp). Skipped reduces adherence (matches sample: 76/84 = 90.5% → displayed 90.4/90.5% depending on 1dp rounding; use `Math.round(x*10)/10`).
  - Guard: empty period → `adherence% = null`, UI shows "No data".
- **Streaks:** a calendar day is in-regimen if `scheduled>0`. A day is an *adherent day* if `in-regimen && missed==0 && skipped==0` (not taken doesn't break it while still within grace; future doses pending today don't break it — today counts only once all its doses resolved OR at day end wherever `scheduledFor < now`, else it's "in progress", treated as adherent-so-far for the *current* streak and as full day for *longest* streak only if complete).
  - `currentStreak`: maximum consecutive run of adherent days ending on today **or the most recent in-regimen day ≤ today** (a day with no regimen doesn't break the streak). In-progress today counts toward current streak if adherent-so-far.
  - `longestStreak`: max consecutive adherent-day run in data (complete days only).
  - Sample: 7-day current streak, 90.4% adherence, 84 scheduled / 76 taken / 5 missed / 3 skipped / 8 snoozed — these exact figures drive the demo seed.
- **Trends:** per-day adherence% series (last 7/30/90d), rolling 7-day average, direction (improving/declining/stable using last 7 vs prior 7).
- **Time-of-day patterns:** bucket by `bucketOf(scheduledFor.hour)` in user tz — Morning `<12`, Afternoon `12–17`, Evening `17–21`, Night `≥21`; per bucket `taken/missed/rate`.
- **Medication performance:** per med: adherence%, scheduled/taken/missed/skipped, best/worst time bucket, last taken date.
- `recomputeDay(userId, date, medicationId?)`, `recomputeRange(userId, from, to)` → materialize `adherence_daily`, then `prune` (scope: history window).
- `AdherenceSummaryDTO` = everything above in one shape; dashboard/adherence/reports/insights all build from `adherenceService.summary(...)` to guarantee identical numbers.

### 10.6 Caregiver domain (`server/domain/caregiver`)
- Who invites: the **patient** (patientUserId) invites a caregiver by email/code, or a caregiver requests a code. Simplest robust flow for the demo: patient creates `caregiver_invitations` (email + token + message + selected permissions); caregiver registers/logs-in and redeems the token → `caregiver_relationships` status `active` (auto-accept on redemption) with the invited permissions; patient can revoke (`revoked`) or the caregiver can leave.
- Permissions (jsonb): `{viewAdherence:true, viewMedications:false(future), receiveMissedDoseAlerts:true, receiveInsights:false, canAcknowledgeAlerts:true}`. Patient can edit per relationship. (Leave door open for viewMedications but ship viewAdherence+alerts UI, medications view only if permission true.)
- `requireCaregiverAccess(ctx, patientUserId)`: relationship must be `active`, permission gates as needed. Caregiver tRPC routers are **separate** routers (`caregiver.*`) operating with `ctx.role = 'caregiver'` + `ctx.patientUserId`.
- Alerts: created by dose reconcile (§10.4) when a missed dose matches an active caregiver relationship with `receiveMissedDoseAlerts`. Adherence-drop alerts (optional trigger from demo/job): if `adherenceDropThreshold` set and 7-day rate falls under it, create an adherence_drop alert.
- Caregiver UI: overview (patient's adherence today/7d/30d, current streak, alerts feed), alert detail, preferences, and link to manage/cancel. Never exposes other patients' data.

### 10.7 Notifications domain (`server/domain/notifications`)
- `create(userId, {type,title,body,entityType,entityId})` — single writer.
- Producer interface `NotificationChannel` (extension point: `{ email?, webPush? }`) — currently in-app rows (+ `console` in dev). Designed so a future push/email channel plugs in without touching business logic.
- Consumers: reconcile (due/missed), caregiver (alert), insights (insight-ready), system (demo/settings). 
- List: unread first, paginated (cursor), `markRead(id)`, `markAllRead`, `unreadCount`.
- Preferences from `user_preferences.notificationPrefs` gate creation (e.g., dose reminders off → no due notifications).

### 10.8 Demo domain (`server/domain/demo`)
- A dedicated seeded **demo user** (`isDemo=true`, email `demo@medvault.demo`, password random) owns all demo data → **isolation by userId is automatic**; real users' data is never mixed.
- `/demo` entry (from marketing or logged-out banner): `demo.enter` tRPC → issues a scoped cookie `medvault_demo_session` (random token stored server-side or a short-lived JWT) that the `(demo)` layout uses to present the demo user's data. Real session is untouched. Leaving `/demo` clears the cookie. If an authenticated user enters, they keep their own session; demo data still isolated under the demo user.
- Seed (`server/db/demo-seed.ts`) reproduces the sample dataset exactly (§19): Arun Kumar profile, 4 medications with the given schedules, and dose events spanning ~12 weeks such that totals = 84 scheduled / 76 taken / 5 missed / 3 skipped / 8 snoozed, 7-day streak, 90.4–90.5% adherence, including afternoon-miss pattern for the AI insight and a snoozed-every-morning pattern.
- Simulation controls (all go through real domain services so state stays coherent):
  - `simulate.action(doseId or nextDue, 'take'|'miss'|'skip'|'snooze')` — maps to take/skip/snooze or directly marks missed.
  - `generate.adherenceChange(scenario)` — seeds a block of taken/missed rows for the last 14 days to move charts (baseline/decline/improvement).
  - `generate.caregiverAlert()` — creates a caregiver relationship to a demo caregiver user + a missed dose under it → real alert.
  - `generate.aiInsight()` — runs insights service over demo data.
  - `setTime(now?)` — writes `demo_state.simulationNow`; all demo reads use `demoNow()` instead of real now (schedule/dashboard/adherence respond live).
  - `reset()` — transactionally wipes demo-owned rows and reseeds.
- UI: `/demo` shows the demo shell (same `(app)` components) with a floating "Simulate" dock + demo clock, and a prominent "This is demo data — enter real app" banner.

### 10.9 Reports domain (`server/domain/reports`)
- Builds exclusively from `adherenceService` (same formulas). 
- Support: daily summary (per date), weekly summary (ISO week), monthly summary, medication-specific, missed-dose analysis (per med/day/bucket counts), taken/skipped/missed breakdown, adherence trend series.
- Output DTO `ReportDTO { granularity, from, to, table: rows[], trend: [{label, adherence, taken, missed, skipped}] }`.
- CSV export: server route `GET /api/reports/export?from&to&granularity` (authenticated): generates CSV from the same service, streams as attachment. Deterministic column order.

### 10.10 AI insights domain (`server/domain/insights`)
- **Input snapshot** (`InsightInput`, jsonb-able): last 30 days: per-day `{date, scheduled, taken, missed, skipped, snoozed, adherencePercent}`, per-medication `{name, adherencePercent, taken, missed, skipped}`, time-bucket rates, current/longest streak, rolling trends, recent snooze action counts.
- **Service:** `buildSnapshot(userId)` (from adherence service) → `generateInsights(ctx)`:
  1. Try AI: system prompt (fixed, in code): role = adherence coach; explicitly "Do not diagnose, do not prescribe, do not recommend changing medication/dose; only behavioral observations and encouragement; if lacking data, say so." Input = JSON snapshot. Call provider-agnostic `ai.generateText`/`streamText` with structured output (tool/JSON schema). 
  2. Parse + validate with `InsightResponseSchema` (zod): `{ insights: [{ category, summary, detail?, suggestedActionType? }], tone: 'neutral'|'encouraging' }`.
  3. On parse/LLM failure → deterministic **fallback generator** (rule engine over the snapshot: highest-miss bucket, declining 7d avg, streak, snooze rate) → `source:'fallback'` so the UI can note "generated from data".
  4. Persist top 3–5 rows to `ai_insights`; prune to latest 20. Never writes to medications/schedules/dose_events — verified by type boundaries + a unit test.
- Cache: dashboard shows latest insight(s); explicit "Regenerate" button (authed) re-runs; results stored so history is stable. Loading = skeleton insight cards; failure = fallback insight with "offline mode" note; empty = "Add medications and take a few doses to unlock insights".
- UI surfaces: `/insights` (list + regenerate), dashboard widget (latest 1–2), notifications type `insight`.

### 10.11 Settings domain (`server/domain/settings`)
- `getProfile/updateProfile` (name, email (validated unique), timezone).
- `getReminderSettings/updateReminderSettings` → writes `user_preferences` + per-medication `remindersEnabled` bulk toggle.
- Caregiver settings: list relationships, revoke, change permissions.
- Appearance: `theme`, `reduceMotion`, `uiDensity`.
- Data: `dataOverview` (counts: medications, dose events, actions, insights), `exportCsv(scope)` (meds + events), `deleteAllData` (transactional wipe of all user-owned rows, keep account), `requestAccountDeletion` (wipes everything incl. auth rows). All destructive ops require typed confirmation + reconfirm.

---

## 11. ROUTE-BY-ROUTE SPECIFICATION

Legend: **Auth**: anon / user / caregiver (own patient scope) / demo. **States** follow §15. All authenticated routes live in the `(app)` shell (§7) unless noted.

### 11.1 Marketing `/`
- Purpose: Stitch landing page ported to Next (nav, hero, how-it-works, features, trust, CTA, footer, AI chat FAB decorative). Not on the auth checklist, but shipped so the product has the exact entry the design demands and to prove the design system.
- Data: static + public assets (ported images). Actions: `Log In` → `/login`, `Create Vault` → `/register`, `Watch Demo` → `/demo`. Anonymous. Loading: none (static SSR). Empty/error: image fallbacks.

### 11.2 `/login` · `/register` (auth group, no app shell)
- Purpose: email/password auth using the Stitch auth composition (left image panel ≥900px, right form; logo; headlines "Welcome back."/"Initialize your vault."; inputs §5.4; emerald primary button w/ arrow; Google button shown but **disabled with "coming soon"** tooltip unless provider configured; "Remember me" checkbox; toggle link between modes; back button → `/`).
- Data: session redirect. Actions: sign-in/sign-up → redirect `/onboarding` (if not completed) else `/dashboard`. States: busy button, error alert (invalid credentials, email exists, invalid email/password per schema), preserved input on failure. Responsive: left panel hidden <900px; form centers. Auth: anonymous only (redirect authed users away).

### 11.3 `/onboarding` (auth group)
- Purpose: collect/confirm profile + defaults: timezone, reminder defaults (missedAfterMinutes, snoozeMinutes, maxSnoozes), toggle sample-data quick start ("Add a sample medication" using Metformin 500mg twice daily), finish.
- Data: `user_preferences` default create. Actions: save → `onboardingCompleted=true` → `/dashboard`.
- States: step indicator (Stitch ghost/pill style), per-step validation, loading, error alert. Auth: user, `!onboardingCompleted`.

### 11.4 `/dashboard`
- Purpose: immediate "what do I take now?" + "how am I doing?".
- Layout (priority order): 
  1. **Hero action block** (emerald-tinted glass card, floating motif): next/current dose card (DoseCard) with Take/Snooze/Skip → links `/schedule/[doseId]`; when none: "All caught up" empty state.
  2. **Stat rail** (StatCards): today's adherence, current streak, next dose time, missed today.
  3. **Today's schedule feed** (SectionLabel "Today's Schedule ›" + ListRows), link `/schedule`.
  4. **7-day adherence trend** (Recharts area chart, palette §5).
  5. **Medication summary** (mini list w/ status chips) → `/medications`.
  6. **AI insight summary** (latest insight glass card + "View insights") → `/insights`.
  7. **Caregiver status** (connected caregivers / alerts count) → `/caregiver`.
  8. **Quick actions**: Add medication, View schedule, View reports.
- Data: `dashboard.get` (one tRPC call returning DashboardDTO; composed via dashboardService aggregating §10 services). Actions: dose actions (via dose router), nav. Auth: user or caregiver (caregiver scope = patient's dashboard minus mutating actions → "caregiver read-only" variant). States: skeletons matching layout; empty = no meds → onboarding-style CTA "Add your first medication" (`/medications/new`); no doses today → "No doses scheduled today" + link; due dose → pulsing primary ring; missed → red banner; all completed → green "All caught up"; error → ErrorState with retry. Responsive: hero to full-width, stat rail wraps to 2-col, chart full-width.

### 11.5 `/medications` (list)
- Purpose: all active medications (cards/list). Each MedicationCard: colored avatar chip (assigned `color`), name, dosage (e.g., "500 mg"), frequency label, status chip, next dose time, per-med adherence%, count/actions.
- Data: `medication.list` (+ next dose + perf joined). Actions: open detail, add (`/medications/new`), pause/resume quick toggle, search/filter (active/archived). Empty: friendly empty state + CTA. Loading: card skeletons. Error: ErrorState. Auth: user.

### 11.6 `/medications/new` · `/medications/[id]` · `/medications/[id]/edit`
- New (step form, Stitch-styled): Step 1 Basics — name, dosage amount + unit (select w/ common units mg/mcg/g/IU/tablet/ml/units + custom), instructions, notes. Step 2 Schedule — frequency builder: presets (Once daily / Twice daily / Custom weekdays) + per-day time pickers (TimePicker, local HH:mm), days-of-week chips, start date (date default today), end date optional. Step 3 Reminders — remindersEnabled, reminderBeforeMinutes. Step 4 Review + Submit.
- Detail: header card (name/dosage/status/avatar), status toggle (active/paused), stats (overall + this med adherence%, streak, scheduled), schedule slots list, dose history preview (last 10 via history service), actions: Edit, Pause/Resume, Archive (destructive dialog: "Historical records will be preserved"), Delete-archive note.
- Edit: same form, prefilled; schedule diff rules (§10.1).
- Data: `medication.create/update/get/setStatus/archive`. States: form loading (skeleton), submit busy, server-error alert (conflict/duplicate name), success → toast + redirect detail; invalid ID → notFound(); archived med → read-only banner.
- Auth: user (owner only).

### 11.7 `/schedule` (Today's Schedule) · `/schedule/[doseId]`
- Purpose: the day's dose timeline answering "now". 
- Content: date selector (today / tomorrow), grouped by status: **Due Now** (pulsing primary section), **Upcoming**, **Snoozed** (amber, countdown to snoozeUntil), **Completed** (collapsed green), **Missed** (red, incl. "missed — take late" affordance). Each DoseCard: name, dosage, time, med color chip, status chip+icon, actions Take/Snooze/Skip.
- `/schedule/[doseId]`: detail modal page — full event info (med, scheduled time, status, takenAt/skippedAt/reason, snooze history from dose_actions, miss deadline), Take/Snooze/Skip buttons (contextually), link to medication.
- Data: `schedule.day(date)` (reconciled + ensured), `dose.get`. Actions: dose router. States: loading row skeletons; empty day ("No doses today" + link); errors; invalid id → notFound; stale/demo time indicator. Auth: user.
- Never relies on client timers: reconcile runs server-side; client only refetches on focus/visibility + after actions.

### 11.8 `/adherence` · `/adherence/medications`
- `/adherence`: range selector (7/30/90d + custom), stat rail (adherence%, taken/missed/skipped/snoozed/scheduled, current + longest streak), trend chart (area/bar), time-of-day pattern bars (Morning/Afternoon/Evening/Night), missed-dose calendar heat strip. Uses shared `AdherenceSummaryDTO`.
- `/adherence/medications`: per-medication table: med, frequency, scheduled/taken/missed/skipped, adherence%, best bucket, trend mini-sparkline; row → detail.
- Auth: user; caregiver (read-only view of their patient via caregiver scope).

### 11.9 `/insights`
- Purpose: AI behavioral insights list + regenerate. Cards = glass/insight motif, category chip, source tag ("AI" vs "From your data" fallback), suggested action link buttons (e.g., "Review reminder times") that navigate (settings/demo) — AI never mutates. Show data-window note ("Based on last 30 days"). Loading skeleton, empty state with prerequisites, error with retry + fallback indicator.

### 11.10 `/history`
- Purpose: trustworthy record of dose activity. Filters: date range, medication, status (taken/missed/skipped/snoozed/skippedReason). Entry = DoseActionDTO row (ListRow motif): "Took 500 mg Metformin — 8:02 AM" + meta (reason, snooze history, "was missed" badge for take-late). Grouped by day; archived meds render with "archived" tag and stable name snapshot. Pagination (cursor). Preserved even if medication later paused/archived (soft-delete guarantee). Data: `history.query`. States: filter skeleton/empty ("No activity in this range"), error.

### 11.11 `/reports`
- Purpose: adherence reports from real data. Controls: granularity (daily/weekly/monthly), range (7/30/90/custom), scope (all / per medication). Output: summary stat cards, breakdown table, trend chart, missed-dose analysis table, "Download CSV" button → `/api/reports/export?...`. Same `ReportDTO` pipeline as dashboard data.

### 11.12 `/caregiver` (patient view) · caregiver-mode views
- Patient view: relationship list (caregiver avatar, relation, status, permissions toggle), invite form (email + message + permission checkboxes + expiry), pending invitations (copy token? use email+code display), alert preferences, revoked history. Actions: invite (→ creates invitation), revoke, update permissions, acknowledge/resolve alert feed (caregiver alerts received from me? no — the alerts list here is what caregivers saw? Keep separate: patient sees "Alerts sent" history).
- Caregiver mode (session has active relationship): `/caregiver` becomes patient overview — adherence today/7/30d, streak, alerts feed (missed/alerts), alert detail `/caregiver/alerts/[id]` (acknowledge/resolve), manage/cancel link. Authorization: `requireCaregiverAccess` on every query.
- `/caregiver/alerts/[id]`: alert detail — patient snapshot, medication, scheduled time, status timeline, acknowledge/resolve actions.

### 11.13 `/notifications`
- Purpose: notification center. List grouped by day, unread dots, mark all read, per-row link by entityType. Bell shows unread count; clicking bell toggles dropdown (recent 5) linking here. Tabs: All/Dose/Caregiver/AI/System. Empty state "You're all caught up". Auth: user (caregiver sees their own notifications incl. caregiver_alert type).

### 11.14 Settings (`/settings/*`)
Shared settings layout: left vertical menu (Stitch ghost/nav-link style) + content area.
- `/settings/profile`: name, email, timezone; save (RHF+Zod, email uniqueness server-side); danger zone: logout-all-sessions? (skip), account deletion (typed confirm).
- `/settings/reminders`: global missedAfterMinutes, snoozeMinutes, maxSnoozes, reminderBeforeMinutes (number inputs w/ steppers + presets), notificationPrefs toggles, per-medication reminders table (toggle remindersEnabled), sound toggle.
- `/settings/caregiver`: same patient-side caregiver management as §11.12 (reused component), plus caregiver-alert prefs (equally on patient: who is notified + frequency).
- `/settings/appearance`: theme radio (light/dark/system), density, reduceMotion toggle; instant preview on the sample card; persists via user_preferences.
- `/settings/data`: data overview counts, export CSV (all meds+events), "Delete all data" (danger, typed confirm, transactional), privacy notes; cannot delete demo-owned data from real account (demo isolated).

### 11.15 `/help` (no auth shell — or public under shell? Make it authenticated + marketing both)
- Purpose: how-to cards, FAQ accordions (Stitch cards + pills), links to settings/demo; and the "MedVault AI" FAB becomes a link to this page with a note that AI here is informational. Reuse the marketing footer style.
- Data: static content in `src/features/help/help-content.ts`. Auth: accessible to all (public page under `(marketing)` or standalone); keep under `(app)` when logged in via shell too — implement as two lightweight routes sharing a component.

### 11.16 `/demo`
- Purpose: one-click live demonstration (§10.8). Loads demo shell with banner + simulation dock (floating, bottom-right): buttons (Simulate taken, missed, skipped, snoozed; Apply scenario; Generate caregiver alert; Generate AI insight; Reset demo; Time slider) + demo clock. Runs the real app pages (dashboard/schedule/etc. reused) bound to demo context.

---

## 12. STATUS SYSTEM (single source: `shared/enums.ts` + `components/ui/status-*`)

| Status | Color | Tint badge | Icon | Label pattern |
|---|---|---|---|---|
| Taken | `#10b981` | `#d1fae5` | `CheckCircle2` | "Taken · 8:02 AM" |
| Upcoming | `#3b82f6` | `#dbeafe` | `Clock` | "Upcoming · 8:00 AM" |
| Due Now | `#10b981` (pulse ring `rgba(16,185,129,0.4)`) | `#d1fae5` | `BellRing` | "Due now" |
| Missed | `#ef4444` | `#fee2e2` | `AlertCircle` | "Missed" |
| Skipped | `#94a3b8` | `#f1f5f9` | `XCircle`/`MinusCircle` | "Skipped · reason" |
| Snoozed | `#f59e0b` | `#fef3c7` | `AlarmClock` | "Snoozed · 10 min" |
| Paused (med) | `#64748b` | `#e2e8f0` | `PauseCircle` | "Paused" |
| Canceled/void | `#94a3b8` | `#f8fafc` | `Ban` | "Canceled" |

- Never color-only: each badge includes icon + text + `aria-label` ("Status: Missed, scheduled 8:00 AM"). `StatusIndicator` component renders all; a test asserts icon+text+label are always present.

---

## 13. FORMS & VALIDATION REQUIREMENTS

Every form = React Hook Form + Zod resolver + shared schema. Both client (instant) and server (authoritative) validation. Fields, messages, and error placement defined per schema. Shared schemas in `src/shared/validations/`:

- `auth.ts`: `registerSchema` {name ≥2, email, password ≥8 with letter+number}, `loginSchema` {email, password, rememberMe}.
- `onboardingSchema`: {timezone, missedAfterMinutes 5–120, snoozeMinutes 1–60, maxSnoozes 0–10, reminderBeforeMinutes 0–60, addSampleMed: boolean}.
- `medicationSchema`: {name 1–100 (trim, no control chars), dosageAmount > 0 ≤ 100000, dosageUnit from set + custom ≤ 20, instructions ≤ 500 nullable, notes ≤ 1000 nullable, status enum, startDate valid date ≤ endDate?, endDate nullable > startDate, color auto, remindersEnabled bool, reminderBeforeMinutes 0–120}.
- `scheduleSchema`: slots min 1 max 6 per med (times local HH:mm valid 00:00–23:59, unique per daysOfWeek-set, each daysOfWeek non-empty subset of 0–6, no duplicate (time,dayset) pair).
- `doseActionSchema`: {doseId uuid, action enum take|snooze|skip, skipReason ≤ 200 when skip}.
- `caregiverSchema`: invite {email, message ≤ 300, permissions obj, relationType}, accept {token}, updatePermissions {relationshipId, permissions}, revoke {relationshipId}.
- `settingsSchema`: profile {name, email, timezone from IANA list}, reminders (numbers within ranges), appearance {theme, density, reduceMotion}.
- `reportsSchema`: {granularity, from, to (from ≤ to, span ≤ 366d, to ≤ today+1), medicationId?}.
- `helpFeedbackSchema` (optional).

UI form contract: labels §5.2, error text `12–13px` `#ef4444` with alert role for summary; submitting state disables; success toast (emerald check); recoverable server errors preserve `formState` (defaultValues retained); destructive forms in ConfirmationDialog with typed confirm text when severity high (delete data, revoke caregiver, archive med = medium).

---

## 14. AUTHENTICATION & AUTHORIZATION

- **Better Auth** (email/password, Drizzle adapter). Server instance `server/auth/server.ts` with session cookie (secure in prod); handler at `app/api/auth/[...all]/route.ts`.
- **Client** `lib/auth-client.ts` (`better-auth/react`) for sign-in/sign-up/sign-out/session in auth forms; session cache.
- **Route protection**: `(app)` layout = server component → `requireUser()` (redirect `/login?next=…`, expired session → login with notice); `(auth)`/login pages redirect authed users away; `(demo)` layout uses `requireDemoContext()`.
- **tRPC context** (`server/trpc/context.ts`): resolves auth via Better Auth `getSession(headers)`; exposes `{ user, session, db }`. Base `protectedProcedure` (authed) and merge-ins: `caregiverProcedure` (authed caregiver w/ active relationship), `patientOf(val)` helper verifying ownership. Every sensitive procedure ends by enforcing the entity's `userId`.
- Separation: **authentication** (who you are), **authorization** (role/ownership gates above), **UI visibility** (client `useSession`/hooks render controls only when allowed; e.g., caregiver read-only hides action buttons — but server still denies).

---

## 15. LOADING / EMPTY / ERROR / SUCCESS STATE CONTRACT

- **Loading**: layout-matching skeletons (`components/ui/skeleton.tsx`). Feature pages: list→card skeletons; tables→row skeletons; dashboard→section skeletons.
- **Empty**: icon (tinted chip, e.g., `Pill`/`CalendarX2`), title, explanation, single clear CTA (primary pill). Empty keys per feature (no meds, no doses today, no history, no notifications, no insights, no caregivers, no data to report).
- **Error**: human message + retry (refetch) + "go back" when route context. Global ErrorBoundary per route group (`error.tsx`) and `not-found.tsx` (branded 404). API errors surface via tRPC error messages shown in `Alert`.
- **Success**: toast (sonner, emerald check) + updated cache; destructive actions show confirm + success toast; forms show inline success when appropriate.
- **Special**: invalid IDs → notFound (404); deleted/archived entity → readable notice + link; unauthorized → 403 page/message; expired session → login redirect; duplicate action (double-tap take) → idempotent second response "Already taken"; network/db failure → distinct alert that retry is safe; AI failure → fallback insight (source tag).

---

## 16. RESPONSIVE BEHAVIOR CONTRACT

Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280` (Tailwind default). Behavior per surface:
- **Sidebar** (shell): `≥lg` persistent; `md–lg` collapsible w/ drawer overlay + backdrop; `<md` hidden → bottom nav.
- **Top header**: full at ≥md; compact (logo + bell + avatar only) < md.
- **Bottom nav** (<md): 4 items (Home/Schedule/Add/More) — home active w/ Stitch dot; Add opens `/medications/new` via center prominent icon; More = sheet w/ full nav list.
- **Cards**: dashboard hero full-width; stat rail `1/2/4` cols (mobile 2, desktop 4); section grids collapse to 1 col; medication list stays single-column list.
- **Tables**: horizontal scroll wrapper (`overflow-x-auto`, min-w) at <md; history/caregiver tables degrade to card-list.
- **Charts**: Recharts `ResponsiveContainer`, min-height ~240px; tap-through tooltips.
- **Forms**: single column < lg; two-col rows ≥ lg; TimePicker/DatePicker use native inputs on mobile, custom popover on desktop.
- **Modals**: centered dialog on desktop, **bottom sheet** (drawer) on mobile (Radix Dialog + responsive transform).
- **Auth**: left image panel hidden <900px; form max-w 460 centered.
- **Tables of reports**: summary stat cards stack; export button always reachable.

---

## 17. SECURITY & DATA INTEGRITY

- Auth sessions enforced server-side (all tRPC behind `protectedProcedure`); ownership checks on every entity read/write; caregivers constrained by `requireCaregiverAccess(patientId)` + permission checks.
- Input validation: Zod on both ends; no client-constructed SQL; Drizzle parameterized queries only; no raw SQL from client strings.
- Dose double-action protection: conditional `UPDATE ... WHERE status IN(allowable)` → zero-row = idempotent; transactions (take, snooze, skip, reconcile, demo.reset) wrap multiple writes.
- Consistent timestamps: server `now()` (demo: `demoNow()`) captured once per tRPC request; never trust client clock for state.
- Reliable transitions: deterministic reconcile vs. `missedDeadline`; status machine central in `shared/calc/doseState.ts`; tests cover illegal transitions.
- Secrets: env only (`BETTER_AUTH_SECRET`, `DATABASE_URL`, AI keys); never logged; `next.config` env-d interaction; `.env.example` committed, `.env` gitignored.
- Caregiver boundary tests ensure no cross-patient leakage (query must always filter `caregiverUserId` or `patientUserId` from ctx).
- Logging: `lib/log.ts` redacts emails beyond `a***@domain`, no PHI detail in logs.
- Rate/safety: invite token one-time; demo token short-lived; CSRF handled by same-site cookies; headers hardened (Next defaults + CSP where practical).

---

## 18. TESTING STRATEGY

- **Unit (Vitest, node env)** for all `shared/calc/` purity: adherence formulas (incl. the exact 76/84=90.5% case), streaks (7-day sample), dose status transitions (every legal/illegal transition), missed-deadline math incl. snooze-deadline extension, schedule expansion (once/twice/custom weekdays/start-end/boundaries), snooze limits and snooze-until-return, medication performance + time-bucket counts, insight fallback generator, report aggregation sums, demo scenario generation invariants (totals preserved).
- **Component (Vitest+jsdom+RTL)**: medication form (validation errors, submit busy, success), dose actions (take/snooze/skip flows, idempotent disable), MedicationCard/DoseCard rendering + status chips (icon+label assertions), ConfirmationDialog, filters (history), dashboard quick-action presence, notification bell counter, settings toggles, empty/error/skeleton states.
- **E2E (Playwright, chromium)**: register → onboarding → create med → create schedule → today's schedule lists dose → take → dashboard reflects → history row appears; snooze flow; skip flow w/ reason; missed transition (inject time via demo clock + fake scheduler); adherence page numbers match dashboard; caregiver invite→register caregiver→accept→see alert from real missed dose; reports generate + CSV download; demo mode (enter, simulate each action, reset, isolation check that real user data unchanged); login guard (unauthed → redirect).
- Fixtures: seeded DB per test (transactional rollback) + demo seed reuse; `pnpm test`, `pnpm test:e2e`, coverage thresholds on calc modules.

---

## 19. SAMPLE DATA (Arun Kumar — used verbatim in all demo/dev seeding)

Patient: **Arun Kumar**. Medications:
1. **Metformin 500 mg** — twice daily (08:00, 20:00, daily)
2. **Vitamin D 1000 IU** — once daily (10:00)
3. **Aspirin 75 mg** — once daily (08:00)
4. **Vitamin B12 500 mcg** — once daily (09:00)

Adherence target (constructed exactly in the seed):
- 84 scheduled · 76 taken · 5 missed · 3 skipped · 8 snoozed
- Adherence 90.5% → displayed 90.4–90.5% (1dp); 7-day current streak
- Patterns: misses concentrated in the afternoon bucket (Metformin 20:00 mostly missed → fuels "repeated missed evening doses" AI insight); Vitamin D frequently snoozed (morning snooze pattern); recent 7 days perfect (streak).
- `adherence_daily` rows seeded to match; `ai_insights` pre-seeded 3 rows (source `demo`) so demo shows insights instantly.

---

## 20. CROSS-FEATURE DATA PROPAGATION MATRIX (must be true in all phases)

| Originating action | Must update |
|---|---|
| Medication created | list, detail, schedule (dose events generated), dashboard, adherence (now scheduled), reports, insight input, notifications horizon |
| Medication paused/archived | list badge, detail banner, future dose events voided, dashboard/schedule clean, history preserved w/ "archived" tag, adherence/reports unchanged (historical kept) |
| Schedule slot added/removed | dose events regenerated (void removed, add new), schedule page, dashboard next-dose, adherence recompute for affected days |
| Dose Taken | dose status, schedule page, dashboard (next dose, stats, streak), adherence day, history (audit), medication perf, reports, insights snapshot using fresh data |
| Dose Missed (auto) | status, notifications, caregiver alert (if enabled), dashboard banner, adherence, history |
| Dose Snoozed | status, snooze history (audit), dashboard countdown, notifications suppressed |
| Caregiver alert | originates from missed dose; appears in caregiver alerts + caregiver notification + patient "sent" view |

The contract: every mutation happens through the domain service that owns the cross-cutting fan-out (§10), never hand-rolled in a page.

---

## 21. IMPLEMENTATION PHASES

Each phase is independently executable. **Definition of done** for a phase: code compiles (`pnpm typecheck`), lints (`pnpm lint`), relevant tests pass, moved `DoD` checklist items verified, no `console.error`-style dead code, no commented-out browse; where a phase creates UI, it must match §5 tokens/recipes. Phases 01–05 may be partially parallel. All new files follow the directory layout §4.1. Shared rules: always import shared contracts; never duplicate business logic; every page handles §15 states; every procedure is authed+owned.

---

### Phase 01 — Repository & Stitch analysis (inventory, design-token extraction, route map)

- **Objective:** Complete, verified inventory of the Stitch export; extract the design tokens/recipes into §5; confirm screen→route map (§6).
- **Why:** Guarantees the build is based on the real design; prevents re-inventing UI decisions.
- **Dependencies:** none.
- **Files:** `plan.md` (this document — finalize §2,§5,§6); `docs/stitch-analysis.md` (inventory checklist + per-file notes + port list). No `Landingpage/` changes.
- **Details:** Enumerate every file; identify that `index.css`/`App.css`/`favicon.svg`/`icons.svg` are leftover templates (ignored); mark which JSX files are ported (App.jsx sections, HeroVisual, FloatingCard, mobile.jsx, MedVaultPhoneSection, MedVaultAuthIllustration) and which are reference-only.
- **DB:** none.
- **Routes:** none.
- **Components:** none.
- **Business logic:** none.
- **Validation:** none.
- **State/flow:** none.
- **States:** none.
- **Responsive:** capture breakpoint facts (nav hides center links <768, auth hides image <900, phone-mockup reserved for large hero).
- **Security:** none.
- **Testing:** assert that the token dump in §5 matches source (spot-check hex values).
- **Acceptance:** §5–§6 accurately describe the export; port list exists with exact source paths.
- **DoD:** docs/stitch-analysis.md written; §5/§6 finalized.

### Phase 02 — Project foundation (Next.js + TS + Tailwind + tooling)

- **Objective:** Working Next.js App Router app at repo root with pnpm, strict TS, Tailwind v4, shadcn/ui init, ESLint/Prettier, Vitest, Playwright, env scaffolding.
- **Why:** Provides the verified base every later phase compiles against.
- **Dependencies:** Phase 01 (folder choices).
- **Files:** root `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `drizzle.config.ts`, `.env.example`, `.gitignore` (add `node_modules`, `.next`, `.env*`, `e2e-report`), minimal `src/app/layout.tsx`, `src/app/globals.css` (Tailwind import), `src/app/page.tsx` placeholder, `components.json`, `src/lib/utils.ts` (`cn`).
- **Details:** Next 15 + React 19; `next/font/google` Plus Jakarta Sans wired in root layout; paths `@/* → ./src/*`, `@shared/*`, `@server/*`, `@features/*`, `@components/*`, `@lib/*`, `@db/*` via tsconfig; shadcn CLI; Vitest with jsdom + `@testing-library/react`/`jest-dom`, coverage on `src/shared/calc`; Playwright chromium project; scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:push`, `db:seed`.
- **DB:** none yet (config ready).
- **Routes:** placeholder `/`.
- **Components:** `ui/button.tsx`, `ui/input.tsx` scaffolds (shadcn, unstyled-custom next phase).
- **Business logic:** none.
- **Validation:** none.
- **State/flow:** none.
- **States:** none.
- **Responsive:** Tailwind defaults + breakpoint constants doc.
- **Security:** `.env.example` documents all secrets; strict TS; no analytics.
- **Testing:** toolchain smoke: an example component test + one e2e hitting `/`.
- **Acceptance:** `pnpm dev` runs; `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint` all pass; font loads.
- **DoD:** clean build; CI-able commands verified.

### Phase 03 — Design system implementation (Stitch tokens → Tailwind theme + primitives)

- **Objective:** Turn §5 into `globals.css` `@theme` tokens + implement the Stitch-styled UI primitives.
- **Why:** All subsequent UI phases must consume the identical, centrally-defined visual language.
- **Dependencies:** Phase 02 (toolchain), Phase 01 (tokens).
- **Files:** `src/app/globals.css` (colors, radii, shadows, fonts, scrollbar, focus rings, `~` theme); `src/lib/token-doc.ts` (machine-readable token map used by tests); brand assets: `src/components/brand/Logo.tsx`, `Wordmark.tsx`, `Brand.tsx`; `src/shared/brand.ts`; primitives in `src/components/ui/`: `button.tsx` (Primary/Ghost/Text/Icon variants), `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `label.tsx`, `badge.tsx`, `status-badge.tsx`, `chip.tsx`, `card.tsx`, `separator.tsx`, `avatar.tsx`, `tooltip.tsx`, `dialog.tsx`, `drawer.tsx` (mobile sheet), `dropdown-menu.tsx`, `popover.tsx`, `tabs.tsx`, `sonner.tsx` (toast), `alert.tsx`, `skeleton.tsx`, `empty-state.tsx`, `error-state.tsx`, `pagination.tsx`, `form-field.tsx` (RHF wrapper), `time-picker.tsx`, `date-picker.tsx` (native+popover dual), `stat-card.tsx`, `section-label.tsx`, `list-row.tsx`, `status-indicator.tsx` (§12), `confirmation-dialog.tsx`.
- **Details:** every primitive styled from §5.4/§5.5; shadcn behavior retained (Radix a11y), visuals replaced; two example screens (a "medication card" story + a "list row" story) rendered in Storybook-lite (`/design-system` dev page under `src/app/(marketing)/design-system/page.tsx`) to inspect primitives.
- **DB:** none.
- **Routes:** `/design-system` (dev-only, also serves as the spec page).
- **Components:** the full `ui/` catalog + `brand/*`.
- **Business logic:** none.
- **Validation:** none.
- **State/flow:** `Brand`/status/theme contexts scaffolded (client).
- **States:** Empty/Error/Loading primitives render-tested.
- **Responsive:** primitives accept intent-based `size` props; mobile variants (drawer vs dialog) in component, not page.
- **Security:** none.
- **Testing:** token test (global CSS var definitions match §5 hex), status-indicator test (icon+text+aria for all statuses), primitive a11y smoke.
- **Acceptance:** design-system page shows all primitives matching Stitch recipes; screenshot-adjacent checks by humans.
- **DoD:** tokens single-sourced; no inline magic colors in feature code going forward (lint rule: disallow hardcoded brand hex in `src/features`).

### Phase 04 — Landing page migration (`/` from Stitch)

- **Objective:** Port the Stitch landing page into Next as `(marketing)` using the Phase 03 system.
- **Why:** Ships the entry experience the design demands; exercises the design system end-to-end early; keeps `Landingpage/` as reference only.
- **Dependencies:** Phases 02, 03.
- **Files:** `src/app/(marketing)/layout.tsx`, `page.tsx`, `components/` under `src/features/landing/`: `Nav.tsx`, `Hero.tsx`, `HeroVisual.tsx` (private), `FloatingCard.tsx`, `HowItWorks.tsx`, `Features.tsx` (3 blocks incl. `FeatureSmartReminders`, `FeatureFindCare` reuse of motifs), `Testimonials.tsx`, `FinalCta.tsx`, `Footer.tsx`, `ScrollingServices.tsx`; port `public/` assets (favicon brand tile, images); `mascots` ported as TSX (Doctor/Robot/Nurse SVG) with `@keyframes float`.
- **Details:** convert inline-style JSX to the token/class system where practical but **keep the visual identical**; replace `#auth` hand-rolled view-switch with Next `<Link>`s (`/login`, `/register`, `/demo`); AI chat FAB becomes a real link to `/help`; `Watch Demo` → `/demo`. Bundle-split heavy hero visuals (`next/dynamic`, no SSR for framer-motion pieces where needed).
- **DB:** none.
- **Routes:** `/`.
- **Components:** landing feature components; reuse `Brand`, buttons, section-label, glass card recipe.
- **Business logic:** none.
- **Validation:** none.
- **State/flow:** `useInView` scroll reveals (kept from Stitch).
- **States:** image `onError` fallbacks; SEO metadata + OG (MediTrack AI · MedVault).
- **Responsive:** preserve Stitch 768/1024 behaviors (nav hides center links, hero wraps, grids collapse; phone-mockup hidden or scaled on small).
- **Security:** no user input; external font already bundled by next/font (no remote `@import`).
- **Testing:** `getByRole` smoke (nav, CTAs present); e2e: `/` → click "Create Vault" → lands `/register`.
- **Acceptance:** `/` visually matches `Landingpage` default route (screenshots compared by human).
- **DoD:** port complete; no `Landingpage/` import at runtime; lighthouse passes basic a11y/CLS.

### Phase 05 — Database foundation (Drizzle schema + client + migrate + seed)

- **Objective:** Implement §8 schema fully, Drizzle client, migrations, and healthy apps.
- **Why:** Every domain service in later phases depends on a real, migrated, owned-schema database.
- **Dependencies:** Phase 02 (env/tooling).
- **Files:** `src/server/db/client.ts`, `schema.ts` (all §8 tables incl. Better Auth tables), `drizzle.config.ts`, `drizzle/` migrations, `src/server/db/seed.ts` (dev: 2 normal users + helper), `src/server/db/demo-seed.ts` (Arun Kumar §19), `src/server/db/helpers.ts` (uuidv7, safe upsert); add `pg`, `drizzle-orm`, `drizzle-kit` deps.
- **Details:** Better Auth adapter table columns must match `better-auth/drizzle`; `adherence_daily` uses numeric; enums as `text` w/ TS union + zod; indexes/uniques per §8; seed idempotent (upsert by unique keys; demo seed rebuilds demo rows transactionally when `pnpm db:seed` run).
- **DB:** ALL of §8 tables.
- **Routes:** none.
- **Components:** none.
- **Business logic:** schema-level guards only (unique constraints); no app logic.
- **Validation:** zod types mirror row types (`infer`); a test asserts every table has a zod-validated insert demo row.
- **State/flow:** DB client singleton (dev HMR-safe via `globalThis`).
- **States:** none.
- **Responsive:** none.
- **Security:** connection uses env; no default password; migrations committed.
- **Testing:** `pnpm db:push`/`db:migrate` against a local Postgres (and CI ephemeral DB); seed idempotency test (run twice = same counts); demo totals test (§19 numbers).
- **Acceptance:** `db:migrate` clean; `db:seed` produces expected row counts (84 events for Arun etc.).
- **DoD:** schema compiles; migrations applied; seed verifiable.

### Phase 06 — Authentication & session plumbing (Better Auth)

- **Objective:** Better Auth wired into Next + tRPC context, with `/login`, `/register` built from the Stitch auth screen.
- **Why:** Auth is a hard prerequisite for every protected route/procedure from here on.
- **Dependencies:** Phases 02, 03, 05.
- **Files:** `src/server/auth/server.ts`, `src/lib/auth-client.ts`, `src/app/api/auth/[...all]/route.ts`, `src/server/trpc/context.ts` + `trpc.ts` + `root.ts` (procedures shelved), `src/server/trpc/routers/auth.ts` (me, whoami), `src/app/(auth)/layout.tsx`, `login/page.tsx`, `register/page.tsx`, feature comps `src/features/auth/LoginForm.tsx`, `RegisterForm.tsx`, `AuthShell.tsx` (Stitch split layout), `src/shared/validations/auth.ts`.
- **Details:** session cookies sameSite lax; `requireUser` helper (server) for route gates; `protectedProcedure` implemented; tRPC handler `app/api/trpc/[trpc]/route.ts`; auth forms use `authClient`; error mapping (invalid-credentials/email-exists) to §5 Alert; post-auth redirect: onboarding incomplete → `/onboarding`, else `/dashboard`; `next` param redirect preserved.
- **DB:** users/session/account/verification populated (8.1–8.2).
- **Routes:** `/login`, `/register`, `/api/auth/*`, `/api/trpc/*`.
- **Components:** `AuthShell`, `LoginForm`, `RegisterForm`, reused `Brand`, inputs, `Alert`.
- **Business logic:** session validation only.
- **Validation:** `loginSchema`/`registerSchema` both ends; email normalize; password policy.
- **State/flow:** auth client cache; protected routes redirect; `useSession` hook for UI.
- **States:** loading (button), error alert, preserved inputs, success redirect, expired-session handling.
- **Responsive:** Stitch auth: image panel hidden <900px; form max-w 460 centered; mobile back button.
- **Security:** server-side enforcement; no client-only gating of protected procedures; passwords hashed by Better Auth.
- **Testing:** unit: schema; component: forms validation; e2e: register→login→redirect; unauthed `/dashboard` → `/login`.
- **Acceptance:** register + login + session persist + logout work end-to-end.
- **DoD:** full auth loop verified; context exposes user on every protected procedure.

### Phase 07 — Shared contracts & validation layer

- **Objective:** Implement `src/shared/` completely (enums, constants, types DTOs, times, validations) per §9.
- **Why:** Later phases depend on a stable, single-source contract surface; prevents business-rule duplication.
- **Dependencies:** Phases 02, 05 (row types).
- **Files:** `src/shared/enums.ts`, `constants.ts`, `times.ts`, `types.ts`, `nav.ts`, `brand.ts`, `validations/*.ts` (all §13), `src/shared/calc/pure.ts` placeholder exports where needed.
- **Details:** DTOs derive from drizzle row types via mappers defined later; every validation schema exported and frozen; `TimeBucket` + `rangeByPreset`; IANA timezone list (trimmed) for settings; `demoNow()` indirection stub.
- **DB:** none.
- **Routes:** none.
- **Components:** none.
- **Business logic:** contract shapes only (aggregation math in Phase 17).
- **Validation:** full catalog; test that schemas strip unknown keys and produce helpful messages.
- **State/flow:** none.
- **States:** none.
- **Responsive:** none.
- **Security:** schemas reject oversized strings/payloads (size caps).
- **Testing:** unit each schema (valid/invalid/edge: password, dosage, time ranges, daysOfWeek, ranges).
- **Acceptance:** all pages can import contracts with zero unused-duplicates (lint rule for `@shared` import only path).
- **DoD:** contracts compile-verified; no `any` in shared.

### Phase 08 — Reusable component system completion

- **Objective:** Finish the `ui/` catalog (Phase 03) with all data/behavior components: charts wrapper, DataTable, pagination, DateRange, Toast wiring, ConfirmationDialog, StatusIndicator finalization.
- **Why:** Feature pages (Phase 11+) must assemble from shared parts rather than inventing per-page markup.
- **Dependencies:** Phases 03, 07.
- **Files:** `src/components/ui/data-table.tsx` (TanStack Table optional; else simple typed table + sorting + pagination), `chart.tsx` (Recharts `ResponsiveContainer` + theme colors + tooltip styling), `range-picker.tsx`, `pagination.tsx`, extended `dialog/drawer` auto (mobile sheet), `toast` providers in root layout, `empty-state`/`error-state`/`skeleton` final, `section-label`, `list-row`, `stat-card`, `status-indicator`, `confirmation-dialog`; `src/lib/format.ts` (dates, times, percentages, plural).
- **Details:** charts palette = §5.3 (emerald primary, cyan secondary, amber/red/slate accents; grid `#e2e8f0`; font PJ Sans; tooltips glass). DataTable styled per §5 table recipe (header row `#f8fafc`, hover `#f0fdf4`, borders `#e2e8f0`).
- **DB:** none.
- **Routes:** extend `/design-system` demo.
- **Components:** see files above.
- **Business logic:** none (format helpers pure).
- **Validation:** none.
- **State/flow:** toaster provider; table pagination state internal.
- **States:** skeleton/empty/error composed into DataTable & charts.
- **Responsive:** table wrapper scroll; charts responsive; date range picker → sheets on mobile.
- **Security:** none.
- **Testing:** component tests: pagination math, chart renders with empty data gracefully, confirmation dialog requires confirm.
- **Acceptance:** all primitives usable in isolation; design-system page passes.
- **DoD:** catalog complete; lint rule ensures features import only these.

### Phase 09 — Global shell & navigation `(app)`

- **Objective:** Authenticated shell per §7: sidebar, topbar, breadcrumb, bell, profile menu, bottom nav, responsive behavior, nav model.
- **Why:** Every subsequent page shares this shell once; nav structure locked early prevents fake links.
- **Dependencies:** Phases 06 (auth), 08 (primitives).
- **Files:** `src/app/(app)/layout.tsx`, `src/components/layout/AppShell.tsx`, `Sidebar.tsx`, `TopNav.tsx`, `Breadcrumbs.tsx`, `NotificationBell.tsx` (uses notifications router — implemented Phase 23; for now stub with count=0 + link), `ProfileMenu.tsx`, `BottomNav.tsx`, `MoreSheet.tsx`, `src/shared/nav.ts` finalize; `loading.tsx` (shell skeleton), `error.tsx`, `not-found.tsx` at group level.
- **Details:** `requireUser()` in layout; sidebar mobile drawer; `<AppShell>` uses context `{ pathname }` for active states; notification badge polls `notifications.unreadCount` (refetch on focus); bell dropdown lists recent 5.
- **DB:** none.
- **Routes:** shell covers `/dashboard`, `/medications…`, `/schedule…`, `/adherence…`, `/insights`, `/history`, `/reports`, `/caregiver…`, `/notifications`, `/settings…`.
- **Components:** as above.
- **Business logic:** nav active-state logic only.
- **Validation:** nav route test (every href resolves to an existing route file).
- **State/flow:** shell-level providers (React Query already), auth gate, mobile nav state.
- **States:** loading skeleton shell; error boundary at group; 404 page.
- **Responsive:** §16 behavior.
- **Security:** `requireUser` server-side; profile menu shows real user; logout.
- **Testing:** unit nav model; component shell render desktop/mobile (matchMedia mock); e2e: logged-in navigation across 4 routes; bottom-nav on mobile viewport.
- **Acceptance:** shell navigable, responsive, authed-only.
- **DoD:** nav test green; no dead links; all group pages render inside shell.

### Phase 10 — Onboarding

- **Objective:** Multi-step onboarding saving profile + preferences (+ optional sample med).
- **Why:** New users need defaults and a first-medication path; completes the auth→app handoff.
- **Dependencies:** 06 (auth), 07 (contracts), 08/09 (UI/shell not yet needed — onboarding is pre-shell), 05 (schema), 11 partially (sample med creation) → implement sample med via Phase 11 service or minimal inline ensure (acceptable: call Phase 11 service once available; if ordering forces, create medication via shared service now).
- **Files:** `src/app/(auth)/onboarding/page.tsx`, `src/features/onboarding/OnboardingWizard.tsx`, `steps/ProfileStep.tsx`, `RemindersStep.tsx`, `FinishStep.tsx`, `src/server/trpc/routers/onboarding.ts`, `src/server/domain/settings/get-or-createPreferences.ts`, `src/shared/validations/onboarding.ts`.
- **Details:** save timezone/reminder defaults into `user_preferences` (upsert), `onboardingCompleted=true`; optional "Add Metformin 500mg 2×/day" → `medicationService.create` (reuses Phase 11 if available else local minimal create that mirrors it — prefer dependency on Phase 11 by ordering Phase 11 service layer first if feasible).
- **DB:** user_preferences writes.
- **Routes:** `/onboarding`.
- **Components:** wizard, stepper (Stitch pills), form primitives.
- **Business logic:** default computation (start date today, times 08:00/20:00).
- **Validation:** onboardingSchema; timezone membership.
- **State/flow:** wizard state machine; post-save redirect `/dashboard`.
- **States:** step errors, busy submit, empty (fresh profile).
- **Responsive:** single column ≤ lg.
- **Security:** authed only; preferences owner-scoped.
- **Testing:** unit schema; component step validation; e2e full onboarding → dashboard.
- **Acceptance:** new user lands on dashboard configured.
- **DoD:** wizard completes; preferences persist.

### Phase 11 — Medication domain service (server)

- **Objective:** Full server-side medication CRUD + ownership + soft delete + reminders init per §10.1.
- **Why:** Backbone for list/detail/forms/adherence/history; establishes the fan-out pattern.
- **Dependencies:** 05 (db), 07 (contracts).
- **Files:** `src/server/domain/medications/service.ts`, `repo.ts`, `mapper.ts`, `src/server/trpc/routers/medication.ts` (list, get, create, update, setStatus, archive; each authed + owner-checked).
- **Details:** implement create→ upsert schedule slots (Phase 12 field exists; for now store slots rows + minimal `ensureDoseEvents` stub hooking Phase 13), duplicate-name guard (partial unique), dosage numeric validation, `frequencyLabel` derivation, archived bucket query.
- **DB:** reads/writes medications + slots + audit? (no audit yet).
- **Routes:** tRPC only.
- **Components:** none.
- **Business logic:** all §10.1; date rules (start≤end); cadence label.
- **Validation:** medicationSchema + scheduleSchema.
- **State/flow:** procedures return DTO mappers.
- **States:** errors mapped to friendly messages.
- **Responsive:** none.
- **Security:** owner filter mandatory; archived excluded from default lists.
- **Testing:** unit service w/ in-memory or DB test: create/list/get/update/archive keeps history, duplicate names, ownership mismatch denied, numeric bounds.
- **Acceptance:** all CRUD through tRPC verified (supertest/DB-level).
- **DoD:** service pure enough to unit-test; mapper complete.

### Phase 12 — Medication schedule & dose-event generation (domain)

- **Objective:** Scheduling engine per §10.2: expand schedule, ensure/void events, idempotency.
- **Why:** Dose events are the spine of the app; correctness here prevents cascading wrong data.
- **Dependencies:** 05, 07, 11.
- **Files:** `src/shared/calc/schedule.ts` (pure), `src/server/domain/medicationSchedules/service.ts`, `src/server/domain/doseEvents/service.ts` (ensureDoseEvents, voidFuture, extendHorizon), hourly-ish reconcile job skeleton (`jobs/scheduler.ts`).
- **Details:** idempotent upsert on `(medicationId, scheduledFor)`; timezone-converted times; horizon §10.2; void on pause/change; a `catchUp` entry point callable from schedule/dashboard reads and the job.
- **DB:** dose_events writes; calls adherence recompute (Phase 17 when available; phase test asserts counts).
- **Routes:** none (internal).
- **Components:** none.
- **Business logic:** §10.2 exact.
- **Validation:** input `from/to` clamping.
- **State/flow:** generation is deterministic: given same inputs → same events.
- **States:** none.
- **Responsive:** none.
- **Security:** caller-scoped userId enforced by service signature.
- **Testing:** pure schedule expansion (once/twice/custom/start-end/leap+tz edge), ensure idempotency (run twice → no dup), void removes only unresolved.
- **Acceptance:** after seeding Metformin, exactly 2/day events for horizon days boundary cases.
- **DoD:** generation/void unit-tested; reconciles known edge cases.

### Phase 13 — Dose state machine + reconcile (missed detection) (domain)

- **Objective:** Implement §10.3 status machine + auto-miss transition (deterministic) + reconciliation job.
- **Why:** Missed/due logic must be server-determined and consistent everywhere.
- **Dependencies:** 05, 07, 12.
- **Files:** `src/shared/calc/doseState.ts` (pure), `src/server/domain/doseEvents/reconcile.ts` (apply to DB atomically), `src/server/domain/doseActions/service.ts` (take/snooze/skip/restore + audit), `jobs/scheduler.ts` (interval + on-read catchUp).
- **Details:** status quoting rules + conditional updates prevent double-transitions; missed auto-flow writes audit + calls notifications (Phase 23 hooked later — for now log guarded) and caregiver per §10.4 once that exists; missed events take-late conversion.
- **DB:** dose_events updates, dose_actions inserts.
- **Routes:** none.
- **Components:** none.
- **Business logic:** §10.3/§10.4 rules incl. snooze deadline extension and max snooze.
- **Validation:** `doseActionSchema`; legal-state transition table test.
- **State/flow:** canonical: any read path may call `reconcile.run(userId, now)` (cheap due to indexed targeted updates) before returning data; scheduler as safety net.
- **States:** none (pure logic).
- **Responsive:** none.
- **Security:** all actions by owner only.
- **Testing:** transition table (legal/illegal), snooze math, deadline edges (exactly at time vs after), take-late from missed, idempotent repeated take, audit rows recorded.
- **Acceptance:** given a seeded day, running reconcile at simulated times yields expected statuses; missed produces one audit + one notification.
- **DoD:** deterministic & tested.

### Phase 14 — Today's Schedule page + dose UI

- **Objective:** `/schedule` and `/schedule/[doseId]` wired to dose router with full §15 states.
- **Why:** The app's core "what to take now" surface; exercises reconcile + dose actions in UI.
- **Dependencies:** 08 (components), 09 (shell), 13 (engine), 11/12 (data).
- **Files:** `src/server/trpc/routers/schedule.ts` (day query, dose.get), `dose.ts` (take/snooze/skip), feature `src/features/schedule/ScheduleDayView.tsx`, `DoseCard.tsx`, `ScheduleTimeGroup.tsx`, `DoseDetailPage`, `features/dose/DoseActions.tsx`, `SkipDialog.tsx`, `SnoozeFeedback.tsx`.
- **Details:** return reconciled day DTO; sections per §11.7; DoseCard actions optimistic (react-query) with reconcile fallback on error; skip requires dialog+reason; snooze shows countdown (client estimates from statusUpdatedAt + snoozeMinutes, server authoritative on action); demo clock respected via `demoNow()`.
- **DB:** through services.
- **Routes:** `/schedule`, `/schedule/[doseId]`.
- **Components:** list-row, status-indicator, dialog, toasts, stat.
- **Business logic:** none in UI (all via procedures).
- **Validation:** procedure inputs.
- **State/flow:** react-query invalidation across all dose-related queries after action.
- **States:** §11.7 (no doses today, all completed, due pulse, missed banner, loading, error).
- **Responsive:** time groups stack; dose cards full width; detail page normalizes.
- **Security:** owner-only; dose id validated + owned.
- **Testing:** component: DoseCard buttons, skip dialog, idempotent disabled; e2e: take→state changes; snooze→moves group; skip→reason required.
- **Acceptance:** schedule page fully functional and consistent after any action.
- **DoD:** actions propagate to DB + audits; UI reflects instantly.

### Phase 15 — Medication CRUD UI (list / detail / new / edit)

- **Objective:** Full medication pages wired to Phase 11/12 services with the schedule builder and §15 states.
- **Why:** Primary content-authoring interface; proves propagation matrix rows 1–3.
- **Dependencies:** 08, 09, 11, 12 (+14 for invalidation patterns).
- **Files:** `src/features/medications/MedicationCard.tsx`, `MedicationListPage`, `MedicationForm.tsx` (wizard), `ScheduleBuilder.tsx` (per-day time rows + weekday chips + presets), `MedicationDetailPage`, `EvidenceRow`, `ArchiveDialog.tsx`; tRPC router `medication.ts` extended (already Phase 11) + `dashboard.nextDose` join later.
- **Details:** form wizard §11.6; optimistic list updates; schedule diff triggers `ensureDoseEvents`/void + adherence recompute; archive confirmation states history is preserved; paused banner on detail.
- **DB:** through services.
- **Routes:** `/medications`, `/medications/new`, `/medications/[id]`, `/medications/[id]/edit`.
- **Components:** form-field, time-picker, date-picker, chips, tabs, dialog, toasts, skeleton, empty-state.
- **Business logic:** schedule builder purity (dedupe times per dayset) in shared calc; nothing else.
- **Validation:** medication+schedule schemas fully mapped to RHF.
- **State/flow:** invalidation: medication.*, schedule.*, adherence.*, dashboard.* after mutations.
- **States:** create empty (no meds yet), save success toast+redirect, server 409 duplicate message, invalid id 404, archived read-only.
- **Responsive:** form single col < lg; time rows wrap; weekday chips scroll.
- **Security:** owner-only on edit/archive; server re-validates all inputs.
- **Testing:** component form (add slot, remove slot, preset switch, validation msgs); e2e create metformin → appears on list & schedule.
- **Acceptance:** full med lifecycle works and propagates.
- **DoD:** propagation matrix rows 1–3 verified.

### Phase 16 — Adherence engine (domain + aggregation service)

- **Objective:** Adherence service per §10.5: formulas, streaks, trends, buckets, med performance; materialization.
- **Why:** The single source of consistent numbers for dashboard/adherence/reports/insights.
- **Dependencies:** 05, 07, 13 (statuses).
- **Files:** `src/shared/calc/adherence.ts`, `streaks.ts`, `performance.ts` (pure); `src/server/domain/adherence/service.ts`, `summary.ts`, `materialize.ts` (recomputeDay/range), `src/server/trpc/routers/adherence.ts` (summary, byMedication, patterns).
- **Details:** exact §10.5 formulas; shared `summary()` consumed by all surfaces; materialization updated by dose services (Phase 13 hooks) & schedule changes (Phase 12); prunes beyond window.
- **DB:** reads dose_events; writes adherence_daily.
- **Routes:** tRPC.
- **Components:** none.
- **Business logic:** §10.5 (incl. in-progress today semantics for streak).
- **Validation:** range clamps.
- **State/flow:** single `adherence.summary` shape.
- **States:** empty → null adherence shown as "No data".
- **Responsive:** none.
- **Security:** owner scope.
- **Testing:** the sample dataset must yield exactly 84/76/5/3, 90.5%→1dp, streak 7; streak edge (today in-progress, gaps, miss=0); bucket counts; per-med aggregation; materialize/prune correctness.
- **Acceptance:** numbers identical across any caller (assert via service-level test).
- **DoD:** aggregation single-sourced & matches §19 sample.

### Phase 17 — Adherence UI + medication performance

- **Objective:** `/adherence` and `/adherence/medications` with charts, stat rail, patterns.
- **Why:** "How am I following my schedule?" answer surface.
- **Dependencies:** 08, 09, 16.
- **Files:** `src/features/adherence/AdherencePage.tsx`, `RangeSelector.tsx`, `StatRail.tsx`, `TrendChart.tsx`, `TimeOfDayPattern.tsx`, `MissedHeatStrip.tsx`, `MedicationPerformanceTable.tsx`, `PerformanceCell.tsx`; tRPC wiring.
- **Details:** all values come from one `AdherenceSummaryDTO`; charts from shared chart component; missing-data days shown as gaps not zeros (explicit); medico perf rows link `/medications/[id]`.
- **DB:** via service.
- **Routes:** `/adherence`, `/adherence/medications`.
- **Components:** chart, table, stat-card, status-indicator, range-picker, empty/error/skeleton.
- **Business logic:** none (display only).
- **Validation:** range schema.
- **State/flow:** query per range refetch.
- **States:** no-data empty state; loading skeletons preserving layout; error retry.
- **Responsive:** charts full width, stat rail 2/4, patterns grid collapse; table scrolls.
- **Security:** owner (or caregiver read-only authorized).
- **Testing:** component: DTO → rendered numbers via text match `90.5%`; e2e: seeded demo adher view shows 84/76/5/3/8.
- **Acceptance:** adherence page matches dashboard numbers (same DTO).
- **DoD:** consistent & tested.

### Phase 18 — Dashboard

- **Objective:** `/dashboard` per §11.4 composing schedule/stat/adherence/insight/caregiver widgets.
- **Why:** The primary landing surface; must be correct and prioritize action.
- **Dependencies:** 14 (dose UI), 16 (adherence), 17 (charts reuse), 24 (insight widget — build with stub returning latest then Phase 24 fills), 09 (shell).
- **Files:** `src/server/domain/dashboard/service.ts` (aggregates), `src/server/trpc/routers/dashboard.ts` (single `dashboard.get`), `src/features/dashboard/DashboardPage.tsx`, `NextDoseHero.tsx`, `TodayFeed.tsx`, `AdherenceWidget.tsx`, `MedSummary.tsx`, `InsightWidget.tsx` (stub→Phase 24), `CaregiverStatus.tsx` (stub→Phase 22), `QuickActions.tsx`.
- **Details:** §11.4 order/priority; loaded via one procedure; caregiver variant read-only; `demoNow()` respected.
- **DB:** aggregation reads.
- **Routes:** `/dashboard`.
- **Components:** stat-card, section-label, list-row, dose actions, chart, insight card, glass-card recipe.
- **Business logic:** dashboard composition only (calls domains).
- **Validation:** none extra.
- **State/flow:** refetch on focus/visibility + after any action.
- **States:** §11.4 (no meds, no doses today, due now pulse, missed banner, all complete, loading skeletons, error retry).
- **Responsive:** §16 card stacking.
- **Security:** owner; dose actions owner-gated.
- **Testing:** service-level composition test (all sections present in DTO flags); component renders each state; e2e seeded demo dashboard.
- **Acceptance:** dashboard answers both product questions instantly; numbers match adherence service.
- **DoD:** propagation rows 4–6 visible on dashboard.

### Phase 19 — History

- **Objective:** `/history` with the authoritative audit log (§8.6) + filters + pagination.
- **Why:** Trustworthy record requirement (spec §13/§19 in prompt §13 History).
- **Dependencies:** 13 (audit), 08, 09.
- **Files:** `src/server/domain/doseActions/history.ts` (query + group), `src/server/trpc/routers/history.ts`, `src/features/history/HistoryPage.tsx`, `FilterBar.tsx`, `HistoryTimeline.tsx`, `HistoryRowMenu.tsx`.
- **Details:** DTO from dose_actions joined med snapshot incl. archived meds (name snapshot on event custom? store name at generation? No—join medications by id (soft delete keeps row); snapshot added to DTO to survive future renames); filters (range, med, status); take-late shows both events; pagination cursor.
- **DB:** reads dose_actions/dose_events/medications.
- **Routes:** `/history`.
- **Components:** filters, list-row, status-indicator, pagination, empty-state.
- **Business logic:** grouping/timeline building.
- **Validation:** query schema.
- **State/flow:** query keyed by filters.
- **States:** empty "No activity", loading row skeletons, error.
- **Responsive:** filters → horizontal scroll chip row on mobile; rows stack.
- **Security:** owner only.
- **Testing:** component filter interactions; e2e create→take→history row present; archived med still listed.
- **Acceptance:** accurate, filters work, data survives med archive.
- **DoD:** history parity + deletion-safety validated.

### Phase 20 — Reports

- **Objective:** `/reports` + CSV export using the adherence service (§10.9).
- **Why:** Formal reporting requirement; reuse guarantees consistency.
- **Dependencies:** 16 (same aggregates), 08.
- **Files:** `src/server/domain/reports/service.ts`, `src/server/trpc/routers/reports.ts`, `src/app/api/reports/export/route.ts`, `src/features/reports/ReportsPage.tsx`, `GranularityTabs.tsx`, `SummaryTable.tsx`, `MissedAnalysis.tsx`, `TrendChartBlock.tsx`, `DownloadButton.tsx`.
- **Details:** granularity/range/scope controls; server builds `ReportDTO`; CSV route authenticates, streams attachment; consistent with dashboard (same service).
- **DB:** reads via adherence.
- **Routes:** `/reports`, `/api/reports/export`.
- **Components:** tabs, table, chart, range-picker, buttons.
- **Business logic:** §10.9.
- **Validation:** reportsSchema.
- **State/flow:** refetch on control change; export link builds from current params.
- **States:** no-data, loading, error; export failures surfaced toast + retry.
- **Responsive:** summary cards stack; tables scroll; controls wrap.
- **Security:** export requires session (server checks); owner scope.
- **Testing:** unit aggregation (sums equal adherence service), CSV format snapshot; e2e download contains 84 rows.
- **Acceptance:** daily/weekly/monthly/med-specific all work; numbers 100% consistent.
- **DoD:** reporting + export shipped.

### Phase 21 — Caregiver system (domain + flows + UI)

- **Objective:** §10.6/§11.12: relationships, invitations, alerts from real dose state, caregiver views, authorization.
- **Why:** Caregiver feature + authorization boundary correctness.
- **Dependencies:** 13 (missed→alert source), 05 (schema), 08, 09.
- **Files:** `src/server/domain/caregiver/service.ts` (invite/accept/revoke/permissions/alerts), `src/server/trpc/routers/caregiver.ts` (patient scope + caregiver scope as separate router `caregiverAsync` guard), `src/features/caregiver/InviteForm.tsx`, `AcceptInvite.tsx`, `RelationshipList.tsx`, `PermissionsEditor.tsx`, `AlertFeed.tsx`, `AlertDetailPage.tsx`, `CaregiverOverview.tsx` (caregiver side), `src/shared/validations/caregiver.ts` (done in 07, wire here).
- **Details:** invite → token; accept on caregiver login via link `/caregiver/accept?token=`; revoke sets status (alerts stop); missed-dose reconcile creates alerts (Phase 13 hook) for active relationships w/ permission; `requireCaregiverAccess(patientId)` in router; alerts acknowledge/resolve.
- **DB:** caregiver tables reads/writes.
- **Routes:** `/caregiver`, `/caregiver/accept`, `/caregiver/alerts/[id]`.
- **Components:** forms, list rows, status badges, dialogs, tabs.
- **Business logic:** permission evaluation; alert creation guard (once per dose/relationship — uniqueness check).
- **Validation:** invite/accept/permissions schemas.
- **State/flow:** invalidations on invite/revoke/permission; alert refetch.
- **States:** empty (no caregivers / no alerts), invite pending, revoked notice, permission disabled states.
- **Responsive:** lists stack; forms single col.
- **Security:** strongest boundary — unit tests assert a caregiver cannot query another patient or mutate; patient only manages own relationships.
- **Testing:** unit invitation lifecycle + alert dedupe; e2e: patient invite caregiver → caregiver redeems → real missed dose (demo clock) → alert appears + notification; revoke stops.
- **Acceptance:** full loop incl. authorization matrix.
- **DoD:** caregiver read-only enforced server-side.

### Phase 22 — Notifications (domain + bell + center + preferences)

- **Objective:** §10.7: notification domain, producer hooks, bell, `/notifications`, preference gating.
- **Why:** Unifies scattered notification behavior; extensible delivery.
- **Dependencies:** 13 (producers), 10 (insights prod.), 08/09 (bell).
- **Files:** `src/server/domain/notifications/service.ts` (+`channels.ts` interface w/ in-app + console), `src/server/trpc/routers/notifications.ts` (list/unread/markRead/markAllRead), `src/features/notifications/NotificationsPage.tsx`, `NotificationList.tsx`, `bell` wiring (Phase 9 stub replaced), preference gating in reminder settings (Phase 23).
- **Details:** producers: missed (13), insight ready (24), caregiver alert (21), due reminder (job/optional), demo; markRead typed; bell dropdown.
- **DB:** notifications rows.
- **Routes:** `/notifications`.
- **Components:** list-row, tabs, badge, dropdown.
- **Business logic:** preference filter at creation; dedupe (once per entity per objective).
- **Validation:** markRead id.
- **State/flow:** unreadCount refetch on focus/poll; optimistic mark-read.
- **States:** empty "all caught up", loading, error; grouped by day.
- **Responsive:** list-only; bell fits header.
- **Security:** owner only.
- **Testing:** unit dedupe/gating; component bell count; e2e missed → notification appears and opens.
- **Acceptance:** every producer path yields correct rows; gating honored.
- **DoD:** notification logic centralized; no scattered `INSERT notifications` in features.

### Phase 23 — AI insights (domain + service + UI)

- **Objective:** §10.10: snapshot→AI→validate→persist→fallback; `/insights` + dashboard widget.
- **Why:** The "AI" pillar must be behavioral, bounded, and failure-safe.
- **Dependencies:** 16 (snapshot data), 08, 22 (insight notifications).
- **Files:** `src/server/domain/insights/service.ts` (buildSnapshot, generate, fallback, validate, persist/prune), `src/shared/validations/insight.ts` (output schema), `src/server/trpc/routers/insights.ts`, `src/features/insights/InsightsPage.tsx`, `InsightCard.tsx`, `RegenerateButton.tsx`, dashboard `InsightWidget` (Phase 18 stub filled).
- **Details:** provider-agnostic `ai` SDK; env provider selection; system prompt constant (behavioral-only boundary, explicit prohibitions); zod-validated output (unknown keys stripped, categories constrained); fallback rule engine when AI fails; never mutates meds/schedules (compile+test boundary); `source` tag shown; snapshot stored.
- **DB:** ai_insights rows (prune 20).
- **Routes:** `/insights`.
- **Components:** insight card (glass), status chips, buttons.
- **Business logic:** snapshot shape; fallback rules; category mapping.
- **Validation:** output schema + snapshot schema; size caps.
- **State/flow:** regenerate → loading skeleton → success/fallback; cache latest.
- **States:** loading, empty (prereq message), error (fallback note), success.
- **Responsive:** card grid 1/2 cols.
- **Security:** owner; AI called server-side only; no PII beyond snapshot; content sanitization (no raw markdown render) — escape text.
- **Testing:** unit: snapshot builder from seeded data; fallback deterministic; schema rejects diagnostic/prescriptive text categories; never-mutate test (functions receive read-only snapshot, no db write paths); component render source tags; e2e regenerate.
- **Acceptance:** insights generate, bounded, fallback safe, consistent with adherence numbers.
- **DoD:** AI boundary enforced and tested.

### Phase 24 — Settings (profile/reminders/caregiver/appearance/data)

- **Objective:** All `/settings/*` pages per §11.14 wired to settings domain (§10.11).
- **Why:** User-control surface; completes preferences + data governance.
- **Dependencies:** 07, 08, 09, 21 (caregiver mgmt reuse), 05.
- **Files:** `src/server/trpc/routers/settings.ts` (get/update each area; export; delete), `src/server/domain/settings/service.ts`, `src/features/settings/` (ProfileForm, ReminderSettings, CaregiverSettings, AppearancePanel, DataOverview, ExportButtons, DeleteFlow), `src/app/(app)/settings/layout.tsx` (menu).
- **Details:** appearance updates theme class on `<html>` (light default; system listener); reminders per §11.14; caregiver prefs; data export streams CSV (meds+events); delete-all transactional (keep account); account deletion typed.
- **DB:** user_preferences + users + data wipes.
- **Routes:** `/settings/profile`, `/settings/reminders`, `/settings/caregiver`, `/settings/appearance`, `/settings/data`.
- **Components:** forms, switches, segmented radios, confirm dialogs, table.
- **Business logic:** prefs validation, wipe ordering (children first), export mapping.
- **Validation:** all settings schemas.
- **State/flow:** save→toast; appearance applies immediately.
- **States:** loading skeleton, dirty-state guards (confirm leave on dirty), destructive confirmations.
- **Responsive:** menu horizontal scroll on mobile, vertical aside ≥ md.
- **Security:** owner; delete requires current password? (No—session + typed phrase); export authed.
- **Testing:** component forms + toggles; e2e change theme persists; export downloads; delete-all empties but account remains.
- **Acceptance:** every setting persists and takes effect.
- **DoD:** settings complete and consistent with prefs used elsewhere.

### Phase 25 — Demo mode (domain + seed reuse + UX)

- **Objective:** §10.8: demo session, simulation dock, Arun Kumar data, isolation; `/demo`.
- **Why:** College-demo requirement; must be realistic and isolated.
- **Dependencies:** 05 (demo seed), 13/16 (services it drives), 08/09 shell reuse, 21 (caregiver alert gen), 23 (insight gen), 14/17/18/19 (pages reused).
- **Files:** `src/server/domain/demo/service.ts` (enter/leave/reset/action/scenario/time/insight/alert), `src/server/trpc/routers/demo.ts`, `src/app/demo/layout.tsx` (+banner, dock), `src/features/demo/DemoDock.tsx`, `DemoClock.tsx`, `ScenarioControl.tsx`, `ResetButton.tsx`, `demoNow()` integration in `server/trpc/context.ts` (if demo cookie) + `src/shared/times.ts`.
- **Details:** demo cookie per §10.8; demo user seed (§19) refreshed by reset; simulation actions route through real services (using demo user id + demoNow) so all surfaces react live; `setTime` shifts `demo_state.simulationNow`; scenario buttons mutate recent days via seeded blocks (keeps totals semantics); isolation test = after demo, real account data unchanged.
- **DB:** demo_state, demo rows (userId = demo user).
- **Routes:** `/demo` (plus reuses all `(app)` page components inside demo shell).
- **Components:** dock, clock, banner, controls.
- **Business logic:** §10.8 scenario bricks; token issuance.
- **Validation:** action/input schemas (clamped).
- **State/flow:** demo cookie + demoNow threaded through procedures; refetch on time change.
- **States:** enter loading; real-session preserved notice; reset confirm; empty demo (if seed cleared) → reseed CTA.
- **Responsive:** dock compact on mobile (collapsible sheet).
- **Security:** demo cookie short-lived, can't read real user data; real cookie untouched; reset scoped to demo userId.
- **Testing:** unit scenario totals invariant; isolation (real user unseen by demo ctx and vice-versa); e2e full demo tour incl. each simulate button + reset.
- **Acceptance:** a presenter can drive the whole app live from `/demo`.
- **DoD:** demo isolated, resettable, realistic.

### Phase 26 — Global states, accessibility & responsive refinement

- **Objective:** Sweep §15/§16/accessibility across every shipped page; keyboard/screen-reader pass; mobile polish.
- **Why:** Elevates quality to production bar and ensures the Stitch "premium but practical" feel.
- **Dependencies:** all features exist.
- **Files:** touch `src/app/**/error.tsx`, `loading.tsx`, `empty-state.tsx`, `not-found.tsx`; add skip-link, focus-visible rings, `aria-*` passes; `reduced-motion` respects `reduceMotion` pref; responsive audits per §16; `src/lib/a11y.ts` helpers; fix any hard-coded color violations.
- **Details:** ensure all status indicators color+icon+text; dialogs trap focus & restore; tables have caption/scope; charts have textual fallback (summary numbers); toast live-region; keyboard navigable nav; contrast check on muted text vs bg (bump where needed within Stitch palette: use `#64748b` minimum on white).
- **DB:** none.
- **Routes:** all (verification pass).
- **Components:** refinements in catalog.
- **Business logic:** none.
- **Validation:** none new.
- **State/flow:** focus management tests.
- **States:** verified all four (§15) present per page: spot-check registry.
- **Responsive:** every page passes at 1280/1024/768/390 widths (viewport screenshot pass).
- **Security:** none new.
- **Testing:** axe-core scan on representative routes (Playwright), keyboard-only E2E (Tab through nav → activate), reduced-motion snapshot.
- **Acceptance:** zero critical a11y violations; responsive pass documented.
- **DoD:** audit report attached in docs/.

### Phase 27 — Unit & component test completion

- **Objective:** Finish the §18 unit/component suite to coverage thresholds.
- **Why:** Guarantees the reputation of calculations and UI behavior before e2e.
- **Dependencies:** all shipped code.
- **Files:** new `*.test.ts`/`*.test.tsx` beside code; `vitest.config.ts` coverage thresholds (`src/shared/calc ≥ 95%`, domain services ≥ 80%, key components ≥ 70%).
- **Details:** exhaustive calc matrices; component interaction tests incl. optimistic updates, disabling during flight, idempotent double-click.
- **DB:** test DB hook (transactional rollback helper).
- **Routes:** none.
- **Components:** targeted.
- **Business logic:** verified at unit level.
- **Validation:** covered.
- **State/flow:** covered.
- **States:** covered.
- **Responsive:** none.
- **Security:** authz tests (ownership denial) included.
- **Testing:** the suite itself.
- **Acceptance:** thresholds met; `pnpm test` green.
- **DoD:** coverage report committed/served in CI.

### Phase 28 — End-to-end test suite

- **Objective:** Playwright flows from §18/E2E incl. demo tour and caregiver loop.
- **Why:** Proves the coherent, connected application (no disconnected mock pages).
- **Dependencies:** everything above.
- **Files:** `e2e/register.spec.ts`, `onboarding.spec.ts`, `medication-lifecycle.spec.ts`, `dose-actions.spec.ts`, `missed-dose.spec.ts`, `adherence-consistency.spec.ts`, `caregiver.spec.ts`, `reports.spec.ts`, `demo.spec.ts`, `auth-guard.spec.ts`, `shell.spec.ts`; `e2e/helpers/demo-login.ts`, `e2e/helpers/seed.ts`.
- **Details:** deterministic time via demo clock; seeded DB snapshot per suite; assert consistency (dashboard × adherence × history × reports numbers match); run in CI chromium.
- **DB:** ephemeral Postgres + seed.
- **Routes:** full coverage set.
- **Components:** via page.
- **Business logic:** end-to-end proof.
- **Validation:** covered through UI.
- **State/flow:** covered.
- **States:** covered (assert empty/error states on fresh account).
- **Responsive:** one mobile-viewport spec (bottom nav).
- **Security:** auth guard + caregiver boundary specs.
- **Testing:** the suite itself.
- **Acceptance:** all specs green; propagation matrix validated by `adherence-consistency.spec`.
- **DoD:** CI runs suite with retries; report artifacts available.

### Phase 29 — Integration verification & final consistency pass

- **Objective:** Full application consistency audit per §20 (propagation matrix), plus polish and build.
- **Why:** Catches the "hardcoded dashboard / duplicated logic / inconsistent adherence" anti-pattern class before shipping.
- **Dependencies:** all phases.
- **Files:** potentially patch violations found; add `docs/consistency-verification.md` log; run `pnpm build`, `pnpm typecheck`, `pnpm lint`, full tests.
- **Details:** scripted checks: (a) adherence numbers identical across dashboard/adherence/reports/insights (same DTO service), (b) medication created in `/medications/new` appears in list/detail/schedule/dashboard/adherence/history/reports/insight input, (c) caregiver alert traceable to a real dose event, (d) no feature imports raw db client, (e) no hardcoded brand hex in features, (f) every nav link real, (g) brand/name consistent through single `brand.ts`.
- **DB:** none new.
- **Routes:** audit all.
- **Components:** audit dedupe.
- **Business logic:** single-source audit.
- **Validation:** audit.
- **State/flow:** audit invalidation coverage.
- **States:** spot audit.
- **Responsive:** final screenshot sweep vs Stitch style.
- **Security:** quick security checklist (env, cookies, headers).
- **Testing:** full suite + these audit scripts.
- **Acceptance:** audit check-list green; production build passes; app feels coherent.
- **DoD:** `plan.md` phase 29 checklist all checked.

### Phase 30 — Deployment & handoff polish (optional but recommended)

- **Objective:** Docs, runbook, environment separation, final commit hygiene.
- **Why:** Makes the project presentable for the college demo and future agents.
- **Dependencies:** 29.
- **Files:** `README.md` (setup, .env, scripts, demo path, screenshots note), `docs/` final, CI workflow (optional), security/external URLs note.
- **Details:** document `pnpm install → db:migrate → db:seed → dev`; document AI env keys optional (works without via fallback); document demo flow.
- **DB:** none.
- **Routes:** none.
- **Components:** none.
- **Business logic:** none.
- **Validation:** none.
- **State/flow:** none.
- **States:** none.
- **Responsive:** none.
- **Security:** document env handling.
- **Testing:** final full run in CI mode.
- **Acceptance:** readme runbook reproducible on a clean machine.
- **DoD:** clean repo state (no secrets), runbook verified.

---

## 22. GLOBAL DEFINITION OF DONE

The application is done when ALL of the following hold:
1. `pnpm dev`/`build` succeed; `typecheck`, `lint`, `test`, `test:e2e` green; coverage thresholds met.
2. All §11 routes exist, are real (nav test), authed-appropriate, and reachable; no dead buttons.
3. The UI matches the Stitch export design system (§5): tokens, typography, colors, radii, shadows, cards, statuses; brand via single `brand.ts`.
4. A medication created at `/medications/new` propagates to list, detail, schedule (with generated dose events), dashboard, adherence, history (on dose activity), reports, and AI insight input; verified by the propagation matrix tests.
5. Dose actions (take/snooze/skip/auto-miss) are deterministic, idempotent, audited, and propagate consistently; no client-timer-only state; missed is server-determined.
6. Adherence numbers are identical across dashboard/adherence/reports/insights (single `adherenceService.summary`).
7. Historical dose data survives medication archive/pause; history remains understandable.
8. Caregiver access is strictly authorized server-side; alerts originate from real dose/adherence state.
9. AI insights are behavioral-only, validated, fallback-safe, read-only with respect to meds/schedules/doses, and clearly labeled; AI failure never breaks pages.
10. Demo mode is realistic, isolated from real user data, resettable, and drives the real application.
11. Every screen has loading/empty/error/success states; responsive behavior matches §16; accessibility pass clean.
12. No duplicated business logic, no frontend-only pseudo-persistence, no generic redesign of the Stitch look.
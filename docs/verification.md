# Verification Runbook

The ordered gate for a release. Run top to bottom — each step assumes the previous one passed.
Every command is expected to be green with **zero** warnings, not just zero errors.

## Pre-flight

| Requirement        | Notes                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| Node 20+, pnpm     | `pnpm install`                                                           |
| `.env`             | `cp .env.example .env` and fill in the values                            |
| PostgreSQL         | Supabase session pooler (IPv4). Migrations applied via `pnpm db:migrate` |
| Chromium           | `pnpm exec playwright install chromium`                                  |
| `E2E_DATABASE_URL` | Throwaway database for Playwright. Falls back to `DATABASE_URL` if unset |

E2E writes real rows (it registers accounts, creates medications, logs doses). Never point it at a
database whose contents you care about.

## The gate

```bash
pnpm typecheck       # tsc --noEmit
pnpm lint            # eslint, 0 errors and 0 warnings
pnpm format:check    # prettier --check
pnpm test:coverage   # 49 files / 366 tests + enforced thresholds
pnpm build           # next build
pnpm test:e2e        # Playwright
```

### Notes on each step

- **Coverage thresholds** apply to `src/shared/calc` and `src/shared/validations` — the pure decision
  cores where a wrong answer is a wrong dose state. React and server wiring is covered by the DB
  suites and E2E, where instrumentation would not make it more meaningful.
- **Build** also type-checks route types. A build failure here is usually a server/client component
  boundary mistake that `tsc` alone does not catch.
- **E2E** starts its own `next dev` and reuses an already-running server locally. Under CI it is
  `reuseExistingServer: false` with 2 workers.

## Reading a green run

Vitest can exit 0 while silently dropping a test file if a forked worker fails to start under load
("Timeout waiting for worker to respond" appears as an _unhandled error_). The unit pool is pinned to
a single fork to prevent this, but if you see that message, treat the run as **failed** and compare
the reported test-file count against the number of files on disk:

```bash
(Get-ChildItem -Recurse -Path src -Include *.test.ts,*.test.tsx -File).Count
```

## Demo workspace

`/demo` (signed out) enters a shared, pre-seeded workspace at `/demo/workspace` using a validated
demo tRPC subject rather than a real session. The shell renders the _same_ feature screens under a
`/demo/workspace` base path.

Two invariants are worth remembering when touching this area:

1. **`protectedProcedure` accepts a demo subject; `sessionProcedure` does not.** Escape routes
   (sign-in, caregiver invite/accept, account deletion) must stay on `sessionProcedure`, or the demo
   silently starts acting on a real account.
2. **In-app links must go through `useAppHref()`**, never a hardcoded `/medications`. A hardcoded
   href ejects the visitor out of the demo base path and into the signed-in app — or into `/login`,
   which looks like a broken page rather than a bug.

`e2e/demo.spec.ts` guards both: it walks every demo nav destination and asserts no 404 and no
authorization error, and asserts that every nav href stays under the base path.

## Accessibility

`e2e/a11y.spec.ts` runs axe (WCAG 2.0/2.1 A + AA) over the marketing pages, the signed-in screens
and the demo workspace, and additionally asserts exactly one `<main>` and one `<h1>` per page.

The shell does **not** add its own `<main>`. Every feature screen owns that landmark; a second one
would be invalid HTML and trips axe's duplicate-main rule. The shell only provides a focusable
`#main-content` wrapper for the skip link (WCAG 2.4.1), which is the first tab stop.

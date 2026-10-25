# Frontend Backlog

Small, single-concern issues for `oncall-training-frontend`, derived from `AGENTS.md`, `ARCHITECTURE.md`, `CONVENTIONS.md` and `DECISIONS.md`.
Scope is **this repo only**. Where an issue depends on the backend or infra, it says so under **Blocked by** and the issue covers only the frontend part.

**Format of each issue**

```
### FE-NNN · <conventional-commit-style title>
Labels · Milestone · Depends on
Context (1–3 lines)
- [ ] acceptance criteria
```

**Milestones** (from AGENTS §8)

| Milestone | Due | Goal |
|---|---|---|
| **M1 · Foundation** | Thu Oct 29 | Tooling, Carbon, app shell, auth, scenarios against MSW, deployed to CloudFront |
| **M2 · Incident console** | Thu Nov 19 | Live console with polling, actions, logs and result view against the deployed backend |
| **M3 · Insights** | Thu Nov 26 | History, stats (≥2 Carbon charts), leaderboard, Playwright happy path |
| **M4 · Polish** | after Nov 26 | Accessibility, performance, security and docs finishing touches |

**Labels**
- type: `chore` `feat` `test` `ci` `docs`
- area: `setup` `styles` `config` `api` `mocks` `app` `auth` `landing` `scenarios` `incident` `history` `stats` `leaderboard` `e2e` `a11y` `deploy`
- flags: `blocked-cross-repo` (waiting on backend or infra), `good-first-issue`

---

## 1. Project setup and tooling (M1)

### FE-001 · docs: move ARCHITECTURE, CONVENTIONS and DECISIONS into `docs/`
`docs` `setup` `good-first-issue` · M1 · Depends on: —

AGENTS.md and the layout in §6 refer to `docs/…`, but the files are at the repo root.
- [ ] `ARCHITECTURE.md`, `CONVENTIONS.md`, `DECISIONS.md` live in `docs/`
- [ ] Every cross-reference between the docs still resolves
- [ ] `BACKLOG.md` stays at the root or moves to `docs/` (pick one; update this header)

### FE-002 · chore(setup): scaffold Vite + React + TypeScript project with pnpm
`chore` `setup` · M1 · Depends on: —

The bare minimum that runs: `package.json`, `index.html`, `src/main.tsx` that renders "Hello".
- [ ] `pnpm install && pnpm dev` serves the app on `:5173`
- [ ] `pnpm build` writes `dist/`
- [ ] `pnpm-lock.yaml` committed; `packageManager` field pins the pnpm version
- [ ] Node version pinned (`.nvmrc` or `engines`)

### FE-003 · chore(setup): configure strict tsconfig and the `@/` path alias
`chore` `setup` · M1 · Depends on: FE-002

CONVENTIONS §1.
- [ ] `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `moduleResolution: "bundler"`
- [ ] `@/` → `src/` works in both `tsc` and Vite
- [ ] `pnpm typecheck` script runs `tsc --noEmit` (app + node configs)

### FE-004 · chore(setup): add `.gitignore` and `.env.example`
`chore` `setup` `good-first-issue` · M1 · Depends on: FE-002

- [ ] `.gitignore` covers `node_modules`, `dist`, `.env*.local`, Playwright reports, coverage
- [ ] `.env.example` lists every `VITE_*` variable from ARCHITECTURE §9 with safe example values and a comment that they are **public**

### FE-005 · chore(setup): add ESLint flat config
`chore` `setup` · M1 · Depends on: FE-003

CONVENTIONS §11.
- [ ] typescript-eslint `recommended-type-checked`, `react-hooks`, `jsx-a11y`
- [ ] `no-console` as warn; `@typescript-eslint/no-explicit-any` as error
- [ ] `src/api/schema.d.ts` and `dist/` ignored
- [ ] `pnpm lint` passes on the scaffold

### FE-006 · chore(setup): add Prettier
`chore` `setup` `good-first-issue` · M1 · Depends on: FE-005

- [ ] `printWidth: 100`; `eslint-config-prettier` so the two don't conflict
- [ ] `pnpm format` and `pnpm format:check` scripts

### FE-007 · chore(setup): configure the Vite dev proxy for `/api`
`chore` `setup` · M1 · Depends on: FE-002

ARCHITECTURE §1: same-origin in dev.
- [ ] `/api` proxied to `http://localhost:3000` in `vite.config.ts`
- [ ] No host is hardcoded anywhere else in `src/`

### FE-008 · test(setup): set up Vitest, React Testing Library and user-event
`test` `setup` · M1 · Depends on: FE-003

- [ ] Vitest with jsdom, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- [ ] `src/test/setup.ts` registered; `pnpm test` runs once, `pnpm test:watch` watches
- [ ] One trivial sample test passes

### FE-009 · test(setup): add a shared `renderWithProviders` helper
`test` `setup` · M1 · Depends on: FE-008, FE-030

- [ ] `src/test/render.tsx` wraps UI in Theme, a fresh QueryClient (no retries) and a memory router
- [ ] Accepts an initial route and returns the `user` from `userEvent.setup()`

### FE-010 · ci: add the CI workflow
`ci` `setup` · M1 · Depends on: FE-005, FE-008

CONVENTIONS §11.
- [ ] `.github/workflows/ci.yml` runs on every PR and push to `main`
- [ ] Steps: pnpm install (cached), `lint`, `typecheck`, `test`, `build`
- [ ] No AWS credentials used

### FE-011 · chore(setup): add favicon, app title and meta tags
`chore` `setup` `good-first-issue` · M1 · Depends on: FE-002

- [ ] `public/favicon.svg` and `<title>On-Call Training</title>`
- [ ] `<meta name="description">` and `theme-color` match the dark theme

### FE-012 · docs: write the README
`docs` `setup` · M1 · Depends on: FE-002

`README.md` is empty.
- [ ] What the app is, link to the three repos
- [ ] Prerequisites, install, the commands from AGENTS §5, the two local dev modes
- [ ] Links to `docs/`

---

## 2. Carbon design system (M1)

### FE-013 · feat(styles): install Carbon and apply the g100 theme globally
`feat` `styles` · M1 · Depends on: FE-002

CONVENTIONS §5.
- [ ] `@carbon/react`, `@carbon/icons-react`, `sass-embedded` installed
- [ ] `src/styles/index.scss` loads Carbon with the g100 theme; imported once in `main.tsx`
- [ ] `body` uses `$background` and `$text-primary`

### FE-014 · feat(styles): set up IBM Plex Sans and Plex Mono
`feat` `styles` · M1 · Depends on: FE-013

- [ ] Fonts load through Carbon's font setup (no Google Fonts link)
- [ ] Monospace text uses `code-01`/`code-02` type styles

### FE-015 · chore(styles): add the overrides file and a CSS Modules token example
`chore` `styles` · M1 · Depends on: FE-013

- [ ] `src/styles/overrides.scss` exists, empty except a header comment explaining the rule (CONVENTIONS §5.4)
- [ ] One `*.module.scss` example using `$spacing-*`, theme and type tokens compiles
- [ ] Optional: a stylelint rule or grep in CI that rejects hex colors in `src/**/*.scss`

---

## 3. Configuration (M1)

### FE-016 · feat(config): validate env vars with zod
`feat` `config` · M1 · Depends on: FE-003

ARCHITECTURE §9.
- [ ] `src/config/env.ts` parses `import.meta.env` into a typed `env` object
- [ ] Cognito vars required when `VITE_AUTH_MODE=cognito`; `VITE_DEV_USER` required when `dev`
- [ ] `vite-env.d.ts` declares the `VITE_*` keys
- [ ] Unit tests for valid and invalid combinations

### FE-017 · feat(config): show a configuration error screen when env is invalid
`feat` `config` · M1 · Depends on: FE-016, FE-013

- [ ] `main.tsx` renders a Carbon error state listing the invalid keys instead of a blank page
- [ ] No values (only key names) shown

### FE-018 · chore(config): fail production builds that use dev auth
`chore` `config` · M1 · Depends on: FE-016

ARCHITECTURE §4.
- [ ] `vite build` errors if `VITE_AUTH_MODE=dev` or `VITE_API_MOCKS=true`
- [ ] Documented in the README

---

## 4. API layer (M1)

### FE-019 · chore(api): add the pinned OpenAPI spec and `BACKEND_REF`
`chore` `api` `blocked-cross-repo` · M1 · Depends on: —

Blocked by: backend publishing `openapi/openapi.json`.
- [ ] `openapi/openapi.json` committed from a backend tag/SHA
- [ ] `openapi/BACKEND_REF` holds that ref

### FE-020 · chore(api): add the `api:sync` script
`chore` `api` · M1 · Depends on: FE-019

ARCHITECTURE §8, DECISIONS O-05.
- [ ] `scripts/sync-openapi.ts` reads `BACKEND_REF` and downloads the spec with `gh api`
- [ ] Clear error if `gh` is missing or not authenticated
- [ ] `pnpm api:sync` script

### FE-021 · chore(api): generate `schema.d.ts` with openapi-typescript
`chore` `api` · M1 · Depends on: FE-019

- [ ] `pnpm api:types` writes `src/api/schema.d.ts` with a "GENERATED, do not edit" header
- [ ] Generated file committed and excluded from lint/format

### FE-022 · ci: check that `schema.d.ts` matches `openapi.json`
`ci` `api` · M1 · Depends on: FE-010, FE-021

- [ ] CI regenerates types and fails on `git diff --exit-code src/api/schema.d.ts`

### FE-023 · feat(api): create the typed openapi-fetch client
`feat` `api` · M1 · Depends on: FE-021

- [ ] `src/api/client.ts` exports `api = createClient<paths>({ baseUrl: "" })`
- [ ] ESLint `no-restricted-globals`/`no-restricted-syntax` blocks `fetch` outside `src/api/` (AGENTS rule 3)

### FE-024 · feat(api): add `ApiError` and the error-parsing middleware
`feat` `api` · M1 · Depends on: FE-023

ARCHITECTURE §8 and §12 error body.
- [ ] `src/api/errors.ts`: `ApiError { status, code, message, details, requestId }` and `isApiError()`
- [ ] Non-2xx responses become `ApiError`; non-JSON bodies and network failures still produce a usable error
- [ ] Unit tests for the backend error shape, an empty body and a network error

### FE-025 · feat(api): add the `x-request-id` middleware
`feat` `api` · M1 · Depends on: FE-023

- [ ] Each request gets a ULID in `x-request-id`; `ApiError.requestId` falls back to it
- [ ] Unit test

### FE-026 · feat(api): add the auth header middleware
`feat` `api` `auth` · M1 · Depends on: FE-023, FE-040

- [ ] Cognito mode: `Authorization: Bearer <access_token>` from the current OIDC user
- [ ] Dev mode: `x-dev-user: <VITE_DEV_USER>`
- [ ] Tokens never logged; unit test with a fake user

### FE-027 · feat(api): handle 401 with one silent renew, then sign-in
`feat` `api` `auth` · M1 · Depends on: FE-026

ARCHITECTURE §4.
- [ ] On 401, try `signinSilent()` once and replay the request
- [ ] If renew fails: remove the user and `signinRedirect` with the current path as `returnTo`
- [ ] Concurrent 401s share one renew attempt; unit test

### FE-028 · feat(api): add the query-keys factory
`feat` `api` `good-first-issue` · M1 · Depends on: FE-003

- [ ] `src/api/query-keys.ts` exports `qk` with exactly the keys in ARCHITECTURE §8
- [ ] Keys are `as const` tuples; `qk.me.stats()` without a name matches all stats for invalidation

### FE-029 · feat(api): add an `ApiError` code-to-message helper
`feat` `api` · M1 · Depends on: FE-024

CONVENTIONS §6: handle errors by code, not message text.
- [ ] `errorMessage(error)` returns UI copy for `SESSION_BUSY`, `SESSION_NOT_ACTIVE`, `ACTION_NOT_ALLOWED`, `STATS_TIMEOUT`, 404, 5xx and network errors
- [ ] Unit tests per code

### FE-030 · feat(app): configure the QueryClient defaults
`feat` `app` `api` · M1 · Depends on: FE-024

ARCHITECTURE §8.
- [ ] Retry up to 2 for 5xx/network, never for 4xx
- [ ] `refetchOnWindowFocus: false` by default
- [ ] Unit test for the retry predicate

---

## 5. Mocks (M1 → M2)

### FE-031 · chore(mocks): set up MSW in the browser and `pnpm dev:mocks`
`chore` `mocks` · M1 · Depends on: FE-016, FE-021

- [ ] `msw` installed, worker file in `public/`
- [ ] `main.tsx` starts the worker only when `import.meta.env.DEV && VITE_API_MOCKS === "true"`, before rendering
- [ ] `pnpm dev:mocks` sets the flag and dev auth

### FE-032 · test(mocks): run the same handlers in Vitest through `msw/node`
`test` `mocks` · M1 · Depends on: FE-008, FE-031

- [ ] `src/test/setup.ts` starts the server, resets handlers after each test, `onUnhandledRequest: "error"`
- [ ] Tests can override handlers per case with `server.use(...)`

### FE-033 · feat(mocks): add typed scenario handlers
`feat` `mocks` `scenarios` · M1 · Depends on: FE-031

- [ ] `GET /api/scenarios` and `GET /api/scenarios/:id` return fixtures typed from `schema.d.ts`
- [ ] Unknown id → 404 with the backend error body

### FE-034 · feat(mocks): add the session simulator state machine
`feat` `mocks` `incident` · M2 · Depends on: FE-031

ARCHITECTURE §10.
- [ ] `src/mocks/simulator.ts`: in-memory session `STARTING` → (10 s) `INCIDENT_ACTIVE` with `orders` down
- [ ] Time is injectable so tests can drive it with fake timers
- [ ] Unit tests for the transitions

### FE-035 · feat(mocks): add session, start and dashboard handlers backed by the simulator
`feat` `mocks` `incident` · M2 · Depends on: FE-034

- [ ] `POST /api/sessions` → 201 `{ sessionId }`; `GET /api/sessions/:id`; `GET /api/sessions/:id/dashboard`
- [ ] Snapshot includes services, replicas, pods and the event timeline

### FE-036 · feat(mocks): simulate actions, recovery and scoring
`feat` `mocks` `incident` · M2 · Depends on: FE-035

- [ ] `POST /api/sessions/:id/actions` → 202; events appended to the timeline
- [ ] Scale/restart of `orders` recovers after about 4 s and resolves with a computed score, TTD, TTR, wrong actions
- [ ] Actions not in `availableActions` → 4xx `ACTION_NOT_ALLOWED`

### FE-037 · feat(mocks): add logs and abandon handlers
`feat` `mocks` `incident` · M2 · Depends on: FE-035

- [ ] `GET /api/sessions/:id/logs?service=` returns plausible lines per service (including the fault)
- [ ] `POST /api/sessions/:id/abandon` moves the session to `FAILED` on the next poll

### FE-038 · feat(mocks): add edge-case flags `?mock=busy|stale|fail`
`feat` `mocks` · M2 · Depends on: FE-035

- [ ] `busy`: start returns 409 `SESSION_BUSY` with `retryAfterSeconds`
- [ ] `stale`: dashboard returns `stale: true`
- [ ] `fail`: the session times out to `FAILED`
- [ ] Documented in ARCHITECTURE §10

### FE-039 · feat(mocks): add history, stats and leaderboard handlers
`feat` `mocks` · M3 · Depends on: FE-031

- [ ] `GET /api/me/sessions` with cursor pagination
- [ ] `GET /api/me/stats/score-over-time` and `ttd-ttr-by-attempt` (with an artificial delay)
- [ ] `GET /api/leaderboard/:scenarioId` including rows for the mock user
- [ ] Completed simulator sessions show up in history

---

## 6. Auth (M1)

### FE-040 · feat(auth): configure react-oidc-context for Cognito
`feat` `auth` · M1 · Depends on: FE-016

ARCHITECTURE §4.
- [ ] `src/auth/oidc-config.ts` builds settings from env (authority, client_id, `<origin>/callback`, `code`, `openid email profile`, `automaticSilentRenew`)
- [ ] `AuthProvider` wrapper in `src/auth/`; only `src/auth/` imports the OIDC libraries (ESLint `no-restricted-imports`)

### FE-041 · feat(auth): add the dev auth mode
`feat` `auth` · M1 · Depends on: FE-040

- [ ] With `VITE_AUTH_MODE=dev`, the auth layer reports an authenticated user named `VITE_DEV_USER` without Cognito
- [ ] `useCurrentUser`, `RequireAuth` and `signOut` behave the same in both modes

### FE-042 · feat(auth): add the `/callback` route
`feat` `auth` · M1 · Depends on: FE-040, FE-046

- [ ] Shows Carbon `Loading` while the code is exchanged
- [ ] Navigates (replace) to the stored `returnTo`, default `/scenarios`; strips `code`/`state` from the URL
- [ ] Error from Cognito → error state with a "Try again" sign-in button

### FE-043 · feat(auth): add the `RequireAuth` guard
`feat` `auth` · M1 · Depends on: FE-040

- [ ] Loading → Carbon `Loading`; unauthenticated → `signinRedirect({ state: { returnTo } })`
- [ ] Only same-origin relative paths accepted as `returnTo` (no open redirect)
- [ ] Test: visiting a protected route while signed out triggers the redirect with the right path

### FE-044 · feat(auth): add the `useCurrentUser` hook
`feat` `auth` `blocked-cross-repo` · M1 · Depends on: FE-040

Blocked by: DECISIONS O-02 (which claim is the display name). Implement with a single constant for the claim.
- [ ] Returns `{ userId: sub, username }`, or `null` when signed out
- [ ] Unit test with a fake profile

### FE-045 · feat(auth): add the `signOut` helper
`feat` `auth` · M1 · Depends on: FE-040, FE-030

ARCHITECTURE §4, DECISIONS D-16.
- [ ] `removeUser()` → clear the query cache → `window.location.assign(<domain>/logout?client_id=…&logout_uri=<origin>/)`
- [ ] Dev mode: clears cache and goes to `/`
- [ ] Unit test for the logout URL

---

## 7. App shell and routing (M1)

### FE-046 · feat(app): compose the app providers
`feat` `app` · M1 · Depends on: FE-013, FE-030, FE-040

ARCHITECTURE §2.
- [ ] `src/app/providers.tsx`: `Theme g100` → `AuthProvider` → `QueryClientProvider` → `ToastProvider`
- [ ] React Query Devtools only in dev

### FE-047 · feat(app): set up the router with lazy routes
`feat` `app` · M1 · Depends on: FE-046

ARCHITECTURE §3, CONVENTIONS §4.
- [ ] `src/app/router.tsx` with `createBrowserRouter` and every path from the routes table
- [ ] Each route lazy-loaded; placeholder pages for screens not built yet
- [ ] Protected routes nested under `RequireAuth`

### FE-048 · feat(app): build the AppShell header and navigation
`feat` `app` · M1 · Depends on: FE-047

- [ ] Carbon UI Shell `Header`, `HeaderName`, `HeaderNavigation`: Scenarios · History · Stats · Leaderboard
- [ ] Active route marked (`isActive`/`aria-current`); `SkipToContent` link
- [ ] Nav hidden or reduced on the landing page for signed-out users

### FE-049 · feat(app): add the user menu with sign out
`feat` `app` `auth` · M1 · Depends on: FE-048, FE-044, FE-045

- [ ] Header action shows the username and a **Sign out** item
- [ ] Icon-only button has an accessible name

### FE-050 · feat(app): add the 404 page
`feat` `app` `good-first-issue` · M1 · Depends on: FE-047

- [ ] `NotFoundPage` with a Carbon empty state and a link back to Scenarios (or `/` when signed out)

### FE-051 · feat(app): add a route `errorElement`
`feat` `app` · M1 · Depends on: FE-047

CONVENTIONS §4.
- [ ] Render errors show a Carbon error state with "Reload" inside the shell instead of a blank page
- [ ] Error details (and request id for `ApiError`) shown only in dev

### FE-052 · feat(components): add the ToastProvider and `useToast`
`feat` `app` · M1 · Depends on: FE-013

CONVENTIONS §5.7.
- [ ] Small context rendering Carbon `ToastNotification`s bottom-right, auto-dismiss after 5 s
- [ ] Toasts are announced politely and never steal focus
- [ ] Unit test with fake timers

### FE-053 · feat(components): add the `PageHeader` component
`feat` `app` `good-first-issue` · M1 · Depends on: FE-013

- [ ] Title (`h1`), optional description and actions slot, token-based spacing

### FE-054 · feat(components): add shared empty, error and loading states
`feat` `app` · M1 · Depends on: FE-013, FE-029

- [ ] `EmptyState` (title, text, optional action link), `ErrorState` (message from `errorMessage()`, Retry button), `PageSkeleton`
- [ ] Used by every feature for consistency

### FE-055 · feat(app): set the document title per route
`feat` `app` `good-first-issue` · M1 · Depends on: FE-047

- [ ] `useDocumentTitle("Scenarios")` → "Scenarios · On-Call Training"

---

## 8. Landing (M1)

### FE-056 · feat(landing): build the landing page
`feat` `landing` · M1 · Depends on: FE-047, FE-040

- [ ] What the app is, "How it works" in 3 steps (Carbon Grid + Tiles), **Sign in** button calling `signinRedirect`
- [ ] Copy mentions sign up is available on the same page (Cognito managed login)

### FE-057 · feat(landing): redirect signed-in users to `/scenarios`
`feat` `landing` · M1 · Depends on: FE-056

- [ ] Authenticated users visiting `/` are redirected (replace)
- [ ] Test for both signed-in and signed-out

---

## 9. Shared helpers and status components (M1)

### FE-058 · feat(lib): add `formatDuration` and `formatClock`
`feat` `app` `good-first-issue` · M1 · Depends on: FE-008

CONVENTIONS §9.
- [ ] `formatDuration(125)` → `2m 05s`; hours handled; `null` → `—`
- [ ] `formatClock(65)` → `01:05` for the incident timer
- [ ] Unit tests including edge cases (0, negative, large)

### FE-059 · feat(lib): add date, relative-time and score formatters
`feat` `app` `good-first-issue` · M1 · Depends on: FE-008

- [ ] `formatDateTime` via `Intl.DateTimeFormat` (user locale/time zone), `formatRelative` via `Intl.RelativeTimeFormat`, `formatScore` via `Intl.NumberFormat`
- [ ] Unit tests with a fixed locale and time zone

### FE-060 · feat(components): add `StatusIndicator`
`feat` `app` `a11y` · M1 · Depends on: FE-013

ARCHITECTURE §5 status table.
- [ ] healthy/degraded/down/unknown/stale → Carbon icon + text label + support color token
- [ ] Test that the label is always present (never color only)

### FE-061 · feat(components): add `SessionStateTag`
`feat` `app` `good-first-issue` · M1 · Depends on: FE-013

- [ ] `STARTING` gray, `INCIDENT_ACTIVE` red, `RESOLVED` green, `FAILED` magenta, with readable text labels
- [ ] Type comes from the spec's session state union

---

## 10. Scenarios (M1)

### FE-062 · feat(scenarios): add `useScenarios` and the scenario list page
`feat` `scenarios` · M1 · Depends on: FE-028, FE-033, FE-054

- [ ] `useScenarios()` with `qk.scenarios.all` and 30 s `staleTime`
- [ ] `ScenariosPage` renders a `ClickableTile` per scenario (title, difficulty/time limit `Tag`s) linking to the detail
- [ ] Skeleton on first load, empty state, error state with retry
- [ ] Component test against MSW

### FE-063 · feat(scenarios): add `useScenario` and the scenario detail page
`feat` `scenarios` · M1 · Depends on: FE-062

- [ ] Shows description, time limit (formatted), list of available actions
- [ ] 404 → "Scenario not found" state with a link back to the list

### FE-064 · feat(scenarios): start a session from the detail page
`feat` `scenarios` · M1 · Depends on: FE-063

ARCHITECTURE §6.
- [ ] `useStartSession()` mutation; **Start** disabled while pending (no double start)
- [ ] 201 → navigate to `/sessions/:sessionId`
- [ ] Other errors → `InlineNotification` with the mapped message
- [ ] Mock `POST /api/sessions` returns 201 (minimal handler until FE-035)

### FE-065 · feat(scenarios): show the busy notice with a countdown on 409
`feat` `scenarios` · M1 · Depends on: FE-064

- [ ] `SESSION_BUSY` → `InlineNotification kind="info"` with "~N min" copy from `retryAfterSeconds`
- [ ] Carbon `ProgressBar` counting down; the countdown is announced to screen readers without spamming
- [ ] Start stays enabled for a manual retry

### FE-066 · feat(scenarios): auto-retry the start when the countdown ends
`feat` `scenarios` · M1 · Depends on: FE-065

- [ ] Retry once at 0, then at most once per minute while still busy
- [ ] Stops retrying when the user leaves the page or a start succeeds

### FE-067 · test(scenarios): cover the busy 409 flow with fake timers
`test` `scenarios` · M1 · Depends on: FE-066

CONVENTIONS §10 required test.
- [ ] 409 → notice → countdown → auto-retry → 201 → navigation to the console

---

## 11. Deploy (M1)

### FE-068 · ci(deploy): add the on-demand deploy workflow
`ci` `deploy` · M1 · Depends on: FE-010, FE-018

ARCHITECTURE §11, DECISIONS D-13. Never triggered by an agent without confirmation.
- [ ] `.github/workflows/deploy.yml` on `workflow_dispatch`: install → test → build with `VITE_*` from repo **variables**
- [ ] AWS credentials from secrets (Learner Lab: key, secret, session token)
- [ ] `assets/` synced with `max-age=31536000,immutable`; the rest with `no-cache` and `--delete`
- [ ] CloudFront invalidation of `/index.html` and `/`
- [ ] `concurrency` group so two deploys can't overlap

### FE-069 · docs(deploy): document deploy variables and secrets
`docs` `deploy` · M1 · Depends on: FE-068

- [ ] README section listing every repo variable (`VITE_*`, `SITE_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`) and secret, and where each comes from (infra Terraform outputs)
- [ ] Steps to refresh Learner Lab credentials before a deploy

### FE-070 · chore(deploy): first deploy to CloudFront and smoke check
`chore` `deploy` `blocked-cross-repo` · M1 · Depends on: FE-068, FE-056

Blocked by: infra (bucket, distribution, Cognito callback/logout URLs, DECISIONS O-01/D-14).
- [ ] Landing loads at the CloudFront URL; sign in and sign out work
- [ ] Deep link reload on `/scenarios` works (SPA fallback); an `/api/...` 404 is still JSON
- [ ] Findings recorded in ARCHITECTURE §12 if anything differs

---

## 12. Incident console (M2)

### FE-071 · feat(incident): add incident helpers `isTerminal` and `actionLabel`
`feat` `incident` `good-first-issue` · M2 · Depends on: FE-021

- [ ] `isTerminal(state)` for `RESOLVED`/`FAILED`
- [ ] `actionLabel(action)` → "Scale orders to 2", "Restart worker", "Acknowledge"
- [ ] Unit tests

### FE-072 · feat(incident): add `useSession` with 5 s polling
`feat` `incident` · M2 · Depends on: FE-028, FE-071, FE-035

- [ ] `qk.sessions.detail(id)`, `refetchInterval` returns `false` once terminal
- [ ] Test with fake timers: polls while active, stops at terminal

### FE-073 · feat(incident): add `useDashboard` with 2 s polling
`feat` `incident` · M2 · Depends on: FE-072

- [ ] `qk.sessions.dashboard(id)`, every 2 s while non-terminal, `refetchIntervalInBackground: false`
- [ ] Keeps the previous snapshot during refetches (no flicker, no spinner on poll)

### FE-074 · feat(incident): build the console page layout and console/result switch
`feat` `incident` · M2 · Depends on: FE-072, FE-073

DECISIONS D-17.
- [ ] `IncidentConsolePage` reads `sessionId`, renders the Grid layout from ARCHITECTURE §5 with skeletons
- [ ] Renders `ResultView` when the session is terminal, console otherwise
- [ ] 404/403 session → error state (never show another user's session)

### FE-075 · feat(incident): add the console header
`feat` `incident` · M2 · Depends on: FE-074, FE-061

- [ ] Scenario title, `SessionStateTag`, timer slot, **Abandon** button slot

### FE-076 · feat(incident): add the `IncidentTimer`
`feat` `incident` · M2 · Depends on: FE-058

- [ ] `mm:ss` since `faultInjectedAt`, ticking every second via `setInterval` in an effect
- [ ] Shows `--:--` before the fault; freezes at terminal; monospace
- [ ] Not announced every second by screen readers (`aria-live="off"`, accessible label)
- [ ] Unit test with fake timers

### FE-077 · feat(incident): show the "Monitoring…" notice before the fault
`feat` `incident` `good-first-issue` · M2 · Depends on: FE-074

- [ ] `STARTING` → `InlineNotification` "Monitoring… the incident will begin shortly"
- [ ] Disappears when the state becomes `INCIDENT_ACTIVE`

### FE-078 · feat(incident): add `ServiceTile`
`feat` `incident` · M2 · Depends on: FE-060

- [ ] Name, `StatusIndicator`, `ready/desired` replicas, latency (monospace); compact tile
- [ ] Props only, no data fetching; component test

### FE-079 · feat(incident): add the expandable `PodTable`
`feat` `incident` · M2 · Depends on: FE-078

- [ ] Expanding a tile shows a `size="sm"` DataTable: name, phase, ready, restarts, age
- [ ] Rows keyed by `pod.name`; expand toggle is keyboard reachable with `aria-expanded`

### FE-080 · feat(incident): add the `EventTimeline`
`feat` `incident` · M2 · Depends on: FE-059

- [ ] Last 20 events, newest first, relative time + monospace timestamp
- [ ] Keyed by `ts + type`; event text rendered as plain text

### FE-081 · feat(incident): compute which actions are enabled
`feat` `incident` · M2 · Depends on: FE-071

Pure function, ARCHITECTURE §5.
- [ ] Only actions in `scenario.availableActions`; targets from dashboard services
- [ ] `STARTING` → only Acknowledge; terminal → none; pending action → disabled
- [ ] Unit tests for each rule

### FE-082 · feat(incident): add `useSendAction` with a "queued" toast
`feat` `incident` · M2 · Depends on: FE-052, FE-071, FE-036

- [ ] `POST /api/sessions/:id/actions`; 202 → toast "Action queued: Scale orders to 2"
- [ ] No optimistic dashboard update (DECISIONS D-08)

### FE-083 · feat(incident): add the action panel with Acknowledge
`feat` `incident` · M2 · Depends on: FE-081, FE-082

- [ ] `ActionPanel` renders the enabled actions; Acknowledge sends immediately (no modal)

### FE-084 · feat(incident): add Restart deployment with target and confirm modal
`feat` `incident` · M2 · Depends on: FE-083

- [ ] `Dropdown` of target services (labelled), Carbon danger `Modal` to confirm
- [ ] Focus returns to the trigger after closing

### FE-085 · feat(incident): add the Scale deployment modal
`feat` `incident` · M2 · Depends on: FE-083

- [ ] `ScaleModal` with target `Dropdown` and `NumberInput` limited to 1–3 (labelled, invalid state shown)
- [ ] Confirm disabled until valid

### FE-086 · feat(incident): lock an action until the next snapshot or 5 s
`feat` `incident` · M2 · Depends on: FE-083

- [ ] After a 202, that action's button is disabled until a newer snapshot arrives or 5 s pass
- [ ] Unit test with fake timers

### FE-087 · feat(incident): handle action error codes
`feat` `incident` · M2 · Depends on: FE-082, FE-029

- [ ] `ACTION_NOT_ALLOWED` → error toast with mapped copy
- [ ] `SESSION_NOT_ACTIVE` → refetch the session (the view switches to the result)
- [ ] Tests per code

### FE-088 · feat(incident): add `useLogs` and the logs panel
`feat` `incident` · M2 · Depends on: FE-074, FE-037

- [ ] Service `Dropdown` + **View logs** → passive `Modal` (or side panel) with `CodeSnippet type="multi"`
- [ ] Fetched on open and on **Refresh** only (no polling); loading and error states
- [ ] Logs rendered as plain text

### FE-089 · feat(incident): add Abandon with confirmation
`feat` `incident` · M2 · Depends on: FE-075, FE-037

- [ ] `useAbandon()`; danger `Modal` → `POST …/abandon` → keep polling until `FAILED`
- [ ] Button disabled while pending and when terminal

### FE-090 · feat(incident): show the "Live data delayed" warning
`feat` `incident` · M2 · Depends on: FE-073

- [ ] Shown when `stale: true` or 3 dashboard failures in a row; last snapshot stays visible
- [ ] Clears on the next good snapshot

### FE-091 · feat(incident): announce service health changes politely
`feat` `incident` `a11y` · M2 · Depends on: FE-078

CONVENTIONS §8.
- [ ] One `aria-live="polite"` region: "orders is now down/healthy", only on change, throttled
- [ ] Pure diff function (previous vs next snapshot) with unit tests

### FE-092 · feat(incident): build the `ResultView`
`feat` `incident` · M2 · Depends on: FE-074, FE-080, FE-058

- [ ] Outcome (Resolved / Failed + reason), score, TTD, TTR, wrong actions, actions count, full timeline
- [ ] **Try again** → scenario detail; **See your stats** → `/stats`
- [ ] Focus moves to the result heading when the view switches

### FE-093 · feat(incident): invalidate history, stats and leaderboard when a session ends
`feat` `incident` · M2 · Depends on: FE-072

- [ ] On the transition to terminal, invalidate `qk.me.sessions`, `qk.me.stats()`, `qk.leaderboard()` once

### FE-094 · test(incident): cover the console happy path
`test` `incident` · M2 · Depends on: FE-092, FE-085, FE-036

- [ ] With the simulator and fake timers: STARTING notice → incident → acknowledge → scale orders to 2 → Resolved result with score

### FE-095 · test(incident): cover the stale data warning
`test` `incident` · M2 · Depends on: FE-090

- [ ] `stale: true` shows the warning; 3 failures show it; recovery hides it

### FE-096 · feat(app): add the "Return to incident" banner
`feat` `app` `incident` `blocked-cross-repo` · M2 · Depends on: FE-048, FE-072

Blocked by: DECISIONS O-03 (how to find the active session).
- [ ] Shell banner with a link when the user has a non-terminal session; hidden on that session's page
- [ ] Decision recorded in DECISIONS.md

### FE-097 · chore(incident): verify the console against the deployed backend
`chore` `incident` `blocked-cross-repo` · M2 · Depends on: FE-094, FE-070

Blocked by: backend deployed behind CloudFront.
- [ ] Bump `BACKEND_REF`, regenerate types, fix type errors
- [ ] Full run on CloudFront: start → resolve; note any contract gaps as backend requests

---

## 13. History (M3)

### FE-098 · feat(history): add `useMySessions` with cursor pagination
`feat` `history` · M3 · Depends on: FE-028, FE-039

- [ ] `useInfiniteQuery` on `qk.me.sessions`, `limit=20`, `getNextPageParam` from the cursor
- [ ] `refetchOnWindowFocus: true`

### FE-099 · feat(history): build the history table
`feat` `history` · M3 · Depends on: FE-098, FE-061, FE-058, FE-059

- [ ] `size="sm"` DataTable: date, scenario, outcome tag, score, TTD, TTR (newest first)
- [ ] `DataTableSkeleton` on first load; error state with retry

### FE-100 · feat(history): add "Load more"
`feat` `history` `good-first-issue` · M3 · Depends on: FE-099

- [ ] Button loads the next page; hidden when there's no cursor; disabled while loading

### FE-101 · feat(history): open the result view from a row
`feat` `history` · M3 · Depends on: FE-099

- [ ] Row click and Enter on the row link open `/sessions/:id`
- [ ] Empty state with a link to Scenarios when there are no sessions

---

## 14. Stats (M3)

### FE-102 · chore(stats): install Carbon Charts
`chore` `stats` · M3 · Depends on: FE-013

- [ ] `@carbon/charts-react` installed; its CSS imported once in `main.tsx`
- [ ] Carbon packages on matching majors

### FE-103 · feat(stats): add the `toScoreSeries` mapper
`feat` `stats` · M3 · Depends on: FE-021

- [ ] Pure function: API rows → `{ group, date, value }[]`, sorted by date
- [ ] Unit tests (empty, unsorted, nulls)

### FE-104 · feat(stats): add the `toTtdTtrSeries` mapper
`feat` `stats` · M3 · Depends on: FE-021

- [ ] Pure function: API rows → `{ group: "TTD" | "TTR", key: attempt#, value: seconds }[]`
- [ ] Unit tests

### FE-105 · feat(stats): add the `useStat` hook
`feat` `stats` · M3 · Depends on: FE-028, FE-039

- [ ] `useStat(name)` with `qk.me.stats(name)`; `STATS_TIMEOUT` (504) not auto-retried

### FE-106 · feat(stats): add the score-over-time LineChart
`feat` `stats` · M3 · Depends on: FE-102, FE-103

- [ ] Time-scale x, score y, axis titles with units, `theme: "g100"`, explicit height, accessibility on

### FE-107 · feat(stats): add the TTD vs TTR GroupedBarChart
`feat` `stats` · M3 · Depends on: FE-102, FE-104

- [ ] x = attempt #, groups TTD/TTR in seconds; same option rules as FE-106

### FE-108 · feat(stats): add a "View as table" alternative for charts
`feat` `stats` `a11y` · M3 · Depends on: FE-106

- [ ] Toggle (or visually hidden table) showing the same mapped data for screen readers

### FE-109 · feat(stats): build the stats page with loading, empty and timeout states
`feat` `stats` · M3 · Depends on: FE-105, FE-106, FE-107

- [ ] Two chart tiles on the Grid
- [ ] `SkeletonPlaceholder` with "Crunching your numbers…"; empty state linking to Scenarios
- [ ] 504 `STATS_TIMEOUT` → inline error with Retry; component tests for each state

---

## 15. Leaderboard (M3)

### FE-110 · feat(leaderboard): add `useLeaderboard`
`feat` `leaderboard` · M3 · Depends on: FE-028, FE-039

- [ ] `qk.leaderboard(scenarioId)`, `limit=10`, 30 s `staleTime`, refetch on focus
- [ ] Scenario id from the scenario list (single scenario in the MVP; selectable via a search param if more appear)

### FE-111 · feat(leaderboard): build the leaderboard table
`feat` `leaderboard` · M3 · Depends on: FE-110, FE-044

- [ ] DataTable: rank, username, score, TTR, date; skeleton, empty and error states
- [ ] User's own rows marked with a "You" `Tag` (matched by `userId`, not by color only)
- [ ] Test that only own rows get the tag

---

## 16. End-to-end (M3)

### FE-112 · test(e2e): set up Playwright
`test` `e2e` · M3 · Depends on: FE-002

- [ ] `playwright.config.ts` with `E2E_BASE_URL` (default `http://localhost:5173`), Chromium only, traces on failure
- [ ] `pnpm e2e` script; reports ignored by git

### FE-113 · test(e2e): write the happy-path spec
`test` `e2e` · M3 · Depends on: FE-112, FE-094, FE-101, FE-109

ARCHITECTURE §10.
- [ ] Dev auth → start scenario → wait for incident → acknowledge → scale orders to 2 → Resolved + score → history row → stats show 2 charts
- [ ] Uses roles and labels, no CSS selectors

### FE-114 · test(e2e): support running against CloudFront with a Cognito test user
`test` `e2e` `blocked-cross-repo` · M3 · Depends on: FE-113

Blocked by: DECISIONS O-04 (test user and where its credentials live).
- [ ] Sign-in step through Cognito managed login when `E2E_BASE_URL` is remote; credentials only from env
- [ ] Manual `workflow_dispatch` job to run it

---

## 17. Polish (M4)

### FE-115 · test: cover error states per `ApiError.code` across screens
`test` `app` · M4 · Depends on: FE-087, FE-109, FE-064

CONVENTIONS §10 required tests.
- [ ] Each code in ARCHITECTURE §12 has at least one component test showing the right message

### FE-116 · chore(a11y): keyboard and screen reader pass
`chore` `a11y` · M4 · Depends on: FE-113

- [ ] Every flow in the happy path works with keyboard only; focus visible and returned after modals
- [ ] Every control has a visible label; icon-only buttons named
- [ ] Add `@axe-core/playwright` checks to the e2e for each screen

### FE-117 · chore(a11y): contrast check of custom token combinations
`chore` `a11y` `good-first-issue` · M4 · Depends on: FE-116

- [ ] Any non-default token pairing in `*.module.scss` meets WCAG AA on g100; findings fixed

### FE-118 · chore(app): layout check at 1280 px and phone width
`chore` `app` · M4 · Depends on: FE-113

DECISIONS L-09.
- [ ] Every screen usable at 1280 px; nothing breaks or scrolls horizontally on a 375 px phone
- [ ] Console columns stack below `md`

### FE-119 · chore(app): bundle size review
`chore` `app` · M4 · Depends on: FE-109

DECISIONS L-07.
- [ ] Each route is its own chunk; Carbon Charts only in the stats chunk
- [ ] Named imports only (no full icon barrels); sizes noted in the PR
- [ ] Optional: `rollup-plugin-visualizer` behind a script

### FE-120 · chore(app): frontend security review
`chore` `app` · M4 · Depends on: FE-113

CONVENTIONS §12.
- [ ] No `dangerouslySetInnerHTML` (ESLint `react/no-danger` on); external links use `rel="noopener noreferrer"`
- [ ] Tokens never logged, in URLs or query keys; nothing sensitive in `localStorage`
- [ ] Built bundle contains only public `VITE_*` values

### FE-121 · chore(app): consistent skeletons and no spinners on polls
`chore` `app` `good-first-issue` · M4 · Depends on: FE-109, FE-074

- [ ] Every first load uses a skeleton; background refetches never show a spinner or shift layout

### FE-122 · chore: align Carbon package versions and update dependencies
`chore` `setup` · M4 · Depends on: FE-119

- [ ] All `@carbon/*` on the same major; no unused dependencies; lockfile committed

### FE-123 · docs: update ARCHITECTURE and DECISIONS to match what was built
`docs` · M4 · Depends on: FE-113

- [ ] Remove **(planned)** markers for built items; record any deviation as a new decision
- [ ] Close or update open questions O-01…O-05

### FE-124 · docs: add screenshots and a demo GIF to the README
`docs` `good-first-issue` · M4 · Depends on: FE-118

- [ ] Landing, console mid-incident, result view, stats; short GIF of a full run (CV-ready)

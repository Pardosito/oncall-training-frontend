# Decisions, Limitations and Future Work

What we decided for the frontend, why, what we gave up, and what we'd do with more time.
Add a new entry whenever something is decided or changed; don't rewrite history. If a decision is replaced, mark it **Superseded by D-xx**.

**Status values:**
- **Decided**: settled.
- **Proposed**: our preferred option, but it needs another repo's owner to agree.
- **Superseded**: replaced by a later decision.

---

## 1. Decision log

| ID | Date | Decision | Status |
|---|---|---|---|
| D-01 | 2026-10-22 | Separate frontend repo; the backend's OpenAPI spec is the only API contract | Decided |
| D-02 | 2026-10-22 | React + Vite + TypeScript + React Router, as a static SPA | Decided |
| D-03 | 2026-10-22 | IBM Carbon (`@carbon/react`), **g100 dark theme**, as the only UI kit (replaces the earlier Tailwind + shadcn/ui choice) | Decided |
| D-04 | 2026-10-22 | Carbon Charts (`@carbon/charts-react`) for charts (replaces the earlier Recharts choice) | Decided |
| D-05 | 2026-10-22 | Cognito sign-in with react-oidc-context, using Cognito managed login (no custom auth forms) | Decided |
| D-06 | 2026-10-22 | openapi-typescript + openapi-fetch, used inside TanStack Query hooks | Decided |
| D-07 | 2026-10-22 | A pinned copy of `openapi.json` (by backend ref) is committed in this repo | Decided |
| D-08 | 2026-10-22 | Polling: dashboard every 2 s, session every 5 s; no optimistic updates for actions | Decided |
| D-09 | 2026-10-22 | Local dev against the real backend by default, MSW mocks as an option | Decided |
| D-10 | 2026-10-22 | Vitest + RTL + MSW for unit and component tests, plus one Playwright e2e happy path | Decided |
| D-11 | 2026-10-22 | Only public config in `VITE_*`; values come from GitHub repo variables at build time | Decided |
| D-12 | 2026-10-22 | English-only UI, no i18n library | Decided |
| D-13 | 2026-10-22 | Deploy with a GitHub Actions workflow run on demand: S3 sync with cache headers + CloudFront invalidation | Decided |
| D-14 | 2026-10-22 | SPA deep-link fallback through a CloudFront Function on the S3 behavior, not custom error responses | **Proposed** (infra) |
| D-15 | 2026-10-22 | No global state library; server state in TanStack Query, the rest in URL and local state | Decided |
| D-16 | 2026-10-22 | Sign-out through Cognito's `/logout` endpoint | Decided |
| D-17 | 2026-10-22 | The incident console and the result view share one route (`/sessions/:id`) | Decided |

---

## 2. Decisions in detail

### D-01 · Separate repo, OpenAPI as the contract
**Why:** it matches the three-repo split (backend, frontend, infra), so each part has its own CI and deploys. Generating types from the backend's spec means a contract change shows up as a TypeScript error, not a runtime bug.

### D-02 · React + Vite + React Router
**Why:** the app is a client-side SPA served as static files from S3; there's no server rendering to do. Vite gives fast dev and simple builds; React Router is the most familiar router.
**Alternatives considered:** TanStack Router (type-safe, but less familiar); Next.js static export (more framework than needed, and its server features don't apply on S3).

### D-03 · IBM Carbon, dark g100 theme
**Why:** Carbon is built for dense, data-heavy enterprise and ops tools, which is exactly what an incident console is. It ships accessible components (DataTable, Modal, Notifications, UI Shell), a token system for color, spacing and type, and a dark theme that looks like a monitoring tool. A consistent design system looks professional on a CV without us designing components.
**Trade-offs:** a larger bundle than utility CSS (mitigated with lazy routes and named imports); Sass is required; less visual freedom. Overriding Carbon internals is discouraged.
**Replaces:** Tailwind + shadcn/ui (an earlier answer in the same discussion, changed when Carbon was chosen).

### D-04 · Carbon Charts
**Why:** charts match the Carbon theme and data-viz palette automatically (`theme: "g100"`), with accessible defaults. We only need line and grouped-bar charts.
**Trade-offs:** heavier than Recharts and a less React-like API. We isolate it behind small chart components that take already-mapped data.
**Replaces:** Recharts.

### D-05 · react-oidc-context + Cognito managed login
**Why:** standard OIDC authorization code + PKCE, a small library, not tied to AWS. Cognito's managed login handles sign-up, verification and password reset, so we build and secure no auth forms.
**Alternative considered:** AWS Amplify Auth (heavier, ties the UI to Amplify's patterns).

### D-06 · openapi-typescript + openapi-fetch
**Why:** zero runtime generated code, only types plus a ~6 kB typed `fetch` wrapper. Paths, params and bodies are all type-checked. TanStack Query adds caching, polling and retries on top.
**Alternatives considered:** Orval (generates hooks, but that's more generated code to review); hand-written fetch (more boilerplate).

### D-07 · A pinned copy of the spec
**Why:** the build is reproducible and doesn't need the backend running or network access. Adopting a backend change is an explicit, reviewable step (`BACKEND_REF` bump plus regenerated types in one PR).
**Trade-off:** the copy can lag behind the backend. That's intentional: we upgrade when the frontend is ready.

### D-08 · Polling, no optimistic actions
**Why:** it matches the backend design (a snapshot refreshed every 2 s in Redis; actions are queued and return 202). Showing an action's effect only once the backend observes it is part of the training. Real incidents also have lag between "I ran the fix" and "metrics recovered".
**Trade-off:** up to about 2 s of UI latency.

### D-09 · Real backend by default, MSW as an option
**Why:** working against the real backend catches integration issues early. MSW lets UI work continue when the backend isn't running, and it powers the tests with the same handlers. Its session simulator makes every incident state reproducible, including busy, stale and failed.

### D-10 · Test strategy
**Why:** most bugs here are in state handling (polling, terminal states, error codes) and data mapping, and RTL + MSW cover those cheaply. One Playwright test proves the course's success criterion end to end ("scenario runs start to finish, charts render").

### D-11 · Public-only build config
**Why:** everything in a SPA bundle is readable by anyone. Cognito pool and client IDs are designed to be public; nothing secret goes in `VITE_*`.

### D-12 · English only
**Why:** it matches the docs and the CV goal, and avoids i18n overhead on every string.

### D-13 · On-demand deploy workflow
**Why:** Learner Lab credentials expire each session, so a deploy can only run when someone has refreshed the secrets. Hashed assets get a 1-year immutable cache; `index.html` uses `no-cache`, so a deploy only needs to invalidate `/index.html` and `/`.

### D-14 · CloudFront Function for SPA routing (Proposed, needs infra)
**Why:** deep links like `/sessions/01J…` must load `index.html`. The common fix, custom error responses (403/404 → `/index.html` with 200), applies to the **whole distribution**, so it would also turn real API 404s from `/api/*` into an HTML page with status 200 and break error handling. A viewer-request CloudFront Function on the default (S3) behavior that rewrites extension-less paths to `/index.html` avoids that.

### D-15 · No global store
**Why:** almost all state is server state (TanStack Query) or URL state. The only cross-cutting UI state is toasts, which a small context handles. A global store would add indirection for no benefit.

### D-16 · Cognito `/logout`
**Why:** Cognito doesn't support the standard OIDC `end_session_endpoint`, so `signoutRedirect()` doesn't fully sign out. Clearing the local user and redirecting to `<domain>/logout?client_id&logout_uri` ends the Cognito session too.

### D-17 · One route for console and result
**Why:** the session id is the same; the screen switches automatically when the polled state becomes terminal, with no navigation race. The result view is linkable from history.

---

## 3. Current limitations

| ID | Limitation | Impact | Mitigation now |
|---|---|---|---|
| L-01 | Only one session can run at a time (backend lock) | Users may see the busy notice and wait | Countdown + automatic retry; clear message |
| L-02 | Polling latency (≤ 2 s) and constant requests while a session is active | Not instant; some wasted requests | Paused when the tab is hidden; stops at terminal state |
| L-03 | Tokens in `sessionStorage` | Readable by any XSS on the page; sign-in is per tab | No `dangerouslySetInnerHTML`, all text escaped; short-lived access tokens |
| L-04 | The spec copy can lag behind the backend | New backend fields aren't usable until `BACKEND_REF` is bumped | Explicit upgrade PRs |
| L-05 | Stats can take a few seconds on the first load (Athena) | Slow first paint of charts | Skeletons; backend caches for 5 min |
| L-06 | Dark theme only, English only | Less inclusive | Carbon tokens make adding themes cheap later |
| L-07 | Carbon increases the bundle size | Slower first load on poor networks | Lazy routes, named imports, CloudFront caching |
| L-08 | Deploys require refreshed Learner Lab credentials | Can't deploy automatically on every merge | Manual workflow; CI doesn't need AWS |
| L-09 | Desktop-first layout | The console is cramped on phones | Grid stacks columns below `md`; not a target in the MVP |

---

## 4. Future improvements

| ID | Improvement | Helps |
|---|---|---|
| F-01 | Server-Sent Events for the dashboard (when the backend supports it) | L-02 |
| F-02 | Light theme (Carbon `white`/`g10`) with a toggle | L-06 |
| F-03 | Waiting-room UX (queue position) once the backend supports a queue | L-01 |
| F-04 | A backend-for-frontend or cookie-based session (HttpOnly) instead of tokens in the browser | L-03 |
| F-05 | Automatic spec sync PRs (a bot opens a PR when the backend publishes a new `openapi.json`) | L-04 |
| F-06 | i18n (English + Spanish) with `react-i18next` | L-06 |
| F-07 | Post-mortem view: annotated timeline of the user's actions vs. system health | Learning value |
| F-08 | Hints system and guided "first incident" tutorial | Onboarding |
| F-09 | Visual regression tests (Playwright screenshots) for key screens | UI stability across Carbon upgrades |
| F-10 | Web vitals and error reporting (e.g. a RUM tool) | Observability |
| F-11 | Responsive console layout for tablets and phones | L-09 |

---

## 5. Open questions

| ID | Question | Owner | Blocks |
|---|---|---|---|
| O-01 | Infra agrees to D-14 (CloudFront Function for SPA fallback, no custom error responses)? | Ian | Deep links in AWS |
| O-02 | Which ID-token claim holds the display name (`preferred_username`, `email`, `cognito:username`)? Must match the backend (backend O-04) | JP | User menu, leaderboard "You" |
| O-03 | Does the backend expose a way to find the user's active session (e.g. `GET /api/me/sessions?state=active`), or do we read the latest history item? | JP | "Return to incident" banner |
| O-04 | Test Cognito user for the deployed e2e: who creates it and where its credentials live (GitHub secrets) | Ian | E2E against CloudFront |
| O-05 | Is the backend repo private? `pnpm api:sync` then needs `gh` auth (a token in CI) | Both | Spec sync in CI |

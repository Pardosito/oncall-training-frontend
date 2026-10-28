# On-Call Training — Frontend · Agent Context

> Read this first. It explains what this repo is, what it is not, and the rules for working in it.
> Deeper docs:
> - `docs/ARCHITECTURE.md`: screens, routes, data flow, auth, API usage, cross-repo contracts
> - `docs/CONVENTIONS.md`: how code and UI are written here (including IBM Carbon rules)
> - `docs/DECISIONS.md`: what we decided, why, current limitations and future improvements
>
> If you change how the frontend uses a contract (routes, env vars, polling, auth), update `docs/ARCHITECTURE.md` in the same change. Add every new decision to `docs/DECISIONS.md`.

## 1. The project in one paragraph

**On-Call Training** is a web app where students and junior SDE/SREs practice handling a production incident. A user signs in and starts a **scenario**. A real (mock) distributed system runs in Kubernetes, and a fault is injected into it. In an **incident console** the user watches live service health, reads logs, diagnoses the problem and fixes it with **predefined actions** (no terminal). When the system recovers, the backend computes a score (time to detect, time to resolve, wrong actions). Users then review their history, performance charts and a leaderboard.

ITESO course project, team **Cafeinomanos**: Ian Rodríguez (infra and orchestration) and Juan Pablo González (application and data). It is also meant to be a CV-quality project.

## 2. What this repo is (and isn't)

| Repo | Contains |
|---|---|
| **`oncall-training-frontend`** (this one) | The React SPA: screens, API client, auth, mocks for local dev, unit tests and the e2e happy path. A deploy workflow that uploads the build to S3 and invalidates CloudFront. |
| `oncall-training-backend` | API + worker. Publishes `openapi/openapi.json`, **the only API contract this repo uses**. |
| `oncall-training-infra` | Terraform: S3 site bucket, CloudFront, Cognito, everything else. |

**Not in this repo:** backend logic, scoring rules, AWS resources, CloudFront configuration. If a task needs a new endpoint or field, describe it (path, shape, reason) for the backend owner and stop. Don't invent endpoints or fake them in production code.

## 3. MVP scope

In scope, all screens in English:
- **Landing / sign-in** (public): what the app is, a sign-in button (Cognito managed login, which also has sign-up).
- **Scenarios**: list and detail; a "Start" button; when another session is running (409), a busy notice with a countdown and automatic retry.
- **Incident console**: live dashboard (service health, replicas, pods, event timeline), incident timer, action panel, logs viewer, abandon. The result view appears when the session ends.
- **History**: the user's past sessions.
- **Stats**: ≥2 charts of the user's performance (from the backend's Athena-backed endpoints).
- **Leaderboard**: top scores for the scenario.
- **Per-user separation**: the UI only ever shows the signed-in user's own sessions, history and stats. The leaderboard is the only shared view.

Out of scope unless the team asks: editable profiles or settings, a light theme or theme toggle, i18n, WebSockets/SSE, a scenario editor, admin screens, a real terminal, offline support, a mobile-specific layout (it must still be usable on a laptop at 1280 px and not break on a phone).

## 4. Stack

| Concern | Choice |
|---|---|
| Language | TypeScript, `strict`, ESM |
| Package manager | **pnpm** |
| Build / dev server | **Vite** |
| UI | **React** |
| Routing | **React Router** (`createBrowserRouter`) |
| Design system | **IBM Carbon**: `@carbon/react`, **g100 (dark) theme**, Carbon grid, `@carbon/icons-react`, IBM Plex fonts; Sass (`sass-embedded`) |
| Charts | **Carbon Charts**: `@carbon/charts-react` (theme `g100`) |
| Server state | **TanStack Query** (polling via `refetchInterval`) |
| API client | **openapi-typescript** (types from `openapi/openapi.json`) + **openapi-fetch** |
| Auth | **react-oidc-context** (`oidc-client-ts`) → Cognito managed login, authorization code + PKCE |
| Env validation | zod |
| Mocks | **MSW**: in the browser (opt-in local dev) and in Node (tests) |
| Tests | **Vitest** + React Testing Library + `@testing-library/user-event`; **Playwright** for one e2e happy path |
| Lint / format | ESLint (typescript-eslint, react-hooks, jsx-a11y) + Prettier |
| CI / deploy | GitHub Actions: CI on every PR; deploy on demand (S3 sync + CloudFront invalidation) |

## 5. Commands

```bash
pnpm install
pnpm dev                    # Vite on :5173, /api proxied to http://localhost:3000 (backend)
pnpm dev:mocks              # same, but MSW answers /api in the browser (no backend needed)
pnpm test                   # Vitest (unit + component, MSW in Node)
pnpm e2e                    # Playwright happy path (needs a running stack; see ARCHITECTURE §10)
pnpm lint && pnpm typecheck
pnpm api:sync               # download openapi.json from the backend ref in openapi/BACKEND_REF
pnpm api:types              # regenerate src/api/schema.d.ts from openapi/openapi.json
pnpm build                  # → dist/
```

## 6. Repository layout

```
oncall-training-frontend/
├── AGENTS.md · CLAUDE.md · README.md
├── docs/                    ARCHITECTURE.md · CONVENTIONS.md · DECISIONS.md
├── openapi/
│   ├── openapi.json         copied from the backend at a pinned ref (committed)
│   └── BACKEND_REF          backend tag or commit SHA the copy came from
├── src/
│   ├── main.tsx             bootstraps env, mocks (opt-in), providers, router
│   ├── app/                 router.tsx · providers.tsx · AppShell.tsx (Carbon UI Shell) · NotFoundPage.tsx
│   ├── config/env.ts        zod-validated import.meta.env
│   ├── api/                 client.ts · schema.d.ts (GENERATED) · errors.ts · query-keys.ts
│   ├── auth/                oidc config · RequireAuth · useCurrentUser · sign-out helper
│   ├── features/            one folder per screen area (see CONVENTIONS §3)
│   │   ├── landing/  scenarios/  incident/  history/  stats/  leaderboard/
│   ├── components/          shared UI built on Carbon (StatusIndicator, PageHeader, states…)
│   ├── lib/                 pure helpers (formatting durations, dates)
│   ├── mocks/               MSW handlers + session simulator (browser + node)
│   ├── styles/              index.scss (Carbon g100 theme, Plex), shared Sass
│   └── test/                setup.ts, render helpers
├── e2e/                     Playwright tests
├── scripts/                 sync-openapi.ts
├── public/                  favicon, static assets
├── index.html · vite.config.ts · tsconfig*.json · .env.example
└── .github/workflows/       ci.yml · deploy.yml
```

## 7. Rules for agents

1. **Stay in scope** (§3) and **in this repo** (§2). Missing data or endpoints are a request to the backend, not a reason to fake it.
2. **Never run deploy commands** (`aws s3 sync`, CloudFront invalidations, anything touching AWS) without explicit confirmation.
3. **The API is only called through `src/api/client.ts`** with relative paths (`/api/...`). Never hardcode a host, never add CORS workarounds, never call `fetch` directly from components.
4. **Types come from the OpenAPI spec.** Don't hand-write API response types. If the spec is missing something, update `openapi/BACKEND_REF`, run `pnpm api:sync && pnpm api:types`, and never edit `schema.d.ts` by hand.
5. **Carbon first.** Use `@carbon/react` components, Carbon tokens (color, spacing, type) and Carbon icons. No other UI kit, no Tailwind, no hardcoded colors or pixel spacing. See CONVENTIONS §5.
6. **No secrets in the frontend.** Every `VITE_*` value ends up in the public bundle. Only public IDs (Cognito pool, client id, domain) go there.
7. **Never trust the UI for authorization.** Hiding a button is UX; the backend enforces access. Still, never render another user's data even if the API were to return it.
8. **Accessibility is required**: labels on every control, status never shown by color alone (icon + text), keyboard reachable actions.
9. **Tests are part of the change**: new hooks, data mapping (charts, durations) and the incident flow need tests in the same PR.
10. Follow `docs/CONVENTIONS.md`. Prefer small PRs, one concern each.

## 8. Timeline (course)

| Date | Deliverable relevant to this repo |
|---|---|
| Thu Oct 29 | App shell, auth, scenarios screens against MSW |
| Thu Nov 5 | **MVP:** start → incident console → result against the API on EKS, run with `pnpm dev` through the dev proxy, dev auth (DECISIONS D-18) |
| Thu Nov 19 | Full incident console (logs, abandon, stale data) against the deployed backend; Cognito; deployed to CloudFront |
| Thu Nov 26 | History, stats (≥2 Carbon charts) and leaderboard; Playwright happy path |

## 9. Glossary

- **Scenario**: a scripted incident the user can start (one in the MVP).
- **Session**: one attempt at a scenario. States: `STARTING` → `INCIDENT_ACTIVE` → `RESOLVED` | `FAILED`.
- **Dashboard snapshot**: what the console renders; refreshed by the backend every 2 s and polled by the SPA.
- **Action**: a fix the user applies from the action panel (`ACKNOWLEDGE`, `RESTART_DEPLOYMENT`, `SCALE_DEPLOYMENT`, …). It's queued, so its effect appears on a later poll.
- **TTD / TTR**: time to detect (fault → acknowledge) and time to resolve (fault → resolved), in seconds.

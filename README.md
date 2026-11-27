# On-Call Training · Frontend

**On-Call Training** is a web app where students and junior SDE/SREs practice handling a production incident. A small distributed system runs in Kubernetes (EKS) and a real fault is injected into it. The user diagnoses it from a live dashboard and fixes it with predefined actions. The system detects the recovery, scores the attempt (time to detect, time to resolve, wrong actions) and keeps the user's history, charts and a per-scenario leaderboard.

This repo is the **frontend**: a React single-page app built with IBM's **Carbon** design system.

| Repo | Contains |
|---|---|
| [oncall-training-infra](https://github.com/Pardosito/oncall-training-infra) | Terraform, Kubernetes manifests, Step Functions, injector, mock system |
| [oncall-training-backend](https://github.com/Pardosito/oncall-training-backend) | API + worker, scenarios, `openapi.json` (the contract this app is typed from) |
| **oncall-training-frontend** (this one) | React SPA |

ITESO *Desarrollo en la Nube* course project, Fall 2026, team **Cafeinomanos**: Ian Rodríguez and Juan Pablo González.

## What the app does

| Screen | Route | What's on it |
|---|---|---|
| **Sign in** | Cognito managed login | Carbon-styled sign-in and self sign-up (username, email verified with a code, password) |
| **Scenarios** | `/scenarios`, `/scenarios/:id` | The catalog; scenario details (time limit, available actions) and **Start**. If someone else's incident is running, a countdown shows when you can start |
| **Incident console** | `/sessions/:id` | Live service tiles (health, replicas, latency, an expandable pod table), the event timeline, the action panel (acknowledge, scale, restart), a logs panel when the scenario allows it, the incident timer and **Abandon** with confirmation. Warns when live data is delayed |
| **Result** | `/sessions/:id` | Once the session ends: resolved or failed, score, TTD, TTR, wrong actions and the event timeline |
| **History** | `/history` | Your sessions, newest first, paginated |
| **Stats** | `/stats` | Two charts: score over time, and TTD vs TTR by attempt |
| **Leaderboard** | `/leaderboard` | Top 10 per scenario, with your own rows marked |

A **"Return to incident"** banner follows you around the app while a session is running, and the profile menu holds **Sign out**.

**How it talks to the backend:** every request goes to the API through `openapi-fetch`, typed from the backend's `openapi.json`, with the Cognito access token attached. While a session is active the app polls the session every 5 s and the dashboard every 2 s, pausing when the tab is hidden and stopping once the session ends. Actions are fire-and-forget: the API queues them, and their effect shows up on a later poll.

## Tech stack

- **TypeScript**, **React 19**, **Vite**, **React Router**
- **IBM Carbon** (`@carbon/react`, Carbon Charts, IBM Plex), dark `g100` theme
- **TanStack Query** for server state and polling; **openapi-fetch** + **openapi-typescript** for a typed API client
- **oidc-client-ts** / **react-oidc-context** for Cognito (authorization code flow)
- **Zod** for config validation
- **Vitest**, Testing Library and **MSW** (mock API in tests and in the browser)
- Hosted on **S3** (website endpoint); the API is the infra repo's **API Gateway**

## Running it

Prerequisites: Node 22 (`.nvmrc`) and pnpm (`corepack enable` picks up the version in `package.json`).

```bash
pnpm install
cp .env.example .env.local      # dev auth by default

pnpm dev:mocks                  # no backend needed: MSW simulates the API and a session in the browser
pnpm dev                        # against a local backend on :3000 (its `pnpm dev:memory`, or `pnpm dev` + `pnpm dev:worker`)
```

Open http://localhost:5173. With mocks, start **Orders service is not responding**: after about 10 s `orders` goes down; scale it to 1–3 replicas and the incident resolves a few seconds later.

### Against the deployed API

The API only accepts Cognito tokens, so use Cognito sign-in (the `VITE_COGNITO_*` values in `.env.local`, from the infra repo's `make foundation-output`). The Vite dev server proxies `/api` to it:

```bash
API_PROXY_TARGET=https://<api-id>.execute-api.us-east-1.amazonaws.com VITE_AUTH_MODE=cognito pnpm dev
```

### Checks

```bash
pnpm test            # Vitest (unit + component, MSW in Node)
pnpm lint            # ESLint
pnpm typecheck       # tsc
pnpm format:check    # Prettier (pnpm format to fix)
pnpm build           # → dist/ (refuses VITE_AUTH_MODE=dev and VITE_API_MOCKS=true)
```

### Deploying

1. Refresh the Learner Lab credentials (the infra repo's `make creds`).
2. Put the production values in `.env.aws.local`: `VITE_AUTH_MODE=cognito`, the `VITE_COGNITO_*` values, `VITE_COGNITO_REDIRECT_URI` / `VITE_COGNITO_LOGOUT_URI` (the HTTPS bounce pages on the site bucket) and `VITE_API_BASE_URL` (the API Gateway URL, which doesn't change between cluster rebuilds).
3. `SITE_BUCKET=<site bucket> pnpm deploy:s3` builds with `--mode aws` and syncs `dist/` to the bucket. Hashed assets are cached for a year; `index.html` is never cached.

Every `VITE_*` variable is **public**: it ends up in the bundle. Only public IDs go there. `API_PROXY_TARGET` is read only by `vite.config.ts`. Full list: [`.env.example`](.env.example) and [docs/ARCHITECTURE.md §9](docs/ARCHITECTURE.md#9-configuration-build-time-env-vars).

### Updating the API contract

`openapi/openapi.json` is a pinned copy of the backend's spec, and `openapi/BACKEND_REF` records which backend commit it came from. To adopt a newer backend: copy its `openapi/openapi.json`, write the commit to `BACKEND_REF`, run `pnpm api:types`, and fix any type errors.

## Limitations

- **Plain HTTP.** The Learner Lab doesn't allow CloudFront, so the site is served from the S3 website endpoint over HTTP. Browsers only offer Web Crypto on HTTPS, so PKCE is off and the sign-in code reaches the app unencrypted. Cognito's redirects go through small HTTPS bounce pages on the same bucket. The API itself is HTTPS.
- **Tokens in `sessionStorage`.** Any XSS could read them, and sign-in is per tab. The app never renders raw HTML, and access tokens are short-lived.
- **Polling.** The dashboard is up to about 2 s behind, and the app makes steady requests during an incident.
- **One incident at a time** (a backend limit). Users may have to wait for the countdown.
- **The spec copy can lag the backend.** New backend fields aren't usable until `BACKEND_REF` is bumped.
- **Dark theme only, English only, desktop first.** The console is cramped on phones.
- **Stats cover the newest 500 attempts**, and the result timeline shows the last 20 events.

**Future work:** HTTPS with CloudFront; Server-Sent Events instead of polling; HttpOnly-cookie sessions instead of browser tokens; a light theme and Spanish; a responsive console; a post-mortem view and guided first incident; Playwright end-to-end and visual tests. Details in [docs/DECISIONS.md](docs/DECISIONS.md).

## Repository layout

```
src/
  app/            shell, routes, header, profile menu, active-session banner
  auth/           Cognito provider, dev auth, RequireAuth, callback
  api/            typed client, query keys, error mapping, generated schema.d.ts
  features/       scenarios · incident · history · stats · leaderboard
  components/     shared UI (page header, states, toasts, status indicator)
  mocks/          MSW handlers and the in-browser session simulator
  config/ · lib/ · styles/ · test/
public/auth/      Cognito HTTPS bounce pages (callback, signed-out)
openapi/          pinned backend spec + BACKEND_REF
scripts/          S3 deploy, generated-file header
```

## Documentation

| Read | For |
|---|---|
| [AGENTS.md](AGENTS.md) | Scope, stack, rules for contributors |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Routes and screens, auth, the incident console, polling, API client, configuration, deploy, cross-repo contracts |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | Code style, Carbon usage, data fetching, testing |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decisions and why, limitations, future improvements |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Issues by milestone |

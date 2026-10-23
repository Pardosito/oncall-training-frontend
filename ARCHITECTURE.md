# Frontend Architecture

Living document. It describes how the SPA is put together and every contract it depends on.
Items marked **(planned)** aren't built yet. Items marked **(cross-repo)** depend on another repo; change them only together with that repo's owner.

## 1. Where the frontend sits

```
Browser ── https://<cloudfront-domain> ──► CloudFront
                                            ├── /*      → S3 site bucket (this repo's dist/)
                                            └── /api/*  → ALB → backend api (EKS)
Browser ── redirect ──► Cognito managed login (sign-in / sign-up) ── redirect back ──► /callback
```

- The SPA and the API share **one origin**, so there's no CORS. All API calls use relative `/api/...` URLs.
- In local dev, Vite serves the SPA on `:5173` and proxies `/api` to the backend on `:3000`, which gives the same single-origin behavior.

## 2. App structure

```
main.tsx
 └─ loads env (zod) → optionally starts MSW → renders <Providers><RouterProvider/></Providers>

Providers (outermost → innermost)
 ├─ <Theme theme="g100">          Carbon dark theme for the whole app
 ├─ <AuthProvider>                 react-oidc-context (Cognito)
 ├─ <QueryClientProvider>          TanStack Query
 └─ <ToastProvider>                app-level Carbon ToastNotifications (own small context)

Router
 └─ AppShell (Carbon UI Shell: Header, HeaderNavigation, user menu)
     ├─ public routes
     └─ <RequireAuth> → protected routes
```

## 3. Routes and screens

| Path | Access | Screen | Main Carbon pieces |
|---|---|---|---|
| `/` | public | **Landing**: what the app is, how it works (3 steps), "Sign in" button. Signed-in users are redirected to `/scenarios`. | Grid, Tile, Button |
| `/callback` | public | Finishes the OIDC sign-in, then navigates to the stored return path (default `/scenarios`). | Loading |
| `/scenarios` | auth | **Scenario list** (one in the MVP) | ClickableTile, Tag |
| `/scenarios/:scenarioId` | auth | **Scenario detail**: description, time limit, available actions; **Start** button; busy notice on 409 | Button, InlineNotification, ProgressBar (countdown) |
| `/sessions/:sessionId` | auth | **Incident console** while `STARTING`/`INCIDENT_ACTIVE`; **Result view** once `RESOLVED`/`FAILED` | see §5 |
| `/history` | auth | **History**: the user's sessions, newest first, paginated | DataTable, Pagination, Tag |
| `/stats` | auth | **Stats**: two Carbon charts (§7) | Grid, Tile, LineChart, GroupedBarChart |
| `/leaderboard` | auth | **Leaderboard**: top 10 for the scenario; the user's own rows highlighted | DataTable |
| `*` | any | 404 | |

Header navigation: Scenarios · History · Stats · Leaderboard. The user menu shows the username and **Sign out**.
If the user has an active session, a **"Return to incident"** banner shows in the shell. The frontend learns about it from the start response or the most recent history item in a non-terminal state.

## 4. Auth (Cognito via react-oidc-context)

- `react-oidc-context` wraps `oidc-client-ts`. Settings:
  - `authority = https://cognito-idp.<region>.amazonaws.com/<userPoolId>`
  - `client_id`
  - `redirect_uri = <origin>/callback`
  - `response_type = "code"` (PKCE is automatic)
  - `scope = "openid email profile"`
- **Sign in**: `auth.signinRedirect({ state: { returnTo } })`. Cognito's managed login page also offers **sign up** and **forgot password**, so the app has no forms for those.
- **Tokens**: `oidc-client-ts` keeps the user in `sessionStorage` (default). `automaticSilentRenew` uses the refresh token. The API client attaches the **access token**: `Authorization: Bearer <access_token>`.
- **Sign out**: Cognito doesn't implement the standard OIDC `end_session_endpoint`. Sign out is:
  1. `auth.removeUser()`
  2. `window.location.assign(`${VITE_COGNITO_DOMAIN}/logout?client_id=…&logout_uri=${origin}/`)`
  3. clear the TanStack Query cache
  This is wrapped in `auth/sign-out.ts`. **(cross-repo)** `logout_uri` must be registered on the Cognito app client.
- **`RequireAuth`**: if the user isn't authenticated, it stores the current path and calls `signinRedirect`; while auth is loading, it shows a Carbon `Loading`.
- **401 from the API**: the client tries one silent renew. If that fails, it clears the user and redirects to sign-in.
- **Identity in the UI**: `useCurrentUser()` returns `{ userId: sub, username }` from the ID token profile. It's used for display and for highlighting the user's own leaderboard rows. **The frontend never sends a userId to the API**; the backend takes it from the token.
- **Dev auth** (`VITE_AUTH_MODE=dev`, dev server only): skips Cognito and sends `x-dev-user: <name>` (the backend's `AUTH_MODE=dev`). The build fails if `VITE_AUTH_MODE=dev` is set in a production build.

## 5. Incident console (`features/incident`)

The core screen. Everything comes from two polled queries plus a few mutations.

| Data | Endpoint | Polling |
|---|---|---|
| Session | `GET /api/sessions/:id` | every 5 s while non-terminal; stops when `RESOLVED`/`FAILED` |
| Dashboard snapshot | `GET /api/sessions/:id/dashboard` | **every 2 s** while non-terminal; paused when the tab is hidden (`refetchIntervalInBackground: false`) |
| Logs | `GET /api/sessions/:id/logs?service=` | on demand (when the logs panel opens or "Refresh" is clicked) |

Layout (Carbon Grid, 16 columns at `lg`):

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Scenario title · State tag · Incident timer (mm:ss since fault) · [Abandon]  │
├────────────────────────────────────────────────┬──────────────────────────────┤
│ Service tiles (one per service)                │ Action panel                 │
│  gateway  ● Healthy   1/1 ready   12 ms        │  [Acknowledge]               │
│  orders   ✖ Down      0/2 ready                │  Restart deployment ▾ target │
│  worker   ▲ Degraded  1/1 ready   950 ms       │  Scale deployment  ▾ + qty   │
│  (expand → pods DataTable: name, phase,        │                              │
│   ready, restarts, age)                        │ Logs: [service ▾] [View]     │
├────────────────────────────────────────────────┴──────────────────────────────┤
│ Event timeline (last 20 events, newest first, monospace timestamps)          │
└───────────────────────────────────────────────────────────────────────────────┘
```

Behavior:
- **Before the fault** (`STARTING`): a "Monitoring… the incident will begin shortly" notice. Only **Acknowledge** is enabled.
- **Actions**: `POST /api/sessions/:id/actions` returns **202**. Show a toast saying "Action queued: Scale orders to 2", and disable that action's button until the next snapshot arrives or 5 s pass. **No optimistic changes to the dashboard**: the effect appears when the backend observes it, which is part of the exercise.
- **Destructive or impactful actions** (restart, scale) open a Carbon `Modal` to confirm. The scale modal uses a `NumberInput` limited to 1–3.
- Only actions in `scenario.availableActions` are rendered, and targets come from the dashboard's services.
- **Logs** open in a side panel (`Modal` with `passiveModal` or a right-side panel) using `CodeSnippet type="multi"`. Opening logs counts as a `VIEW_LOGS` event on the backend; the UI doesn't need to do anything extra.
- **Abandon**: confirmation modal → `POST …/abandon` → keep polling until `FAILED`.
- **Stale data**: if the snapshot has `stale: true`, or the dashboard request fails 3 times in a row, show an `InlineNotification kind="warning"` saying "Live data delayed". Keep showing the last snapshot.
- **Timer**: computed on the client from `faultInjectedAt` (ticks every second with `setInterval`; it's display only, never sent to the backend).
- **Result view** (same route, terminal state): outcome (Resolved / Failed + reason), score, TTD, TTR, wrong actions, actions count, the full event timeline, and buttons "Try again" (→ scenario detail) and "See your stats".

Status display (`components/StatusIndicator`): always **icon + text + color**, using Carbon support colors:

| Health | Icon | Token |
|---|---|---|
| healthy | `CheckmarkFilled` | `$support-success` |
| degraded | `WarningAltFilled` | `$support-warning` |
| down | `ErrorFilled` | `$support-error` |
| unknown / stale | `Help` / `CircleDash` | `$icon-secondary` |

Session state tags: `STARTING` = gray, `INCIDENT_ACTIVE` = red, `RESOLVED` = green, `FAILED` = magenta (Carbon `Tag` types).

## 6. Scenario start and the busy lock

- `POST /api/sessions { scenarioId }`:
  - **201** `{ sessionId }`: navigate to `/sessions/:sessionId`.
  - **409 `SESSION_BUSY`** `{ retryAfterSeconds }`: show an `InlineNotification kind="info"` ("Another engineer is handling an incident. You can start in ~6 min."), with a countdown `ProgressBar`. Retry automatically when the countdown ends, at most once per minute after that. The Start button stays enabled for a manual retry.
  - **404**: scenario not found → error state.
- Double clicks: the Start button is disabled while the mutation is pending.

## 7. Stats, history, leaderboard

| Screen | Endpoint | Rendering |
|---|---|---|
| History | `GET /api/me/sessions?limit=20&cursor=` | `DataTable`: date, scenario, outcome tag, score, TTD, TTR; a row click opens `/sessions/:id` (result view). Cursor pagination with "Load more" (the backend uses cursors, not page numbers). |
| Stats: score over time | `GET /api/me/stats/score-over-time` | Carbon **LineChart**: x = session date (time scale), y = score |
| Stats: TTD vs TTR | `GET /api/me/stats/ttd-ttr-by-attempt` | Carbon **GroupedBarChart**: x = attempt #, groups = TTD, TTR (seconds) |
| Leaderboard | `GET /api/leaderboard/:scenarioId?limit=10` | `DataTable`: rank, username, score, TTR, date; the user's rows marked with a "You" tag |

- Each chart is a feature component that **maps API rows to Carbon Charts' data format** (`{ group, date | key, value }`) in a pure, unit-tested function (`toScoreSeries(rows)`).
- Chart options: `theme: "g100"`, explicit `height`, axis titles with units, `accessibility` on. A visually hidden data table or a "View as table" toggle is shown for screen readers.
- Empty state (no sessions yet): a Carbon empty-state tile with a link to Scenarios. Stats can take a few seconds (Athena), so show `SkeletonPlaceholder` with a "Crunching your numbers…" helper. The backend caches results for 5 min.
- 504 `STATS_TIMEOUT`: inline error with a Retry button.

## 8. API client

- `openapi/openapi.json` is a **copy** of the backend's spec at the ref in `openapi/BACKEND_REF`. `pnpm api:sync` downloads it (via `gh api` from the backend repo at that ref). `pnpm api:types` generates `src/api/schema.d.ts` with `openapi-typescript`. Both files are committed.
- `src/api/client.ts`: `createClient<paths>({ baseUrl: "" })`. The spec's paths already include `/api`, so the result is a relative same-origin URL. Middleware:
  1. adds `Authorization` from the current OIDC user (or `x-dev-user` in dev auth)
  2. adds `x-request-id` (ULID) for log correlation
  3. turns non-2xx responses into an `ApiError { status, code, message, details, requestId }` that matches the backend's error body
  4. on 401, triggers the renew/sign-in flow (§4)
- **Query hooks live in features** (`useDashboard`, `useStartSession`…) and call the typed client. Query keys come from `src/api/query-keys.ts`:
  ```ts
  qk.scenarios.all · qk.scenarios.detail(id) · qk.sessions.detail(id) · qk.sessions.dashboard(id)
  qk.me.sessions · qk.me.stats(name) · qk.leaderboard(scenarioId)
  ```
- TanStack Query defaults:
  - `staleTime: 30 s` for scenarios and leaderboard; `0` for polled queries.
  - `retry`: up to 2 for 5xx and network errors; **never** for 4xx.
  - `refetchOnWindowFocus` only for history and leaderboard.
- After a session ends, invalidate `qk.me.sessions`, `qk.me.stats(*)` and `qk.leaderboard(*)`.

### Endpoints used (from the backend's ARCHITECTURE §6)

`GET /api/scenarios` · `GET /api/scenarios/:id` · `POST /api/sessions` · `GET /api/sessions/:id` · `GET /api/sessions/:id/dashboard` · `POST /api/sessions/:id/actions` · `GET /api/sessions/:id/logs` · `POST /api/sessions/:id/abandon` · `GET /api/me/sessions` · `GET /api/me/stats/:queryName` · `GET /api/leaderboard/:scenarioId`

## 9. Configuration (build-time env vars)

All `VITE_*` values are **public** and baked into the bundle at build time. `src/config/env.ts` validates them with zod at startup and shows a clear error screen if they're invalid.

| Var | Example | Notes |
|---|---|---|
| `VITE_COGNITO_AUTHORITY` | `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbC123` | |
| `VITE_COGNITO_CLIENT_ID` | `3n4b…` | public app client, no secret |
| `VITE_COGNITO_DOMAIN` | `https://oncall-training.auth.us-east-1.amazoncognito.com` | used for logout |
| `VITE_AUTH_MODE` | `cognito` \| `dev` | `dev` only allowed with `vite dev` |
| `VITE_DEV_USER` | `alice` | dev auth username |
| `VITE_API_MOCKS` | `true` \| `false` | starts MSW in the browser (dev only) |

The CI deploy workflow takes these from GitHub repository **variables** (not secrets; they aren't secret) that the infra owner fills in from Terraform outputs.

## 10. Local development and mocks

| Mode | Command | Backend needed | Use for |
|---|---|---|---|
| **Real backend** (default) | `pnpm dev` | backend `pnpm dev` + `pnpm dev:worker` + its docker-compose (`AUTH_MODE=dev`, `MOCK_CLUSTER=fake`) | integration, realistic flows |
| **Mocks** | `pnpm dev:mocks` | no | building UI fast, demoing states |

- **MSW handlers** (`src/mocks/handlers.ts`) are typed from `schema.d.ts`, so they break at compile time when the contract changes.
- **Session simulator** (`src/mocks/simulator.ts`): an in-memory fake session that moves `STARTING` → (10 s) `INCIDENT_ACTIVE`, with `orders` down. It reacts to a scale/restart of `orders` by recovering after about 4 s and resolving with a computed score. Special mock query flags exercise edge cases: `?mock=busy` returns 409, `?mock=stale` returns stale snapshots, `?mock=fail` times the session out.
- The same handlers run in Vitest through `msw/node` (`src/test/setup.ts`).
- **Playwright e2e** (`e2e/happy-path.spec.ts`): sign in (dev auth) → start scenario → wait for incident → acknowledge → scale `orders` to 2 → see Resolved + score → history shows the session → stats render 2 charts. It runs against the local real-backend mode, or against the deployed CloudFront URL with `E2E_BASE_URL` and a test Cognito user (credentials from env, never committed).

## 11. Build and deploy

- `pnpm build` writes `dist/`. Vite hashes asset names (`assets/*.[hash].js|css`).
- `deploy.yml` runs on `workflow_dispatch` (optionally on push to `main`):
  1. checkout, install, test, build with the env vars from §9
  2. configure AWS credentials from secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`; Learner Lab credentials, refreshed each lab session)
  3. `aws s3 sync dist/assets s3://$SITE_BUCKET/assets --cache-control "public,max-age=31536000,immutable"`
  4. `aws s3 sync dist s3://$SITE_BUCKET --exclude "assets/*" --delete --cache-control "no-cache"`
  5. `aws cloudfront create-invalidation --paths /index.html /`
  `SITE_BUCKET` and `CLOUDFRONT_DISTRIBUTION_ID` are repository variables.

## 12. Contracts with other repos (cross-repo)

| What | Owner | Needed by the frontend |
|---|---|---|
| `openapi.json` | backend | Source of all API types; bump `BACKEND_REF` to adopt changes |
| Same-origin `/api/*` behavior on CloudFront | infra | No CORS; `Authorization` header forwarded; caching disabled |
| **SPA fallback via a CloudFront Function on the default (S3) behavior only**: rewrite paths without a file extension to `/index.html` | infra | Deep links like `/sessions/123` work on reload. **Don't use distribution-wide custom error responses (403/404 → index.html)**: they would also turn API 404s into `index.html` with status 200 |
| Cognito app client: callback `…/callback` and logout URL `…/` registered for both `http://localhost:5173` and the CloudFront domain; scopes `openid email profile`; refresh tokens enabled | infra | Sign-in, sign-out, silent renew |
| Cognito managed login with self sign-up enabled | infra | Sign-up without our own forms |
| Error body `{ error: { code, message, details, requestId } }` and the codes `SESSION_BUSY`, `SESSION_NOT_ACTIVE`, `ACTION_NOT_ALLOWED`, `STATS_TIMEOUT` | backend | Specific UI messages per code |

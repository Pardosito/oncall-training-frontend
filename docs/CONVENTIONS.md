# Frontend Conventions

Rules for code and UI in this repo. If one gets in the way, change it here in a PR and say why. Don't silently ignore it.

## 1. TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`, `moduleResolution: "bundler"`.
- No `any`. Use `unknown` and narrow it. If `any` is truly needed, add a one-line comment saying why.
- **API types come only from `src/api/schema.d.ts`** (generated). Derive what you need from it:
  ```ts
  import type { components } from "@/api/schema";
  type DashboardSnapshot = components["schemas"]["DashboardSnapshot"];
  ```
  Never edit `schema.d.ts` and never redeclare API shapes by hand.
- Named exports only, except where a tool requires a default (e.g. lazy route modules).
- Path alias `@/` → `src/`. Use it for anything outside the current feature folder.
- No enums; use string literal unions (most come from the spec already).

## 2. Naming

| Thing | Style | Example |
|---|---|---|
| Components and their files | PascalCase | `ServiceTile.tsx` |
| Hooks | `useX`, file named the same | `useDashboard.ts` |
| Other files | kebab-case | `query-keys.ts`, `format-duration.ts` |
| Pages | `XPage` | `IncidentConsolePage.tsx` |
| Sass modules | same as component | `ServiceTile.module.scss` |
| Tests | `*.test.ts(x)` next to the code; e2e in `e2e/*.spec.ts` | |
| Event handlers | `handleX` inside, `onX` as props | `onConfirm` |

## 3. Feature structure

Each screen area lives in `src/features/<feature>/`:

```
incident/
├── IncidentConsolePage.tsx     route component: reads params, composes pieces
├── components/                 ServiceTile, PodTable, ActionPanel, ScaleModal, LogsPanel, EventTimeline, IncidentTimer, ResultView
├── hooks/                      useSession, useDashboard, useSendAction, useAbandon, useLogs
├── lib/                        pure helpers for this feature (e.g. isTerminal, actionLabel)
└── index.ts                    exports the route element (and anything other features may use)
```

Rules:
- **Pages compose, components render, hooks fetch.** Components receive data through props and don't call the API. Data hooks are the only place that use the API client.
- Features import from other features only through their `index.ts`. Shared UI goes to `src/components/`, shared pure code to `src/lib/`.
- Keep components under ~150 lines. Split when a component does two things.
- Pure logic (formatting, mapping API rows to chart series, deciding which actions are enabled) lives in plain functions with unit tests, not inside JSX.

## 4. React

- Function components and hooks only.
- **State:**
  - server state → TanStack Query
  - URL state (filters, selected scenario) → route params and search params
  - local UI state → `useState`/`useReducer`
  - cross-cutting app state (toasts) → a small context
  - No global store (no Redux, no Zustand) unless a decision says otherwise.
- `useEffect` is for synchronizing with something outside React (timers, document title), not for deriving data or fetching. Derive values during render.
- Lists need stable keys from data (`pod.name`, `event.ts + type`), never array indexes.
- Each route is lazy-loaded (`lazy: () => import(...)` in the router) to keep the first load small, since Carbon is large.
- Errors: each route has an `errorElement` with a Carbon error state; unexpected render errors don't blank the whole app.

## 5. IBM Carbon (design system)

**Setup:**
- `@carbon/react` with the **g100** theme applied globally in `src/styles/index.scss` and through `<Theme theme="g100">`.
- IBM Plex Sans and Plex Mono (via Carbon's font setup).
- `@carbon/icons-react` for icons.
- `@carbon/charts-react` for charts. Import its CSS once in `main.tsx`.
- Sass compiled with `sass-embedded`.

**Rules:**
1. **Use a Carbon component if one exists** (Button, Modal, DataTable, Tile, Tag, Notification, Loading, Skeleton*, NumberInput, Dropdown, CodeSnippet, UI Shell…). Wrap it in `src/components/` only to add project-specific behavior.
2. **No hardcoded design values.** Colors, spacing, type and motion come from Carbon tokens.
   ```scss
   @use "@carbon/react/scss/spacing" as *;
   @use "@carbon/react/scss/theme" as *;
   @use "@carbon/react/scss/type" as *;
   .tile { padding: $spacing-05; background: $layer-01; color: $text-primary; }
   .podName { @include type-style("code-01"); }
   ```
   No hex values, no raw `px` for spacing, no inline `style={{ color: … }}`.
3. **Layout** uses Carbon `Grid` / `Column` (16-column at `lg`) and spacing tokens. Use `Stack` for vertical rhythm.
4. **Styling** happens in CSS Modules (`*.module.scss`) that use tokens. Don't override Carbon's internal class names (`.cds--…`) except in `src/styles/overrides.scss`, with a comment saying why.
5. **Ops-console feel** within Carbon:
   - dense layouts (`size="sm"` tables, compact tiles)
   - monospace (`code-01`/`code-02`) for pod names, timestamps, durations and logs
   - status shown with support colors plus icons
   - motion kept minimal (no decorative animation during an incident)
6. **Status is never color-only**: use `StatusIndicator` (icon + label + color) and Carbon `Tag` with text.
7. **Notifications:**
   - `InlineNotification` for page-level state (busy, stale data, errors)
   - `ToastNotification` (bottom-right, auto-dismiss 5 s) for action feedback
   - `Modal` for confirmations; avoid browser `alert`/`confirm`
8. **Loading:** skeletons (`SkeletonText`, `DataTableSkeleton`, `SkeletonPlaceholder`) for first loads. Don't show spinners on every poll; polls refresh silently.
9. **Charts:** always `theme: "g100"`, an explicit `height`, axis titles with units, and Carbon's data-viz palette (don't pass custom colors).
10. Keep Carbon packages on the **same major version**, and upgrade them together.

## 6. Data fetching (TanStack Query + openapi-fetch)

- One hook per endpoint use, named by intent: `useDashboard(sessionId)`, `useStartSession()`.
- Always use keys from `src/api/query-keys.ts`; never inline arrays.
- Polling only through `refetchInterval` (a function that returns `false` when the session is terminal). Never `setInterval` + fetch.
- Mutations invalidate exactly the keys they affect (listed in ARCHITECTURE §8). Don't call `queryClient.clear()` except on sign-out.
- Handle errors by `ApiError.code` (`SESSION_BUSY`, `ACTION_NOT_ALLOWED`…), never by matching message text.
- No optimistic updates for incident actions (ARCHITECTURE §5). Optimistic updates elsewhere need a decision entry.

## 7. Auth

- Only `src/auth/` imports `react-oidc-context` / `oidc-client-ts`. The rest of the app uses `useCurrentUser()`, `<RequireAuth>` and `signOut()`.
- Don't read tokens in components. The API client middleware attaches them.
- Never log tokens, and never put them in URLs or query keys.

## 8. Accessibility

- `eslint-plugin-jsx-a11y` is on.
- Every input has a visible label (Carbon `labelText`), and icon-only buttons have `iconDescription`.
- Actions are reachable by keyboard; modals trap focus (Carbon does) and return focus to their trigger.
- Polling updates must not steal focus. Use one `aria-live="polite"` region for "service X is now healthy/down" announcements, throttled.
- Charts have a text alternative (a table toggle or visually hidden table).
- Check the contrast of any custom combination against the g100 tokens.

## 9. Formatting and time

- Durations go through `formatDuration(seconds)` → `2m 05s`; the incident timer shows `mm:ss`.
- Dates go through `Intl.DateTimeFormat` in the user's locale and time zone (relative times like "3 min ago" only in the event timeline).
- Scores are integers with `Intl.NumberFormat`.
- Every UI string is in English. Keep strings next to their component; no i18n library (DECISIONS F-06 if that changes).

## 10. Testing

- **Vitest + React Testing Library + user-event**, with **MSW (node)** for API calls. The shared handlers come from `src/mocks/`.
- Test behavior the way a user sees it: query by role and label (`getByRole("button", { name: /scale/i })`), not by class names or test ids (test ids only as a last resort).
- **Required tests:**
  - pure mappers and formatters (`toScoreSeries`, `formatDuration`, enabled-actions logic)
  - the incident console happy path (fault → action → resolved result view)
  - the busy 409 flow
  - stale data warning
  - auth guard redirect
  - error states per `ApiError.code`
- Use fake timers (`vi.useFakeTimers`) for polling and countdown tests.
- **Playwright**: one `happy-path.spec.ts` (ARCHITECTURE §10). Add more only for flows that broke in production.
- No snapshot tests of whole pages; they break on every Carbon upgrade and catch nothing.

## 11. Lint, format, build

- ESLint: typescript-eslint (`recommended-type-checked`), `react-hooks`, `jsx-a11y`, `no-console` (warn). Prettier with `printWidth: 100`.
- CI (`ci.yml`) runs:
  - install
  - `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
  - a check that `schema.d.ts` matches `openapi.json` (regenerate and diff)
- Bundle size: lazy routes, named imports from Carbon (`import { Button } from "@carbon/react"`), no barrel re-exports of all icons. Check `vite build` output when adding a dependency.
- Add a dependency only if it saves real work; `pnpm-lock.yaml` is always committed.

## 12. Security

- Only public values in `VITE_*` (DECISIONS D-11).
- Never use `dangerouslySetInnerHTML`. Logs and event text are rendered as plain text (`CodeSnippet` and text nodes escape them).
- External links use `rel="noopener noreferrer"`.
- Don't store anything sensitive in `localStorage`. The OIDC user lives in `sessionStorage` (library default).

## 13. Git and PRs

- Branches from `main`: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `test/…`. Short-lived.
- Conventional Commits: `feat(incident): add scale confirmation modal`.
- PR description: what, why, how it was tested, a **screenshot or short GIF for UI changes**, and whether `BACKEND_REF` changed.
- CI green before merge; the other teammate reviews changes to auth, the API client or deploy.
- Docs move with code: contract usage goes in `ARCHITECTURE.md`, decisions in `DECISIONS.md`.

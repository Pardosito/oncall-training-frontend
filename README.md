# On-Call Training · Frontend

React SPA for **On-Call Training**: practice handling a production incident on a real (mock) system running in Kubernetes. Start a scenario, watch live service health, fix the fault from predefined actions, get a score.

Part of three repos: **frontend** (this one), [`oncall-training-backend`](https://github.com/Pardosito/oncall-training-backend) (API + worker, owns `openapi.json`) and [`oncall-training-infra`](https://github.com/Pardosito/oncall-training-infra) (Terraform, Kubernetes).

Stack: TypeScript, Vite, React, React Router, IBM Carbon (g100), TanStack Query, openapi-fetch, MSW, Vitest. Details in [`AGENTS.md`](AGENTS.md) and [`docs/`](docs/).

## Prerequisites

- Node 22 (`.nvmrc`) and pnpm 12 (`packageManager` in `package.json`; `corepack enable` picks it up)

## Run it

```bash
pnpm install
cp .env.example .env.local      # dev auth by default

pnpm dev:mocks                  # no backend needed: MSW + a simulated session in the browser
pnpm dev                        # against the backend on :3000 (its `pnpm dev` + `pnpm dev:worker`)
```

Open http://localhost:5173. With mocks, start **Orders service is not responding**: after ~10 s `orders` goes down; scale it to 1–3 replicas and it resolves a few seconds later.

### Nov 5 MVP demo (API on EKS)

The SPA runs from `pnpm dev` and reaches the API through the Vite proxy, so it stays same-origin (no CORS, no host in `src/`; DECISIONS D-18):

```bash
API_PROXY_TARGET=http://<alb-dns> VITE_AUTH_MODE=dev VITE_DEV_USER=<name> pnpm dev
```

The ALB only accepts the demo machines' IPs (infra INF-138). Check yours with `curl ifconfig.me` the day before.

## Commands

```bash
pnpm test            # Vitest (unit + component, MSW in Node)
pnpm lint            # ESLint
pnpm typecheck       # tsc
pnpm format          # Prettier
pnpm api:types       # regenerate src/api/schema.d.ts from openapi/openapi.json
pnpm build           # → dist/ (refuses VITE_AUTH_MODE=dev and VITE_API_MOCKS=true)
```

## Configuration

Every `VITE_*` variable is **public**: it ends up in the bundle. See [`.env.example`](.env.example) and ARCHITECTURE §9. `API_PROXY_TARGET` is read only by `vite.config.ts` and never reaches the bundle.

## API contract

`openapi/openapi.json` is a pinned copy of the backend's spec; `openapi/BACKEND_REF` says which. It's pinned to backend commit `c94cd07` on `feat/m1-platform`, which isn't merged yet; re-pin to the merge commit if that PR is squash-merged (DECISIONS D-19). To adopt a backend version: copy its `openapi/openapi.json`, write the ref to `BACKEND_REF`, run `pnpm api:types`, fix type errors.

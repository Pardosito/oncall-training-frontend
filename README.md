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

### Against the API on EKS

The API is infra's HTTP API (`terraform output api_url`, D-27). It only accepts Cognito tokens, so use Cognito sign-in (the `VITE_COGNITO_*` values in `.env.local`); the Vite proxy keeps it same-origin:

```bash
API_PROXY_TARGET=https://<api-id>.execute-api.us-east-1.amazonaws.com VITE_AUTH_MODE=cognito pnpm dev
```

The deployed site (`pnpm deploy:s3`) calls the same URL through `VITE_API_BASE_URL`. Accounts come from infra's `make users` (no self sign-up).

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

`openapi/openapi.json` is a pinned copy of the backend's spec; `openapi/BACKEND_REF` says which. It's pinned to backend commit `5ff88e6`, the backend's `main` after the MVP loop merge (PR #132) (DECISIONS D-19). To adopt a backend version: copy its `openapi/openapi.json`, write the ref to `BACKEND_REF`, run `pnpm api:types`, fix type errors.

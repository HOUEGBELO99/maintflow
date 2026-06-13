# Deployment — MaintFlow

Targets (per `CLAUDE.md` §13): **API** → Railway / Render / Fly.io · **Web** →
Vercel · **DB/Auth/Storage** → Supabase Cloud · **Redis** → Upstash.

The monorepo is pnpm + Turborepo. `packages/shared` must be built before the
API and web (both consume its `dist/`). `apps/mobile` (Flutter) is not part of
this deployment.

## 0. Prerequisites (you provide)

- A **git remote** (e.g. GitHub) — providers deploy from a connected repo.
  This repo currently has **no remote**.
- Accounts: Supabase (prod project), Upstash (Redis), Railway/Render/Fly
  (API), Vercel (web).
- The branch merged to **`main`** (prod deploys track main; CI must be green).

## 1. Supabase (prod project)

1. Create the project; note the **Project URL**, **anon key**, **service-role
   key**, and **JWT secret** (Settings → API).
2. Storage → create the bucket **`maintflow-files`** (private).
3. Connection strings (Settings → Database):
   - `DATABASE_URL` = the **pooled** URL (port `6543`) — used at runtime.
   - `DIRECT_URL` = the **direct** URL (port `5432`) — used for migrations.
4. Apply migrations + seed (from a machine with the prod URLs in env):
   ```bash
   pnpm --filter @maintflow/api exec prisma migrate deploy   # uses DIRECT_URL
   pnpm --filter @maintflow/api exec tsx prisma/seed.ts       # optional demo data
   ```

## 2. API (Railway / Render / Fly)

Monorepo build (root install builds shared first):

- **Install:** `pnpm install --frozen-lockfile`
- **Build:** `pnpm --filter @maintflow/api db:generate && pnpm build --filter @maintflow/api...`
  (the `...` also builds `@maintflow/shared`)
- **Release / pre-start:** `pnpm --filter @maintflow/api exec prisma migrate deploy`
- **Start:** `node apps/api/dist/main.js`

The API reads **`PORT`** from the platform (falls back to `API_PORT`/4000) and
binds `0.0.0.0`. CORS is locked to **`WEB_URL`** — set it to the deployed web
origin.

Required env (validated at boot — the app refuses to start if any is missing,
see `apps/api/src/config/configuration.ts`):

| var | value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase pooled (6543) |
| `DIRECT_URL` | Supabase direct (5432) |
| `SUPABASE_URL` | project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (server only) |
| `SUPABASE_JWT_SECRET` | JWT secret |
| `SUPABASE_STORAGE_BUCKET` | `maintflow-files` |
| `REDIS_URL` | Upstash connection string |
| `JWT_ISSUER` | `https://<project>.supabase.co/auth/v1` |
| `ACCESS_TOKEN_AUDIENCE` | `authenticated` |
| `WEB_URL` | deployed web origin (for CORS) |

> No `Dockerfile` yet — Railway (Nixpacks) and Render build the monorepo from
> the commands above. For Fly.io (Docker-based) a `Dockerfile` is needed; ask
> and one will be added + verified.

## 3. Web (Vercel)

- **Root Directory:** `apps/web` (Vercel installs from the repo root, so the
  pnpm workspace + `@maintflow/shared` resolve).
- **Build:** default (`next build`); **Install:** default pnpm.
- Env (the `NEXT_PUBLIC_*` are exposed to the browser — keep non-secret):

| var | value |
|---|---|
| `NEXT_PUBLIC_API_URL` | deployed API base (e.g. `https://api.…`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

After both are up, set the API's `WEB_URL` to the Vercel domain and redeploy
the API so CORS allows it.

## 4. Post-deploy smoke check

- `GET <api>/api/v1/...` with a valid bearer returns 200; missing token → 401.
- Web login (Supabase) → dashboard loads (data comes through the API).
- Mobile build points at the deployed API/Supabase via `--dart-define`.

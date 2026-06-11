# MaintFlow — GMAO

Solution de **Gestion de Maintenance Assistée par Ordinateur** : une app **mobile technicien** (Flutter) et une app **web admin** (Next.js), adossées à une **API NestJS** et **Supabase**.

> 📐 Architecture, stack et best practices : voir **[CLAUDE.md](./CLAUDE.md)**.

## Stack

| Plateforme | Technologies |
|---|---|
| **Mobile** | Flutter · Riverpod · Drift (offline) · Dio · supabase_flutter · mobile_scanner · signature |
| **Web** | Next.js (App Router) · TypeScript · Tailwind/shadcn · TanStack Query · Recharts · RHF/Zod |
| **API** | NestJS · Prisma · CASL · BullMQ/Redis · Swagger · Socket.io |
| **Infra** | Supabase (Postgres + Auth + Storage) · Vercel · Railway · Upstash |

## Structure

```
maintflow/
├── apps/
│   ├── api/      → NestJS (cœur métier, RBAC, KPI)
│   ├── web/      → Next.js (admin / gestion)
│   └── mobile/   → Flutter (technicien, offline-first)
├── packages/
│   └── shared/   → types & enums TS partagés (web ↔ api)
├── docs/
├── docker-compose.yml
└── CLAUDE.md     → guide d'ingénierie (à lire)
```

## Démarrage rapide

```bash
pnpm install
cp .env.example .env          # puis renseigner Supabase, etc.
pnpm infra:up                 # Postgres + Redis (Docker)
pnpm db:migrate && pnpm db:seed
pnpm dev                      # API (:4000) + Web (:3000)
```

API docs (dev) : http://localhost:4000/docs · Web : http://localhost:3000

### Mobile

```bash
cd apps/mobile
flutter pub get
flutter run \
  --dart-define=API_URL=http://localhost:4000 \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=xxx
```

## Scripts utiles

| Commande | Effet |
|---|---|
| `pnpm dev` | API + Web en parallèle (Turborepo) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Qualité |
| `pnpm db:migrate` / `db:seed` / `db:studio` | Prisma |
| `pnpm infra:up` / `infra:down` | Docker local |

## État du scaffold

✅ Monorepo, tooling, env validé, Docker · ✅ Schéma Prisma complet (domaine GMAO) + seed + RLS
✅ API NestJS : auth JWT Supabase, RBAC CASL, module `machines` de référence
✅ Web Next.js : providers, client API typé, auth Supabase, Tailwind · ✅ Flutter : structure, thème, router, Dio
🔜 Reste à dérouler : modules métier restants, écrans web/mobile, sync offline.

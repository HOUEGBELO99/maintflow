# CLAUDE.md — MaintFlow

> Guide d'ingénierie pour ce monorepo. À lire avant toute contribution (humaine ou IA).
> Objectif : un code **cohérent, typé de bout en bout, sécurisé et testable**.
> Ce fichier fait autorité. En cas de doute, on suit ces règles plutôt qu'une habitude personnelle.

---

## 1. Vue d'ensemble

MaintFlow est une **GMAO** (Gestion de Maintenance Assistée par Ordinateur) :

- **`apps/mobile`** — Flutter/Dart, application **technicien** terrain (offline-first).
- **`apps/web`** — Next.js, application **admin/gestion** (dashboards, CRUD).
- **`apps/api`** — NestJS, **cœur métier** : logique, RBAC, KPI, jobs.
- **`packages/shared`** — types & enums TypeScript partagés (web ↔ api).
- **Supabase** — PostgreSQL + Auth + Storage.
- **Redis** — file de jobs BullMQ (préventif, escalades).

### Règle d'architecture n°1 (non négociable)

> **Les clients (web, mobile) ne parlent QU'À l'API NestJS.**
> Seule exception : l'**authentification** se fait directement contre Supabase Auth (login/refresh).
> Aucune requête métier directe vers les tables Supabase depuis le front. Toute la logique vit dans NestJS.

```
Flutter / Next.js ──HTTP──▶ NestJS ──Prisma──▶ Supabase Postgres
        └────────auth only────────▶ Supabase Auth
```

---

## 2. Flux de données & frontières

| Depuis → vers | Autorisé ? | Détail |
|---|---|---|
| Web/Mobile → NestJS | ✅ | REST `/api/v1/*` + WebSocket |
| Web/Mobile → Supabase Auth | ✅ | login, refresh, logout |
| Web/Mobile → Supabase DB | ❌ | **interdit** — passer par l'API |
| NestJS → Supabase (service role) | ✅ | Prisma (DB), SDK (Storage) |
| NestJS → Redis | ✅ | BullMQ |

La `service_role_key` Supabase **ne quitte jamais le serveur**. Le front n'utilise que l'`anon key`.

---

## 3. Conventions communes

- **Langue** : code, identifiants, commentaires techniques en **anglais**. Le domaine métier garde ses termes FR quand c'est le vocabulaire des prototypes (`workshop`, `fault`, `intervention`).
- **Typage strict partout** : pas de `any` (TS) implicite, `strict-casts` (Dart). Le type est la documentation.
- **Single source of truth** : les enums/types du domaine vivent dans `packages/shared` (TS) et sont **mirrorés manuellement** côté Dart (`apps/mobile/lib/data/models`). Toute évolution d'enum se répercute aux deux + au `schema.prisma`.
- **Pas de secret en dur**. Tout passe par l'environnement validé (voir §9).
- **Nommage fichiers** : `kebab-case` en TS (`machines.service.ts`), `snake_case` en Dart (`missions_screen.dart`).
- **Commits** : Conventional Commits, scope obligatoire — `feat(api): ...`, `fix(mobile): ...` (voir `commitlint.config.cjs`).
- **Branches** : `feat/...`, `fix/...`, `chore/...`. Pas de push direct sur `main`.

---

## 4. Backend — NestJS (`apps/api`)

### Structure
```
src/
  common/        guards, decorators, casl, filters, interceptors
  config/        validation d'env (zod)
  modules/
    prisma/      PrismaService global
    auth/        vérification JWT Supabase
    machines/    ← MODULE DE RÉFÉRENCE (à copier)
    faults/ interventions/ planning/ parts/ technicians/
    users/ reports/ notifications/ files/ dashboard/
```

### Règles
1. **Un module = un domaine.** Structure systématique : `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`.
2. **Le controller ne contient pas de logique.** Il valide (DTO), délègue au service, renvoie. Toute la logique métier est dans le service.
3. **Tout est multi-tenant.** Chaque requête est scopée par `siteId`, qui provient **toujours** de `@CurrentUser()`, **jamais** du body/query client. Voir `machines.service.ts`.
4. **DTO + validation obligatoires.** `class-validator` sur chaque entrée. `ValidationPipe` global est en `whitelist: true, forbidNonWhitelisted: true` : tout champ non déclaré est rejeté.
5. **Auth par défaut.** `JwtAuthGuard` est un `APP_GUARD` global. Une route publique doit être explicitement marquée `@Public()`.
6. **Autorisation par permission.** `@RequirePermission(Permission.X)` + `PermissionsGuard`. La matrice rôle→permission est dans `common/casl/permissions.ts` (copiée du prototype).
7. **Prisma uniquement via `PrismaService`.** Jamais de `new PrismaClient()`. Pas de SQL brut sauf nécessité justifiée (et alors paramétré).
8. **Erreurs = exceptions Nest** (`NotFoundException`, `ForbiddenException`…), jamais de `throw new Error` nu dans une route.
9. **Jobs lourds → BullMQ**, pas dans le cycle requête/réponse. Cron via `@nestjs/schedule` (génération du préventif, recalcul des perfs techniciens, détection d'escalade > 2 h).
10. **Pas de log de secret.** Le logger redacte `authorization`/`cookie` (voir `app.module.ts`).

### Ajouter un module (recette)
1. Copier le dossier `machines/`.
2. Renommer fichiers/classes, ajuster le DTO et le service.
3. Déclarer le `siteId`-scoping dans **chaque** requête Prisma.
4. Brancher les `@RequirePermission(...)`.
5. Importer le module dans `app.module.ts`.
6. Écrire au moins un `*.service.spec.ts` (tenant scoping + cas d'erreur).

### KPI métier (déjà spécifiés par les prototypes)
À implémenter dans `modules/dashboard` et `modules/reports`, fidèlement à la logique d'origine :
`healthScore`, `machineMTBF`, `availability`, `computeMTTR`, `faultCost`, `isEscalated`,
`predictions`, `topFaultMachines`, `technicianWorkload`, `trend14`, `faultsByType`.

---

## 5. Base de données & Prisma

- **`schema.prisma` fait foi.** Toute évolution passe par une migration : `pnpm db:migrate`.
- **Jamais éditer la base à la main** hors migration (sauf RLS, voir ci-dessous).
- **Convention de nommage** : modèles en `PascalCase`, tables `@@map("snake_case")` au pluriel.
- **`siteId` sur toute table tenant** + index. Les `@@unique` métier incluent `siteId` (ex. `[siteId, code]`).
- **RLS = défense en profondeur.** L'autorisation primaire est dans l'API (CASL) ; les policies Postgres (`migrations/0001_enable_rls`) sont une seconde barrière. La `service_role` (API) bypasse la RLS ; l'`anon key` y est soumise.
- **Migrations** : nommées et committées. `migrate dev` en local, `migrate deploy` en CI/prod.
- **Seed** (`prisma/seed.ts`) idempotent (`upsert`), porte le jeu de démo des prototypes.
- **Supabase** : utiliser l'URL **poolée (6543)** pour `DATABASE_URL` (runtime) et l'URL **directe (5432)** pour `DIRECT_URL` (migrations).

---

## 6. Frontend Web — Next.js (`apps/web`)

- **App Router + Server Components par défaut.** `'use client'` seulement quand il y a état/interactivité.
- **Données serveur via TanStack Query**, jamais de `fetch` dispersé dans les composants. Passer par `src/lib/api-client.ts` (typé avec `@maintflow/shared`).
- **État client = Zustand**, réservé à l'UI (filtres, modales). Les données serveur restent dans React Query.
- **Formulaires = React Hook Form + Zod.** Le schéma Zod valide ET type le formulaire.
- **Supabase côté client = auth uniquement** (`src/lib/supabase.ts`). Le token est injecté dans chaque appel API.
- **UI = shadcn/ui + Tailwind.** Tokens de design dans `tailwind.config.ts` (vert `brand`, `ink`, `critical`, `warning`) — alignés sur les prototypes.
- **i18n FR/EN via next-intl** (les prototypes sont bilingues). Pas de chaîne en dur dans les composants.
- **Pas de secret** côté client : seules les vars `NEXT_PUBLIC_*` (non sensibles) sont exposées.
- **Accessibilité** : labels, focus visibles, contrastes AA. Les tableaux denses (machines, pièces) restent navigables au clavier.

---

## 7. Mobile — Flutter (`apps/mobile`)

- **Offline-first, non négociable.** Le technicien doit pouvoir consulter ses missions, démarrer et clôturer une intervention **sans réseau**.
  - Source de vérité locale : **Drift (SQLite)**. L'UI lit le cache local d'abord.
  - Les écritures locales entrent dans une **sync queue** ; elles sont poussées vers l'API à la reconnexion (`connectivity_plus`), avec stratégie de résolution de conflit *last-write-wins horodaté* + drapeau de revue côté serveur.
- **State = Riverpod** (avec génération `riverpod_generator`). Pas de `setState` pour de l'état partagé.
- **Navigation = go_router** (`core/router/app_router.dart`).
- **Réseau = Dio** via `apiClientProvider`. Le token Supabase est injecté par l'intercepteur ; refresh auto sur 401.
- **Architecture en couches** : `features/` (UI + controllers Riverpod) → `data/repositories` → `data/datasources` (remote Dio + local Drift). Pas d'appel Dio directement depuis un widget.
- **Modèles** : `freezed` + `json_serializable`. Les enums **doivent matcher** `packages/shared` (mêmes valeurs string).
- **Secrets/config** : via `--dart-define` (`core/config/env.dart`). Token de session dans `flutter_secure_storage`, jamais en clair.
- **Fonctions terrain** (du prototype) : scan QR (`mobile_scanner`), photos (`image_picker`), signature (`signature`), géoloc de pointage (`geolocator`).
- **Lint strict** : `analysis_options.yaml` (`require_trailing_commas`, `avoid_print`, imports `package:`).
- **Code généré** (`*.g.dart`, `*.freezed.dart`) **non committé** : régénérer via `dart run build_runner build`.

---

## 8. Package partagé (`packages/shared`)

- Contient **uniquement** des types/enums/constantes purs — **aucune dépendance runtime, aucun code Node/DOM**.
- C'est la frontière de contrat entre web et api. Une rupture ici casse les deux : versionner avec soin.
- Toujours `pnpm build` après modification (consommé en `dist/`).

---

## 9. Configuration & secrets

- Modèle unique : **`.env.example`** à la racine. On copie en `.env` ( git-ignoré).
- L'API **valide son env au démarrage** (`config/configuration.ts`, zod) et **refuse de booter** si invalide. *Fail fast.*
- Jamais de secret committé. En prod : variables du provider (Railway/Vercel) + Supabase.
- Trois niveaux de clés Supabase, ne pas confondre :
  - `anon` → clients (web public, mobile),
  - `service_role` → **API serveur uniquement**,
  - `jwt_secret` → vérification des tokens côté API.

---

## 10. Tests

| Cible | Outil | Minimum attendu |
|---|---|---|
| API (unitaire) | Jest | services : tenant scoping + cas d'erreur |
| API (e2e) | Jest + supertest | parcours auth + 1 CRUD |
| Web | (à venir) Vitest + Testing Library | composants critiques |
| Mobile | `flutter_test` | repositories + logique offline |

- Un service avec de la logique **doit** avoir un spec. Voir `machines.service.spec.ts`.
- Pas de test qui touche la vraie base : on **mocke** `PrismaService`.
- La CI fait échouer la PR si lint/typecheck/test échouent.

---

## 11. Qualité, CI & Git

- **Avant de committer** (idéalement en hook) : `pnpm lint && pnpm typecheck && pnpm test`.
- **Prettier** formate le TS/JSON ; **ESLint** (type-checked) bloque les erreurs ; Dart via `dart format` + `flutter analyze`.
- **Husky** : `commit-msg` (commitlint) + `pre-commit` (lint-staged).
- **CI GitHub Actions** (`.github/workflows/ci.yml`) : install → typecheck → lint → test → build, sur chaque PR.
- **`main` protégée** : PR + CI verte obligatoires. Pas de `--force` sur les branches partagées.
- **Une PR = une intention.** Petite, revue, testée. Décrire le *pourquoi*, pas seulement le *quoi*.

---

## 12. Commandes essentielles

```bash
# Setup
pnpm install                 # deps JS (api, web, shared)
cp .env.example .env         # puis remplir
pnpm infra:up                # Postgres + Redis (docker)
pnpm db:migrate              # applique les migrations
pnpm db:seed                 # jeu de démo (prototypes)

# Dev
pnpm dev                     # turbo : api + web en parallèle
pnpm --filter @maintflow/api dev
pnpm --filter @maintflow/web dev

# Mobile (Flutter installé séparément)
cd apps/mobile && flutter pub get
flutter run --dart-define=API_URL=http://localhost:4000 \
  --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...

# Qualité
pnpm lint && pnpm typecheck && pnpm test
pnpm db:studio               # Prisma Studio

# Build
pnpm build
```

---

## 13. Déploiement

| Composant | Cible | Note |
|---|---|---|
| API NestJS | Railway / Render / Fly.io | `prisma migrate deploy` au release |
| Web Next.js | Vercel | vars `NEXT_PUBLIC_*` + serveur |
| DB / Auth / Storage | Supabase Cloud | RLS activée |
| Redis | Upstash | BullMQ |
| Mobile | App Store + Play | build signé, `--dart-define` de prod |
| Push | Firebase Cloud Messaging | |

---

## 14. Définition de « terminé » (Definition of Done)

Une tâche est terminée quand :
- [ ] Le code suit ce guide (frontières, typage, tenant scoping).
- [ ] DTO/validation présents (API) ; types partagés à jour si le contrat change.
- [ ] Permissions/`@RequirePermission` posées sur les nouvelles routes.
- [ ] Tests écrits et verts ; `lint` + `typecheck` verts.
- [ ] Migration committée si le schéma a changé.
- [ ] Pas de secret, pas de `console.log`/`print` oublié.
- [ ] PR petite, décrite, CI verte.

---

## 15. Pièges connus / rappels

- ⚠️ **Ne jamais** lire le `siteId` depuis le client : faille d'isolation multi-tenant.
- ⚠️ **Ne jamais** appeler Supabase DB depuis le front : contourne toute la logique métier et la RBAC.
- ⚠️ Enum modifié → propager à `schema.prisma`, `packages/shared`, et le mirror Dart.
- ⚠️ Le mobile écrit **d'abord en local** puis synchronise — ne pas bloquer l'UI sur le réseau.
- ⚠️ `service_role_key` côté serveur exclusivement.
- ⚠️ Code généré (Prisma client, `*.g.dart`) non committé.

---

_Ce fichier est vivant : si une règle est ambiguë ou obsolète, on l'amende via une PR `docs(repo): ...`._

# 001 Backend Architecture Design

Umbrella design for the 3D Lab Manager backend. Every backend slice follows the decisions here. Slice specs add detail (exact columns, endpoints, error codes) but do not override this document without amending it.

## Context

The 3D Lab Manager helps students find equipment in the UTA Senior Design lab (ERB 208) without asking the lab manager, Steven McDermott. The project charter (`docs/charter/project_charter.pdf`) is the source of requirements. The SRS is still a blank template.

### Scope of this design

- **In scope:** the FastAPI backend, its PostgreSQL database, and how the existing React frontend integrates with it (proxying, contract, auth).
- **Out of scope:** frontend design, UI, and frontend code structure. These belong to the frontend developer. The frontend stays JavaScript. Adopting TypeScript is the frontend developer's choice.

### Team shape

Several backend developers work in parallel, and one frontend developer consumes their work. The design optimizes for two things: backend developers rarely touching the same files, and the frontend developer never waiting on backend implementation to start building.

### Decisions

| Topic | Decision |
|---|---|
| Stack | FastAPI, PostgreSQL 16, SQLAlchemy 2.0 (async, asyncpg), Alembic, Pydantic v2 |
| Auth | Public read with no login. Local admin accounts only |
| Search | Hybrid: Postgres full-text search and `pg_trgm` plus local embeddings in `pgvector`, with natural-language status and lab parsing. Isolated in one module. See spec 003 |
| Availability | Admin-set status plus quantity. No student checkout |
| Asset storage | Docker volume served by nginx, behind a storage interface. Built in slice 002 for item photos |
| Contract | Contract-first per slice, committed `openapi.json` |
| Code layout | Feature modules |
| Roadmap | See section 7. 3D is deferred. Wireless tracking is out of scope |

## 1. Runtime architecture

```
browser / kiosk
      |
   nginx  (frontend container, port 80)
      |-- /            -> built React app (static)
      |-- /api/*       -> FastAPI backend (port 5000), path passed through unchanged
      '-- /assets/*    -> asset volume, served directly (reserved, see 3D)
      |
   FastAPI  --->  PostgreSQL 16
```

All services run with Docker Compose on one Linux box on the senior design network. Postgres is reachable only on the internal Docker network. nginx is the only service reachable from the lab network.

### Changes to existing scaffolding

1. **The backend owns the `/api` prefix.** Every router mounts under `/api` in FastAPI. `src/frontend/nginx.conf` changes `proxy_pass http://backend:5000/;` to `proxy_pass http://backend:5000;`, and `src/frontend/vite.config.js` drops its `rewrite`. The interactive docs then work at `/api/docs` and `/api/openapi.json` in both development and production. The unused `/static` proxy in Vite and `/static/models/` in nginx are removed until the 3D slice defines asset paths.
2. **Secrets move to `.env`.** `src/docker-compose.yml` stops hardcoding credentials and reads them from a git-ignored `src/.env`. A committed `src/.env.example` documents every variable. The backend refuses to start if a required setting is missing. `JWT_SECRET` is removed, since auth uses database sessions.
3. **Startup is ordered by health, not timing.** Postgres gets a `pg_isready` healthcheck. A one-shot `migrate` service runs `alembic upgrade head` after the database is healthy, and the backend starts only after `migrate` completes successfully.
4. **Postgres moves to version 16,** as `postgres:16-alpine` in the foundation and `pgvector/pgvector:pg16` from slice 003 onward.

### Configuration

`app/core/config.py` defines a single `pydantic-settings` `Settings` object and is the only place the code reads environment variables. Settings cover at least `DATABASE_URL`, `COOKIE_SECURE`, and `SESSION_TTL_DAYS`.

### Local development

Each backend developer runs `docker compose up db` and then `uvicorn app.main:app --reload --port 5000` on the host. The frontend developer runs Vite, whose `/api` proxy points at a local backend or the shared lab box.

## 2. Code layout

The code is organized as feature modules. Each feature owns a folder, so one developer can own a slice with minimal overlap.

```
src/backend/
  app/
    core/           config, database session, error handling, base schema
    features/
      auth/         router.py  schemas.py  models.py  service.py  dependencies.py
      labs/         ...
      items/        ...
      search/       ...
      issues/       ...
      showcase/     ...
    cli.py          create-admin, export-openapi
    main.py         app factory, mounts each feature router under /api
  migrations/       Alembic environment and versions (one shared history)
  tests/
    conftest.py     database, client, admin_client, factories
    <feature>/      tests per feature, mirroring app/features
  openapi.json      generated contract, committed
  pyproject.toml    dependencies via uv, ruff and pyright configuration
  Dockerfile
```

### Module rules

- `router.py` handles HTTP only: parsing, dependencies, and status codes. It calls `service.py`.
- `service.py` holds the business logic and database access for that feature.
- `models.py` holds SQLAlchemy tables. `schemas.py` holds Pydantic API shapes. The two are deliberately separate, so a column change never silently changes the contract.
- **Features call each other only through `service.py` functions,** never by querying each other's tables. For example, items reads open issue counts through `issues.service`. This keeps every feature replaceable, which matters most for search.
- Shared files (`main.py`, `migrations/versions/`) get one-line or one-file additions per slice.

### Tooling

- **uv** for dependencies and lockfile
- **ruff** for linting and formatting
- **pyright** for type checking

## 3. Data model

### Conventions

- `id` is a `bigint` identity primary key.
- `created_at` and `updated_at` are `timestamptz` with database defaults. `updated_at` is maintained on update.
- Names are `snake_case`, and table names are plural.
- Fixed value sets are `text` columns with a `CHECK` constraint (SQLAlchemy `Enum(native_enum=False)`), so adding a value is an ordinary migration.
- Each table's model lives in its owning feature's `models.py`. All features share one Alembic history.

### Tables

| Slice | Table | Key fields |
|---|---|---|
| Foundation | `admins` | `email` (unique, case-insensitive), `password_hash`, `name`, `is_active` |
| Foundation | `sessions` | `token_hash` (unique), `admin_id`, `expires_at`, `last_used_at` |
| Labs and items | `labs` | `slug` (unique, like `erb-208`), `name`, `building`, `room`, `description` |
| Labs and items | `categories` | `name` (unique) |
| Labs and items | `items` | `lab_id`, `category_id`, `name`, `description`, `status` (`available`, `in_use`, `broken`, `missing`), `quantity` (`>= 0`), `location` (free text), `keywords` (text array of function words and aliases) |
| Search | `search_documents` | Item embeddings, plus a generated weighted `search_vector` on `items`. See spec 003 |
| Issues | `issues` | `item_id` (nullable, `ON DELETE SET NULL`), `lab_id`, `type` (`broken`, `depleted`, `safety`, `other`), `description`, `status` (`open`, `in_progress`, `resolved`), optional `reporter_name` and `reporter_contact`, `resolved_at`, `resolved_by` |
| Showcase | `projects` | `title`, `summary`, `body`, `lab_id`, `semester`, `credits`, `is_published` |

Slice specs finalize exact columns, nullability, and indexes.

### Deliberate decisions

- **Issues never change item status.** Reports are anonymous and the kiosk is walk-up, so automatic flagging would let anyone mark equipment broken. Item responses include `openIssueCount` instead, and only admins write `status`.
- **Items are hard deleted.** Related issues keep their history through `ON DELETE SET NULL`, with no soft delete flag for every query to filter on.

## 4. Authentication and security

### Access levels

- **Public:** read published data, search, and submit issue reports. No account is needed.
- **Admin:** all writes, issue triage, showcase publishing, and admin management.

There are only two levels, so there is no roles table.

### Sessions

- Login creates a random token, sent to the browser as an `httpOnly`, `SameSite=Lax` cookie. Only the token's SHA-256 hash is stored in `sessions`.
- Sessions expire `SESSION_TTL_DAYS` (default 7) after last use. Expired rows are deleted when looked up and when that admin logs in, so no cleanup job is needed.
- Logout and admin deactivation take effect on the next request.
- nginx serves the frontend and API from the same origin, so no CORS configuration is needed. `SameSite=Lax` covers CSRF, because every write uses POST, PATCH, or DELETE.
- The cookie's `Secure` flag follows `COOKIE_SECURE`. Whether the box serves TLS is decided in the deployment slice.

### Passwords

Passwords are hashed with Argon2 via `pwdlib`.

### Endpoints

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- Admin management endpoints for listing, creating, and deactivating admins

Protected routes declare `Depends(require_admin)`.

### Bootstrapping

There is no public registration. The first admin is created on the box with `python -m app.cli create-admin`.

### Abuse protection

- nginx `limit_req` rate-limits `POST /api/auth/login` and `POST /api/issues`.
- Every text field has a `max_length`, and nginx caps request body size.
- There is no account lockout, because it would let anyone lock an admin out on purpose.

## 5. API conventions and contract workflow

### Conventions

| Topic | Rule |
|---|---|
| URLs | Plural nouns under `/api`, like `/api/labs/{slug}`, `/api/items/{id}`, and `/api/items?lab=erb-208&status=available`. No version prefix |
| JSON casing | camelCase on the wire through one shared `ApiSchema` base with an alias generator. Python and the database stay snake_case |
| Lists | `{ "items": [...], "total": n }`, paginated with `limit` and `offset` |
| Single resources | The object itself, unwrapped |
| Writes | POST returns `201` and the created object. PATCH is partial and returns `200` and the updated object. DELETE returns `204` |
| Errors | Always `{ "error": { "code", "message", "details" } }`, with request validation errors reshaped into the same format. Codes are stable strings the frontend can branch on. Messages are for humans and may change |
| Status codes | `401` not authenticated, `404` not found, `409` conflict, `422` invalid input |
| Time | ISO 8601 in UTC |
| Operation IDs | camelCase names like `listItems` and `createIssue` |

### What `openapi.json` is

`openapi.json` is the machine-readable API description that FastAPI generates from the routes and schemas. It powers `/api/docs`, shows API changes as diffs in pull requests, and lets the frontend developer generate types, clients, or mocks if he chooses. Nobody edits it by hand.

### Contract-first workflow per slice

1. **Contract PR, merged first:** Pydantic schemas, route stubs with real signatures and `response_model`s that return `501`, and the regenerated `openapi.json`. When a slice adds tables that other slices depend on, its models and migration land in this PR too.
2. **Frontend starts immediately** against `/api/docs` or the committed `openapi.json`.
3. **Implementation PRs** fill in the stubs. They can be split by endpoint across developers.

### Keeping the contract accurate

- `python -m app.cli export-openapi` writes `src/backend/openapi.json`.
- A pre-commit hook runs the export on every commit.
- CI regenerates the file and fails if it differs from the committed copy. This check judges nothing about the change itself. It only guarantees the committed file matches the code.
- Contract changes are reviewed through normal pull request review. By team convention, a merged contract changes additively. Renaming or removing a field is agreed with the frontend developer first.

## 6. Testing and CI

### Testing

- **Tests run against real Postgres, never mocks,** because search, constraints, and cascades are database behavior. CI uses a `postgres:16` service container. Locally, tests use the Compose `db` service.
- **Migrations run once per test session.** Each test runs in a transaction that is rolled back, so tests are isolated and fast, and every run also exercises the migrations.
- **Tests are mostly API level,** using `httpx.AsyncClient` against the real app and asserting status codes, bodies, and error codes. Service-level unit tests are added only for subtle logic, such as search ranking.
- **Shared fixtures:** `client` (anonymous), `admin_client` (authenticated), and factories such as `make_lab()` and `make_item()`.
- Each slice plan follows test-driven development.
- Every endpoint has tests for its success path and each documented error code. There is no coverage percentage gate.

### CI

GitHub Actions runs on pull requests and pushes to `main` that touch `src/backend/**`. All jobs are required checks on `main`.

| Job | Check |
|---|---|
| Lint | `ruff check`, `ruff format --check` |
| Types | `pyright` |
| Test | `pytest` against Postgres |
| Contract | regenerate `openapi.json`, fail on difference |
| Migrations | `alembic check` (models match migrations) and a single-head check |

## 7. Slice roadmap

This spec's plan, `docs/superpowers/plans/001-backend-architecture.md`, implements the foundation slice. Every later slice gets a short spec (tables, endpoints, error codes) and a plan, sharing the next free ID, written when that slice begins.

| ID | Slice | Status | Delivers |
|---|---|---|---|
| 001 | Foundation | Planned | Project skeleton and tooling, `core/`, Alembic, the Compose and proxy changes, `admins` and `sessions`, auth and admin endpoints, `create-admin` CLI, `GET /api/health`, test harness, CI, `openapi.json` export and pre-commit hook |
| 002 | Labs and items | Planned | Labs, categories, items, item photo galleries, the storage interface, and the image pipeline |
| 003 | Search core | Planned | Hybrid search with local embeddings and natural-language filters, behind a benchmark gate |
| 004 | Deployment and backups | Blocked | Waits on sponsor questions 1 to 3 in `docs/open-questions.md` |
| 005 | Search type-ahead | Planned | Suggestions, did-you-mean, highlights, and facets |
| 006 | Search insights | Deferred | Search and click logging, admin reports, and a popularity boost |
| 007 | Issues | Planned | Anonymous reporting, admin triage, and `openIssueCount` on items. Notifications wait on open question 4 |
| 008 | Showcase | Planned | Projects with galleries, links, featured placement, and permission-gated publishing. Videos wait on open question 5 |
| Unassigned | 3D | Deferred | Designed when reached |

Build order follows the IDs, except that 004 should land before Steven enters real inventory, whenever its questions are answered.

The charter's November 2026 milestone (prototype with inventory database and basic search) corresponds to slices 1 through 3.

### Parallel work

- **Foundation** is done by one or two developers, since everything depends on it.
- **Labs and items** puts its models, migration, and contract stubs in its first PR. Once merged, search core, issues, and showcase proceed in parallel, each owned by a different developer in a separate feature folder. Type-ahead follows search core.
- **Migrations are the shared hotspot.** Before merging, a developer rebases onto `main` and regenerates their migration if `main` gained a new head. CI's single-head check catches it if someone forgets.

### Asset storage and 3D

Slice 002 adds `app/core/storage.py` with `save`, `delete`, and `url_for`. FastAPI validates uploads and writes them to a Docker volume, and nginx serves it at `/assets/*` with cache headers, so large files never pass through Python. All asset code goes through that interface, so moving to S3-compatible storage later changes one module and not the API contract. How the backend stores 3D models and item placement is decided in the 3D slice.

## Out of scope

- Wireless tracking of tools
- Student checkout
- Student accounts and UTA SSO
- Frontend design, UI, and code structure

# Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the FastAPI backend foundation: project tooling, core conventions, database and migrations, admin auth, the published contract, Docker integration, and CI.

**Architecture:** One FastAPI app under `src/backend/app`, organized as feature modules (`app/features/<feature>/`) on top of a small `app/core`. All routes mount under `/api`. Admin auth uses hashed database sessions delivered in an httpOnly cookie. Tests run against a real, freshly migrated Postgres database, with each test rolled back.

**Tech Stack:** Python 3.12, uv, FastAPI, Pydantic v2 (>= 2.11), pydantic-settings, SQLAlchemy 2.0 async with asyncpg, Alembic, pwdlib[argon2], pytest with pytest-asyncio and httpx, ruff, pyright, pre-commit, Docker Compose, GitHub Actions.

**Spec:** `docs/superpowers/specs/001-backend-architecture-design.md`

**Branch:** All work happens on `feat/backend-foundation`, branched from `main`. Nothing in this plan commits to `main` directly.

## Global Constraints

- Every route mounts under `/api`. The docs are served at `/api/docs` and `/api/openapi.json`. ReDoc is disabled.
- JSON on the wire is camelCase, produced by the shared `ApiSchema` base. Python and the database stay snake_case.
- Every error response body is `{"error": {"code": str, "message": str, "details": list | null}}`.
- Lists return `{"items": [...], "total": int}`, paginated with `limit` (1 to 100, default 50) and `offset` (>= 0, default 0).
- POST returns `201`. PATCH is partial and returns `200`. DELETE returns `204`.
- Operation IDs are the camelCased route function names, like `listAdmins`.
- Tables use `bigint` identity `id`, `timestamptz` `created_at` and `updated_at` with database defaults, `snake_case` names, and plural table names.
- Value sets are `text` with a `CHECK` constraint (`Enum(native_enum=False)`), never native Postgres enums.
- Settings are read only in `app/core/config.py`. `DATABASE_URL` is required. `COOKIE_SECURE` defaults to `true`. `SESSION_TTL_DAYS` defaults to `7`.
- Session cookie: name `session`, `httpOnly`, `SameSite=Lax`, `Path=/api`, `Secure` from `COOKIE_SECURE`. Only the SHA-256 hex digest of the token is stored.
- Passwords are hashed with Argon2 via `pwdlib`. Admin passwords are 12 to 128 characters.
- Features call each other only through `service.py`. `models.py` (SQLAlchemy) and `schemas.py` (Pydantic) stay separate.
- Postgres is `postgres:16-alpine` and never published beyond `127.0.0.1`.
- Code comments follow the user's comment style: ASCII only, brief, no trailing period on one-liners, no em dashes or semicolons.

## Review Focus

1. **Email typed with different case or stray spaces** (`"  Steven@UTA.edu "`) at login and at admin creation should match the stored address and must not create a duplicate. Pinned in Task 4 and Task 5.
2. **Unknown email and wrong password** must return the same `401 invalid_credentials` body, so login doesn't reveal which emails exist. Pinned in Task 5.
3. **A deactivated admin still holding a valid cookie** must be rejected on their next request, not when the session expires. Pinned in Task 6.
4. **A garbage, stale, or expired session cookie** must produce `401 not_authenticated`, never a `500`. Pinned in Task 5.
5. **Postgres down** while `/api/health` is called must return `503 database_unavailable` quickly, not a `500` or a hang. Pinned in Task 3.

## File Map

```
.github/workflows/backend.yml          CI jobs (Task 9)
.pre-commit-config.yaml                ruff and openapi export hooks (Task 7)
src/.env.example                       Compose variables (Task 8)
src/docker-compose.yml                 modified (Task 8)
src/frontend/nginx.conf                modified (Task 8)
src/frontend/vite.config.js            modified (Task 8)
src/backend/
  .python-version                      3.12
  .env.example                         host dev variables
  pyproject.toml  uv.lock              deps and tool config
  Dockerfile                           rewritten for uv (Task 8)
  README.md                            developer setup (Task 8)
  alembic.ini
  migrations/env.py                    async env reading settings
  migrations/versions/                 one migration per change
  openapi.json                         generated contract
  app/
    main.py                            create_app, module-level app
    models.py                          imports every feature's models for Alembic
    cli.py                             create-admin, export-openapi
    core/config.py                     Settings, get_settings
    core/errors.py                     AppError, handlers, ErrorResponse, error_responses
    core/schemas.py                    ApiSchema, Page, Pagination
    core/db.py                         Base, TimestampMixin, engine, get_session, DbSession
    features/health/router.py          GET /api/health
    features/auth/models.py            Admin, AdminSession
    features/auth/schemas.py           LoginRequest, AdminRead, AdminCreate, AdminUpdate
    features/auth/service.py           hashing, sessions, admin management
    features/auth/dependencies.py      require_admin, CurrentAdmin
    features/auth/router.py            /api/auth and /api/admins routers
  tests/
    conftest.py                        database, db_session, client, make_admin, login, admin_client
    core/test_app.py
    core/test_conventions.py
    core/test_health.py
    auth/test_service.py
    auth/test_auth_api.py
    auth/test_admins_api.py
```

Every package directory gets an empty `__init__.py`.

**Spec note:** The spec lists auth dependencies under `core/`. This plan puts `require_admin` in `features/auth/dependencies.py` so that `core` never imports from a feature. Task 6 updates that line of the spec on this branch.

---

### Task 1: Project skeleton and settings

**Files:**
- Create: `src/backend/.python-version`, `src/backend/pyproject.toml`, `src/backend/.env.example`, `src/backend/app/__init__.py`, `src/backend/app/main.py`, `src/backend/app/core/__init__.py`, `src/backend/app/core/config.py`, `src/backend/tests/__init__.py`, `src/backend/tests/conftest.py`, `src/backend/tests/core/__init__.py`
- Test: `src/backend/tests/core/test_app.py`

**Interfaces:**
- Produces: `Settings` with `database_url: str`, `cookie_secure: bool = True`, `session_ttl_days: int = 7`. `get_settings() -> Settings` (cached with `functools.lru_cache`). `create_app() -> FastAPI` and module-level `app = create_app()` in `app/main.py`. Fixture `client: httpx.AsyncClient` with `base_url="https://test"`.

- [ ] **Step 1: Create the branch and initialize the project**

```bash
git switch -c feat/backend-foundation
cd src/backend
echo 3.12 > .python-version
uv init --bare --name lab-manager-backend
uv add fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" asyncpg alembic "pydantic[email]>=2.11" pydantic-settings "pwdlib[argon2]"
uv add --dev pytest "pytest-asyncio>=1.0" httpx ruff pyright pre-commit
```

Add this tool configuration to `pyproject.toml`:

```toml
[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "ASYNC", "SIM", "RUF"]

[tool.pyright]
include = ["app"]
pythonVersion = "3.12"

[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "session"
asyncio_default_test_loop_scope = "session"
```

`.env.example` contains:

```
DATABASE_URL=postgresql+asyncpg://lab_manager:change-me@localhost:5432/lab_manager
COOKIE_SECURE=false
```

Copy it to `.env` locally. `.env` is already git-ignored at the repo root.

- [ ] **Step 2: Write the failing tests**

`tests/conftest.py` gets an initial `client` fixture: an `httpx.AsyncClient(transport=ASGITransport(app=create_app()), base_url="https://test")`, yielded inside `async with`. The `https` base URL lets `Secure` cookies round-trip in tests.

```python
# tests/core/test_app.py
import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_settings_require_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_defaults(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@h/db")
    settings = Settings(_env_file=None)
    assert settings.cookie_secure is True
    assert settings.session_ttl_days == 7


async def test_docs_served_under_api(client):
    assert (await client.get("/api/openapi.json")).status_code == 200
    assert (await client.get("/api/docs")).status_code == 200
    assert (await client.get("/openapi.json")).status_code == 404
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `uv run pytest tests/core/test_app.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.core.config'`

- [ ] **Step 4: Implement `Settings`, `get_settings()` and `create_app()`**

`Settings` is a `BaseSettings` with `model_config = SettingsConfigDict(env_file=".env")`. `create_app()` builds `FastAPI(title="3D Lab Manager API", docs_url="/api/docs", openapi_url="/api/openapi.json", redoc_url=None)`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `uv run pytest tests/core/test_app.py -v`
Expected: 3 passed

- [ ] **Step 6: Lint, type check, and commit**

Run: `uv run ruff check . && uv run ruff format --check . && uv run pyright`
Expected: no errors

```bash
git add src/backend
git commit -m "feat(backend): add project skeleton and settings"
```

---

### Task 2: Error envelope and API conventions

**Files:**
- Create: `src/backend/app/core/errors.py`, `src/backend/app/core/schemas.py`
- Modify: `src/backend/app/main.py`
- Test: `src/backend/tests/core/test_conventions.py`

**Interfaces:**
- Consumes: `create_app()` from Task 1.
- Produces:
  - `class AppError(Exception)` with `__init__(self, status_code: int, code: str, message: str, details: list[ErrorDetail] | None = None)`
  - `ErrorDetail(ApiSchema)` with `field: str`, `message: str`
  - `ErrorBody(ApiSchema)` with `code`, `message`, `details: list[ErrorDetail] | None`
  - `ErrorResponse(ApiSchema)` with `error: ErrorBody`
  - `error_responses(*status_codes: int) -> dict[int | str, dict[str, Any]]`, which returns `{code: {"model": ErrorResponse}}` for each code plus `422`
  - `register_error_handlers(app: FastAPI) -> None`
  - `ApiSchema(BaseModel)` with `ConfigDict(alias_generator=to_camel, validate_by_name=True, validate_by_alias=True, serialize_by_alias=True, from_attributes=True)`
  - `Page[T]` (`Generic[T]`, `ApiSchema`) with `items: list[T]` and `total: int`
  - `Pagination` dataclass dependency with `limit: int = Query(50, ge=1, le=100)` and `offset: int = Query(0, ge=0)`
  - `operation_id(route: APIRoute) -> str`, which returns `to_camel(route.name)` and is passed to `FastAPI(generate_unique_id_function=...)`

- [ ] **Step 1: Write the failing tests**

```python
# tests/core/test_conventions.py
import pytest
from fastapi import APIRouter
from httpx import ASGITransport, AsyncClient
from pydantic import Field

from app.core.errors import AppError, error_responses
from app.core.schemas import ApiSchema
from app.main import create_app


class Widget(ApiSchema):
    display_name: str = Field(max_length=5)


@pytest.fixture
async def widget_client():
    app = create_app()
    router = APIRouter()

    @router.post("/widgets", response_model=Widget, status_code=201, responses=error_responses(409))
    async def create_widget(body: Widget) -> Widget:
        if body.display_name == "taken":
            raise AppError(409, "widget_taken", "Widget exists")
        return body

    app.include_router(router, prefix="/api")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as c:
        yield c


async def test_response_uses_camel_case(widget_client):
    r = await widget_client.post("/api/widgets", json={"displayName": "ab"})
    assert r.status_code == 201
    assert r.json() == {"displayName": "ab"}


async def test_app_error_uses_envelope(widget_client):
    r = await widget_client.post("/api/widgets", json={"displayName": "taken"})
    assert r.status_code == 409
    assert r.json() == {"error": {"code": "widget_taken", "message": "Widget exists", "details": None}}


async def test_validation_error_uses_envelope(widget_client):
    r = await widget_client.post("/api/widgets", json={"displayName": "toolong"})
    assert r.status_code == 422
    body = r.json()["error"]
    assert body["code"] == "validation_error"
    assert body["details"][0]["field"] == "body.displayName"


async def test_unknown_route_uses_envelope(widget_client):
    r = await widget_client.get("/api/nope")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "not_found"


async def test_openapi_uses_camel_operation_ids_and_error_schema(widget_client):
    spec = (await widget_client.get("/api/openapi.json")).json()
    op = spec["paths"]["/api/widgets"]["post"]
    assert op["operationId"] == "createWidget"
    for status in ("409", "422"):
        ref = op["responses"][status]["content"]["application/json"]["schema"]["$ref"]
        assert ref.endswith("/ErrorResponse")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/core/test_conventions.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.core.errors'`

- [ ] **Step 3: Implement `core/schemas.py`, `core/errors.py`, and wire them into `create_app()`**

`register_error_handlers` installs four handlers:
- `AppError` uses its own status and code.
- `RequestValidationError` returns `422`, code `validation_error`, message `Request is invalid`, and one `ErrorDetail` per error, with `field` set to `".".join(str(p) for p in err["loc"])` and `message` set to `err["msg"]`.
- `StarletteHTTPException` maps `404` to `not_found`, `405` to `method_not_allowed`, and any other status to `http_error`, using `exc.detail` as the message.
- Bare `Exception` returns `500`, code `internal_error`, message `Internal server error`.

All four build the body through one private helper that returns `JSONResponse(ErrorResponse(...).model_dump(mode="json"))`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `uv run pytest tests/core -v`
Expected: all passed

- [ ] **Step 5: Commit**

```bash
git add src/backend
git commit -m "feat(backend): add error envelope and API conventions"
```

---

### Task 3: Database, migrations, test harness, and health

**Files:**
- Create: `src/backend/app/core/db.py`, `src/backend/app/models.py`, `src/backend/alembic.ini`, `src/backend/migrations/env.py`, `src/backend/migrations/script.py.mako`, `src/backend/app/features/__init__.py`, `src/backend/app/features/health/__init__.py`, `src/backend/app/features/health/router.py`
- Modify: `src/backend/tests/conftest.py`, `src/backend/app/main.py`
- Test: `src/backend/tests/core/test_health.py`

**Interfaces:**
- Consumes: `get_settings()`, `AppError`, `ApiSchema`, `error_responses`.
- Produces:
  - `Base(DeclarativeBase)` whose `metadata` uses the naming convention `{"ix": "ix_%(column_0_label)s", "uq": "uq_%(table_name)s_%(column_0_name)s", "ck": "ck_%(table_name)s_%(constraint_name)s", "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s", "pk": "pk_%(table_name)s"}`
  - `TimestampMixin` with `id: Mapped[int]` (`BigInteger`, `Identity()`, primary key), `created_at` (`server_default=func.now()`), and `updated_at` (`server_default=func.now()`, `onupdate=func.now()`), all `DateTime(timezone=True)`
  - `engine` and `SessionLocal = async_sessionmaker(engine, expire_on_commit=False)`
  - `get_session() -> AsyncIterator[AsyncSession]`, and `DbSession = Annotated[AsyncSession, Depends(get_session)]`
  - `app/models.py`, which imports every feature's `models` module (empty until Task 4) so Alembic sees all tables
  - Fixtures: `database` (session scope, yields the test `AsyncEngine`), `db_session: AsyncSession` (per test, rolled back), and `client`, which now overrides `get_session` with `db_session`

- [ ] **Step 1: Initialize Alembic with the async template**

Run: `uv run alembic init -t async migrations`

In `alembic.ini`, remove the `sqlalchemy.url` line and set `file_template = %%(year)d%%(month).2d%%(day).2d_%%(rev)s_%%(slug)s`. In `migrations/env.py`, set `target_metadata = Base.metadata`, import `app.models`, and use `config.get_main_option("sqlalchemy.url") or get_settings().database_url` as the URL. This lets tests point Alembic at the test database.

- [ ] **Step 2: Rewrite `tests/conftest.py` around a real database**

- `database`, session scope: take `make_url(get_settings().database_url)`, derive `<name>_test`, connect to the `postgres` maintenance database with `isolation_level="AUTOCOMMIT"`, run `DROP DATABASE IF EXISTS ... WITH (FORCE)` then `CREATE DATABASE ...`, then run `await asyncio.to_thread(command.upgrade, cfg, "head")`. `cfg` has `sqlalchemy.url` set to the test URL. The thread is needed because Alembic's async env calls `asyncio.run`. Yield an engine on the test URL and dispose it afterwards.
- `db_session`: open a connection, `begin()` a transaction, yield `AsyncSession(bind=conn, expire_on_commit=False, join_transaction_mode="create_savepoint")`, then roll back. Service code can call `commit()` freely, and nothing persists.
- `client`: as before, plus `app.dependency_overrides[get_session] = lambda: db_session`.

- [ ] **Step 3: Write the failing tests**

```python
# tests/core/test_health.py
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.db import get_session
from app.main import create_app


async def test_health_ok(client):
    r = await client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


async def test_health_reports_database_unavailable():
    dead = create_async_engine("postgresql+asyncpg://x:y@127.0.0.1:1/none")
    app = create_app()

    async def dead_session():
        async with AsyncSession(dead) as s:
            yield s

    app.dependency_overrides[get_session] = dead_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as c:
        r = await c.get("/api/health")
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "database_unavailable"
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `docker compose -f ../docker-compose.yml up -d db`, then `uv run pytest tests/core/test_health.py -v`
Expected: FAIL with `404` on `/api/health`

Before Task 8 the compose file still has the old hardcoded credentials. Point `.env` at them, or start a throwaway `postgres:16-alpine` on `127.0.0.1:5432` matching `.env.example`.

- [ ] **Step 5: Implement `core/db.py` and `GET /api/health`**

`features/health/router.py` defines `router = APIRouter(prefix="/health", tags=["health"])` and `get_health(db: DbSession) -> HealthRead`, where `HealthRead(ApiSchema)` has `status: Literal["ok"]`. It runs `SELECT 1`. On `OSError` or `SQLAlchemyError` it raises `AppError(503, "database_unavailable", "Database is unavailable")`. Document `error_responses(503)`. `create_app()` includes it with `prefix="/api"`.

- [ ] **Step 6: Run the full suite**

Run: `uv run pytest -v`
Expected: all passed

- [ ] **Step 7: Commit**

```bash
git add src/backend
git commit -m "feat(backend): add database layer, migrations, and health check"
```

---

### Task 4: Admin and session models and auth service

**Files:**
- Create: `src/backend/app/features/auth/__init__.py`, `src/backend/app/features/auth/models.py`, `src/backend/app/features/auth/service.py`, `src/backend/migrations/versions/<generated>_create_admins_and_sessions.py`, `src/backend/tests/auth/__init__.py`
- Modify: `src/backend/app/models.py`
- Test: `src/backend/tests/auth/test_service.py`

**Interfaces:**
- Consumes: `Base`, `TimestampMixin`, `AppError`, `get_settings()`.
- Produces:
  - `Admin(TimestampMixin, Base)` on table `admins`: `email: str` (`String(254)`, unique, `CheckConstraint("email = lower(email)", name="email_lowercase")`), `password_hash: str`, `name: str` (`String(100)`), `is_active: bool` (server default `true`)
  - `AdminSession(Base)` on table `sessions`: `id` (`bigint` identity), `token_hash: str` (`String(64)`, unique), `admin_id` (FK `admins.id`, `ondelete="CASCADE"`, indexed), `expires_at`, `last_used_at`, `created_at`
  - `normalize_email(email: str) -> str`, which strips and lowercases
  - `hash_token(token: str) -> str`, the SHA-256 hex digest
  - `async create_admin(db, *, email: str, name: str, password: str) -> Admin`, which raises `AppError(409, "email_taken", ...)` on the unique violation, caught as `IntegrityError` at commit
  - `async authenticate(db, *, email: str, password: str) -> Admin | None`, which returns `None` for an unknown email, a wrong password, or an inactive admin, and verifies against a module-level dummy hash when the email is unknown so timing doesn't reveal which emails exist
  - `async create_session(db, admin: Admin) -> str`, which deletes that admin's expired sessions, stores `hash_token(secrets.token_urlsafe(32))` with `expires_at = now + session_ttl_days`, and returns the raw token
  - `async resolve_session(db, token: str) -> Admin | None`, which returns `None` and deletes the row if expired, returns `None` if the admin is inactive, and otherwise sets `last_used_at = now` and `expires_at = now + ttl` and returns the admin
  - `async delete_session(db, token: str) -> None`

- [ ] **Step 1: Write the failing tests**

```python
# tests/auth/test_service.py
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select, update

from app.core.errors import AppError
from app.features.auth import service
from app.features.auth.models import AdminSession

PASSWORD = "correct horse battery"


async def test_create_admin_normalizes_email_and_hashes_password(db_session):
    admin = await service.create_admin(db_session, email="  Steven@UTA.edu ", name="Steven", password=PASSWORD)
    assert admin.email == "steven@uta.edu"
    assert admin.password_hash.startswith("$argon2")


async def test_create_admin_rejects_duplicate_email_in_any_case(db_session):
    await service.create_admin(db_session, email="a@uta.edu", name="A", password=PASSWORD)
    with pytest.raises(AppError) as exc:
        await service.create_admin(db_session, email="A@UTA.EDU", name="B", password=PASSWORD)
    assert (exc.value.status_code, exc.value.code) == (409, "email_taken")


async def test_authenticate(db_session):
    admin = await service.create_admin(db_session, email="a@uta.edu", name="A", password=PASSWORD)
    assert await service.authenticate(db_session, email=" A@uta.edu", password=PASSWORD) == admin
    assert await service.authenticate(db_session, email="a@uta.edu", password="wrong password!") is None
    assert await service.authenticate(db_session, email="nobody@uta.edu", password=PASSWORD) is None
    admin.is_active = False
    await db_session.commit()
    assert await service.authenticate(db_session, email="a@uta.edu", password=PASSWORD) is None


async def test_session_token_is_stored_hashed_and_resolves(db_session):
    admin = await service.create_admin(db_session, email="a@uta.edu", name="A", password=PASSWORD)
    token = await service.create_session(db_session, admin)
    row = await db_session.scalar(select(AdminSession))
    assert row.token_hash == service.hash_token(token) != token
    before = row.expires_at
    assert await service.resolve_session(db_session, token) == admin
    await db_session.refresh(row)
    assert row.expires_at > before


async def test_expired_session_is_rejected_and_deleted(db_session):
    admin = await service.create_admin(db_session, email="a@uta.edu", name="A", password=PASSWORD)
    token = await service.create_session(db_session, admin)
    await db_session.execute(update(AdminSession).values(expires_at=datetime.now(UTC) - timedelta(seconds=1)))
    assert await service.resolve_session(db_session, token) is None
    assert await db_session.scalar(select(AdminSession)) is None


async def test_unknown_token_resolves_to_none(db_session):
    assert await service.resolve_session(db_session, "not-a-token") is None
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/auth/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.features.auth'`

- [ ] **Step 3: Implement the models and add the import to `app/models.py`**

- [ ] **Step 4: Generate and review the migration**

Run: `uv run alembic revision --autogenerate -m "create admins and sessions"`
Expected: a new file in `migrations/versions/` that creates both tables, the unique constraints, the check constraint, and the `admin_id` index, all with convention names. Read it, and delete anything unrelated.

- [ ] **Step 5: Implement `service.py`**

Use `pwdlib.PasswordHash.recommended()` once at module level for hashing and verification.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `uv run pytest -v`
Expected: all passed

- [ ] **Step 7: Commit**

```bash
git add src/backend
git commit -m "feat(backend): add admin and session models with auth service"
```

---

### Task 5: Auth endpoints and the `require_admin` dependency

**Files:**
- Create: `src/backend/app/features/auth/schemas.py`, `src/backend/app/features/auth/dependencies.py`, `src/backend/app/features/auth/router.py`
- Modify: `src/backend/app/main.py`, `src/backend/tests/conftest.py`
- Test: `src/backend/tests/auth/test_auth_api.py`

**Interfaces:**
- Consumes: the Task 4 service functions, `DbSession`, `AppError`, `error_responses`.
- Produces:
  - `LoginRequest(ApiSchema)` with `email: str` (`max_length=254`) and `password: str` (`max_length=128`). `email` is a plain `str`, not `EmailStr`, so stray whitespace reaches `normalize_email` rather than failing validation.
  - `AdminRead(ApiSchema)` with `id`, `email`, `name`, `is_active`, `created_at`
  - `require_admin(db: DbSession, session: Annotated[str | None, Cookie()] = None) -> Admin`, which raises `AppError(401, "not_authenticated", "Sign in required")`
  - `CurrentAdmin = Annotated[Admin, Depends(require_admin)]`
  - `router = APIRouter(prefix="/auth", tags=["auth"])` with `login` (`POST /login`, `200` and `AdminRead`), `logout` (`POST /logout`, `204`, always succeeds and clears the cookie), and `get_me` (`GET /me`, `AdminRead`)
  - Login failure raises `AppError(401, "invalid_credentials", "Email or password is incorrect")`
  - The cookie is set with `key="session"`, `httponly=True`, `samesite="lax"`, `secure=settings.cookie_secure`, `path="/api"`, `max_age=session_ttl_days * 86400`
  - Conftest fixtures: `make_admin(email="admin@uta.edu", name="Admin", password=PASSWORD) -> Admin` (factory), `login(email, password) -> AsyncClient` (factory that returns a new logged-in client sharing `db_session`), and `admin_client` (a logged-in client for the default admin). `PASSWORD = "correct horse battery"` lives in `conftest.py`.

- [ ] **Step 1: Write the failing tests**

```python
# tests/auth/test_auth_api.py
from tests.conftest import PASSWORD

INVALID = {"error": {"code": "invalid_credentials", "message": "Email or password is incorrect", "details": None}}


async def test_login_sets_session_cookie(client, make_admin):
    await make_admin()
    r = await client.post("/api/auth/login", json={"email": "admin@uta.edu", "password": PASSWORD})
    assert r.status_code == 200
    assert r.json()["email"] == "admin@uta.edu"
    assert r.json()["isActive"] is True
    cookie = r.headers["set-cookie"].lower()
    assert "session=" in cookie and "httponly" in cookie and "samesite=lax" in cookie and "path=/api" in cookie


async def test_login_normalizes_email(client, make_admin):
    await make_admin(email="steven@uta.edu")
    r = await client.post("/api/auth/login", json={"email": "  Steven@UTA.edu ", "password": PASSWORD})
    assert r.status_code == 200


async def test_login_failures_are_indistinguishable(client, make_admin):
    await make_admin()
    wrong = await client.post("/api/auth/login", json={"email": "admin@uta.edu", "password": "wrong password!"})
    unknown = await client.post("/api/auth/login", json={"email": "ghost@uta.edu", "password": PASSWORD})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json() == INVALID


async def test_me_requires_session(client):
    r = await client.get("/api/auth/me")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "not_authenticated"


async def test_me_rejects_garbage_cookie(client):
    client.cookies.set("session", "garbage", domain="test", path="/api")
    r = await client.get("/api/auth/me")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "not_authenticated"


async def test_me_returns_current_admin(admin_client):
    r = await admin_client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "admin@uta.edu"


async def test_logout_ends_session(admin_client):
    assert (await admin_client.post("/api/auth/logout")).status_code == 204
    assert (await admin_client.get("/api/auth/me")).status_code == 401


async def test_logout_without_session_succeeds(client):
    assert (await client.post("/api/auth/logout")).status_code == 204
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/auth/test_auth_api.py -v`
Expected: FAIL with fixture `make_admin` not found

- [ ] **Step 3: Add the fixtures, then implement schemas, dependencies, and router, and include the router in `create_app()`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `uv run pytest -v`
Expected: all passed

- [ ] **Step 5: Commit**

```bash
git add src/backend
git commit -m "feat(backend): add login, logout, and current admin endpoints"
```

---

### Task 6: Admin management endpoints and the `create-admin` CLI

**Files:**
- Create: `src/backend/app/cli.py`
- Modify: `src/backend/app/features/auth/schemas.py`, `src/backend/app/features/auth/service.py`, `src/backend/app/features/auth/router.py`, `src/backend/app/main.py`, `docs/superpowers/specs/001-backend-architecture-design.md` (code layout: auth dependencies live in `features/auth/dependencies.py`)
- Test: `src/backend/tests/auth/test_admins_api.py`

**Interfaces:**
- Consumes: `CurrentAdmin`, `Page`, `Pagination`, `create_admin`, `AdminRead`.
- Produces:
  - `AdminCreate(ApiSchema)` with `email: EmailStr` (`max_length=254`), `name: str` (1 to 100), `password: str` (12 to 128)
  - `AdminUpdate(ApiSchema)` with `name: str | None` (1 to 100) and `is_active: bool | None`
  - `async list_admins(db, *, limit: int, offset: int) -> tuple[list[Admin], int]`, ordered by `id`
  - `async update_admin(db, *, admin_id: int, actor: Admin, changes: AdminUpdate) -> Admin`, which applies only fields set in the request (`changes.model_dump(exclude_unset=True)`), raises `AppError(404, "admin_not_found", ...)` and `AppError(409, "cannot_deactivate_self", ...)`, and deletes the target's sessions when it is deactivated
  - `admins_router = APIRouter(prefix="/admins", tags=["admins"], dependencies=[Depends(require_admin)])` with `list_admins` (`GET ""`, `Page[AdminRead]`), `create_admin` (`POST ""`, `201`), and `update_admin` (`PATCH /{admin_id}`)
  - `app/cli.py` with `main(argv: list[str] | None = None) -> None`, using argparse subcommands. `create-admin --email --name` reads the password twice with `getpass` and calls `service.create_admin` in a `SessionLocal()` session through `asyncio.run`.

- [ ] **Step 1: Write the failing tests**

```python
# tests/auth/test_admins_api.py
from tests.conftest import PASSWORD


async def test_admin_routes_require_session(client):
    assert (await client.get("/api/admins")).status_code == 401


async def test_list_admins(admin_client):
    r = await admin_client.get("/api/admins")
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert r.json()["items"][0]["email"] == "admin@uta.edu"


async def test_list_admins_rejects_bad_pagination(admin_client):
    assert (await admin_client.get("/api/admins?limit=0")).status_code == 422
    assert (await admin_client.get("/api/admins?limit=101")).status_code == 422


async def test_create_admin_then_login(admin_client, client):
    body = {"email": "ta@uta.edu", "name": "TA", "password": PASSWORD}
    assert (await admin_client.post("/api/admins", json=body)).status_code == 201
    r = await client.post("/api/auth/login", json={"email": "ta@uta.edu", "password": PASSWORD})
    assert r.status_code == 200


async def test_create_admin_duplicate_email(admin_client):
    body = {"email": "ADMIN@uta.edu", "name": "Dup", "password": PASSWORD}
    r = await admin_client.post("/api/admins", json=body)
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "email_taken"


async def test_create_admin_short_password(admin_client):
    body = {"email": "ta@uta.edu", "name": "TA", "password": "x" * 11}
    assert (await admin_client.post("/api/admins", json=body)).status_code == 422


async def test_deactivation_revokes_existing_session(admin_client, make_admin, login):
    other = await make_admin(email="ta@uta.edu")
    ta_client = await login("ta@uta.edu", PASSWORD)
    r = await admin_client.patch(f"/api/admins/{other.id}", json={"isActive": False})
    assert r.status_code == 200
    assert r.json()["isActive"] is False
    assert (await ta_client.get("/api/auth/me")).status_code == 401


async def test_partial_update_keeps_other_fields(admin_client, make_admin):
    other = await make_admin(email="ta@uta.edu")
    r = await admin_client.patch(f"/api/admins/{other.id}", json={"name": "Renamed"})
    assert r.json()["name"] == "Renamed"
    assert r.json()["isActive"] is True


async def test_cannot_deactivate_self(admin_client):
    me = (await admin_client.get("/api/auth/me")).json()
    r = await admin_client.patch(f"/api/admins/{me['id']}", json={"isActive": False})
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "cannot_deactivate_self"


async def test_update_unknown_admin(admin_client):
    r = await admin_client.patch("/api/admins/999999", json={"name": "Ghost"})
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "admin_not_found"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/auth/test_admins_api.py -v`
Expected: FAIL with `404` on `/api/admins`

- [ ] **Step 3: Implement the service functions, schemas, `admins_router`, and `cli.py`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `uv run pytest -v`
Expected: all passed

- [ ] **Step 5: Smoke test the CLI against the dev database**

Run: `uv run alembic upgrade head && uv run python -m app.cli create-admin --email you@uta.edu --name You`
Expected: two password prompts, then the command exits with status 0. Running it again with the same email prints the `email_taken` message and exits non-zero.

- [ ] **Step 6: Update the spec's code layout line and commit**

In the spec's code layout, change `core/` to read "config, database session, error handling, base schema", and add "dependencies.py" to the `auth/` line.

```bash
git add src/backend docs/superpowers/specs/001-backend-architecture-design.md
git commit -m "feat(backend): add admin management endpoints and create-admin CLI"
```

---

### Task 7: Contract export and pre-commit hooks

**Files:**
- Create: `.pre-commit-config.yaml`, `src/backend/openapi.json`
- Modify: `src/backend/app/cli.py`

**Interfaces:**
- Consumes: `app` from `app/main.py`.
- Produces: the subcommand `export-openapi`, which writes `json.dumps(app.openapi(), indent=2) + "\n"` to `src/backend/openapi.json`, resolved relative to `cli.py` so it works from any working directory.

- [ ] **Step 1: Add `export-openapi` and generate the file**

Run: `uv run python -m app.cli export-openapi`
Expected: `openapi.json` exists and contains `"operationId": "listAdmins"` and `"/api/auth/login"`.

- [ ] **Step 2: Add `.pre-commit-config.yaml` at the repo root**

Use the `astral-sh/ruff-pre-commit` hooks `ruff-check` (with `--fix`) and `ruff-format`, scoped by `files: ^src/backend/`. Add one local hook:

```yaml
- repo: local
  hooks:
    - id: export-openapi
      name: export openapi.json
      entry: uv run --directory src/backend python -m app.cli export-openapi
      language: system
      pass_filenames: false
      files: ^src/backend/app/
```

Run `uv run pre-commit install` from `src/backend`. When the hook rewrites `openapi.json`, the commit stops. Stage the file and commit again. That is standard pre-commit behavior.

- [ ] **Step 3: Verify the hook catches a stale contract**

Add a harmless `summary="Current admin"` to the `get_me` route, then run `git commit -am "test"`.
Expected: the commit fails, and `git diff src/backend/openapi.json` shows the new summary. Keep the summary, stage the file, and continue.

- [ ] **Step 4: Commit**

```bash
git add .pre-commit-config.yaml src/backend
git commit -m "feat(backend): export openapi contract with pre-commit hooks"
```

---

### Task 8: Docker, Compose, and proxy integration

**Files:**
- Create: `src/.env.example`, `src/backend/README.md`, `src/backend/.dockerignore`
- Modify: `src/backend/Dockerfile`, `src/docker-compose.yml`, `src/frontend/nginx.conf`, `src/frontend/vite.config.js`

**Interfaces:**
- Produces: a stack where `docker compose up --build` from `src/` serves the app at `http://localhost/` and the API at `http://localhost/api/*`.

- [ ] **Step 1: Rewrite the backend `Dockerfile`**

Use base `python:3.12-slim`. Copy `uv` from `ghcr.io/astral-sh/uv`, pinned to the same version as `uv --version` locally. Run `uv sync --frozen --no-dev` with `UV_COMPILE_BYTECODE=1`, run as a non-root user, and use `CMD ["uv", "run", "--no-sync", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000", "--proxy-headers"]`. `.dockerignore` excludes `.venv`, `.env`, `tests`, and `__pycache__`.

- [ ] **Step 2: Rewrite `src/docker-compose.yml`**

- Remove the top-level `version` key and the `./uploads` volume.
- `db`: `postgres:16-alpine` with `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` from `.env`; healthcheck `pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}` every 5s; `ports: ["127.0.0.1:5432:5432"]`; keep the 512M limit.
- `migrate`: `build: ./backend`, `command: ["uv", "run", "--no-sync", "alembic", "upgrade", "head"]`, `depends_on: {db: {condition: service_healthy}}`, `restart: "no"`.
- `backend`: `depends_on: {migrate: {condition: service_completed_successfully}}`; keep the 384M limit.
- Both `migrate` and `backend` get `DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}` and `COOKIE_SECURE: ${COOKIE_SECURE}`.

`src/.env.example` lists `POSTGRES_USER=lab_manager`, `POSTGRES_PASSWORD=change-me`, `POSTGRES_DB=lab_manager`, and `COOKIE_SECURE=false`.

- [ ] **Step 3: Update the proxies**

In `nginx.conf`:
- At the top of the file, add `limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;`.
- Change `/api/` to `proxy_pass http://backend:5000;` with no trailing slash, and add `client_max_body_size 1m;` and `proxy_set_header X-Forwarded-Proto $scheme;`.
- Add `location = /api/auth/login { limit_req zone=login burst=5 nodelay; limit_req_status 429; proxy_pass http://backend:5000; }` with the same proxy headers.
- Delete the `/static/models/` block.

In `vite.config.js`, remove the `rewrite` line and the `/static` proxy entry.

- [ ] **Step 4: Verify the full stack**

Run from `src/`: `cp .env.example .env && docker compose up --build -d`
Expected:
- `docker compose ps` shows `migrate` exited `0`, and `db` and `backend` are healthy or running.
- `curl -s http://localhost/api/health` returns `{"status":"ok"}`.
- `http://localhost/api/docs` loads in a browser and lists the auth and admins endpoints.
- `docker compose exec backend uv run --no-sync python -m app.cli create-admin --email you@uta.edu --name You` succeeds.
- Logging in through `/api/docs` returns `200`, and `GET /api/auth/me` then returns the admin.
- Eleven rapid `curl -X POST http://localhost/api/auth/login` calls return at least one `429`.

- [ ] **Step 5: Write `src/backend/README.md`**

The README covers:
- Prerequisites: uv and Docker
- First-time setup: `uv sync`, copying `.env`, `docker compose up -d db`, `uv run alembic upgrade head`, `uv run pre-commit install`
- Running the API with `uv run uvicorn app.main:app --reload --port 5000`
- Running the tests
- Creating a migration
- Creating an admin
- The rule that `openapi.json` is generated, never edited by hand

- [ ] **Step 6: Commit**

```bash
git add src/docker-compose.yml src/.env.example src/backend src/frontend/nginx.conf src/frontend/vite.config.js
git commit -m "feat: wire backend into compose and proxy under /api"
```

---

### Task 9: CI workflow

**Files:**
- Create: `.github/workflows/backend.yml`

**Interfaces:**
- Produces: required checks named `lint`, `types`, `test`, `contract`, and `migrations`.

- [ ] **Step 1: Write the workflow**

- Trigger on `pull_request` and on `push` to `main`, with **no** workflow-level `paths` filter. A required check that never runs blocks merging forever.
- A `changes` job uses `dorny/paths-filter` to output `backend: true` when `src/backend/**` or `.github/workflows/backend.yml` changed.
- The other five jobs declare `needs: changes` and `if: needs.changes.outputs.backend == 'true'`. A skipped job counts as passing for required checks.
- Each job uses `actions/checkout` and `astral-sh/setup-uv` (current majors), `working-directory: src/backend`, and `uv sync --frozen`.

| Job | Postgres service | Commands |
|---|---|---|
| `lint` | no | `uv run ruff check .`, then `uv run ruff format --check .` |
| `types` | no | `uv run pyright` |
| `test` | `postgres:16-alpine` | `uv run pytest` |
| `contract` | no | `uv run python -m app.cli export-openapi`, then `git diff --exit-code openapi.json` |
| `migrations` | `postgres:16-alpine` | `uv run alembic upgrade head`, then `uv run alembic check`, then `test "$(uv run alembic heads \| wc -l)" -eq 1` |

Postgres services use `POSTGRES_USER: postgres`, `POSTGRES_PASSWORD: postgres`, `POSTGRES_DB: lab_manager`, a `pg_isready` health option, and port `5432:5432`. Every job sets `DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/lab_manager`. Settings require it even where no database is used.

- [ ] **Step 2: Push the branch and open a pull request**

Run: `git push -u origin feat/backend-foundation`, then open a PR to `main`.
Expected: all six jobs pass.

- [ ] **Step 3: Verify the skip path**

On a scratch branch, change only a file under `docs/` and open a draft PR.
Expected: `changes` runs, the five backend jobs show as skipped, and the PR is mergeable. Close the draft afterwards.

- [ ] **Step 4: Commit any workflow fixes, then hand off branch protection**

```bash
git add .github/workflows/backend.yml
git commit -m "ci: add backend lint, types, test, contract, and migration checks"
```

A repository admin marks `lint`, `types`, `test`, `contract`, and `migrations` as required status checks on `main` in GitHub settings. This is a manual, outward-facing change, so the executor asks the user rather than doing it.

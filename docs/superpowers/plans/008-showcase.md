# Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish student projects with galleries, links, featured placement, and permission-gated publishing, previewable by admins as drafts.

**Architecture:** A new `projects` feature module. The item photo logic from 002 is extracted into `core/gallery.py` (`PhotoMixin` and `Gallery`), which items and projects share. An `optional_admin` dependency lets the public endpoints also serve admin draft previews.

**Tech Stack:** Foundation stack, plus the 002 storage and image pipeline.

**Spec:** `docs/superpowers/specs/008-showcase-design.md`, under `001-backend-architecture-design.md` and `002-labs-items-design.md`

**Prerequisite:** Plan 002 merged. This plan uses `ItemPhoto`, `features/items/photos.py` (`add_photo`, `delete_photo`, `reorder_photos`, `delete_files`, `MAX_UPLOAD_BYTES`), `PhotoRead`, `Storage`, `get_storage`, `process_image`, `LabSummary`, `resolve_session`, `require_admin`, and the fixtures `make_lab`, `storage`, `client`, and `admin_client`.

**Branch:** `feat/showcase` from `main`. Task 1 is the contract PR.

## Global Constraints

- All of plan 001's Global Constraints apply.
- The spec's limits are schema constants:
  - slug: max 80, matching the lab slug regex
  - title 150, summary 300, body 10000
  - year 2000 to 2100
  - credits: 20 names, each 1 to 100 characters
  - links: 10, label 1 to 50, URL max 500
  - photos: 20 per project
- The invariant "published implies permission" is enforced twice: in the service, as `permission_required`, and in the database, as `CheckConstraint("NOT is_published OR permission_confirmed", name="published_requires_permission")`.
- Photo upload rules and error codes stay exactly as specified in 002.

## Review Focus

1. **An admin unchecks permission on a published project** without unpublishing it. This must be refused, not leave a published project that lacks permission. Pinned in Task 3.
2. **A link URL like `javascript:alert(1)`** must be rejected. Rendering it would be an XSS vector on the showcase page. Pinned in Task 3.
3. **A public visitor guessing a draft's slug** must get `404`, indistinguishable from a missing project. Pinned in Task 3.
4. **Deleting a project with photos** must remove the files from disk. Pinned in Task 4.
5. **The gallery extraction** must not change item photo behavior at all. Pinned in Task 2, by keeping the 002 photo tests unchanged.

## File Map

```
src/backend/app/core/gallery.py                PhotoMixin, Gallery, delete_photo_files
src/backend/app/features/items/models.py       ItemPhoto uses PhotoMixin
src/backend/app/features/items/photos.py       removed, replaced by an items Gallery instance
src/backend/app/features/items/router.py       photo routes call the items gallery
src/backend/app/features/auth/dependencies.py  optional_admin, OptionalAdmin
src/backend/app/features/projects/             models (Project, ProjectPhoto, Term), schemas, service, router
src/backend/migrations/versions/               create projects and project_photos
src/frontend/nginx.conf                        widen the upload location
src/backend/tests/projects/                    test_contract.py, test_projects_api.py, test_project_photos_api.py
```

---

### Task 1: Contract PR

**Files:**
- Create: `app/core/gallery.py` (only `PhotoMixin`), `features/projects/{__init__,models,schemas,router}.py`, and the migration
- Modify: `features/items/models.py`, `app/models.py`, `app/main.py`, `openapi.json`
- Test: `tests/projects/test_contract.py`

**Interfaces:**
- Produces:
  - `PhotoMixin` with `id`, `position`, `key` (unique), and `created_at`, copying the column definitions `ItemPhoto` shipped with in 002 exactly
  - `ItemPhoto(PhotoMixin, Base)`, which keeps `item_id`. Its columns stay identical, so `alembic check` reports no drift for `item_photos`.
  - `class Term(StrEnum)`: `spring`, `summer`, `fall`
  - `Project(TimestampMixin, Base)`, with the spec's columns:
    - `credits` as `ARRAY(String(100))`
    - `links` as `JSONB` with `server_default="[]"`
    - the `published_requires_permission` check
    - `CheckConstraint("year BETWEEN 2000 AND 2100")`
    - relationships `lab` and `photos` (ordered by position then id, `cascade="all, delete-orphan"`)
  - `ProjectPhoto(PhotoMixin, Base)` with `project_id` (FK, CASCADE)
  - Schemas:
    - `ProjectLink` with `label` and `url: HttpUrl`, serialized to `str`
    - `ProjectCreate` with `slug`, `title`, `summary`, `body = ""`, `lab_id: int | None = None`, `term`, `year`, `credits: list[...] = []`, `links: list[ProjectLink] = []`, `is_featured = False`, `permission_confirmed = False`
    - `ProjectUpdate`: every create field optional, plus `is_published: bool | None`
    - `ProjectSummary` and `ProjectDetail`, as in the spec
    - `ProjectStatusFilter(StrEnum)`: `published`, `draft`, `all`
    - `ProjectFilters` dataclass dependency with `lab`, `featured`, `year`, `term`, and `status` (default `published`)
  - `router = APIRouter(prefix="/projects", tags=["projects"])` with operation IDs `listProjects`, `getProject`, `createProject`, `updateProject`, `deleteProject`, `uploadProjectPhoto`, `deleteProjectPhoto`, and `reorderProjectPhotos`. All bodies are `not_implemented()`. The write and photo routes declare `dependencies=[Depends(require_admin)]`.

- [ ] **Step 1: Write the failing test**

```python
# tests/projects/test_contract.py
EXPECTED = {"listProjects", "getProject", "createProject", "updateProject", "deleteProject",
            "uploadProjectPhoto", "deleteProjectPhoto", "reorderProjectPhotos"}


async def test_projects_contract(client):
    spec = (await client.get("/api/openapi.json")).json()
    ops = {op["operationId"] for path in spec["paths"].values() for op in path.values()}
    assert EXPECTED <= ops
    detail = spec["components"]["schemas"]["ProjectDetail"]["properties"]
    assert {"body", "links", "photos", "permissionConfirmed", "publishedAt", "isPublished"} <= detail.keys()
    assert (await client.get("/api/projects")).status_code == 501
```

- [ ] **Step 2: Run the test to verify it fails, then implement and generate the migration**

Run: `uv run pytest tests/projects/test_contract.py -v` and expect FAIL. Implement, then run `uv run alembic revision --autogenerate -m "create projects"`. The migration must contain only the two new tables and their constraints. Delete anything that touches `item_photos`.

- [ ] **Step 3: Verify**

Run: `uv run pytest -v && uv run alembic check`
Expected: all passed, including the 002 photo tests, with no drift

- [ ] **Step 4: Export the contract, commit, and open the contract PR**

```bash
uv run python -m app.cli export-openapi
git add src/backend
git commit -m "feat(backend): add showcase contract"
```

---

### Task 2: Extract the shared gallery

**Files:**
- Modify: `app/core/gallery.py`, `features/items/router.py`, `features/items/service.py` (the import of `delete_files`)
- Delete: `features/items/photos.py`
- Test: the existing `tests/items/test_photos_api.py`, unchanged

**Interfaces:**
- Produces:
  - `MAX_UPLOAD_BYTES = 10 * 1024 * 1024`, moved from `items/photos.py`
  - `delete_photo_files(storage: Storage, key: str) -> None`, which removes `<key>.webp` and `<key>_thumb.webp`
  - `@dataclass(frozen=True) class Gallery(Generic[P])` with these fields:
    - `photo_model: type[P]`
    - `owner_column: InstrumentedAttribute[int]`
    - `limit: int`
    - `key_prefix: str`
  - `Gallery` methods, which keep the behavior and error codes of 002's functions:
    - `async add(self, db, storage, owner_id: int, upload: UploadFile) -> P`
    - `async delete(self, db, storage, owner_id: int, photo_id: int) -> None`
    - `async reorder(self, db, owner_id: int, photo_ids: list[int]) -> list[P]`
  - New photos are built with `self.photo_model(**{self.owner_column.key: owner_id}, position=..., key=f"{self.key_prefix}/{uuid4().hex}")`.
  - `items_gallery = Gallery(ItemPhoto, ItemPhoto.item_id, limit=10, key_prefix="items")` in `features/items/service.py`

- [ ] **Step 1: Confirm the regression baseline**

Run: `uv run pytest tests/items -v`
Expected: all passed. These tests are the specification for this task and must not change.

- [ ] **Step 2: Implement `Gallery`, switch the item routes to `items_gallery`, and delete `items/photos.py`**

- [ ] **Step 3: Verify that nothing changed**

Run: `uv run pytest -v && uv run pyright && git diff --stat main -- src/backend/tests/items`
Expected: all passed, no type errors, and no changes under `tests/items`

- [ ] **Step 4: Commit**

```bash
git add src/backend
git commit -m "refactor(backend): extract shared photo gallery"
```

---

### Task 3: Projects, publishing, and visibility

**Files:**
- Create: `features/projects/service.py`
- Modify: `features/projects/router.py`, `features/auth/dependencies.py`, `tests/conftest.py`
- Test: `tests/projects/test_projects_api.py`

**Interfaces:**
- Consumes: `labs.service.lab_exists`, `resolve_session`, `Storage`.
- Produces:
  - `optional_admin(db: DbSession, session: Annotated[str | None, Cookie()] = None) -> Admin | None`, and `OptionalAdmin = Annotated[Admin | None, Depends(optional_admin)]`
  - `async list_projects(db, filters: ProjectFilters, admin: Admin | None, *, limit, offset) -> tuple[list[Project], int]`. It raises `AppError(401, "not_authenticated", "Sign in required")` when `filters.status` is not `published` and `admin` is `None`. Term order is `case({"fall": 3, "summer": 2, "spring": 1}, value=Project.term).desc()`.
  - `async get_project(db, slug: str, admin: Admin | None) -> Project`, which raises `project_not_found` for a missing project, or for a draft when `admin` is `None`
  - `async create_project(db, data: ProjectCreate) -> Project`, which raises `slug_taken` or `invalid_lab`
  - `async update_project(db, slug: str, changes: ProjectUpdate) -> Project`. It computes the final `is_published` and `permission_confirmed`, and raises `permission_required` when the project would be published without permission. It stamps `published_at` on the first publish.
  - `async delete_project(db, slug: str) -> list[str]`, which returns the photo keys
  - `to_project_summary(project, storage) -> ProjectSummary` and `to_project_detail(project, storage) -> ProjectDetail`
  - Fixture `make_project(slug="sawyer-demo", title="Sawyer Demo", term="fall", year=2026, published=False, featured=False, **fields) -> Project`. When `published=True` it also sets `permission_confirmed=True`.

- [ ] **Step 1: Write the failing tests**

```python
# tests/projects/test_projects_api.py
BASE = {"slug": "sawyer-demo", "title": "Sawyer Demo", "summary": "Pick and place", "term": "fall", "year": 2026}


async def test_create_is_draft_and_hidden_from_public(admin_client, client):
    r = await admin_client.post("/api/projects", json={**BASE, "body": "# Overview\nIt **works**."})
    assert r.status_code == 201
    assert r.json()["isPublished"] is False and r.json()["body"] == "# Overview\nIt **works**."
    assert (await client.get("/api/projects")).json()["total"] == 0
    assert (await client.get("/api/projects/sawyer-demo")).json()["error"]["code"] == "project_not_found"
    assert (await admin_client.get("/api/projects/sawyer-demo")).status_code == 200


async def test_publish_requires_permission(admin_client, make_project):
    await make_project()
    r = await admin_client.patch("/api/projects/sawyer-demo", json={"isPublished": True})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "permission_required"
    r = await admin_client.patch("/api/projects/sawyer-demo", json={"isPublished": True, "permissionConfirmed": True})
    assert r.json()["isPublished"] is True
    first = r.json()["publishedAt"]
    await admin_client.patch("/api/projects/sawyer-demo", json={"isPublished": False})
    r = await admin_client.patch("/api/projects/sawyer-demo", json={"isPublished": True})
    assert r.json()["publishedAt"] == first


async def test_cannot_revoke_permission_while_published(admin_client, make_project):
    await make_project(published=True)
    r = await admin_client.patch("/api/projects/sawyer-demo", json={"permissionConfirmed": False})
    assert r.json()["error"]["code"] == "permission_required"
    r = await admin_client.patch("/api/projects/sawyer-demo", json={"permissionConfirmed": False, "isPublished": False})
    assert r.status_code == 200


async def test_public_order_and_filters(client, make_lab, make_project):
    lab = await make_lab()
    await make_project(slug="a", title="A", term="fall", year=2025, published=True, lab_id=lab.id)
    await make_project(slug="b", title="B", term="spring", year=2026, published=True)
    await make_project(slug="c", title="C", term="spring", year=2025, published=True, featured=True)
    await make_project(slug="d", title="D", term="fall", year=2026)

    async def slugs(query=""):
        return [p["slug"] for p in (await client.get(f"/api/projects?{query}")).json()["items"]]

    assert await slugs() == ["c", "b", "a"]
    assert await slugs("lab=erb-208") == ["a"]
    assert await slugs("year=2025&term=fall") == ["a"]
    assert await slugs("featured=true") == ["c"]


async def test_drafts_listing_requires_admin(client, admin_client, make_project):
    await make_project(slug="d", title="D")
    assert (await client.get("/api/projects?status=draft")).status_code == 401
    assert [p["slug"] for p in (await admin_client.get("/api/projects?status=draft")).json()["items"]] == ["d"]


async def test_link_and_credit_validation(admin_client):
    bad_link = {**BASE, "links": [{"label": "x", "url": "javascript:alert(1)"}]}
    assert (await admin_client.post("/api/projects", json=bad_link)).status_code == 422
    blank_credit = {**BASE, "credits": ["Ada", "  "]}
    assert (await admin_client.post("/api/projects", json=blank_credit)).status_code == 422
    good = {**BASE, "credits": [" Ada Lovelace "], "links": [{"label": "GitHub", "url": "https://github.com/x/y"}]}
    r = await admin_client.post("/api/projects", json=good)
    assert r.json()["credits"] == ["Ada Lovelace"]
    assert r.json()["links"] == [{"label": "GitHub", "url": "https://github.com/x/y"}]


async def test_slug_and_lab_errors(admin_client, make_project):
    await make_project()
    assert (await admin_client.post("/api/projects", json=BASE)).json()["error"]["code"] == "slug_taken"
    r = await admin_client.post("/api/projects", json={**BASE, "slug": "other", "labId": 999999})
    assert r.json()["error"]["code"] == "invalid_lab"


async def test_lab_delete_unlinks_projects(admin_client, make_lab, make_project):
    lab = await make_lab()
    await make_project(lab_id=lab.id)
    assert (await admin_client.delete("/api/labs/erb-208")).status_code == 204
    assert (await admin_client.get("/api/projects/sawyer-demo")).json()["lab"] is None
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/projects/test_projects_api.py -v`
Expected: FAIL with `501`

- [ ] **Step 3: Implement `optional_admin`, the service, the routes, and the fixture**

- [ ] **Step 4: Run the tests to verify they pass, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): implement showcase projects with permission-gated publishing"
```

---

### Task 4: Project photos

**Files:**
- Modify: `features/projects/service.py`, `features/projects/router.py`, `src/frontend/nginx.conf`
- Test: `tests/projects/test_project_photos_api.py`

**Interfaces:**
- Consumes: `Gallery`, `delete_photo_files`.
- Produces:
  - `projects_gallery = Gallery(ProjectPhoto, ProjectPhoto.project_id, limit=20, key_prefix="projects")`
  - The photo routes resolve the slug through `get_project(db, slug, admin)` first, then call the gallery with `project.id`.
  - The delete route deletes files for every key returned by `delete_project`, after the commit.
  - nginx widens the upload location to `^/api/(items/\d+|projects/[a-z0-9-]+)/photos$`.

- [ ] **Step 1: Write the failing tests**

```python
# tests/projects/test_project_photos_api.py
import io

from PIL import Image


def png():
    buf = io.BytesIO()
    Image.new("RGB", (640, 480), "green").save(buf, "PNG")
    return buf.getvalue()


async def upload(c, slug):
    return await c.post(f"/api/projects/{slug}/photos", files={"file": ("p.png", png(), "image/png")})


async def test_gallery_and_cover(admin_client, client, make_project):
    await make_project(published=True)
    photo = (await upload(admin_client, "sawyer-demo")).json()
    assert photo["url"].startswith("/assets/projects/")
    listing = (await client.get("/api/projects")).json()["items"][0]
    assert listing["coverThumbnailUrl"] == photo["thumbnailUrl"]


async def test_draft_photos_upload(admin_client, make_project):
    await make_project()
    assert (await upload(admin_client, "sawyer-demo")).status_code == 201


async def test_project_photo_limit_is_twenty(admin_client, make_project):
    await make_project()
    for _ in range(20):
        assert (await upload(admin_client, "sawyer-demo")).status_code == 201
    assert (await upload(admin_client, "sawyer-demo")).json()["error"]["code"] == "photo_limit_reached"


async def test_delete_project_removes_files(admin_client, make_project, storage):
    await make_project()
    await upload(admin_client, "sawyer-demo")
    assert len(list(storage.root.rglob("*.webp"))) == 2
    assert (await admin_client.delete("/api/projects/sawyer-demo")).status_code == 204
    assert not list(storage.root.rglob("*.webp"))


async def test_reorder(admin_client, make_project):
    await make_project()
    first = (await upload(admin_client, "sawyer-demo")).json()["id"]
    second = (await upload(admin_client, "sawyer-demo")).json()["id"]
    r = await admin_client.put("/api/projects/sawyer-demo/photos/order", json={"photoIds": [second, first]})
    assert [p["id"] for p in r.json()] == [second, first]
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/projects/test_project_photos_api.py -v`
Expected: FAIL with `501`

- [ ] **Step 3: Implement the photo routes, the delete cleanup, and the nginx change**

- [ ] **Step 4: Verify through nginx**

Run from `src/`: `docker compose up --build -d`, then upload a 9 MB photo to a project through `/api/docs`.
Expected: `201`, and the returned URL loads through `http://localhost/assets/...`

- [ ] **Step 5: Run the full suite, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend src/frontend/nginx.conf
git commit -m "feat(backend): add project photo galleries"
```

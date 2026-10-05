# Labs and Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver labs, categories, items, and item photo galleries, plus the shared storage interface and image pipeline.

**Architecture:** Three feature modules (`labs`, `categories`, `items`) on top of the foundation from plan 001. Photos live in the `items` feature. Uploads are processed by `core/images.py` and written through `core/storage.py` to a volume that nginx serves at `/assets/`. Task 1 is the contract PR, which merges before any implementation.

**Tech Stack:** Foundation stack from plan 001, plus Pillow and python-multipart.

**Spec:** `docs/superpowers/specs/002-labs-items-design.md`, under `docs/superpowers/specs/001-backend-architecture-design.md`

**Prerequisite:** Plan 001 merged. This plan uses its interfaces exactly: `ApiSchema`, `Page`, `Pagination`, `AppError`, `error_responses`, `DbSession`, `TimestampMixin`, `Base`, `CurrentAdmin`, `require_admin`, and the fixtures `client`, `admin_client`, and `db_session`.

**Branch:** `feat/labs-items` from `main`. Task 1 opens its own PR first. Later tasks continue on the branch after it merges, or split into one branch per task for parallel work.

## Global Constraints

- All of plan 001's Global Constraints apply.
- Every read endpoint is public. Every write endpoint declares `CurrentAdmin` or `dependencies=[Depends(require_admin)]`.
- Lists are ordered by `name`, then `id`. Photos are ordered by `position`, then `id`.
- Limits are defined once, as constants in each feature's `schemas.py`, and shared by schemas and services. They come from the spec: slug max 50 matching `^[a-z0-9]+(-[a-z0-9]+)*$`, lab name 100, building 100, room 20, lab description 2000, category name 50, item name 200, item description 5000, location 200, quantity 0 to 100000, keywords at most 30 of 1 to 50 characters, photos at most 10 per item, uploads at most 10 MB, images at most 50 megapixels, display edge 1600 px, thumbnail edge 400 px.
- Files are deleted only after the commit that removes their rows.

## Review Focus

1. **A HEIC photo from an iPhone** gets `422 invalid_image` with a message naming JPEG, PNG, and WebP, not a `500`. Pinned in Task 4.
2. **A sideways phone photo** (EXIF orientation 6) displays upright after processing. Pinned in Task 4.
3. **Deleting an item that has photos** removes the files from disk, not just the rows. Pinned in Task 6.
4. **PATCH with `"categoryId": null`** makes the item uncategorized, while omitting `categoryId` leaves it unchanged. Pinned in Task 5.
5. **Messy keywords** like `["  DMM", "dmm", "Measure Voltage"]` are stored as `["dmm", "measure voltage"]`. Pinned in Task 5.

## File Map

```
src/backend/app/core/config.py         add asset_dir (Task 4)
src/backend/app/core/errors.py         add not_implemented (Task 1)
src/backend/app/core/storage.py        Storage, LocalStorage, get_storage (Task 4)
src/backend/app/core/images.py         ProcessedImage, process_image (Task 4)
src/backend/app/models.py              import new feature models (Task 1)
src/backend/app/main.py                include new routers (Task 1)
src/backend/app/features/labs/         models, schemas, service, router
src/backend/app/features/categories/   models, schemas, service, router
src/backend/app/features/items/        models (Item, ItemPhoto, ItemStatus), schemas, service, photos.py, router
src/backend/migrations/versions/       create labs, categories, items, item_photos
src/backend/tests/conftest.py          add make_lab, make_category, make_item, storage fixtures
src/backend/tests/labs/  tests/categories/  tests/items/  tests/core/test_images.py  tests/core/test_storage.py
src/docker-compose.yml  src/frontend/nginx.conf   assets volume and serving (Task 7)
```

---

### Task 1: Contract PR (models, migration, schemas, stubs)

**Files:**
- Create: `features/labs/{__init__,models,schemas,router}.py`, `features/categories/{__init__,models,schemas,router}.py`, `features/items/{__init__,models,schemas,router}.py`, and the migration
- Modify: `app/core/errors.py`, `app/models.py`, `app/main.py`, `openapi.json`
- Test: `tests/labs/test_contract.py`

**Interfaces:**
- Produces:
  - `not_implemented() -> NoReturn` in `core/errors.py`, which raises `AppError(501, "not_implemented", "Not implemented yet")`
  - Models:
    - `Lab` (`labs`)
    - `Category` (`categories`, with `Index("uq_categories_name_lower", func.lower(Category.name), unique=True)`)
    - `class ItemStatus(StrEnum)` with `available`, `in_use`, `broken`, and `missing`
    - `Item` (`items`): `keywords: Mapped[list[str]]` as `ARRAY(String(50))` with `server_default="{}"`, `status` as `Enum(ItemStatus, native_enum=False, values_callable=...)` storing the values, `CheckConstraint("quantity >= 0")`, relationships `lab`, `category`, and `photos` (`order_by=(ItemPhoto.position, ItemPhoto.id)`, `cascade="all, delete-orphan"`)
    - `ItemPhoto` (`item_photos`): `item_id`, `position`, `key` (unique)
  - Foreign keys: `items.lab_id` uses `ondelete="RESTRICT"`, `items.category_id` uses `ondelete="SET NULL"`, `item_photos.item_id` uses `ondelete="CASCADE"`.
  - Schemas, all with the spec's limits as constants:
    - `LabRead`, `LabSummary`, `LabCreate`, `LabUpdate`
    - `CategoryRead`, `CategoryCreate`, `CategoryUpdate`
    - `PhotoRead`, `ItemSummary`, `ItemDetail`, `ItemCreate` (`lab_id`, `category_id: int | None = None`, `name`, `description = ""`, `status = available`, `quantity = 1`, `location`, `keywords: list[str] = []`), `ItemUpdate` (all optional), `PhotoOrder` (`photo_ids: list[int]`)
  - Routers `labs.router` (`/labs`), `categories.router` (`/categories`), and `items.router` (`/items`, including the photo routes), with the operation IDs `listLabs`, `getLab`, `createLab`, `updateLab`, `deleteLab`, `listCategories`, `createCategory`, `updateCategory`, `deleteCategory`, `listItems`, `getItem`, `createItem`, `updateItem`, `deleteItem`, `uploadItemPhoto`, `deleteItemPhoto`, and `reorderItemPhotos`. Every handler body is `not_implemented()`, and every route declares the spec's error codes via `error_responses`.

- [ ] **Step 1: Write the failing test**

```python
# tests/labs/test_contract.py
EXPECTED = {
    "listLabs", "getLab", "createLab", "updateLab", "deleteLab",
    "listCategories", "createCategory", "updateCategory", "deleteCategory",
    "listItems", "getItem", "createItem", "updateItem", "deleteItem",
    "uploadItemPhoto", "deleteItemPhoto", "reorderItemPhotos",
}


async def test_contract_exposes_inventory_operations(client):
    spec = (await client.get("/api/openapi.json")).json()
    ops = {op["operationId"] for path in spec["paths"].values() for op in path.values()}
    assert EXPECTED <= ops


async def test_stubs_return_not_implemented(client):
    r = await client.get("/api/labs")
    assert r.status_code == 501
    assert r.json()["error"]["code"] == "not_implemented"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/labs/test_contract.py -v`
Expected: FAIL, because the operations are missing

- [ ] **Step 3: Implement the models, schemas, and stub routers**

- [ ] **Step 4: Generate and review the migration**

Run: `uv run alembic revision --autogenerate -m "create labs categories items photos"`
Expected: four tables, the foreign keys with the actions above, the quantity and status checks, and the unique constraints. Autogenerate may skip the functional index `uq_categories_name_lower`. If it does, add it by hand with `op.create_index(..., [sa.text("lower(name)")], unique=True)`.

- [ ] **Step 5: Run the suite and the migration checks**

Run: `uv run pytest -v && uv run alembic check`
Expected: all passed, with no new upgrade operations detected

- [ ] **Step 6: Export the contract, commit, and open the contract PR**

```bash
uv run python -m app.cli export-openapi
git add src/backend
git commit -m "feat(backend): add labs, categories, and items contract"
```

---

### Task 2: Labs

**Files:**
- Create: `features/labs/service.py`
- Modify: `features/labs/router.py`, `tests/conftest.py`
- Test: `tests/labs/test_labs_api.py`

**Interfaces:**
- Produces:
  - `async list_labs(db, *, limit, offset) -> tuple[list[Lab], int]`
  - `async get_lab(db, slug: str) -> Lab`, which raises `lab_not_found`
  - `async create_lab(db, data: LabCreate) -> Lab`, which raises `slug_taken`
  - `async update_lab(db, slug: str, changes: LabUpdate) -> Lab`, which raises `lab_not_found` or `slug_taken`
  - `async delete_lab(db, slug: str) -> None`, which raises `lab_not_found`, or `lab_not_empty` (on `IntegrityError` from the RESTRICT foreign key)
  - `async lab_exists(db, lab_id: int) -> bool` for the items service
  - Fixture `make_lab(slug="erb-208", name="ERB 208", building="ERB", room="208") -> Lab`

- [ ] **Step 1: Write the failing tests**

```python
# tests/labs/test_labs_api.py
LAB = {"slug": "erb-208", "name": "ERB 208", "building": "ERB", "room": "208"}


async def test_create_and_get_lab(admin_client, client):
    r = await admin_client.post("/api/labs", json=LAB)
    assert r.status_code == 201
    assert r.json()["description"] == ""
    assert (await client.get("/api/labs/erb-208")).json()["name"] == "ERB 208"


async def test_list_labs_is_public_and_sorted(client, make_lab):
    await make_lab(slug="b-lab", name="B Lab")
    await make_lab(slug="a-lab", name="A Lab")
    r = await client.get("/api/labs")
    assert [lab["slug"] for lab in r.json()["items"]] == ["a-lab", "b-lab"]
    assert r.json()["total"] == 2


async def test_writes_require_admin(client):
    assert (await client.post("/api/labs", json=LAB)).status_code == 401


async def test_slug_rules(admin_client, make_lab):
    await make_lab()
    assert (await admin_client.post("/api/labs", json=LAB)).json()["error"]["code"] == "slug_taken"
    bad = {**LAB, "slug": "ERB 208"}
    assert (await admin_client.post("/api/labs", json=bad)).status_code == 422


async def test_rename_slug(admin_client, client, make_lab):
    await make_lab()
    r = await admin_client.patch("/api/labs/erb-208", json={"slug": "erb-209"})
    assert r.json()["slug"] == "erb-209"
    assert (await client.get("/api/labs/erb-208")).json()["error"]["code"] == "lab_not_found"


async def test_delete_lab(admin_client, make_lab, make_item):
    lab = await make_lab()
    await make_item(lab)
    r = await admin_client.delete("/api/labs/erb-208")
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "lab_not_empty"
    empty = await make_lab(slug="empty", name="Empty")
    assert (await admin_client.delete(f"/api/labs/{empty.slug}")).status_code == 204
```

`make_item` is defined in Task 5. Until then, add a minimal `make_item(lab, name="Multimeter", **fields) -> Item` to the conftest here, inserting through the model. Task 5 keeps the same signature.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/labs -v`
Expected: FAIL with `501`

- [ ] **Step 3: Implement the service and replace the lab stubs**

- [ ] **Step 4: Run the tests to verify they pass, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): implement labs endpoints"
```

---

### Task 3: Categories

**Files:**
- Create: `features/categories/service.py`
- Modify: `features/categories/router.py`, `tests/conftest.py`
- Test: `tests/categories/test_categories_api.py`

**Interfaces:**
- Produces:
  - `async list_categories(db, *, limit, offset) -> tuple[list[Category], int]`
  - `async create_category(db, data: CategoryCreate) -> Category`, which raises `category_name_taken`
  - `async update_category(db, category_id: int, changes: CategoryUpdate) -> Category`, which raises `category_not_found` or `category_name_taken`
  - `async delete_category(db, category_id: int) -> None`, which raises `category_not_found`
  - `async category_exists(db, category_id: int) -> bool`
  - Fixture `make_category(name="Electronics") -> Category`

- [ ] **Step 1: Write the failing tests**

```python
# tests/categories/test_categories_api.py
async def test_create_and_list_categories(admin_client, client):
    assert (await admin_client.post("/api/categories", json={"name": "Tools"})).status_code == 201
    r = await client.get("/api/categories")
    assert [c["name"] for c in r.json()["items"]] == ["Tools"]


async def test_category_names_are_unique_ignoring_case(admin_client, make_category):
    await make_category(name="Electronics")
    r = await admin_client.post("/api/categories", json={"name": "electronics"})
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "category_name_taken"


async def test_rename_category(admin_client, make_category):
    cat = await make_category()
    r = await admin_client.patch(f"/api/categories/{cat.id}", json={"name": "Electronics Bench"})
    assert r.json()["name"] == "Electronics Bench"


async def test_delete_category_uncategorizes_items(admin_client, client, make_lab, make_category, make_item):
    cat = await make_category()
    item = await make_item(await make_lab(), category_id=cat.id)
    assert (await admin_client.delete(f"/api/categories/{cat.id}")).status_code == 204
    assert (await client.get(f"/api/items/{item.id}")).json()["category"] is None


async def test_missing_category(admin_client):
    r = await admin_client.delete("/api/categories/999999")
    assert r.json()["error"]["code"] == "category_not_found"
```

The uncategorize test depends on `GET /api/items/{id}` from Task 5. Mark it `@pytest.mark.skip(reason="needs Task 5")` until Task 5 lands, and remove the mark in Task 5.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/categories -v`
Expected: FAIL with `501`

- [ ] **Step 3: Implement the service and replace the category stubs**

- [ ] **Step 4: Run the tests to verify they pass, then commit**

Run: `uv run pytest -v`
Expected: all passed, 1 skipped

```bash
git add src/backend
git commit -m "feat(backend): implement categories endpoints"
```

---

### Task 4: Storage and image processing

**Files:**
- Create: `app/core/storage.py`, `app/core/images.py`
- Modify: `app/core/config.py`, `src/backend/.env.example`, `pyproject.toml`, `tests/conftest.py`
- Test: `tests/core/test_storage.py`, `tests/core/test_images.py`

**Interfaces:**
- Produces:
  - `Settings.asset_dir: Path = Path("/app/assets")`. `.env.example` sets `ASSET_DIR=./.assets`, and `.assets/` is added to `.gitignore`.
  - `class Storage(Protocol)` with `save(self, key: str, data: bytes) -> None`, `delete(self, key: str) -> None` (a no-op when the file is missing), and `url_for(self, key: str) -> str`
  - `LocalStorage(root: Path, base_url: str = "/assets")`, whose `save` writes `<root>/<key>.tmp` and then calls `os.replace`, creating parent directories
  - `get_storage() -> Storage`, cached, built from `asset_dir`
  - `ProcessedImage` frozen dataclass with `display: bytes` and `thumbnail: bytes`
  - `process_image(data: bytes) -> ProcessedImage`, synchronous, which raises `AppError(422, "invalid_image", "Upload a JPEG, PNG, or WebP image")` on `UnidentifiedImageError`, `Image.DecompressionBombError`, a format outside `{"JPEG", "PNG", "WEBP"}`, or any decode `OSError`. `Image.MAX_IMAGE_PIXELS` is set to `50_000_000` at module level. WebP quality is 82.
  - Fixture `storage(tmp_path) -> LocalStorage`, overriding `get_storage` in the `client` fixtures

- [ ] **Step 1: Add the dependencies**

Run: `uv add pillow python-multipart`

- [ ] **Step 2: Write the failing tests**

```python
# tests/core/test_images.py
import io

import pytest
from PIL import Image

from app.core.errors import AppError
from app.core.images import process_image


def jpeg(size, orientation=None):
    buf = io.BytesIO()
    exif = Image.Exif()
    if orientation:
        exif[0x0112] = orientation
    Image.new("RGB", size, "red").save(buf, "JPEG", exif=exif)
    return buf.getvalue()


def test_outputs_are_bounded_webp():
    out = process_image(jpeg((4000, 2000)))
    display, thumb = Image.open(io.BytesIO(out.display)), Image.open(io.BytesIO(out.thumbnail))
    assert display.format == thumb.format == "WEBP"
    assert display.size == (1600, 800)
    assert max(thumb.size) == 400


def test_exif_orientation_is_applied_and_stripped():
    out = Image.open(io.BytesIO(process_image(jpeg((200, 100), orientation=6)).display))
    assert out.size == (100, 200)
    assert not out.getexif()


def test_small_images_are_not_upscaled():
    assert Image.open(io.BytesIO(process_image(jpeg((300, 200))).display)).size == (300, 200)


@pytest.mark.parametrize("data", [b"not an image", b"\x00\x00\x00\x18ftypheic" + b"\x00" * 64])
def test_rejects_undecodable_and_heic(data):
    with pytest.raises(AppError) as exc:
        process_image(data)
    assert exc.value.code == "invalid_image"
    assert "JPEG, PNG, or WebP" in exc.value.message
```

```python
# tests/core/test_storage.py
from app.core.storage import LocalStorage


def test_save_url_and_delete(tmp_path):
    storage = LocalStorage(tmp_path)
    storage.save("items/abc.webp", b"data")
    assert (tmp_path / "items/abc.webp").read_bytes() == b"data"
    assert not list(tmp_path.rglob("*.tmp"))
    assert storage.url_for("items/abc.webp") == "/assets/items/abc.webp"
    storage.delete("items/abc.webp")
    storage.delete("items/abc.webp")
    assert not (tmp_path / "items/abc.webp").exists()
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `uv run pytest tests/core/test_images.py tests/core/test_storage.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 4: Implement `storage.py` and `images.py`**

Use `ImageOps.exif_transpose`, then `convert("RGB")`, then `thumbnail((edge, edge))` on a copy for each output size.

- [ ] **Step 5: Run the tests to verify they pass, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend .gitignore
git commit -m "feat(backend): add storage interface and image processing"
```

---

### Task 5: Items

**Files:**
- Create: `features/items/service.py`
- Modify: `features/items/router.py`, `features/items/schemas.py`, `tests/conftest.py`, `tests/categories/test_categories_api.py` (remove the skip)
- Test: `tests/items/test_items_api.py`

**Interfaces:**
- Consumes: `labs.service.lab_exists`, `categories.service.category_exists`, `Storage`, `get_storage`.
- Produces:
  - `normalize_keywords(keywords: list[str]) -> list[str]`, which trims, lowercases, drops empties, and de-duplicates in first-seen order
  - `ItemFilters` dataclass dependency with `lab: str | None`, `category: int | None`, `status: ItemStatus | None`, and `q: str | None` (max 200)
  - `async list_items(db, filters: ItemFilters, *, limit, offset) -> tuple[list[Item], int]`, which eager-loads `lab`, `category`, and `photos` with `selectinload` and matches `q` with `Item.name.ilike(f"%{escaped}%")`, escaping `%`, `_`, and `\`
  - `async get_item(db, item_id: int) -> Item`, which raises `item_not_found`
  - `async create_item(db, data: ItemCreate) -> Item`, which raises `invalid_lab` or `invalid_category`
  - `async update_item(db, item_id: int, changes: ItemUpdate) -> Item`, which applies `exclude_unset` fields
  - `async delete_item(db, item_id: int) -> list[str]`, which returns the deleted photos' keys so the router can delete their files after commit (wired in Task 6)
  - `to_summary(item: Item, storage: Storage) -> ItemSummary` and `to_detail(item: Item, storage: Storage) -> ItemDetail` in `schemas.py`, with routes receiving `storage` via `Depends(get_storage)`
  - Fixture `make_item(lab: Lab, name="Multimeter", **fields) -> Item`

- [ ] **Step 1: Write the failing tests**

```python
# tests/items/test_items_api.py
from app.features.items.service import normalize_keywords


def test_normalize_keywords():
    assert normalize_keywords(["  DMM", "dmm", "Measure Voltage", " "]) == ["dmm", "measure voltage"]


async def test_create_item(admin_client, make_lab, make_category):
    lab, cat = await make_lab(), await make_category()
    body = {"labId": lab.id, "categoryId": cat.id, "name": "Multimeter", "location": "Shelf 1",
            "keywords": ["DMM", "dmm"]}
    r = await admin_client.post("/api/items", json=body)
    assert r.status_code == 201
    item = r.json()
    assert item["lab"] == {"slug": "erb-208", "name": "ERB 208"}
    assert item["status"] == "available" and item["quantity"] == 1
    assert item["keywords"] == ["dmm"] and item["photos"] == []


async def test_create_item_rejects_unknown_references(admin_client, make_lab):
    lab = await make_lab()
    r = await admin_client.post("/api/items", json={"labId": 999999, "name": "X", "location": "Y"})
    assert r.json()["error"]["code"] == "invalid_lab"
    r = await admin_client.post("/api/items", json={"labId": lab.id, "categoryId": 999999, "name": "X", "location": "Y"})
    assert r.json()["error"]["code"] == "invalid_category"


async def test_negative_quantity_rejected(admin_client, make_lab):
    lab = await make_lab()
    body = {"labId": lab.id, "name": "X", "location": "Y", "quantity": -1}
    assert (await admin_client.post("/api/items", json=body)).status_code == 422


async def test_list_filters(client, make_lab, make_category, make_item):
    a, b = await make_lab(), await make_lab(slug="erb-209", name="ERB 209")
    cat = await make_category()
    await make_item(a, name="Oscilloscope", category_id=cat.id)
    await make_item(a, name="Drill", status="broken")
    await make_item(b, name="Multimeter")

    async def names(query):
        return [i["name"] for i in (await client.get(f"/api/items?{query}")).json()["items"]]

    assert await names("lab=erb-208") == ["Drill", "Oscilloscope"]
    assert await names(f"category={cat.id}") == ["Oscilloscope"]
    assert await names("status=broken") == ["Drill"]
    assert await names("q=SCOPE") == ["Oscilloscope"]
    assert await names("q=%25") == []
    assert await names("lab=nope") == []


async def test_patch_category_null_vs_omitted(admin_client, make_lab, make_category, make_item):
    cat = await make_category()
    item = await make_item(await make_lab(), category_id=cat.id)
    r = await admin_client.patch(f"/api/items/{item.id}", json={"name": "Renamed"})
    assert r.json()["category"]["id"] == cat.id
    r = await admin_client.patch(f"/api/items/{item.id}", json={"categoryId": None})
    assert r.json()["category"] is None


async def test_get_and_delete_item(admin_client, client, make_lab, make_item):
    item = await make_item(await make_lab())
    assert (await client.get(f"/api/items/{item.id}")).status_code == 200
    assert (await admin_client.delete(f"/api/items/{item.id}")).status_code == 204
    assert (await client.get(f"/api/items/{item.id}")).json()["error"]["code"] == "item_not_found"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/items -v`
Expected: FAIL with `ImportError` for `normalize_keywords`

- [ ] **Step 3: Implement the service, the conversions, and replace the item stubs**

Call `normalize_keywords` in a Pydantic `field_validator` on `ItemCreate.keywords` and `ItemUpdate.keywords`, so both writes share it. Apply the per-keyword length limits after normalization.

- [ ] **Step 4: Run the tests to verify they pass, then commit**

Run: `uv run pytest -v`
Expected: all passed, with nothing skipped

```bash
git add src/backend
git commit -m "feat(backend): implement items endpoints"
```

---

### Task 6: Item photos

**Files:**
- Create: `features/items/photos.py`
- Modify: `features/items/router.py`
- Test: `tests/items/test_photos_api.py`

**Interfaces:**
- Consumes: `get_storage`, `Storage`, `process_image`, `get_item`, `delete_item`.
- Produces, in `photos.py`:
  - `MAX_UPLOAD_BYTES = 10 * 1024 * 1024`
  - `async add_photo(db, storage, item_id: int, upload: UploadFile) -> ItemPhoto`. It reads at most `MAX_UPLOAD_BYTES + 1` bytes and raises `file_too_large` past the limit. It raises `photo_limit_reached` at 10 photos. It runs `process_image` and both `storage.save` calls through `run_in_threadpool`, inserts at `max(position) + 1`, and deletes the saved files if the commit fails.
  - `async delete_photo(db, storage, item_id: int, photo_id: int) -> None`, which raises `photo_not_found` when the photo is missing or belongs to another item
  - `async reorder_photos(db, item_id: int, photo_ids: list[int]) -> list[ItemPhoto]`, which raises `invalid_photo_order` unless `sorted(photo_ids)` equals the item's photo IDs, then sets positions `0..n-1`
  - `delete_files(storage, key: str) -> None`, which removes `<key>.webp` and `<key>_thumb.webp`
- The item delete route now deletes files for every key returned by `delete_item`, after the commit.

- [ ] **Step 1: Write the failing tests**

```python
# tests/items/test_photos_api.py
import io

from PIL import Image


def png():
    buf = io.BytesIO()
    Image.new("RGB", (800, 600), "blue").save(buf, "PNG")
    return buf.getvalue()


async def upload(c, item_id, data=None):
    return await c.post(f"/api/items/{item_id}/photos", files={"file": ("p.png", data or png(), "image/png")})


async def test_upload_and_detail(admin_client, client, make_lab, make_item, storage):
    item = await make_item(await make_lab())
    r = await upload(admin_client, item.id)
    assert r.status_code == 201
    photo = r.json()
    assert photo["url"].startswith("/assets/items/") and photo["url"].endswith(".webp")
    assert photo["thumbnailUrl"].endswith("_thumb.webp")
    detail = (await client.get(f"/api/items/{item.id}")).json()
    assert [p["id"] for p in detail["photos"]] == [photo["id"]]
    listing = (await client.get("/api/items")).json()["items"][0]
    assert listing["coverThumbnailUrl"] == photo["thumbnailUrl"]
    assert len(list(storage.root.rglob("*.webp"))) == 2


async def test_upload_requires_admin(client, make_lab, make_item):
    item = await make_item(await make_lab())
    assert (await upload(client, item.id)).status_code == 401


async def test_upload_rejects_large_and_invalid(admin_client, make_lab, make_item):
    item = await make_item(await make_lab())
    assert (await upload(admin_client, item.id, b"x" * (10 * 1024 * 1024 + 1))).status_code == 413
    r = await upload(admin_client, item.id, b"not an image")
    assert r.json()["error"]["code"] == "invalid_image"


async def test_photo_limit(admin_client, make_lab, make_item):
    item = await make_item(await make_lab())
    for _ in range(10):
        assert (await upload(admin_client, item.id)).status_code == 201
    assert (await upload(admin_client, item.id)).json()["error"]["code"] == "photo_limit_reached"


async def test_reorder(admin_client, client, make_lab, make_item):
    item = await make_item(await make_lab())
    first = (await upload(admin_client, item.id)).json()["id"]
    second = (await upload(admin_client, item.id)).json()["id"]
    url = f"/api/items/{item.id}/photos/order"
    r = await admin_client.put(url, json={"photoIds": [second, first]})
    assert [p["id"] for p in r.json()] == [second, first]
    bad = await admin_client.put(url, json={"photoIds": [second]})
    assert bad.json()["error"]["code"] == "invalid_photo_order"


async def test_delete_photo_and_item_remove_files(admin_client, make_lab, make_item, storage):
    a = await make_item(await make_lab())
    b = await make_item(await make_lab(slug="erb-209", name="ERB 209"))
    photo = (await upload(admin_client, a.id)).json()["id"]
    await upload(admin_client, b.id)
    wrong = await admin_client.delete(f"/api/items/{b.id}/photos/{photo}")
    assert wrong.json()["error"]["code"] == "photo_not_found"
    assert (await admin_client.delete(f"/api/items/{a.id}/photos/{photo}")).status_code == 204
    assert len(list(storage.root.rglob("*.webp"))) == 2
    assert (await admin_client.delete(f"/api/items/{b.id}")).status_code == 204
    assert not list(storage.root.rglob("*.webp"))
```

`LocalStorage` exposes `root` as a public attribute for these assertions.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/items/test_photos_api.py -v`
Expected: FAIL with `501`

- [ ] **Step 3: Implement `photos.py` and replace the photo stubs and item delete**

- [ ] **Step 4: Run the tests to verify they pass, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): implement item photo uploads"
```

---

### Task 7: Serve assets through nginx

**Files:**
- Modify: `src/docker-compose.yml`, `src/frontend/nginx.conf`, `src/backend/Dockerfile`

**Interfaces:**
- Produces: `/assets/*` served by nginx from the shared volume, and photo uploads up to 11 MB through the proxy.

- [ ] **Step 1: Add the volume and the nginx locations**

- Compose: add a named volume `assets`. Mount it at `/app/assets` in `backend`, and at `/srv/assets:ro` in `frontend`.
- Dockerfile: create `/app/assets`, owned by the non-root user, so the named volume inherits write permission.
- nginx:
  - `location /assets/ { alias /srv/assets/; add_header Cache-Control "public, max-age=31536000, immutable"; }`
  - `location ~ ^/api/items/\d+/photos$ { client_max_body_size 11m; proxy_pass http://backend:5000; }`, with the same proxy headers as `/api/`

- [ ] **Step 2: Verify end to end**

Run from `src/`: `docker compose up --build -d`
Expected, after creating an admin, a lab, and an item through `/api/docs`:
- Uploading a phone photo through `/api/docs` returns `201`.
- `curl -I http://localhost<url>` returns `200` with `content-type: image/webp` and the immutable cache header.
- An upload over 11 MB returns `413` from nginx.

- [ ] **Step 3: Commit**

```bash
git add src/docker-compose.yml src/frontend/nginx.conf src/backend/Dockerfile
git commit -m "feat: serve uploaded assets through nginx"
```

# Search Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build hybrid item search (full text, trigram, and local embeddings, fused by reciprocal rank fusion) with natural-language status and lab parsing, kept in sync with item edits.

**Architecture:** `core/embeddings.py` wraps fastembed. `features/search/` owns parsing, indexing, retrieval, and fusion. Items and categories emit `search_content_changed` through `core/events.py`, and search subscribes to it. Task 1 is a benchmark gate on real hardware that must pass before anything else proceeds.

**Tech Stack:** Foundation stack, plus `fastembed`, `pgvector` (Python package), the `pgvector/pgvector:pg16` image, and the `pg_trgm` extension.

**Spec:** `docs/superpowers/specs/003-search-core-design.md`, under `001-backend-architecture-design.md` and `002-labs-items-design.md`

**Prerequisite:** Plan 002 merged. This plan uses `Item`, `ItemStatus`, `ItemFilters`, `ItemSummary`, `to_summary`, `Lab`, `LabSummary`, `CategoryRead`, `Storage`, `get_storage`, and the fixtures `make_lab`, `make_category`, and `make_item`.

**Branch:** `feat/search-core` from `main`. Task 2 is the contract PR.

## Global Constraints

- All of plan 001's Global Constraints apply.
- The model is `BAAI/bge-small-en-v1.5` with 384 dimensions, a code constant. Queries use `query_embed` and items use `passage_embed`.
- The model is never downloaded at runtime in production. `EMBEDDING_CACHE_DIR` defaults to `/app/models`.
- Embedding always runs through `run_in_threadpool`, never on the event loop.
- `TRIGRAM_THRESHOLD = 0.35`, `CANDIDATES_PER_LIST = 50`, `RRF_K = 60`. `MIN_SEMANTIC_SIMILARITY` is calibrated in Task 5. All four live in `features/search/service.py`.
- Categories are never parsed into filters.
- Search reads items only through `items.service.filter_conditions` and `items.service.get_items_by_ids`.

## Review Focus

1. **A query that is only punctuation or stopwords** (like `"?!"` or `"the"`) must not error. Building the `tsquery` from alphanumeric tokens only avoids it, and trigram and semantic matching still run. Pinned in Task 5.
2. **A bare number that matches two labs' rooms** must not become a filter. Pinned in Task 3.
3. **An item whose category is renamed** must be re-embedded, because the category name is part of its text. Pinned in Task 4.
4. **Explicit `?status=` conflicting with a parsed status** must let the explicit value win, and the interpretation must report it. Pinned in Task 5.
5. **The embedding model failing during an item edit** must still save the edit and log the error, and `reindex` must repair it later. Pinned in Task 4.

## File Map

```
src/backend/app/core/embeddings.py         MODEL_NAME, DIMENSIONS, load_model, Embedder, get_embedder
src/backend/app/core/events.py             Event, search_content_changed
src/backend/app/core/config.py             add embedding_cache_dir
src/backend/app/cli.py                     add search-benchmark, reindex
src/backend/app/main.py                    lifespan (load model, reindex), subscribe handler, include search router
src/backend/app/features/items/models.py   add search_vector
src/backend/app/features/items/service.py  extract filter_conditions, add get_items_by_ids, emit event
src/backend/app/features/categories/service.py   emit event
src/backend/app/features/labs/service.py   add all_labs
src/backend/app/features/search/           models (SearchDocument), schemas, parser, indexing, service, router
src/backend/migrations/versions/           extensions, search_keywords_text, search_vector, search_documents
src/backend/tests/search/                  seed.py, test_parser.py, test_indexing.py, test_relevance.py, test_search_api.py
src/docker-compose.yml  .github/workflows/backend.yml  src/backend/Dockerfile
```

---

### Task 1: Benchmark gate

**Files:**
- Create: `app/core/embeddings.py`
- Modify: `pyproject.toml`, `app/cli.py`, `app/core/config.py`, `src/backend/.env.example`, `.gitignore` (add `.models/`)
- Test: `tests/core/test_embeddings.py`

**Interfaces:**
- Produces:
  - `MODEL_NAME = "BAAI/bge-small-en-v1.5"` and `DIMENSIONS = 384`
  - `load_model(cache_dir: Path) -> TextEmbedding`
  - `class Embedder` with `__init__(self, model: TextEmbedding)`, `embed_query(self, text: str) -> list[float]`, and `embed_passages(self, texts: list[str]) -> list[list[float]]`
  - `get_embedder() -> Embedder`, cached with `lru_cache`, built from `get_settings().embedding_cache_dir`
  - `Settings.embedding_cache_dir: Path = Path("/app/models")`. `.env.example` sets `EMBEDDING_CACHE_DIR=./.models`.
  - CLI `search-benchmark [--cache-dir PATH]` (default `./.models`), which never calls `get_settings()`. It prints load time, batch embed time for 2000 texts, query p50 and p95 over 100 queries, and peak RSS (`resource.getrusage(RUSAGE_SELF).ru_maxrss`, which is in KB on Linux). It exits `1` if p95 is at least 100 ms or peak RSS is at least 1 GB. Texts are generated deterministically with `random.Random(0)` from fixed name, category, and description fragments.

- [ ] **Step 1: Add the dependencies**

Run: `uv add fastembed pgvector`

- [ ] **Step 2: Write the failing test**

```python
# tests/core/test_embeddings.py
import math

from app.core.embeddings import DIMENSIONS, get_embedder


def cosine(a, b):
    return sum(x * y for x, y in zip(a, b, strict=True)) / (math.hypot(*a) * math.hypot(*b))


def test_embeddings_capture_meaning():
    embedder = get_embedder()
    query = embedder.embed_query("cut wood")
    saw, scope = embedder.embed_passages(["Circular saw for cutting lumber", "Digital oscilloscope"])
    assert len(query) == DIMENSIONS
    assert cosine(query, saw) > cosine(query, scope)
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `uv run pytest tests/core/test_embeddings.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 4: Implement `embeddings.py` and the `search-benchmark` command**

- [ ] **Step 5: Run the test to verify it passes**

Run: `uv run pytest tests/core/test_embeddings.py -v`
Expected: PASS. The first run downloads the model into `./.models`.

- [ ] **Step 6: Run the gate on the target hardware**

On the lab Linux box, or the closest hardware if it is not yet assigned, run `uv sync && uv run python -m app.cli search-benchmark`.
Expected: exit `0`, with p95 under 100 ms and peak RSS under 1 GB.

Record the printed numbers and the hardware (`nproc`, `free -h`, CPU model) in the PR description. **If the gate fails, stop and report to the user. Do not continue to Task 2.**

- [ ] **Step 7: Commit**

```bash
git add src/backend .gitignore
git commit -m "feat(backend): add embedding model wrapper and search benchmark"
```

---

### Task 2: Contract PR (extensions, schema, stub endpoint)

**Files:**
- Create: `features/search/{__init__,models,schemas,router}.py` and the migration
- Modify: `features/items/models.py`, `app/models.py`, `app/main.py`, `src/docker-compose.yml` (db image), `.github/workflows/backend.yml` (service images), `openapi.json`
- Test: `tests/search/test_contract.py`

**Interfaces:**
- Produces:
  - `Item.search_vector: Mapped[str]`, declared as `mapped_column(TSVECTOR, Computed(<spec expression>, persisted=True), deferred=True)` with `Index("ix_items_search_vector", "search_vector", postgresql_using="gin")`
  - `SearchDocument` (`search_documents`) with `item_id` (primary key, FK with CASCADE), `embedding: Mapped[list[float]]` (`VECTOR(DIMENSIONS)`), `content_hash` (`String(64)`), `model` (`String(100)`), and `indexed_at` (`server_default=func.now()`)
  - `Interpretation(ApiSchema)` with `query: str`, `status: ItemStatus | None`, `lab: LabSummary | None`, and `category: CategoryRead | None`
  - `class SearchResponse(Page[ItemSummary])` with `interpretation: Interpretation`
  - `SearchParams` dataclass dependency with `q: str` (`min_length=1`, `max_length=200`), `lab: str | None`, `category: int | None`, and `status: ItemStatus | None`
  - `router = APIRouter(prefix="/search", tags=["search"])` with `search_items` (`GET ""`, operation ID `searchItems`), whose body is `not_implemented()`
- Migration, written by hand after autogenerate, in this order:
  1. `CREATE EXTENSION IF NOT EXISTS vector` and `CREATE EXTENSION IF NOT EXISTS pg_trgm`
  2. `CREATE FUNCTION search_keywords_text(text[]) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$ SELECT array_to_string($1, ' ') $$`
  3. Add `items.search_vector` and its GIN index
  4. Create `search_documents`
  
  The downgrade reverses each step.

- [ ] **Step 1: Switch Postgres to pgvector**

Change the `db` image to `pgvector/pgvector:pg16` in Compose and in both CI service containers. Then run `docker compose down -v && docker compose up -d db`. Dropping the volume avoids a collation mismatch between the Alpine and Debian builds, and no real data exists yet because deployment is slice 004.

- [ ] **Step 2: Write the failing test**

```python
# tests/search/test_contract.py
async def test_search_contract(client):
    spec = (await client.get("/api/openapi.json")).json()
    op = spec["paths"]["/api/search"]["get"]
    assert op["operationId"] == "searchItems"
    schema = op["responses"]["200"]["content"]["application/json"]["schema"]["$ref"]
    assert schema.endswith("/SearchResponse")
    assert (await client.get("/api/search?q=x")).status_code == 501
    assert (await client.get("/api/search")).status_code == 422
```

- [ ] **Step 3: Run the test to verify it fails, implement, and generate the migration**

Run: `uv run pytest tests/search/test_contract.py -v` and expect FAIL with a `KeyError` on `/api/search`. Then implement and run `uv run alembic revision --autogenerate -m "add search documents and search vector"`. Edit the result to match the order above, and use `op.execute` for the extensions and the function.

- [ ] **Step 4: Verify**

Run: `uv run pytest -v && uv run alembic check && uv run alembic downgrade -1 && uv run alembic upgrade head`
Expected: all passed, no drift, and the downgrade round-trip succeeds

- [ ] **Step 5: Export the contract, commit, and open the contract PR**

```bash
uv run python -m app.cli export-openapi
git add src/backend src/docker-compose.yml .github/workflows/backend.yml
git commit -m "feat(backend): add search contract and storage"
```

---

### Task 3: Query parser

**Files:**
- Create: `features/search/parser.py`
- Modify: `features/labs/service.py`
- Test: `tests/search/test_parser.py`

**Interfaces:**
- Produces:
  - `LabTerm` frozen dataclass with `slug: str`, `name: str`, and `room: str`
  - `ParsedQuery` frozen dataclass with `text: str`, `status: ItemStatus | None`, and `lab_slug: str | None`
  - `parse_query(raw: str, labs: Sequence[LabTerm]) -> ParsedQuery`, pure
  - `STATUS_PHRASES: dict[str, ItemStatus]`, copied from the spec table
  - `labs.service.all_labs(db) -> list[Lab]`
- Algorithm: build one alternation regex per kind from the phrases, sorted longest first, with `\b` boundaries, `re.IGNORECASE`, and an optional `(?:\b(?:in|at|from)\s+)?` prefix for labs. Rooms that more than one lab shares are left out of the bare-room phrases. Apply the status regex, then the lab regex. Each kind takes only its first match, and every match of a kind is removed. Collapse whitespace and strip.

- [ ] **Step 1: Write the failing tests**

```python
# tests/search/test_parser.py
import pytest

from app.features.items.models import ItemStatus
from app.features.search.parser import LabTerm, parse_query

LABS = [LabTerm("erb-208", "ERB 208", "208"), LabTerm("erb-202", "ERB 202", "202")]


@pytest.mark.parametrize(("raw", "text", "status", "lab"), [
    ("oscilloscope", "oscilloscope", None, None),
    ("available oscilloscopes in 208", "oscilloscopes", ItemStatus.available, "erb-208"),
    ("Free drills at ERB 202", "drills", ItemStatus.available, "erb-202"),
    ("soldering iron in stock", "soldering iron", ItemStatus.available, None),
    ("printers checked out", "printers", ItemStatus.in_use, None),
    ("not working scope", "scope", ItemStatus.broken, None),
    ("lost calipers", "calipers", ItemStatus.missing, None),
    ("room 202 power supply", "power supply", None, "erb-202"),
    ("multimeter erb-208", "multimeter", None, "erb-208"),
    ("broken", "", ItemStatus.broken, None),
    ("tool cart", "tool cart", None, None),
])
def test_parse(raw, text, status, lab):
    p = parse_query(raw, LABS)
    assert (p.text, p.status, p.lab_slug) == (text, status, lab)


def test_ambiguous_bare_room_is_not_a_filter():
    labs = [LabTerm("erb-208", "ERB 208", "208"), LabTerm("nh-208", "NH 208", "208")]
    parsed = parse_query("drill 208", labs)
    assert parsed.lab_slug is None
    assert parsed.text == "drill 208"


def test_room_number_inside_a_word_is_ignored():
    assert parse_query("model 2080 printer", LABS).lab_slug is None
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/search/test_parser.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Implement `parser.py` and `all_labs`**

- [ ] **Step 4: Run the tests to verify they pass, then commit**

Run: `uv run pytest tests/search/test_parser.py -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): add natural-language search query parser"
```

---

### Task 4: Events and index sync

**Files:**
- Create: `app/core/events.py`, `features/search/indexing.py`
- Modify: `features/items/service.py`, `features/categories/service.py`, `app/main.py`, `app/cli.py`
- Test: `tests/search/test_indexing.py`

**Interfaces:**
- Produces:
  - `Handler = Callable[[AsyncSession], Awaitable[None]]`
  - `class Event` with `subscribe(self, handler: Handler) -> None` and `async emit(self, db: AsyncSession) -> None`. `emit` awaits each handler in order, and logs and swallows any handler exception with `logger.exception`, naming the handler.
  - `search_content_changed = Event()`
  - In `indexing.py`:
    - `document_text(item: Item) -> str`, using the spec format
    - `content_hash(text: str) -> str`, the SHA-256 hex digest
    - `async reindex_stale(db: AsyncSession) -> int`, which loads all items with categories, collects stale ones (no document, a different hash, or a different `model`), embeds their texts through `run_in_threadpool(get_embedder().embed_passages, texts)`, upserts with `insert(...).on_conflict_do_update(index_elements=["item_id"])`, commits, and returns the count
  - `create_app()` calls `search_content_changed.subscribe(reindex_stale)` and adds a lifespan that calls `get_embedder()` and then `reindex_stale` in a `SessionLocal()` session. The `httpx` test transport does not run the lifespan, so tests call `reindex_stale` explicitly.
  - Items `create_item`, `update_item`, and `delete_item`, and categories `create_category`, `update_category`, and `delete_category`, call `await search_content_changed.emit(db)` after their commit.
  - CLI `reindex`, which prints the number of documents updated

- [ ] **Step 1: Write the failing tests**

```python
# tests/search/test_indexing.py
from sqlalchemy import select

from app.core.embeddings import MODEL_NAME
from app.core.events import Event
from app.features.search import indexing
from app.features.search.models import SearchDocument


async def docs(db):
    return {d.item_id: d for d in await db.scalars(select(SearchDocument))}


async def test_reindex_embeds_new_items_once(db_session, make_lab, make_item):
    item = await make_item(await make_lab(), name="Multimeter")
    assert await indexing.reindex_stale(db_session) == 1
    assert await indexing.reindex_stale(db_session) == 0
    doc = (await docs(db_session))[item.id]
    assert doc.model == MODEL_NAME and len(doc.embedding) == 384


async def test_item_edit_triggers_reembed(admin_client, db_session, make_lab, make_item):
    item = await make_item(await make_lab(), name="Multimeter")
    await indexing.reindex_stale(db_session)
    before = (await docs(db_session))[item.id].content_hash
    await admin_client.patch(f"/api/items/{item.id}", json={"description": "Fluke 117"})
    db_session.expire_all()
    assert (await docs(db_session))[item.id].content_hash != before


async def test_category_rename_triggers_reembed(admin_client, db_session, make_lab, make_category, make_item):
    cat = await make_category(name="Electronics")
    item = await make_item(await make_lab(), category_id=cat.id)
    await indexing.reindex_stale(db_session)
    before = (await docs(db_session))[item.id].content_hash
    await admin_client.patch(f"/api/categories/{cat.id}", json={"name": "Test Equipment"})
    db_session.expire_all()
    assert (await docs(db_session))[item.id].content_hash != before


async def test_model_change_marks_stale(db_session, make_lab, make_item):
    item = await make_item(await make_lab())
    await indexing.reindex_stale(db_session)
    (await docs(db_session))[item.id].model = "old-model"
    await db_session.commit()
    assert await indexing.reindex_stale(db_session) == 1


async def test_failing_handler_is_logged_not_raised(db_session, caplog):
    event = Event()

    async def boom(db):
        raise RuntimeError("model crashed")

    event.subscribe(boom)
    await event.emit(db_session)
    assert "model crashed" in caplog.text
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/search/test_indexing.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Implement the events, indexing, and emit calls, plus the lifespan and CLI wiring**

- [ ] **Step 4: Run the full suite, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): keep search embeddings in sync with item changes"
```

---

### Task 5: Retrieval, fusion, endpoint, and relevance suite

**Files:**
- Create: `features/search/service.py`, `tests/search/seed.py`
- Modify: `features/search/router.py`, `features/items/service.py`
- Test: `tests/search/test_search_api.py`, `tests/search/test_relevance.py`

**Interfaces:**
- Consumes: `parse_query`, `all_labs`, `get_embedder`, `filter_conditions`, `get_items_by_ids`, `to_summary`.
- Produces:
  - `items.service.filter_conditions(filters: ItemFilters) -> list[ColumnElement[bool]]`, which `list_items` is refactored to use. The lab filter is `Item.lab.has(Lab.slug == slug)`.
  - `items.service.get_items_by_ids(db, ids: Sequence[int]) -> list[Item]`, eager-loaded and in the order of `ids`
  - `prefix_tsquery(text: str) -> str | None`, which joins `re.findall(r"[a-z0-9]+", text.lower())` with `" & "`, appends `":*"` to the last token, and returns `None` when there are no tokens
  - `rrf(*ranked: Sequence[int]) -> list[int]`, which fuses with `RRF_K` and returns IDs by descending score. Ties keep first-seen order, and the service re-sorts ties by name.
  - `async search(db, params: SearchParams, *, limit: int, offset: int) -> tuple[list[Item], int, Interpretation]`
  - `seed_inventory(make_lab, make_category, make_item) -> dict[str, Item]`, which creates the spec's two labs and 25 items, keyed by item name

- [ ] **Step 1: Write the seed and the failing tests**

`seed.py` defines these 25 items. Each entry is name, lab (`erb-208` or `erb-202`), category, keywords, description, and status (default `available`):

1. Siglent SDS1104X-E Oscilloscope, 208, Electronics, ["scope", "waveform"], "Four channel 100 MHz digital storage oscilloscope for viewing signals over time"
2. Agilent DSO-X 2002A Oscilloscope, 202, Electronics, ["scope"], "Two channel digital storage oscilloscope"
3. Oscilloscope Probe Set, 208, Electronics, ["probe"], "10x passive probes for oscilloscopes"
4. Fluke 117 Multimeter, 208, Electronics, ["dmm", "measure voltage", "continuity"], "Digital multimeter for voltage, current, and resistance"
5. Hakko FX-888D Soldering Station, 208, Electronics, ["solder", "iron"], "Temperature controlled soldering iron station"
6. Tekpower Bench Power Supply, 208, Electronics, ["psu"], "Adjustable 30V 5A DC bench power supply"
7. DR. Meter Power Supply, 208, Electronics, ["psu"], "Variable 30V 10A DC power supply", status `in_use`
8. DeWalt Cordless Drill, 208, Tools, ["drill driver"], "20V cordless drill and driver kit"
9. Circular Saw, 208, Tools, [], "Corded circular saw for cutting plywood and lumber"
10. Digital Calipers, 208, Tools, ["measure"], "Stainless steel digital calipers, 0 to 150 mm"
11. Tape Measure, 208, Tools, [], "25 ft tape measure"
12. Heat Gun, 208, Tools, [], "Variable temperature heat gun for heat shrink tubing", status `broken`
13. Wire Strippers, 208, Tools, [], "Self-adjusting wire stripper and cutter"
14. Air Compressor, 202, Tools, ["air"], "Portable air compressor for pneumatic tools"
15. Prusa MK4 3D Printer, 208, Printers, ["fdm"], "Desktop FDM printer for PLA and PETG parts"
16. Sawyer Robot Arm, 202, Robotics, ["cobot"], "Seven axis collaborative robot arm"
17. Small Robot Arm, 208, Robotics, [], "Desktop four axis robot arm for prototyping"
18. Elechawk Cable Kit, 208, Electronics, ["wires", "jumper"], "Assorted electrical cables and connectors"
19. Tool Cart, 208, Furniture, [], "Rolling cart with drawers for tools"
20. Meta Quest 3, 208, VR, ["vr headset"], "Standalone virtual reality headset"
21. Laptop, 208, Computers, [], "Windows laptop for lab use"
22. Wheelchair, 202, Other, [], "Manual wheelchair for accessibility projects"
23. Tenergy Balance Charger, 208, Electronics, ["lipo", "battery"], "Multi-chemistry battery balance charger"
24. Arduino Uno R3, 208, Electronics, ["microcontroller"], "ATmega328P development board"
25. Safety Glasses, 208, Safety, [], "ANSI Z87.1 rated protective eyewear"

```python
# tests/search/conftest.py
import pytest

from app.features.search import indexing
from tests.search.seed import seed_inventory


@pytest.fixture
async def seeded(client, db_session, make_lab, make_category, make_item):
    await seed_inventory(make_lab, make_category, make_item)
    await indexing.reindex_stale(db_session)
    return client


@pytest.fixture
def top():
    async def run(client, query, **params):
        r = await client.get("/api/search", params={"q": query, **params})
        assert r.status_code == 200
        return r.json()

    return run
```

```python
# tests/search/test_relevance.py
import pytest

SCOPES = {"Siglent SDS1104X-E Oscilloscope", "Agilent DSO-X 2002A Oscilloscope"}
SUPPLIES = {"Tekpower Bench Power Supply", "DR. Meter Power Supply"}

CASES = [
    ("oscilloscope", SCOPES),
    ("osciloscope", SCOPES),
    ("solder", {"Hakko FX-888D Soldering Station"}),
    ("measure voltage", {"Fluke 117 Multimeter"}),
    ("DMM", {"Fluke 117 Multimeter"}),
    ("power suply", SUPPLIES),
    ("cordless drill", {"DeWalt Cordless Drill"}),
    ("cut wood", {"Circular Saw"}),
    ("see a signal over time", SCOPES),
    ("protect my eyes", {"Safety Glasses"}),
    ("virtual reality", {"Meta Quest 3"}),
]


@pytest.mark.parametrize(("query", "expected"), CASES)
async def test_top_result(seeded, top, query, expected):
    assert (await top(seeded, query))["items"][0]["name"] in expected


async def test_status_intent(seeded, top):
    body = await top(seeded, "available power supply")
    assert body["items"][0]["name"] == "Tekpower Bench Power Supply"
    assert body["interpretation"]["status"] == "available"
    assert all(i["status"] == "available" for i in body["items"])


async def test_lab_intent(seeded, top):
    body = await top(seeded, "oscilloscope in 202")
    assert body["items"][0]["name"] == "Agilent DSO-X 2002A Oscilloscope"
    assert body["interpretation"]["lab"]["slug"] == "erb-202"


async def test_filter_only_query(seeded, top):
    body = await top(seeded, "broken")
    assert [i["name"] for i in body["items"]] == ["Heat Gun"]
    assert body["interpretation"]["query"] == ""


async def test_nonsense_returns_nothing(seeded, top):
    assert (await top(seeded, "xyzzy"))["total"] == 0
```

```python
# tests/search/test_search_api.py
from app.features.search.service import prefix_tsquery, rrf


def test_prefix_tsquery():
    assert prefix_tsquery("Power suply!") == "power & suply:*"
    assert prefix_tsquery("?!") is None


def test_rrf_rewards_agreement():
    assert rrf([1, 2, 3], [2, 1], [2])[0] == 2


async def test_punctuation_only_query_is_safe(seeded, top):
    assert (await top(seeded, "?!"))["total"] == 0


async def test_explicit_status_overrides_parsed(seeded, top):
    body = await top(seeded, "available power supply", status="in_use")
    assert body["interpretation"]["status"] == "in_use"
    assert [i["name"] for i in body["items"]] == ["DR. Meter Power Supply"]


async def test_unknown_category_param_interprets_null(seeded, top):
    body = await top(seeded, "drill", category=999999)
    assert body["interpretation"]["category"] is None
    assert body["total"] == 0


async def test_pagination(seeded, top):
    first = await top(seeded, "tools", limit=2)
    second = await top(seeded, "tools", limit=2, offset=2)
    assert len(first["items"]) == 2
    assert first["total"] == second["total"]
    assert {i["id"] for i in first["items"]}.isdisjoint({i["id"] for i in second["items"]})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/search -v`
Expected: FAIL with `ImportError` for `app.features.search.service`

- [ ] **Step 3: Refactor the items seam, then implement the service and the endpoint**

- Run each retrieval list as one query: `select(Item.id, <score>).where(*filter_conditions(...), <match>).order_by(<score desc>).limit(CANDIDATES_PER_LIST)`.
- The semantic list joins `SearchDocument` and computes `1 - SearchDocument.embedding.cosine_distance(vector)`.
- Skip the full-text list when `prefix_tsquery` returns `None`.
- Build summaries with `to_summary(item, storage)` in fused order.

- [ ] **Step 4: Calibrate `MIN_SEMANTIC_SIMILARITY`**

Start at `0.6`. With a throwaway script in the scratchpad (not committed), print each relevance case's top semantic similarity and the best similarity for `xyzzy` and `?!`. Set the constant midway between the highest nonsense score and the lowest expected-hit score, rounded to two decimals, and record both numbers in a one-line comment next to the constant.

If no value separates them, report the overlapping cases to the user before changing any case or weight.

- [ ] **Step 5: Run the full suite, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): implement hybrid search with relevance suite"
```

---

### Task 6: Package the model for deployment

**Files:**
- Modify: `src/backend/Dockerfile`, `src/docker-compose.yml`, `.github/workflows/backend.yml`, `src/backend/README.md`

**Interfaces:**
- Produces: an image that contains the model, a backend memory limit of `1g`, and CI that caches the model.

- [ ] **Step 1: Bake the model into the image**

After `uv sync`, add `RUN uv run --no-sync python -c "from pathlib import Path; from app.core.embeddings import load_model; load_model(Path('/app/models'))"`, owned by the non-root user. Set `ENV EMBEDDING_CACHE_DIR=/app/models` and `HF_HUB_OFFLINE=1` so runtime never reaches the network.

- [ ] **Step 2: Update Compose and CI**

- Compose: set the backend `memory: 1g`.
- CI: set `EMBEDDING_CACHE_DIR: ${{ github.workspace }}/src/backend/.models` in every job, and add `actions/cache` keyed on `fastembed-bge-small-en-v1.5` for that path in the `test` job.

- [ ] **Step 3: Verify the offline start**

Run from `src/`: `docker compose build backend`, then `docker run --rm --network none -e DATABASE_URL=postgresql+asyncpg://x:y@db/z src-backend uv run --no-sync python -c "from app.core.embeddings import get_embedder; print(len(get_embedder().embed_query('drill')))"`
Expected: `384`, which proves the model loads with no network at all.

Then run `docker compose up -d` and search through `/api/docs` after creating a lab and an item.
Expected:
- The backend logs show the startup reindex count.
- `GET /api/search?q=multimeter` returns the item.
- `docker stats` shows backend memory under 1 GB.

- [ ] **Step 4: Document and commit**

Add search notes to the README: the model location, `reindex`, and `search-benchmark`.

```bash
git add src/backend src/docker-compose.yml .github/workflows/backend.yml
git commit -m "build: bake embedding model into backend image"
```

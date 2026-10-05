# Search Type-Ahead Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add type-ahead suggestions, did-you-mean corrections, match highlights, and facet counts to search.

**Architecture:** Everything lives in `features/search/`. `suggest.py`, `spelling.py`, `highlight.py`, and `facets.py` each own one capability. `service.search` gains a reusable `fused_ids` step so facets can rerun retrieval without one filter. A `search_terms` materialized view, refreshed by the existing reindex hook, supplies the spelling vocabulary.

**Tech Stack:** Foundation stack, plus `pg_trgm` (already enabled in 003).

**Spec:** `docs/superpowers/specs/005-search-typeahead-design.md`, under `003-search-core-design.md`

**Prerequisite:** Plan 003 merged. This plan uses `SearchParams`, `SearchResponse`, `Interpretation`, `search`, `parse_query`, `reindex_stale`, `filter_conditions`, `get_items_by_ids`, `ItemFilters`, `to_summary`, and the fixtures `seeded` and `top` with the 25-item seed.

**Branch:** `feat/search-typeahead` from `main`. Task 1 is the contract PR. After it merges, Tasks 2 through 5 touch separate files and can run in parallel on separate branches.

## Global Constraints

- All of plan 001's Global Constraints apply.
- Suggestions never call the embedder.
- Thresholds are module constants:
  - `SUGGEST_TRIGRAM = 0.3`, `SUGGEST_CAPS = {"item": 5, "category": 2, "lab": 2}` in `suggest.py`
  - `CORRECTION_SIMILARITY = 0.45`, `MIN_CORRECTABLE = 3` in `spelling.py`
  - `HIGHLIGHT_SIMILARITY = 0.45`, `STOPWORDS` (the spec's list) in `highlight.py`
- Highlight offsets are UTF-16 code units.
- The 003 relevance suite must stay green after every task.

## Review Focus

1. **Typing a single character** like `"o"` must return capped, ordered suggestions quickly, not every item. Pinned in Task 2.
2. **A name with an emoji or accent** must highlight at the right place in JavaScript. Pinned in Task 4.
3. **Renaming an item to a new word** must make that word correctable at once, through the view refresh. Pinned in Task 3.
4. **Did-you-mean on a query with lab and status phrases** must keep those phrases exactly as typed. Pinned in Task 3.
5. **Selecting a status filter** must keep the other statuses visible in the status facet. Pinned in Task 5.

## File Map

```
src/backend/app/features/search/schemas.py     add Suggestion types, SuggestResponse, Range, SearchHit, facet models, extend SearchResponse
src/backend/app/features/search/router.py      add suggest endpoint, fill new fields
src/backend/app/features/search/service.py     extract fused_ids, compose new fields
src/backend/app/features/search/suggest.py     suggest()
src/backend/app/features/search/spelling.py    did_you_mean()
src/backend/app/features/search/highlight.py   trigram_similarity, query_tokens, highlight_ranges, matched_keywords
src/backend/app/features/search/facets.py      compute_facets()
src/backend/app/features/search/indexing.py    refresh search_terms
src/backend/migrations/versions/               create search_terms view and indexes
src/backend/tests/search/test_suggest.py  test_spelling.py  test_highlight.py  test_facets.py
```

---

### Task 1: Contract PR

**Files:**
- Create: the migration
- Modify: `features/search/schemas.py`, `features/search/router.py`, `openapi.json`
- Test: `tests/search/test_typeahead_contract.py`

**Interfaces:**
- Produces:
  - `ItemSuggestion(ApiSchema)` with `type: Literal["item"]`, `id`, `name`, `lab_name`, `cover_thumbnail_url: str | None`
  - `CategorySuggestion` with `type: Literal["category"]`, `id`, `name`, `item_count`
  - `LabSuggestion` with `type: Literal["lab"]`, `slug`, `name`
  - `Suggestion = Annotated[ItemSuggestion | CategorySuggestion | LabSuggestion, Field(discriminator="type")]`
  - `SuggestResponse` with `suggestions: list[Suggestion]`
  - `Range(ApiSchema)` with `start: int` and `end: int`
  - `class SearchHit(ItemSummary)` with `name_highlights: list[Range] = []` and `matched_keywords: list[str] = []`
  - `CategoryFacet` (`id`, `name`, `count`), `LabFacet` (`slug`, `name`, `count`), `StatusFacet` (`status: ItemStatus`, `count`)
  - `Facets` with `categories`, `labs`, and `statuses` lists, each defaulting to `[]`
  - `SearchResponse` now extends `Page[SearchHit]` and adds `did_you_mean: str | None = None` and `facets: Facets = Facets()`
  - `suggest_search` (`GET /suggest`, operation ID `suggestSearch`) with `q` (1 to 100) and `limit` (1 to 10, default 8), whose body is `not_implemented()`. Declare it **before** any parameterized search route.
- Migration: create `search_terms` with `op.execute`, using the spec's definition (the `UNION` of words split by `regexp_split_to_table(lower(...), '[^a-z0-9]+')` from `items.name`, `search_keywords_text(items.keywords)`, and `categories.name`, filtered to `length(word) >= 3`, `SELECT DISTINCT`). Add a unique index `uq_search_terms_word` and a GIN index `ix_search_terms_word_trgm` with `gin_trgm_ops`. The downgrade drops the view.

- [ ] **Step 1: Write the failing test**

```python
# tests/search/test_typeahead_contract.py
async def test_typeahead_contract(client):
    spec = (await client.get("/api/openapi.json")).json()
    assert spec["paths"]["/api/search/suggest"]["get"]["operationId"] == "suggestSearch"
    props = spec["components"]["schemas"]["SearchResponse"]["properties"]
    assert {"didYouMean", "facets", "interpretation", "items", "total"} <= props.keys()
    hit = spec["components"]["schemas"]["SearchHit"]["properties"]
    assert {"nameHighlights", "matchedKeywords", "coverThumbnailUrl"} <= hit.keys()
    assert (await client.get("/api/search/suggest?q=o")).status_code == 501
```

- [ ] **Step 2: Run the test to verify it fails, then implement**

Run: `uv run pytest tests/search/test_typeahead_contract.py -v`
Expected: FAIL with a `KeyError` on `/api/search/suggest`. Implement the schemas, the stub, and the migration.

- [ ] **Step 3: Verify**

Run: `uv run pytest -v && uv run alembic check && uv run alembic downgrade -1 && uv run alembic upgrade head`
Expected: all passed, including the 003 suite, with no drift

- [ ] **Step 4: Export the contract, commit, and open the contract PR**

```bash
uv run python -m app.cli export-openapi
git add src/backend
git commit -m "feat(backend): add type-ahead search contract"
```

---

### Task 2: Suggestions

**Files:**
- Create: `features/search/suggest.py`
- Modify: `features/search/router.py`
- Test: `tests/search/test_suggest.py`

**Interfaces:**
- Consumes: `Item`, `ItemPhoto`, `Category`, `Lab`, `Storage`.
- Produces: `async suggest(db, storage: Storage, q: str, limit: int) -> list[Suggestion]`.
  - It lowercases and trims `q`, and escapes `%`, `_`, and `\` for `LIKE`.
  - It runs one query per type, scoring with the SQL expression `CASE WHEN lower(name) LIKE :q || '%' THEN 3 WHEN lower(name) ~ ('(^|[^a-z0-9])' || :q_regex) THEN 2 ELSE similarity(lower(name), :q) END`, where `:q_regex` is `re.escape(q)`. It keeps rows scoring at least `SUGGEST_TRIGRAM` and limits each type to its cap.
  - Labs take the greatest score across name, slug, and room.
  - Category `item_count` comes from a `count` subquery on items.
  - Items load their lab and photos for `lab_name` and `cover_thumbnail_url`.
  - It merges all types, sorts by `(-score, name)`, and cuts to `limit`.

- [ ] **Step 1: Write the failing tests**

```python
# tests/search/test_suggest.py
async def suggestions(client, q, limit=8):
    r = await client.get("/api/search/suggest", params={"q": q, "limit": limit})
    assert r.status_code == 200
    return r.json()["suggestions"]


async def test_prefix_beats_word_start(seeded):
    items = [s["name"] for s in await suggestions(seeded, "osc") if s["type"] == "item"]
    assert items == ["Oscilloscope Probe Set", "Agilent DSO-X 2002A Oscilloscope", "Siglent SDS1104X-E Oscilloscope"]


async def test_category_with_count(seeded):
    cats = [s for s in await suggestions(seeded, "elec") if s["type"] == "category"]
    assert cats == [{"type": "category", "id": cats[0]["id"], "name": "Electronics", "itemCount": 10}]


async def test_lab_by_room(seeded):
    labs = [s for s in await suggestions(seeded, "202") if s["type"] == "lab"]
    assert labs == [{"type": "lab", "slug": "erb-202", "name": "ERB 202"}]


async def test_fuzzy_item(seeded):
    names = [s["name"] for s in await suggestions(seeded, "multimetr")]
    assert "Fluke 117 Multimeter" in names


async def test_caps_and_limit(seeded):
    result = await suggestions(seeded, "s", limit=10)
    assert len(result) <= 10
    assert sum(s["type"] == "item" for s in result) <= 5
    assert sum(s["type"] == "category" for s in result) <= 2
    assert len(await suggestions(seeded, "s", limit=3)) == 3


async def test_like_wildcards_are_literal(seeded):
    assert await suggestions(seeded, "%") == []
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/search/test_suggest.py -v`
Expected: FAIL with `501`

- [ ] **Step 3: Implement `suggest.py` and wire the route**

- [ ] **Step 4: Run the tests to verify they pass, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): add search suggestions"
```

---

### Task 3: Did you mean

**Files:**
- Create: `features/search/spelling.py`
- Modify: `features/search/indexing.py`, `features/search/service.py`
- Test: `tests/search/test_spelling.py`

**Interfaces:**
- Produces:
  - `refresh_terms(db) -> None`, which runs `REFRESH MATERIALIZED VIEW search_terms`. `reindex_stale` calls it before its commit on every run, including runs that embed nothing, so renames reach the vocabulary.
  - `async did_you_mean(db, raw: str, search_text: str) -> str | None`. For each eligible token of `search_text` (alphabetic, at least `MIN_CORRECTABLE` characters, not present in `search_terms`), it finds the best word with `word % :t AND similarity(word, :t) >= CORRECTION_SIMILARITY ORDER BY similarity DESC, word LIMIT 1`. It substitutes each correction into `raw` with `re.sub(rf"\b{re.escape(token)}\b", fix, raw, flags=re.IGNORECASE)`. It returns `None` when nothing changed.
  - `search` sets `did_you_mean` when the interpreted query is non-empty.

- [ ] **Step 1: Write the failing tests**

```python
# tests/search/test_spelling.py
import pytest

from app.features.search import indexing


@pytest.mark.parametrize(("query", "expected"), [
    ("osciloscpe", "oscilloscope"),
    ("solderng iron", "soldering iron"),
    ("osciloscpe in 202", "oscilloscope in 202"),
    ("available multimetr", "available multimeter"),
    ("oscilloscope", None),
    ("xyzzy", None),
])
async def test_did_you_mean(seeded, top, query, expected):
    assert (await top(seeded, query))["didYouMean"] == expected


async def test_vocabulary_follows_renames(seeded, top, admin_client, db_session):
    item = (await top(seeded, "laptop"))["items"][0]
    await admin_client.patch(f"/api/items/{item['id']}", json={"name": "Chromebook"})
    await indexing.reindex_stale(db_session)
    assert (await top(seeded, "chromebok"))["didYouMean"] == "chromebook"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/search/test_spelling.py -v`
Expected: FAIL, because `didYouMean` is always `None`

- [ ] **Step 3: Implement `spelling.py`, the refresh, and the service wiring**

- [ ] **Step 4: Run the tests to verify they pass, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): add did-you-mean corrections"
```

---

### Task 4: Highlights

**Files:**
- Create: `features/search/highlight.py`
- Modify: `features/search/service.py`, `features/search/router.py`
- Test: `tests/search/test_highlight.py`

**Interfaces:**
- Produces:
  - `trigram_similarity(a: str, b: str) -> float`, which follows pg_trgm. Each lowercased word is padded as `"  " + word + " "`, its set of 3-character windows is taken, and the result is `shared / (len(A) + len(B) - shared)`. It returns `0.0` when both sets are empty.
  - `query_tokens(search_text: str) -> list[str]`: lowercase alphanumeric tokens, excluding `STOPWORDS` and single characters, de-duplicated in order
  - `highlight_ranges(name: str, tokens: Sequence[str]) -> list[Range]`. For each match of `[A-Za-z0-9]+` in `name`, the first token the word starts with yields a prefix range. Otherwise, a token with `trigram_similarity` of at least `HIGHLIGHT_SIMILARITY` yields a whole-word range. Offsets are converted with `utf16_index(s, i) = len(s[:i].encode("utf-16-le")) // 2`.
  - `matched_keywords(keywords: Sequence[str], tokens: Sequence[str]) -> list[str]`, which keeps keywords in which any word prefix-matches or fuzzy-matches any token
  - `search` returns `SearchHit` objects built from `to_summary` plus these two fields

- [ ] **Step 1: Write the failing tests**

```python
# tests/search/test_highlight.py
from app.features.search.highlight import highlight_ranges, matched_keywords, query_tokens, trigram_similarity


def r(start, end):
    return {"start": start, "end": end}


def test_trigram_similarity_matches_pg_trgm():
    assert trigram_similarity("word", "word") == 1.0
    assert round(trigram_similarity("word", "two words"), 6) == 0.363636


def test_query_tokens_drop_stopwords():
    assert query_tokens("protect my eyes in the lab") == ["protect", "eyes", "lab"]


def test_prefix_and_fuzzy_ranges():
    ranges = highlight_ranges("Siglent SDS1104X-E Oscilloscope", ["osc"])
    assert [x.model_dump() for x in ranges] == [r(19, 22)]
    ranges = highlight_ranges("Siglent SDS1104X-E Oscilloscope", ["osciloscope"])
    assert [x.model_dump() for x in ranges] == [r(19, 31)]


def test_offsets_are_utf16():
    ranges = highlight_ranges("Café \N{WRENCH} Soldering Kit", ["soldering"])
    assert [x.model_dump() for x in ranges] == [r(8, 17)]


def test_matched_keywords():
    assert matched_keywords(["dmm", "measure voltage", "continuity"], ["measure", "voltage"]) == ["measure voltage"]


async def test_search_hits_carry_highlights(seeded, top):
    hit = next(i for i in (await top(seeded, "measure voltage"))["items"] if i["name"] == "Fluke 117 Multimeter")
    assert hit["matchedKeywords"] == ["measure voltage"]
    semantic = (await top(seeded, "protect my eyes"))["items"][0]
    assert semantic["nameHighlights"] == []
```

`trigram_similarity("word", "two words")` is `0.363636` in Postgres (`SELECT similarity('word', 'two words')`). Run that query once to confirm before relying on it.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/search/test_highlight.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Implement `highlight.py` and build hits in the service**

- [ ] **Step 4: Run the tests to verify they pass, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): add search match highlights"
```

---

### Task 5: Facets

**Files:**
- Create: `features/search/facets.py`
- Modify: `features/search/service.py`
- Test: `tests/search/test_facets.py`

**Interfaces:**
- Produces:
  - `async fused_ids(db, text: str, vector: list[float] | None, filters: ItemFilters) -> list[int]`, extracted from `search` with no behavior change. `search` embeds once and passes the vector.
  - `async compute_facets(db, text: str, vector: list[float] | None, filters: ItemFilters, main_ids: list[int]) -> Facets`. For each of `category`, `lab`, and `status`, it uses `main_ids` if that filter is unset, or `fused_ids` with that filter cleared via `dataclasses.replace`. When `text` is empty, it groups over `filter_conditions` directly instead of an ID list. Each facet is one `GROUP BY` query. Zero counts are omitted and null categories are skipped. Ordering is `count DESC`, then name or status.
  - `search` sets `facets` on every response.

- [ ] **Step 1: Write the failing tests**

```python
# tests/search/test_facets.py
async def test_lab_counts_sum_to_total(seeded, top):
    body = await top(seeded, "power supply")
    assert sum(f["count"] for f in body["facets"]["labs"]) == body["total"]
    assert sum(f["count"] for f in body["facets"]["statuses"]) == body["total"]


async def test_status_facet_ignores_its_own_filter(seeded, top):
    body = await top(seeded, "power supply", status="available")
    statuses = {f["status"] for f in body["facets"]["statuses"]}
    assert {"available", "in_use"} <= statuses
    assert all(i["status"] == "available" for i in body["items"])


async def test_filter_only_counts(seeded, top):
    body = await top(seeded, "broken")
    assert body["facets"]["statuses"] == [
        {"status": "available", "count": 23},
        {"status": "broken", "count": 1},
        {"status": "in_use", "count": 1},
    ]
    assert body["facets"]["labs"] == [{"slug": "erb-208", "name": "ERB 208", "count": 1}]


async def test_no_zero_counts(seeded, top):
    body = await top(seeded, "oscilloscope in 202")
    assert all(f["count"] > 0 for group in body["facets"].values() for f in group)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/search/test_facets.py -v`
Expected: FAIL, because the facets are empty

- [ ] **Step 3: Extract `fused_ids`, implement `facets.py`, and wire it into `search`**

- [ ] **Step 4: Run the full suite, including the 003 relevance suite, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): add search facet counts"
```

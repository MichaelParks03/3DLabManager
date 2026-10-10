# 003 Search Core Design

Slice 3 of the backend roadmap. It follows `001-backend-architecture-design.md` for conventions and builds on `002-labs-items-design.md`.

This spec supersedes the search decision in 001 ("Postgres only"). Search becomes hybrid: lexical matching plus local semantic embeddings, with natural-language filter parsing. Search is split into three slices:

- **003, search core** (this spec)
- **005, type-ahead:** suggestions, did-you-mean, highlights, and facets
- **006, search insights:** logging, admin reports, and a popularity boost

Slices 005 and 006 extend the response defined here additively.

## Goals

- Find items by name, typo, prefix, alias, and meaning. For example, "cut wood" finds the circular saw.
- Understand status and lab intent in free text. For example, "available oscilloscopes in 208".
- Run fully offline on the lab's Linux box with no per-query cost.
- Keep all ranking logic inside `features/search/`, so the approach can change without touching other features or the API.

Voice search is out of the backend's scope. The frontend converts speech to text with the browser's Web Speech API and calls the same endpoint.

## Benchmark gate

Before any search code is built on the model, `python -m app.cli search-benchmark` runs on the lab's Linux box, or on the closest available hardware if the box is not yet assigned.

The benchmark:

1. Loads the model.
2. Embeds 2000 synthetic item texts.
3. Times 100 single-query embeddings.

| Measure | Target |
|---|---|
| Query embedding latency | p95 under 100 ms |
| Peak process memory | under 1 GB |

If either target is missed, work stops and the approach is revisited. The fallbacks are an LLM fallback for weak queries, or an LLM API outright.

## Model

| Setting | Value |
|---|---|
| Model | `BAAI/bge-small-en-v1.5` via `fastembed` (ONNX, CPU) |
| Dimensions | 384 |
| Query encoding | `query_embed` |
| Item encoding | `passage_embed` |

The model is defined in code, not configuration, because the vector dimension depends on it.

- **Model files** are downloaded into the Docker image at build time and never at runtime. The cache directory comes from `EMBEDDING_CACHE_DIR` (default `/app/models`).
- **Loading:** the model loads once per process. Startup loads it eagerly, so a missing or broken model fails the start instead of failing the first search.
- **Execution:** embedding runs in a worker thread.

## Infrastructure changes

- **Postgres image:** Postgres becomes `pgvector/pgvector:pg16`, both in Compose and in CI.
- **Extensions:** a migration enables the `vector` and `pg_trgm` extensions.
- **Memory:** the backend memory limit rises from 384 MB to 1 GB.

## Data

### `search_documents`

This table is owned by search.

| Column | Type | Notes |
|---|---|---|
| `item_id` | bigint | Primary key, FK `items.id` `ON DELETE CASCADE` |
| `embedding` | `vector(384)` | |
| `content_hash` | `char(64)` | SHA-256 of the embedded text |
| `model` | text | The model name used |
| `indexed_at` | timestamptz | |

### `items.search_vector`

This is a generated, stored `tsvector` column, declared on the `Item` model because Alembic requires it there. Only search reads it.

```
setweight(to_tsvector('english', name), 'A')
|| setweight(to_tsvector('english', search_keywords_text(keywords)), 'B')
|| setweight(to_tsvector('english', description), 'C')
```

- `search_keywords_text(text[])` is a SQL function marked `IMMUTABLE` that wraps `array_to_string(..., ' ')`. The wrapper is needed because `array_to_string` is not immutable, so it cannot appear directly in a generated column.
- A GIN index covers `search_vector`.
- Trigram matching scans without an index. That is a few milliseconds at this inventory size, and remains adequate up to about 10,000 items.

### Embedded text

Each item is embedded from this text:

```
{name}. Category: {category name or "Uncategorized"}. Keywords: {keywords joined by ", "}. {description}
```

A document is **stale** when the SHA-256 of this text differs from `content_hash`, when `model` differs from the current model, or when no document exists for the item.

## Keeping the index in sync

`app/core/events.py` provides a minimal publish-subscribe `Event` and one event, `search_content_changed`.

1. The items and categories services emit it after each write commits: create, update, and delete for both.
2. `create_app` subscribes `search.indexing.reindex_stale`.
3. `reindex_stale(db)` loads every item with its category, finds the stale ones, embeds them in one batch, and upserts their documents.
4. The same function also runs:
   - at startup, in the app lifespan
   - on demand, with `python -m app.cli reindex`

Handler failures are logged and do not fail the write that triggered them. The item is already committed, and the next reindex repairs the stale document.

## Query pipeline

### 1. Parse

The query is parsed against vocabulary loaded from the database on each request (all labs). The parser is a pure function.

**Status phrases** are matched case-insensitively on word boundaries, longest first:

| Phrases | Status |
|---|---|
| available, free, in stock | `available` |
| in use, checked out, taken | `in_use` |
| broken, not working | `broken` |
| missing, lost | `missing` |

**Labs** match any of these, along with an optional leading "in", "at", or "from":

- the lab's slug
- the lab's name
- "lab {room}" or "room {room}"
- a bare room number, but only when exactly one lab has that room

**Categories are never parsed into filters.** A query such as "tool cart" must not filter to the Tools category. Category names are part of the embedded text, so they influence ranking without excluding anything.

Matched phrases are removed, and the remaining text, with whitespace collapsed, is the search text. The explicit `status` and `lab` parameters override parsed values.

### 2. Retrieve

Each list returns up to 50 item IDs, restricted to the active filters:

| List | Match | Rank |
|---|---|---|
| Full text | `search_vector @@ to_tsquery('english', q)`, where `q` ANDs the search text's alphanumeric tokens and makes the last token a prefix (`:*`) | `ts_rank_cd` |
| Trigram | `word_similarity(text, name)` or `word_similarity(text, search_keywords_text(keywords))` is at least `TRIGRAM_THRESHOLD` (0.35) | The greater similarity |
| Semantic | `1 - (embedding <=> query_vector)` is at least `MIN_SEMANTIC_SIMILARITY` | Cosine distance |

`MIN_SEMANTIC_SIMILARITY` is calibrated against the relevance suite and stored as one constant. Without the floor, nonsense queries would still return their nearest items.

### 3. Fuse

Reciprocal rank fusion combines the three lists. Each item scores `sum(1 / (60 + rank))` across the lists it appears in, with ranks starting at 1. Ties break by name. The fused list is paged with `limit` and `offset`, and `total` is the size of the fused list (at most 150).

If the search text is empty, the response is the filtered items in name order.

## API

`GET /api/search` is public.

| Parameter | Rule |
|---|---|
| `q` | Required, 1 to 200 characters after trimming |
| `lab` | Lab slug, overrides any parsed lab |
| `category` | Category ID |
| `status` | `ItemStatus`, overrides any parsed status |
| `limit`, `offset` | Standard pagination |

The response is `SearchResponse`:

```
{
  "items": ItemSummary[],
  "total": int,
  "interpretation": {
    "query": str,
    "status": ItemStatus | null,
    "lab": LabSummary | null,
    "category": CategoryRead | null
  }
}
```

`interpretation.query` is the search text left after parsing. `lab` and `status` show the filters in effect, whether parsed or explicit. `category` is set only by the explicit parameter, and is `null` when the ID does not exist.

There are no new error codes. Validation failures return `422`.

## Module boundaries

Search reads items through two functions the items feature exposes. Search never imports item internals beyond the models it filters on.

- `items.service.filter_conditions(filters) -> list[ColumnElement[bool]]` returns the WHERE clauses that `list_items` also uses.
- `items.service.get_items_by_ids(db, ids) -> list[Item]` loads items eagerly, in the given order.

Labs vocabulary comes from `labs.service.all_labs(db)`.

## Relevance suite

A seeded inventory of 25 items across two labs, `erb-208` and `erb-202`, drawn from the project's real equipment. Every search slice must keep these cases passing.

| Query | Expectation |
|---|---|
| `oscilloscope` | Top result is an oscilloscope |
| `osciloscope` | Top result is an oscilloscope |
| `solder` | Soldering station first |
| `measure voltage` | Multimeter first |
| `DMM` | Multimeter first |
| `power suply` | A power supply first |
| `cordless drill` | Cordless drill first |
| `cut wood` | Circular saw first |
| `see a signal over time` | An oscilloscope first |
| `protect my eyes` | Safety glasses first |
| `virtual reality` | VR headset first |
| `available power supply` | The available power supply first, with status `available` interpreted |
| `oscilloscope in 202` | The ERB 202 oscilloscope first, with lab `erb-202` interpreted |
| `broken` | Only broken items, with an empty interpreted query |
| `xyzzy` | No results |

# 005 Search Type-Ahead Design

Slice 5 of the backend roadmap. This slice builds on `003-search-core-design.md` and follows `001-backend-architecture-design.md` for conventions. Every change to `GET /api/search` here is additive, and the 003 relevance suite must keep passing.

ID 004 is reserved for deployment and backups, which is waiting on the sponsor questions in `docs/open-questions.md`.

## Scope

- `GET /api/search/suggest` for type-ahead
- A `didYouMean` field on search responses
- Match highlights on search results
- Facet counts on search responses

## Suggestions

`GET /api/search/suggest` is public.

| Parameter | Rule |
|---|---|
| `q` | Required, 1 to 100 characters after trimming |
| `limit` | 1 to 10, default 8 |

The response is `{ "suggestions": Suggestion[] }`. A suggestion is one of three types, distinguished by its `type` field.

| Type | Fields | Cap |
|---|---|---|
| `item` | `id`, `name`, `labName`, `coverThumbnailUrl` (nullable) | 5 |
| `category` | `id`, `name`, `itemCount` | 2 |
| `lab` | `slug`, `name` | 2 |

### Matching

Matching is case-insensitive and lexical only, with no embedding. The target is under 30 ms.

Each candidate scores against the lowercased query `q`:

| Score | Condition |
|---|---|
| 3 | The name starts with `q` |
| 2 | Any word of the name starts with `q`. Words are split on non-alphanumeric characters |
| Trigram similarity | The similarity between `q` and the name is at least 0.3 |

Candidates scoring below the trigram threshold are excluded. Labs also match on slug and room, scored the same way.

Each type is capped first. The remaining suggestions are then ordered by score descending, then name, and cut to `limit`.

Slice 006 adds a `query` type (popular searches) additively.

## Did you mean

`SearchResponse.didYouMean` is a string, or `null`.

### Vocabulary

A materialized view, `search_terms(word)`, holds every distinct lowercase word of at least 3 characters from item names, item keywords, and category names. Words are split on non-alphanumeric characters.

- A unique index covers `word`.
- A GIN trigram index covers `word`.
- `search.indexing.reindex_stale` runs `REFRESH MATERIALIZED VIEW search_terms` after every reindex, so the view stays current through the existing `search_content_changed` event.

### Correction

Each token is considered from `interpretation.query`, the search text after parsing.

- A token is eligible if it is alphabetic and at least 3 characters long.
- An eligible token that is not in `search_terms` is replaced by the most similar word whose trigram similarity is at least 0.45. Ties break by word.

If any token was replaced, `didYouMean` is the original `q` with each replaced token substituted. Substitution is case-insensitive, matches whole words, and lowercases the inserted word. Status and lab phrases stay as typed. Otherwise `didYouMean` is `null`.

`didYouMean` is returned even when results are found.

## Highlights

Search results become `SearchHit`, which extends `ItemSummary` with two fields:

- `nameHighlights: list[{ start, end }]`
- `matchedKeywords: list[str]`

### Query tokens

The query tokens are the lowercase alphanumeric tokens of `interpretation.query`, excluding the stopwords `a`, `an`, `and`, `at`, `for`, `in`, `is`, `it`, `my`, `of`, `on`, `or`, `the`, `to`, and `with`. Single-character tokens are also excluded.

### Matching a word

A word matches a token when either:

- the word starts with the token, which highlights the matched prefix, or
- the word and token have a trigram similarity of at least 0.45 under pg_trgm's algorithm, which highlights the whole word.

Each name word produces at most one range. Ranges are sorted and never overlap.

**Offsets are UTF-16 code units**, so they index JavaScript strings directly.

### Matched keywords

`matchedKeywords` lists the item's keywords in which any word matches any token, in the item's keyword order.

Items found only through semantic similarity have empty highlights.

## Facets

`SearchResponse.facets` has this shape:

```
{
  "categories": [{ "id", "name", "count" }],
  "labs": [{ "slug", "name", "count" }],
  "statuses": [{ "status", "count" }]
}
```

- Counts cover the full fused result set, not one page.
- Each facet is computed with every active filter except its own, so alternative values stay visible.
- When a facet's own filter is inactive, it is counted from the main result IDs. When it is active, one extra fused retrieval runs without that filter, reusing the query embedding.
- For a filter-only query (empty search text), counts come from a SQL `GROUP BY` over the filtered items.
- Values with a count of zero are omitted. Uncategorized items are not counted in the categories facet.
- Each facet is ordered by count descending, then by name or status.

## Contract changes

| Change | Kind |
|---|---|
| `GET /api/search/suggest`, operation ID `suggestSearch` | New endpoint |
| `SearchResponse.items` becomes `list[SearchHit]` | Additive, since `SearchHit` extends `ItemSummary` |
| `SearchResponse.didYouMean` | New field |
| `SearchResponse.facets` | New field |

There are no new error codes. Validation failures return `422`.

## Tests

The tests reuse the 003 seeded inventory.

- **Suggestions:** prefix ranking above word-start ranking above fuzzy ranking, the per-type caps, the `limit`, and a lab matched by room.
- **Did you mean:**
  - `osciloscpe` suggests `oscilloscope`
  - `solderng iron` suggests `soldering iron`
  - `osciloscpe in 202` suggests `oscilloscope in 202`
  - `oscilloscope` returns `null`
  - The vocabulary refreshes after an item rename.
- **Highlights:** prefix ranges, fuzzy whole-word ranges, `matchedKeywords` for `measure voltage`, and UTF-16 offsets for names containing an accented character and an emoji.
- **Facets:** counts with no filter, the status facet staying complete while a status filter is active, filter-only counts, and zero-count values omitted.

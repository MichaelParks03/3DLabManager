# Issues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let anonymous students report issues, give admins a triage queue and summary, and show open issue counts on items.

**Architecture:** A new `issues` feature module. Issues reads items and labs through their services. Callers that build item summaries fetch counts from `issues.service.open_counts` and pass them into `to_summary` and `to_detail`, so no service imports another in a cycle.

**Tech Stack:** Foundation stack.

**Spec:** `docs/superpowers/specs/007-issues-design.md`, under `001-backend-architecture-design.md` and `002-labs-items-design.md`

**Prerequisite:** Plans 002 and 003 merged. Plan 005 merged if it ships first, in which case `SearchHit` also carries the count. This plan uses `get_item`, `get_lab`, `to_summary`, `to_detail`, `CurrentAdmin`, `Page`, `Pagination`, and the fixtures `make_admin`, `make_lab`, `make_item`, `admin_client`, and `client`.

**Branch:** `feat/issues` from `main`. Task 1 is the contract PR.

## Global Constraints

- All of plan 001's Global Constraints apply.
- `POST /api/issues` is the only public issues endpoint. Every other route uses `dependencies=[Depends(require_admin)]`.
- Text fields use `Annotated[str, StringConstraints(strip_whitespace=True, ...)]`. Optional reporter fields turn blank strings into `None` after stripping.
- `to_summary` and `to_detail` take a required keyword `open_issue_count: int`. There is no default, so a caller that forgets it fails type checking instead of silently showing zero.

## Review Focus

1. **A description padded with spaces** (`"   broken   "`) must be rejected as too short after trimming. Pinned in Task 2.
2. **A report on an item that is later deleted** must keep its lab, with `item` null. Pinned in Task 3.
3. **Sending both `itemId` and `labSlug`** must return `invalid_issue_target`, not silently pick one. Pinned in Task 2.
4. **Reopening a resolved issue** must clear `resolvedAt` and `resolvedBy`. Pinned in Task 3.
5. **The public receipt** must not echo the reporter's contact details or description. Pinned in Task 2.

## File Map

```
src/backend/app/features/issues/            models (Issue, IssueType, IssueStatus), schemas, service, router
src/backend/app/features/items/schemas.py   add open_issue_count, keyword-only param on to_summary/to_detail
src/backend/app/features/items/router.py    pass counts
src/backend/app/features/search/service.py  pass counts
src/backend/app/features/labs/service.py    lab_not_empty message
src/backend/migrations/versions/            create issues
src/frontend/nginx.conf                     rate limit POST /api/issues
src/backend/tests/issues/                   test_contract.py, test_report_api.py, test_admin_api.py, test_counts.py
```

---

### Task 1: Contract PR

**Files:**
- Create: `features/issues/{__init__,models,schemas,router}.py`, and the migration
- Modify: `app/models.py`, `app/main.py`, `features/items/schemas.py`, `openapi.json`
- Test: `tests/issues/test_contract.py`

**Interfaces:**
- Produces:
  - `class IssueType(StrEnum)`: `broken`, `depleted`, `safety`, `other`
  - `class IssueStatus(StrEnum)`: `open`, `in_progress`, `resolved`
  - `Issue(TimestampMixin, Base)` on `issues`, with the spec's columns, foreign keys, and the indexes `ix_issues_status_created_at` and `ix_issues_item_id`. Relationships: `item`, `lab`, `resolver`.
  - Schemas:
    - `IssueCreate`, with `item_id: int | None = None` and `lab_slug: str | None = None`
    - `IssueReceipt` (`id`, `created_at`)
    - `ItemRef` (`id`, `name`)
    - `AdminRef` (`id`, `name`)
    - `IssueRead`
    - `IssueUpdate` (`status: IssueStatus | None`, `resolution_note: str | None`)
    - `UnresolvedByType` (`broken`, `depleted`, `safety`, `other`, all `int`)
    - `IssueSummary` (`open`, `in_progress`, `unresolved_by_type`)
    - `IssueFilters` dataclass dependency (`status`, `type`, `lab`, `item`)
  - Two routers, both `prefix="/issues", tags=["issues"]`:
    - `public_router` holds `reportIssue` (`POST ""`)
    - `admin_router` (`dependencies=[Depends(require_admin)]`) holds `listIssues`, `getIssueSummary` (`GET /summary`, declared before `/{issue_id}`), `getIssue`, `updateIssue`, and `deleteIssue`
    
    `create_app` includes both. All bodies are `not_implemented()`.
  - `ItemSummary.open_issue_count: int = 0` and `ItemDetail.open_issue_count: int = 0`. The defaults keep the contract PR green while the converters don't set the field yet. Task 4 removes both defaults.

- [ ] **Step 1: Write the failing test**

```python
# tests/issues/test_contract.py
EXPECTED = {"reportIssue", "listIssues", "getIssueSummary", "getIssue", "updateIssue", "deleteIssue"}


def cookie_params(op):
    return {p["name"] for p in op.get("parameters", []) if p["in"] == "cookie"}


async def test_issues_contract(client):
    spec = (await client.get("/api/openapi.json")).json()
    ops = {op["operationId"] for path in spec["paths"].values() for op in path.values()}
    assert EXPECTED <= ops
    assert "openIssueCount" in spec["components"]["schemas"]["ItemSummary"]["properties"]
    assert "session" not in cookie_params(spec["paths"]["/api/issues"]["post"])
    assert "session" in cookie_params(spec["paths"]["/api/issues"]["get"])
    assert (await client.get("/api/issues")).status_code == 401
```

- [ ] **Step 2: Run the test to verify it fails, then implement and generate the migration**

Run: `uv run pytest tests/issues/test_contract.py -v` and expect FAIL. Then implement and run `uv run alembic revision --autogenerate -m "create issues"`.

- [ ] **Step 3: Verify**

Run: `uv run pytest -v && uv run alembic check`
Expected: all passed, no drift

- [ ] **Step 4: Export the contract, commit, and open the contract PR**

```bash
uv run python -m app.cli export-openapi
git add src/backend
git commit -m "feat(backend): add issues contract"
```

---

### Task 2: Public reporting

**Files:**
- Create: `features/issues/service.py`
- Modify: `features/issues/router.py`
- Test: `tests/issues/test_report_api.py`

**Interfaces:**
- Consumes: `items.service.get_item`, `labs.service.get_lab`.
- Produces:
  - `async report_issue(db, data: IssueCreate) -> Issue`
    - It raises `invalid_issue_target` unless exactly one of `item_id` and `lab_slug` is set.
    - It maps `item_not_found` to `AppError(422, "invalid_item", ...)` and `lab_not_found` to `AppError(422, "invalid_lab", ...)`.
    - It takes `lab_id` from the item when an item is given.
  - `async get_issue(db, issue_id: int) -> Issue`, which raises `issue_not_found`, wired to `getIssue` here because these tests read reports back through it

- [ ] **Step 1: Write the failing tests**

```python
# tests/issues/test_report_api.py
DESC = "Printer nozzle is clogged again"


async def test_report_for_item(client, admin_client, make_lab, make_item):
    item = await make_item(await make_lab())
    r = await client.post("/api/issues", json={"itemId": item.id, "type": "broken", "description": DESC,
                                              "reporterContact": "me@mavs.uta.edu"})
    assert r.status_code == 201
    assert set(r.json()) == {"id", "createdAt"}
    issue = (await admin_client.get(f"/api/issues/{r.json()['id']}")).json()
    assert issue["lab"]["slug"] == "erb-208" and issue["item"]["id"] == item.id
    assert issue["status"] == "open" and issue["reporterContact"] == "me@mavs.uta.edu"


async def test_report_for_lab(client, make_lab):
    await make_lab()
    r = await client.post("/api/issues", json={"labSlug": "erb-208", "type": "depleted", "description": "Out of solder flux"})
    assert r.status_code == 201


async def test_target_must_be_exactly_one(client, make_lab, make_item):
    item = await make_item(await make_lab())
    both = {"itemId": item.id, "labSlug": "erb-208", "type": "other", "description": DESC}
    neither = {"type": "other", "description": DESC}
    for body in (both, neither):
        r = await client.post("/api/issues", json=body)
        assert r.status_code == 422
        assert r.json()["error"]["code"] == "invalid_issue_target"


async def test_unknown_targets(client):
    r = await client.post("/api/issues", json={"itemId": 999999, "type": "other", "description": DESC})
    assert r.json()["error"]["code"] == "invalid_item"
    r = await client.post("/api/issues", json={"labSlug": "nope", "type": "other", "description": DESC})
    assert r.json()["error"]["code"] == "invalid_lab"


async def test_description_is_trimmed_before_length_check(client, make_lab):
    await make_lab()
    r = await client.post("/api/issues", json={"labSlug": "erb-208", "type": "broken", "description": "   broken   "})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "validation_error"


async def test_blank_reporter_fields_become_null(client, admin_client, make_lab):
    await make_lab()
    body = {"labSlug": "erb-208", "type": "safety", "description": "Exposed wire near bench 3", "reporterName": "  "}
    issue_id = (await client.post("/api/issues", json=body)).json()["id"]
    assert (await admin_client.get(f"/api/issues/{issue_id}")).json()["reporterName"] is None
```

- [ ] **Step 2: Run the tests to verify they fail, then implement `report_issue` and `get_issue`**

Run: `uv run pytest tests/issues/test_report_api.py -v`
Expected before implementing: FAIL with `501`

- [ ] **Step 3: Run the tests to verify they pass, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): accept anonymous issue reports"
```

---

### Task 3: Admin triage

**Files:**
- Modify: `features/issues/service.py`, `features/issues/router.py`, `features/labs/service.py`
- Test: `tests/issues/test_admin_api.py`

**Interfaces:**
- Produces:
  - `async list_issues(db, filters: IssueFilters, *, limit, offset) -> tuple[list[Issue], int]`, ordered by `created_at DESC, id DESC`
  - `async update_issue(db, issue_id: int, actor: Admin, changes: IssueUpdate) -> Issue`, applying the spec's transition rules
  - `async delete_issue(db, issue_id: int) -> None`
  - `async issue_summary(db) -> IssueSummary`, built from one `GROUP BY status, type` query
- The labs service's `lab_not_empty` message becomes `"Lab still has items or issues"`.

- [ ] **Step 1: Write the failing tests**

```python
# tests/issues/test_admin_api.py
import pytest


@pytest.fixture
def report(client):
    async def run(lab="erb-208", type="broken", item_id=None):
        body = {"type": type, "description": "Something is wrong here"}
        body.update({"itemId": item_id} if item_id else {"labSlug": lab})
        return (await client.post("/api/issues", json=body)).json()["id"]
    return run


async def test_admin_routes_require_session(client):
    assert (await client.get("/api/issues/summary")).status_code == 401


async def test_list_filters_and_order(admin_client, make_lab, report):
    await make_lab()
    first = await report(type="broken")
    second = await report(type="safety")
    ids = [i["id"] for i in (await admin_client.get("/api/issues")).json()["items"]]
    assert ids == [second, first]
    safety = (await admin_client.get("/api/issues?type=safety")).json()["items"]
    assert [i["id"] for i in safety] == [second]


async def test_resolve_and_reopen(admin_client, make_lab, report):
    await make_lab()
    issue_id = await report()
    me = (await admin_client.get("/api/auth/me")).json()
    r = await admin_client.patch(f"/api/issues/{issue_id}", json={"status": "resolved", "resolutionNote": "Replaced nozzle"})
    assert r.json()["resolvedBy"] == {"id": me["id"], "name": me["name"]}
    assert r.json()["resolvedAt"] is not None
    stamped = r.json()["resolvedAt"]
    r = await admin_client.patch(f"/api/issues/{issue_id}", json={"resolutionNote": "Replaced nozzle and cleaned bed"})
    assert r.json()["resolvedAt"] == stamped
    r = await admin_client.patch(f"/api/issues/{issue_id}", json={"status": "open"})
    assert r.json()["resolvedAt"] is None and r.json()["resolvedBy"] is None
    assert r.json()["resolutionNote"] == "Replaced nozzle and cleaned bed"


async def test_summary(admin_client, make_lab, report):
    await make_lab()
    await report(type="safety")
    await report(type="broken")
    resolved = await report(type="broken")
    in_progress = await report(type="depleted")
    await admin_client.patch(f"/api/issues/{resolved}", json={"status": "resolved"})
    await admin_client.patch(f"/api/issues/{in_progress}", json={"status": "in_progress"})
    assert (await admin_client.get("/api/issues/summary")).json() == {
        "open": 2, "inProgress": 1,
        "unresolvedByType": {"broken": 1, "depleted": 1, "safety": 1, "other": 0},
    }


async def test_delete_spam(admin_client, make_lab, report):
    await make_lab()
    issue_id = await report()
    assert (await admin_client.delete(f"/api/issues/{issue_id}")).status_code == 204
    assert (await admin_client.get(f"/api/issues/{issue_id}")).json()["error"]["code"] == "issue_not_found"


async def test_issue_survives_item_delete(admin_client, make_lab, make_item, report):
    item = await make_item(await make_lab())
    issue_id = await report(item_id=item.id)
    await admin_client.delete(f"/api/items/{item.id}")
    issue = (await admin_client.get(f"/api/issues/{issue_id}")).json()
    assert issue["item"] is None and issue["lab"]["slug"] == "erb-208"


async def test_lab_with_issues_cannot_be_deleted(admin_client, make_lab, report):
    await make_lab()
    await report()
    r = await admin_client.delete("/api/labs/erb-208")
    assert r.status_code == 409
    assert r.json()["error"]["message"] == "Lab still has items or issues"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/issues/test_admin_api.py -v`
Expected: FAIL with `501`

- [ ] **Step 3: Implement the service functions and routes, and update the labs message**

- [ ] **Step 4: Run the tests to verify they pass, then commit**

Run: `uv run pytest -v`
Expected: all passed

```bash
git add src/backend
git commit -m "feat(backend): add issue triage for admins"
```

---

### Task 4: Open issue counts and rate limiting

**Files:**
- Modify: `features/issues/service.py`, `features/items/schemas.py`, `features/items/router.py`, `features/search/service.py`, `src/frontend/nginx.conf`
- Test: `tests/issues/test_counts.py`

**Interfaces:**
- Produces:
  - `async open_counts(db, item_ids: Sequence[int]) -> dict[int, int]`, counting `open` and `in_progress` issues per item in one `GROUP BY` query. It returns only item IDs that have issues, and callers use `.get(item_id, 0)`.
  - `to_summary(item, storage, *, open_issue_count: int)` and `to_detail(item, storage, *, open_issue_count: int)`. Every caller passes counts: the item list, get, create, and update routes, and the search service.
  - The `= 0` defaults on `ItemSummary.open_issue_count` and `ItemDetail.open_issue_count` from Task 1 are removed.
- nginx changes:
  - Add `map $request_method $issue_report_key { POST $binary_remote_addr; default ""; }`.
  - Add `limit_req_zone $issue_report_key zone=issues:10m rate=10r/m;`.
  - Add `location = /api/issues { limit_req zone=issues burst=5 nodelay; limit_req_status 429; proxy_pass http://backend:5000; }` with the shared proxy headers.

- [ ] **Step 1: Write the failing tests**

```python
# tests/issues/test_counts.py
from app.features.search import indexing


async def test_counts_on_items_and_search(client, admin_client, db_session, make_lab, make_item):
    item = await make_item(await make_lab(), name="Prusa MK4 3D Printer")
    await make_item(await make_lab(slug="erb-202", name="ERB 202"), name="Laptop")
    await indexing.reindex_stale(db_session)
    body = {"itemId": item.id, "type": "broken", "description": "Nozzle keeps clogging"}
    first = (await client.post("/api/issues", json=body)).json()["id"]
    await client.post("/api/issues", json=body)
    await admin_client.patch(f"/api/issues/{first}", json={"status": "resolved"})

    listing = {i["name"]: i["openIssueCount"] for i in (await client.get("/api/items")).json()["items"]}
    assert listing == {"Laptop": 0, "Prusa MK4 3D Printer": 1}
    assert (await client.get(f"/api/items/{item.id}")).json()["openIssueCount"] == 1
    hit = (await client.get("/api/search", params={"q": "printer"})).json()["items"][0]
    assert hit["openIssueCount"] == 1
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `uv run pytest tests/issues/test_counts.py -v`
Expected: FAIL, because the counts are `0`

- [ ] **Step 3: Implement `open_counts`, make the converter parameter required, and update every caller**

Run `uv run pyright` after the signature change. It lists every call site that still needs the count.

- [ ] **Step 4: Add the nginx rate limit and verify**

Run from `src/`: `docker compose up --build -d`, then send 20 rapid `POST /api/issues` requests with `curl`.
Expected: at least one `429`. Fifty rapid admin `GET /api/issues` requests return no `429`.

- [ ] **Step 5: Run the full suite, then commit**

Run: `uv run pytest -v && uv run pyright`
Expected: all passed, no type errors

```bash
git add src/backend src/frontend/nginx.conf
git commit -m "feat: show open issue counts on items and rate limit reports"
```

# 007 Issues Design

Slice 7 of the backend roadmap. It follows `001-backend-architecture-design.md` for conventions and builds on `002-labs-items-design.md`.

Anonymous students report broken equipment, depleted materials, and safety concerns. Admins triage and resolve the reports.

## Scope

- **In scope:** anonymous reporting, an admin queue, triage, a summary for an admin badge, and open issue counts on items.
- **Out of scope:**
  - **Photo attachments.** The decision is text only.
  - **Notifications.** These wait on open question 4 in `docs/open-questions.md`. When it is answered, the issues service will emit an `issue_reported` event through `core/events.py`, and the chosen notifier will subscribe to it without any change to this API.

## Data model

Table `issues`:

| Column | Rule |
|---|---|
| `item_id` | Nullable. FK `items.id` `ON DELETE SET NULL` |
| `lab_id` | Required. FK `labs.id` `ON DELETE RESTRICT` |
| `type` | `broken`, `depleted`, `safety`, `other` |
| `description` | Trimmed, 10 to 2000 characters |
| `status` | `open`, `in_progress`, `resolved`. Default `open` |
| `reporter_name` | Optional, trimmed, max 100. Blank becomes null |
| `reporter_contact` | Optional, trimmed, max 200. Blank becomes null |
| `resolution_note` | Optional, max 2000 |
| `resolved_at` | Nullable `timestamptz` |
| `resolved_by` | Nullable. FK `admins.id` `ON DELETE SET NULL` |

Indexes:

- `(status, created_at)` for the admin queue
- `item_id` for open counts

### Related changes

- **Deleting an item** keeps its issues, with `item_id` null.
- **Deleting a lab** that still has issues fails through the existing `409 lab_not_empty` mapping in the labs service. That error's message changes to "Lab still has items or issues".

## Endpoints

| Method and path | Access | Behavior |
|---|---|---|
| `POST /api/issues` | Public | Report an issue. Returns `201 IssueReceipt` |
| `GET /api/issues` | Admin | `Page[IssueRead]`, filtered by `status`, `type`, `lab` (slug), and `item` (ID). Ordered newest first |
| `GET /api/issues/summary` | Admin | `IssueSummary` |
| `GET /api/issues/{id}` | Admin | `IssueRead` |
| `PATCH /api/issues/{id}` | Admin | Partial update of `status` and `resolutionNote`. Returns `IssueRead` |
| `DELETE /api/issues/{id}` | Admin | Hard delete for spam. Returns `204` |

### Reporting

The request body contains **exactly one** of `itemId` and `labSlug`, plus `type`, `description`, and optional `reporterName` and `reporterContact`.

- When `itemId` is given, the lab comes from the item.
- The receipt is `{ id, createdAt }`. It never echoes the submission back to a public client.

### Status transitions

- Moving from any status to `resolved` sets `resolved_at` to now and `resolved_by` to the acting admin.
- Moving from `resolved` to `open` or `in_progress` clears `resolved_at` and `resolved_by`. `resolution_note` is kept as history.
- Patching only `resolutionNote` on an issue that is already resolved keeps the original stamps.

### Shapes

- **`IssueRead`:**
  - `id`, `type`, `description`, `status`
  - `reporterName`, `reporterContact`, `resolutionNote`
  - `createdAt`, `updatedAt`, `resolvedAt`
  - `item` (`{ id, name }` or null)
  - `lab` (`LabSummary`)
  - `resolvedBy` (`{ id, name }` or null)
- **`IssueSummary`:** `{ open, inProgress, unresolvedByType: { broken, depleted, safety, other } }`. `unresolvedByType` counts both `open` and `in_progress` issues.

### Open counts on items

`ItemSummary`, `ItemDetail`, and `SearchHit` gain `openIssueCount`, the number of `open` and `in_progress` issues on the item. This is the additive change promised in 002.

Counts come from `issues.service.open_counts(db, item_ids)`. Every caller that builds item summaries passes them in explicitly. Those callers are the item routes and the search service. The services never import each other in a cycle.

### Error codes

| Code | Status | When |
|---|---|---|
| `issue_not_found` | 404 | The issue does not exist |
| `invalid_issue_target` | 422 | Both or neither of `itemId` and `labSlug` were given |
| `invalid_item` | 422 | `itemId` does not exist |
| `invalid_lab` | 422 | `labSlug` does not exist |

## Abuse protection

- nginx rate-limits `POST /api/issues` to 10 requests per minute per IP, with a burst of 5. It uses a key that is empty for other methods, so admin reads of `/api/issues` are never limited. The kiosk shares one IP, and this rate leaves it ample room.
- Admins delete anything that gets through.

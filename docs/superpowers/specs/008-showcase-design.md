# 008 Showcase Design

Slice 8 of the backend roadmap. It follows `001-backend-architecture-design.md` for conventions and reuses the photo pipeline from `002-labs-items-design.md`.

The showcase highlights student projects built in the lab and credits the students who made them. Projects are published only with the students' permission, as the charter requires.

## Scope

- **In scope:**
  - Projects with a Markdown body, semester, and credits
  - External links
  - A photo gallery
  - A featured flag
  - Permission-gated publishing
  - Admin draft preview
- **Out of scope:**
  - **Videos.** These wait on open question 5 in `docs/open-questions.md`. If videos are approved, they arrive later as an additive `videos` list.
  - **Linking projects to inventory items.**
  - **Showcase search.** Search covers items only.

## Data model

### `projects`

| Column | Rule |
|---|---|
| `slug` | Unique. Matches `^[a-z0-9]+(-[a-z0-9]+)*$`. Max 80 characters |
| `title` | Max 150 characters |
| `summary` | Max 300 characters |
| `body` | Markdown. Max 10000 characters. Default empty |
| `lab_id` | Nullable. FK `labs.id` `ON DELETE SET NULL` |
| `term` | One of `spring`, `summer`, `fall` |
| `year` | 2000 to 2100 |
| `credits` | `text[]`. At most 20 names, each 1 to 100 characters after trimming |
| `links` | JSONB array of `{ label, url }`. At most 10 entries. `label` is 1 to 50 characters. `url` must be `http` or `https`, max 500 characters |
| `is_published` | Default false |
| `published_at` | Nullable. Set the first time the project is published, then never changed |
| `is_featured` | Default false |
| `permission_confirmed` | Default false |

A database constraint enforces `NOT is_published OR permission_confirmed`, so a published project always has confirmed permission.

### `project_photos`

The gallery table shares its columns with `item_photos` through a common mixin.

| Column | Rule |
|---|---|
| `project_id` | FK `projects.id` `ON DELETE CASCADE` |
| `position` | Gallery order |
| `key` | Unique. Stored as `projects/<uuid>` |

A project has at most 20 photos.

## Shared gallery

The photo logic in 002 (`features/items/photos.py`) moves into `app/core/gallery.py`:

- `PhotoMixin` holds the shared photo columns.
- `Gallery` is configured with a photo model, its owner column, a photo limit, and a key prefix. It provides `add`, `delete`, and `reorder`.

Items switch to `Gallery` with no change in behavior. Their existing photo tests are the regression check. Projects reuse `Gallery` as is.

The upload rules, error codes, and the "delete files after commit" lifecycle stay exactly as specified in 002.

## Visibility

- **Public callers** see published projects only. A draft returns `404 project_not_found` to anyone who is not an admin.
- **Admins** preview drafts through the same endpoints. An `optional_admin` dependency in the auth feature returns the current admin, or `None`. It never raises.

## Endpoints

| Method and path | Access | Behavior |
|---|---|---|
| `GET /api/projects` | Public | Returns `Page[ProjectSummary]`. See filters and ordering below |
| `GET /api/projects/{slug}` | Public | Returns `ProjectDetail`. A draft is visible to admins only |
| `POST /api/projects` | Admin | Creates a project, always as a draft. Returns `201 ProjectDetail` |
| `PATCH /api/projects/{slug}` | Admin | Partial update, including `slug`, `isPublished`, `isFeatured`, and `permissionConfirmed` |
| `DELETE /api/projects/{slug}` | Admin | Returns `204`. Photo files are deleted after the commit |
| `POST /api/projects/{slug}/photos` | Admin | Same as items |
| `DELETE /api/projects/{slug}/photos/{photoId}` | Admin | Same as items |
| `PUT /api/projects/{slug}/photos/order` | Admin | Same as items |

### Listing projects

Filters:

- `lab` (slug)
- `featured` (bool)
- `year`
- `term`
- `status`: `published` (the default), `draft`, or `all`. Any value other than `published` requires an admin, and returns `401 not_authenticated` otherwise.

Projects are ordered by:

1. `is_featured`, featured first
2. `year`, newest first
3. Term, with `fall` before `summer` before `spring`
4. `title`, A to Z

### Publishing rules

- Publishing (`isPublished: true`) requires `permissionConfirmed` to be true, either already or in the same request. Otherwise the request fails with `422 permission_required`.
- Setting `permissionConfirmed: false` on a published project in the same way fails with `422 permission_required`, unless the same request also unpublishes it.
- Unpublishing keeps `published_at`.

### Shapes

- **`ProjectSummary`:** `slug`, `title`, `summary`, `lab` (`LabSummary` or null), `term`, `year`, `credits`, `isFeatured`, `isPublished`, `coverThumbnailUrl`
- **`ProjectDetail`:** everything in `ProjectSummary` except `coverThumbnailUrl`, plus `body`, `links`, `photos` (`list[PhotoRead]`), `permissionConfirmed`, and `publishedAt`

Public callers only ever receive published projects, so `isPublished` and `permissionConfirmed` are always true for them.

### Markdown

`body` is stored as written. The frontend must render it with a renderer that escapes raw HTML. The backend does not sanitize Markdown.

### Error codes

| Code | Status | When |
|---|---|---|
| `project_not_found` | 404 | The project does not exist, or is a draft and the caller is not an admin |
| `slug_taken` | 409 | Another project already uses the slug |
| `permission_required` | 422 | A publishing rule above is violated |
| `invalid_lab` | 422 | `labId` does not exist |

The photo error codes from 002 also apply: `photo_not_found`, `photo_limit_reached`, `invalid_photo_order`, `invalid_image`, and `file_too_large`.

## Infrastructure

The nginx upload location that allows 11 MB request bodies widens to `^/api/(items/\d+|projects/[a-z0-9-]+)/photos$`.

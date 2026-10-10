# 002 Labs and Items Design

Slice 2 of the backend roadmap in `001-backend-architecture-design.md`, which this spec follows for all conventions. It delivers the inventory: labs, categories, items, and item photo galleries. It also introduces the storage interface and image pipeline that later slices reuse.

## Data model

| Table | Fields | Rules |
|---|---|---|
| `labs` | `slug` (unique, `^[a-z0-9]+(-[a-z0-9]+)*$`, max 50), `name` (100), `building` (100), `room` (20), `description` (2000, default empty) | An item's `lab_id` is `ON DELETE RESTRICT`. Deleting a lab that has items returns `409 lab_not_empty` |
| `categories` | `name` (50, unique on `lower(name)`) | An item's `category_id` is `ON DELETE SET NULL`. Deleting a category leaves its items uncategorized |
| `items` | `lab_id` (required), `category_id` (nullable), `name` (200), `description` (5000, default empty), `status` (`available`, `in_use`, `broken`, `missing`, default `available`), `quantity` (0 to 100000, default 1), `location` (200), `keywords` (`text[]`, default empty) | Keywords are trimmed, lowercased, and de-duplicated in first-seen order on every write. At most 30, each 1 to 50 characters |
| `item_photos` | `item_id` (`ON DELETE CASCADE`), `position` (int), `key` (unique) | At most 10 per item. Ordered by `position`, then `id`. The first photo is the cover |

## Endpoints

Reads are public. Writes require an admin.

| Method and path | Purpose | Success |
|---|---|---|
| `GET /api/labs` | List labs by name | `Page[LabRead]` |
| `GET /api/labs/{slug}` | One lab | `LabRead` |
| `POST /api/labs` | Create a lab | `201 LabRead` |
| `PATCH /api/labs/{slug}` | Partial update, slug included | `LabRead` |
| `DELETE /api/labs/{slug}` | Delete an empty lab | `204` |
| `GET /api/categories` | List categories by name | `Page[CategoryRead]` |
| `POST /api/categories` | Create a category | `201 CategoryRead` |
| `PATCH /api/categories/{id}` | Rename a category | `CategoryRead` |
| `DELETE /api/categories/{id}` | Delete, uncategorizing its items | `204` |
| `GET /api/items` | List items by name, filtered by `lab` (slug), `category` (id), `status`, and `q` (case-insensitive name substring) | `Page[ItemSummary]` |
| `GET /api/items/{id}` | One item | `ItemDetail` |
| `POST /api/items` | Create an item | `201 ItemDetail` |
| `PATCH /api/items/{id}` | Partial update. Omitting `categoryId` leaves it, and `null` clears it | `ItemDetail` |
| `DELETE /api/items/{id}` | Delete an item and its photo files | `204` |
| `POST /api/items/{id}/photos` | Upload one photo (multipart field `file`), appended last | `201 PhotoRead` |
| `DELETE /api/items/{id}/photos/{photoId}` | Delete one photo | `204` |
| `PUT /api/items/{id}/photos/order` | Body `{ photoIds }` listing exactly the item's photos in the new order | `list[PhotoRead]` |

An unknown `lab` slug in the item filter returns an empty page, not an error.

### Shapes

- `LabRead`: `id`, `slug`, `name`, `building`, `room`, `description`
- `LabSummary`: `slug`, `name`
- `CategoryRead`: `id`, `name`
- `PhotoRead`: `id`, `url`, `thumbnailUrl`
- `ItemSummary`: `id`, `name`, `status`, `quantity`, `location`, `lab` (`LabSummary`), `category` (`CategoryRead` or null), `coverThumbnailUrl` (or null)
- `ItemDetail`: everything in `ItemSummary` except `coverThumbnailUrl`, plus `description`, `keywords`, and `photos` (`list[PhotoRead]`)
- Item writes reference `labId` and `categoryId`.

The issues slice later adds `openIssueCount` to both item shapes as an additive change.

### Error codes

| Code | Status | When |
|---|---|---|
| `lab_not_found`, `category_not_found`, `item_not_found`, `photo_not_found` | 404 | A path refers to a missing resource |
| `slug_taken`, `category_name_taken` | 409 | A unique value is already used |
| `lab_not_empty` | 409 | Deleting a lab with items |
| `photo_limit_reached` | 409 | Uploading an eleventh photo |
| `invalid_lab`, `invalid_category` | 422 | A write references a missing lab or category |
| `invalid_photo_order` | 422 | `photoIds` is not exactly the item's photos |
| `invalid_image` | 422 | The upload is not a decodable JPEG, PNG, or WebP, or exceeds 50 megapixels |
| `file_too_large` | 413 | The upload exceeds 10 MB |

## Storage and image pipeline

### Image processing

`app/core/images.py` processes each upload with Pillow:

1. Decode the upload, rejecting anything over 50 megapixels.
2. Apply the EXIF orientation.
3. Convert to RGB.
4. Write a WebP display image, at most 1600 px on the long edge.
5. Write a WebP thumbnail, at most 400 px on the long edge.

Re-encoding drops all metadata, including GPS. Processing runs in a worker thread so it never blocks the event loop. HEIC is not supported, and HEIC files get `invalid_image` with a message naming the supported formats.

### Storage

- `app/core/storage.py` defines a `Storage` protocol with `save`, `delete`, and `url_for`, plus `LocalStorage`, which writes under `ASSET_DIR`.
- Writes go to a temporary file and are then renamed into place.
- Photo files are stored as `items/<uuid>.webp` and `items/<uuid>_thumb.webp`, and `item_photos.key` stores `items/<uuid>`.
- Routes receive storage through a `get_storage` dependency, so tests substitute a temporary directory.

### File lifecycle

Files are deleted only after the database commit that removes their rows. A failed file deletion leaves a harmless orphan, never a row pointing at a missing file. Uploads write files before inserting the row, and remove those files if the insert fails.

### Serving

- A named `assets` volume is mounted read-write in the backend at `/app/assets` and read-only in nginx.
- nginx serves `/assets/` from the volume with `Cache-Control: public, max-age=31536000, immutable`, which is safe because keys are never reused.
- The photo upload route allows request bodies up to 11 MB in nginx. The rest of `/api/` keeps the 1 MB cap.

## Delivery

The first PR is the contract PR: models, migration, schemas, `501` route stubs, and `openapi.json`. Once it merges, the search, issues, and showcase slices can build on these tables in parallel.

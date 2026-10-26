# Dedicated Local Asset Storage Documentation

> **Storage Root:** Configured via `ASSET_STORAGE_ROOT` in `backend/.env` (e.g. `C:/hotel-storage/assets`)  
> **Architecture Principle:** Binary files live outside the application source directory on the host filesystem; MongoDB stores only structured metadata and references.

---

## 1. Directory Hierarchy

The storage root automatically provisions and maintains the following directory tree:

```text
hotel-storage/
└── assets/
    ├── images/
    │   ├── products/      ← Product gallery images
    │   ├── users/         ← Administrator avatar photos
    │   ├── customers/     ← Guest profile pictures
    │   ├── staff/         ← Employee badges and profile photos
    │   ├── categories/    ← Food, beverage, and room category covers
    │   └── general/       ← Marketing and miscellaneous banners
    ├── videos/
    │   ├── products/      ← Promotional product video clips
    │   ├── users/         ← Verification videos
    │   └── general/       ← General hotel promotional footage
    └── files/
        ├── documents/     ← Contracts, terms, and ID scans
        ├── invoices/      ← Generated billing statements
        ├── reports/       ← Exported accounting/occupancy reports
        └── general/       ← Uncategorized documentation
```

---

## 2. Security & Defense In Depth

1. **Path Traversal Guard**:
   All storage access resolves through `LocalStorageService.resolveSafePath()`. If a requested path steps outside the designated root using `..` or leading slashes, an operational `400 Bad Request` is thrown immediately.
2. **In-Memory Buffering & Validation**:
   Uploads are received into memory (`multer.memoryStorage()`) so that validation (file size, MIME allowlists, magic bytes) runs before writing to disk.
3. **Sharp Image Inspection**:
   Image files are inspected via Sharp to extract dimensions (`imageWidth`, `imageHeight`), strip potentially malicious metadata, and reject corrupted or oversized dimensions (> 6000x6000px).
4. **Collision-Proof Storage Names**:
   Saved files use collision-proof randomized keys formatted as `${nanoid(16)}_${Date.now()}.${ext}`.
5. **Private vs. Public Visibility**:
   - `public`: Accessible for display across hotel interfaces.
   - `private`: Access restricted; `getAssetStream()` verifies token authorization and role privileges before serving.

---

## 3. Disconnected / Offline Storage Handling

When the physical storage disk is unmounted or unavailable:
- `LocalStorageService.isAvailable()` detects missing read/write permissions.
- File upload endpoints immediately return `503 Service Unavailable` with code `STORAGE_UNAVAILABLE`.
- Normal API operations (products, bookings, users) continue operating without crashing.

---

## 4. API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/assets/upload` | Upload single file (multipart `file`) | ✅ Yes |
| `POST` | `/api/v1/assets/upload/multiple` | Upload up to 10 files (multipart `files`) | ✅ Yes |
| `GET` | `/api/v1/assets` | Paginated listing with filtering | ✅ Yes |
| `GET` | `/api/v1/assets/:id` | Asset metadata | ✅ Yes |
| `DELETE` | `/api/v1/assets/:id` | Soft delete asset | ✅ Yes |
| `PATCH` | `/api/v1/assets/:id/restore` | Restore soft-deleted asset | ✅ Yes |
| `GET` | `/api/v1/assets/:id/view` | Inline browser stream | Public / Role |
| `GET` | `/api/v1/assets/file/*` | Direct static stream via storage key | Public / Role |
| `GET` | `/api/v1/assets/:id/download` | Attachment download | Public / Role |

---

## 5. Reusable Frontend Components

- **`ImageUploader`**: Reusable component with drag-and-drop, preview grid, file size verification, and progress feedback.
- **`FileUploader`**: Document uploader with format icons, human-readable file sizes, and download previews.
- **`useAssetUpload`**: Custom hook encapsulating upload progress state and notifications.

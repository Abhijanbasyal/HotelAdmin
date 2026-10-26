# API Conventions & Architecture Standards

> Version: `v1`  
> Base URL: `/api/v1`

---

## 1. REST Endpoint Design

All resources adhere to standard RESTful conventions:

| Action | HTTP Method | Endpoint Pattern | Status Code | Description |
|---|---|---|---|---|
| **List** | `GET` | `/api/v1/{resource}` | `200 OK` | Paginated listing with filtering and sorting |
| **Create** | `POST` | `/api/v1/{resource}` | `201 Created` | Create new entity with Zod validation |
| **Read Details** | `GET` | `/api/v1/{resource}/:id` | `200 OK` | Fetch single entity by 24-hex ObjectId |
| **Update** | `PATCH` | `/api/v1/{resource}/:id` | `200 OK` | Partial update with Zod validation |
| **Soft Delete** | `DELETE` | `/api/v1/{resource}/:id` | `200 OK` | Mark `isDeleted: true`, preserve relations |
| **Restore** | `PATCH` | `/api/v1/{resource}/:id/restore` | `200 OK` | Restore soft-deleted record with conflict check |

---

## 2. Standard JSON Response Envelope

Every API response follows a consistent contract constructed via `ApiResponse`.

### A. Success (Single Resource)

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "id": "6adeea7151fda0faa9ef0a1e",
    "name": "Deluxe King Suite",
    "createdAt": "2026-10-26T05:40:00.000Z"
  }
}
```

### B. Paginated Listing

```json
{
  "success": true,
  "message": "Resources retrieved successfully",
  "data": [
    {
      "id": "6adeea7151fda0faa9ef0a1e",
      "name": "Deluxe King Suite"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### C. Standard Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": {
    "email": ["Please enter a valid email address"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

---

## 3. Query Parameters: Pagination, Filtering & Sorting

All listing endpoints accept standardized query parameters processed by `parsePaginationOptions` and validated via `paginationQuerySchema`:

| Query Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | Integer | `1` | Page number (1-indexed, minimum 1) |
| `limit` | Integer | `10` | Page size (1 to 100 max) |
| `sortBy` | String | `createdAt` | Field name (checked against module allowlist) |
| `sortOrder` | String | `desc` | `asc` or `desc` |
| `search` | String | `undefined` | Keyword for regex search (auto-escaped) |
| `includeDeleted` | Boolean | `false` | When `true`, includes soft-deleted records |

---

## 4. Soft Delete & Restoration Policy

1. **Convention**: Every manageable document implements `ISoftDeletable`:
   ```ts
   isDeleted: boolean;     // false = active, true = soft-deleted
   deletedAt: Date | null; // deletion timestamp
   deletedBy: ObjectId;    // administrator who initiated deletion
   ```
2. **Default Filter**: Listing endpoints exclude soft-deleted records (`isDeleted: false`) automatically via `paginateQuery`.
3. **Audit Trail**: Deletion and restoration events are recorded in `AuditLog` asynchronously.
4. **Unique Conflict Resolution on Restore**:
   - When soft-deleted, a record may have unique identifiers (e.g., SKU, email, room number, category name).
   - While it is deleted, a new active record might have been created with that same identifier.
   - The `restoreDocument` utility validates unique fields before setting `isDeleted: false`. If an active conflict exists, it aborts with HTTP `409 Conflict` and a descriptive message.

---

## 5. Audit Logging Architecture

Audit events are immutable records stored in the `auditlogs` collection.

### Schema Fields
- `userId`: ObjectId of the acting user
- `userEmail`: denormalized email for quick querying
- `userName`: user display name
- `action`: uppercase string (e.g. `CREATE`, `UPDATE`, `DELETE`, `RESTORE`, `LOGIN`, `LOGOUT`)
- `entityType`: collection/model name (e.g. `User`, `Role`, `Product`, `Category`, `Table`, `Booking`)
- `entityId`: string ID of target entity
- `details`: metadata, delta changes, or contextual attributes
- `ipAddress`: client IP
- `userAgent`: client browser/agent string
- `createdAt`: immutable timestamp (indexed with `-1`)

### Endpoint
- `GET /api/v1/audit-logs`: Requires `audit.read` or Super Admin permission. Supports filtering by `entityType`, `entityId`, `userId`, `action`, `startDate`, and `endDate`.
- `GET /api/v1/audit-logs/:id`: Retrieve single log entry.

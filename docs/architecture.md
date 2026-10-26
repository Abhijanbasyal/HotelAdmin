# System Architecture & Technical Specifications

## 1. High-Level Topology

```
+-------------------------------------------------------+
|                 Browser / Client App                  |
|          Next.js 14 App Router (Port 3000)            |
+-------------------------------------------------------+
                           |
                     HTTP / JSON
                  Cookie / JWT Auth
                           v
+-------------------------------------------------------+
|               Express.js REST API                     |
|           Modular Monolith (Port 4000)                |
|                                                       |
|  [Security: Helmet, CORS, RateLimit, CSRF Token]      |
|  [Middleware: Authenticate, Authorize, Validate]      |
|  [Core Infrastructure: Pagination, SoftDelete, Audit] |
|  [Services & Business Logic Layer]                    |
+-------------------------------------------------------+
              |                              |
              | Mongoose                     | Node.js fs
              v                              v
+-----------------------------+  +-------------------------------+
|       MongoDB Database      |  |    Dedicated Local Storage    |
| - Users & Roles             |  | - Images (products, staff)    |
| - Audit Logs & Tokens       |  | - Documents & Invoices        |
| - Metadata & Relationships  |  | - Backups & Static Assets     |
+-----------------------------+  +-------------------------------+
```

---

## 2. Infrastructure Layer (Phase 3 Implemented)

### Database Lifecycle & Transactions
- **Pool Management**: Min pool 2, max pool 10 with timeout guards.
- **Resilient Transactions**: `withTransaction<T>` wrapper executes multi-document ACID transactions when replica sets are configured, with automatic graceful fallback in single-node/standalone development environments.
- **Health Checks**: Real-time ping latency and readyState diagnostics served at `/health` and `/api/v1/health`.

### Centralized Error Handling & Response Envelope
- **`ApiResponse`**: Standardized response factory ensuring unified contract:
  - `success`: boolean
  - `message`: human-readable status
  - `data`: generic payload
  - `meta.pagination`: `page`, `limit`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage`
- **`errorHandler`**: Catches `AppError`, `ZodError`, `MongooseDuplicateKeyError`, `MongooseCastError`, `ValidationError`, `SyntaxError`, and JWT failures.

### Pagination & Search Sanitization
- Allowlisted sorting fields to prevent NoSQL query tampering.
- Regex escaping utility `escapeRegex` protects against ReDoS attacks and regex compilation crashes.
- Concurrent execution of `countDocuments` and cursor pagination using `Promise.all`.

### Soft Deletion & Conflict Handling
- Global convention: records are never physically removed during standard operations.
- `softDeleteDocument` updates `isDeleted: true`, `deletedAt: new Date()`, and `deletedBy`.
- `restoreDocument` verifies unique constraints before restoring to prevent collisions with active documents created during deletion intervals.

### Immutable Audit Trail
- Structured events logged asynchronously without blocking user request latency.
- Indexed by entity, user, action, and timestamp.
- Accessible via `/api/v1/audit-logs` for administrators with `audit.read` permission.

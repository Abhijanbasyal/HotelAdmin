# Hotel Management Admin System

> A professional, secure, and scalable hotel management admin system built with **Next.js 14**, **Express**, **TypeScript**, **Tailwind CSS**, and **MongoDB**.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Available Modules](#available-modules)
- [Project Structure](#project-structure)
- [Development Phases](#development-phases)
- [Asset Storage](#asset-storage)
- [Testing](#testing)
- [Production Build](#production-build)
- [Troubleshooting](#troubleshooting)

---

## Overview

A full-featured hotel management system for managing:

- Products and categories
- Tables, bookings, and customers
- Staff, roles, and departments
- Real-time dashboard with KPIs
- Configurable light/dark themes with color swatches
- Secure JWT authentication with refresh tokens
- Dedicated local asset storage for images and files

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, CSS custom properties |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Toasts | Sonner |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB with Mongoose |
| Auth | JWT (jose), Argon2id |
| Logging | Pino |
| Testing | Vitest, Supertest, React Testing Library |

---

## Architecture

```
hotel-management/
├── frontend/    ← Next.js App Router (port 3000)
├── backend/     ← Express REST API (port 4000)
└── scripts/     ← Shared utility scripts
```

**Data flow:**
1. Browser → Next.js frontend (port 3000)
2. Frontend → Express API at `/api/v1` (port 4000)
3. API → MongoDB for structured data
4. API → Local filesystem for uploaded assets

---

## Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 10.0.0
- **MongoDB** ≥ 6.0 (local or Atlas)
- A dedicated storage path for uploaded assets (e.g. `C:\hotel-storage\assets`)

---

## Quick Start

### 1. Clone and install

```bash
git clone <repository-url>
cd hotel-management
npm install
```

### 2. Set up environment variables

```bash
# Backend
copy backend\.env.example backend\.env
# Edit backend\.env — set MONGODB_URI, JWT secrets, ASSET_STORAGE_ROOT

# Frontend
copy frontend\.env.example frontend\.env.local
# Edit frontend\.env.local if your API is not on localhost:4000
```

### 3. Create the asset storage directory

```bash
mkdir C:\hotel-storage\assets\images\products
mkdir C:\hotel-storage\assets\images\users
mkdir C:\hotel-storage\assets\images\customers
mkdir C:\hotel-storage\assets\images\staff
mkdir C:\hotel-storage\assets\images\categories
mkdir C:\hotel-storage\assets\images\general
mkdir C:\hotel-storage\assets\videos\general
mkdir C:\hotel-storage\assets\files\documents
```

> Or set `ASSET_STORAGE_ROOT` in `backend\.env` to any path you prefer.

### 4. Start development servers

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually:
npm run dev:backend    # Express API on port 4000
npm run dev:frontend   # Next.js on port 3000
```

### 5. Open the app

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000/api/v1
- **Health check**: http://localhost:4000/health

---

## Environment Setup

### Backend `.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | Secret for signing access tokens (≥ 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Secret for signing refresh tokens (≥ 32 chars) |
| `COOKIE_SECRET` | ✅ | Secret for signing cookies |
| `ASSET_STORAGE_ROOT` | ✅ | Absolute path to asset storage directory |
| `PORT` | ❌ | API port (default: 4000) |
| `CORS_ORIGIN` | ❌ | Allowed origins (default: http://localhost:3000) |

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Frontend `.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL (default: http://localhost:4000/api/v1) |

---

## Development

```bash
# Both servers
npm run dev

# TypeScript checks
npm run typecheck --workspace=frontend
npm run typecheck --workspace=backend

# Lint
npm run lint

# Format
npm run format

# Test
npm run test:backend
npm run test:frontend
```

---

## Available Modules

| Module | Status |
|--------|--------|
| Dashboard | 🚧 Phase 1 scaffold — Phase 9 completes |
| Products | ✅ Phase 5 |
| Categories | ✅ Phase 5 |
| Customers | ✅ Phase 6 |
| Staff | ✅ Phase 6 |
| Departments | ✅ Phase 6 |
| Tables | ✅ Phase 7 |
| Bookings | ✅ Phase 7 |
| Roles & Permissions | 🔜 Phase 8 (Next) |
| Settings | 🔜 Phase 8 (Next) |
| Authentication | ✅ Phase 2 |
| Asset Management | ✅ Phase 4 |
| Orders | ❌ Not in scope |

---

## Project Structure

See `docs/architecture.md` for the detailed folder responsibility map.

---

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation & UI System | ✅ Completed |
| 2 | Authentication & Authorization | ✅ Completed |
| 3 | Backend Infrastructure | ✅ Completed |
| 4 | Asset Management | ✅ Completed |
| 5 | Categories & Products | ✅ Completed |
| 6 | Customers & Staff | ✅ Completed |
| 7 | Tables & Bookings | ✅ Completed |
| 8 | Roles, Departments & Settings | 🔜 Next |
| 9 | Dashboard | 🔜 |
| 10 | QA & Deployment | 🔜 |

---

## Asset Storage

Uploaded files are stored in a dedicated local directory **outside** the application source.

**Configuration:** Set `ASSET_STORAGE_ROOT` in `backend/.env`

```
hotel-storage/
└── assets/
    ├── images/
    │   ├── products/
    │   ├── users/
    │   ├── customers/
    │   ├── staff/
    │   ├── categories/
    │   └── general/
    ├── videos/
    └── files/
```

**Backup guidance:**
- Back up the entire `ASSET_STORAGE_ROOT` directory regularly
- The MongoDB database contains only metadata — both must be backed up together
- If the storage device is disconnected, the API returns 503 for asset requests but continues to serve all other endpoints

---

## Testing

```bash
# Backend unit + integration tests
npm run test:backend

# Frontend component tests
npm run test:frontend

# With coverage
npm run test:coverage --workspace=backend
```

---

## Production Build

```bash
# Build both
npm run build:frontend
npm run build:backend

# Start production
npm run start --workspace=frontend
npm run start --workspace=backend
```

---

## Troubleshooting

### MongoDB connection fails
- Confirm MongoDB is running: `mongosh --eval "db.runCommand({ connectionStatus: 1 })"`
- Check the `MONGODB_URI` in `backend/.env`
- For Atlas, ensure your IP is whitelisted

### Asset storage errors
- Verify `ASSET_STORAGE_ROOT` path exists and is writable
- Windows: ensure no trailing backslash in the path
- Check permissions on the storage directory

### Port conflicts
- Change `PORT` in `backend/.env`
- Change the frontend port in `package.json`: `"dev": "next dev --port 3001"`

### TypeScript errors
```bash
npm run typecheck --workspace=frontend
npm run typecheck --workspace=backend
```

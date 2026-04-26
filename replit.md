# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## RR Plastic Management System

**Artifact**: `rr-plastic` at `/` (React + Vite)
**API**: `api-server` at `/api` (Express + Drizzle + PostgreSQL)

### Modules
All 10 modules fully implemented with CRUD:
1. **Materials** — `/materials` — track raw material stock with low-stock alerts
2. **Stock In** — `/stock-in` — record material receipts, auto-increments stock
3. **Stock Out** — `/stock-out` — record consumption, prevents negative stock
4. **Employees** — `/employees` — manage staff with daily salary rates
5. **Attendance** — `/attendance` — daily mark P/A/H/L with bulk save
6. **Salary** — `/salary` — auto-calculated from attendance (formula: P×rate + H×0.5×rate)
7. **Customers** — `/customers` — manage customer list with material balance summary
8. **Production** — `/production` — material issued/received per customer
9. **Delivery Challans** — `/delivery-challans` — create printable challans with line items
10. **Reports** — `/reports` — monthly summary of stock, salary, and customer activity

### Auth
- JWT stored in `localStorage` as `auth_token` and `auth_user`
- Default users: `admin/admin123`, `store/store123`
- All API routes protected with `requireAuth` middleware

### Key Files
- `artifacts/rr-plastic/src/App.tsx` — router with all 12 routes
- `artifacts/rr-plastic/src/lib/auth.tsx` — JWT auth context + token getter
- `artifacts/rr-plastic/src/pages/` — all page components
- `artifacts/api-server/src/routes/` — all API route handlers
- `lib/db/src/schema/` — Drizzle ORM schema
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for codegen)
- `lib/api-zod/src/index.ts` — must ONLY export `from "./generated/api"` (no types)

# Project Overview

<!-- TODO: Describe what this project does -->

## Architecture

This is a **monorepo** with the following structure:

```
apps/
  web/          # React frontend (Vite + React + TanStack Query)
  api/          # NestJS backend (REST + Prisma)
packages/
  contracts/    # Shared Zod schemas, types, and API contracts
```

### apps/web
React single-page application. Uses TanStack Query for server state management and Zod schemas from the contracts package for runtime validation.

### apps/api
NestJS API server. Uses Prisma for database access and Zod schemas from the contracts package for request/response validation.

### packages/contracts
Shared package containing Zod schemas, inferred TypeScript types, and API route contracts. Both frontend and backend import this package to ensure type-safe communication.

## Common Commands

```bash
pnpm dev              # Start all apps in development mode
pnpm build            # Build all packages and apps
pnpm test             # Run tests across the monorepo
pnpm lint             # Lint all packages
pnpm format           # Format all files with Prettier
pnpm --filter contracts build  # Rebuild shared contracts
pnpm --filter web dev          # Start only the frontend
pnpm --filter api dev          # Start only the backend
npx prisma migrate dev         # Run database migrations (from apps/api)
npx prisma generate            # Regenerate Prisma client
```

## Tech Stack

- **Frontend:** React, TypeScript, Vite, TanStack Query, Zod
- **Backend:** NestJS, TypeScript, Prisma, Zod
- **Shared:** Zod schemas as the single source of truth for types
- **Monorepo:** pnpm workspaces
- **Database:** PostgreSQL (via Prisma)
- **Testing:** <!-- TODO: Vitest / Jest -->

## Conventions

- Always update `packages/contracts` first when changing API shapes, then rebuild before updating consumers.
- Use Zod schemas for all validation; avoid hand-written TypeScript interfaces for API types.
- Frontend components live in `apps/web/src/components/`. Pages live in `apps/web/src/pages/`.
- Backend modules follow NestJS conventions: `module.ts`, `controller.ts`, `service.ts`, `*.dto.ts`.

<!-- TODO: Add project-specific conventions below -->

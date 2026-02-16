# Project Overview

<!-- TODO: Describe what this project does -->

## Architecture

This is a **Next.js App Router** fullstack application.

```
src/
  app/              # App Router pages and layouts
    api/            # Route Handlers (backend API)
    (routes)/       # Route groups and pages
    layout.tsx      # Root layout
    page.tsx        # Home page
  components/       # Reusable React components
    ui/             # Primitive UI components
  lib/              # Shared utilities, helpers, and configuration
  hooks/            # Custom React hooks
  types/            # TypeScript type definitions
public/             # Static assets
```

## Common Commands

```bash
npm run dev         # Start development server
npm run build       # Production build
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run ESLint
```

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI:** React, Tailwind CSS
- **Testing:** <!-- TODO: Vitest / Jest -->
- **Linting:** ESLint, Prettier

## Conventions

- Default to Server Components. Only add `"use client"` when the component needs browser APIs, event handlers, or React hooks.
- Server Components can `async/await` and fetch data directly.
- Route Handlers go in `src/app/api/` and export named HTTP method functions (`GET`, `POST`, etc.).
- Use `loading.tsx` and `error.tsx` for route-level loading/error states.
- Colocate page-specific components near their route. Shared components go in `src/components/`.
- Utility functions and configuration go in `src/lib/`.

<!-- TODO: Add project-specific conventions below -->

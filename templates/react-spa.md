# Project Overview

<!-- TODO: Describe what this project does -->

## Architecture

This is a **React SPA** with a separate backend API.

```
src/
  components/       # Reusable React components
    ui/             # Primitive UI components
  pages/            # Page-level components / route views
  hooks/            # Custom React hooks
  lib/              # Utilities, API client, configuration
  stores/           # State management (if applicable)
  types/            # TypeScript type definitions
  App.tsx           # Application root
  main.tsx          # Entry point
public/             # Static assets
```

## Common Commands

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm test            # Run tests
npm run lint        # Lint code
```

## Tech Stack

- **Framework:** React, Vite
- **Language:** TypeScript
- **Styling:** <!-- TODO: Tailwind CSS / CSS Modules / styled-components -->
- **State:** <!-- TODO: TanStack Query / Zustand / Redux -->
- **Testing:** <!-- TODO: Vitest / Jest -->
- **Linting:** ESLint, Prettier

## Conventions

- Components use named exports and PascalCase filenames.
- Keep page components thin; extract logic into hooks and business logic into `lib/`.
- API calls go through a centralized client in `src/lib/`.
- Colocate component-specific styles and tests next to the component file.

<!-- TODO: Add project-specific conventions below -->

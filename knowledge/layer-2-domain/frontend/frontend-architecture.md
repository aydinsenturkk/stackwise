# Frontend Architecture

See architecture-principles in Layer 1 for universal architecture rules (SoC, YAGNI, KISS, DRY).

> **Architecture Selection:** Check `PROJECT.md` for the chosen frontend architecture model. If specified, follow that model's rules exclusively. If not specified, default to Feature-Based.

## Architecture Models

| Model | Best For | Complexity |
|-------|----------|------------|
| **Feature-Based** | Most projects, domain-heavy apps | Medium |
| **Atomic Design** | Design-system-first, component library teams | Medium-High |
| **Module-Based** | Large apps, micro-frontend candidates | High |

---

## Three-Layer API Architecture

```
Client --> Service --> Hook/Store
```

| Layer      | Responsibility                      |
| ---------- | ----------------------------------- |
| Client     | Pure HTTP calls, returns raw response |
| Service    | Transformations, error handling     |
| Hook/Store | State management, caching           |

### Rules

- Client returns raw response data, nothing else
- Service handles error mapping and data transformations
- Hooks/stores consume services only, never call clients directly
- Never skip layers (a hook must not call the HTTP client directly)

---

## Page as Orchestrator

Pages are thin controllers that compose containers. They hold no business logic.

| Page Does                  | Page Does Not                |
| -------------------------- | ---------------------------- |
| Extract route parameters   | Contain business logic       |
| Compose container components | Fetch data                 |
| Define page-level layout   | Manage application state     |
| Handle route-level concerns | Handle events with logic    |

---

## Container / Presentational Split

See component-design for the full pattern. Summary:

- **Container**: Business logic, data fetching, state management
- **Presentational**: Pure UI, props only, reusable

---

## Feature Folder Structure

Organize code by domain feature, not by technical layer.

```
features/[feature]/
  components/     # Feature-specific UI
  hooks/          # Custom hooks for this feature
  queries/        # Data fetching hooks
  api/            # HTTP client and service
  store/          # State management
  types/          # TypeScript types
  index.ts        # Public API (barrel export)
```

### Rules

- Each feature exports a public API through its index file
- Features do not import directly from other features' internals
- Cross-feature communication uses events or shared services
- A feature folder contains everything that feature needs

---

## Shared Code Structure

Code used across multiple features lives in shared directories.

```
shared/
  components/     # Cross-feature UI components
  hooks/          # Cross-feature hooks
  types/          # Cross-feature types
  index.ts        # Public API
```

---

## UI Component Library

Pure, reusable UI primitives with no business logic.

```
components/ui/
  Button/
  Card/
  Input/
  Modal/
  index.ts
```

### Rules

- No business logic in UI components
- No data fetching or state management
- Configurable via props (variant, size, color)
- Framework for the entire application's visual layer

---

## Atomic Design

Organize components by abstraction level, from smallest to largest.

```
src/
  components/
    atoms/          # Smallest building blocks (Button, Input, Label, Icon)
    molecules/      # Groups of atoms (SearchBar, FormField, NavItem)
    organisms/      # Complex UI sections (Header, Sidebar, ProductCard)
    templates/      # Page layouts with placeholder content
    pages/          # Templates filled with real data + routing
  hooks/            # Shared hooks
  services/         # API and business logic
  types/            # Shared types
```

### Rules

| Level | Contains | Depends On |
|-------|----------|------------|
| Atoms | Single HTML element + styling | Nothing |
| Molecules | 2-3 atoms composed together | Atoms only |
| Organisms | Multiple molecules + business logic | Atoms, Molecules |
| Templates | Page-level layout with slots | Organisms, Molecules |
| Pages | Route entry, data fetching, template + real data | All levels |

- Atoms have **zero** business logic, only visual props (variant, size, disabled)
- Molecules combine atoms into a reusable group but stay generic
- Organisms are the first level that can fetch data or hold state
- Templates define layout structure with placeholder content
- Pages are the only level aware of routing and global state
- Each level imports only from levels below it, never above

### When to Use

- Projects where a design system is central
- Teams with dedicated designers who think in components
- When visual consistency across the app is the top priority

---

## Module-Based Architecture

Each module is a self-contained vertical slice with its own routing, state, API, and components. Designed for large apps that may evolve into micro-frontends.

```
src/
  modules/
    auth/
      routes.tsx          # Module-level routing
      components/         # Module UI
      hooks/              # Module hooks
      api/                # Module API client + service
      store/              # Module state (isolated)
      types/              # Module types
      index.ts            # Public API — only export what other modules need
    dashboard/
      routes.tsx
      components/
      ...
    billing/
      routes.tsx
      components/
      ...
  shared/
    components/           # Cross-module UI
    hooks/                # Cross-module hooks
    types/                # Cross-module types
    lib/                  # Utilities
  app/
    routes.tsx            # Root router composes module routes
    providers.tsx         # Global providers
    layout.tsx            # App shell
```

### Rules

- Modules are **fully isolated** — no direct imports between module internals
- Cross-module communication only through: shared types, events, or the public API (index.ts)
- Each module owns its own routes and lazy-loads independently
- Shared code must be genuinely reusable, not a dumping ground
- Module boundaries align with team ownership or domain boundaries
- A module can be extracted into a micro-frontend without refactoring

### When to Use

- Large apps with 5+ distinct feature areas
- Multiple teams working on the same codebase
- Apps that may split into micro-frontends later
- When module-level code splitting and lazy loading are important

---

## Principles

| Principle              | Rule                                       |
| ---------------------- | ------------------------------------------ |
| Separation of Concerns | Each layer has a single responsibility     |
| Feature-First          | Organize by domain, not by technical layer |
| YAGNI                  | Don't add abstractions until needed        |
| DRY                    | Avoid repetition (but avoid premature abstraction) |
| KISS                   | Keep it simple                             |

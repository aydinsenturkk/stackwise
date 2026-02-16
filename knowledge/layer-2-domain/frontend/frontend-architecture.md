# Frontend Architecture

See architecture-principles in Layer 1 for universal architecture rules (SoC, YAGNI, KISS, DRY).

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

## Principles

| Principle              | Rule                                       |
| ---------------------- | ------------------------------------------ |
| Separation of Concerns | Each layer has a single responsibility     |
| Feature-First          | Organize by domain, not by technical layer |
| YAGNI                  | Don't add abstractions until needed        |
| DRY                    | Avoid repetition (but avoid premature abstraction) |
| KISS                   | Keep it simple                             |

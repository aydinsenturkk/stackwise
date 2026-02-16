# Component Design Patterns

## Classification

| Location                         | Type    | Business Logic       |
| -------------------------------- | ------- | -------------------- |
| `components/ui/`                 | Pure UI | None                 |
| `features/[feature]/components/` | Feature | Allowed              |
| `shared/components/`             | Shared  | Props/events only    |

---

## Container / Presentational Pattern

The core separation for frontend components.

| Aspect         | Container (Smart)                    | Presentational (Dumb)                    |
| -------------- | ------------------------------------ | ---------------------------------------- |
| Purpose        | Business logic, data fetching        | Pure UI rendering                        |
| State          | Application state, side effects      | Local UI state only (isOpen, isExpanded) |
| Data           | Fetches and transforms data          | Receives via props                       |
| Children       | Composes presentational components   | Renders UI elements                      |
| Reusability    | Feature-specific                     | Highly reusable                          |

### What Belongs Where

**Container handles:**
- Data queries and mutations
- Application state management
- Event handlers with business logic
- Side effects (observers, connections, listeners)

**Presentational handles:**
- Visual rendering
- Local UI state (toggles, expand/collapse)
- Style variants
- Layout composition

---

## Props Design

### Allowed in Presentational Components

- Boolean flags: `isLoading`, `isOpen`, `isDisabled`
- Visual variants: `variant`, `size`, `color`
- Callbacks: `onClick`, `onSubmit`, `onChange`

### Belongs in Container Components

- Business entities: `user`, `post`, `order`
- Data identifiers: `userId`, `postId`
- Data fetching triggers: `fetchNextPage`

### Warning Signs

| Signal                        | Action                              |
| ----------------------------- | ----------------------------------- |
| Props count exceeds 7         | Component is doing too much - split |
| Business objects in UI props  | Move data handling to container     |
| Callbacks with business logic | Extract to container                |

---

## Composition Rules

| Rule                        | Description                                         |
| --------------------------- | --------------------------------------------------- |
| Single Responsibility       | Each component does one thing                       |
| Composition over Inheritance| Build complex UIs from simple, composable pieces    |
| Props for Communication     | Parent-child communicate via props and callbacks    |
| Presentational Purity       | UI components are pure, deterministic, and reusable |

---

## Infrastructure Concerns

These belong in **Container** components, never in Presentational:

| Concern                  | Example                                |
| ------------------------ | -------------------------------------- |
| Intersection observers   | Infinite scroll, lazy load triggers    |
| Scroll logic             | Scroll position tracking, anchoring   |
| Fetch triggers           | Pagination, search-as-you-type        |
| Real-time connections    | WebSocket subscriptions, SSE streams  |
| Browser event listeners  | Resize, visibility change, online     |

---

## Anti-Patterns

| Anti-Pattern   | Sign                              | Solution                               |
| -------------- | --------------------------------- | -------------------------------------- |
| God Component  | 500+ lines, many responsibilities | Split into focused components          |
| Prop Drilling  | Props passed through 5+ levels    | Use context or state management        |
| Mixed Concerns | Business logic in UI component    | Apply Container/Presentational pattern |

---

## Principles

- **Separate concerns**: UI rendering and business logic live in different components
- **Keep UI components pure**: Given the same props, render the same output
- **Compose, don't inherit**: Build complex UIs by combining simple components
- **Collocate related code**: Feature components live with their feature, not in a global folder

See architecture-principles for general separation of concerns rules.

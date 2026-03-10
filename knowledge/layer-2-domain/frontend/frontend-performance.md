# Frontend Performance

> See Layer 1 performance-principles.md for universal performance principles.

---

## Memoization

Memoization caches the result of expensive computations or component renders to avoid unnecessary recalculation.

### When to Memoize

| Scenario                                  | Memoize? |
| ----------------------------------------- | -------- |
| Expensive computation on each render      | Yes      |
| Component re-renders with same props      | Yes      |
| Callback passed to memoized child         | Yes      |
| Trivial computation or simple render      | No       |
| Component always receives different props | No       |

### Rules

- Only memoize after measuring a performance problem
- Memoization has a cost (memory, comparison overhead)
- Incorrect memoization (missing dependencies) causes stale data bugs

---

## Code Splitting

Code splitting breaks the application bundle into smaller chunks loaded on demand, reducing initial load time.

| Strategy        | Description                                    |
| --------------- | ---------------------------------------------- |
| Route-based     | Each route loads its own bundle                |
| Component-based | Large components loaded when needed            |
| Feature-based   | Entire feature modules loaded on first access  |

### Rules

- Split at route boundaries first (biggest impact)
- Split large components that are not needed immediately
- Provide loading indicators while chunks load
- Avoid splitting small components (overhead exceeds benefit)

---

## Lazy Loading

Load resources only when they are needed or about to be needed.

| Resource   | Strategy                                |
| ---------- | --------------------------------------- |
| Routes     | Load route component on navigation      |
| Images     | Load when entering viewport             |
| Components | Load on user interaction or visibility  |
| Data       | Fetch on demand, not on page load       |

---

## Selector Optimization

When reading from a state store, select only the specific data needed.

| Pattern                      | Impact                       |
| ---------------------------- | ---------------------------- |
| Select specific slice        | Component re-renders only when that slice changes |
| Select entire state          | Component re-renders on every state change        |

---

## Virtualization

For rendering long lists or large datasets, render only the items visible in the viewport.

| Scenario                | Solution                                |
| ----------------------- | --------------------------------------- |
| List with 100+ items    | Virtualized list (render visible only)  |
| Large table/grid        | Virtualized table with row recycling    |
| Infinite scroll         | Windowed rendering + fetch on scroll    |

---

## Anti-Patterns

| Anti-Pattern           | Problem                            | Solution                |
| ---------------------- | ---------------------------------- | ----------------------- |
| Over-memoization       | Memoizing trivial operations       | Only memoize expensive  |
| Missing dependencies   | Stale data from incomplete deps    | Include all dependencies|
| Loading everything     | Large initial bundle               | Code split by route     |

---

## Principles

- **Split by route**: Route-based splitting gives the biggest win
- **Memoize judiciously**: Only for measured expensive operations
- **Virtualize long lists**: Never render thousands of DOM nodes
- **Load on demand**: Defer resources until they are needed

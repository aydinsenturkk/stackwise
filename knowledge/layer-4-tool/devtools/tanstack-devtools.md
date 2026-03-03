# TanStack DevTools

## Overview

TanStack provides a unified DevTools component with a plugin system. Query, Router, and Form each have a devtools plugin that renders in a shared panel during development.

---

## Unified DevTools Setup

```bash
npm install @tanstack/react-devtools @tanstack/react-query-devtools @tanstack/router-devtools @tanstack/react-form-devtools
```

```tsx
import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";

function RootComponent() {
  return (
    <>
      <Outlet />
      {process.env.NODE_ENV === "development" && (
        <TanStackDevtools
          config={{ hideUntilHover: true }}
          plugins={[formDevtoolsPlugin()]}
        />
      )}
    </>
  );
}
```

---

## Query DevTools

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Query DevTools Features

| Feature              | Purpose                                    |
| -------------------- | ------------------------------------------ |
| Query list           | See all queries, their status, and stale time |
| Query data inspector | Inspect cached data for any query          |
| Refetch controls     | Manually trigger refetch or invalidation   |
| Timing info          | Last updated, stale since, gc countdown    |
| Status filters       | Filter by fresh, stale, fetching, inactive |

### Configuration

| Prop               | Default | Purpose                              |
| ------------------ | ------- | ------------------------------------ |
| `initialIsOpen`    | `false` | Start expanded or collapsed          |
| `buttonPosition`   | `"bottom-right"` | Toggle button placement      |
| `position`         | `"bottom"` | Panel position                    |
| `client`           | context | Use specific QueryClient             |

### Production Lazy Loading

```tsx
import { lazy, Suspense } from "react";

const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((mod) => ({
    default: mod.ReactQueryDevtools,
  }))
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      {process.env.NODE_ENV === "development" && (
        <Suspense fallback={null}>
          <ReactQueryDevtools />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
```

---

## Router DevTools

```bash
npm install @tanstack/router-devtools
```

```tsx
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

// Option 1: In root route component
export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  ),
});

// Option 2: Lazy loaded
const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/router-devtools").then((mod) => ({
          default: mod.TanStackRouterDevtools,
        }))
      );
```

### Router DevTools Features

| Feature             | Purpose                                     |
| ------------------- | ------------------------------------------- |
| Route tree          | Visualize route hierarchy                   |
| Active route        | Highlight currently matched routes          |
| Route params        | Inspect current params and search params    |
| Loader data         | View data returned by route loaders         |
| Navigation history  | Track navigation events                     |
| Route matching      | Debug why routes match or don't             |

### Configuration

| Prop             | Default          | Purpose                     |
| ---------------- | ---------------- | --------------------------- |
| `position`       | `"bottom-right"` | Panel toggle position       |
| `initialIsOpen`  | `false`          | Start expanded              |
| `router`         | context          | Use specific router instance|

---

## Form DevTools

```bash
npm install @tanstack/react-form-devtools
```

```tsx
import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";

function App() {
  return (
    <>
      <AppContent />
      <TanStackDevtools
        config={{ hideUntilHover: true }}
        plugins={[formDevtoolsPlugin()]}
      />
    </>
  );
}
```

### Form DevTools Features

| Feature           | Purpose                                      |
| ----------------- | -------------------------------------------- |
| Field list        | See all registered fields                    |
| Field state       | Inspect value, errors, touched, dirty        |
| Validation status | View which validators passed/failed          |
| Form state        | Global form state (canSubmit, isSubmitting)   |
| Submit history    | Track form submission attempts               |

---

## Combined Setup

```tsx
// app.tsx — All devtools in one place
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";

function RootComponent() {
  return (
    <>
      <Outlet />
      {process.env.NODE_ENV === "development" && (
        <>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          <TanStackRouterDevtools position="bottom-right" />
          <TanStackDevtools
            config={{ hideUntilHover: true }}
            plugins={[formDevtoolsPlugin()]}
          />
        </>
      )}
    </>
  );
}
```

### Recommended Layout

| DevTool  | Position         | Reason                            |
| -------- | ---------------- | --------------------------------- |
| Query    | `bottom-left`    | Most frequently checked           |
| Router   | `bottom-right`   | Secondary, route debugging        |
| Form     | Unified panel    | Via TanStackDevtools plugin       |

---

## Tree Shaking in Production

DevTools packages are designed to be tree-shaken, but explicitly guarding ensures zero production impact:

```typescript
// lib/devtools.ts
export const QueryDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-query-devtools").then((mod) => ({
          default: mod.ReactQueryDevtools,
        }))
      );

export const RouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/router-devtools").then((mod) => ({
          default: mod.TanStackRouterDevtools,
        }))
      );
```

---

## Anti-Patterns

| Anti-Pattern                                | Solution                                    |
| ------------------------------------------- | ------------------------------------------- |
| Importing devtools without production guard | Wrap in `process.env.NODE_ENV` check        |
| Bundling devtools in production             | Use lazy loading with conditional rendering |
| All devtools on same position               | Spread across corners to avoid overlap      |
| Not using devtools during development       | Always include — speeds up debugging        |
| Relying on console.log for query debugging  | Use Query DevTools data inspector instead   |
| Separate FormDevtools per form              | Use unified TanStackDevtools with plugin    |

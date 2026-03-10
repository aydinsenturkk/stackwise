# React SPA with Vite

> **React Router v7 library mode** — This file covers React Router v7 used as a library (without `@react-router/dev`). For framework mode with SSR, file-based routing, and server loaders, see the Remix/React Router framework docs.

## Project Structure

```
src/
├── app/
│   ├── App.tsx              # Root component, providers, router
│   ├── routes.tsx           # Route definitions
│   └── providers.tsx        # Context providers composition
├── features/
│   └── [feature]/
│       ├── components/      # Feature UI
│       ├── hooks/           # Custom hooks
│       ├── queries/         # TanStack Query (keys, hooks)
│       ├── api/             # Client + Service layer
│       ├── store/           # State management
│       ├── types/           # Feature types
│       └── index.ts         # Public API (barrel export)
├── shared/
│   ├── components/          # Cross-feature UI
│   ├── hooks/               # Cross-feature hooks
│   ├── types/               # Cross-feature types
│   └── index.ts
├── components/
│   └── ui/                  # Design system primitives
│       ├── Button/
│       ├── Card/
│       └── index.ts
├── lib/                     # Third-party wrappers, utilities
└── main.tsx                 # Entry point
```

### Import Rules

| From            | Can Import                    | Cannot Import          |
| --------------- | ----------------------------- | ---------------------- |
| `features/X`    | `shared/`, `components/ui/`   | Other `features/Y`     |
| `shared/`       | `components/ui/`, `lib/`      | Any `features/`        |
| `components/ui/`| Nothing (self-contained)      | `shared/`, `features/` |

---

## Client-Side Routing (React Router v7)

React Router v7 unified all packages under `react-router`. The `react-router-dom` package is deprecated — all imports come from `react-router`.

```tsx
// app/routes.tsx
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "dashboard",
        lazy: () => import("../features/dashboard/route"),
      },
      {
        path: "settings",
        lazy: () => import("../features/settings/route"),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

// features/dashboard/route.tsx — lazy route module
export { default as Component } from "./DashboardPage";
export { ErrorBoundary } from "./DashboardError";
export async function loader() {
  // optional client-side loader
  return { stats: await fetchDashboardStats() };
}

// main.tsx
import { RouterProvider } from "react-router";
import { router } from "./app/routes";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

### route.lazy() Pattern

The `lazy` property on a route replaces manual `React.lazy` + `Suspense` wrapping. The lazy function returns a module that can export `Component`, `ErrorBoundary`, `loader`, `action`, and other route properties. React Router handles the Suspense boundary automatically.

```tsx
// Preferred: route.lazy() — handles Suspense automatically
{ path: "users", lazy: () => import("../features/users/route") }

// Avoid: manual React.lazy + Suspense wrapping (legacy pattern)
const Users = lazy(() => import("../features/users"));
{ path: "users", element: <Suspense fallback={...}><Users /></Suspense> }
```

### Route Organization

| Pattern              | When                              |
| -------------------- | --------------------------------- |
| Flat routes          | Small apps, < 10 routes           |
| Nested routes        | Shared layouts, parent-child UI   |
| `route.lazy()`       | Always for feature routes         |
| Index routes         | Default child content             |
| Client loaders       | Pre-fetch data before render      |

---

## Code Splitting

### Route-Level Splitting (Required)

```tsx
// Use route.lazy() for all feature routes — no manual React.lazy needed
{
  path: "user-profile/:id",
  lazy: () => import("../features/user-profile/route"),
}
```

### Component-Level Splitting (When Needed)

```tsx
// Heavy components outside routes still use React.lazy + Suspense
import { lazy, Suspense } from "react";

const RichTextEditor = lazy(() => import("./RichTextEditor"));
const ChartDashboard = lazy(() => import("./ChartDashboard"));

function PostEditor() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <RichTextEditor />
    </Suspense>
  );
}
```

### When to Code Split

| Split                                   | Don't Split                        |
| --------------------------------------- | ---------------------------------- |
| Feature routes (`route.lazy()`)         | Shared UI components (Button, etc.)|
| Heavy libraries (chart, editor, map)    | Small utility components           |
| Modals and drawers                      | Navigation and layout              |
| Admin/settings sections                 | Core app shell                     |

---

## Environment Variables

```bash
# .env
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=My App

# .env.production
VITE_API_URL=https://api.example.com
```

### Access Rules

| Rule                                      | Example                              |
| ----------------------------------------- | ------------------------------------ |
| Must be prefixed with `VITE_`             | `VITE_API_URL` (not `API_URL`)       |
| Access via `import.meta.env`              | `import.meta.env.VITE_API_URL`       |
| String-replaced at build time             | No runtime env switching             |
| Never put secrets in `VITE_` variables    | Secrets go in backend only           |

```typescript
// lib/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  appTitle: import.meta.env.VITE_APP_TITLE,
} as const;
```

---

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Vite 6 uses Rollup. Future Vite versions will transition to Rolldown,
    // where manualChunks may move to advancedChunks. Keep current config for now.
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router"],
          query: ["@tanstack/react-query"],
        },
      },
    },
    sourcemap: true,
  },
});
```

### Build Optimization

| Strategy           | Config                                     | Purpose                     |
| ------------------ | ------------------------------------------ | --------------------------- |
| Manual chunks      | `manualChunks` in rollupOptions            | Vendor bundle splitting     |
| Tree shaking       | Automatic with ESM imports                 | Remove dead code            |
| Source maps         | `sourcemap: true`                          | Debugging production issues |
| CSS code splitting | Automatic per lazy route                   | Smaller initial CSS         |

> **Rolldown transition**: Vite is migrating from Rollup to Rolldown as its bundler. When this lands, `manualChunks` may become `advancedChunks` with a different API. Watch Vite release notes and update accordingly.

---

## Dev Server Proxy

```typescript
// Proxy API requests to avoid CORS during development
server: {
  proxy: {
    "/api": {
      target: "http://localhost:3000",
      changeOrigin: true,
    },
    "/ws": {
      target: "ws://localhost:3000",
      ws: true,
    },
  },
}
```

---

## Static Asset Handling

| Location       | Access                              | Build Behavior            |
| -------------- | ----------------------------------- | ------------------------- |
| `src/assets/`  | `import logo from "./logo.svg"`     | Hashed filename, bundled  |
| `public/`      | `/favicon.ico` (absolute path)      | Copied as-is, no hashing |

```tsx
// Imported assets get hashed filenames for cache busting
import heroImage from "@/assets/hero.png";

<img src={heroImage} alt="Hero" />

// Public assets served as-is
<link rel="icon" href="/favicon.ico" />
```

---

## Anti-Patterns

| Anti-Pattern                           | Solution                                         |
| -------------------------------------- | ------------------------------------------------ |
| Importing from `react-router-dom`      | Use `react-router` — the unified v7 package      |
| `React.lazy` + `Suspense` for routes   | Use `route.lazy()` — handles Suspense for you    |
| No code splitting                      | Lazy-load all feature routes via `route.lazy()`  |
| Secrets in `VITE_` env vars            | Keep secrets in backend only                     |
| Importing across features              | Use `shared/` for cross-feature code             |
| Single massive bundle                  | Use `manualChunks` for vendor splitting          |
| No proxy in development                | Configure `server.proxy` to avoid CORS           |
| Deep import paths                      | Use path aliases (`@/features/...`)              |
| Using `@react-router/dev` in SPA       | Use library mode — no build plugin needed        |

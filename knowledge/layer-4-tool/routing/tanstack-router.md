# TanStack Router

## Route Tree Definition

```typescript
// routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  ),
  notFoundComponent: () => <NotFound />,
  errorComponent: ({ error }) => <ErrorPage error={error} />,
});
```

```typescript
// routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});
```

```typescript
// routes/users/$userId.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$userId")({
  component: UserDetailPage,
  loader: ({ params }) => userService.getById(params.userId),
});
```

---

## File-Based Routing

| File Path                      | URL Path            | Route ID              |
| ------------------------------ | ------------------- | --------------------- |
| `routes/index.tsx`             | `/`                 | `/`                   |
| `routes/about.tsx`             | `/about`            | `/about`              |
| `routes/users/index.tsx`       | `/users`            | `/users/`             |
| `routes/users/$userId.tsx`     | `/users/:userId`    | `/users/$userId`      |
| `routes/_layout.tsx`           | (layout only)       | `/_layout`            |
| `routes/_layout/dashboard.tsx` | `/dashboard`        | `/_layout/dashboard`  |

---

## Route Parameters

```typescript
// routes/users/$userId.tsx
export const Route = createFileRoute("/users/$userId")({
  component: UserDetail,
});

function UserDetail() {
  const { userId } = Route.useParams(); // Fully typed
  return <div>User: {userId}</div>;
}
```

---

## Search Params (Query Strings)

```typescript
import { z } from "zod";

const userSearchSchema = z.object({
  page: z.number().int().positive().default(1),
  search: z.string().optional(),
  sort: z.enum(["name", "date", "role"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const Route = createFileRoute("/users")({
  validateSearch: userSearchSchema,
  component: UsersPage,
});

function UsersPage() {
  const { page, search, sort, order } = Route.useSearch(); // Fully typed
  const navigate = Route.useNavigate();

  return (
    <div>
      <input
        value={search ?? ""}
        onChange={(e) =>
          navigate({ search: (prev) => ({ ...prev, search: e.target.value, page: 1 }) })
        }
      />
    </div>
  );
}
```

---

## Data Loading

### Route Loaders

```typescript
export const Route = createFileRoute("/users/$userId")({
  loader: async ({ params, context }) => {
    return context.queryClient.ensureQueryData({
      queryKey: userKeys.detail(params.userId),
      queryFn: () => userService.getById(params.userId),
    });
  },
  pendingComponent: () => <Skeleton />,
  errorComponent: ({ error }) => <ErrorMessage error={error} />,
  component: UserDetail,
});

function UserDetail() {
  const user = Route.useLoaderData(); // Typed from loader return
  return <UserCard user={user} />;
}
```

### Loader Integration with TanStack Query

| Strategy            | When                                 |
| ------------------- | ------------------------------------ |
| `ensureQueryData`   | Prefetch and cache (recommended)     |
| `fetchQuery`        | Always fetch fresh, still cache      |
| Direct fetch        | One-off data, no caching needed      |

---

## Navigation

```typescript
import { Link, useNavigate } from "@tanstack/react-router";

// Declarative — type-safe Link
<Link to="/users/$userId" params={{ userId: "123" }}>
  View User
</Link>

<Link
  to="/users"
  search={{ page: 1, sort: "name" }}
  activeProps={{ className: "font-bold text-blue-600" }}
>
  Users
</Link>

// Programmatic navigation
const navigate = useNavigate();
navigate({ to: "/users/$userId", params: { userId: "123" } });
navigate({ to: "/users", search: (prev) => ({ ...prev, page: 2 }) });
navigate({ to: "..", replace: true }); // Go up, replace history
```

### Link Props

| Prop           | Purpose                                |
| -------------- | -------------------------------------- |
| `to`           | Target route path                      |
| `params`       | Route parameters                       |
| `search`       | Search params (object or updater fn)   |
| `activeProps`  | Props applied when route is active     |
| `replace`      | Replace history entry instead of push  |
| `preload`      | Preload on hover (`"intent"`)          |

---

## Layout Routes

```typescript
// routes/_authenticated.tsx — Layout route (underscore prefix)
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  ),
});

// routes/_authenticated/dashboard.tsx — Protected child route
export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});
```

---

## Route Context

```typescript
// routes/__root.tsx
interface RouterContext {
  queryClient: QueryClient;
  auth: AuthState;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

// main.tsx
const router = createRouter({
  routeTree,
  context: { queryClient, auth },
});
```

---

## Preloading

```tsx
// Preload on hover (default with intent)
<Link to="/users/$userId" params={{ userId }} preload="intent">
  View User
</Link>

// Preload on render
<Link to="/users/$userId" params={{ userId }} preload="render">
  View User
</Link>
```

| Strategy   | When Preloads          | Use Case          |
| ---------- | ---------------------- | ----------------- |
| `"intent"` | On hover/focus         | Most links        |
| `"render"` | On component mount     | High-priority     |
| `false`    | Never                  | Expensive loaders |

---

## Anti-Patterns

| Anti-Pattern                              | Solution                                        |
| ----------------------------------------- | ----------------------------------------------- |
| Untyped search params with `useSearchParams` | Use `validateSearch` with Zod schema         |
| Fetching data in `useEffect`              | Use route `loader` with TanStack Query          |
| String-based navigation                   | Use typed `Link` and `useNavigate`              |
| Auth checks inside components             | Use `beforeLoad` in layout routes               |
| Manual loading states for route data      | Use `pendingComponent` on routes                |
| Not preloading on link hover              | Use `preload="intent"` on Links                 |

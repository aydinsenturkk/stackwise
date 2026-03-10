# TanStack Start

> TanStack Start reached v1 (Release Candidate). APIs are considered stable.

## Overview

TanStack Start is a full-stack framework built on TanStack Router. It adds SSR, server functions, middleware, and server routes. Built on Vite 6 with Nitro for server builds and deployment adapters.

Key features:
- Type-safe file-based routing (powered by TanStack Router)
- Server functions with `createServerFn`
- SSR with streaming
- Middleware with request and function types
- Server routes (API routes)
- Multi-deployment via Nitro presets

## Project Setup

```
src/
├── routes/
│   ├── __root.tsx             → Root layout
│   ├── index.tsx              → /
│   ├── users.tsx              → /users (layout)
│   ├── users.index.tsx        → /users (index)
│   └── users.$userId.tsx      → /users/:userId
├── client.tsx                 → Client entry
├── router.tsx                 → Router definition
├── server.ts                  → Server entry
└── routeTree.gen.ts           → Auto-generated route tree
app.config.ts                  → Start/Vite configuration
```

## File-Based Routing

TanStack Start uses TanStack Router's file-based routing. The route tree is auto-generated.

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet, Link } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: () => (
    <html>
      <head><meta charSet="utf-8" /></head>
      <body>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/users">Users</Link>
        </nav>
        <Outlet />
      </body>
    </html>
  ),
});
```

```typescript
// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: () => <h1>Welcome</h1>,
});
```

### Route File Naming

| Pattern | URL | Example |
| ------- | --- | ------- |
| `index.tsx` | `/` | Root index |
| `about.tsx` | `/about` | Static route |
| `users.tsx` | `/users` | Layout route (has `<Outlet />`) |
| `users.index.tsx` | `/users` | Index child of layout |
| `users.$id.tsx` | `/users/:id` | Dynamic param |
| `posts.$.tsx` | `/posts/*` | Catch-all / splat |
| `_layout.tsx` | — | Pathless layout |
| `_layout.settings.tsx` | `/settings` | Under pathless layout |

## Type-Safe Loaders

Loaders fetch data before a route renders. They are fully type-safe.

```typescript
// src/routes/users.index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { getUsers } from '../server/users';

export const Route = createFileRoute('/users/')({
  loader: async () => {
    const users = await getUsers();
    return { users };
  },
  component: UsersPage,
});

function UsersPage() {
  const { users } = Route.useLoaderData(); // Fully typed
  return <ul>{users.map(user => <li key={user.id}>{user.name}</li>)}</ul>;
}
```

### Loader with Params

```typescript
// src/routes/users.$userId.tsx
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    const user = await getUserById(params.userId); // params typed
    if (!user) throw notFound();
    return { user };
  },
  component: () => {
    const { user } = Route.useLoaderData();
    return <h1>{user.name}</h1>;
  },
  notFoundComponent: () => <p>User not found</p>,
});
```

### Loader with Search Params

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().int().positive().default(1),
  search: z.string().optional(),
  sort: z.enum(['name', 'date']).default('name'),
});

export const Route = createFileRoute('/users/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page, search: search.search }),
  loader: async ({ deps }) => {
    return { users: await fetchUsers(deps.page, deps.search) };
  },
  component: UsersPage,
});

function UsersPage() {
  const { users } = Route.useLoaderData();
  const search = Route.useSearch(); // Typed from searchSchema
  const navigate = Route.useNavigate();
  return (
    <div>
      <input
        value={search.search ?? ''}
        onChange={(e) =>
          navigate({ search: (prev) => ({ ...prev, search: e.target.value, page: 1 }) })
        }
      />
      <UserList users={users} />
    </div>
  );
}
```

## Server Functions

`createServerFn` creates functions that execute only on the server. They can be called from loaders, components, or other server functions.

```typescript
// src/server/users.ts
import { createServerFn } from '@tanstack/react-start';
import { db } from './db';

export const getUsers = createServerFn({ method: 'GET' })
  .handler(async () => {
    return db.user.findMany({ orderBy: { createdAt: 'desc' } });
  });

export const getUserById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    return db.user.findUnique({ where: { id: data.id } });
  });

export const createUser = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }))
  .handler(async ({ data }) => {
    return db.user.create({ data });
  });

export const deleteUser = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await db.user.delete({ where: { id: data.id } });
  });
```

### Using Server Functions in Components

```typescript
function CreateUserForm() {
  const router = useRouter();
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createUser({ data: { name: fd.get('name') as string, email: fd.get('email') as string } });
    router.invalidate(); // Refetch loader data
  }
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

## Middleware

Middleware has two types: `request` (runs on every HTTP request) and `function` (runs when a server function is called). Use `.client()` to add client-side logic before the server call.

```typescript
import { createMiddleware } from '@tanstack/react-start';

// Request middleware — runs on every incoming request
const loggingMiddleware = createMiddleware({ type: 'request' })
  .server(async ({ next }) => {
    const start = Date.now();
    const result = await next();
    console.log(`Request took ${Date.now() - start}ms`);
    return result;
  });

// Function middleware — runs when a server function is invoked
const authMiddleware = createMiddleware({ type: 'function' })
  .server(async ({ next }) => {
    const user = await getSessionUser();
    if (!user) throw new Error('Unauthorized');
    return next({ context: { user } });
  });

// Client + server middleware — .client() runs before the server call
const clientAuthMiddleware = createMiddleware({ type: 'function' })
  .client(async ({ next }) => {
    // Attach headers, validate client-side, etc.
    return next();
  })
  .server(async ({ next }) => {
    const user = await getSessionUser();
    if (!user) throw new Error('Unauthorized');
    return next({ context: { user } });
  });

// Use in server functions
export const getProtectedData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context.user is typed and available
    return db.data.findMany({ where: { userId: context.user.id } });
  });
```

## Server Routes (API Routes)

Server routes create standalone API endpoints using Nitro's event handler conventions. Useful for webhooks, external callbacks, and endpoints not tied to UI routes.

```typescript
// src/routes/api/health.ts
import { createServerRoute } from '@tanstack/react-start';

export const ServerRoute = createServerRoute('/api/health', ({ request }) => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## Configuration

```typescript
// app.config.ts
import { defineConfig } from '@tanstack/react-start/config';

export default defineConfig({
  server: {
    preset: 'node-server',  // Nitro preset: 'vercel', 'cloudflare-pages', 'netlify', etc.
  },
  tsr: {
    appDirectory: './src',
    routesDirectory: './src/routes',
    generatedRouteTree: './src/routeTree.gen.ts',
  },
});
```

Nitro handles the server build and deployment. Change the `server.preset` to target different platforms.

### Router Setup

```typescript
// src/router.tsx
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function createAppRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
```

### Server Entry

```typescript
// src/server.ts
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import { createAppRouter } from './router';

export default createStartHandler({
  createRouter: createAppRouter,
})(defaultStreamHandler);
```

## Error Handling

```typescript
export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    const user = await getUserById({ data: { id: params.userId } });
    if (!user) throw notFound();
    return { user };
  },
  component: UserDetail,
  errorComponent: ({ error }) => (
    <div><h1>Error</h1><p>{error.message}</p></div>
  ),
  notFoundComponent: () => <p>User not found</p>,
  pendingComponent: () => <p>Loading...</p>,
});
```

## Navigation and Links

```typescript
import { Link, useNavigate } from '@tanstack/react-router';

// Declarative — type-safe, validates params
<Link to="/users/$userId" params={{ userId: '123' }}>View User</Link>

// With search params
<Link to="/users" search={{ page: 2, sort: 'name' }}>Page 2</Link>

// Imperative
const navigate = useNavigate();
navigate({ to: '/users/$userId', params: { userId: '123' } });
```

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| Calling DB directly in loaders | Loaders may run on client during SPA nav | Use `createServerFn` for server-only code |
| Not using `router.invalidate()` | Stale data after mutations | Call `invalidate()` after server function mutations |
| Untyped search params | Runtime errors, no autocomplete | Use `validateSearch` with Zod schema |
| Large server function payloads | Slow serialization, big responses | Return only needed fields |
| Ignoring `pendingComponent` | No loading feedback during navigation | Add `pendingComponent` for slow loaders |
| Using `useEffect` for data fetching | Misses SSR, no loader integration | Use route loaders or server functions |
| Not declaring `loaderDeps` | Loader doesn't re-run on search param change | Declare all search params used by loader in `loaderDeps` |
| Using `.validator()` instead of `.inputValidator()` | Deprecated API, will break | Use `.inputValidator()` on server functions |

# React Router v7 (Framework Mode)

> Successor to Remix. For migration from Remix v2, all `@remix-run/*` imports become `react-router` or `@react-router/*`.

## Route Configuration

Routes are defined in `routes.ts`. For file-based routing, use `@react-router/fs-routes`.

```typescript
// routes.ts — file-based
import type { RouteConfig } from '@react-router/dev/routes';
import { flatRoutes } from '@react-router/fs-routes';
export default flatRoutes() satisfies RouteConfig;

// routes.ts — manual
import { type RouteConfig, route, index, layout, prefix } from '@react-router/dev/routes';
export default [
  index('routes/home.tsx'),
  route('about', 'routes/about.tsx'),
  layout('routes/users-layout.tsx', [
    index('routes/users-index.tsx'),
    route('users/:userId', 'routes/user-profile.tsx'),
  ]),
  ...prefix('api', [route('webhook', 'routes/api.webhook.ts')]),
] satisfies RouteConfig;
```

### File Conventions (with flatRoutes)

| Pattern | Meaning | Example |
| ------- | ------- | ------- |
| `_index.tsx` | Index route | `routes/_index.tsx` -> `/` |
| `$param` | Dynamic segment | `users.$id.tsx` -> `/users/:id` |
| `_prefix` | Pathless layout | `_auth.login.tsx` -> `/login` |
| `param_` | Escape layout nesting | `users.$id_.edit.tsx` -> `/users/:id/edit` |
| `.` | URL separator | `users.settings.tsx` -> `/users/settings` |
| `($param)` | Optional segment | `files.($id).tsx` -> `/files` or `/files/:id` |
| `[.]` | Literal dot | `sitemap[.]xml.tsx` -> `/sitemap.xml` |

---

## Vite Plugin

```typescript
// vite.config.ts
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
export default defineConfig({ plugins: [reactRouter()] });
```

---

## Typegen and Route Types

React Router v7 auto-generates route types via `typegen` into `.react-router/types/`.

```typescript
import type { Route } from './+types/users.$userId';

export async function loader({ params }: Route.LoaderArgs) {
  const user = await db.user.findUnique({ where: { id: params.userId } });
  if (!user) throw new Response('User not found', { status: 404 });
  return { user };
}

// Component receives typed props — no useLoaderData needed
export default function UserProfile({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.user.name}</h1>;
}
```

| Remix | React Router v7 |
| ----- | --------------- |
| `LoaderFunctionArgs` | `Route.LoaderArgs` (auto-generated) |
| `ActionFunctionArgs` | `Route.ActionArgs` (auto-generated) |
| `useLoaderData<typeof loader>()` | `loaderData` prop via `Route.ComponentProps` |
| `useActionData<typeof action>()` | `actionData` prop via `Route.ComponentProps` |
| `MetaFunction<typeof loader>` | `Route.MetaFunction` (auto-generated) |

---

## Loaders

Loaders run on the server. Return plain objects — `json()` is deprecated. Use `data()` when you need status codes or headers.

```typescript
import type { Route } from './+types/users';
import { data, redirect } from 'react-router';

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  if (!user) throw redirect('/login');

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const users = await db.user.findMany({ skip: (page - 1) * 20, take: 20 });

  return { users, page }; // Plain object — no json() wrapper
}

// Use data() for status codes or custom headers
export async function loader({ params }: Route.LoaderArgs) {
  const user = await db.user.findUnique({ where: { id: params.userId } });
  if (!user) throw data('Not found', { status: 404 });
  return data({ user }, { headers: { 'Cache-Control': 'max-age=300' } });
}

export default function UsersLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>Users</h1>
      <UserList users={loaderData.users} />
      <Outlet />
    </div>
  );
}
```

---

## Actions

Actions handle form submissions (POST, PUT, PATCH, DELETE).

```typescript
import type { Route } from './+types/users.new';
import { data, redirect } from 'react-router';
import { Form, useNavigation } from 'react-router';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }
  const user = await db.user.create({ data: result.data });
  return redirect(`/users/${user.id}`);
}

export default function NewUser({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  return (
    <Form method="post">
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required />
        {actionData?.errors?.name && <p className="error">{actionData.errors.name}</p>}
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
        {actionData?.errors?.email && <p className="error">{actionData.errors.email}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create User'}
      </button>
    </Form>
  );
}
```

---

## Streaming Data (Replaces defer)

`defer()` is deprecated. Return promises directly — Single Fetch handles streaming automatically.

```typescript
import type { Route } from './+types/users.$userId';
import { Await } from 'react-router';
import { Suspense } from 'react';

export async function loader({ params }: Route.LoaderArgs) {
  const user = await db.user.findUnique({ where: { id: params.userId! } });
  // Non-critical data — return promise directly, streamed via Single Fetch
  const activityPromise = db.activity.findMany({
    where: { userId: params.userId },
    orderBy: { createdAt: 'desc' },
  });
  return { user, activity: activityPromise };
}

export default function UserProfile({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>{loaderData.user.name}</h1>
      <Suspense fallback={<p>Loading activity...</p>}>
        <Await resolve={loaderData.activity} errorElement={<p>Error loading activity</p>}>
          {(resolved) => <ActivityList items={resolved} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

---

## Progressive Enhancement

`<Form>` works without JavaScript. With JS enabled, it upgrades to fetch.

```typescript
import { Form, useFetcher } from 'react-router';

// Basic form — works without JS
<Form method="post" action="/users">
  <input name="name" />
  <button type="submit">Create</button>
</Form>

// useFetcher — for in-page mutations (no navigation)
function DeleteButton({ userId }: { userId: string }) {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== 'idle';
  return (
    <fetcher.Form method="post" action={`/users/${userId}/delete`}>
      <button type="submit" disabled={isDeleting}>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </fetcher.Form>
  );
}
```

### Form vs useFetcher

| | `<Form>` | `useFetcher` |
| --- | -------- | ------------ |
| Navigation | Triggers route transition | No navigation |
| URL change | Yes | No |
| Use when | Create, navigate after submit | In-line updates, toggles, deletes |
| Loading state | `useNavigation()` | `fetcher.state` |

---

## Error Boundaries

```typescript
import { isRouteErrorResponse, useRouteError } from 'react-router';

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }
  return (
    <div>
      <h1>Unexpected Error</h1>
      <p>{(error as Error).message}</p>
    </div>
  );
}
```

---

## Resource Routes

Routes without a default export — only loader/action. Used for APIs, downloads, webhooks.

```typescript
// routes/api.webhook.ts (no default export = resource route)
import type { Route } from './+types/api.webhook';

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  await processWebhook(payload);
  return new Response(null, { status: 204 });
}

// routes/users.$id.avatar.ts — serve image
export async function loader({ params }: Route.LoaderArgs) {
  const avatar = await getAvatar(params.id!);
  return new Response(avatar, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
  });
}
```

---

## Session Management

```typescript
// sessions.server.ts
import { createCookieSessionStorage, redirect } from 'react-router';

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: '__session',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      secrets: [process.env.SESSION_SECRET!],
    },
  });

export async function requireAuth(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');
  if (!userId) throw redirect('/login');
  return userId;
}

export { getSession, commitSession, destroySession };
```

---

## Meta and Headers

```typescript
import type { Route } from './+types/users.$userId';

export const meta: Route.MetaFunction = ({ data }) => [
  { title: `${data?.user.name} — My App` },
  { name: 'description', content: `Profile of ${data?.user.name}` },
];

export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'public, max-age=300, s-maxage=3600',
});
```

---

## Import Migration Reference

| Remix (old) | React Router v7 |
| ----------- | --------------- |
| `@remix-run/node` | `react-router` |
| `@remix-run/react` | `react-router` |
| `@remix-run/dev` (Vite plugin) | `@react-router/dev/vite` |
| `@remix-run/fs-routes` | `@react-router/fs-routes` |
| `@remix-run/cloudflare` | `@react-router/cloudflare` |
| `@remix-run/express` | `@react-router/express` |
| `json()` | Return plain objects |
| `defer()` | Return promises directly |
| `json({ data }, { status })` | `data({ data }, { status })` |

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| Client-side data fetching in `useEffect` | Misses SSR, loading states, error boundaries | Use `loader` for data fetching |
| `onClick` for form submissions | Breaks without JS, loses progressive enhancement | Use `<Form>` or `useFetcher.Form` |
| Using `json()` wrapper on returns | Deprecated in v7, unnecessary overhead | Return plain objects from loaders/actions |
| Using `defer()` for streaming | Deprecated in v7, replaced by Single Fetch | Return promises directly in loader object |
| `useLoaderData()` instead of props | Bypasses typegen, loses type safety | Use `loaderData` from `Route.ComponentProps` |
| Global state for server data | Duplicates what loaders already provide | Use `loaderData` prop / `useRouteLoaderData` |
| Catching errors in loaders silently | Hides errors from `ErrorBoundary` | Let errors throw, use `ErrorBoundary` |
| Not validating in actions | Server-side validation skipped | Always validate `formData` on server |
| Using `redirect` in components | Only works in loader/action | Use `useNavigate()` in components |
| Large data in cookies/sessions | 4KB cookie limit, slow requests | Store minimal data, use DB for large payloads |
| Importing from `@remix-run/*` | Old packages, will not receive updates | Use `react-router` or `@react-router/*` |

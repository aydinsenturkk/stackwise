# Next.js App Router

## Server vs Client Components

| Aspect          | Server Component (default)       | Client Component (`"use client"`)  |
| --------------- | -------------------------------- | ---------------------------------- |
| Rendering       | Server only                      | Server + Client hydration          |
| Interactivity   | None                             | Full (events, state, effects)      |
| Data fetching   | Direct `async/await`             | Via hooks (TanStack Query, SWR)    |
| Bundle impact   | Zero client JS                   | Adds to client bundle              |
| Access          | DB, fs, env vars, secrets        | Browser APIs, event handlers       |
| Guard imports   | Use `server-only` package        | Use `client-only` package          |

> **Tip:** Install `server-only` / `client-only` packages and import them at the top of files that must never cross the boundary. Build will fail with a clear error if the boundary is violated.

### When to Use Each

**Server Component (default):**
- Data fetching and display
- Access backend resources directly
- Static or rarely-changing content
- Heavy dependencies (markdown parsers, syntax highlighters)

**Client Component (`"use client"`):**
- Interactive UI (forms, buttons, toggles)
- Browser APIs (localStorage, IntersectionObserver)
- State with useState, useReducer
- Effects with useEffect
- Event listeners (onClick, onChange)

### Composition Pattern — Client Wrapping Server

```tsx
// ClientWrapper.tsx
"use client";
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return <div>{isOpen && children}</div>;
}

// page.tsx (Server Component) — ServerContent still renders on server
import { ClientWrapper } from "./ClientWrapper";
import { ServerContent } from "./ServerContent";

export default function Page() {
  return (
    <ClientWrapper>
      <ServerContent />
    </ClientWrapper>
  );
}
```

---

## File-Based Routing Conventions

| File              | Purpose                              |
| ----------------- | ------------------------------------ |
| `page.tsx`        | Route UI (required for route)        |
| `layout.tsx`      | Shared layout (persists on navigate) |
| `loading.tsx`     | Suspense fallback                    |
| `error.tsx`       | Error boundary (`"use client"`)      |
| `not-found.tsx`   | 404 UI                               |
| `route.ts`        | API route handler                    |
| `template.tsx`    | Layout that re-mounts on navigate    |
| `default.tsx`     | Parallel route fallback              |

### Route Groups and Conventions

- `(groupName)` - Groups routes without affecting URL
- `[param]` - Dynamic segment
- `[...slug]` - Catch-all segment
- `[[...slug]]` - Optional catch-all segment

### Type Helpers for Page and Layout Props

Use the built-in `PageProps` and `LayoutProps` type helpers for correctly typed route parameters:

```tsx
import type { PageProps, LayoutProps } from "next";

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { q } = await searchParams;
  // ...
}
```

---

## Data Fetching in Server Components

```tsx
// app/users/page.tsx
async function getUsers() {
  const res = await fetch("https://api.example.com/users", {
    next: { revalidate: 60 },  // ISR: revalidate every 60s
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default async function UsersPage() {
  const users = await getUsers();
  return <UserList users={users} />;
}
```

### Caching and Revalidation

> **Next.js 15+:** `fetch()` is **not cached by default** (auto no-cache). You must explicitly opt in to caching.

| Strategy           | How                                               | When                         |
| ------------------ | ------------------------------------------------- | ---------------------------- |
| Force cache        | `fetch(url, { cache: 'force-cache' })`            | Data never changes           |
| Time-based ISR     | `fetch(url, { next: { revalidate: 60 } })`       | Data changes periodically    |
| On-demand          | `revalidatePath('/users')`                        | After mutation               |
| Tag-based          | `revalidateTag('users')`                          | Granular cache invalidation  |
| No cache (default) | `fetch(url)` or `fetch(url, { cache: 'no-store' })` | Always fresh data         |

### `use cache` Directive

Mark functions or files as cacheable with `"use cache"` — the granular replacement for page-level caching config. Combine with `cacheLife()` and `cacheTag()` to control TTL and invalidation:

```tsx
"use cache";
export async function getUser(id: string) {
  return db.user.findUnique({ where: { id } });
}
```

---

## Server Functions

> **Note:** "Server Actions" have been renamed to "Server Functions" as of Next.js 15. The `"use server"` directive and behavior are unchanged.

```tsx
// app/posts/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await db.post.create({ data: { title, content } });
  revalidatePath("/posts");
}
```

```tsx
// app/posts/CreatePostForm.tsx
"use client";

import { createPost } from "./actions";
import { useActionState } from "react";

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null);

  return (
    <form action={formAction}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit" disabled={isPending}>Create</button>
    </form>
  );
}
```

### Server Function Rules

| Do                                      | Don't                                |
| --------------------------------------- | ------------------------------------ |
| Validate input in the action            | Trust client-side validation alone   |
| Use `revalidatePath`/`revalidateTag`    | Forget to revalidate after mutation  |
| Return serializable data                | Return class instances or functions  |
| Handle errors with try/catch            | Let errors propagate unhandled       |

---

## Route Handlers (API Routes)

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") ?? "1";
  const users = await db.user.findMany({ skip: (+page - 1) * 20, take: 20 });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

---

## Middleware

> **Next.js 16:** `middleware.ts` is renamed to `proxy.ts` at the project root. The `middleware.ts` filename still works but is deprecated. Prefer `proxy.ts` for new projects.

```typescript
// proxy.ts (root of project — or middleware.ts for Next.js 15 and earlier)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");

  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
```

---

## Metadata API

```tsx
// Static metadata
export const metadata: Metadata = {
  title: "My App",
  description: "App description",
};

// Dynamic metadata — params is a Promise (Next.js 15+), must be awaited
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return {
    title: product.name,
    openGraph: { images: [product.image] },
  };
}
```

> **Streaming metadata:** `generateMetadata` can now stream — the page begins rendering while metadata resolves. No code change needed; Next.js handles this automatically.

---

## Async Request APIs

As of Next.js 15, `cookies()`, `headers()`, `params`, and `searchParams` are all **async** — must be awaited:

```tsx
import { cookies, headers } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  const headersList = await headers();
  const referer = headersList.get("referer");
}
```

---

## Parallel and Intercepting Routes

### Parallel Routes

```
app/dashboard/
├── @analytics/page.tsx
├── @team/page.tsx
├── layout.tsx
└── page.tsx
```

```tsx
// app/dashboard/layout.tsx
export default function Layout(props: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div>
      {props.children}
      <div className="grid grid-cols-2">{props.analytics}{props.team}</div>
    </div>
  );
}
```

### Intercepting Routes

| Convention | Intercepts                     |
| ---------- | ------------------------------ |
| `(.)`      | Same level                     |
| `(..)`     | One level above                |
| `(..)(..)`  | Two levels above               |
| `(...)`    | From root                      |

---

## Image and Link Optimization

```tsx
import Image from "next/image";
import Link from "next/link";

// Optimized image with automatic sizing
<Image
  src="/hero.jpg"
  alt="Hero"
  width={800}
  height={400}
  priority          // Preload for LCP images
  placeholder="blur" // Show blur while loading
/>

// Client-side navigation with prefetch
<Link href="/about" prefetch={true}>About</Link>
```

---

## Loading and Error Boundaries

```tsx
// app/posts/loading.tsx
export default function Loading() {
  return <PostListSkeleton />;
}

// app/posts/error.tsx — must be a client component
"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/posts/not-found.tsx
export default function NotFound() {
  return <h2>Post not found</h2>;
}
```

---

## Anti-Patterns

| Anti-Pattern                        | Solution                                        |
| ----------------------------------- | ----------------------------------------------- |
| `"use client"` on every component   | Default to server, add client only when needed   |
| Fetching data in client components  | Fetch in server components, pass as props         |
| Large client component trees        | Push `"use client"` boundary down to leaves      |
| Using `useEffect` for data loading  | Use server components or server functions         |
| Ignoring `loading.tsx`              | Add loading states for better UX                  |
| Hardcoding revalidation times       | Use on-demand revalidation after mutations        |
| Assuming `fetch()` is cached        | Explicitly opt in with `cache: 'force-cache'`     |
| Synchronous access to `params`      | Always `await params` and `await searchParams`    |
| Synchronous `cookies()` / `headers()` | These are async in Next.js 15+ — always `await` |

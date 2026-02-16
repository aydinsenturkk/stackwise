# Next.js App Router

## Server vs Client Components

| Aspect          | Server Component (default)       | Client Component (`"use client"`)  |
| --------------- | -------------------------------- | ---------------------------------- |
| Rendering       | Server only                      | Server + Client hydration          |
| Interactivity   | None                             | Full (events, state, effects)      |
| Data fetching   | Direct `async/await`             | Via hooks (TanStack Query, SWR)    |
| Bundle impact   | Zero client JS                   | Adds to client bundle              |
| Access          | DB, fs, env vars, secrets        | Browser APIs, event handlers       |

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

### Composition Pattern

Client components can render server components as children:

```tsx
// ClientWrapper.tsx
"use client";
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return <div>{isOpen && children}</div>;
}

// page.tsx (Server Component)
import { ClientWrapper } from "./ClientWrapper";
import { ServerContent } from "./ServerContent";

export default function Page() {
  return (
    <ClientWrapper>
      <ServerContent />  {/* Still renders on server */}
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

### Route Groups and Organization

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── settings/page.tsx
│   └── profile/page.tsx
├── api/
│   └── users/route.ts
└── layout.tsx
```

- `(groupName)` - Groups routes without affecting URL
- `[param]` - Dynamic segment
- `[...slug]` - Catch-all segment
- `[[...slug]]` - Optional catch-all segment

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

| Strategy           | How                                          | When                         |
| ------------------ | -------------------------------------------- | ---------------------------- |
| Static             | `fetch(url)`                                 | Data never changes           |
| Time-based ISR     | `fetch(url, { next: { revalidate: 60 } })`  | Data changes periodically    |
| On-demand          | `revalidatePath('/users')`                   | After mutation               |
| Tag-based          | `revalidateTag('users')`                     | Granular cache invalidation  |
| No cache           | `fetch(url, { cache: 'no-store' })`          | Always fresh data            |

---

## Server Actions

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

### Server Action Rules

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

```typescript
// middleware.ts (root of project)
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

// Dynamic metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id);
  return {
    title: product.name,
    openGraph: { images: [product.image] },
  };
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
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="grid grid-cols-2">
        {analytics}
        {team}
      </div>
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

// app/posts/error.tsx
"use client";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
| Using `useEffect` for data loading  | Use server components or server actions           |
| Ignoring `loading.tsx`              | Add loading states for better UX                  |
| Hardcoding revalidation times       | Use on-demand revalidation after mutations        |

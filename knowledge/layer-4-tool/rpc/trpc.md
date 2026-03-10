# tRPC (v11)

## Setup

```bash
# Server
npm install @trpc/server zod

# Client (vanilla)
npm install @trpc/client

# Client (React Query integration)
npm install @trpc/client @trpc/react-query @tanstack/react-query
```

| Package              | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `@trpc/server`       | Router, procedures, middleware, adapters      |
| `@trpc/client`       | Vanilla client, links, streaming             |
| `@trpc/react-query`  | React hooks wrapping TanStack Query          |
| `@tanstack/react-query` | Required peer dependency for React integration |

---

## Initialization and Context

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const createCallerFactory = t.createCallerFactory;
```

```typescript
// server/context.ts
export interface Context {
  user: { id: string; email: string; role: string } | null;
  db: Database;
}

// Express
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
export async function createContext({ req }: CreateExpressContextOptions): Promise<Context> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  return { user: token ? await verifyToken(token) : null, db: prisma };
}

// Next.js / Fetch-based
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await getSession();
  return { user: session?.user ?? null, db: prisma };
}
```

---

## Router Definition

```typescript
// server/routers/_app.ts
import { router } from "../trpc";
import { postRouter } from "./post";
import { userRouter } from "./user";

export const appRouter = router({
  post: postRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
```

### Router Shorthand (v11)

Sub-routers can be plain objects without the `router()` wrapper. Use plain objects for inline sub-routers; use `router()` for routers imported from separate files.

```typescript
export const appRouter = router({
  post: {
    list: publicProcedure.query(/* ... */),
    byId: publicProcedure.input(z.string()).query(/* ... */),
  },
});
```

---

## Procedures

```typescript
// server/routers/post.ts
import { z } from "zod";
import { router, publicProcedure, authedProcedure } from "../trpc";

// Define reusable input schemas outside procedures
const paginationInput = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().nullish(),
});

export const postRouter = router({
  list: publicProcedure
    .input(paginationInput.extend({
      filter: z.enum(["all", "published", "draft"]).default("all"),
    }))
    .query(async ({ input, ctx }) => {
      const posts = await ctx.db.post.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: input.filter === "all" ? undefined : { published: input.filter === "published" },
        orderBy: { createdAt: "desc" },
      });
      let nextCursor: string | undefined;
      if (posts.length > input.limit) {
        nextCursor = posts.pop()?.id;
      }
      return { items: posts, nextCursor };
    }),

  byId: publicProcedure
    .input(z.string().uuid())
    .query(async ({ input, ctx }) => {
      const post = await ctx.db.post.findUnique({ where: { id: input } });
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      return post;
    }),

  create: authedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1),
      published: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.post.create({ data: { ...input, authorId: ctx.user.id } });
    }),

  delete: authedProcedure
    .input(z.string().uuid())
    .mutation(async ({ input, ctx }) => {
      const post = await ctx.db.post.findUnique({ where: { id: input } });
      if (!post || post.authorId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.db.post.delete({ where: { id: input } });
      return { success: true };
    }),
});
```

---

## Middleware

```typescript
import { middleware, publicProcedure } from "./trpc";
import { TRPCError } from "@trpc/server";

const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { user: ctx.user } }); // user is non-nullable downstream
});

const hasRole = (...roles: string[]) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    if (!roles.includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
    return next({ ctx: { user: ctx.user } });
  });

const logger = middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  console.log(`${type} ${path} - ${Date.now() - start}ms`);
  return result;
});

// Reusable procedure builders
export const authedProcedure = publicProcedure.use(isAuthed);
export const adminProcedure = publicProcedure.use(hasRole("ADMIN"));
```

---

## Server Adapters

```typescript
// Express
import { createExpressMiddleware } from "@trpc/server/adapters/express";
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// Next.js App Router - app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
const handler = (req: Request) =>
  fetchRequestHandler({ endpoint: "/api/trpc", req, router: appRouter, createContext });
export { handler as GET, handler as POST };

// Node.js HTTP/2 (v11)
import { createHTTP2Handler } from "@trpc/server/adapters/node-http";
const h2handler = createHTTP2Handler({ router: appRouter, createContext });
```

| Adapter | Import | Use Case |
| --- | --- | --- |
| Express | `@trpc/server/adapters/express` | Express.js servers |
| Fastify | `@trpc/server/adapters/fastify` | Fastify servers |
| Fetch | `@trpc/server/adapters/fetch` | Next.js, Cloudflare Workers, Deno |
| Node HTTP | `@trpc/server/adapters/node-http` | Standalone Node.js, HTTP/2 |
| AWS Lambda | `@trpc/server/adapters/aws-lambda` | Serverless AWS |

---

## Client Links (v11)

In v11 `createTRPCProxyClient` is renamed to `createTRPCClient`.

```typescript
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api/trpc",
      headers() {
        return { authorization: `Bearer ${getToken()}` };
      },
    }),
  ],
});

const posts = await trpc.post.list.query({ limit: 10 });
await trpc.post.create.mutate({ title: "Hello", content: "World" });
```
### Link Types

| Link | Purpose |
| --- | --- |
| `httpBatchLink` | Batches multiple requests into a single HTTP call |
| `httpBatchStreamLink` | Batches + streams responses as they resolve (v11) |
| `httpLink` | One HTTP request per procedure call |
| `httpSubscriptionLink` | SSE-based subscriptions over HTTP (v11) |
| `splitLink` | Routes operations to different links by condition |
| `loggerLink` | Logs requests/responses for debugging |

### httpBatchStreamLink (v11)

Batches requests like `httpBatchLink` but streams each response individually as it resolves. Faster perceived performance when a batch mixes fast and slow procedures.

```typescript
const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchStreamLink({ url: "/api/trpc" })],
});
```

### splitLink

```typescript
import { httpBatchLink, httpLink, httpSubscriptionLink, splitLink } from "@trpc/client";

const trpc = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === "subscription",
      true: httpSubscriptionLink({ url: "/api/trpc" }),
      false: httpBatchLink({ url: "/api/trpc", maxURLLength: 2083 }),
    }),
  ],
});
```

---

## React Query Integration

```typescript
// utils/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";
export const trpc = createTRPCReact<AppRouter>();
```

```typescript
// providers/trpc-provider.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchStreamLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "@/utils/trpc";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchStreamLink({ url: "/api/trpc" })],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Component Usage

```typescript
function PostList() {
  const { data, isLoading, error } = trpc.post.list.useQuery({ limit: 20 });

  const { data: pages, fetchNextPage, hasNextPage } = trpc.post.list.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const utils = trpc.useUtils();
  const createPost = trpc.post.create.useMutation({
    onSuccess: () => utils.post.list.invalidate(),
    onError: (error) => {
      if (error.data?.zodError) setFormErrors(error.data.zodError.fieldErrors);
    },
  });

  // Optimistic update
  const toggleLike = trpc.post.toggleLike.useMutation({
    onMutate(variables) {
      const prev = utils.post.byId.getData(variables.postId);
      utils.post.byId.setData(variables.postId, (old) =>
        old ? { ...old, isLiked: !old.isLiked } : old,
      );
      return { prev };
    },
    onError(_err, variables, context) {
      utils.post.byId.setData(variables.postId, context?.prev);
    },
    onSettled: (_d, _e, variables) => utils.post.byId.invalidate(variables.postId),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error.message} />;

  return (
    <>
      {data?.items.map((post) => <PostCard key={post.id} post={post} />)}
      <button onClick={() => createPost.mutate({ title: "New", content: "..." })}
        disabled={createPost.isPending}>Create</button>
    </>
  );
}
```

---

## SSE-Based Subscriptions (v11)

tRPC v11 uses Server-Sent Events instead of WebSockets. Subscriptions are async generators that `yield` values.

### Server: Generator-Based Subscriptions

```typescript
import { tracked } from "@trpc/server";
import { z } from "zod";

export const notificationRouter = router({
  // Basic subscription
  onPostCreated: publicProcedure.subscription(async function* () {
    for await (const post of createAsyncIterator(eventEmitter, "post.created")) {
      yield post;
    }
  }),

  // With input
  onChatMessage: publicProcedure
    .input(z.object({ channelId: z.string() }))
    .subscription(async function* ({ input }) {
      for await (const msg of createAsyncIterator(eventEmitter, `chat.${input.channelId}`)) {
        yield msg;
      }
    }),

  // Tracked subscriptions for resumability (auto-replays missed events on reconnect)
  onNotification: publicProcedure
    .input(z.object({ lastEventId: z.string().nullish() }))
    .subscription(async function* ({ input, ctx }) {
      if (input.lastEventId) {
        const missed = await ctx.db.notification.findMany({
          where: { userId: ctx.user.id, id: { gt: input.lastEventId } },
          orderBy: { id: "asc" },
        });
        for (const event of missed) yield tracked(event.id, event);
      }
      for await (const event of createAsyncIterator(eventEmitter, `notify.${ctx.user.id}`)) {
        yield tracked(event.id, event);
      }
    }),
});
```

### Client: Subscribe

```typescript
// Vanilla client
const sub = trpc.notification.onPostCreated.subscribe(undefined, {
  onData(post) { console.log("New post:", post.title); },
  onError(err) { console.error(err); },
});
sub.unsubscribe();

// React hook
function Notifications() {
  trpc.notification.onPostCreated.useSubscription(undefined, {
    onData(post) { showNotification(`New post: ${post.title}`); },
  });
  return null;
}
```

---

## Non-JSON Content Types (v11)

tRPC v11 supports `FormData`, `File`, `Blob`, and `Uint8Array` alongside JSON.

```typescript
export const uploadRouter = router({
  uploadFile: authedProcedure
    .input(z.object({ file: z.instanceof(File), description: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const buffer = await input.file.arrayBuffer();
      const path = await ctx.storage.save(input.file.name, Buffer.from(buffer));
      return { path, size: input.file.size };
    }),

  downloadFile: authedProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const buffer = await ctx.storage.read(input.fileId);
      return new Blob([buffer], { type: "application/octet-stream" });
    }),
});

// Client
await trpc.upload.uploadFile.mutate({
  file: new File([content], "doc.pdf", { type: "application/pdf" }),
});
const blob = await trpc.upload.downloadFile.query({ fileId: "abc-123" });
```

---

## Server-Side Caller

Use `createCallerFactory` to call procedures from server code, server components, or tests.

```typescript
import { appRouter } from "./routers/_app";
import { createCallerFactory } from "./trpc";

const createCaller = createCallerFactory(appRouter);

// Next.js Server Component
export default async function PostPage({ params }: { params: { id: string } }) {
  const caller = createCaller({ user: await getSessionUser(), db: prisma });
  const post = await caller.post.byId(params.id);
  return <PostView post={post} />;
}

// Tests
const caller = createCaller({
  user: { id: "user-1", email: "test@test.com", role: "USER" },
  db: testDb,
});
const post = await caller.post.create({ title: "Test", content: "Content" });
expect(post.title).toBe("Test");
```

---

## Error Handling

### Error Codes

| Code | HTTP | Use Case |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | Invalid input not caught by Zod |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate or conflicting state |
| `PRECONDITION_FAILED` | 412 | Stale data / optimistic lock failure |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server failure |

### Server and Client

```typescript
// Server: throw typed errors
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Post not found",
  cause: originalError,
});

// Client: handle errors
const createPost = trpc.post.create.useMutation({
  onError(error) {
    if (error.data?.zodError) {
      setFormErrors(error.data.zodError.fieldErrors);
      return;
    }
    switch (error.data?.code) {
      case "UNAUTHORIZED": redirectToLogin(); break;
      case "FORBIDDEN": showToast("No permission"); break;
      default: showToast("Something went wrong");
    }
  },
});
```

---

## v10 to v11 Migration Reference

| v10 | v11 | Notes |
| --- | --- | --- |
| `createTRPCProxyClient` | `createTRPCClient` | Renamed, same API |
| `httpBatchLink` only | `httpBatchStreamLink` also available | Streaming variant of batch link |
| `observable()` subscriptions | `async function*` generators | Yields values via JS generators |
| WebSocket subscriptions | SSE via `httpSubscriptionLink` | HTTP-native, no WS server needed |
| JSON only | `FormData`, `File`, `Blob`, `Uint8Array` | Non-JSON content types |
| Sub-routers need `router()` | Plain objects as sub-routers | Router shorthand syntax |
| `.interop()` for v9 compat | Removed | v9 migration layer is gone |
| `createHTTPHandler` only | `createHTTP2Handler` also available | HTTP/2 support |

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Using `createTRPCProxyClient` | Removed in v11 | Use `createTRPCClient` |
| Procedures without input validation | No runtime type safety | Always use Zod schemas for input |
| Business logic directly in procedures | Hard to test, poor separation | Call service/repository functions |
| Not exporting `AppRouter` type | Client loses type safety | `export type AppRouter = typeof appRouter` |
| Creating tRPC client in component render | Recreates client every render | Use `useState` or create outside component |
| Using `httpLink` when multiple queries fire | Separate HTTP request per call | Use `httpBatchLink` or `httpBatchStreamLink` |
| Not using `useUtils` for cache invalidation | Stale data after mutations | `utils.router.procedure.invalidate()` |
| Catching errors without checking `zodError` | Validation errors treated as generic | Check `error.data?.zodError` for field errors |
| Skipping middleware for auth checks | Auth logic repeated everywhere | Create `authedProcedure` with middleware |
| WebSocket transport for subscriptions | Requires separate WS server | Use SSE via `httpSubscriptionLink` |
| Using `observable()` for subscriptions | v10 pattern, not idiomatic v11 | Use `async function*` generators |
| Not using `tracked()` for resumable streams | Events lost on reconnect | Wrap yields with `tracked(id, data)` |

# tRPC

## Setup

```bash
# Server
npm install @trpc/server zod

# Client (React)
npm install @trpc/client @trpc/react-query @tanstack/react-query
```

---

## Router Definition

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
```

---

## Context

```typescript
// server/context.ts
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export interface Context {
  user: { id: string; email: string; role: string } | null;
  db: Database;
}

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<Context> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? await verifyToken(token) : null;

  return {
    user,
    db: prisma,
  };
}

// Next.js context
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await getSession();
  return {
    user: session?.user ?? null,
    db: prisma,
  };
}
```

---

## Procedures (Query / Mutation / Subscription)

```typescript
// server/routers/post.ts
import { z } from "zod";
import { router, publicProcedure, authedProcedure } from "../trpc";

export const postRouter = router({
  // Query
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        filter: z.enum(["all", "published", "draft"]).default("all"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const posts = await ctx.db.post.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where:
          input.filter === "all"
            ? undefined
            : { published: input.filter === "published" },
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (posts.length > input.limit) {
        const next = posts.pop();
        nextCursor = next?.id;
      }

      return { items: posts, nextCursor };
    }),

  byId: publicProcedure
    .input(z.string().uuid())
    .query(async ({ input, ctx }) => {
      const post = await ctx.db.post.findUnique({ where: { id: input } });
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      return post;
    }),

  // Mutation
  create: authedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        published: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.post.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
      });
    }),

  update: authedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional(),
        published: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const post = await ctx.db.post.findUnique({ where: { id: input.id } });
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (post.authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      return ctx.db.post.update({ where: { id }, data });
    }),

  delete: authedProcedure
    .input(z.string().uuid())
    .mutation(async ({ input, ctx }) => {
      const post = await ctx.db.post.findUnique({ where: { id: input } });
      if (!post || post.authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
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

// Authentication middleware
const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      user: ctx.user, // user is now non-nullable
    },
  });
});

// Role-based middleware
const hasRole = (...roles: string[]) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx: { user: ctx.user } });
  });

// Logging middleware
const logger = middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;
  console.log(`${type} ${path} - ${duration}ms`);
  return result;
});

// Rate limiting middleware
const rateLimit = middleware(async ({ ctx, next, path }) => {
  const key = `${ctx.user?.id ?? "anon"}:${path}`;
  const allowed = await checkRateLimit(key, { maxRequests: 100, window: 60 });
  if (!allowed) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  }
  return next();
});

// Reusable procedure builders
export const authedProcedure = publicProcedure.use(isAuthed);
export const adminProcedure = publicProcedure.use(hasRole("ADMIN"));
```

---

## Input Validation with Zod

```typescript
import { z } from "zod";

// Complex input schemas
const createPostInput = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).max(10).default([]),
  metadata: z
    .object({
      seoTitle: z.string().max(60).optional(),
      seoDescription: z.string().max(160).optional(),
    })
    .optional(),
});

// Reusable pagination input
const paginationInput = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().nullish(),
});

// Usage
export const postRouter = router({
  create: authedProcedure
    .input(createPostInput)
    .mutation(async ({ input, ctx }) => {
      // input is fully typed from Zod schema
      return ctx.db.post.create({ data: { ...input, authorId: ctx.user.id } });
    }),

  list: publicProcedure
    .input(paginationInput)
    .query(async ({ input, ctx }) => {
      // input.limit and input.cursor are typed
      return ctx.db.post.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });
    }),
});
```

---

## App Router and Server Adapters

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

```typescript
// Express adapter
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

const app = express();
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);
```

```typescript
// Next.js App Router adapter
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

---

## React Query Integration (Client)

```typescript
// utils/trpc.ts
"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

export const trpc = createTRPCReact<AppRouter>();
```

```typescript
// providers/trpc-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "@/utils/trpc";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          headers() {
            return {
              authorization: `Bearer ${getToken()}`,
            };
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

```typescript
// Component usage
function PostList() {
  // Query
  const { data, isLoading, error } = trpc.post.list.useQuery({
    limit: 20,
  });

  // Infinite query for pagination
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
  } = trpc.post.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // Mutation
  const utils = trpc.useUtils();
  const createPost = trpc.post.create.useMutation({
    onSuccess() {
      // Invalidate and refetch the list
      utils.post.list.invalidate();
    },
    onError(error) {
      if (error.data?.zodError) {
        // Handle validation errors
        console.error(error.data.zodError);
      }
    },
  });

  // Optimistic update
  const toggleLike = trpc.post.toggleLike.useMutation({
    onMutate(variables) {
      const previousData = utils.post.byId.getData(variables.postId);
      utils.post.byId.setData(variables.postId, (old) =>
        old ? { ...old, isLiked: !old.isLiked } : old,
      );
      return { previousData };
    },
    onError(_err, variables, context) {
      utils.post.byId.setData(variables.postId, context?.previousData);
    },
  });

  const handleCreate = () => {
    createPost.mutate({
      title: "New Post",
      content: "Post content here",
    });
  };

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error.message} />;

  return (
    <>
      {data?.items.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <button onClick={handleCreate} disabled={createPost.isPending}>
        Create Post
      </button>
    </>
  );
}
```

---

## Subscriptions

```typescript
// Server
import { observable } from "@trpc/server/observable";

export const postRouter = router({
  onPostCreated: publicProcedure.subscription(() => {
    return observable<Post>((emit) => {
      const onCreated = (post: Post) => {
        emit.next(post);
      };
      eventEmitter.on("post.created", onCreated);

      return () => {
        eventEmitter.off("post.created", onCreated);
      };
    });
  }),
});

// Client
function NewPostNotification() {
  trpc.post.onPostCreated.useSubscription(undefined, {
    onData(post) {
      showNotification(`New post: ${post.title}`);
    },
    onError(err) {
      console.error("Subscription error:", err);
    },
  });

  return null;
}
```

---

## Error Handling

```typescript
import { TRPCError } from "@trpc/server";

// Built-in error codes:
// BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND,
// METHOD_NOT_SUPPORTED, TIMEOUT, CONFLICT, PRECONDITION_FAILED,
// PAYLOAD_TOO_LARGE, UNPROCESSABLE_CONTENT, TOO_MANY_REQUESTS,
// CLIENT_CLOSED_REQUEST, INTERNAL_SERVER_ERROR

// Server: throw typed errors
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Post not found",
  cause: originalError, // optional, for debugging
});

// Server: custom error formatter
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

// Client: handle errors
const createPost = trpc.post.create.useMutation({
  onError(error) {
    // Zod validation errors
    if (error.data?.zodError) {
      const fieldErrors = error.data.zodError.fieldErrors;
      setFormErrors(fieldErrors);
      return;
    }

    // tRPC error codes
    switch (error.data?.code) {
      case "UNAUTHORIZED":
        redirectToLogin();
        break;
      case "FORBIDDEN":
        showToast("You don't have permission");
        break;
      default:
        showToast("Something went wrong");
    }
  },
});
```

---

## Batching

```typescript
import { httpBatchLink, httpLink, splitLink } from "@trpc/client";

const trpcClient = trpc.createClient({
  links: [
    // Batch by default, but split large requests
    splitLink({
      condition: (op) => op.context.skipBatch === true,
      true: httpLink({ url: "/api/trpc" }),
      false: httpBatchLink({
        url: "/api/trpc",
        maxURLLength: 2083, // Split into separate requests if URL is too long
      }),
    }),
  ],
});

// Skip batching for a specific call
const data = trpc.post.byId.useQuery("1", {
  trpc: { context: { skipBatch: true } },
});
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Defining procedures without input validation | No runtime type safety, invalid data reaches business logic | Always use Zod schemas for input validation |
| Putting business logic directly in procedures | Hard to test, violates separation of concerns | Call service or repository functions from procedures |
| Not exporting `AppRouter` type | Client loses end-to-end type safety | Export `type AppRouter = typeof appRouter` from root router |
| Creating tRPC client inside component render | Recreates client on every render, breaks React Query cache | Use `useState` or create outside component |
| Using `httpLink` instead of `httpBatchLink` | Each `useQuery` fires a separate HTTP request | Use `httpBatchLink` to batch multiple calls into one request |
| Not using `useUtils` for cache invalidation | Stale data after mutations | Use `utils.router.procedure.invalidate()` after mutations |
| Catching errors without checking `zodError` | Validation errors treated as generic errors | Check `error.data?.zodError` for structured field-level errors |
| Skipping middleware for auth checks | Auth logic repeated in every procedure | Create `authedProcedure` with auth middleware and reuse it |

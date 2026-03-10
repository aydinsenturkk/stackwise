# TanStack Query

## Core Concepts

| Concept      | Purpose                              | HTTP Methods          |
| ------------ | ------------------------------------ | --------------------- |
| **Query**    | Read operations, cached server state | GET                   |
| **Mutation** | Write operations, side effects       | POST, PUT, DELETE     |

---

## useQuery

```typescript
import { useQuery } from "@tanstack/react-query";

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getById(userId),
    staleTime: 5 * 60 * 1000,      // Data stays fresh for 5 min
    gcTime: 30 * 60 * 1000,         // Cache kept for 30 min after unmount
    retry: 3,                        // Retry failed requests
    enabled: !!userId,               // Only fetch when userId exists
  });

  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorMessage error={error} />;
  return <UserCard user={data} />;
}
```

### Query Options

| Option         | Default    | Purpose                                  |
| -------------- | ---------- | ---------------------------------------- |
| `staleTime`    | `0`        | How long data is considered fresh        |
| `gcTime`       | `5 min`    | How long inactive cache is kept          |
| `retry`        | `3`        | Number of retry attempts                 |
| `enabled`      | `true`     | Conditional fetching                     |
| `refetchOnWindowFocus` | `true` | Refetch when tab gets focus         |
| `placeholderData` | -       | Show while real data loads               |

---

## Query Key Factory Pattern

```typescript
// queries/keys.ts
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params?: UserFilterParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (params?: PostFilterParams) => [...postKeys.lists(), params] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  comments: (postId: string) => [...postKeys.detail(postId), "comments"] as const,
};
```

### Key Hierarchy

```
["users"]                          ← userKeys.all (invalidates everything)
["users", "list"]                  ← userKeys.lists() (all lists)
["users", "list", { page: 1 }]    ← userKeys.list({ page: 1 })
["users", "detail"]                ← userKeys.details() (all details)
["users", "detail", "abc-123"]     ← userKeys.detail("abc-123")
```

### Rules

| Rule                                        | Purpose                         |
| ------------------------------------------- | ------------------------------- |
| Naming: `{entity}Keys` in camelCase         | Consistent naming               |
| File: `keys.ts` for 4+ queries              | Organization                    |
| Inline for smaller modules                  | Simplicity                      |
| Keys are arrays, always use `as const`      | Type safety                     |
| Include all params that affect the response | Correct caching                 |

---

## queryOptions() Helper

Define `queryKey` + `queryFn` once with `queryOptions()` and reuse across `useQuery`, `useSuspenseQuery`, `prefetchQuery`, `ensureQueryData`, and `invalidateQueries` — with full type inference.

```typescript
import { queryOptions, useQuery } from "@tanstack/react-query";

export function userDetailOptions(userId: string) {
  return queryOptions({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getById(userId),
    staleTime: 5 * 60 * 1000,
  });
}

// Reuse in components, loaders, prefetching
const { data } = useQuery(userDetailOptions(userId));
await queryClient.prefetchQuery(userDetailOptions(userId));
```

---

## useMutation

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

function CreateUserForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateUserInput) => userService.create(data),
    onSuccess: (newUser) => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Optionally set the new detail in cache
      queryClient.setQueryData(userKeys.detail(newUser.id), newUser);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate(formData);
    }}>
      <button disabled={mutation.isPending}>
        {mutation.isPending ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

### useMutationState

Observe mutation state across components. Useful for global loading indicators or disabling UI while mutations are in flight.

```typescript
import { useMutationState } from "@tanstack/react-query";
// Track pending mutations by mutationKey
const pendingVars = useMutationState({
  filters: { mutationKey: ["createUser"], status: "pending" },
  select: (mutation) => mutation.state.variables as CreateUserInput,
});
```

> Pair `useMutationState` with `mutationKey` on `useMutation` calls so filters can target specific mutation types.

---

## Cache Invalidation Strategies

```typescript
const queryClient = useQueryClient();

// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: userKeys.all });

// Invalidate only list queries
queryClient.invalidateQueries({ queryKey: userKeys.lists() });

// Invalidate a specific detail
queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });

// Remove from cache entirely
queryClient.removeQueries({ queryKey: userKeys.detail(userId) });

// Directly update cached data
queryClient.setQueryData(userKeys.detail(userId), updatedUser);
```

### What to Invalidate After Mutation

| Action   | Invalidate                                             |
| -------- | ------------------------------------------------------ |
| Create   | List queries for the entity                            |
| Update   | List queries + the specific detail                     |
| Delete   | List queries + remove the specific detail from cache   |
| Bulk     | All queries for the entity (`entityKeys.all`)          |

### Cross-Feature Invalidation

Think about all affected data when a mutation succeeds:

```typescript
// Completing an order affects multiple data sets
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: orderKeys.all });
  queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
  queryClient.invalidateQueries({ queryKey: statsKeys.all });
},
```

---

## Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: (data: UpdateUserInput) => userService.update(userId, data),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) });

    // Snapshot previous value
    const previousUser = queryClient.getQueryData(userKeys.detail(userId));

    // Optimistically update
    queryClient.setQueryData(userKeys.detail(userId), (old) => ({
      ...old,
      ...newData,
    }));

    return { previousUser };
  },
  onError: (_err, _newData, context) => {
    // Rollback on error
    queryClient.setQueryData(userKeys.detail(userId), context?.previousUser);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
  },
});
```

---

## Prefetching

```typescript
// Prefetch on hover
function UserListItem({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(userId),
      queryFn: () => userService.getById(userId),
      staleTime: 5 * 60 * 1000,
    });
  };

  return (
    <Link to={`/users/${userId}`} onMouseEnter={prefetch}>
      View User
    </Link>
  );
}
```

---

## Infinite Queries

```typescript
function PostFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: postKeys.list({ type: "feed" }),
    queryFn: ({ pageParam }) => postService.getFeed({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: 5, // Keep at most 5 pages in cache to limit memory
  });

  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div>
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

### maxPages

Set `maxPages` to cap pages held in cache, preventing unbounded memory growth. When exceeded, the oldest page is dropped. Also provide `getPreviousPageParam` so dropped pages can be refetched if the user scrolls back.

---

## Suspense Hooks

First-class Suspense integration. `data` is guaranteed `T` (never `undefined`), eliminating loading checks. Also available as `useSuspenseInfiniteQuery`.

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";

function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useSuspenseQuery(userDetailOptions(userId));
  return <UserCard user={user} />;  // user is User, not User | undefined
}

// Parent handles loading + error declaratively
function UserPage({ userId }: { userId: string }) {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<Skeleton />}>
        <UserProfile userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

| Rule                                       | Explanation                                              |
| ------------------------------------------ | -------------------------------------------------------- |
| No `enabled` option                        | Suspense hooks always fetch — conditional logic goes in the parent |
| No `placeholderData`                       | Suspense replaces the need for placeholder states        |
| Wrap in `<Suspense>` + `<ErrorBoundary>`   | Loading and error states are handled declaratively       |

---

## Error Handling with throwOnError

The `throwOnError` option (renamed from `useErrorBoundary` in v5) controls whether errors propagate to the nearest React Error Boundary. Works on both queries and mutations.

```typescript
// All errors propagate to ErrorBoundary
useQuery({ ...options, throwOnError: true });

// Selectively propagate — only server errors
useQuery({ ...options, throwOnError: (error) => error.status >= 500 });
```

| Value      | Behavior                                                |
| ---------- | ------------------------------------------------------- |
| `false`    | Default. Errors available via `isError` / `error`       |
| `true`     | All errors throw to nearest ErrorBoundary               |
| `function` | Return `true` to throw, `false` to handle inline        |

> Suspense hooks always throw to ErrorBoundary — `throwOnError` is implicitly `true`.

---

## State Management Decision Table

| State Type                  | Solution                |
| --------------------------- | ----------------------- |
| Server data (API responses) | TanStack Query          |
| UI state (single component) | `useState`              |
| UI state (shared across)    | TanStack Store / Zustand|
| Form state                  | React Hook Form         |
| URL state                   | Search params / Router  |

---

## Anti-Patterns

| Anti-Pattern                           | Solution                                      |
| -------------------------------------- | --------------------------------------------- |
| Duplicate data in useState and query   | Single source of truth (use query data)        |
| String query keys everywhere           | Use query key factory pattern                  |
| Missing invalidation after mutation    | Always invalidate affected queries             |
| `select: (data) => data`              | Omit select if not transforming                |
| Fetching in useEffect                  | Use useQuery instead                           |
| Global state for server data           | Server data belongs in query cache             |

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

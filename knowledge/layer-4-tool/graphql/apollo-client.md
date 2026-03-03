# Apollo Client

## Setup

```bash
npm install @apollo/client graphql
```

---

## Client Configuration

```typescript
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
  ApolloLink,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    for (const { message, locations, path, extensions } of graphQLErrors) {
      console.error(
        `[GraphQL error]: Message: ${message}, Path: ${path}, Code: ${extensions?.code}`,
      );

      if (extensions?.code === "UNAUTHENTICATED") {
        // Redirect to login or refresh token
      }
    }
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Auth link
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem("token");
  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : "",
    },
  });
  return forward(operation);
});

// HTTP link
const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
});

// Client
const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});

// Provider
function App() {
  return (
    <ApolloProvider client={client}>
      <Router />
    </ApolloProvider>
  );
}
```

---

## Cache Configuration (InMemoryCache)

```typescript
import { InMemoryCache, Reference } from "@apollo/client";

const cache = new InMemoryCache({
  typePolicies: {
    // Custom key fields
    User: {
      keyFields: ["id"],
      fields: {
        // Merge non-normalized nested objects
        profile: {
          merge: true,
        },
        // Custom read function for computed fields
        fullName: {
          read(_, { readField }) {
            const first = readField<string>("firstName");
            const last = readField<string>("lastName");
            return `${first} ${last}`;
          },
        },
      },
    },

    // Pagination: offset-based
    Query: {
      fields: {
        posts: {
          keyArgs: ["filter", "sortBy"],
          merge(existing = { edges: [] }, incoming, { args }) {
            const offset = args?.offset ?? 0;
            const merged = existing.edges.slice(0);
            for (let i = 0; i < incoming.edges.length; i++) {
              merged[offset + i] = incoming.edges[i];
            }
            return {
              ...incoming,
              edges: merged,
            };
          },
        },
      },
    },
  },
});
```

---

## useQuery

```typescript
import { gql, useQuery } from "@apollo/client";

const GET_USERS = gql`
  query GetUsers($role: Role, $limit: Int) {
    users(role: $role, limit: $limit) {
      id
      name
      email
      role
    }
  }
`;

function UserList({ role }: { role?: string }) {
  const { data, loading, error, refetch, fetchMore, networkStatus } = useQuery(
    GET_USERS,
    {
      variables: { role, limit: 20 },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
      pollInterval: 30000, // Poll every 30 seconds
      skip: false, // Conditionally skip query
      onCompleted: (data) => {
        console.log("Query completed", data);
      },
      onError: (error) => {
        console.error("Query error", error);
      },
    },
  );

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ul>
      {data?.users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

---

## useMutation

```typescript
import { gql, useMutation } from "@apollo/client";

const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
    }
  }
`;

function CreateUserForm() {
  const [createUser, { data, loading, error, reset }] = useMutation(
    CREATE_USER,
    {
      // Update cache after mutation
      update(cache, { data: { createUser } }) {
        cache.modify({
          fields: {
            users(existingUsers = []) {
              const newUserRef = cache.writeFragment({
                data: createUser,
                fragment: gql`
                  fragment NewUser on User {
                    id
                    name
                    email
                  }
                `,
              });
              return [...existingUsers, newUserRef];
            },
          },
        });
      },
      // Or refetch queries
      refetchQueries: [{ query: GET_USERS }],
      // Called on success
      onCompleted(data) {
        console.log("Created user:", data.createUser.id);
      },
      onError(error) {
        console.error("Mutation failed:", error.message);
      },
    },
  );

  const handleSubmit = async (input: { email: string; name: string }) => {
    await createUser({ variables: { input } });
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

---

## Optimistic Updates

```typescript
const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

const TOGGLE_LIKE = gql`
  mutation ToggleLike($postId: ID!) {
    toggleLike(postId: $postId) {
      id
      likeCount
      isLikedByMe
    }
  }
`;

function PostActions({ post }: { post: Post }) {
  const [toggleLike] = useMutation(TOGGLE_LIKE, {
    optimisticResponse: {
      toggleLike: {
        __typename: "Post",
        id: post.id,
        likeCount: post.isLikedByMe ? post.likeCount - 1 : post.likeCount + 1,
        isLikedByMe: !post.isLikedByMe,
      },
    },
  });

  const [deletePost] = useMutation(DELETE_POST, {
    optimisticResponse: { deletePost: true },
    update(cache) {
      cache.evict({ id: cache.identify(post) });
      cache.gc();
    },
  });

  return (
    <>
      <button onClick={() => toggleLike({ variables: { postId: post.id } })}>
        {post.isLikedByMe ? "Unlike" : "Like"} ({post.likeCount})
      </button>
      <button onClick={() => deletePost({ variables: { id: post.id } })}>
        Delete
      </button>
    </>
  );
}
```

---

## Pagination

```typescript
import { gql, useQuery } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";

// Offset-based pagination
const GET_POSTS = gql`
  query GetPosts($offset: Int, $limit: Int) {
    posts(offset: $offset, limit: $limit) {
      edges {
        id
        title
      }
      totalCount
      hasMore
    }
  }
`;

function PostList() {
  const { data, loading, fetchMore } = useQuery(GET_POSTS, {
    variables: { offset: 0, limit: 10 },
  });

  const loadMore = () => {
    fetchMore({
      variables: {
        offset: data.posts.edges.length,
      },
    });
  };

  return (
    <>
      {data?.posts.edges.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {data?.posts.hasMore && (
        <button onClick={loadMore} disabled={loading}>
          Load More
        </button>
      )}
    </>
  );
}

// Relay-style cursor pagination (cache config)
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        comments: relayStylePagination(),
      },
    },
  },
});
```

---

## useSubscription

```typescript
import { gql, useSubscription } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { split } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:4000/graphql",
    connectionParams: {
      authorization: `Bearer ${getToken()}`,
    },
  }),
);

// Split between HTTP and WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink,
);

// Subscription hook
const POST_CREATED = gql`
  subscription OnPostCreated {
    postCreated {
      id
      title
      author {
        name
      }
    }
  }
`;

function NewPostNotification() {
  const { data, loading, error } = useSubscription(POST_CREATED, {
    onData({ data }) {
      showNotification(`New post: ${data.data?.postCreated.title}`);
    },
    onError(error) {
      console.error("Subscription error:", error);
    },
  });

  if (data) {
    return <div>New post: {data.postCreated.title}</div>;
  }
  return null;
}
```

---

## Cache Policies

```typescript
const { data } = useQuery(GET_USERS, {
  // "cache-first" — Default. Reads from cache; fetches only if no cache.
  // "cache-and-network" — Returns cache immediately, then fetches to update.
  // "network-only" — Always fetches, still writes to cache.
  // "no-cache" — Always fetches, never reads or writes cache.
  // "cache-only" — Only reads from cache, never fetches.
  fetchPolicy: "cache-and-network",

  // "none" — Return data only if no errors.
  // "ignore" — Return data even if errors exist (errors not reported).
  // "all" — Return both data and errors.
  errorPolicy: "all",
});
```

---

## Local State Management

```typescript
import { makeVar, gql, useReactiveVar } from "@apollo/client";

// Reactive variables (outside of cache)
export const isLoggedInVar = makeVar<boolean>(false);
export const cartItemsVar = makeVar<string[]>([]);

// Read reactive variable in components
function NavBar() {
  const isLoggedIn = useReactiveVar(isLoggedInVar);
  return isLoggedIn ? <UserMenu /> : <LoginButton />;
}

// Use in cache type policies
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        isLoggedIn: {
          read() {
            return isLoggedInVar();
          },
        },
        cartItems: {
          read() {
            return cartItemsVar();
          },
        },
      },
    },
  },
});

// Query local-only fields with @client directive
const GET_CART = gql`
  query GetCart {
    cartItems @client
    isLoggedIn @client
  }
`;

// Modify reactive variables
function addToCart(itemId: string) {
  cartItemsVar([...cartItemsVar(), itemId]);
}
```

---

## Error Handling

```typescript
import { useQuery, useMutation } from "@apollo/client";

function UserProfile() {
  const { data, loading, error } = useQuery(GET_USER, {
    errorPolicy: "all",
  });

  // Network errors
  if (error?.networkError) {
    return <OfflineMessage />;
  }

  // GraphQL errors (with partial data)
  if (error?.graphQLErrors) {
    const authError = error.graphQLErrors.find(
      (e) => e.extensions?.code === "UNAUTHENTICATED",
    );
    if (authError) {
      return <LoginRedirect />;
    }
  }

  // Partial data with errors (errorPolicy: "all")
  return (
    <>
      {data && <UserCard user={data.user} />}
      {error && <ErrorBanner errors={error.graphQLErrors} />}
    </>
  );
}

// Global error handling with link
const errorLink = onError(({ graphQLErrors, networkError, forward, operation }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === "UNAUTHENTICATED") {
        // Retry with refreshed token
        const oldHeaders = operation.getContext().headers;
        operation.setContext({
          headers: {
            ...oldHeaders,
            authorization: `Bearer ${getNewToken()}`,
          },
        });
        return forward(operation);
      }
    }
  }
});
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Using `no-cache` everywhere | Defeats the purpose of Apollo Client's normalized cache | Use `cache-and-network` for fresh data with instant UI |
| Not providing `__typename` in optimistic responses | Cache cannot normalize the optimistic result | Always include `__typename` in optimistic response objects |
| Refetching queries instead of updating cache | Unnecessary network requests, slow UI updates | Use `update` function or `cache.modify` after mutations |
| Missing `keyFields` for types with non-`id` keys | Cache collisions or duplicate entries | Configure `keyFields` in type policies |
| Ignoring `error.graphQLErrors` with partial data | User sees no data even when partial results are available | Use `errorPolicy: "all"` and render partial data with error banners |
| Creating new `ApolloClient` on each render | Destroys cache, causes infinite re-renders | Create client once outside the component or use `useMemo` |
| Not splitting links for subscriptions | WebSocket link used for queries and mutations | Use `split` to route subscriptions to `wsLink`, rest to `httpLink` |
| Using `cache.writeQuery` for list additions | Fragile, must know exact query variables | Use `cache.modify` with field modifier functions |

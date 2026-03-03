# Apollo Server

## Setup

```bash
npm install @apollo/server graphql
```

---

## Schema Definition (SDL)

```typescript
// schema.ts
const typeDefs = `#graphql
  type Query {
    users: [User!]!
    user(id: ID!): User
    posts(limit: Int, offset: Int): PostConnection!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    createPost(input: CreatePostInput!): Post!
  }

  type Subscription {
    postCreated: Post!
    userStatusChanged(userId: ID!): User!
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: Role!
    posts: [Post!]!
    createdAt: String!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    published: Boolean!
    createdAt: String!
  }

  type PostConnection {
    edges: [Post!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  input CreateUserInput {
    email: String!
    name: String!
    password: String!
  }

  input UpdateUserInput {
    name: String
    email: String
  }

  input CreatePostInput {
    title: String!
    content: String!
    published: Boolean
  }

  enum Role {
    USER
    ADMIN
    MODERATOR
  }
`;
```

---

## Resolvers

```typescript
import { GraphQLError } from "graphql";

interface MyContext {
  user: { id: string; email: string; role: string } | null;
  dataSources: {
    userAPI: UserAPI;
    postAPI: PostAPI;
  };
}

const resolvers = {
  Query: {
    users: async (_parent: unknown, _args: unknown, context: MyContext) => {
      return context.dataSources.userAPI.getAll();
    },

    user: async (_parent: unknown, args: { id: string }, context: MyContext) => {
      return context.dataSources.userAPI.getById(args.id);
    },

    posts: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: MyContext,
    ) => {
      const limit = args.limit ?? 20;
      const offset = args.offset ?? 0;
      return context.dataSources.postAPI.getPaginated(limit, offset);
    },
  },

  Mutation: {
    createUser: async (
      _parent: unknown,
      args: { input: { email: string; name: string; password: string } },
      context: MyContext,
    ) => {
      return context.dataSources.userAPI.create(args.input);
    },

    createPost: async (
      _parent: unknown,
      args: { input: { title: string; content: string; published?: boolean } },
      context: MyContext,
    ) => {
      if (!context.user) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      return context.dataSources.postAPI.create({
        ...args.input,
        authorId: context.user.id,
      });
    },
  },

  // Field-level resolvers
  User: {
    posts: async (parent: { id: string }, _args: unknown, context: MyContext) => {
      return context.dataSources.postAPI.getByAuthorId(parent.id);
    },
  },

  Post: {
    author: async (parent: { authorId: string }, _args: unknown, context: MyContext) => {
      return context.dataSources.userAPI.getById(parent.authorId);
    },
  },
};
```

---

## Context

```typescript
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { expressMidleware } from "@apollo/server/express4";

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
});

// Standalone setup
const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const user = token ? await verifyToken(token) : null;

    return {
      user,
      dataSources: {
        userAPI: new UserAPI(db),
        postAPI: new PostAPI(db),
      },
    };
  },
  listen: { port: 4000 },
});

// Express integration
import express from "express";
import cors from "cors";

const app = express();
await server.start();

app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => ({
      user: await getUserFromReq(req),
      dataSources: {
        userAPI: new UserAPI(db),
        postAPI: new PostAPI(db),
      },
    }),
  }),
);
```

---

## Data Sources

```typescript
// datasources/user-api.ts
export class UserAPI {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getAll() {
    return this.db.user.findMany();
  }

  async getById(id: string) {
    const user = await this.db.user.findUnique({ where: { id } });
    if (!user) {
      throw new GraphQLError("User not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    return user;
  }

  async create(input: { email: string; name: string; password: string }) {
    return this.db.user.create({ data: input });
  }
}
```

---

## Error Handling

```typescript
import { GraphQLError } from "graphql";

// Authentication error
throw new GraphQLError("You must be logged in", {
  extensions: {
    code: "UNAUTHENTICATED",
    http: { status: 401 },
  },
});

// Authorization error
throw new GraphQLError("You are not authorized to perform this action", {
  extensions: {
    code: "FORBIDDEN",
    http: { status: 403 },
  },
});

// Validation error
throw new GraphQLError("Invalid argument value", {
  extensions: {
    code: "BAD_USER_INPUT",
    argumentName: "email",
    validationErrors: [{ field: "email", message: "Invalid email format" }],
  },
});

// Not found error
throw new GraphQLError("Resource not found", {
  extensions: {
    code: "NOT_FOUND",
    http: { status: 404 },
  },
});

// Custom error formatting
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    // Don't expose internal errors to clients in production
    if (process.env.NODE_ENV === "production") {
      if (formattedError.extensions?.code === "INTERNAL_SERVER_ERROR") {
        return {
          message: "An unexpected error occurred",
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        };
      }
    }
    return formattedError;
  },
});
```

---

## Plugins

```typescript
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import type { ApolloServerPlugin } from "@apollo/server";

// Custom logging plugin
const loggingPlugin: ApolloServerPlugin<MyContext> = {
  async requestDidStart(requestContext) {
    const start = Date.now();

    return {
      async didResolveOperation(ctx) {
        console.log(`Operation: ${ctx.operationName}`);
      },

      async willSendResponse(ctx) {
        const duration = Date.now() - start;
        console.log(`Response sent in ${duration}ms`);
      },

      async didEncounterErrors(ctx) {
        for (const err of ctx.errors) {
          console.error("GraphQL Error:", err.message, err.extensions);
        }
      },
    };
  },
};

// Server with plugins
const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    loggingPlugin,
  ],
});
```

---

## Authentication in Resolvers

```typescript
// Helper: require authentication
function requireAuth(context: MyContext) {
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return context.user;
}

// Helper: require specific role
function requireRole(context: MyContext, ...roles: string[]) {
  const user = requireAuth(context);
  if (!roles.includes(user.role)) {
    throw new GraphQLError("Insufficient permissions", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  return user;
}

// Usage in resolvers
const resolvers = {
  Mutation: {
    deleteUser: async (_: unknown, args: { id: string }, context: MyContext) => {
      requireRole(context, "ADMIN");
      return context.dataSources.userAPI.delete(args.id);
    },

    updateProfile: async (_: unknown, args: { input: any }, context: MyContext) => {
      const user = requireAuth(context);
      return context.dataSources.userAPI.update(user.id, args.input);
    },
  },
};
```

---

## Subscriptions

```typescript
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub();
const POST_CREATED = "POST_CREATED";

const resolvers = {
  Mutation: {
    createPost: async (_: unknown, args: any, context: MyContext) => {
      const post = await context.dataSources.postAPI.create(args.input);
      pubsub.publish(POST_CREATED, { postCreated: post });
      return post;
    },
  },
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterableIterator([POST_CREATED]),
    },
  },
};

// Server setup with WebSocket support
const schema = makeExecutableSchema({ typeDefs, resolvers });
const httpServer = createServer(app);
const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });

const serverCleanup = useServer(
  {
    schema,
    context: async (ctx) => {
      const token = ctx.connectionParams?.authorization as string;
      const user = token ? await verifyToken(token) : null;
      return { user };
    },
  },
  wsServer,
);
```

---

## Caching

```typescript
import responseCachePlugin from "@apollo/server-plugin-response-cache";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [responseCachePlugin()],
});

// Cache hints in schema
const typeDefs = `#graphql
  type Query {
    posts: [Post!]! @cacheControl(maxAge: 60)
    user(id: ID!): User @cacheControl(maxAge: 30, scope: PRIVATE)
  }

  type Post @cacheControl(maxAge: 120) {
    id: ID!
    title: String!
    content: String!
    viewCount: Int! @cacheControl(maxAge: 0) # never cache
  }
`;

// Programmatic cache control in resolvers
const resolvers = {
  Query: {
    posts: async (_: unknown, __: unknown, context: MyContext, info: any) => {
      info.cacheControl.setCacheHint({ maxAge: 60, scope: "PUBLIC" });
      return context.dataSources.postAPI.getAll();
    },
  },
};
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Business logic in resolvers | Hard to test, violates separation of concerns | Move logic into data sources or service classes |
| Mutating `contextValue` in resolvers | Race conditions with concurrent requests | Treat context as read-only; create new objects |
| Using `ApolloError` (v3 API) | Deprecated in Apollo Server v4 | Use `GraphQLError` from the `graphql` package |
| N+1 queries in field resolvers | Excessive database calls for nested fields | Use DataLoader for batching and caching |
| No error formatting in production | Internal errors leak stack traces | Configure `formatError` to mask internal errors |
| Using in-memory `PubSub` in production | Does not work across multiple server instances | Use Redis-backed PubSub or similar distributed solution |
| Skipping authentication in context | Auth check scattered across every resolver | Validate token in context function; use helper utilities |
| No query depth or complexity limits | Malicious deeply nested queries exhaust resources | Use query depth limiting and complexity analysis plugins |

# Fastify

> This guide covers Fastify v5 (current). Requires Node.js v20+.

## Plugin System

Fastify's core abstraction is the **plugin**. Everything is a plugin — routes, decorators, hooks, and other plugins.

```typescript
import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

const app = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

// Register plugins
await app.register(import('@fastify/cors'), { origin: true });
await app.register(import('@fastify/helmet'));
await app.register(import('@fastify/compress'));

// Register feature plugins
await app.register(import('./plugins/db'));
await app.register(import('./routes/users'), { prefix: '/api/v1/users' });
await app.register(import('./routes/orders'), { prefix: '/api/v1/orders' });

await app.listen({ port: 3000, host: '0.0.0.0' });
```

### Plugin Encapsulation

Plugins create an encapsulated context. Decorators and hooks registered inside a plugin are **not** visible to sibling or parent plugins.

```typescript
// plugins/db.ts
import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    db: PrismaClient;
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient();
  await prisma.$connect();

  fastify.decorate('db', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
};

// fp() breaks encapsulation — makes decorator available to parent
export default fp(dbPlugin, { name: 'db' });
```

### Encapsulation Rules

| Wrapped with `fp()` | Behavior |
| -------------------- | -------- |
| **Yes** | Decorators/hooks leak to parent scope (shared plugins) |
| **No** | Everything stays encapsulated (feature plugins) |

| Use `fp()` for | Don't use `fp()` for |
| --------------- | -------------------- |
| Database connections | Route plugins |
| Auth decorators | Feature modules |
| Shared utilities | Business logic plugins |

---

## v5 Breaking Changes

Key changes when migrating from Fastify v4 to v5:

| v4 | v5 | Notes |
| -- | -- | ----- |
| `jsonShortHand: true` (default) | Removed — full JSON Schema required | Shorthand properties like `type: 'object'` at top level no longer inferred |
| `reply.sent` | `reply.hijack()` | Check `reply.raw.writableEnded` if you need the old boolean |
| `reply.redirect(url, code)` | `reply.redirect(code, url)` | Argument order swapped |
| `.listen(port, host)` | `.listen({ port, host })` | Variadic signature removed — options object only |
| `request.connection` | `request.socket` | Follows Node.js deprecation |
| Mixed async + callback plugins | Must be async **or** callback, not both | Return a promise **or** call `done()`, never both |
| `useSemicolonDelimiter: true` | Defaults to `false` | Semicolons in query strings no longer split by default |

---

## Schema-Based Validation

Fastify uses JSON Schema for request/response validation. Schemas enable automatic serialization, validation, and Swagger generation.

```typescript
// routes/users/users.schema.ts
import { Type, Static } from '@sinclair/typebox';

export const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  createdAt: Type.String({ format: 'date-time' }),
});

export const CreateUserSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email' }),
});

export type User = Static<typeof UserSchema>;
export type CreateUserBody = Static<typeof CreateUserSchema>;
```

```typescript
// routes/users/index.ts
import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { CreateUserSchema, UserSchema } from './users.schema';

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      querystring: Type.Object({
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
      }),
      response: {
        200: Type.Array(UserSchema),
      },
    },
    handler: async (request, reply) => {
      const { page, limit } = request.query;
      const users = await fastify.db.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });
      return users;
    },
  });

  fastify.post('/', {
    schema: {
      body: CreateUserSchema,
      response: { 201: UserSchema },
    },
    handler: async (request, reply) => {
      const user = await fastify.db.user.create({ data: request.body });
      reply.status(201);
      return user;
    },
  });
};

export default usersRoutes;
```

---

## Lifecycle Hooks

```
Incoming Request
  → onRequest
  → preParsing
  → preValidation
  → preHandler
  → handler
  → preSerialization
  → onSend
  → onResponse
```

```typescript
// Auth hook applied to all routes in this plugin
fastify.addHook('onRequest', async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }
  request.user = await verifyToken(token);
});

// Timing hook
fastify.addHook('onResponse', async (request, reply) => {
  request.log.info({ responseTime: reply.elapsedTime }, 'request completed');
});
```

### Hook Scope

| Hook registered in | Applies to |
| ------------------- | ---------- |
| Root app | All routes |
| Plugin (no `fp()`) | Routes in that plugin only |
| Route options | That single route |

---

## Decorators

```typescript
// Type-safe request decorator
declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string; role: string };
  }
}

// v5: omit initial value or use a proper getter
fastify.decorateRequest('user');

// Type-safe reply decorator
declare module 'fastify' {
  interface FastifyReply {
    notFound: (resource: string) => void;
  }
}

fastify.decorateReply('notFound', function (resource: string) {
  this.status(404).send({ error: `${resource} not found` });
});
```

---

## Error Handling

```typescript
// Custom error handler
fastify.setErrorHandler(async (error, request, reply) => {
  request.log.error(error);

  if (error.validation) {
    reply.status(400).send({
      error: 'ValidationError',
      message: error.message,
      details: error.validation,
    });
    return;
  }

  if (error.statusCode) {
    reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
    return;
  }

  reply.status(500).send({
    error: 'InternalServerError',
    message: 'Something went wrong',
  });
});
```

---

## Project Structure

```
src/
├── app.ts                    # Fastify instance, plugin registration
├── server.ts                 # Start server
├── plugins/
│   ├── db.ts                 # Database (fp-wrapped)
│   ├── auth.ts               # Auth decorator (fp-wrapped)
│   └── swagger.ts            # API docs (fp-wrapped)
├── routes/
│   ├── users/
│   │   ├── index.ts          # Route plugin
│   │   ├── users.schema.ts   # TypeBox schemas
│   │   └── users.service.ts  # Business logic
│   └── orders/
│       ├── index.ts
│       ├── orders.schema.ts
│       └── orders.service.ts
├── lib/                      # Shared utilities
└── types/                    # Shared types
```

---

## Testing with inject()

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../app';

describe('Users API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/users returns users', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: 'Bearer test-token' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: expect.any(String) }),
    ]));
  });

  it('POST /api/v1/users validates body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      payload: { name: '' }, // missing email, empty name
    });

    expect(res.statusCode).toBe(400);
  });
});
```

---

## TypeBox vs Zod

| Aspect | TypeBox | Zod |
| ------ | ------- | --- |
| JSON Schema native | Yes — direct integration | Needs `zod-to-json-schema` |
| Serialization | Automatic via response schema | Manual |
| Swagger generation | Built-in with `@fastify/swagger` | Extra setup |
| Validation style | JSON Schema keywords | Method chaining |
| v5 Type Provider | `@fastify/type-provider-typebox` — single provider handles both ValidatorSchema and SerializerSchema | `@fastify/type-provider-zod` — separate ValidatorSchema (Zod) and SerializerSchema (Zod or JSON Schema) |

**Recommendation:** Use TypeBox for Fastify-native schema validation. Use Zod if shared with frontend or if you prefer its API. In v5, type providers split validation and serialization schemas — TypeBox handles both natively while Zod requires explicit configuration for each.

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| Not using schemas | Lose validation, serialization, and docs | Define schemas for every route |
| Using `fp()` on route plugins | Hooks/decorators leak to parent | Only use `fp()` for shared plugins |
| Forgetting `await` on `register` | Plugin not ready when routes execute | Always `await app.register(...)` |
| Throwing in hooks without reply | Unhandled error | Use `reply.send()` or let error handler catch |
| Mutating `request.body` directly | Bypasses validation | Use validated `request.body` as-is |
| Sync heavy computation in handler | Blocks event loop | Use worker threads or offload |
| Missing type augmentation | TypeScript errors on decorators | Augment `FastifyInstance`/`FastifyRequest` |
| Not closing app in tests | Port conflicts, resource leaks | Call `app.close()` in `afterEach` |
| Passing `null` to `decorateRequest` | Deprecated in v5, causes issues | Omit initial value or use a getter |
| Mixing async and callback in plugin | Throws in v5 | Use either `async` or `done()` callback, never both |

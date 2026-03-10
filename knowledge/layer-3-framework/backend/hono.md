# Hono

## Multi-Runtime Framework

Hono runs on any JavaScript runtime: Cloudflare Workers, Deno, Bun, Node.js, AWS Lambda, Vercel, and more.

```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('Hello Hono!'));
app.get('/api/health', (c) => c.json({ status: 'ok' }));

export default app;
```

### Runtime Adapters

| Runtime | Entry Point | Deployment |
| ------- | ----------- | ---------- |
| Cloudflare Workers | `export default app` | `wrangler deploy` |
| Cloudflare Pages | `export default app` | Static + dynamic |
| Node.js | `serve(app)` from `@hono/node-server` | `node dist/index.js` |
| Bun | `export default app` | `bun run src/index.ts` |
| Deno | `Deno.serve(app.fetch)` | `deno run --allow-net src/index.ts` |
| AWS Lambda | `handle(app)` from `hono/aws-lambda` | SAM/CDK deploy |
| Lambda@Edge | `handle(app)` from `hono/aws-lambda` | CloudFront edge |
| Vercel | `export default handle(app)` from `@hono/vercel` | `vercel deploy` |
| Fastly Compute | `app.fire()` from `@fastly/hono-fastly-compute` | Fastly CLI |
| Netlify | `export default handle(app)` from `hono/netlify` | `netlify deploy` |
| Service Worker | `app.fire()` | Browser service workers |

```typescript
// Node.js adapter
import { serve } from '@hono/node-server';
import app from './app';

serve({ fetch: app.fetch, port: 3000 });
```

---

## Middleware Composition

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { compress } from 'hono/compress';
import { prettyJSON } from 'hono/pretty-json';
import { timing } from 'hono/timing';

const app = new Hono();

// Built-in middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({ origin: ['http://localhost:5173'] }));
app.use('*', compress());
app.use('*', timing());
app.use('/api/*', prettyJSON());

// Custom middleware
app.use('/api/*', async (c, next) => {
  const start = Date.now();
  await next();
  c.header('X-Response-Time', `${Date.now() - start}ms`);
});
```

### Built-in Middleware

| Middleware | Package | Purpose |
| ---------- | ------- | ------- |
| `cors` | `hono/cors` | CORS headers |
| `logger` | `hono/logger` | Request logging |
| `secureHeaders` | `hono/secure-headers` | Security headers |
| `compress` | `hono/compress` | Gzip/brotli |
| `bearerAuth` | `hono/bearer-auth` | Bearer token auth |
| `jwt` | `hono/jwt` | JWT verification |
| `basicAuth` | `hono/basic-auth` | Basic auth |
| `prettyJSON` | `hono/pretty-json` | Pretty-print JSON |
| `timing` | `hono/timing` | Server-Timing header |
| `cache` | `hono/cache` | Cache-Control |
| `bodyLimit` | `hono/body-limit` | Limit request body size |
| `etag` | `hono/etag` | ETag generation |
| `contextStorage` | `hono/context-storage` | Context outside handlers |
| `requestId` | `hono/request-id` | Unique request IDs |
| `timeout` | `hono/timeout` | Request timeout |
| `csrf` | `hono/csrf` | CSRF protection |
| `ipRestriction` | `hono/ip-restriction` | IP allowlist/blocklist |
| `combine` | `hono/combine` | Compose middleware logic |

---

## Context Object

The `c` (Context) object is the single argument to every handler and middleware.

```typescript
app.get('/users/:id', async (c) => {
  // Path parameters
  const id = c.req.param('id');

  // Query parameters
  const page = c.req.query('page');

  // Headers
  const auth = c.req.header('Authorization');

  // Body (JSON)
  const body = await c.req.json();

  // Response helpers
  return c.json({ user }, 200);
  return c.text('Hello', 200);
  return c.html('<h1>Hello</h1>');
  return c.body('Raw body');
  return c.redirect('/login');
  return c.notFound();
});

// Set response headers
app.use('*', async (c, next) => {
  await next();
  c.header('X-Custom', 'value');
});

// Set/get variables (request-scoped)
app.use('*', async (c, next) => {
  c.set('userId', '123');
  await next();
});

app.get('/me', (c) => {
  const userId = c.get('userId');
  return c.json({ userId });
});
```

### Streaming Responses

```typescript
import { stream, streamText, streamSSE } from 'hono/streaming';

// Text streaming
app.get('/stream-text', (c) => streamText(c, async (stream) => {
  await stream.writeln('Line 1');
  await stream.writeln('Line 2');
}));

// Server-Sent Events
app.get('/sse', (c) => streamSSE(c, async (stream) => {
  await stream.writeSSE({ data: 'hello', event: 'message' });
  await stream.writeSSE({ data: JSON.stringify({ count: 1 }), event: 'update', id: '1' });
}));
```

---

## Type-Safe Variables

```typescript
type Env = {
  Variables: {
    user: { id: string; role: string };
  };
  Bindings: {
    DATABASE_URL: string;  // Cloudflare Workers bindings
  };
};

const app = new Hono<Env>();

app.use('/api/*', async (c, next) => {
  const user = await verifyToken(c.req.header('Authorization'));
  c.set('user', user);  // Type-safe
  await next();
});

app.get('/api/me', (c) => {
  const user = c.get('user');  // Type-safe: { id: string; role: string }
  return c.json(user);
});
```

---

## Route Groups

```typescript
// routes/users.ts
import { Hono } from 'hono';

const users = new Hono();

users.get('/', async (c) => {
  const result = await usersService.findAll();
  return c.json(result);
});

users.get('/:id', async (c) => {
  const user = await usersService.findById(c.req.param('id'));
  if (!user) return c.notFound();
  return c.json(user);
});

users.post('/', async (c) => {
  const body = await c.req.json();
  const user = await usersService.create(body);
  return c.json(user, 201);
});

export { users };

// app.ts
import { users } from './routes/users';
import { orders } from './routes/orders';

const app = new Hono();
app.route('/api/v1/users', users);
app.route('/api/v1/orders', orders);
```

---

## Zod OpenAPI Integration

```typescript
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

const app = new OpenAPIHono();

const UserSchema = z.object({
  id: z.string().uuid().openapi({ example: '123e4567-e89b' }),
  name: z.string().openapi({ example: 'John' }),
  email: z.string().email().openapi({ example: 'john@example.com' }),
});

const route = createRoute({
  method: 'get',
  path: '/users/{id}',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'User found',
    },
    404: {
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
      description: 'User not found',
    },
  },
});

app.openapi(route, async (c) => {
  const { id } = c.req.valid('param');  // Type-safe validated params
  const user = await findUser(id);
  if (!user) return c.json({ error: 'Not found' }, 404);
  return c.json(user, 200);
});

// Serve OpenAPI spec
app.doc('/doc', { openapi: '3.0.0', info: { title: 'API', version: '1.0.0' } });
```

---

## RPC Mode

Type-safe client-server communication without code generation.

```typescript
// server.ts
const app = new Hono()
  .get('/api/users', async (c) => {
    const users = await getUsers();
    return c.json(users);
  })
  .post('/api/users', async (c) => {
    const body = await c.req.json();
    const user = await createUser(body);
    return c.json(user, 201);
  });

export type AppType = typeof app;

// client.ts (in frontend)
import { hc } from 'hono/client';
import type { AppType } from '../server';

const client = hc<AppType>('http://localhost:3000');

// Fully typed — autocomplete on routes and responses
const res = await client.api.users.$get();
const users = await res.json();
```

---

## Error Handling

```typescript
import { HTTPException } from 'hono/http-exception';

// Throw HTTP exceptions
app.get('/users/:id', async (c) => {
  const user = await findUser(c.req.param('id'));
  if (!user) {
    throw new HTTPException(404, { message: 'User not found' });
  }
  return c.json(user);
});

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});
```

---

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import app from '../app';

describe('Users API', () => {
  it('GET /api/v1/users returns users', async () => {
    const res = await app.request('/api/v1/users');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]));
  });

  it('POST /api/v1/users creates user', async () => {
    const res = await app.request('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@test.com' }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(201);
  });
});
```

### testClient Helper

Use `testClient` for type-safe testing that mirrors the RPC client.

```typescript
import { testClient } from 'hono/testing';
import app from '../app';

describe('Users API (testClient)', () => {
  it('GET /api/users returns users', async () => {
    const client = testClient(app);
    const res = await client.api.users.$get();
    expect(res.status).toBe(200);
    const users = await res.json();
    expect(users).toHaveLength(2);
  });

  it('GET /api/users/:id returns single user', async () => {
    const client = testClient(app);
    const res = await client.api.users[':id'].$get({ param: { id: '1' } });
    expect(res.status).toBe(200);
  });
});
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| Runtime-specific code in handlers | Not portable across runtimes | Use adapters and `c.env` for bindings |
| Not using `c.req.valid()` with Zod OpenAPI | Lose type-safe validation | Use `createRoute` + `c.req.valid()` |
| Forgetting `await next()` in middleware | Downstream middleware skipped | Always `await next()` |
| Mutating shared state | Race conditions across requests | Use `c.set()`/`c.get()` for request state |
| Not chaining routes for RPC | Client type inference broken | Chain `.get()`, `.post()` on same instance |
| Heavy sync work in handlers | Blocks event loop (especially Workers) | Offload to queues or workers |
| Ignoring `c.executionCtx` on Workers | Background tasks lost | Use `c.executionCtx.waitUntil()` |

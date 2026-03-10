# Koa

> This guide covers Koa 3.x (current). Requires Node.js >= 18.

## Middleware Architecture

Koa uses an **onion model** — middleware executes downstream, then upstream. Each middleware `await`s `next()` to pass control downstream, then resumes after downstream completes.

```typescript
import Koa from 'koa';

const app = new Koa();

// Onion model: downstream then upstream
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();  // ← downstream
  // ← upstream (after all downstream middleware complete)
  ctx.set('X-Response-Time', `${Date.now() - start}ms`);
});

app.use(async (ctx, next) => {
  await next();
  console.log(`${ctx.method} ${ctx.url} - ${ctx.status}`);
});

// Handler (innermost)
app.use(async (ctx) => {
  ctx.body = { message: 'Hello Koa' };
});

app.listen(3000);
```

### Execution Flow

```
Request → MW1 (down) → MW2 (down) → MW3 (handler)
                                         ↓
Response ← MW1 (up) ← MW2 (up) ← MW3 returns
```

---

## Context Object (ctx)

Koa encapsulates `request` and `response` into a single `ctx` object with convenience aliases.

```typescript
app.use(async (ctx) => {
  // Request shortcuts (delegated to ctx.request)
  ctx.method;          // GET, POST, etc.
  ctx.url;             // Full URL
  ctx.path;            // URL path
  ctx.query;           // Parsed query string { page: '1' }
  ctx.headers;         // Request headers
  ctx.get('Authorization'); // Get specific header
  ctx.ip;              // Client IP

  // Request body (via @koa/bodyparser)
  ctx.request.body;    // Parsed body

  // Response shortcuts (delegated to ctx.response)
  ctx.body = { data: [] };     // Set response body (auto-sets Content-Type)
  ctx.status = 200;            // Set status code
  ctx.set('X-Custom', 'val');  // Set response header
  ctx.type = 'json';           // Set Content-Type
  ctx.back();                  // Redirect to Referer or fallback (replaces res.redirect('back'))

  // State (request-scoped, shared across middleware)
  ctx.state.user = { id: '123' };
});
```

### ctx.state Usage

```typescript
// Auth middleware sets state
app.use(async (ctx, next) => {
  const token = ctx.get('Authorization')?.replace('Bearer ', '');
  if (token) {
    ctx.state.user = await verifyToken(token);
  }
  await next();
});

// Route handler reads state
router.get('/profile', async (ctx) => {
  if (!ctx.state.user) {
    ctx.throw(401, 'Authentication required');
  }
  ctx.body = ctx.state.user;
});
```

---

## AsyncLocalStorage

Koa 3 supports built-in `AsyncLocalStorage` to access the current context from any function without passing it explicitly.

```typescript
const app = new Koa({ asyncLocalStorage: true });

// Access ctx anywhere in the call stack
function someUtil() {
  const ctx = app.currentContext;
  ctx.log.info('called from a utility');
}

app.use(async (ctx) => {
  someUtil(); // no need to pass ctx
  ctx.body = 'ok';
});
```

---

## Router Setup

Koa has no built-in router. Use `@koa/router`.

> **@koa/router v15:** Built-in TypeScript types (no `@types/` package needed). Regex params removed — use middleware validation instead. Requires Node.js >= 20.

```typescript
import Koa from 'koa';
import Router from '@koa/router';
import { bodyParser } from '@koa/bodyparser';

const app = new Koa();
const router = new Router({ prefix: '/api/v1' });

// Middleware
app.use(bodyParser());

// Routes
router.get('/users', async (ctx) => {
  const users = await usersService.findAll(ctx.query);
  ctx.body = users;
});

router.get('/users/:id', async (ctx) => {
  const user = await usersService.findById(ctx.params.id);
  if (!user) ctx.throw(404, 'User not found');
  ctx.body = user;
});

router.post('/users', async (ctx) => {
  const user = await usersService.create(ctx.request.body);
  ctx.status = 201;
  ctx.body = user;
});

router.put('/users/:id', async (ctx) => {
  const user = await usersService.update(ctx.params.id, ctx.request.body);
  ctx.body = user;
});

router.delete('/users/:id', async (ctx) => {
  await usersService.remove(ctx.params.id);
  ctx.status = 204;
});

// Mount router
app.use(router.routes());
app.use(router.allowedMethods());
```

### Nested Routers

```typescript
// routes/users.ts
const usersRouter = new Router();

usersRouter.get('/', listUsers);
usersRouter.get('/:id', getUser);
usersRouter.post('/', createUser);

export { usersRouter };

// routes/index.ts
const apiRouter = new Router({ prefix: '/api/v1' });

apiRouter.use('/users', usersRouter.routes(), usersRouter.allowedMethods());
apiRouter.use('/orders', ordersRouter.routes(), ordersRouter.allowedMethods());

export { apiRouter };

// app.ts
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());
```

---

## Middleware Setup

```typescript
import Koa from 'koa';
import { bodyParser } from '@koa/bodyparser';
import cors from '@koa/cors';
import helmet from 'koa-helmet';
import compress from 'koa-compress';
import { koaLogger } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';

const app = new Koa();

// Error handler (outermost — catches all downstream errors)
app.use(errorHandler);

// Security
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN }));

// Parsing and compression
app.use(bodyParser({ jsonLimit: '10kb' }));
app.use(compress());

// Logging
app.use(koaLogger);

// Routes (registered last)
app.use(router.routes());
app.use(router.allowedMethods());
```

### Common Middleware Packages

| Package | Purpose |
| ------- | ------- |
| `@koa/bodyparser` | Parse JSON/form/text bodies |
| `@koa/cors` | CORS headers |
| `koa-helmet` | Security headers |
| `koa-compress` | Response compression |
| `@koa/router` | Routing |
| `koa-static` | Static file serving |
| `koa-mount` | Mount sub-applications |

---

## Error Handling

```typescript
// middleware/error-handler.ts
export async function errorHandler(ctx: Koa.Context, next: Koa.Next) {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.status || err.statusCode || 500;
    ctx.body = {
      error: err.name || 'InternalServerError',
      message: err.expose ? err.message : 'Something went wrong',
    };

    // Only log 5xx errors
    if (ctx.status >= 500) {
      ctx.app.emit('error', err, ctx);
    }
  }
}

// Using ctx.throw for expected errors
router.get('/users/:id', async (ctx) => {
  const user = await usersService.findById(ctx.params.id);
  if (!user) {
    ctx.throw(404, 'User not found');  // Sets status + expose=true
  }
  ctx.body = user;
});

// App-level error listener
app.on('error', (err, ctx) => {
  console.error('Server error:', err, { url: ctx?.url });
});
```

### ctx.throw vs throw

Koa 3 uses `http-errors` v2 internally for `ctx.throw`.

| Method | `err.expose` | Use When |
| ------ | ------------ | -------- |
| `ctx.throw(status, message)` | `true` (4xx), `false` (5xx) | Expected errors (validation, not found) |
| `throw new Error()` | `false` | Unexpected errors (will show generic message) |

---

## Request Validation

```typescript
// middleware/validate.ts
import type { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    const result = schema.safeParse(ctx.request.body);
    if (!result.success) {
      ctx.throw(400, result.error.issues[0].message);
    }
    ctx.request.body = result.data;
    await next();
  };
}

// Usage
router.post('/users', validate(createUserSchema), createUser);
```

---

## Project Structure

```
src/
├── app.ts                    # Koa app setup
├── server.ts                 # HTTP server, graceful shutdown
├── routes/
│   ├── index.ts              # Mount all routers
│   ├── users.ts              # User routes
│   └── orders.ts             # Order routes
├── services/
│   ├── users.service.ts
│   └── orders.service.ts
├── middleware/
│   ├── error-handler.ts
│   ├── auth.ts
│   ├── validate.ts
│   └── logger.ts
├── lib/                      # Shared utilities
└── types/                    # TypeScript types
```

---

## Testing

```typescript
import request from 'supertest';
import { app } from '../app';
import { describe, it, expect } from 'vitest';

describe('GET /api/v1/users', () => {
  it('returns users', async () => {
    const res = await request(app.callback())
      .get('/api/v1/users')
      .expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: expect.any(String) }),
      ]),
    );
  });

  it('returns 404 for missing user', async () => {
    const res = await request(app.callback())
      .get('/api/v1/users/nonexistent')
      .expect(404);

    expect(res.body.error).toBeDefined();
  });
});
```

**Note:** Use `app.callback()` with supertest — not `app.listen()`.

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| Forgetting `await next()` | Downstream middleware never runs | Always `await next()` in non-terminal middleware |
| Using `ctx.body` before `await next()` | Response overwritten by downstream | Set `ctx.body` after `await next()` or in terminal handler |
| Error handler not first | Misses errors from middleware above it | Register error handler as outermost middleware |
| Using `req`/`res` directly | Bypasses Koa context, breaks middleware | Use `ctx.request`/`ctx.response` or `ctx` aliases |
| Missing `router.allowedMethods()` | No automatic 405/501 responses | Always mount `.allowedMethods()` with `.routes()` |
| Heavy logic in middleware | Slow for all routes, not just target | Use per-route middleware or guards |
| Accessing `ctx.request.body` without parser | `undefined` body | Register `@koa/bodyparser` before routes |
| Not using `ctx.state` for request data | Polluting `ctx` directly | Use `ctx.state.user`, not `ctx.user` |

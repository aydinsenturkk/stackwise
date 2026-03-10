# Express

> Express v5 is the default on npm since March 2025. This guide covers Express v5. For v4 migration, see the official migration guide.

> **Requires Node.js 18+.**

## Middleware Pipeline

Middleware executes in the order it is registered. Order matters.

```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { pinoHttp } from 'pino-http';

const app = express();

// 1. Security headers (first)
app.use(helmet());

// 2. CORS
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));

// 3. Compression
app.use(compression());

// 4. Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 5. Request logging
app.use(pinoHttp());

// 6. Routes
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/orders', ordersRouter);

// 7. 404 handler (after all routes)
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 8. Error handler (last — must have 4 args)
app.use(errorHandler);
```

### Middleware Order Rules

| Position | Middleware | Why |
| -------- | --------- | --- |
| First | `helmet()` | Set security headers before anything else |
| Early | `cors()` | Reject disallowed origins before processing |
| Early | Body parsers | Request body needed by subsequent middleware |
| Middle | Auth middleware | After parsing, before route handlers |
| After routes | 404 handler | Catches unmatched routes |
| Last | Error handler | Catches all thrown/forwarded errors |

---

## Route Syntax (v5)

Express v5 uses `path-to-regexp` v8 with breaking changes from v4.

| Change | v4 | v5 |
| ------ | -- | -- |
| Wildcard | `/*` | `/*splat` (must be named) |
| Regex params | `/:id(\\d+)` | Removed (use middleware validation) |
| Optional segments | `/path?` | Use braces syntax `{/path}` |

```typescript
// v5 wildcard — must be named
app.get('/assets/*splat', (req, res) => {
  const filepath = req.params.splat;
  // ...
});

// v5 optional segment
app.get('/users{/:id}', usersController.findOneOrAll);
```

---

## Removed APIs

APIs removed in Express v5. Update any v4 code that uses these.

| Removed | Replacement |
| ------- | ----------- |
| `req.param(name)` | `req.params`, `req.body`, `req.query` |
| `app.del()` | `app.delete()` |
| Variadic `res.redirect(status, url)` | `res.redirect(url)` + `res.status()` |

---

## Router Organization

Express v5 catches async errors natively — no wrapper needed.

```typescript
// routes/users.router.ts
import { Router } from 'express';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from './users.schema';
import * as usersController from './users.controller';

const router = Router();

router.get('/', usersController.findAll);                                    // async errors caught automatically
router.get('/:id', usersController.findOne);
router.post('/', validate(createUserSchema), usersController.create);
router.patch('/:id', validate(updateUserSchema), usersController.update);
router.delete('/:id', usersController.remove);

export { router as usersRouter };
```

### Controller Pattern

```typescript
// routes/users.controller.ts
import type { Request, Response } from 'express';
import { usersService } from './users.service';

export async function findAll(req: Request, res: Response) {
  const users = await usersService.findAll(req.query);
  res.json(users);
}

export async function create(req: Request, res: Response) {
  const user = await usersService.create(req.body);
  res.status(201).json(user);
}
```

### Project Structure

```
src/
├── app.ts                    # Express app setup, middleware
├── server.ts                 # HTTP server, graceful shutdown
├── routes/
│   ├── index.ts              # Mount all routers
│   ├── users/
│   │   ├── users.router.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.schema.ts
│   └── orders/
│       ├── orders.router.ts
│       ├── orders.controller.ts
│       └── orders.service.ts
├── middleware/
│   ├── error-handler.ts
│   ├── validate.ts
│   └── auth.ts
├── lib/                      # Shared utilities
└── types/                    # Shared types
```

---

## Error Handling Middleware

Error-handling middleware **must** have exactly 4 parameters. Express v5 automatically forwards rejected promises and thrown errors from async handlers to error middleware.

```typescript
// middleware/error-handler.ts
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Something went wrong',
  });
}
```

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly name: string = 'AppError',
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NotFoundError');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'ValidationError');
  }
}
```

---

## Request Validation

```typescript
// middleware/validate.ts
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new ValidationError(result.error.issues[0].message));
      return;
    }
    req.body = result.data;
    next();
  };
}
```

---

## Authentication Middleware

```typescript
// middleware/auth.ts
import type { Request, Response, NextFunction } from 'express';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    next(new AppError(401, 'Authentication required', 'Unauthorized'));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, 'Invalid token', 'Unauthorized'));
  }
}

// Apply to specific routes
router.use(authenticate);
// Or per-route
router.get('/profile', authenticate, getProfile);
```

---

## Graceful Shutdown

```typescript
// server.ts
import { app } from './app';

const server = app.listen(process.env.PORT ?? 3000, () => {
  console.log(`Server running on port ${process.env.PORT ?? 3000}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

---

## Testing

```typescript
import request from 'supertest';
import { app } from '../app';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GET /api/v1/users', () => {
  it('returns list of users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: expect.any(String) }),
      ]),
    );
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .expect(401);

    expect(res.body.error).toBe('Unauthorized');
  });
});
```

---

## Configuration

```typescript
// lib/config.ts
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
});

export const config = envSchema.parse(process.env);
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| Using Express 4 patterns without migration | `asyncHandler`, `req.param()`, unnamed wildcards break or are unnecessary in v5 | Follow the v5 migration guide; remove `asyncHandler` wrappers |
| Error handler with 3 args | Express treats it as regular middleware | Always use 4 parameters `(err, req, res, next)` |
| Business logic in routes | Untestable, tightly coupled | Extract to service layer |
| `app.use('*', ...)` for 404 | Catches all methods including OPTIONS | Use `app.use(handler)` after all routes |
| Missing `return` after `res.send()` | Headers already sent error | Always `return` or use `else` after sending response |
| `req.body` without validation | Injection and type safety issues | Validate with Zod/joi before using |
| Middleware after error handler | Never executes | Error handler must be registered last |
| Not calling `next(err)` | Error silently swallowed | Always forward errors with `next(err)` |

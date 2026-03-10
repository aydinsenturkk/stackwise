# Prisma ORM (v7)

## Project Setup

Prisma 7 is ESM-only and requires driver adapters for all databases.

```bash
# package.json must have "type": "module" (ESM-only)

# Install core packages (PostgreSQL example)
npm install prisma @prisma/client @prisma/adapter-pg pg
npm install -D @types/pg
npx prisma init
```

| Requirement                 | Detail                                         |
| --------------------------- | ---------------------------------------------- |
| `"type": "module"` required | Prisma 7 is ESM-only                           |
| Driver adapter required     | No built-in drivers; use `@prisma/adapter-*`   |
| `prisma.config.ts`          | Centralized config for seed, migrations, etc.  |

### Driver Adapters

| Database       | Adapter Package                     | Driver Package              |
| -------------- | ----------------------------------- | --------------------------- |
| PostgreSQL     | `@prisma/adapter-pg`                | `pg`                        |
| SQLite         | `@prisma/adapter-better-sqlite3`    | `better-sqlite3`            |
| Turso / libSQL | `@prisma/adapter-libsql`            | `@libsql/client`            |
| Neon           | `@prisma/adapter-neon`              | `@neondatabase/serverless`  |
| PlanetScale    | `@prisma/adapter-planetscale`       | `@planetscale/database`     |
| D1             | `@prisma/adapter-d1`                | —                           |

---

## Schema Design

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "./generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  posts     Post[]     // one-to-many
  profile   Profile?   // one-to-one
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@index([email])
  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([published, createdAt])
  @@map("posts")
}

model Profile {
  id     String  @id @default(cuid())
  bio    String?
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String  @unique

  @@map("profiles")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### Schema Conventions

| Convention                     | Example                           |
| ------------------------------ | --------------------------------- |
| Generator: `prisma-client`     | Replaces `prisma-client-js`       |
| `output` field is **required** | `output = "./generated/prisma"`   |
| Model names: PascalCase        | `User`, `BlogPost`                |
| Field names: camelCase         | `createdAt`, `authorId`           |
| Table mapping: snake_case      | `@@map("blog_posts")`             |
| Always add `@@map`             | Map models to snake_case tables   |
| Always add `@@index` on FKs   | `@@index([authorId])`             |
| Use `cuid()` for IDs           | `@id @default(cuid())`           |
| Audit fields on every model    | `createdAt`, `updatedAt`          |

### Multi-File Schema

Split large schemas across multiple `.prisma` files in the `prisma/` directory. Keep `generator` and `datasource` in `schema.prisma`, then create per-domain files like `user.prisma`, `post.prisma`. All `.prisma` files are merged automatically and can cross-reference models.

---

## Client Instantiation

```typescript
// lib/prisma.ts
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
```

In frameworks with hot-reload (Next.js, Vite), cache on `globalThis` to prevent connection leaks in dev.

| Do                                              | Don't                                           |
| ------------------------------------------------ | ------------------------------------------------ |
| Import from `./generated/prisma/client.js`       | Import from `@prisma/client`                     |
| Always pass a driver adapter                     | Rely on built-in connection handling             |
| Cache client on `globalThis` in dev              | Create new `PrismaClient` per request            |

---

## Prisma Config File

```typescript
// prisma.config.ts
import path from "node:path";
import type { PrismaConfig } from "prisma";

export default {
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    async seed(prisma) {
      const { seed } = await import("./prisma/seed.js");
      await seed(prisma);
    },
  },
} satisfies PrismaConfig;
```

| Setting      | Purpose                                          |
| ------------ | ------------------------------------------------ |
| `schema`     | Path to schema file (or directory for multi-file)|
| `migrate`    | Migration and seed configuration                 |
| `seed()`     | Replaces `package.json` `prisma.seed` field      |

---

## Migrations

```bash
npx prisma migrate dev --name add_user_role   # Create and apply migration
npx prisma generate                            # Regenerate client (required separately in v7)
npx prisma migrate deploy                      # Apply pending migrations (production)
npx prisma migrate reset                       # Drop DB, reapply all, reseed (dev only)
npx prisma db push                             # Push schema without migration file (prototyping)
npx prisma db seed                             # Run seed from prisma.config.ts
```

**Important**: In Prisma 7, `migrate dev` no longer auto-runs `prisma generate`. Always run `npx prisma generate` after schema changes.

---

## Prisma Client Operations

### Basic CRUD

```typescript
// Find many with filtering, sorting, pagination
const users = await prisma.user.findMany({
  where: { email: { contains: "@company.com" }, deletedAt: null },
  orderBy: { createdAt: "desc" },
  skip: 0,
  take: 20,
});

// Find unique — use OrThrow variant to throw on missing record
const user = await prisma.user.findUniqueOrThrow({
  where: { id: userId },
});

// Create with nested relation
const user = await prisma.user.create({
  data: {
    email: "john@example.com",
    name: "John",
    profile: { create: { bio: "Hello" } },
  },
});

// Update
await prisma.user.update({ where: { id: userId }, data: { name: "Jane" } });

// Upsert
await prisma.user.upsert({
  where: { email: "john@example.com" },
  update: { name: "John Updated" },
  create: { email: "john@example.com", name: "John" },
});

// Delete
await prisma.user.delete({ where: { id: userId } });

// createManyAndReturn — bulk insert with returned records
const users = await prisma.user.createManyAndReturn({
  data: [
    { email: "a@example.com", name: "Alice" },
    { email: "b@example.com", name: "Bob" },
  ],
});
```

### Select, Include, and Omit

```typescript
// Select specific fields only (reduces data transfer)
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true },
});

// Include relations with filtering
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: { where: { published: true }, orderBy: { createdAt: "desc" }, take: 10 },
    profile: true,
  },
});

// Omit — exclude specific fields from results
const user = await prisma.user.findUnique({
  where: { id: userId },
  omit: { deletedAt: true },
  include: { posts: true },  // omit works alongside include
});
```

| Rule                                        | Reason                         |
| ------------------------------------------- | ------------------------------ |
| Use `select` when you need few fields       | Reduces data transfer          |
| Use `include` when you need full relations  | Eager loading                  |
| Use `omit` to exclude sensitive fields      | Cleaner than listing all fields|
| Don't mix `select` and `include`            | They are mutually exclusive    |
| Always paginate large result sets           | Prevent memory issues          |

---

## Transactions

```typescript
// Batch transaction (auto-rollback on error)
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: { email: "a@b.com", name: "A" } }),
  prisma.post.create({ data: { title: "First", authorId: "..." } }),
]);

// Interactive transaction (complex logic with conditional reads)
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.balance < amount) throw new Error("Insufficient balance");

  return tx.user.update({
    where: { id: userId },
    data: { balance: { decrement: amount } },
  });
}, { maxWait: 5000, timeout: 10000 });
```

---

## TypedSQL

Type-safe raw SQL queries with full TypeScript inference.

```sql
-- prisma/sql/getUserPosts.sql
SELECT u.id, u.name, COUNT(p.id)::int AS post_count
FROM users u
LEFT JOIN posts p ON p.author_id = u.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.name
HAVING COUNT(p.id) > $1::int
```

```typescript
import { getUserPosts } from "./generated/prisma/sql.js";

const results = await prisma.$queryRawTyped(getUserPosts(5));
// Fully typed: { id: string; name: string; post_count: number }[]
```

Run `npx prisma generate --sql` to generate typed functions. Place `.sql` files in `prisma/sql/`.

### Raw Queries (simple cases)

```typescript
// Tagged template (safe from SQL injection)
const users = await prisma.$queryRaw`
  SELECT id, name FROM users WHERE email = ${email}
`;

// Execute raw (for INSERT, UPDATE, DELETE)
const affected = await prisma.$executeRaw`
  UPDATE users SET last_active_at = NOW() WHERE id = ${userId}
`;
```

| Do                                         | Don't                                      |
| ------------------------------------------ | ------------------------------------------ |
| Use TypedSQL for complex queries           | Use `$queryRaw` for queries with joins     |
| Use tagged templates for simple raw SQL    | String-concatenate SQL parameters          |

---

## Client Extensions (replaces `$use` Middleware)

`$use()` middleware is removed in Prisma 7. Use `$extends` Client Extensions.

```typescript
import { PrismaClient, Prisma } from "./generated/prisma/client.js";

// Query extension — soft delete
const softDelete = Prisma.defineExtension({
  name: "softDelete",
  query: {
    $allModels: {
      async delete({ args, query }) {
        return query({ ...args, data: { deletedAt: new Date() } } as any);
      },
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});

// Result extension — computed fields
const fullName = Prisma.defineExtension({
  result: {
    user: {
      fullName: {
        needs: { firstName: true, lastName: true },
        compute: (user) => `${user.firstName} ${user.lastName}`,
      },
    },
  },
});

// Compose extensions
const prisma = new PrismaClient({ adapter })
  .$extends(softDelete)
  .$extends(fullName);
```

### Extension Types

| Type      | Purpose                                | Example                     |
| --------- | -------------------------------------- | --------------------------- |
| `query`   | Intercept and modify queries           | Soft delete, audit logging  |
| `model`   | Add custom methods to models           | `user.signUp()`             |
| `client`  | Add methods to client instance         | `prisma.$log()`             |
| `result`  | Add computed fields to results         | `user.fullName`             |

---

## Seeding

Seed config moved from `package.json` to `prisma.config.ts`. Export a seed function that receives `PrismaClient`.

```typescript
// prisma/seed.ts
import type { PrismaClient } from "./generated/prisma/client.js";

export async function seed(prisma: PrismaClient) {
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", name: "Admin" },
  });
}
```

Run manually with `npx prisma db seed`. Runs automatically on `migrate reset`.

| Do                                          | Don't                                       |
| ------------------------------------------- | ------------------------------------------- |
| Define seed in `prisma.config.ts`           | Use `package.json` `prisma.seed` field      |
| Use `upsert` for idempotent seeding        | Use `create` (fails on re-run)              |
| Export seed as a function                   | Use top-level `main()` with `$disconnect`   |

---

## Repository Pattern

Define domain interfaces, implement with Prisma. Use a mapper to translate between Prisma records and domain entities. Use `upsert` in the `save()` method for create-or-update semantics.

```typescript
import { PrismaClient } from "../../generated/prisma/client.js";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string) {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async save(user: User) {
    const data = UserMapper.toPersistence(user);
    return UserMapper.toDomain(
      await this.prisma.user.upsert({ where: { id: user.id }, update: data, create: data }),
    );
  }
}
```

---

## Anti-Patterns

| Anti-Pattern                              | Solution                                       |
| ----------------------------------------- | ---------------------------------------------- |
| Using `prisma-client-js` generator        | Use `prisma-client` with required `output`     |
| Importing from `@prisma/client`           | Import from `./generated/prisma/client.js`     |
| Omitting driver adapter                   | Always pass adapter to `new PrismaClient()`    |
| Expecting `migrate dev` to auto-generate  | Run `prisma generate` explicitly after migrate |
| Seed config in `package.json`             | Move seed to `prisma.config.ts`                |
| Using `$use()` middleware                 | Use `$extends` Client Extensions               |
| No `select`/`omit` on large tables       | Use `select` or `omit` to limit fields         |
| Missing `@@index` on foreign keys         | Add index for every foreign key                |
| Long-running transactions                 | Keep transactions short, set timeouts          |
| String concatenation in raw queries       | Use tagged templates or TypedSQL               |
| Not handling `RecordNotFound`             | Use `findUniqueOrThrow` or check null          |
| CommonJS `require()` usage               | Use ESM imports (`"type": "module"`)           |

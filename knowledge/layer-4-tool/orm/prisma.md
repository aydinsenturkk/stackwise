# Prisma ORM

## Schema Design

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@index([email])
  @@map("users")
}

model Post {
  id        String     @id @default(cuid())
  title     String
  content   String?
  published Boolean    @default(false)
  author    User       @relation(fields: [authorId], references: [id])
  authorId  String
  tags      Tag[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([authorId])
  @@index([published, createdAt])
  @@map("posts")
}

model Profile {
  id     String @id @default(cuid())
  bio    String?
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String @unique

  @@map("profiles")
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]

  @@map("tags")
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
| Model names: PascalCase        | `User`, `BlogPost`                |
| Field names: camelCase         | `createdAt`, `authorId`           |
| Table mapping: snake_case      | `@@map("blog_posts")`             |
| Always add `@@map`             | Map models to snake_case tables   |
| Always add `@@index` on FKs   | `@@index([authorId])`             |
| Use `cuid()` for IDs           | `@id @default(cuid())`           |
| Audit fields on every model    | `createdAt`, `updatedAt`          |

---

## Migrations

```bash
# Create migration from schema changes
npx prisma migrate dev --name add_user_role

# Apply migrations in production
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Generate client after schema change
npx prisma generate
```

| Command              | Environment | Purpose                        |
| -------------------- | ----------- | ------------------------------ |
| `migrate dev`        | Development | Create and apply migration     |
| `migrate deploy`     | Production  | Apply pending migrations       |
| `migrate reset`      | Development | Drop DB, reapply all, reseed   |
| `db push`            | Prototyping | Push schema without migration  |
| `generate`           | Any         | Regenerate Prisma Client       |

---

## Prisma Client Operations

### Basic CRUD

```typescript
// Find many with filtering, sorting, pagination
const users = await prisma.user.findMany({
  where: {
    email: { contains: "@company.com" },
    deletedAt: null,
  },
  orderBy: { createdAt: "desc" },
  skip: 0,
  take: 20,
});

// Find unique (throws if not found with findUniqueOrThrow)
const user = await prisma.user.findUnique({
  where: { id: userId },
});

const user = await prisma.user.findUniqueOrThrow({
  where: { id: userId },
});

// Create
const user = await prisma.user.create({
  data: {
    email: "john@example.com",
    name: "John",
    profile: {
      create: { bio: "Hello" },  // Nested create
    },
  },
});

// Update
const user = await prisma.user.update({
  where: { id: userId },
  data: { name: "Jane" },
});

// Upsert
const user = await prisma.user.upsert({
  where: { email: "john@example.com" },
  update: { name: "John Updated" },
  create: { email: "john@example.com", name: "John" },
});

// Delete
await prisma.user.delete({
  where: { id: userId },
});
```

### Select and Include (Query Optimization)

```typescript
// Select specific fields only (reduces data transfer)
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});

// Include relations
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    },
    profile: true,
  },
});

// Nested select for precise control
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    posts: {
      select: { id: true, title: true },
      where: { published: true },
    },
  },
});
```

| Rule                                        | Reason                         |
| ------------------------------------------- | ------------------------------ |
| Use `select` when you need few fields       | Reduces data transfer          |
| Use `include` when you need full relations  | Eager loading                  |
| Don't use both `select` and `include`       | They're mutually exclusive     |
| Always paginate large result sets           | Prevent memory issues          |

---

## Transactions

```typescript
// Sequential transaction (auto-rollback on error)
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: { email: "a@b.com", name: "A" } }),
  prisma.post.create({ data: { title: "First", authorId: "..." } }),
]);

// Interactive transaction (complex logic)
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUniqueOrThrow({
    where: { id: userId },
  });

  if (user.balance < amount) {
    throw new Error("Insufficient balance");
  }

  const updated = await tx.user.update({
    where: { id: userId },
    data: { balance: { decrement: amount } },
  });

  await tx.transaction.create({
    data: { userId, amount, type: "DEBIT" },
  });

  return updated;
}, {
  maxWait: 5000,    // Max time to acquire connection
  timeout: 10000,   // Max transaction duration
});
```

---

## Raw Queries

```typescript
// Tagged template (safe from SQL injection)
const users = await prisma.$queryRaw`
  SELECT u.id, u.name, COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON p.author_id = u.id
  WHERE u.deleted_at IS NULL
  GROUP BY u.id, u.name
  HAVING COUNT(p.id) > ${minPosts}
`;

// Execute raw (for INSERT, UPDATE, DELETE)
const affected = await prisma.$executeRaw`
  UPDATE users SET last_active_at = NOW() WHERE id = ${userId}
`;
```

---

## Client Extensions (replaces Middleware)

`$use` middleware was removed in Prisma 7. Use Client Extensions with `$extends`.

```typescript
// Soft delete extension
const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async delete({ model, args, query }) {
        // Convert delete to soft delete
        return (prisma[model] as any).update({
          ...args,
          data: { deletedAt: new Date() },
        });
      },
      async deleteMany({ model, args, query }) {
        return (prisma[model] as any).updateMany({
          ...args,
          data: { deletedAt: new Date() },
        });
      },
      async findMany({ args, query }) {
        // Filter out soft-deleted records
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});
```

### Defining Reusable Extensions

```typescript
import { Prisma } from "@prisma/client";

// Define extension separately for reuse
const softDeleteExtension = Prisma.defineExtension({
  name: "softDelete",
  query: {
    $allModels: {
      async delete({ model, args, query }) {
        return (prisma[model] as any).update({
          ...args,
          data: { deletedAt: new Date() },
        });
      },
    },
  },
});

// Apply to client
const prisma = new PrismaClient()
  .$extends(softDeleteExtension)
  .$extends(auditLogExtension);
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

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Upsert to make seeding idempotent
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      profile: {
        create: { bio: "System administrator" },
      },
    },
  });

  console.log({ admin });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```json
// package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## Repository Pattern with Prisma

```typescript
// domain/ports/user.repository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  remove(id: string): Promise<void>;
}

// infrastructure/repositories/prisma-user.repository.ts
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
    });
    return record ? UserMapper.toDomain(record) : null;
  }

  async save(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);
    const record = await this.prisma.user.upsert({
      where: { id: user.id },
      update: data,
      create: data,
    });
    return UserMapper.toDomain(record);
  }
}
```

---

## Anti-Patterns

| Anti-Pattern                         | Solution                                   |
| ------------------------------------ | ------------------------------------------ |
| No `select` on large tables          | Use `select` to fetch only needed fields   |
| Missing `@@index` on foreign keys    | Add index for every foreign key            |
| Long-running transactions            | Keep transactions short, set timeouts      |
| String concatenation in raw queries  | Use tagged templates (`$queryRaw`)         |
| Not handling `RecordNotFound`        | Use `findUniqueOrThrow` or check null      |
| Seeding with `create` (not idempotent)| Use `upsert` for idempotent seeding       |
| Using `$use` middleware              | Use `$extends` Client Extensions (v7+)     |

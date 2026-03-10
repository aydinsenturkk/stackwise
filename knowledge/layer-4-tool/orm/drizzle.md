# Drizzle ORM

## Core Concept

Drizzle is a **SQL-first** TypeScript ORM. Schemas are defined in TypeScript, queries look like SQL, and relations are defined separately from table schemas. Zero dependencies, no code generation required.

```bash
npm install drizzle-orm
npm install -D drizzle-kit
```

---

## Schema Definition (PostgreSQL)

```typescript
// src/db/schema.ts
import {
  pgTable, serial, text, integer, boolean,
  timestamp, varchar, uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Identity columns (recommended) — `serial` still works but identity columns
// are the modern PostgreSQL approach and avoid sequence ownership issues.
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("email_idx").on(table.email),
]);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  published: boolean("published").notNull().default(false),
  authorId: integer("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("author_idx").on(table.authorId),
  index("published_idx").on(table.published, table.createdAt),
]);

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Many-to-many junction table
export const postsToTags = pgTable("posts_to_tags", {
  postId: integer("post_id").notNull().references(() => posts.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
}, (table) => [
  { pk: { columns: [table.postId, table.tagId] } },
]);
```

---

## Relations

Relations are defined **separately** from table schemas — they don't affect the database, only the query builder.

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  postsToTags: many(postsToTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postsToTags: many(postsToTags),
}));

export const postsToTagsRelations = relations(postsToTags, ({ one }) => ({
  post: one(posts, { fields: [postsToTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postsToTags.tagId], references: [tags.id] }),
}));
```

---

## Database Connection

```typescript
// src/db/index.ts

// Simplified init — auto-detects the driver from your installed packages
import { drizzle } from "drizzle-orm";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, { schema });

// Or with an explicit driver import (still supported)
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

---

## Queries

### Select (SQL-like)

```typescript
import { eq, and, or, like, gt, desc, asc, count, sql } from "drizzle-orm";

// Find many with filters
const result = await db.select()
  .from(users)
  .where(and(
    eq(users.verified, true),
    like(users.email, "%@company.com"),
  ))
  .orderBy(desc(users.createdAt))
  .limit(20)
  .offset(0);

// Select specific columns
const names = await db.select({ id: users.id, name: users.name })
  .from(users);

// Count
const [{ total }] = await db.select({ total: count() })
  .from(users)
  .where(eq(users.verified, true));

// Join
const postsWithAuthors = await db.select({
    postTitle: posts.title,
    authorName: users.name,
  })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id))
  .where(eq(posts.published, true));
```

### Relational Queries

```typescript
// Find with relations (like Prisma's include)
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: {
      where: eq(posts.published, true),
      orderBy: [desc(posts.createdAt)],
      limit: 10,
    },
  },
});

// Find one
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    posts: {
      with: {
        postsToTags: {
          with: { tag: true },
        },
      },
    },
  },
});
```

### Insert

```typescript
// Single insert
const [newUser] = await db.insert(users)
  .values({ name: "John", email: "john@example.com" })
  .returning();

// Bulk insert
await db.insert(users).values([
  { name: "Alice", email: "alice@example.com" },
  { name: "Bob", email: "bob@example.com" },
]);

// Upsert (on conflict)
await db.insert(users)
  .values({ name: "John", email: "john@example.com" })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: "John Updated" },
  });
```

### Update & Delete

```typescript
// Update
const [updated] = await db.update(users)
  .set({ verified: true })
  .where(eq(users.id, userId))
  .returning();

// Delete
await db.delete(posts)
  .where(eq(posts.authorId, userId));
```

### Transactions

```typescript
const result = await db.transaction(async (tx) => {
  const [user] = await tx.insert(users)
    .values({ name: "John", email: "john@example.com" })
    .returning();

  await tx.insert(posts)
    .values({ title: "First Post", authorId: user.id });

  return user;
});
```

---

## Migrations

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Push schema directly (prototyping)
npx drizzle-kit push

# Open Drizzle Studio (GUI)
npx drizzle-kit studio
```

| Command     | Purpose                            |
| ----------- | ---------------------------------- |
| `generate`  | Create SQL migration from diff     |
| `migrate`   | Apply pending migrations           |
| `push`      | Push schema without migration file |
| `pull`      | Pull schema from existing database    |
| `check`     | Detect non-commutative migrations     |
| `studio`    | Open visual database browser          |

---

## Filter Operators

| Operator       | SQL                | Usage                              |
| -------------- | ------------------ | ---------------------------------- |
| `eq()`         | `=`                | `eq(users.id, 1)`                 |
| `ne()`         | `!=`               | `ne(users.role, "ADMIN")`         |
| `gt()` / `lt()`| `>` / `<`         | `gt(users.age, 18)`               |
| `gte()` / `lte()` | `>=` / `<=`    | `gte(posts.views, 100)`           |
| `like()`       | `LIKE`             | `like(users.name, "%john%")`      |
| `ilike()`      | `ILIKE`            | `ilike(users.name, "%john%")`     |
| `inArray()`    | `IN`               | `inArray(users.id, [1, 2, 3])`   |
| `isNull()`     | `IS NULL`          | `isNull(users.deletedAt)`         |
| `isNotNull()`  | `IS NOT NULL`      | `isNotNull(users.email)`          |
| `and()`        | `AND`              | `and(eq(...), gt(...))`           |
| `or()`         | `OR`               | `or(eq(...), eq(...))`            |
| `sql`          | Raw SQL            | `` sql`${users.age} + 1` ``      |

---

## Prisma vs Drizzle

| Aspect          | Prisma                    | Drizzle                         |
| --------------- | ------------------------- | ------------------------------- |
| Schema          | `.prisma` DSL             | TypeScript                      |
| Queries         | ORM-style                 | SQL-like + relational           |
| Relations       | In schema                 | Separate from tables            |
| Code generation | Required (`prisma generate`) | Not needed                   |
| Migrations      | Auto-generated            | SQL files from diff             |
| Performance     | Good                      | Closer to raw SQL               |
| Type safety     | Generated types           | Inferred from schema            |
| Bundle size     | Larger (engine binary)    | Minimal (~50KB)                 |

---

## Anti-Patterns

| Anti-Pattern                           | Solution                                    |
| -------------------------------------- | ------------------------------------------- |
| Missing indexes on foreign keys        | Add `index()` in table definition           |
| Relations defined without table schema | Relations need matching table references     |
| Using `push` in production             | Use `generate` + `migrate` for production   |
| No `returning()` on insert/update      | Add `.returning()` when you need the result |
| String concatenation in filters        | Use `sql` tagged template for raw SQL       |
| Not passing schema to `drizzle()`      | Required for relational queries to work     |
| Using `findFirst` without `where`      | Always filter — `findFirst` returns first row|

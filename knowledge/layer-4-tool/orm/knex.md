# Knex.js Query Builder

## Connection Setup

```typescript
import Knex from "knex";

const knex = Knex({
  client: "pg", // "mysql2", "sqlite3", "better-sqlite3", "mssql"
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
  },
  migrations: {
    directory: "./migrations",
    tableName: "knex_migrations",
  },
  seeds: {
    directory: "./seeds",
  },
});

// Or with connection string
const knex = Knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
});

// Verify connection
await knex.raw("SELECT 1");

// Destroy connection pool on shutdown
await knex.destroy();
```

---

## Query Building

### Select

```typescript
// Select all columns
const users = await knex("users").select("*");

// Select specific columns
const users = await knex("users").select("id", "name", "email");

// With conditions
const activeAdmins = await knex("users")
  .select("id", "name", "email")
  .where("role", "admin")
  .andWhere("deleted_at", null)
  .orderBy("created_at", "desc")
  .limit(20)
  .offset(0);

// Where with object
const user = await knex("users")
  .where({ email: "john@example.com", deleted_at: null })
  .first(); // returns single row or undefined

// Complex where
const users = await knex("users")
  .where("age", ">", 18)
  .andWhere(function () {
    this.where("role", "admin").orWhere("role", "moderator");
  })
  .whereNotNull("verified_at")
  .whereIn("status", ["active", "pending"])
  .whereBetween("created_at", ["2024-01-01", "2024-12-31"]);

// Count
const [{ count }] = await knex("users").where("role", "admin").count("* as count");

// Distinct
const roles = await knex("users").distinct("role");

// Aggregate
const stats = await knex("orders")
  .select("status")
  .sum("amount as total")
  .avg("amount as average")
  .count("* as count")
  .groupBy("status")
  .having("count", ">", 5);
```

### Insert

```typescript
// Single insert (returns inserted IDs on PostgreSQL)
const [user] = await knex("users")
  .insert({ name: "John", email: "john@example.com", role: "user" })
  .returning("*");

// Bulk insert
const ids = await knex("users")
  .insert([
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" },
  ])
  .returning("id");

// Insert ignore (PostgreSQL - on conflict do nothing)
await knex("users")
  .insert({ email: "john@example.com", name: "John" })
  .onConflict("email")
  .ignore();

// Upsert (PostgreSQL - on conflict update)
await knex("users")
  .insert({ email: "john@example.com", name: "John" })
  .onConflict("email")
  .merge({ name: "John Updated" });
```

### Update

```typescript
// Update with conditions
const affectedRows = await knex("users")
  .where("id", userId)
  .update({ name: "Jane", updated_at: knex.fn.now() });

// Update with returning (PostgreSQL)
const [updated] = await knex("users")
  .where("id", userId)
  .update({ verified: true })
  .returning("*");

// Increment / Decrement
await knex("products")
  .where("id", productId)
  .increment("stock", 5);

await knex("accounts")
  .where("id", accountId)
  .decrement("balance", amount);
```

### Delete

```typescript
// Delete with condition
const deletedCount = await knex("users")
  .where("id", userId)
  .del();

// Soft delete pattern
await knex("users")
  .where("id", userId)
  .update({ deleted_at: knex.fn.now() });

// Delete with returning (PostgreSQL)
const [deleted] = await knex("users")
  .where("id", userId)
  .del()
  .returning("*");
```

---

## Joins

```typescript
// Inner join
const postsWithAuthors = await knex("posts")
  .join("users", "posts.author_id", "users.id")
  .select("posts.id", "posts.title", "users.name as author_name")
  .where("posts.published", true);

// Left join
const usersWithPosts = await knex("users")
  .leftJoin("posts", "users.id", "posts.author_id")
  .select("users.id", "users.name")
  .count("posts.id as post_count")
  .groupBy("users.id", "users.name");

// Multiple joins
const fullData = await knex("posts")
  .join("users", "posts.author_id", "users.id")
  .leftJoin("comments", "posts.id", "comments.post_id")
  .leftJoin("post_tags", "posts.id", "post_tags.post_id")
  .leftJoin("tags", "post_tags.tag_id", "tags.id")
  .select(
    "posts.id",
    "posts.title",
    "users.name as author",
    knex.raw("COUNT(DISTINCT comments.id) as comment_count"),
    knex.raw("ARRAY_AGG(DISTINCT tags.name) as tag_names"),
  )
  .groupBy("posts.id", "posts.title", "users.name");

// Join with conditions
const result = await knex("users")
  .join("orders", function () {
    this.on("users.id", "=", "orders.user_id")
      .andOn("orders.status", "=", knex.raw("?", ["completed"]));
  })
  .select("users.name", "orders.total");
```

---

## Transactions

```typescript
// Using trx provider (recommended)
const result = await knex.transaction(async (trx) => {
  const [user] = await trx("users")
    .insert({ name: "John", email: "john@example.com" })
    .returning("*");

  await trx("posts")
    .insert({ title: "First Post", author_id: user.id });

  return user; // auto-commits on success
  // auto-rollbacks on thrown error
});

// Manual transaction
const trx = await knex.transaction();
try {
  await trx("accounts")
    .where("id", fromId)
    .decrement("balance", amount);

  await trx("accounts")
    .where("id", toId)
    .increment("balance", amount);

  await trx("transfers")
    .insert({ from_id: fromId, to_id: toId, amount });

  await trx.commit();
} catch (error) {
  await trx.rollback();
  throw error;
}
```

---

## Migrations

```bash
# Create migration file
npx knex migrate:make create_users_table

# Run all pending migrations
npx knex migrate:latest

# Rollback last batch
npx knex migrate:rollback

# Rollback all migrations
npx knex migrate:rollback --all

# Check migration status
npx knex migrate:status
```

```typescript
// migrations/20240101120000_create_users_table.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("email", 255).notNullable().unique();
    table.string("name", 128).notNullable();
    table.enum("role", ["user", "admin", "moderator"]).defaultTo("user");
    table.boolean("verified").defaultTo(false);
    table.timestamps(true, true); // created_at, updated_at with defaults
    table.timestamp("deleted_at").nullable();

    table.index(["email"]);
    table.index(["role", "created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}

// Adding columns in a later migration
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.string("phone", 20).nullable();
    table.jsonb("metadata").defaultTo("{}");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("phone");
    table.dropColumn("metadata");
  });
}
```

### Schema Builder Methods

| Method                        | Purpose                             |
| ----------------------------- | ----------------------------------- |
| `createTable(name, cb)`       | Create new table                    |
| `alterTable(name, cb)`        | Modify existing table               |
| `dropTableIfExists(name)`     | Drop table if it exists             |
| `renameTable(from, to)`       | Rename table                        |
| `hasTable(name)`              | Check if table exists               |
| `hasColumn(table, column)`    | Check if column exists              |

### Column Types

| Method                  | SQL Type           | Notes                          |
| ----------------------- | ------------------ | ------------------------------ |
| `increments("id")`      | `SERIAL PRIMARY KEY` | Auto-incrementing integer    |
| `bigIncrements("id")`   | `BIGSERIAL`        | For large tables               |
| `string("name", 255)`   | `VARCHAR(255)`     | Default length 255             |
| `text("content")`       | `TEXT`             | Unlimited text                 |
| `integer("age")`        | `INTEGER`          | 32-bit integer                 |
| `bigInteger("count")`   | `BIGINT`           | 64-bit integer                 |
| `boolean("active")`     | `BOOLEAN`          | True/false                     |
| `timestamp("date")`     | `TIMESTAMP`        | Date and time                  |
| `timestamps(true, true)`| Two `TIMESTAMP`    | created_at + updated_at        |
| `decimal("price", 10, 2)` | `DECIMAL(10,2)` | Precise numbers                |
| `jsonb("data")`         | `JSONB`            | PostgreSQL JSON                |
| `uuid("id")`            | `UUID`             | UUID column                    |
| `enum("role", [...])`   | `ENUM`             | Enumerated values              |

---

## Seeds

```bash
# Create seed file
npx knex seed:make 01_users

# Run all seeds
npx knex seed:run

# Run specific seed
npx knex seed:run --specific=01_users.ts
```

```typescript
// seeds/01_users.ts
import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Truncate existing data
  await knex("users").del();

  // Insert seed data
  await knex("users").insert([
    { email: "admin@example.com", name: "Admin", role: "admin" },
    { email: "john@example.com", name: "John", role: "user" },
    { email: "jane@example.com", name: "Jane", role: "user" },
  ]);
}
```

---

## Raw Queries

```typescript
// Raw select with bindings (safe from SQL injection)
const users = await knex.raw(
  `SELECT u.id, u.name, COUNT(p.id) as post_count
   FROM users u
   LEFT JOIN posts p ON p.author_id = u.id
   WHERE u.deleted_at IS NULL AND u.role = ?
   GROUP BY u.id, u.name
   HAVING COUNT(p.id) > ?`,
  ["admin", 5],
);

// Named bindings
const users = await knex.raw(
  "SELECT * FROM users WHERE role = :role AND age > :minAge",
  { role: "admin", minAge: 18 },
);

// Raw in query builder (for expressions not supported natively)
const users = await knex("users")
  .select("id", "name", knex.raw("AGE(created_at) as account_age"))
  .whereRaw("created_at > NOW() - INTERVAL '30 days'")
  .orderByRaw("LOWER(name) ASC");

// Raw in schema builder
await knex.schema.raw("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
```

---

## Anti-Patterns

| Anti-Pattern                           | Problem                                    | Instead                                        |
| -------------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| String interpolation in queries        | SQL injection vulnerability                | Use `?` placeholders or `:named` bindings      |
| Not using `.first()` for single rows   | Returns array when you want one object     | Chain `.first()` for single-row lookups         |
| Missing `.returning("*")` on writes    | No way to get inserted/updated data back   | Add `.returning()` (PostgreSQL/SQLite)          |
| Not destroying knex on shutdown        | Connection pool leak                       | Call `knex.destroy()` on process exit           |
| Migrations without `down` function     | Cannot rollback if something goes wrong    | Always implement both `up` and `down`           |
| Using `knex.schema.raw` without checks | Fails if extension/object already exists   | Use `IF NOT EXISTS` / `IF EXISTS` guards        |
| Seeds that aren't idempotent           | Duplicates on re-run, FK violations        | Truncate before insert or use upsert logic      |
| Not indexing columns used in WHERE     | Full table scans on filtered queries       | Add indexes in migrations for query columns     |
| Long-running transactions              | Locks tables and blocks other queries      | Keep transactions short, batch large operations |
| Not using `trx` inside transaction     | Operations execute outside the transaction | Always use the `trx` object, not `knex`         |

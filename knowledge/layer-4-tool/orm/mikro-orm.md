# MikroORM

## Entity Definition with Decorators

```typescript
import {
  Entity, PrimaryKey, Property, ManyToOne,
  OneToMany, ManyToMany, Collection, Enum,
  Index, Unique, OptionalProps,
} from "@mikro-orm/core";
import { v4 as uuid } from "uuid";

@Entity({ tableName: "users" })
export class User {
  [OptionalProps]?: "createdAt" | "updatedAt" | "role";

  @PrimaryKey({ type: "uuid" })
  id: string = uuid();

  @Property()
  @Unique()
  email!: string;

  @Property({ length: 128 })
  name!: string;

  @Enum({ items: () => UserRole })
  role: UserRole = UserRole.USER;

  @Property({ hidden: true, lazy: true })
  password!: string;

  @OneToMany(() => Post, (post) => post.author)
  posts = new Collection<Post>(this);

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ nullable: true })
  deletedAt?: Date;
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  MODERATOR = "moderator",
}

@Entity({ tableName: "posts" })
export class Post {
  [OptionalProps]?: "createdAt" | "published";

  @PrimaryKey({ type: "uuid" })
  id: string = uuid();

  @Property()
  title!: string;

  @Property({ type: "text", nullable: true })
  content?: string;

  @Property()
  published: boolean = false;

  @ManyToOne(() => User)
  @Index()
  author!: User;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  @Property()
  createdAt: Date = new Date();
}

@Entity({ tableName: "tags" })
export class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  name!: string;

  @ManyToMany(() => Post, (post) => post.tags)
  posts = new Collection<Post>(this);
}
```

### Decorator Reference

| Decorator       | Purpose                           | Key Options                          |
| --------------- | --------------------------------- | ------------------------------------ |
| `@Entity()`     | Mark class as entity              | `tableName`, `collection`            |
| `@PrimaryKey()` | Primary key column                | `type`, `autoincrement`              |
| `@Property()`   | Regular column                    | `type`, `nullable`, `hidden`, `lazy` |
| `@Enum()`       | Enum column                       | `items`, `array`                     |
| `@Index()`      | Database index                    | `properties`, `options`              |
| `@Unique()`     | Unique constraint                 | `properties`                         |
| `@ManyToOne()`  | Many-to-one reference             | `entity`, `nullable`, `onDelete`     |
| `@OneToMany()`  | One-to-many collection            | `entity`, `mappedBy`                 |
| `@OneToOne()`   | One-to-one reference              | `entity`, `owner`, `mappedBy`        |
| `@ManyToMany()` | Many-to-many collection           | `entity`, `owner`, `pivotTable`      |

---

## Unit of Work & Identity Map

MikroORM uses the **Unit of Work** pattern: changes are tracked automatically and flushed in a single transaction. The **Identity Map** ensures each entity instance is loaded only once per request context.

```typescript
import { MikroORM, RequestContext } from "@mikro-orm/core";

// Initialize ORM
const orm = await MikroORM.init({
  entities: [User, Post, Tag],
  dbName: "mydb",
  type: "postgresql",
  debug: process.env.NODE_ENV === "development",
});

// Fork EntityManager per request (critical for isolation)
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

// Or manually fork
const em = orm.em.fork();
```

### Persist and Flush

```typescript
const em = orm.em.fork();

// Create: persist marks entity for insertion
const user = em.create(User, {
  email: "john@example.com",
  name: "John",
});
em.persist(user);

// Flush writes all pending changes to the database
await em.flush();

// Fetched entities are auto-tracked — no need to persist again
const existing = await em.findOneOrFail(User, { email: "john@example.com" });
existing.name = "Jane"; // change is tracked automatically
await em.flush(); // UPDATE is generated

// Remove
em.remove(existing);
await em.flush(); // DELETE is generated

// persistAndFlush / removeAndFlush shortcuts
await em.persistAndFlush(newUser);
await em.removeAndFlush(existingUser);
```

---

## Relationships

```typescript
const em = orm.em.fork();

// Create with relationships
const user = em.create(User, { email: "john@example.com", name: "John" });
const post = em.create(Post, { title: "First Post", author: user });
post.tags.add(em.create(Tag, { name: "typescript" }));
await em.flush(); // inserts user, post, tag, and pivot in one transaction

// Load with populated relations
const userWithPosts = await em.findOneOrFail(
  User,
  { id: userId },
  { populate: ["posts", "posts.tags"] },
);

// Lazy-load collections
const author = await em.findOneOrFail(User, userId);
await author.posts.init(); // loads posts collection
for (const post of author.posts) {
  await post.tags.init(); // loads tags for each post
}

// Reference without loading (avoids extra query)
const post = em.create(Post, {
  title: "Quick Post",
  author: em.getReference(User, userId), // no SELECT needed
});
await em.flush();
```

---

## Querying

### EntityManager Find Methods

```typescript
const em = orm.em.fork();

// Find many with filters, ordering, pagination
const users = await em.find(
  User,
  { role: UserRole.ADMIN, deletedAt: null },
  {
    orderBy: { createdAt: "DESC" },
    limit: 20,
    offset: 0,
    fields: ["id", "email", "name"], // select specific fields
  },
);

// Find one (returns null if not found)
const user = await em.findOne(User, { email: "john@example.com" });

// Find one or fail (throws if not found)
const user = await em.findOneOrFail(User, userId);

// Count
const count = await em.count(User, { role: UserRole.ADMIN });

// Complex filters
const users = await em.find(User, {
  $and: [
    { role: { $in: [UserRole.ADMIN, UserRole.MODERATOR] } },
    { createdAt: { $gte: new Date("2024-01-01") } },
    { name: { $like: "%john%" } },
    { deletedAt: null },
  ],
});

// Find with populated relations
const posts = await em.find(
  Post,
  { published: true },
  {
    populate: ["author", "tags"],
    orderBy: { createdAt: "DESC" },
  },
);
```

### Query Builder

```typescript
const qb = em.createQueryBuilder(User, "u");

const users = await qb
  .select(["u.id", "u.name", "u.email"])
  .leftJoin("u.posts", "p")
  .where({ "u.role": UserRole.ADMIN, "u.deletedAt": null })
  .groupBy("u.id")
  .having({ "count(p.id)": { $gt: 5 } })
  .orderBy({ "u.createdAt": "DESC" })
  .limit(20)
  .getResultList();

// Raw query via QueryBuilder
const result = await em.createQueryBuilder(User)
  .select("*")
  .where({ role: UserRole.ADMIN })
  .execute("all");

// Native SQL when needed
const results = await em.execute(
  "SELECT u.id, u.name FROM users u WHERE u.role = ? AND u.created_at > ?",
  [UserRole.ADMIN, new Date("2024-01-01")],
);
```

### Filter Operators

| Operator    | Usage                              | SQL Equivalent    |
| ----------- | ---------------------------------- | ----------------- |
| `$eq`       | `{ age: { $eq: 25 } }`            | `= 25`            |
| `$ne`       | `{ role: { $ne: "admin" } }`      | `!= 'admin'`      |
| `$gt/$gte`  | `{ age: { $gt: 18 } }`            | `> 18`            |
| `$lt/$lte`  | `{ age: { $lt: 65 } }`            | `< 65`            |
| `$in`       | `{ role: { $in: [...] } }`        | `IN (...)`        |
| `$like`     | `{ name: { $like: "%john%" } }`   | `LIKE '%john%'`   |
| `$and/$or`  | `{ $or: [{ a: 1 }, { b: 2 }] }`  | `a=1 OR b=2`      |
| `$not`      | `{ $not: { role: "admin" } }`     | `NOT role='admin'` |

---

## Migrations

```bash
# Create blank migration
npx mikro-orm migration:create

# Generate migration from entity changes (diff)
npx mikro-orm migration:create --initial  # first migration
npx mikro-orm migration:create --diff      # subsequent changes

# Run pending migrations
npx mikro-orm migration:up

# Rollback last migration
npx mikro-orm migration:down

# Check migration status
npx mikro-orm migration:list
```

```typescript
// mikro-orm.config.ts
import { defineConfig } from "@mikro-orm/postgresql";

export default defineConfig({
  entities: [User, Post, Tag],
  dbName: "mydb",
  migrations: {
    path: "./migrations",
    transactional: true,
    allOrNothing: true,
  },
});

// Generated migration example
import { Migration } from "@mikro-orm/migrations";

export class Migration20240101 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "name" VARCHAR(128) NOT NULL,
        "role" TEXT CHECK ("role" IN ('user', 'admin', 'moderator')) DEFAULT 'user',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "users";');
  }
}
```

---

## Repositories

```typescript
import { EntityRepository } from "@mikro-orm/core";

// Custom repository
export class UserRepository extends EntityRepository<User> {
  async findActive(): Promise<User[]> {
    return this.find(
      { deletedAt: null },
      { orderBy: { createdAt: "DESC" } },
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findWithPosts(userId: string): Promise<User> {
    return this.findOneOrFail(
      { id: userId },
      { populate: ["posts"] },
    );
  }
}

// Register in entity
@Entity({ tableName: "users", repository: () => UserRepository })
export class User {
  // ...
}

// Usage (persistence goes through EntityManager)
const userRepo = em.getRepository(User) as UserRepository;
const activeUsers = await userRepo.findActive();
const user = await userRepo.findByEmail("john@example.com");

// Persist and remove via EntityManager
em.persist(newUser);
em.remove(oldUser);
await em.flush();
```

---

## Serialization

```typescript
@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  email!: string;

  // Hidden from serialization (passwords, internal fields)
  @Property({ hidden: true })
  password!: string;

  // Eager-loaded in serialization
  @ManyToOne(() => Company, { eager: true })
  company!: Company;

  // Lazy-loaded property (not loaded unless explicitly requested)
  @Property({ lazy: true, type: "text" })
  bio?: string;
}

// Serialize entity to plain object
const user = await em.findOneOrFail(User, userId);
const plain = wrap(user).toJSON();
// { id: 1, email: "...", company: { ... } }
// password is excluded, bio is not loaded

// Serialize with specific properties
const plain = wrap(user).toObject(["id", "email"]);

// Custom serialization
@Entity()
export class User {
  // ...

  @Property({ serializer: (value) => value.toISOString() })
  createdAt: Date = new Date();
}
```

---

## Filters

```typescript
// Define filter on entity
@Entity()
@Filter({
  name: "softDelete",
  cond: { deletedAt: null },
  default: true, // applied to all queries by default
})
@Filter({
  name: "active",
  cond: { verified: true },
})
export class User {
  // ...
}

// Filters are applied automatically when default: true
const users = await em.find(User, {}); // WHERE deleted_at IS NULL

// Disable filter for a query
const allUsers = await em.find(
  User,
  {},
  { filters: { softDelete: false } },
);

// Enable non-default filter
const activeUsers = await em.find(
  User,
  {},
  { filters: { active: true } },
);

// Global filter with parameters
@Filter({
  name: "tenant",
  cond: (args) => ({ tenantId: args.tenantId }),
})
export class BaseEntity {
  @Property()
  tenantId!: string;
}

// Set filter parameter globally
em.setFilterParams("tenant", { tenantId: currentTenantId });
```

---

## Anti-Patterns

| Anti-Pattern                            | Problem                                     | Instead                                        |
| --------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| Sharing EntityManager across requests   | Identity map leaks between users/requests   | Fork `em` per request via `RequestContext`      |
| Calling `flush()` after every change    | Excessive database round-trips              | Batch changes and call `flush()` once           |
| Not using `populate` for relations      | N+1 queries when accessing collections      | Specify `populate` in find options              |
| Using `em.persist()` on fetched entities| Fetched entities are already managed         | Just modify and call `em.flush()`               |
| Missing `@Index()` on `@ManyToOne`      | Slow joins on unindexed foreign keys        | Add `@Index()` decorator to FK properties       |
| Not implementing `down()` in migrations | Cannot rollback broken migrations           | Always write both `up` and `down` methods       |
| Accessing `Collection` before `init()`  | Collection is not initialized error         | Use `populate` or call `collection.init()`      |
| Using `em.find` without `limit`         | Loads entire table into memory              | Always paginate with `limit` and `offset`       |
| Ignoring `OptionalProps` type helper    | TypeScript errors on `em.create()`          | Declare optional props via `[OptionalProps]`    |
| Not calling `orm.close()` on shutdown   | Connection pool leak                        | Call `orm.close()` in shutdown hook              |

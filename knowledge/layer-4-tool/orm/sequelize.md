# Sequelize ORM

## Model Definition

```typescript
import {
  Sequelize, DataTypes, Model, InferAttributes,
  InferCreationAttributes, CreationOptional,
} from "sequelize";

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  logging: false,
  pool: { max: 10, min: 2, idle: 10000 },
});

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare name: string;
  declare role: "user" | "admin" | "moderator";
  declare deletedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "admin", "moderator"),
      allowNull: false,
      defaultValue: "user",
    },
    deletedAt: DataTypes.DATE,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    paranoid: true, // enables soft delete via deletedAt
  },
);
```

### Common DataTypes

| DataType                      | SQL Type            | Usage                              |
| ----------------------------- | ------------------- | ---------------------------------- |
| `DataTypes.STRING(255)`       | `VARCHAR(255)`      | Short text                         |
| `DataTypes.TEXT`              | `TEXT`              | Long text                          |
| `DataTypes.INTEGER`           | `INTEGER`           | Whole numbers                      |
| `DataTypes.BIGINT`            | `BIGINT`            | Large numbers                      |
| `DataTypes.FLOAT`             | `FLOAT`             | Floating point                     |
| `DataTypes.DECIMAL(10, 2)`    | `DECIMAL(10,2)`     | Precise currency values            |
| `DataTypes.BOOLEAN`           | `BOOLEAN`           | True/false                         |
| `DataTypes.DATE`              | `TIMESTAMP`         | Date and time                      |
| `DataTypes.DATEONLY`          | `DATE`              | Date without time                  |
| `DataTypes.JSON`              | `JSON`/`JSONB`      | JSON data                          |
| `DataTypes.ENUM(...)`         | `ENUM`              | Enumerated values                  |
| `DataTypes.UUID`              | `UUID`              | UUID identifiers                   |
| `DataTypes.ARRAY(DataTypes.STRING)` | `TEXT[]`      | PostgreSQL arrays                  |

---

## Associations

```typescript
class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare content: string | null;
  declare published: CreationOptional<boolean>;
  declare authorId: number;
}

Post.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT },
    published: { type: DataTypes.BOOLEAN, defaultValue: false },
    authorId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: "posts", timestamps: true },
);

class Tag extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>> {
  declare id: CreationOptional<number>;
  declare name: string;
}

Tag.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { sequelize, tableName: "tags", timestamps: false },
);

// One-to-Many: User has many Posts
User.hasMany(Post, { foreignKey: "authorId", as: "posts" });
Post.belongsTo(User, { foreignKey: "authorId", as: "author" });

// One-to-One: User has one Profile
User.hasOne(Profile, { foreignKey: "userId", as: "profile", onDelete: "CASCADE" });
Profile.belongsTo(User, { foreignKey: "userId", as: "user" });

// Many-to-Many: Posts have many Tags
Post.belongsToMany(Tag, { through: "PostTags", as: "tags", foreignKey: "postId" });
Tag.belongsToMany(Post, { through: "PostTags", as: "posts", foreignKey: "tagId" });
```

| Association       | Method on Source        | Creates FK On | Description                        |
| ----------------- | ----------------------- | ------------- | ---------------------------------- |
| `hasOne`          | `Source.hasOne(Target)` | Target        | One-to-one (source owns target)    |
| `belongsTo`       | `Source.belongsTo(Target)` | Source     | One-to-one (source references target) |
| `hasMany`         | `Source.hasMany(Target)` | Target       | One-to-many                        |
| `belongsToMany`   | `Source.belongsToMany(Target, { through })` | Junction | Many-to-many via junction table |

---

## Queries

```typescript
// Find all with filtering, sorting, pagination
const users = await User.findAll({
  where: {
    role: "user",
    email: { [Op.like]: "%@company.com" },
  },
  order: [["createdAt", "DESC"]],
  limit: 20,
  offset: 0,
  attributes: ["id", "email", "name"],
});

// Find one
const user = await User.findOne({ where: { email: "john@example.com" } });

// Find by primary key
const user = await User.findByPk(userId);

// Find or create
const [user, created] = await User.findOrCreate({
  where: { email: "john@example.com" },
  defaults: { name: "John", role: "user" },
});

// Count
const count = await User.count({ where: { role: "admin" } });

// Eager loading associations
const userWithPosts = await User.findByPk(userId, {
  include: [
    {
      model: Post,
      as: "posts",
      where: { published: true },
      required: false, // LEFT JOIN
      include: [{ model: Tag, as: "tags" }],
    },
  ],
});

// Create with association
const user = await User.create(
  {
    name: "John",
    email: "john@example.com",
    profile: { bio: "Hello world" },
  },
  { include: [{ model: Profile, as: "profile" }] },
);

// Update
const [affectedCount] = await User.update(
  { name: "Jane" },
  { where: { id: userId } },
);

// Delete
await User.destroy({ where: { id: userId } });

// Bulk create
await User.bulkCreate(
  [
    { email: "a@example.com", name: "Alice" },
    { email: "b@example.com", name: "Bob" },
  ],
  { validate: true },
);
```

### Common Operators

```typescript
import { Op } from "sequelize";

const results = await User.findAll({
  where: {
    [Op.and]: [
      { role: { [Op.in]: ["admin", "moderator"] } },
      { createdAt: { [Op.gte]: new Date("2024-01-01") } },
      { name: { [Op.iLike]: "%john%" } },  // PostgreSQL case-insensitive
      { age: { [Op.between]: [18, 65] } },
      { deletedAt: { [Op.is]: null } },
    ],
  },
});
```

---

## Scopes

```typescript
User.init({ /* ... */ }, {
  sequelize,
  tableName: "users",
  defaultScope: {
    where: { deletedAt: null },
  },
  scopes: {
    active: { where: { verified: true } },
    admins: { where: { role: "admin" } },
    withPosts: {
      include: [{ model: Post, as: "posts" }],
    },
    recent(days: number) {
      return {
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          },
        },
      };
    },
  },
});

// Using scopes
const admins = await User.scope("admins").findAll();
const recentAdmins = await User.scope("admins", { method: ["recent", 7] }).findAll();

// Remove default scope
const allUsers = await User.unscoped().findAll();
```

---

## Hooks (Lifecycle Events)

```typescript
User.init({ /* ... */ }, {
  sequelize,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    afterCreate: async (user) => {
      await sendWelcomeEmail(user.email);
    },
    beforeDestroy: async (user) => {
      await Post.destroy({ where: { authorId: user.id } });
    },
  },
});

// Or add hooks externally
User.addHook("beforeUpdate", "hashPassword", async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});
```

| Hook               | Trigger                      | Common Use Case         |
| ------------------ | ---------------------------- | ----------------------- |
| `beforeCreate`     | Before inserting new record  | Hash passwords          |
| `afterCreate`      | After inserting new record   | Send notifications      |
| `beforeUpdate`     | Before updating record       | Validate changes        |
| `beforeDestroy`    | Before deleting record       | Cascade deletes         |
| `beforeBulkCreate` | Before bulk insert           | Validate batch data     |
| `afterFind`        | After any find query         | Transform results       |

---

## Migrations

```bash
# Initialize Sequelize CLI
npx sequelize-cli init

# Create migration
npx sequelize-cli migration:generate --name add-users-table

# Run migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Create seed
npx sequelize-cli seed:generate --name demo-users

# Run seeds
npx sequelize-cli db:seed:all
```

```typescript
// migrations/20240101-create-users.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM("user", "admin", "moderator"),
        defaultValue: "user",
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
      deletedAt: Sequelize.DATE,
    });

    await queryInterface.addIndex("users", ["email"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};

// Adding a column in a later migration
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "verified", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "verified");
  },
};
```

---

## Transactions

```typescript
// Managed transaction (auto-commit/rollback)
const result = await sequelize.transaction(async (t) => {
  const user = await User.create(
    { name: "John", email: "john@example.com" },
    { transaction: t },
  );

  await Post.create(
    { title: "First Post", authorId: user.id },
    { transaction: t },
  );

  return user;
});

// Unmanaged transaction (manual commit/rollback)
const t = await sequelize.transaction();
try {
  const user = await User.create({ name: "John" }, { transaction: t });
  await Post.create({ title: "Post", authorId: user.id }, { transaction: t });
  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}

// Transaction with isolation level
const result = await sequelize.transaction(
  { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
  async (t) => {
    // operations
  },
);
```

---

## Raw Queries

```typescript
import { QueryTypes } from "sequelize";

// SELECT raw query
const users = await sequelize.query<User>(
  `SELECT u.id, u.name, COUNT(p.id) as "postCount"
   FROM users u
   LEFT JOIN posts p ON p.author_id = u.id
   WHERE u.deleted_at IS NULL
   GROUP BY u.id, u.name
   HAVING COUNT(p.id) > :minPosts`,
  {
    replacements: { minPosts: 5 },
    type: QueryTypes.SELECT,
  },
);

// With bind parameters (positional)
const users = await sequelize.query(
  "SELECT * FROM users WHERE role = $1 AND created_at > $2",
  {
    bind: ["admin", new Date("2024-01-01")],
    type: QueryTypes.SELECT,
  },
);

// INSERT/UPDATE/DELETE
await sequelize.query(
  "UPDATE users SET last_active_at = NOW() WHERE id = :userId",
  {
    replacements: { userId },
    type: QueryTypes.UPDATE,
  },
);
```

---

## Paranoid (Soft Delete)

```typescript
// Enable paranoid in model definition
User.init({ /* ... */ }, {
  sequelize,
  tableName: "users",
  paranoid: true, // adds deletedAt column automatically
});

// Soft delete (sets deletedAt)
await user.destroy();

// Find excludes soft-deleted by default
const activeUsers = await User.findAll(); // WHERE deletedAt IS NULL

// Include soft-deleted records
const allUsers = await User.findAll({ paranoid: false });

// Restore soft-deleted record
await user.restore();

// Hard delete (permanently remove)
await user.destroy({ force: true });
```

---

## Anti-Patterns

| Anti-Pattern                           | Problem                                    | Instead                                       |
| -------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| Not passing `{ transaction: t }`       | Operations run outside the transaction     | Pass transaction to every query in the block  |
| `bulkCreate` without `validate: true`  | Skips model validations on bulk insert     | Always pass `{ validate: true }`              |
| Missing `required: false` on includes  | Converts LEFT JOIN to INNER JOIN silently  | Set `required: false` for optional relations  |
| String concatenation in raw queries    | SQL injection vulnerability                | Use `replacements` or `bind` parameters       |
| Not defining both sides of association | Missing helper methods and broken includes | Define both `hasMany` and `belongsTo`         |
| Using `defaultScope` for everything    | Hard to override, causes unexpected filters| Use named scopes and apply them explicitly    |
| Not indexing foreign key columns       | Slow joins on large tables                 | Add `addIndex` in migrations for FK columns   |
| Calling `sync({ force: true })` in prod| Drops and recreates all tables             | Use migrations for production schema changes  |
| Ignoring `{ hooks: true }` on bulk ops | Hooks are skipped on bulk operations       | Pass `{ individualHooks: true }` if needed    |
| Not using `paranoid: false` when needed| Cannot find soft-deleted records           | Pass `{ paranoid: false }` to include deleted |

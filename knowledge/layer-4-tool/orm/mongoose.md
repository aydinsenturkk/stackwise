# Mongoose ODM

## Schema Definition

```typescript
import mongoose, { Schema, InferSchemaType, HydratedDocument } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 0 },
    role: { type: String, enum: ["user", "admin", "moderator"] as const, default: "user" },
    tags: [{ type: String }],
    address: {
      street: String,
      city: String,
      zip: String,
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
    collection: "users",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// TypeScript type inference
type IUser = InferSchemaType<typeof userSchema>;
type UserDocument = HydratedDocument<IUser>;
```

### Schema Types Reference

| Type       | Usage                                    | Options                          |
| ---------- | ---------------------------------------- | -------------------------------- |
| `String`   | `{ type: String }`                       | `enum`, `minlength`, `maxlength`, `trim`, `lowercase` |
| `Number`   | `{ type: Number }`                       | `min`, `max`                     |
| `Date`     | `{ type: Date }`                         | `min`, `max`, `default: Date.now`|
| `Boolean`  | `{ type: Boolean }`                      | `default`                        |
| `ObjectId` | `{ type: Schema.Types.ObjectId, ref }` | `ref` (model name)               |
| `Mixed`    | `{ type: Schema.Types.Mixed }`         | No validation                    |
| `[Type]`   | `[{ type: String }]`                    | Array of any type                |
| `Map`      | `{ type: Map, of: String }`             | `of` (value type)                |

---

## Model Creation & TypeScript

```typescript
import { Schema, model, Model } from "mongoose";

// Define interface for instance methods
interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

// Define interface for static methods
interface UserModel extends Model<IUser, {}, IUserMethods> {
  findByEmail(email: string): Promise<HydratedDocument<IUser, IUserMethods> | null>;
}

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true, select: false },
});

// Instance methods
userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

// Static methods
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};

const User = model<IUser, UserModel>("User", userSchema);
```

---

## CRUD Operations

```typescript
// Create
const user = await User.create({
  email: "john@example.com",
  name: "John",
  role: "user",
});

// Create many
const users = await User.insertMany([
  { email: "a@example.com", name: "Alice" },
  { email: "b@example.com", name: "Bob" },
]);

// Find many with filtering, sorting, pagination
const activeUsers = await User.find({ deletedAt: null, role: "user" })
  .sort({ createdAt: -1 })
  .skip(0)
  .limit(20)
  .select("email name role");

// Find one
const user = await User.findOne({ email: "john@example.com" });

// Find by ID
const user = await User.findById(userId);

// Update one (returns the updated document)
const updated = await User.findByIdAndUpdate(
  userId,
  { $set: { name: "Jane" } },
  { new: true, runValidators: true },
);

// Update many
await User.updateMany(
  { role: "user" },
  { $set: { verified: true } },
);

// Delete
await User.findByIdAndDelete(userId);

// Upsert
await User.findOneAndUpdate(
  { email: "john@example.com" },
  { $set: { name: "John", role: "user" } },
  { upsert: true, new: true },
);
```

### Common Query Operators

| Operator    | Usage                                  | SQL Equivalent  |
| ----------- | -------------------------------------- | --------------- |
| `$eq`       | `{ age: { $eq: 25 } }`                | `= 25`          |
| `$gt/$gte`  | `{ age: { $gt: 18 } }`                | `> 18`          |
| `$lt/$lte`  | `{ age: { $lt: 65 } }`                | `< 65`          |
| `$in`       | `{ role: { $in: ["admin", "mod"] } }` | `IN (...)`      |
| `$ne`       | `{ status: { $ne: "deleted" } }`      | `!= "deleted"`  |
| `$regex`    | `{ name: { $regex: /^john/i } }`      | `LIKE 'john%'`  |
| `$exists`   | `{ phone: { $exists: true } }`        | `IS NOT NULL`   |
| `$and/$or`  | `{ $or: [{ a: 1 }, { b: 2 }] }`      | `a=1 OR b=2`    |

---

## Population (References)

```typescript
const postSchema = new Schema({
  title: { type: String, required: true },
  content: String,
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  comments: [{
    text: String,
    author: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  }],
});

const Post = model("Post", postSchema);

// Populate single reference
const post = await Post.findById(postId).populate("author", "name email");

// Populate nested references
const post = await Post.findById(postId)
  .populate("author", "name email")
  .populate("comments.author", "name");

// Populate with query conditions
const posts = await Post.find({ published: true })
  .populate({
    path: "author",
    match: { role: "admin" },
    select: "name email",
  });

// Virtual populate (reverse relationship without storing references)
userSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "author",
});

const userWithPosts = await User.findById(userId).populate("posts");
```

---

## Middleware (Hooks)

```typescript
// Pre-save: hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Pre-find: exclude soft-deleted by default
userSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null });
  next();
});

// Post-save: send welcome email
userSchema.post("save", async function (doc) {
  if (doc.isNew) {
    await sendWelcomeEmail(doc.email);
  }
});

// Pre-deleteOne: cascade delete related documents
userSchema.pre("deleteOne", { document: true, query: false }, async function () {
  await Post.deleteMany({ author: this._id });
});

// Error handling middleware
userSchema.post("save", function (error: any, doc: any, next: Function) {
  if (error.code === 11000) {
    next(new Error("Email already exists"));
  } else {
    next(error);
  }
});
```

| Hook         | Trigger                           | Common Use Case           |
| ------------ | --------------------------------- | ------------------------- |
| `pre("save")`  | Before document save            | Hash passwords, validate  |
| `post("save")` | After document save             | Send notifications        |
| `pre(/^find/)` | Before any find query           | Soft delete filter        |
| `pre("deleteOne")` | Before document deletion    | Cascade deletes           |
| `pre("validate")` | Before validation runs       | Set default values        |

---

## Virtuals

```typescript
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("fullName").set(function (fullName: string) {
  const [firstName, lastName] = fullName.split(" ");
  this.firstName = firstName;
  this.lastName = lastName;
});

// Ensure virtuals appear in JSON output
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });
```

---

## Indexes

```typescript
// Field-level index
const userSchema = new Schema({
  email: { type: String, unique: true, index: true },
  name: String,
  role: String,
  createdAt: Date,
});

// Compound index
userSchema.index({ role: 1, createdAt: -1 });

// Text index for search
userSchema.index({ name: "text", bio: "text" });

// TTL index (auto-delete after expiry)
const sessionSchema = new Schema({
  token: String,
  expiresAt: { type: Date, index: { expires: 0 } },
});

// Partial index (index only matching documents)
userSchema.index(
  { email: 1 },
  { partialFilterExpression: { deletedAt: null } },
);
```

---

## Transactions

```typescript
// Using withTransaction (recommended — auto-retry on transient errors)
const session = await mongoose.startSession();

await session.withTransaction(async () => {
  const user = await User.create([{ name: "John", email: "john@example.com" }], { session });

  await Post.create([{
    title: "First Post",
    author: user[0]._id,
  }], { session });
});

session.endSession();

// Manual transaction control
const session = await mongoose.startSession();
session.startTransaction();

try {
  const user = await User.create([{ name: "John" }], { session });
  await Post.create([{ title: "Post", author: user[0]._id }], { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**Note:** `create()` requires an **array** when passing a session option.

---

## Lean Queries

```typescript
// Lean returns plain JS objects (not Mongoose documents)
// 5-10x faster for read-only operations
const users = await User.find({ role: "user" })
  .lean()
  .exec();

// With lean, you lose: virtuals, methods, save(), populate chaining
// Use lean for: API responses, read-heavy queries, reports

// Lean with virtuals plugin
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
userSchema.plugin(mongooseLeanVirtuals);

const users = await User.find().lean({ virtuals: true });
```

| Feature               | Normal Query     | Lean Query         |
| --------------------- | ---------------- | ------------------ |
| Returns               | Mongoose Document| Plain JS Object    |
| `.save()` available   | Yes              | No                 |
| Virtuals              | Yes              | No (without plugin)|
| Change tracking       | Yes              | No                 |
| Performance           | Slower           | 5-10x faster       |

---

## Discriminators

```typescript
// Base schema
const eventSchema = new Schema(
  { timestamp: Date, message: String },
  { discriminatorKey: "kind", collection: "events" },
);
const Event = model("Event", eventSchema);

// Discriminated child schemas
const ClickEvent = Event.discriminator(
  "ClickEvent",
  new Schema({
    element: String,
    coordinates: { x: Number, y: Number },
  }),
);

const PurchaseEvent = Event.discriminator(
  "PurchaseEvent",
  new Schema({
    product: String,
    amount: Number,
  }),
);

// Query all events
const events = await Event.find(); // returns ClickEvent and PurchaseEvent docs

// Query specific discriminator
const clicks = await ClickEvent.find({ element: "button" });

// Create typed event
const click = await ClickEvent.create({
  message: "User clicked",
  element: "#submit-btn",
  coordinates: { x: 100, y: 200 },
});
```

---

## Anti-Patterns

| Anti-Pattern                            | Problem                                   | Instead                                     |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------- |
| Not using `.lean()` for read queries    | Returns full Mongoose docs with overhead  | Use `.lean()` for read-only / API responses |
| Storing deeply nested arrays            | Unbounded arrays degrade performance      | Use separate collections with references    |
| Missing indexes on query fields         | Full collection scans on every query      | Add indexes for fields used in `find`/`sort`|
| Using `findOne` + `save` for updates    | Two round-trips, race conditions          | Use `findOneAndUpdate` with `{ new: true }` |
| Not passing `{ session }` in transactions | Operations run outside the transaction  | Pass session to every operation in the txn  |
| Populating unbounded relations          | Loads entire related collection in memory | Use pagination or aggregation pipeline      |
| Ignoring `runValidators` on updates     | Validators only run on `save` by default  | Pass `{ runValidators: true }` to updates   |
| Not handling duplicate key errors       | Crashes on unique constraint violations   | Add error-handling middleware for code 11000|
| Using `Mixed` type freely              | No validation or type safety              | Define explicit sub-schemas instead         |
| Not calling `session.endSession()`      | MongoDB session leak                      | Use `try/finally` or `withTransaction`      |

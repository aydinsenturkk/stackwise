# Zod Validation (v4)

## Schema Definition

```typescript
import { z } from "zod";

// Primitives
const name = z.string().min(1).max(100);
const email = z.email();              // v4: top-level validator
const age = z.number().int().min(0).max(150);
const isActive = z.boolean().default(true);
const role = z.enum(["USER", "ADMIN", "MODERATOR"]);
const createdAt = z.coerce.date();

// Object schema
const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.email(),
  name: z.string().min(1).max(100),
  role: z.enum(["USER", "ADMIN", "MODERATOR"]),
  createdAt: z.coerce.date(),
});
```

### Top-Level Validators (v4)

v4 promotes string format validators to the `z` namespace for tree-shaking and conciseness.

```typescript
// v4 (preferred)          // v3 (deprecated but works)
z.email()                  // z.string().email()
z.uuid()                   // z.string().uuid()
z.url()                    // z.string().url()
z.cuid()                   // z.string().cuid()
z.cuid2()                  // z.string().cuid2()
z.ulid()                   // z.string().ulid()
z.nanoid()                 // z.string().nanoid()
z.emoji()                  // z.string().emoji()
z.base64()                 // z.string().base64()
z.ipv4()                   // z.string().ip({ version: "v4" })
z.ipv6()                   // z.string().ip({ version: "v6" })
z.cidrv4()                 // IP range v4
z.cidrv6()                 // IP range v6
z.iso.date()               // ISO date string
z.iso.time()               // ISO time string
z.iso.datetime()           // ISO datetime string
z.iso.duration()           // ISO duration string
```

### Common Validators

| Type       | Methods                                              |
| ---------- | ---------------------------------------------------- |
| `z.string` | `.min()`, `.max()`, `.regex()`, `.trim()`, `.toLowerCase()` |
| `z.number` | `.int()`, `.min()`, `.max()`, `.positive()`, `.nonnegative()` |
| `z.array`  | `.min()`, `.max()`, `.nonempty()`                    |
| `z.date`   | `.min()`, `.max()`                                   |
| `z.enum`   | `z.enum(["A", "B"])` or `z.nativeEnum(MyEnum)`      |

---

## Schema Naming Conventions

| Category          | Pattern                          | Example                         |
| ----------------- | -------------------------------- | ------------------------------- |
| Base Entity       | `{Entity}Schema`                 | `UserSchema`                    |
| Create Input      | `Create{Entity}Schema`           | `CreateUserSchema`              |
| Update Input      | `Update{Entity}Schema`           | `UpdateUserSchema`              |
| Filter Params     | `{Entity}FilterParamsSchema`     | `UserFilterParamsSchema`        |
| Query Params      | `{Entity}QueryParamsSchema`      | `UserQueryParamsSchema`         |
| With Relations    | `{Entity}WithRelationsSchema`    | `UserWithRelationsSchema`       |

---

## Type Inference with `z.infer`

```typescript
// Define schema once, derive type automatically
const CreateUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(100),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

// Inferred type - never define this manually
type CreateUserInput = z.infer<typeof CreateUserSchema>;
// Result: { email: string; name: string; role: "USER" | "ADMIN" }

// Input type (before defaults/transforms applied)
type CreateUserRawInput = z.input<typeof CreateUserSchema>;
// Result: { email: string; name: string; role?: "USER" | "ADMIN" }
```

### v4 Coerce Input Type Change

```typescript
// z.coerce input type is now `unknown` (was the specific type in v3)
const schema = z.coerce.string();
type SchemaInput = z.input<typeof schema>;
// v3: string
// v4: unknown
```

---

## Schema Composition

```typescript
// Base schema
const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.email(),
  name: z.string().min(1).max(100),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Create: omit generated fields
const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update: make all fields optional
const UpdateUserSchema = CreateUserSchema.partial();

// Pick specific fields
const UserCredentialsSchema = UserSchema.pick({
  email: true,
});

// Extend with additional fields (v4: preferred over .merge())
const UserWithPostsSchema = UserSchema.extend({
  posts: z.array(PostSchema),
});

// Combine schemas using spread (best tsc performance)
const FullProfileSchema = z.object({
  ...UserSchema.shape,
  ...ProfileSchema.shape,
});
```

### Composition Methods

| Method       | Purpose                                    |
| ------------ | ------------------------------------------ |
| `.omit()`    | Remove fields (create from base)           |
| `.pick()`    | Select specific fields                     |
| `.partial()` | Make all fields optional (update schemas)  |
| `.extend()`  | Add new fields or merge schemas            |
| `.required()`| Make optional fields required              |

### v4 Deprecations

| Deprecated              | Replacement                              |
| ----------------------- | ---------------------------------------- |
| `.merge(OtherSchema)`   | `.extend(OtherSchema.shape)` or spread   |
| `z.string().email()`    | `z.email()` (top-level)                  |
| `z.string().uuid()`     | `z.uuid()` (top-level)                   |

---

## Refinements and Transforms

```typescript
// Refinement: custom validation logic
const PasswordSchema = z.string()
  .min(8)
  .refine((val) => /[A-Z]/.test(val), "Must contain uppercase")
  .refine((val) => /[0-9]/.test(val), "Must contain number");

// Cross-field refinement with superRefine
const DateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).superRefine((data, ctx) => {
  if (data.endDate <= data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be after start date",
      path: ["endDate"],
    });
  }
});

// Transform: modify data after validation
const SlugSchema = z.string()
  .min(1)
  .transform((val) => val.toLowerCase().replace(/\s+/g, "-"));

// Preprocess: modify data before validation
const NumericStringSchema = z.preprocess(
  (val) => (typeof val === "string" ? parseInt(val, 10) : val),
  z.number().int().positive(),
);
```

### `z.partialRecord()` (v4)

```typescript
// Optional keys when using enum schemas with records
const myRecord = z.partialRecord(z.enum(["a", "b", "c"]), z.number());
// { a?: number; b?: number; c?: number; }
```

---

## Schema Sharing Strategy (Contracts Package)

```
packages/contracts/
├── src/
│   ├── domains/
│   │   ├── user/
│   │   │   ├── user.schemas.ts    # Zod schemas
│   │   │   └── user.types.ts      # Inferred types
│   │   └── post/
│   │       ├── post.schemas.ts
│   │       └── post.types.ts
│   ├── shared/
│   │   └── pagination.schemas.ts
│   └── index.ts                    # Re-exports
└── package.json
```

```typescript
// packages/contracts/src/domains/user/user.schemas.ts
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.email(),
  name: z.string().min(1).max(100),
  role: z.enum(["USER", "ADMIN"]),
});

export const CreateUserSchema = UserSchema.omit({
  id: true,
});

export const UpdateUserSchema = CreateUserSchema.partial();

// packages/contracts/src/domains/user/user.types.ts
import type { z } from "zod";
import type { UserSchema, CreateUserSchema } from "./user.schemas";

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

### Consumer Usage

```typescript
// Backend DTO (NestJS)
import { createZodDto } from "nestjs-zod";
import { CreateUserSchema } from "@myapp/contracts";

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

// Frontend form
import { CreateUserSchema } from "@myapp/contracts";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({
  resolver: zodResolver(CreateUserSchema),
});
```

---

## Error Formatting

```typescript
// Parse and handle errors
function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const formatted = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw new ValidationError(formatted);
  }

  return result.data;
}

// Custom error messages
const CreateUserSchema = z.object({
  email: z.email("Must be a valid email address"),
  name: z.string({ required_error: "Name is required" })
    .min(1, "Name cannot be empty")
    .max(100, "Name must be under 100 characters"),
});
```

---

## Anti-Patterns

| Anti-Pattern                         | Solution                                     |
| ------------------------------------ | -------------------------------------------- |
| Defining types manually alongside schemas | Use `z.infer<typeof Schema>` always     |
| Duplicating schemas across packages  | Single source in contracts package            |
| Skipping `import type` for types     | Always use `import type` for inferred types  |
| Business rules in Zod schemas        | Keep business rules in domain layer           |
| No custom error messages             | Add user-friendly messages to every field     |
| Validating at only one layer         | Validate at DTO, domain, and database layers  |
| Using `.merge()` for composition     | Use `.extend()` or spread for better tsc perf |
| Using `z.string().email()` in v4     | Use top-level `z.email()` for tree-shaking   |

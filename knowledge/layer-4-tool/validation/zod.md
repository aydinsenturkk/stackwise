# Zod Validation

## Schema Definition

```typescript
import { z } from "zod";

// Primitives
const name = z.string().min(1).max(100);
const email = z.string().email();
const age = z.number().int().min(0).max(150);
const isActive = z.boolean().default(true);
const role = z.enum(["USER", "ADMIN", "MODERATOR"]);
const createdAt = z.coerce.date();

// Object schema
const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["USER", "ADMIN", "MODERATOR"]),
  createdAt: z.coerce.date(),
});
```

### Common Validators

| Type       | Methods                                              |
| ---------- | ---------------------------------------------------- |
| `z.string` | `.min()`, `.max()`, `.email()`, `.url()`, `.uuid()`, `.cuid()`, `.regex()`, `.trim()` |
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
  email: z.string().email(),
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

---

## Schema Composition

```typescript
// Base schema
const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
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

// Extend with additional fields
const UserWithPostsSchema = UserSchema.extend({
  posts: z.array(PostSchema),
});

// Merge two schemas
const FullProfileSchema = UserSchema.merge(ProfileSchema);
```

### Composition Methods

| Method       | Purpose                                    |
| ------------ | ------------------------------------------ |
| `.omit()`    | Remove fields (create from base)           |
| `.pick()`    | Select specific fields                     |
| `.partial()` | Make all fields optional (update schemas)  |
| `.extend()`  | Add new fields                             |
| `.merge()`   | Combine two object schemas                 |
| `.required()`| Make optional fields required              |

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
  email: z.string().email(),
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
  email: z.string({ required_error: "Email is required" })
    .email("Must be a valid email address"),
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

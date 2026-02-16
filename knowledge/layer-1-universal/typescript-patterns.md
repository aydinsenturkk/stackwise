# TypeScript Patterns

## Strict Mode

### Required Configuration

| Option                     | Value  | Purpose                  |
| -------------------------- | ------ | ------------------------ |
| `strict`                   | `true` | Enable all strict checks |
| `noUncheckedIndexedAccess` | `true` | Safe indexed access      |
| `noImplicitReturns`        | `true` | Explicit return paths    |
| `noImplicitAny`            | `true` | Require explicit types   |
| `strictNullChecks`         | `true` | Explicit null handling   |
| `strictFunctionTypes`      | `true` | Strict function params   |

---

## Type Inference vs Explicit

| Let TypeScript Infer      | Be Explicit             |
| ------------------------- | ----------------------- |
| Variable initialization   | Function parameters     |
| Return from expressions   | Public API return types |
| Array/object literals     | Complex types           |
| Generic constraints       | Exported types          |

```typescript
// Let TypeScript infer
const count = 0;
const items = [1, 2, 3];

// Be explicit
function getUser(id: string): Promise<User> { /* ... */ }
export type Config = { timeout: number };
```

---

## Type vs Interface

| Use `interface`      | Use `type`            |
| -------------------- | --------------------- |
| Object shapes        | Unions, intersections |
| Extendable contracts | Computed types        |
| Class implementation | Utility compositions  |
| API responses        | Primitives, tuples    |

```typescript
// Interface: objects, extendable
interface User {
  id: string;
  name: string;
}

// Type: unions, computed
type Status = 'idle' | 'loading' | 'error';
type UserWithRole = User & { role: Role };
```

---

## Utility Types

| Utility         | Purpose                 |
| --------------- | ----------------------- |
| `Partial<T>`    | All properties optional |
| `Required<T>`   | All properties required |
| `Pick<T, K>`    | Select properties       |
| `Omit<T, K>`    | Exclude properties      |
| `Record<K, V>`  | Key-value mapping       |
| `Readonly<T>`   | Immutable version       |
| `ReturnType<F>` | Function return type    |
| `Parameters<F>` | Function parameters     |
| `NonNullable<T>` | Remove null/undefined  |

---

## Generics

### When to Use

- Reusable functions and classes
- Type-safe collections
- Factory patterns
- Higher-order functions

### Naming Convention

| Letter | Meaning        |
| ------ | -------------- |
| `T`    | Type (general) |
| `K`    | Key            |
| `V`    | Value          |
| `E`    | Element        |
| `R`    | Return         |

### Rules

| Do                                     | Don't                    |
| -------------------------------------- | ------------------------ |
| Add constraints (`T extends Base`)     | Unconstrained generics   |
| Use meaningful names for complex types | Single letter everywhere |
| Provide default type parameters        | Require all parameters   |

---

## Discriminated Unions

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

// TypeScript narrows automatically
function handle(result: Result<string>) {
  if (result.success) {
    console.log(result.data); // string
  } else {
    console.log(result.error); // Error
  }
}
```

### Rules

| Do                               | Don't                          |
| -------------------------------- | ------------------------------ |
| Use literal type discriminator   | Rely on optional fields        |
| Exhaustive switch checks         | Default case that hides bugs   |
| Type guards for narrowing        | Type assertions                |

---

## Type Guards

| Method        | Use Case       |
| ------------- | -------------- |
| `typeof`      | Primitives     |
| `instanceof`  | Classes        |
| `in` operator | Property check |
| Custom guard  | Complex types  |

```typescript
// Custom type guard
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

---

## Null Handling

| Do                                   | Don't                    |
| ------------------------------------ | ------------------------ |
| Use optional chaining (`?.`)         | Manual null checks       |
| Use nullish coalescing (`??`)        | OR operator for defaults |
| Return `undefined` for missing       | Return `null`            |
| Use `NonNullable<T>`                 | Type assertions          |

---

## Enums

| Do                                    | Don't                  |
| ------------------------------------- | ---------------------- |
| Use string enums                      | Numeric enums          |
| Use const enums for performance       | Regular enums for all  |
| Use union types when 2-3 values       | Enums for tiny sets    |

---

## Async Patterns

| Do                                   | Don't              |
| ------------------------------------ | ------------------ |
| `Promise<T>` explicit return type    | Implicit Promise   |
| Handle rejections                    | Unhandled promises |
| Use `Promise.all` for parallel       | Sequential awaits  |
| Type async errors                    | Catch `any`        |

---

## Import/Export

| Do                    | Don't              |
| --------------------- | ------------------ |
| Named exports         | Default exports    |
| Barrel files (index)  | Deep imports       |
| Type-only imports     | Mixed imports      |
| Absolute paths        | Relative path hell |

---

## Anti-Patterns

| Avoid                                   | Instead                | Problem              |
| --------------------------------------- | ---------------------- | -------------------- |
| `any`                                   | `unknown` + type guard | Bypasses type safety |
| `as` casting                            | Type guard or refactor | False confidence     |
| `!` non-null assertion                  | Proper null check      | Runtime errors       |
| `@ts-ignore`                            | Fix the type issue     | Hides real issues    |
| Overly complex types                    | Simplify or split      | Hard to maintain     |
| Type in variable name (`userString`)    | Let type system work   | Redundant info       |

---

## Type Naming

| Type       | Convention       | Example          |
| ---------- | ---------------- | ---------------- |
| Interface  | PascalCase       | `UserRepository` |
| Type alias | PascalCase       | `UserId`         |
| Enum       | PascalCase       | `OrderStatus`    |
| Generic    | Single uppercase | `T`, `K`, `V`    |

---

## Principles

- **Strict Mode Always**: Catch bugs at compile time
- **Prefer Inference**: Less code, same safety
- **Discriminated Unions**: For state machines and result types
- **Avoid `any`**: Use `unknown` + guards
- **Generics for Reuse**: Type-safe abstractions
- **Immutability**: Use `Readonly<T>` and `readonly` arrays

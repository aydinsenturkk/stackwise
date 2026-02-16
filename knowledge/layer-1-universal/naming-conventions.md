# Naming Conventions

## Files & Folders

| Type           | Convention    | Example              |
| -------------- | ------------- | -------------------- |
| Class file     | PascalCase    | `UserService.ts`     |
| Utility file   | camelCase     | `formatDate.ts`      |
| Type file      | camelCase     | `user.types.ts`      |
| Test file      | Same + suffix | `UserService.test.ts`|
| Folder         | kebab-case    | `user-profile/`      |
| Feature folder | kebab-case    | `features/auth/`     |

---

## Classes & Interfaces

| Type           | Convention | Example                |
| -------------- | ---------- | ---------------------- |
| Class          | PascalCase | `OrderService`         |
| Interface      | PascalCase | `OrderRepository`      |
| Abstract class | PascalCase | `BaseEntity`           |
| Exception      | PascalCase | `OrderNotFoundException` |

---

## Functions

| Type          | Pattern           | Example                       |
| ------------- | ----------------- | ----------------------------- |
| Event handler | `handle[Event]`   | `handleClick`, `handleSubmit` |
| Callback      | `on[Event]`       | `onClick`, `onComplete`       |
| Getter        | `get[Thing]`      | `getUserById`                 |
| Setter        | `set[Thing]`      | `setUserName`                 |
| Check         | `is[Condition]`   | `isValidEmail`                |
| Existence     | `has[Thing]`      | `hasPermission`               |
| Ability       | `can[Action]`     | `canEdit`                     |
| Transform     | `[action][Thing]` | `formatDate`, `parseJSON`     |
| Async fetch   | `fetch[Entity]`   | `fetchUser`, `fetchPosts`     |
| Create        | `create[Thing]`   | `createOrder`                 |
| Validate      | `validate[Thing]` | `validateOrder`               |
| Convert       | `to[Format]`      | `toDTO`, `toJSON`             |

---

## Variables

### Booleans

| Pattern          | Example                          |
| ---------------- | -------------------------------- |
| `is[State]`      | `isLoading`, `isOpen`, `isValid` |
| `has[Thing]`     | `hasError`, `hasPermission`      |
| `can[Action]`    | `canEdit`, `canDelete`           |
| `should[Action]` | `shouldRetry`, `shouldRefetch`   |

### Collections

| Pattern       | Example                           |
| ------------- | --------------------------------- |
| Plural        | `users`, `posts`, `items`         |
| `[thing]Map`  | `userMap` (for key-value)         |
| `[thing]Set`  | `tagSet` (for unique)             |

### General

| Type           | Convention       | Example           |
| -------------- | ---------------- | ----------------- |
| Local variable | camelCase        | `orderTotal`      |
| Private field  | camelCase or `_` | `_status`         |
| Boolean        | prefix required  | `isValid`         |

---

## Constants

| Type         | Convention      | Example           |
| ------------ | --------------- | ----------------- |
| Primitive    | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Object/Array | SCREAMING_SNAKE | `API_ENDPOINTS`   |
| Enum values  | PascalCase      | `Status.Pending`  |

---

## Types & Interfaces

| Type           | Pattern                   | Example              |
| -------------- | ------------------------- | -------------------- |
| API Response   | `[Entity]Response`        | `UserResponse`       |
| API Request    | `[Action][Entity]Request` | `CreateUserRequest`  |
| Data           | `[Entity]Data`            | `UserData`           |
| State          | `[Feature]State`          | `AuthState`          |
| Config         | `[Feature]Config`         | `CacheConfig`        |

---

## Common Abbreviations

| Allowed  | Avoid                |
| -------- | -------------------- |
| `id`     | `identifier`         |
| `dto`    | `dataTransferObject` |
| `config` | `cfg`                |
| `params` | `p`                  |
| `repo`   | `rp`                 |

---

## Anti-Patterns

| Avoid                        | Instead                        |
| ---------------------------- | ------------------------------ |
| `data`, `info`, `item`       | Specific name: `user`, `post`  |
| `handleClick1`, `handleClick2` | `handleSave`, `handleCancel` |
| `flag`, `temp`, `val`        | `isEnabled`, `cachedValue`     |
| Hungarian notation           | Let TypeScript handle types    |
| Abbreviations                | Full words: `button` not `btn` |
| `doProcess()`, `handleStuff()` | `process()`, `processOrder()` |

---

## Principles

- **Descriptive**: Name reveals intent
- **Consistent**: Same pattern across codebase
- **Searchable**: Easy to find with search
- **Pronounceable**: Can be spoken in discussion
- **No Mental Mapping**: No need to remember what `x` means

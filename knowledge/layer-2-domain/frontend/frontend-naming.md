# Frontend Naming Conventions

See naming-conventions in Layer 1 for universal naming principles.

## Files and Folders

**All file names use kebab-case.** This prevents macOS + Git case-sensitivity issues and maintains consistency with backend conventions. Exported symbols (components, functions, types) remain PascalCase/camelCase.

| Type           | File Name (kebab-case)        | Export                              |
| -------------- | ----------------------------- | ----------------------------------- |
| Component      | `user-profile.tsx`            | `export function UserProfile()`     |
| Hook           | `use-sidebar-store.ts`        | `export function useSidebarStore()` |
| Store          | `ui-store.ts`                 | `export const uiStore`              |
| Utility        | `format-date.ts`              | `export function formatDate()`      |
| Type file      | `user.types.ts`               | `export type UserData`              |
| Test file      | `user-profile.test.tsx`       | —                                   |
| Folder         | `user-profile/`               | —                                   |
| Feature folder | `features/notifications/`     | —                                   |

---

## Component Naming

### Pattern: `[Feature][Context][Type]`

| Type           | Suffix      | Example                       |
| -------------- | ----------- | ----------------------------- |
| Container      | `Container` | `NotificationHeaderContainer` |
| Presentational | None        | `NotificationBadge`           |
| Page           | `Page`      | `UserProfilePage`             |
| Layout         | `Layout`    | `DashboardLayout`             |
| Provider       | `Provider`  | `ThemeProvider`               |

### Context Suffixes

| Context   | When             |
| --------- | ---------------- |
| `Header`  | In header/navbar |
| `Sidebar` | In sidebar       |
| `Modal`   | Modal content    |
| `Card`    | Card display     |
| `List`    | List of items    |
| `Form`    | Form container   |
| `Page`    | Full page        |

---

## Hook Naming

### Pattern: Suffix-Based

| Type     | Pattern                        | Example                   |
| -------- | ------------------------------ | ------------------------- |
| Query    | `use[Entity]Query`             | `useUserQuery`            |
| Mutation | `use[Action][Entity]Mutation`  | `useCreateUserMutation`   |
| State    | `use[Feature]Store`            | `useAuthStore`            |
| Logic    | `use[Feature][Purpose]`        | `useFormValidation`       |

### Query/Mutation File Organization

```
features/[feature]/queries/
  use-[entity]-query.ts              # Single entity fetch
  use-[entities]-query.ts            # List fetch
  use-[action]-[entity]-mutation.ts  # Write operations
  index.ts
```

---

## Function Naming

| Type          | Pattern           | Example                       |
| ------------- | ----------------- | ----------------------------- |
| Event handler | `handle[Event]`   | `handleClick`, `handleSubmit` |
| Callback prop | `on[Event]`       | `onClick`, `onSubmit`         |
| Getter        | `get[Thing]`      | `getUserById`                 |
| Setter        | `set[Thing]`      | `setUserName`                 |
| Check         | `is[Condition]`   | `isValidEmail`                |
| Transform     | `[action][Thing]` | `formatDate`, `parseJSON`     |
| Async fetch   | `fetch[Entity]`   | `fetchUser`, `fetchPosts`     |

---

## Boolean Variables

| Pattern          | Example                          |
| ---------------- | -------------------------------- |
| `is[State]`      | `isLoading`, `isOpen`, `isValid` |
| `has[Thing]`     | `hasError`, `hasPermission`      |
| `can[Action]`    | `canEdit`, `canDelete`           |
| `should[Action]` | `shouldRefetch`, `shouldAnimate` |

---

## Types and Interfaces

| Type         | Pattern                   | Example             |
| ------------ | ------------------------- | ------------------- |
| Props        | `[Component]Props`        | `ButtonProps`       |
| API Response | `[Entity]Response`        | `UserResponse`      |
| API Request  | `[Action][Entity]Request` | `CreateUserRequest` |
| Data         | `[Entity]Data`            | `UserData`          |
| State        | `[Feature]State`          | `AuthState`         |
| Config       | `[Feature]Config`         | `ThemeConfig`       |

---

## CSS and Styles

| Type         | Convention       | Example             |
| ------------ | ---------------- | ------------------- |
| CSS class    | kebab-case       | `user-profile-card` |
| CSS variable | kebab-case       | `--primary-color`   |
| CSS module   | camelCase import | `styles.userCard`   |

---

## i18n Keys

### Pattern: `feature.section.key`

| Level   | Example                           |
| ------- | --------------------------------- |
| Feature | `notifications`                   |
| Section | `notifications.empty_state`       |
| Key     | `notifications.empty_state.title` |

- Use snake_case for keys
- Group by feature first
- Keep hierarchy shallow (max 3 levels)

---

## Constants

| Type         | Convention      | Example           |
| ------------ | --------------- | ----------------- |
| Primitive    | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Object/Array | SCREAMING_SNAKE | `API_ENDPOINTS`   |
| Enum values  | PascalCase      | `Status.Pending`  |

---

## Anti-Patterns

| Avoid                        | Instead                        |
| ---------------------------- | ------------------------------ |
| `data`, `info`, `item`       | Specific name: `user`, `post`  |
| `handleClick1`, `handleClick2` | `handleSave`, `handleCancel` |
| `MyComponent`                | `UserProfile` (descriptive)    |
| `flag`, `temp`, `val`        | `isEnabled`, `cachedValue`     |
| Hungarian notation           | Let the type system handle it  |
| Abbreviations                | Full words: `button` not `btn` |

---

## Principles

- **Descriptive**: Name reveals intent
- **Consistent**: Same pattern across the codebase
- **Searchable**: Easy to find with text search
- **Pronounceable**: Can be spoken in discussion
- **No mental mapping**: No need to remember what `x` means

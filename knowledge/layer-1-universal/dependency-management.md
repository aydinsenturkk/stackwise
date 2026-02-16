# Dependency Management

## Import Order

1. Language/runtime built-ins
2. External libraries (third-party packages)
3. Internal absolute paths (`@/features`, `@/shared`)
4. Relative imports (`./`, `../`)

---

## Barrel Exports

Features expose a public API via `index.ts`:

```typescript
// features/auth/index.ts
export { AuthService } from './services';
export { validateToken } from './utils';
export type { User, AuthConfig } from './types';
```

### Usage

- Import from barrel: `import { AuthService } from '@/features/auth'`
- Don't import internal files: `import { store } from '@/features/auth/internal/store'`

---

## Benefits

| Benefit       | Description                          |
| ------------- | ------------------------------------ |
| Encapsulation | Internal structure can change freely |
| Clear API     | What's public is explicit            |
| Refactoring   | Easier internal reorganization       |
| DX            | Shorter imports, better autocomplete |

---

## Module Boundaries

| Do                                | Don't                             |
| --------------------------------- | --------------------------------- |
| Import from feature barrel        | Import internal feature files     |
| Use shared modules for cross-cutting | Direct imports between features |
| Keep dependencies unidirectional  | Circular dependencies             |
| Minimize external dependencies    | Add a library for every task      |

---

## Anti-Patterns

| Pattern                | Problem                         |
| ---------------------- | ------------------------------- |
| Feature coupling       | Direct imports between features |
| Utils dumping ground   | Everything in one utils file    |
| Breaking encapsulation | Importing internal files        |
| Dependency sprawl      | Too many third-party packages   |

---

## Principles

- **Import Order**: Built-in, External, Internal, Relative
- **Barrel Exports**: Features expose via index.ts
- **Encapsulation**: Hide implementation details
- **Clear Boundaries**: Features don't import from each other's internals

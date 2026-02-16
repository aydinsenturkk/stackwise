# Documentation Standards

## Comment Philosophy

Code should be self-documenting. Comments explain **why**, not **what**.

---

## When to Comment

| Situation                 | Comment? | Reason             |
| ------------------------- | -------- | ------------------ |
| Non-obvious business rule | Yes      | Explains reasoning |
| Performance optimization  | Yes      | Documents decision |
| Complex algorithm         | Yes      | Aids understanding |
| Obvious code              | No       | Noise              |
| Repeating type/name       | No       | Redundant          |
| Decorative separators     | No       | Clutter            |

---

## JSDoc Rules

### Use JSDoc For

- Public API functions (exported)
- Service layer methods
- Complex utility functions

### Skip JSDoc For

- Internal/private functions
- Self-explanatory methods
- When types already explain

### Format

```typescript
/**
 * Brief description.
 *
 * @param name - Description
 * @returns Description
 * @throws {ErrorType} When condition
 */
```

---

## Principles

- **Self-Documenting First**: Write clear code, then add comments if needed
- **Explain Why**: Code shows what, comments explain why
- **Public APIs Only**: JSDoc for exports, not internals
- **Minimal but Meaningful**: Less is more

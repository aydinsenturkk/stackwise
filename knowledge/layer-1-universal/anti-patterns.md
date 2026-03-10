# Anti-Patterns

## Organization

| Anti-Pattern | Sign | Solution |
| ------------ | ---- | -------- |
| God Object | Service with 50+ methods | Split into focused services |
| Feature Coupling | Direct imports between features | Events or shared services |
| Utils Dumping | 2000+ lines in helpers.ts | Organize by domain |
| Circular Deps | Modules depend on each other | Follow dependency rule |
| Barrel File Bloat | `index.ts` re-exports everything | Import directly from source |
| Premature Abstraction | DRY applied after 1 occurrence | Wait for 3+ duplications |

---

## TypeScript

| Anti-Pattern | Sign | Solution |
| ------------ | ---- | -------- |
| `any` Abuse | `any` sprinkled to silence errors | Use `unknown`, narrow with type guards |
| Type Assertion Overuse | `as` everywhere instead of proper typing | Fix types at the source |
| Overly Complex Generics | Unreadable 5-level nested generics | Simplify, use intermediate types |
| Interface Over-Extension | Interface with 20+ optional fields | Split into smaller, composed types |
| Enum Overuse | Enum for everything | Use union types / `as const` |
| Non-Strict Mode | `strict: false` in tsconfig | Enable strict, fix errors incrementally |

---

## Code Quality

| Anti-Pattern | Sign | Solution |
| ------------ | ---- | -------- |
| Magic Numbers/Strings | Hardcoded values everywhere | Named constants |
| Boolean Parameters | `doThing(true, false, true)` | Use options object |
| Deep Nesting | 4+ levels of indentation | Early returns, extraction |
| Long Functions | 50+ lines in one function | Extract sub-functions |
| Shotgun Surgery | One change requires many files | Consolidate related code |
| Copy-Paste Code | Same logic in 3+ places | Extract shared function |
| Dead Code | Commented-out or unreachable code | Delete it, git has history |
| Inconsistent Returns | Sometimes returns, sometimes throws | Pick one pattern per function |

---

## Async

| Anti-Pattern | Sign | Solution |
| ------------ | ---- | -------- |
| `await` in Loop | Sequential when parallel is safe | `Promise.all` for independent ops |
| Empty Catch | `catch {}` or `catch (e) {}` | Log, rethrow, or handle meaningfully |
| Fire-and-Forget | Calling async without `await` or `.catch()` | Always handle the promise |
| Mixing `.then()` and `await` | Inconsistent async style | Pick one per function |
| Unhandled Rejection | No error path for promises | Always catch at some level |

---

## Dependencies

| Anti-Pattern | Sign | Solution |
| ------------ | ---- | -------- |
| Dependency for Trivial Task | Package for `leftPad`, `isOdd` | Write it yourself |
| Unpinned Versions | `^` or `*` in production deps | Pin exact versions |
| Phantom Dependencies | Using transitive dep directly | Add to own `package.json` |
| Outdated Major Versions | 3+ major versions behind | Schedule regular updates |

---

## General

| Anti-Pattern | Sign | Solution |
| ------------ | ---- | -------- |
| Stringly Typed | Status as `"active"` string, no type safety | Union types or enums |
| Mutable Shared State | Global variable modified from multiple places | Immutable patterns, local state |
| Over-Engineering | Factory-builder-strategy for a simple function | Start simple, refactor when needed |
| Config in Code | Hardcoded URLs, ports, keys | Environment variables |
| Silent Failures | Errors caught and ignored | Fail loudly, log, or propagate |

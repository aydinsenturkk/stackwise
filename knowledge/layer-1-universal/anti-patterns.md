# Anti-Patterns

## Organization

| Anti-Pattern     | Sign                            | Solution                    |
| ---------------- | ------------------------------- | --------------------------- |
| God Object       | Service with 50+ methods        | Split into focused services |
| Feature Coupling | Direct imports between features | Events or shared services   |
| Utils Dumping    | 2000+ lines in helpers.ts       | Organize by domain          |
| Circular Deps    | Modules depend on each other    | Follow dependency rule      |

---

## Architecture

| Anti-Pattern       | Sign                            | Solution                        |
| ------------------ | ------------------------------- | ------------------------------- |
| Mixed Concerns     | Business logic in presentation  | Separate logic from display     |
| Layer Violation    | Skipping architecture layers    | Follow dependency rule          |
| Leaky Abstraction  | Implementation details exposed  | Use interfaces and mappers      |
| Anemic Model       | Logic scattered across services | Put behavior in domain objects  |

---

## Performance

| Anti-Pattern           | Sign                         | Solution                 |
| ---------------------- | ---------------------------- | ------------------------ |
| Premature Optimization | Optimizing without measuring | Measure first            |
| Over-Caching           | Caching trivial operations   | Only cache expensive ops |
| N+1 Queries            | Query per item in a loop     | Batch or join queries    |

---

## Code Quality

| Anti-Pattern           | Sign                        | Solution                  |
| ---------------------- | --------------------------- | ------------------------- |
| Magic Numbers/Strings  | Hardcoded values everywhere | Named constants           |
| Boolean Parameters     | `doThing(true, false, true)`| Use options object        |
| Deep Nesting           | 4+ levels of indentation    | Early returns, extraction |
| Long Functions         | 50+ lines in one function   | Extract sub-functions     |
| Shotgun Surgery        | One change requires many files | Consolidate related code |

---

## Security

| Anti-Pattern          | Sign                     | Solution              |
| --------------------- | ------------------------ | --------------------- |
| Client-Side Security  | Security checks in UI    | Enforce in server     |
| Trusting Client Input | Only client validation   | Validate server-side  |
| Secrets in Code       | API keys in source files | Environment variables |

---

## Testing

| Anti-Pattern            | Sign                        | Solution                    |
| ----------------------- | --------------------------- | --------------------------- |
| Testing Implementation  | Tests break on refactoring  | Test behavior, not internals|
| Shared Test State       | Tests fail when run together| Isolate each test           |
| Ignoring Failing Tests  | Skipped or commented tests  | Fix or remove them          |

---

## Principles

- **Single Responsibility**: One thing per module/function
- **Separation of Concerns**: Logic, data, and presentation are separate
- **Single Source of Truth**: Data lives in one place
- **Measure Before Optimize**: Profile first, fix second
- **Security in Server**: Never trust client

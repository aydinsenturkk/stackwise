# Frontend Anti-Patterns

## Component Anti-Patterns

| Anti-Pattern   | Sign                              | Solution                               |
| -------------- | --------------------------------- | -------------------------------------- |
| God Component  | 500+ lines, many responsibilities | Split into focused components          |
| Prop Drilling  | Props passed through 5+ levels    | Use context or state management        |
| Mixed Concerns | Business logic in presentational  | Apply Container/Presentational pattern |

---

## State Anti-Patterns

| Anti-Pattern       | Sign                                      | Solution                    |
| ------------------ | ----------------------------------------- | --------------------------- |
| Global State Abuse | Form state or UI state in global store    | Keep UI state local         |
| State Duplication  | Same data in local state AND server cache | Single source of truth      |
| Stale Closures     | Missing dependencies in effect callbacks  | Include all dependencies    |

### Global State Abuse

Global state stores should hold only **application-wide** state: authentication, user preferences, feature flags. UI-specific state (form values, modal open/close, accordion expanded) should remain **local** to the component that owns it.

### State Duplication

When data is fetched from the server and stored in a cache, do not copy it into local state. Read from the cache directly. Duplicating creates synchronization bugs.

### Stale Closures

When a callback references external variables, all referenced variables must be listed as dependencies. Missing dependencies cause the callback to capture outdated values.

---

## Organization Anti-Patterns

| Anti-Pattern     | Sign                            | Solution                    |
| ---------------- | ------------------------------- | --------------------------- |
| Feature Coupling | Direct imports between features | Events or shared services   |
| Utils Dumping    | 2000+ lines in helpers file     | Organize by domain          |
| God Objects      | Service with 50+ methods        | Split into focused services |

### Feature Coupling

Features should communicate through events or shared abstractions, never by importing each other's internal modules. If two features need the same data, lift it to a shared service.

---

## Performance Anti-Patterns

| Anti-Pattern           | Sign                          | Solution                |
| ---------------------- | ----------------------------- | ----------------------- |
| Premature Optimization | Memoizing without measuring   | Measure first           |
| Over-Memoization       | Memoizing trivial operations  | Only memoize expensive  |
| Missing Dependencies   | Incomplete dependency arrays  | Include all dependencies|

---

## Security Anti-Patterns

| Anti-Pattern          | Sign                       | Solution                     |
| --------------------- | -------------------------- | ---------------------------- |
| Client-Side Security  | Security checks in client  | Enforce in backend only      |
| Trusting Client Input | Only client validation     | Always validate server-side  |
| Secrets in Client     | API keys in client code    | Use environment variables    |

See frontend-security for the full trust boundary model.

---

## Principles

- **Single Responsibility**: One purpose per component or function
- **Separation of Concerns**: UI, logic, and data live in separate layers
- **Single Source of Truth**: Data lives in exactly one place
- **Measure Before Optimize**: Profile before adding memoization
- **Security in Backend**: Never enforce security in client code

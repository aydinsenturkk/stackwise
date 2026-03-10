# Documentation Standards

## Comment Philosophy

Code should be self-documenting. Comments explain **why**, not **what**.

| Situation | Comment? | Reason |
| --------- | -------- | ------ |
| Non-obvious business rule | Yes | Explains reasoning |
| Performance optimization | Yes | Documents decision |
| Complex algorithm | Yes | Aids understanding |
| Workaround or hack | Yes | Explains why it's needed |
| TODO with issue reference | Yes | Tracks planned work |
| Obvious code | No | Noise |
| Repeating type/name | No | Redundant |
| Decorative separators | No | Clutter |

---

## JSDoc

### When to Use

| Use JSDoc For | Skip JSDoc For |
| ------------- | -------------- |
| Public API functions (exported) | Internal/private functions |
| Service layer methods | Self-explanatory methods |
| Complex utility functions | When types already explain |
| Library/package exports | Simple getters/setters |

### Tags

| Tag | Purpose | Required |
| --- | ------- | -------- |
| Description (first line) | Brief summary | Always |
| `@param` | Parameter description | When not obvious from type |
| `@returns` | Return value description | When not obvious from type |
| `@throws` | Error conditions | When function throws |
| `@example` | Usage example | For complex APIs |
| `@deprecated` | Mark as deprecated | When replacing |

---

## README Structure

Every project should have a README with at minimum:

| Section | Purpose | Required |
| ------- | ------- | -------- |
| Title + description | What this project does (1-2 sentences) | Yes |
| Quick start | How to run locally | Yes |
| Prerequisites | Required tools and versions | Yes |
| Installation | Step-by-step setup | Yes |
| Scripts / Commands | Available npm scripts | Yes |
| Environment variables | Required config with `.env.example` reference | Yes |
| Project structure | High-level directory overview | Recommended |
| Contributing | How to contribute | For open source |
| License | License type | For open source |

### Rules

| Do | Don't |
| -- | ----- |
| Keep README up to date with code changes | Let README drift from reality |
| Show actual commands that work | Write theoretical instructions |
| Link to detailed docs instead of duplicating | Put everything in README |
| Use `.env.example` as source of truth for env vars | List env vars only in README |

---

## Architecture Decision Records (ADR)

Document significant technical decisions that affect the project.

### When to Write an ADR

| Write ADR | Don't Need ADR |
| --------- | -------------- |
| Choosing a framework or major library | Choosing between two utility functions |
| Changing database or infrastructure | Renaming a variable |
| Adopting a new architectural pattern | Routine refactoring |
| Deviating from established conventions | Following existing conventions |

### ADR Format

| Section | Content |
| ------- | ------- |
| Title | Short descriptive name with date |
| Status | Proposed, Accepted, Deprecated, Superseded |
| Context | What situation prompted this decision |
| Decision | What was decided and why |
| Consequences | Trade-offs, what changes as a result |

### Rules

| Do | Don't |
| -- | ----- |
| Store in `docs/adr/` or `docs/decisions/` | Scatter in random locations |
| Number sequentially: `001-use-prisma.md` | Use random naming |
| Keep old ADRs, mark as superseded | Delete old decisions |
| Reference ADR in code comments when relevant | Make decisions without recording |

---

## Changelog

| Convention | Format |
| ---------- | ------ |
| Follow Keep a Changelog | `CHANGELOG.md` at project root |
| Group by version | `## [1.2.0] - 2024-01-15` |
| Categorize entries | Added, Changed, Fixed, Removed, Deprecated, Security |
| Link to PRs/issues | `Fix login timeout (#123)` |

### Rules

| Do | Don't |
| -- | ----- |
| Write for users/consumers of the project | Write for yourself |
| Include breaking changes prominently | Bury breaking changes |
| Update changelog in the same PR as the change | Batch changelog updates separately |
| Use past tense: "Added", "Fixed" | Mix tenses |

---

## API Documentation

| Approach | When | Tool |
| -------- | ---- | ---- |
| OpenAPI / Swagger spec | REST APIs | Generated from code or schema-first |
| GraphQL schema + descriptions | GraphQL APIs | Introspection, GraphiQL |
| tRPC type exports | tRPC APIs | Types are the documentation |
| JSDoc on route handlers | Simple APIs | Minimal overhead |

### Rules

| Do | Don't |
| -- | ----- |
| Document all public endpoints | Leave endpoints undocumented |
| Include request/response examples | Only describe types abstractly |
| Document error responses | Only document happy path |
| Keep docs in sync (generate from code when possible) | Maintain docs manually alongside code |

---

## Documentation Levels

| Level | What | Where |
| ----- | ---- | ----- |
| Code | Why comments, JSDoc on public APIs | In source files |
| Project | README, setup, scripts | `README.md` |
| Architecture | ADRs, system design | `docs/` directory |
| API | Endpoint reference | OpenAPI spec or generated docs |
| Changelog | Version history | `CHANGELOG.md` |

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| No README | New developers can't onboard | Write at least quick start + setup |
| Outdated docs | Worse than no docs — misleading | Update docs in same PR as code |
| Documenting what, not why | Redundant with code | Comments explain reasoning |
| Over-documenting internals | Maintenance burden, stale fast | Only document public APIs |
| No decision records | "Why did we choose X?" unanswerable | Write ADRs for significant decisions |
| Changelog in commit log only | Unusable for consumers | Maintain `CHANGELOG.md` |

---

## Principles

- **Self-documenting first** — write clear code, then add comments if needed
- **Explain why** — code shows what, comments explain reasoning
- **Docs as code** — documentation lives with the code, reviewed in PRs
- **Right level of detail** — README for setup, ADR for decisions, JSDoc for API
- **Keep it current** — outdated docs are worse than no docs

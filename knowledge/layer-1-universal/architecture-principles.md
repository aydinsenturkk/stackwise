# Architecture Principles

## Core Principles

| Principle              | Rule                                       |
| ---------------------- | ------------------------------------------ |
| Separation of Concerns | Each layer/module has a single responsibility |
| Feature-First          | Organize by domain, not by technical layer |
| YAGNI                  | Don't add until needed                     |
| DRY                    | Don't repeat (but avoid premature abstraction) |
| KISS                   | Keep it simple                             |

---

## Layered Architecture

Every application benefits from clear layer separation, regardless of framework.

### Layer Responsibilities

| Layer              | Responsibility                          | Dependencies        |
| ------------------ | --------------------------------------- | ------------------- |
| **Domain**         | Business logic, entities, rules         | None (pure)         |
| **Application**    | Use cases, orchestration, DTOs          | Domain              |
| **Infrastructure** | Database, external services, adapters   | Domain, Application |
| **Presentation**   | Controllers, UI, request/response       | Application         |

### Dependency Rule

- Inner layers MUST NOT know about outer layers
- Domain layer has ZERO external dependencies
- Infrastructure implements domain interfaces
- Presentation only calls the application layer

---

## Feature-First Organization

### Principle

Group files by feature/domain, not by technical type.

```
features/
├── auth/
│   ├── types/
│   ├── services/
│   ├── tests/
│   └── index.ts          # Public API
├── orders/
│   ├── types/
│   ├── services/
│   ├── tests/
│   └── index.ts
└── shared/
    ├── types/
    ├── utils/
    └── index.ts
```

### Rules

- Each feature exposes a public API via `index.ts`
- Features should not import directly from each other's internals
- Shared code lives in a `shared/` module
- Internal structure of a feature can change without affecting consumers

---

## Separation of Concerns

### Logic vs Presentation

| Logic Layer        | Presentation Layer       |
| ------------------ | ------------------------ |
| Business rules     | Rendering / output       |
| Data fetching      | User interaction         |
| State management   | Layout and formatting    |
| Error handling     | Local UI state only      |

### Rules

- Logic components handle data and behavior
- Presentation components handle display only
- A module doing too much (7+ responsibilities) should be split

---

## Encapsulation

| Do                                | Don't                          |
| --------------------------------- | ------------------------------ |
| Expose via public API (index.ts)  | Import internal files directly |
| Hide implementation details       | Expose ORM entities            |
| Use interfaces at boundaries      | Depend on implementations      |
| Keep module internals private     | Let consumers reach into guts  |

---

## Anti-Patterns

| Anti-Pattern        | Problem                        | Solution                 |
| ------------------- | ------------------------------ | ------------------------ |
| God Object          | Single module does everything  | Split by responsibility  |
| Circular Dependency | Modules depend on each other   | Follow dependency rule   |
| Leaky Abstraction   | Implementation details leak    | Use interfaces/mappers   |
| Feature Coupling    | Direct imports between features| Use events or shared API |
| Layer Violation     | Skipping layers                | Follow layer boundaries  |

---

## Principles

- **Separation of Concerns**: Each layer has one job
- **Feature-First**: Organize by domain, not by type
- **Dependency Rule**: Always point inward
- **Encapsulation**: Hide internals, expose APIs
- **YAGNI**: Build what you need now, not what you might need later

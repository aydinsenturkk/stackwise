# Backend Architecture Patterns

> Backend-specific architectural patterns. See Layer 1 for general software architecture principles.

## Domain-Driven Design (DDD)

### Layer Structure

| Layer              | Responsibility                          | Dependencies        |
| ------------------ | --------------------------------------- | ------------------- |
| **Domain**         | Business logic, entities, value objects | None (pure)         |
| **Application**    | Use cases, orchestration, DTOs          | Domain              |
| **Infrastructure** | Database, external services, adapters   | Domain, Application |
| **Presentation**   | Controllers, request/response handling  | Application         |

### Dependency Rule

- Inner layers MUST NOT know about outer layers
- Domain layer has ZERO external dependencies
- Infrastructure implements domain interfaces
- Presentation only calls application layer

### Domain Layer Rules

| Do                                      | Don't                         |
| --------------------------------------- | ----------------------------- |
| Use pure language constructs            | Import frameworks             |
| Encapsulate business rules in entities  | Put logic in services         |
| Use factory methods for creation        | Use public constructors       |
| Raise domain events for side effects    | Call external services        |
| Use value objects for concepts          | Use primitives everywhere     |
| Validate invariants in entity           | Validate in controller        |

### Application Layer Rules

| Do                           | Don't                     |
| ---------------------------- | ------------------------- |
| One use case = one handler   | Create god services       |
| Depend on interfaces (ports) | Depend on implementations |
| Orchestrate domain objects   | Implement business logic  |
| Handle transactions here     | Handle in domain          |
| Map DTOs to domain objects   | Pass DTOs to domain       |

### Infrastructure Layer Rules

| Do                             | Don't                     |
| ------------------------------ | ------------------------- |
| Implement domain interfaces    | Define new interfaces     |
| Use mappers for conversion     | Expose ORM entities       |
| Handle external service errors | Let errors propagate      |
| Configure retry policies       | Ignore transient failures |

## CQRS (Command Query Responsibility Segregation)

### When to Use

- Read and write patterns differ significantly
- Need different optimization for reads vs writes
- Complex reporting requirements

### Design

- **Commands:** Write operations, return void or ID only
- **Queries:** Read operations, return DTOs directly

## Anti-Patterns

| Anti-Pattern        | Problem                        | Solution                 |
| ------------------- | ------------------------------ | ------------------------ |
| Anemic Domain Model | Logic scattered in services    | Put behavior in entities |
| God Service         | Single service does everything | Split by aggregate       |
| Leaky Abstraction   | ORM types in domain            | Use mappers              |
| Circular Dependency | Layers depend on each other    | Follow dependency rule   |
| Transaction Script  | Procedural code in services    | Use domain model         |

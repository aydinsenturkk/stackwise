# Backend Architecture Patterns

> Backend-specific architectural patterns. See Layer 1 for general software architecture principles.

> **Architecture Selection:** Check `PROJECT.md` for the chosen backend architecture model. If specified, follow that model's rules exclusively. If not specified, default to Layered for simple projects or DDD for complex domains.

## Architecture Models

| Model | Best For | Complexity |
|-------|----------|------------|
| **Layered (Classic)** | CRUD apps, simple APIs, prototypes | Low |
| **DDD** | Complex business domains, rich logic | High |
| **Hexagonal (Ports & Adapters)** | Apps with many external integrations | Medium-High |
| **Clean Architecture** | Long-lived apps, strict testability | High |
| **Modular Monolith** | Large apps, future microservice candidates | High |

---

## Layered Architecture (Classic)

Simple three-layer architecture. Best for CRUD-heavy apps with straightforward business logic.

```
Controller → Service → Repository → Database
```

### Layer Structure

| Layer | Responsibility | Contains |
|-------|---------------|----------|
| **Controller** | HTTP handling, validation, response formatting | Route handlers, DTOs, guards |
| **Service** | Business logic, orchestration | Business rules, transaction management |
| **Repository** | Data access, queries | ORM calls, raw queries, data mapping |

### Folder Structure

```
src/
  [resource]/
    [resource].controller.ts
    [resource].service.ts
    [resource].repository.ts
    [resource].module.ts
    dto/
      create-[resource].dto.ts
      update-[resource].dto.ts
    entities/
      [resource].entity.ts
```

### Rules

| Do | Don't |
|---|---|
| Keep controllers thin — validate and delegate | Put business logic in controllers |
| Services call repositories, never raw DB | Services import ORM directly |
| One service per resource/domain area | Create god services |
| Repository returns domain objects | Return raw DB rows from repository |
| Use DTOs at controller boundary | Pass raw request body to services |

### When to Use

- CRUD-dominant applications
- Simple REST APIs with minimal business logic
- Prototypes and MVPs
- Small team, fast iteration

---

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

---

## Hexagonal Architecture (Ports & Adapters)

Core domain is at the center, communicating with the outside world through ports (interfaces) and adapters (implementations).

```
         ┌─────────────────────────────┐
         │         Adapters            │
         │  ┌──────────────────────┐   │
         │  │       Ports          │   │
         │  │  ┌───────────────┐   │   │
         │  │  │  Core Domain  │   │   │
         │  │  └───────────────┘   │   │
         │  └──────────────────────┘   │
         └─────────────────────────────┘
```

### Structure

| Concept | Role | Example |
|---------|------|---------|
| **Core** | Business logic, domain model | Entities, value objects, domain services |
| **Ports (inbound)** | Interfaces the core exposes | `CreateOrderUseCase`, `GetUserPort` |
| **Ports (outbound)** | Interfaces the core needs | `OrderRepository`, `PaymentGateway`, `EmailSender` |
| **Adapters (inbound)** | Drive the application | REST controller, GraphQL resolver, CLI handler |
| **Adapters (outbound)** | Driven by the application | Prisma repository, Stripe adapter, SendGrid adapter |

### Folder Structure

```
src/
  core/
    domain/
      [entity].ts
      [value-object].ts
    ports/
      inbound/
        [use-case].port.ts
      outbound/
        [repository].port.ts
        [external-service].port.ts
    services/
      [domain-service].ts
  adapters/
    inbound/
      rest/
        [resource].controller.ts
      graphql/
        [resource].resolver.ts
    outbound/
      persistence/
        [entity].repository.ts
      external/
        [service].adapter.ts
  config/
    modules.ts
```

### Rules

- Core has **zero** framework imports — pure TypeScript only
- All dependencies point inward (adapters → ports → core)
- Ports are interfaces, adapters are implementations
- Swapping an adapter (e.g., Prisma → Drizzle) requires no core changes
- Test core logic with in-memory adapter stubs

### When to Use

- Apps with many external integrations (payment, email, storage, queues)
- When you need to swap infrastructure without touching business logic
- When testability of core logic is a top priority

---

## Clean Architecture

Strict concentric layers with the dependency rule: source code dependencies only point inward.

### Layer Structure

| Layer (outer → inner) | Contains | Depends On |
|----------------------|----------|------------|
| **Frameworks & Drivers** | Express/NestJS, Prisma, external libs | Interface Adapters |
| **Interface Adapters** | Controllers, presenters, gateways | Use Cases |
| **Use Cases** | Application business rules | Entities |
| **Entities** | Enterprise business rules | Nothing |

### Folder Structure

```
src/
  entities/
    [entity].ts                   # Enterprise business rules
    [value-object].ts
  use-cases/
    [use-case]/
      [use-case].ts               # Application business rule
      [use-case].spec.ts
      [input-dto].ts
      [output-dto].ts
  interface-adapters/
    controllers/
      [resource].controller.ts
    gateways/
      [resource].gateway.ts       # Interface for external data
    presenters/
      [resource].presenter.ts     # Format output for delivery
  frameworks/
    database/
      [entity].repository.ts     # Implements gateway interface
    web/
      routes.ts
    config/
```

### Rules

| Rule | Description |
|------|-------------|
| Dependency Rule | Inner layers never import from outer layers |
| Entity Independence | Entities have no framework dependencies |
| Use Case Single Responsibility | One use case = one file = one business operation |
| Interface Segregation | Gateways define only the methods the use case needs |
| Boundary DTOs | Each layer boundary has its own input/output DTOs |

### When to Use

- Long-lived applications expected to outlive their frameworks
- Projects where strict testability at every layer is required
- Teams that want maximum decoupling between business logic and infrastructure

---

## Modular Monolith

A monolith structured as independent modules with clear boundaries. Each module is a potential microservice.

### Structure

```
src/
  modules/
    auth/
      auth.module.ts
      domain/                     # Module's domain model
      application/                # Module's use cases
      infrastructure/             # Module's adapters
      interface/                  # Module's controllers
      events/                     # Events this module publishes
      index.ts                    # Public API — only export contracts
    billing/
      billing.module.ts
      domain/
      application/
      infrastructure/
      interface/
      events/
      index.ts
    notifications/
      ...
  shared/
    kernel/                       # Shared value objects, base classes
    events/                       # Event bus interface
    types/                        # Cross-module types
  infrastructure/
    event-bus/                    # Event bus implementation
    database/                    # Shared DB config
```

### Rules

| Rule | Description |
|------|-------------|
| Module Isolation | No direct imports between module internals |
| Public API Only | Modules communicate only through their `index.ts` exports |
| Event-Driven Communication | Cross-module side effects use domain events |
| Own Data | Each module owns its tables/collections — no shared tables |
| Independent Deployment | Each module should be extractable to a microservice |

### Module Communication

| Method | When to Use |
|--------|------------|
| **Public API (sync)** | Module A needs data from Module B synchronously |
| **Domain Events (async)** | Module A triggers a side effect in Module B |
| **Shared Kernel** | Common value objects both modules need (Money, Email, UserId) |

### When to Use

- Large applications with 5+ bounded contexts
- Teams preparing for eventual microservice migration
- When you want microservice boundaries without operational complexity
- Multiple teams working on different business domains

---

## Anti-Patterns

| Anti-Pattern        | Problem                        | Solution                 |
| ------------------- | ------------------------------ | ------------------------ |
| Anemic Domain Model | Logic scattered in services    | Put behavior in entities |
| God Service         | Single service does everything | Split by aggregate       |
| Leaky Abstraction   | ORM types in domain            | Use mappers              |
| Circular Dependency | Layers depend on each other    | Follow dependency rule   |
| Transaction Script  | Procedural code in services    | Use domain model         |

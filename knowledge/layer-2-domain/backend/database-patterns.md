# Database Patterns

> Framework-agnostic database access patterns for backend applications.

## Repository Pattern

### Purpose

- Abstract data access from domain
- Enable testing with mocks
- Hide ORM implementation details

### Rules

| Do                               | Don't                    |
| -------------------------------- | ------------------------ |
| Define interface in domain layer | Define in infrastructure |
| Return domain entities           | Return ORM models        |
| Use meaningful method names      | Use generic CRUD names   |
| One repository per aggregate     | One repository per table |
| Implement in infrastructure      | Implement in domain      |

### Method Naming

| Preferred            | Avoid                        |
| -------------------- | ---------------------------- |
| `findById(id)`       | `get(id)`                    |
| `findByEmail(email)` | `getByField('email', value)` |
| `save(entity)`       | `create()` / `update()`      |
| `remove(entity)`     | `delete(id)`                 |
| `exists(id)`         | `count(id) > 0`              |

## Unit of Work

### Purpose

- Manage transactions across repositories
- Ensure atomicity of operations
- Coordinate persistence of multiple aggregates

### When to Use

- Multiple aggregates modified in one use case
- Need rollback on failure
- Cross-aggregate consistency required

## Transaction Rules

| Do                                      | Don't                     |
| --------------------------------------- | ------------------------- |
| Start transaction in application layer  | Start in controller       |
| Keep transactions short                 | Hold transactions long    |
| Use optimistic locking for concurrency  | Ignore concurrency        |
| Retry on transient failures             | Fail immediately          |
| One aggregate per transaction (ideally) | Multiple aggregates often |

## Mapper Pattern

### Purpose

- Convert between domain entities and persistence models
- Isolate ORM from domain

### Rules

| Do                                        | Don't            |
| ----------------------------------------- | ---------------- |
| Create dedicated mapper class             | Map inline       |
| Two-way mapping (toDomain, toPersistence) | One-way only     |
| Handle nested objects                     | Flatten everything |
| Map value objects properly                | Ignore value objects |

## Query Optimization

| Strategy            | When to Use              |
| ------------------- | ------------------------ |
| Eager loading       | Always need related data |
| Lazy loading        | Rarely need related data |
| Projection (select) | Need subset of fields    |
| Pagination          | Large result sets        |
| Indexing            | Frequent query patterns  |

## Soft Delete

| Do                            | Don't                 |
| ----------------------------- | --------------------- |
| Add `deletedAt` timestamp     | Use boolean flag      |
| Filter in repository methods  | Filter in every query |
| Consider hard delete for GDPR | Keep all data forever |
| Index `deletedAt` column      | Forget indexing       |

## Audit Logging

| Field       | Purpose                |
| ----------- | ---------------------- |
| `createdAt` | Record creation time   |
| `updatedAt` | Last modification time |
| `createdBy` | User who created       |
| `updatedBy` | User who last modified |
| `version`   | Optimistic locking     |

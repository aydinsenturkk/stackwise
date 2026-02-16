# Event-Driven Architecture

> Framework-agnostic event-driven patterns for backend applications.

## Event Types

| Type                  | Origin          | Purpose                     | Example                |
| --------------------- | --------------- | --------------------------- | ---------------------- |
| **Domain Event**      | Aggregate       | Business fact occurred      | OrderPlaced            |
| **Integration Event** | Bounded context | Cross-service communication | OrderPlacedIntegration |
| **Application Event** | Use case        | Internal orchestration      | OrderProcessingStarted |

## Domain Events

### Naming

| Pattern                     | Example                         |
| --------------------------- | ------------------------------- |
| `{Entity}{PastTenseAction}` | `OrderPlaced`, `UserRegistered` |
| `{Entity}{State}Changed`    | `OrderStatusChanged`            |

### Rules

| Do                        | Don't                   |
| ------------------------- | ----------------------- |
| Name in past tense        | Future or present tense |
| Include all relevant data | Reference only          |
| Make immutable            | Mutable events          |
| Include timestamp         | No timing info          |
| Include aggregate ID      | Missing identity        |

### Event Structure

| Field         | Required | Description             |
| ------------- | -------- | ----------------------- |
| `eventId`     | Yes      | Unique event identifier |
| `eventType`   | Yes      | Event name/type         |
| `aggregateId` | Yes      | Source aggregate ID     |
| `occurredAt`  | Yes      | When event happened     |
| `payload`     | Yes      | Event data              |
| `metadata`    | No       | Correlation ID, user ID |

## Event Handling

### Rules

| Do                         | Don't                  |
| -------------------------- | ---------------------- |
| Handle idempotently        | Assume single delivery |
| Process asynchronously     | Block on handlers      |
| Log all events             | Silent processing      |
| Handle failures gracefully | Let handler crash      |
| Keep handlers focused      | Multiple concerns      |

### Handler Patterns

| Pattern           | Use When                  |
| ----------------- | ------------------------- |
| **Immediate**     | Same transaction required |
| **Async (Queue)** | Decoupled processing      |
| **Saga**          | Multi-step workflows      |

## Event Sourcing (Optional)

### When to Use

| Good Fit              | Poor Fit            |
| --------------------- | ------------------- |
| Audit requirements    | Simple CRUD         |
| Complex domain        | High write volume   |
| Time-travel needed    | Storage constraints |
| Event replay required | Simple queries      |

## Outbox Pattern

### Purpose

- Ensure events are published after transaction commits
- Prevent lost events on failure
- Guarantee at-least-once delivery

### Rules

| Do                              | Don't                 |
| ------------------------------- | --------------------- |
| Store event in same transaction | Publish before commit |
| Use polling or CDC              | Direct publish        |
| Track published events          | No delivery tracking  |
| Retry failed publishes          | Ignore failures       |

## Saga Pattern

### Purpose

- Coordinate distributed transactions
- Handle long-running processes
- Manage compensating actions

### Rules

| Do                          | Don't           |
| --------------------------- | --------------- |
| Define compensating actions | Ignore rollback |
| Track saga state            | Stateless sagas |
| Handle partial failures     | All-or-nothing  |
| Timeout long sagas          | Run forever     |

## Event Bus Delivery Guarantees

| Guarantee     | Description           | Use When               |
| ------------- | --------------------- | ---------------------- |
| At-most-once  | May lose events       | Metrics, logs          |
| At-least-once | May duplicate         | Most business events   |
| Exactly-once  | No loss or duplicates | Financial transactions |

## Anti-Patterns

| Don't                      | Problem               |
| -------------------------- | --------------------- |
| Events with commands       | Wrong semantics       |
| Huge event payloads        | Performance, coupling |
| Circular event chains      | Infinite loops        |
| Synchronous event handling | Blocking, coupling    |
| Events without versioning  | Breaking changes      |

# Backend Naming Conventions

> Backend-specific naming patterns organized by DDD layers. See Layer 1 for universal naming conventions.

## File Suffixes by Layer

| Suffix           | Layer          | Purpose                  |
| ---------------- | -------------- | ------------------------ |
| `.entity.ts`     | Domain         | Aggregate root           |
| `.vo.ts`         | Domain         | Value object             |
| `.event.ts`      | Domain         | Domain event             |
| `.repository.ts` | Domain         | Repository interface     |
| `.command.ts`    | Application    | Write operation input    |
| `.query.ts`      | Application    | Read operation input     |
| `.handler.ts`    | Application    | Command/Query handler    |
| `.dto.ts`        | Application    | Data transfer object     |
| `.controller.ts` | Presentation   | HTTP controller          |
| `.mapper.ts`     | Infrastructure | Entity mapper            |
| `.adapter.ts`    | Infrastructure | External service adapter |
| `.spec.ts`       | Test           | Test file                |

## File Naming

| Type                 | Pattern    | Example                          |
| -------------------- | ---------- | -------------------------------- |
| Module folder        | kebab-case | `order-management/`              |
| Domain entity        | kebab-case | `order.entity.ts`                |
| Value object         | kebab-case | `order-status.vo.ts`             |
| Repository interface | kebab-case | `order.repository.ts`            |
| Repository impl      | kebab-case | `{impl}-order.repository.ts`     |
| Command/Query        | kebab-case | `create-order.command.ts`        |
| Handler              | kebab-case | `create-order.handler.ts`        |
| Controller           | kebab-case | `order.controller.ts`            |
| DTO                  | kebab-case | `create-order.dto.ts`            |
| Mapper               | kebab-case | `order.mapper.ts`                |
| Test file            | kebab-case | `order.entity.spec.ts`           |

## Class Naming

| Pattern                   | Example                     |
| ------------------------- | --------------------------- |
| Repository interface      | `IOrderRepository`          |
| Repository implementation | `{Impl}OrderRepository`     |
| Service                   | `OrderService`              |
| Handler                   | `CreateOrderHandler`        |
| Controller                | `OrderController`           |
| Mapper                    | `OrderMapper`               |
| Adapter                   | `StripePaymentAdapter`      |
| Exception                 | `OrderNotFoundException`    |

## Method Naming

| Action          | Pattern             | Example                    |
| --------------- | ------------------- | -------------------------- |
| Create          | `create`, `new`     | `createOrder()`            |
| Read single     | `find`, `get`       | `findById()`, `getOrder()` |
| Read multiple   | `findAll`, `list`   | `findAllByUser()`          |
| Update          | `update`, `change`  | `updateStatus()`           |
| Delete          | `remove`, `delete`  | `removeOrder()`            |
| Check existence | `exists`, `has`     | `existsById()`             |
| Validate        | `validate`, `check` | `validateOrder()`          |
| Convert         | `to`, `from`, `map` | `toDTO()`, `fromEntity()`  |

### Boolean Methods

| Good              | Bad            |
| ----------------- | -------------- |
| `isActive()`      | `active()`     |
| `hasItems()`      | `items()`      |
| `canCancel()`     | `cancelable()` |
| `shouldProcess()` | `process()`    |

## Variable Naming

| Type           | Convention                | Example           |
| -------------- | ------------------------- | ----------------- |
| Local variable | camelCase                 | `orderTotal`      |
| Constant       | UPPER_SNAKE_CASE          | `MAX_RETRY_COUNT` |
| Private field  | camelCase with underscore | `_status`         |
| Boolean        | is/has/can/should prefix  | `isValid`         |

### Common Abbreviations

| Allowed  | Avoid                |
| -------- | -------------------- |
| `id`     | `identifier`         |
| `dto`    | `dataTransferObject` |
| `repo`   | `rp`                 |
| `config` | `cfg`                |
| `params` | `p`                  |

## Database Naming

### Tables

| Convention        | Example                 |
| ----------------- | ----------------------- |
| Plural snake_case | `orders`, `order_items` |
| Join tables       | `user_roles`            |

### Columns

| Convention  | Example                      |
| ----------- | ---------------------------- |
| snake_case  | `created_at`, `order_status` |
| Foreign key | `{table}_id` (e.g. `user_id`) |
| Boolean     | `is_` or `has_` prefix (e.g. `is_active`) |

## API Endpoint Naming

| Method         | Pattern                    | Example              |
| -------------- | -------------------------- | -------------------- |
| GET collection | `/resources`               | `/orders`            |
| GET single     | `/resources/{id}`          | `/orders/123`        |
| POST create    | `/resources`               | `/orders`            |
| PUT replace    | `/resources/{id}`          | `/orders/123`        |
| PATCH update   | `/resources/{id}`          | `/orders/123`        |
| DELETE         | `/resources/{id}`          | `/orders/123`        |
| Action         | `/resources/{id}/{action}` | `/orders/123/cancel` |

## Anti-Patterns

| Don't           | Do               |
| --------------- | ---------------- |
| `OrderMgr`      | `OrderService`   |
| `doProcess()`   | `process()`      |
| `data`, `info`  | Specific names   |
| `temp`, `tmp`   | Meaningful names |
| `handleStuff()` | `processOrder()` |

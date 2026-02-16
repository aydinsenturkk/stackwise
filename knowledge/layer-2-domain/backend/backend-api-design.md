# Backend API Design

> Backend-specific API implementation patterns. See Layer 1 api-design for REST conventions, pagination, filtering, and versioning.

## Controller Structure

### Responsibilities

| Controller Does                | Controller Does NOT              |
| ------------------------------ | -------------------------------- |
| Parse and validate request     | Implement business logic         |
| Map request to command/query   | Access database directly         |
| Delegate to application layer  | Handle transactions              |
| Map result to HTTP response    | Throw domain exceptions to client |
| Set HTTP status code           | Orchestrate multiple use cases   |

### Route Organization

| Pattern                          | Example                        |
| -------------------------------- | ------------------------------ |
| One controller per resource      | `OrderController`              |
| Group related actions            | CRUD + custom actions together |
| Separate read/write controllers  | `OrderQueryController`, `OrderCommandController` |

## Middleware Pipeline

### Request Lifecycle (Typical Order)

| Stage              | Purpose                        |
| ------------------ | ------------------------------ |
| 1. Global middleware | Logging, correlation ID, CORS |
| 2. Authentication  | Verify token, attach user      |
| 3. Rate limiting   | Throttle requests              |
| 4. Authorization   | Check permissions/roles        |
| 5. Validation      | Validate request body/params   |
| 6. Controller      | Handle request                 |
| 7. Exception filter | Transform errors to response  |
| 8. Response        | Serialize and send             |

### Guard/Middleware Pattern

| Do                                | Don't                        |
| --------------------------------- | ---------------------------- |
| Chain guards for auth + authz     | Combine auth logic in one    |
| Fail fast on unauthorized         | Continue processing          |
| Attach user context to request    | Re-fetch user in each handler |
| Use declarative permission checks | Inline permission logic      |

## Request Lifecycle

### Input Handling

| Source          | Use For                  | Example                       |
| --------------- | ------------------------ | ----------------------------- |
| Path params     | Resource identification  | `/orders/{id}`                |
| Query params    | Filtering, pagination    | `?status=active&page=1`      |
| Request body    | Create/update payloads   | JSON body                     |
| Headers         | Auth, content negotiation | `Authorization`, `Accept`    |

### Output Formatting

| Do                              | Don't                    |
| ------------------------------- | ------------------------ |
| Wrap responses in data envelope | Return raw arrays        |
| Include metadata for lists      | No pagination info       |
| Consistent null handling        | Mixed null/undefined     |
| Include timestamps              | No audit info            |
| Use camelCase in JSON           | Mix casing styles        |

## Response Formatting

### Success Responses

| Status | When                       | Body                |
| ------ | -------------------------- | ------------------- |
| 200    | Successful GET, PUT, PATCH | `{ data: ... }`     |
| 201    | Successful POST (created)  | `{ data: ... }` + Location header |
| 204    | Successful DELETE          | No body             |

### Error Responses

| Field       | Required | Description                       |
| ----------- | -------- | --------------------------------- |
| `code`      | Yes      | Machine-readable error code       |
| `message`   | Yes      | Human-readable message            |
| `details`   | No       | Field-level errors for validation |
| `timestamp` | Yes      | ISO 8601 format                   |
| `path`      | Yes      | Request path                      |

## Request/Response Conventions

| Do                                | Don't                |
| --------------------------------- | -------------------- |
| Use camelCase in JSON             | Use snake_case       |
| Consistent date format (ISO 8601) | Multiple formats     |
| Include Content-Type header       | Assume JSON          |
| Consistent null handling          | Mixed null/undefined |

## Rate Limiting Headers

| Header                  | Description          |
| ----------------------- | -------------------- |
| `X-RateLimit-Limit`     | Max requests allowed |
| `X-RateLimit-Remaining` | Requests remaining   |
| `X-RateLimit-Reset`     | Reset timestamp      |
| `Retry-After`           | Seconds until retry  |

## Anti-Patterns

| Don't                              | Do                                |
| ---------------------------------- | --------------------------------- |
| Business logic in controllers      | Delegate to application layer     |
| Database queries in controllers    | Use repository through use cases  |
| Different error formats per route  | Global consistent error format    |
| Manual serialization in each route | Centralized response formatting   |
| Skip input validation              | Validate at entry point           |

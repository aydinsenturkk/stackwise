# Backend Error Handling

> Backend-specific error handling patterns. See Layer 1 for universal error handling principles.

## Exception Categories

| Category           | Origin                  | HTTP Status   | Example                           |
| ------------------ | ----------------------- | ------------- | --------------------------------- |
| **Domain**         | Business rule violation | 400, 404, 409 | OrderNotFound, InsufficientStock  |
| **Application**    | Use case failure        | 400, 401, 403 | Unauthorized, ValidationFailed    |
| **Infrastructure** | External system failure | 500, 502, 503 | DatabaseError, ServiceUnavailable |

## Exception Naming

**Pattern:** `{Entity}{Problem}Exception`

| Do                           | Don't            |
| ---------------------------- | ---------------- |
| `OrderNotFoundException`     | `OrderError`     |
| `InsufficientStockException` | `StockException` |
| `InvalidOrderStateException` | `BadStateError`  |

## Error Response Structure

| Field       | Required | Description                       |
| ----------- | -------- | --------------------------------- |
| `code`      | Yes      | Machine-readable error code       |
| `message`   | Yes      | Human-readable message            |
| `details`   | No       | Field-level errors for validation |
| `timestamp` | Yes      | ISO 8601 format                   |
| `path`      | Yes      | Request path                      |

## HTTP Status Mapping

| Exception Type          | Status Code |
| ----------------------- | ----------- |
| Validation errors       | 400         |
| Authentication required | 401         |
| Permission denied       | 403         |
| Resource not found      | 404         |
| Business rule conflict  | 409         |
| Rate limit exceeded     | 429         |
| Internal server error   | 500         |
| External service error  | 502         |
| Service unavailable     | 503         |

## Global Exception Handling Strategy

| Do                                    | Don't                             |
| ------------------------------------- | --------------------------------- |
| Use global exception filter           | Handle in each controller         |
| Create specific exception classes     | Use generic Error                 |
| Include error codes                   | Return only messages              |
| Log all exceptions with context       | Log without request info          |
| Sanitize error messages in production | Expose stack traces               |
| Translate domain exceptions to HTTP   | Return domain exceptions directly |
| Use consistent error format           | Different formats per endpoint    |

## Logging Levels

| Level | When to Use                                  |
| ----- | -------------------------------------------- |
| ERROR | Unhandled exceptions, system failures        |
| WARN  | Handled exceptions, business rule violations |
| INFO  | Request/response summary                     |
| DEBUG | Detailed execution flow                      |

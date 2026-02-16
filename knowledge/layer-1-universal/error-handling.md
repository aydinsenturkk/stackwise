# Error Handling

## Error Classification

| Category           | Origin                  | HTTP Status   | Example                           |
| ------------------ | ----------------------- | ------------- | --------------------------------- |
| **Domain**         | Business rule violation | 400, 404, 409 | OrderNotFound, InsufficientStock  |
| **Application**    | Use case failure        | 400, 401, 403 | Unauthorized, ValidationFailed    |
| **Infrastructure** | External system failure | 500, 502, 503 | DatabaseError, ServiceUnavailable |

---

## Exception Naming

**Pattern:** `{Entity}{Problem}Exception`

| Good                         | Bad              |
| ---------------------------- | ---------------- |
| `OrderNotFoundException`     | `OrderError`     |
| `InsufficientStockException` | `StockException` |
| `InvalidOrderStateException` | `BadStateError`  |

---

## Error Response Structure

| Field       | Required | Description                       |
| ----------- | -------- | --------------------------------- |
| `code`      | Yes      | Machine-readable error code       |
| `message`   | Yes      | Human-readable message            |
| `details`   | No       | Field-level errors for validation |
| `timestamp` | Yes      | ISO 8601 format                   |
| `path`      | No       | Request path                      |

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string;
  };
}
```

---

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

---

## User-Facing Error Messages

| Do                         | Don't             |
| -------------------------- | ----------------- |
| Clear, actionable language | Technical jargon  |
| Explain what went wrong    | "Error 500"       |
| Suggest next steps         | Leave user stuck  |

| Bad                 | Good                                                  |
| ------------------- | ----------------------------------------------------- |
| "Error: 404"        | "Page not found. Check the URL or go home."           |
| "Network error"     | "Connection lost. Check your internet and try again." |
| "Validation failed" | "Email format is invalid."                            |

---

## Retry Strategies

| Strategy            | Use Case              |
| ------------------- | --------------------- |
| Immediate retry     | Transient failures    |
| Exponential backoff | Rate limiting         |
| User-triggered      | After error displayed |
| No retry            | Client errors (4xx)   |

---

## Logging Rules

### What to Log

| Log                 | Don't Log           |
| ------------------- | ------------------- |
| Error message       | User passwords      |
| Stack trace         | Personal data (PII) |
| Request context     | Tokens/secrets      |
| Timestamp           | Full request body   |
| Correlation ID      | Sensitive headers   |

### Severity Levels

| Level | When to Use                          |
| ----- | ------------------------------------ |
| ERROR | Unhandled exceptions, system failures |
| WARN  | Handled exceptions, degraded service |
| INFO  | Business events, request summary     |
| DEBUG | Detailed execution flow              |

---

## Error Handling Rules

| Do                                    | Don't                             |
| ------------------------------------- | --------------------------------- |
| Create specific exception classes     | Use generic Error                 |
| Include error codes                   | Return only messages              |
| Log all exceptions with context       | Log without request info          |
| Sanitize error messages in production | Expose stack traces               |
| Translate domain exceptions to HTTP   | Return domain exceptions directly |
| Use consistent error format           | Different formats per endpoint    |

---

## Recovery Patterns

| Pattern      | When                  |
| ------------ | --------------------- |
| Retry button | Network failures      |
| Refresh page | State corruption      |
| Fallback UI  | Non-critical features |
| Cached data  | Offline mode          |
| Redirect     | Auth failures         |

---

## Principles

- **Fail Gracefully**: Never show a blank screen or raw stack trace
- **Be Helpful**: Tell the user what to do next
- **Isolate Failures**: One failure should not crash the system
- **Log Everything**: Include context for debugging production issues
- **Respect Privacy**: Never log sensitive data
- **Consistent Format**: Same error structure across all endpoints

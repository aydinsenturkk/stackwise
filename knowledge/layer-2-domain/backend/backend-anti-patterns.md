# Backend Anti-Patterns

> See Layer 1 anti-patterns.md for universal anti-patterns.

## Architecture

| Anti-Pattern          | Sign                                  | Solution                           |
| --------------------- | ------------------------------------- | ---------------------------------- |
| Fat Controller        | Business logic in controller          | Move to service/use case layer     |
| Anemic Domain Model   | Entities are data bags, logic in services | Put behavior in domain entities |
| Missing Layers        | Controller directly accesses DB       | Add service and repository layers  |

---

## Database

| Anti-Pattern            | Sign                                | Solution                          |
| ----------------------- | ----------------------------------- | --------------------------------- |
| N+1 Queries             | Loop fetching related records       | Eager load or batch with IN       |
| Missing Indexes         | Slow queries on filtered columns    | Add indexes based on query plans  |
| Raw SQL with User Input | String concatenation in queries     | Parameterized queries / ORM       |
| No Migrations           | Manual schema changes               | Version-controlled migrations     |
| Shared Mutable State    | Multiple services writing same table| Define aggregate ownership        |
| SELECT *                | Fetching all columns always         | Select only needed fields         |

---

## API Design

| Anti-Pattern            | Sign                                | Solution                          |
| ----------------------- | ----------------------------------- | --------------------------------- |
| Chatty API              | Client makes 10+ calls for one view | Aggregate endpoint or BFF         |
| Unbounded List          | GET /items returns all records      | Require pagination                |
| Leaking Internals       | DB schema exposed in response       | Use DTOs / response mapping       |
| Inconsistent Errors     | Different error shapes per endpoint | Standardize error response format |
| No Versioning           | Breaking changes affect all clients | Version API (URL or header)       |
| No Rate Limiting        | Vulnerable to abuse                 | Add rate limiting per endpoint    |

---

## Security

| Anti-Pattern             | Sign                               | Solution                         |
| ------------------------ | ---------------------------------- | -------------------------------- |
| Logging Sensitive Data   | Passwords/tokens in logs           | Sanitize log output              |
| Missing Auth on Endpoint | Some endpoints skip auth check     | Default deny, whitelist public   |
| Trust Client Input       | No server-side validation          | Validate at entry point          |
| Plain Text Secrets in DB | Passwords stored without hashing   | bcrypt/argon2 hashing            |

---

## Error Handling

| Anti-Pattern           | Sign                                 | Solution                         |
| ---------------------- | ------------------------------------ | -------------------------------- |
| Generic Error Messages | "Something went wrong" for all errors| Specific, actionable messages    |
| Stack Trace in Response| Full error details sent to client    | Sanitize in production           |
| No Error Classification| All errors treated the same          | Distinguish operational vs programmer |
| Missing Error Context  | Error logged without request context | Include correlation ID, user, path|

---

## Async & Concurrency

| Anti-Pattern              | Sign                              | Solution                         |
| ------------------------- | --------------------------------- | -------------------------------- |
| Blocking Event Loop       | CPU work in request handler       | Worker threads or job queue      |
| No Timeout on External    | HTTP calls hang indefinitely      | Set timeout on all external calls|
| No Graceful Shutdown      | Active requests dropped on deploy | Drain connections before exit    |

---

## Testing

| Anti-Pattern             | Sign                               | Solution                         |
| ------------------------ | ---------------------------------- | -------------------------------- |
| Testing Implementation   | Mocking internal methods           | Test behavior via public API     |
| Shared Test Database     | Tests interfere with each other    | Isolated DB per test run         |
| No Integration Tests     | Only unit tests on mocked layers   | Test real DB + HTTP flows        |
| Hardcoded Test Data      | Tests break when schema changes    | Use factories / builders         |
| Skipping Auth in Tests   | Auth disabled in test environment  | Test with real auth flows        |

# Backend Security

> See Layer 1 security-principles.md for universal security patterns.

This file covers backend-specific security implementation: middleware pipelines, guard architecture, database-level protections, API key management, and server hardening.

---

## Authentication Middleware Pipeline

| Stage              | Responsibility                              | Example                        |
| ------------------ | ------------------------------------------- | ------------------------------ |
| Token extraction   | Parse Bearer token from `Authorization`     | Custom middleware / Passport    |
| Token verification | Validate JWT signature and expiration       | `jsonwebtoken.verify()`        |
| User hydration     | Attach user/session object to request       | `req.user = await findUser()`  |
| Scope enforcement  | Check token scopes against endpoint         | Guard / decorator              |

### Password Handling

| Do                                    | Don't                          |
| ------------------------------------- | ------------------------------ |
| Hash with bcrypt/argon2 (cost >= 12)  | Use MD5/SHA for passwords      |
| Use constant-time comparison          | Use `===` for hash comparison  |
| Enforce minimum password entropy      | Only check length              |
| Store only the hash, never plaintext  | Log passwords in any form      |

---

## Guard & Middleware Architecture

### Execution Order

| Order | Layer        | Purpose                          |
| ----- | ------------ | -------------------------------- |
| 1     | Global middleware | Helmet, CORS, body parser     |
| 2     | Auth guard   | Verify identity (401 if fails)   |
| 3     | Role guard   | Verify permissions (403 if fails)|
| 4     | Ownership guard | Verify resource access        |
| 5     | Validation pipe | Sanitize and validate body    |

### Resource Ownership Check

| Do                                         | Don't                                  |
| ------------------------------------------ | -------------------------------------- |
| Fetch resource and compare `ownerId`       | Trust `userId` from request body       |
| Use database-level row filtering (RLS)     | Filter in application code only        |
| Return 404 for unauthorized resources      | Return 403 (leaks resource existence)  |
| Scope queries with `WHERE owner_id = $1`   | Fetch all then filter in memory        |

---

## Database Security

### Connection & Query Safety

| Do                                       | Don't                              |
| ---------------------------------------- | ---------------------------------- |
| Use connection pooling with max limits   | Open unlimited connections         |
| Set statement timeout (e.g., 30s)        | Allow unbounded query execution    |
| Use read replicas for public endpoints   | Hit primary for all reads          |
| Use database roles with least privilege  | Connect as superuser               |
| Enable SSL/TLS for database connections  | Use unencrypted connections        |

### Row-Level Security (RLS)

| Do                                         | Don't                              |
| ------------------------------------------ | ---------------------------------- |
| Define RLS policies per tenant/user        | Rely only on application filtering |
| Set `app.current_user_id` via session var  | Pass user context through queries  |
| Test RLS policies with different roles     | Assume policies work without tests |

---

## API Key Management

| Do                                       | Don't                            |
| ---------------------------------------- | -------------------------------- |
| Hash API keys before storing             | Store API keys in plaintext      |
| Prefix keys for identification (`sk_`)   | Use opaque random strings only   |
| Support key rotation with grace period   | Require instant key swap         |
| Bind keys to scopes and IP allowlists    | Give keys unrestricted access    |
| Log key usage with request metadata      | Skip audit trail for API keys    |
| Set per-key rate limits                  | Apply only global rate limits    |

---

## Request Signing & Webhooks

| Do                                         | Don't                              |
| ------------------------------------------ | ---------------------------------- |
| Sign outgoing webhooks with HMAC-SHA256    | Send unsigned webhook payloads     |
| Include timestamp in signed payload        | Sign without replay protection     |
| Reject signatures older than 5 minutes     | Accept stale signatures            |
| Verify inbound webhook signatures          | Trust webhook source by IP alone   |

---

## Server Hardening

### Response Safety

| Do                                       | Don't                            |
| ---------------------------------------- | -------------------------------- |
| Strip stack traces in production errors  | Expose internal error details    |
| Use generic error messages externally    | Return ORM/database error text   |
| Omit `X-Powered-By` header              | Advertise framework/version      |
| Set `Content-Type` explicitly            | Rely on client content sniffing  |

### Request Limits

| Setting              | Recommended Value | Purpose                     |
| -------------------- | ----------------- | --------------------------- |
| Body size limit      | 1-10 MB           | Prevent memory exhaustion   |
| URL length limit     | 2048 chars        | Prevent buffer abuse        |
| Header count limit   | 50-100            | Prevent header flooding     |
| Request timeout      | 30-60s            | Prevent slow-loris attacks  |
| File upload limit    | Per use case      | Prevent storage exhaustion  |

---

## Logging & Audit Trail

| Do                                       | Don't                            |
| ---------------------------------------- | -------------------------------- |
| Log auth events (login, logout, failure) | Skip authentication logging      |
| Log permission denied with context       | Log only successful requests     |
| Redact PII and secrets from logs         | Log full request bodies          |
| Use structured logging (JSON)            | Use unstructured text logs       |
| Include correlation ID per request       | Log without request tracing      |

---

## Anti-Patterns

| Pattern                        | Problem                                     |
| ------------------------------ | ------------------------------------------- |
| Auth check in controller body  | Easy to forget; should be in guard/middleware |
| Shared database superuser      | No isolation between services               |
| Logging raw request bodies     | PII/secrets leak into log aggregators       |
| Trusting `X-Forwarded-For`     | Easily spoofed without trusted proxy config |
| No request size limits         | Server vulnerable to memory exhaustion      |
| Returning ORM errors to client | Leaks schema, table names, query structure  |

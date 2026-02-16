# Backend Security

> Backend-specific security implementation patterns. See Layer 1 for universal security principles.

## Authentication

### Token Strategy

| Token Type    | Storage         | Lifetime    | Purpose           |
| ------------- | --------------- | ----------- | ----------------- |
| Access Token  | Memory/Header   | 15-60 min   | API authorization |
| Refresh Token | HttpOnly Cookie | 7-30 days   | Token renewal     |
| CSRF Token    | Header          | Per request | Prevent CSRF      |

### Token Rules

| Do                                      | Don't                  |
| --------------------------------------- | ---------------------- |
| Use HttpOnly cookies for refresh tokens | Store in localStorage  |
| Short-lived access tokens               | Long-lived access tokens |
| Rotate refresh tokens on use            | Reuse refresh tokens   |
| Invalidate on logout                    | Only delete client-side |
| Hash tokens in database                 | Store plain tokens     |

## Authorization (RBAC)

### Permission Structure

| Level      | Description                              |
| ---------- | ---------------------------------------- |
| Role       | Group of permissions (Admin, Manager)    |
| Permission | Single action (users:read, orders:write) |
| Scope      | Resource boundary (own, team, all)       |

### Authorization Rules

| Do                          | Don't                |
| --------------------------- | -------------------- |
| Check permissions in guards | Check in controllers |
| Use attribute-based checks  | Hardcode role names  |
| Deny by default             | Allow by default     |
| Log authorization failures  | Silently reject      |
| Validate resource ownership | Trust client claims  |

## Input Validation (Security)

| Do                       | Don't                |
| ------------------------ | -------------------- |
| Validate all inputs      | Trust any input      |
| Whitelist allowed values | Blacklist bad values |
| Sanitize before storage  | Store raw input      |
| Limit input length       | Accept unlimited input |
| Validate file types      | Accept any file      |

## SQL Injection Prevention

| Do                              | Don't                   |
| ------------------------------- | ----------------------- |
| Use parameterized queries (ORM) | String concatenation    |
| Validate input types            | Trust input types       |
| Use query builders              | Raw SQL with user input |
| Escape special characters       | Pass raw values         |

## XSS Prevention

| Do                          | Don't                   |
| --------------------------- | ----------------------- |
| Encode output               | Return raw HTML         |
| Use Content-Security-Policy | Skip CSP headers        |
| Validate content types      | Accept any content type |
| Sanitize rich text input    | Store unsanitized HTML  |

## CORS Configuration

| Do                         | Don't                    |
| -------------------------- | ------------------------ |
| Whitelist specific origins | Allow all origins (*)    |
| Restrict methods           | Allow all methods        |
| Limit exposed headers      | Expose all headers       |
| Use credentials carefully  | Always allow credentials |

## Secrets Management

| Do                                | Don't                     |
| --------------------------------- | ------------------------- |
| Use environment variables         | Hardcode secrets          |
| Use secrets manager (AWS/Vault)   | Store in config files     |
| Rotate secrets regularly          | Never rotate              |
| Audit secret access               | Ignore access logs        |
| Different secrets per environment | Share across environments |

## Rate Limiting

| Endpoint Type        | Limit         | Window |
| -------------------- | ------------- | ------ |
| Authentication       | 5-10          | 1 min  |
| API general          | 100-1000      | 1 min  |
| Sensitive operations | 10-50         | 1 min  |
| Webhooks             | Based on plan | 1 min  |

## Security Headers

| Header                      | Purpose               |
| --------------------------- | --------------------- |
| `Strict-Transport-Security` | Force HTTPS           |
| `Content-Security-Policy`   | Prevent XSS           |
| `X-Content-Type-Options`    | Prevent MIME sniffing |
| `X-Frame-Options`           | Prevent clickjacking  |
| `X-XSS-Protection`          | Browser XSS filter    |

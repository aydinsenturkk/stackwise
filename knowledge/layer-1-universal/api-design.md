# API Design

## RESTful Conventions

### HTTP Methods

| Method | Purpose          | Idempotent | Request Body |
| ------ | ---------------- | ---------- | ------------ |
| GET    | Read resource    | Yes        | No           |
| POST   | Create resource  | No         | Yes          |
| PUT    | Replace resource | Yes        | Yes          |
| PATCH  | Partial update   | Yes        | Yes          |
| DELETE | Remove resource  | Yes        | No           |

### URL Structure

| Good                  | Bad              |
| --------------------- | ---------------- |
| `/users`              | `/getUsers`      |
| `/users/{id}`         | `/user?id=123`   |
| `/users/{id}/orders`  | `/getUserOrders` |
| `/orders/{id}/cancel` | `/cancelOrder`   |

### Rules

| Do                     | Don't                 |
| ---------------------- | --------------------- |
| Use plural nouns       | Use verbs             |
| Use kebab-case         | Use camelCase in URLs |
| Use lowercase          | Use UPPERCASE         |
| Nest related resources | Flat structure always |
| Max 2 levels nesting   | Deep nesting          |

---

## Response Codes

| Code | Meaning           | Use When                   |
| ---- | ----------------- | -------------------------- |
| 200  | OK                | Successful GET, PUT, PATCH |
| 201  | Created           | Successful POST            |
| 204  | No Content        | Successful DELETE          |
| 400  | Bad Request       | Validation error           |
| 401  | Unauthorized      | Auth required              |
| 403  | Forbidden         | Permission denied          |
| 404  | Not Found         | Resource doesn't exist     |
| 409  | Conflict          | Business rule violation    |
| 422  | Unprocessable     | Semantic error             |
| 429  | Too Many Requests | Rate limited               |
| 500  | Internal Error    | Server error               |

---

## Pagination

### Cursor-based (Preferred)

| Parameter | Description              |
| --------- | ------------------------ |
| `cursor`  | Opaque cursor string     |
| `limit`   | Items per page (max 100) |

### Offset-based

| Parameter | Description           |
| --------- | --------------------- |
| `page`    | Page number (1-based) |
| `limit`   | Items per page        |

### Response Structure

| Field          | Description      |
| -------------- | ---------------- |
| `data`         | Array of items   |
| `meta.total`   | Total count      |
| `meta.page`    | Current page     |
| `meta.hasMore` | More pages exist |
| `meta.cursor`  | Next cursor      |

---

## Filtering & Sorting

### Query Parameters

| Pattern         | Example                       |
| --------------- | ----------------------------- |
| Simple filter   | `?status=active`              |
| Multiple values | `?status=active,pending`      |
| Range           | `?price_min=10&price_max=100` |
| Search          | `?q=searchterm`               |
| Sort            | `?sort=createdAt:desc`        |

### Rules

| Do                      | Don't              |
| ----------------------- | ------------------ |
| Whitelist filter fields | Allow any field    |
| Validate sort fields    | Sort by any column |
| Limit results           | Return unlimited   |
| Default sensible limits | No defaults        |

---

## Versioning

| Strategy    | Example             | When to Use    |
| ----------- | ------------------- | -------------- |
| URL path    | `/v1/users`         | Major versions |
| Header      | `Accept-Version: 1` | Minor changes  |
| Query param | `?version=1`        | Simple clients |

---

## Request/Response Format

### Request

| Do                                    | Don't            |
| ------------------------------------- | ---------------- |
| Use camelCase                         | Use snake_case   |
| Consistent date format (ISO 8601)     | Multiple formats |
| Include Content-Type header           | Assume JSON      |

### Response

| Do                       | Don't                |
| ------------------------ | -------------------- |
| Wrap in data envelope    | Return raw array     |
| Include metadata         | No pagination info   |
| Consistent null handling | Mixed null/undefined |
| Include timestamps       | No audit info        |

---

## Rate Limiting

| Header                  | Description          |
| ----------------------- | -------------------- |
| `X-RateLimit-Limit`     | Max requests allowed |
| `X-RateLimit-Remaining` | Requests remaining   |
| `X-RateLimit-Reset`     | Reset timestamp      |
| `Retry-After`           | Seconds until retry  |

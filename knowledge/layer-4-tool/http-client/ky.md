# Ky

## Instance Creation

```typescript
import ky from "ky";

const api = ky.create({
  prefixUrl: "https://api.example.com/v1",
  timeout: 30000,
  retry: 3,
  headers: {
    Accept: "application/json",
  },
});

// Extend an existing instance
const authApi = api.extend({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## Request Methods

```typescript
// GET with JSON parsing
const users = await api.get("users").json<User[]>();

// GET with search params
const user = await api
  .get("users", {
    searchParams: { page: 1, limit: 20, role: "admin" },
  })
  .json<PaginatedResponse<User>>();

// POST with JSON body
const newUser = await api
  .post("users", {
    json: { name: "John", email: "john@example.com" },
  })
  .json<User>();

// PUT
await api.put(`users/${id}`, { json: updatedUser });

// PATCH
await api.patch(`users/${id}`, { json: { name: "Jane" } });

// DELETE
await api.delete(`users/${id}`);

// Access raw Response
const response = await api.get("users");
console.log(response.status);
console.log(response.headers.get("x-total-count"));
const data = await response.json<User[]>();
```

---

## Hooks

### beforeRequest

```typescript
const api = ky.create({
  prefixUrl: "https://api.example.com",
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAccessToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
      (request) => {
        request.headers.set("X-Request-Id", crypto.randomUUID());
      },
    ],
  },
});
```

### afterResponse

```typescript
const api = ky.create({
  hooks: {
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          const newToken = await refreshToken();

          request.headers.set("Authorization", `Bearer ${newToken}`);

          // Retry with new token
          return ky(request);
        }
      },
    ],
  },
});
```

### beforeRetry

```typescript
const api = ky.create({
  retry: 3,
  hooks: {
    beforeRetry: [
      async ({ request, error, retryCount }) => {
        console.log(`Retry ${retryCount} for ${request.url}`);

        if (error instanceof HTTPError && error.response.status === 401) {
          const newToken = await refreshToken();
          request.headers.set("Authorization", `Bearer ${newToken}`);
        }
      },
    ],
  },
});
```

### beforeError

```typescript
import ky, { HTTPError } from "ky";

const api = ky.create({
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response?.body) {
          try {
            const body = await response.json();
            error.name = "APIError";
            error.message = `${body.message || error.message} (${response.status})`;
          } catch {
            // JSON parse failed, keep original
          }
        }
        return error;
      },
    ],
  },
});
```

---

## Retry Configuration

```typescript
const api = ky.create({
  retry: {
    limit: 5,
    methods: ["get", "post", "put", "delete"],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    backoffLimit: 10000, // Max 10 seconds between retries
  },
});

// Disable retry for specific request
await api.post("one-time-action", { retry: 0 });
```

---

## Timeout

```typescript
import ky, { TimeoutError } from "ky";

try {
  const data = await ky
    .get("https://slow-api.example.com", { timeout: 5000 })
    .json();
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error("Request timed out:", error.request.url);
  }
}

// Disable timeout (e.g., file uploads)
await ky.post("upload", {
  body: formData,
  timeout: false,
});
```

---

## Error Handling

```typescript
import ky, { HTTPError, TimeoutError } from "ky";

try {
  const data = await api.get("users").json<User[]>();
} catch (error) {
  if (error instanceof HTTPError) {
    const status = error.response.status;
    const body = await error.response.json();
    console.error(`HTTP ${status}:`, body);
  } else if (error instanceof TimeoutError) {
    console.error("Request timed out");
  } else if (error.name === "AbortError") {
    console.log("Request was cancelled");
  } else {
    throw error;
  }
}
```

---

## Cancellation

```typescript
const controller = new AbortController();

const promise = api
  .get("users", { signal: controller.signal })
  .json<User[]>();

// Cancel the request
controller.abort();

try {
  await promise;
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Cancelled");
  }
}
```

---

## Search Params

```typescript
// Object notation
await api.get("users", {
  searchParams: {
    page: 1,
    limit: 20,
    tags: ["admin", "active"], // repeated params
  },
});

// URLSearchParams
await api.get("users", {
  searchParams: new URLSearchParams([
    ["tags", "admin"],
    ["tags", "active"],
  ]),
});
```

---

## TypeScript Usage

```typescript
import ky, { KyInstance, Options, HTTPError } from "ky";

// Typed API client
class ApiClient {
  private api: KyInstance;

  constructor(baseURL: string) {
    this.api = ky.create({
      prefixUrl: baseURL,
      timeout: 30000,
      retry: { limit: 3 },
      hooks: {
        beforeRequest: [
          (request) => {
            const token = this.getToken();
            if (token) {
              request.headers.set("Authorization", `Bearer ${token}`);
            }
          },
        ],
      },
    });
  }

  async getUsers(params?: { page?: number; limit?: number }): Promise<User[]> {
    return this.api.get("users", { searchParams: params }).json<User[]>();
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return this.api.post("users", { json: data }).json<User>();
  }

  async deleteUser(id: string): Promise<void> {
    await this.api.delete(`users/${id}`);
  }

  private getToken(): string | null {
    return localStorage.getItem("auth_token");
  }
}
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Using `ky` directly without `create()` | No shared config, repeated options | Create instances with `ky.create()` |
| Not calling `.json()` on response | Gets raw Response, not parsed data | Chain `.json<T>()` for typed JSON |
| Retrying POST requests by default | May cause duplicate side effects | Set `retry.methods` to safe methods only |
| Ignoring `HTTPError` vs `TimeoutError` | Incorrect error handling branches | Use `instanceof` to differentiate errors |
| Not using `prefixUrl` | Hardcoded URLs, hard to switch envs | Set `prefixUrl` on instance creation |
| Modifying request in `afterResponse` wrong | Infinite retry loops | Return `ky(request)` only for specific status codes |
| No `AbortController` for user-triggered requests | Stale requests and race conditions | Cancel previous requests on new input |
| Setting `timeout: false` globally | Requests can hang forever | Only disable timeout for uploads/downloads |

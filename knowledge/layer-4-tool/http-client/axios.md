# Axios

## Instance Creation

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "https://api.example.com/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
```

---

## Request Methods

```typescript
// GET with query params
const { data: users } = await api.get<User[]>("/users", {
  params: { page: 1, limit: 20, role: "admin" },
});

// POST with body
const { data: user } = await api.post<User>("/users", {
  name: "John",
  email: "john@example.com",
});

// PUT
await api.put<User>(`/users/${id}`, updatedUser);

// PATCH
await api.patch<User>(`/users/${id}`, { name: "Jane" });

// DELETE
await api.delete(`/users/${id}`);

// Using config object
const { data } = await api<User>({
  method: "get",
  url: `/users/${id}`,
  headers: { "X-Custom-Header": "value" },
});
```

---

## Interceptors

### Request Interceptor

```typescript
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
```

### Response Interceptor

```typescript
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Retry on 401 with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);
```

### Remove Interceptor

```typescript
const interceptorId = api.interceptors.request.use(/* ... */);
api.interceptors.request.eject(interceptorId);
```

---

## Error Handling

```typescript
import { AxiosError, isAxiosError } from "axios";

interface ApiErrorResponse {
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

try {
  await api.get("/users");
} catch (error) {
  if (isAxiosError<ApiErrorResponse>(error)) {
    if (error.response) {
      // Server responded with non-2xx status
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      // Request sent but no response received
      console.error("No response:", error.request);
    } else {
      // Error setting up the request
      console.error("Setup error:", error.message);
    }
    console.error("Config:", error.config);
  }
}
```

### Custom Error Handler

```typescript
function handleApiError(error: unknown): never {
  if (!isAxiosError(error)) throw error;

  const status = error.response?.status;
  const data = error.response?.data;

  switch (status) {
    case 400:
      throw new ValidationError(data?.errors);
    case 401:
      throw new UnauthorizedError();
    case 403:
      throw new ForbiddenError();
    case 404:
      throw new NotFoundError(error.config?.url);
    case 429:
      throw new RateLimitError(error.response?.headers["retry-after"]);
    default:
      throw new ApiError(data?.message || error.message, status);
  }
}
```

---

## Cancellation

```typescript
// AbortController (recommended)
const controller = new AbortController();

const request = api.get("/users", {
  signal: controller.signal,
});

// Cancel the request
controller.abort();

try {
  await request;
} catch (error) {
  if (axios.isCancel(error)) {
    console.log("Request cancelled");
  }
}

// Timeout via AbortSignal
const { data } = await api.get("/users", {
  signal: AbortSignal.timeout(5000),
});
```

---

## Concurrent Requests

```typescript
// Promise.all for independent requests
const [usersRes, postsRes, commentsRes] = await Promise.all([
  api.get<User[]>("/users"),
  api.get<Post[]>("/posts"),
  api.get<Comment[]>("/comments"),
]);

// Promise.allSettled for fault-tolerant fetching
const results = await Promise.allSettled([
  api.get("/users"),
  api.get("/posts"),
]);

results.forEach((result) => {
  if (result.status === "fulfilled") {
    console.log(result.value.data);
  } else {
    console.error(result.reason);
  }
});
```

---

## Retry Pattern

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      if (isAxiosError(error)) {
        const status = error.response?.status;
        // Only retry on server errors or rate limits
        if (status && status < 500 && status !== 429) throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}

const data = await withRetry(() => api.get("/unstable-endpoint"));
```

---

## TypeScript Typing

```typescript
// Typed response
interface User {
  id: string;
  name: string;
  email: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const { data } = await api.get<PaginatedResponse<User>>("/users", {
  params: { page: 1, limit: 20 },
});

// Typed request body
interface CreateUserDto {
  name: string;
  email: string;
  role: "admin" | "user";
}

const { data: newUser } = await api.post<User, { data: User }, CreateUserDto>(
  "/users",
  { name: "John", email: "john@example.com", role: "user" },
);
```

---

## Form Data and File Upload

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("name", "document.pdf");

const { data } = await api.post("/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" },
  onUploadProgress: (event) => {
    const percent = Math.round((event.loaded * 100) / (event.total ?? 1));
    console.log(`Upload: ${percent}%`);
  },
});
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Using global `axios` directly | No shared config, hard to test | Create instances with `axios.create()` |
| Not typing response data | Loses TypeScript safety | Use generics: `get<User>("/users")` |
| Catching errors without `isAxiosError` | Wrong error type assumptions | Use `isAxiosError()` type guard |
| No request timeout | Requests hang indefinitely | Set `timeout` on instance or per-request |
| Retrying on all errors | Retries 4xx client errors uselessly | Only retry 5xx and 429 status codes |
| Creating interceptors in components | Duplicate interceptors on re-render | Create interceptors once at instance level |
| Not cancelling requests on unmount | Memory leaks in React components | Use `AbortController` with cleanup |
| Hardcoding base URL | Breaks across environments | Use environment variables for `baseURL` |

# Caching Strategies

> Framework-agnostic caching patterns for backend applications.

## Cache Layers

| Layer             | Scope           | TTL    | Use Case                     |
| ----------------- | --------------- | ------ | ---------------------------- |
| **In-Memory**     | Single instance | Short  | Hot data, computed values    |
| **Distributed**   | All instances   | Medium | Session, shared state        |
| **CDN**           | Edge            | Long   | Static assets, API responses |

## Cache Strategies

| Strategy          | Description                 | Use When             |
| ----------------- | --------------------------- | -------------------- |
| **Cache-Aside**   | App manages cache manually  | Full control needed  |
| **Read-Through**  | Cache loads from DB on miss | Simple read patterns |
| **Write-Through** | Cache writes to DB sync     | Consistency critical |
| **Write-Behind**  | Cache writes to DB async    | Performance critical |

## Cache Key Design

| Do                     | Don't                     |
| ---------------------- | ------------------------- |
| Use consistent prefix  | Random key names          |
| Include version in key | Forget versioning         |
| Use hierarchical keys  | Flat structure            |
| Hash long parameters   | Include full query string |

### Key Pattern

`{service}:{entity}:{identifier}:{version}`

Example: `api:user:123:v1`

## TTL Guidelines

| Data Type      | TTL           | Reason            |
| -------------- | ------------- | ----------------- |
| Static config  | 1 hour+       | Rarely changes    |
| User profile   | 5-15 min      | Balance freshness |
| Session data   | Match session | Security          |
| Search results | 1-5 min       | Frequent updates  |
| Real-time data | No cache      | Always fresh      |

## Cache Invalidation

| Strategy          | Description         |
| ----------------- | ------------------- |
| **Time-based**    | Let TTL expire      |
| **Event-based**   | Invalidate on write |
| **Version-based** | Change key version  |
| **Tag-based**     | Group related keys  |

## General Rules

| Do                               | Don't                |
| -------------------------------- | -------------------- |
| Cache expensive operations       | Cache everything     |
| Set appropriate TTL              | Use infinite TTL     |
| Handle cache failures gracefully | Let app crash        |
| Monitor cache hit rate           | Ignore metrics       |
| Use cache for read-heavy data    | Cache write-heavy data |
| Invalidate on writes             | Serve stale data     |

## Common Patterns

| Pattern            | Description                  |
| ------------------ | ---------------------------- |
| **Request Cache**  | Cache within single request  |
| **Query Cache**    | Cache database query results |
| **Computed Cache** | Cache expensive calculations |
| **Session Cache**  | Store user session data      |

## Anti-Patterns

| Don't                                   | Problem                |
| --------------------------------------- | ---------------------- |
| Cache mutable objects                   | Shared state issues    |
| Ignore thundering herd                  | Overload on cache miss |
| Cache sensitive data without encryption | Security risk          |
| Skip cache warming                      | Cold start problems    |

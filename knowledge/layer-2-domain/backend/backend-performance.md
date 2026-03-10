# Backend Performance

> See Layer 1 performance-principles.md for universal performance patterns.

## Database Performance

### Query Optimization

| Do                              | Don't                          |
| ------------------------------- | ------------------------------ |
| Select only needed columns      | `SELECT *` everywhere          |
| Use indexes on filtered columns | Missing indexes on WHERE/JOIN  |
| Use pagination for large sets   | Return unbounded result sets   |
| Batch related queries           | N+1 query pattern              |
| Use query explain/analyze       | Guess at slow queries          |

### N+1 Problem

| Symptom                          | Solution                       |
| -------------------------------- | ------------------------------ |
| Loop fetching related records    | Eager load with JOIN/include   |
| 100 queries for 100 items        | Batch load with IN clause      |
| Slow list endpoints              | DataLoader pattern             |

### Indexing Strategy

| Index When                       | Don't Index                    |
| -------------------------------- | ------------------------------ |
| Column in WHERE clause           | Low-cardinality columns alone  |
| Column in ORDER BY               | Rarely queried columns         |
| Foreign key columns              | Small tables (< 1000 rows)     |
| Composite for multi-column query | Every column (write overhead)  |

---

## Connection Management

| Resource          | Strategy                      | Why                          |
| ----------------- | ----------------------------- | ---------------------------- |
| Database          | Connection pool (10-20)       | Avoid connection overhead    |
| Redis             | Connection pool               | Reuse TCP connections        |
| HTTP clients      | Keep-alive, connection reuse  | Reduce handshake latency     |
| External APIs     | Circuit breaker               | Prevent cascade failure      |

### Pool Rules

| Do                                | Don't                         |
| --------------------------------- | ----------------------------- |
| Size pool based on load testing   | Use default pool size blindly |
| Monitor active/idle connections   | Ignore pool metrics           |
| Set connection timeout            | Wait indefinitely             |
| Release connections after use     | Leak connections              |

---

## Response Optimization

| Strategy              | When                              |
| --------------------- | --------------------------------- |
| Compression (gzip/br) | Text responses > 1KB              |
| Partial responses     | Client needs subset of fields     |
| Streaming             | Large payloads, real-time data    |
| ETags / 304           | Cacheable resources               |

---

## Pagination Strategies

| Strategy        | Pros                     | Cons                       | Use When                |
| --------------- | ------------------------ | -------------------------- | ----------------------- |
| Offset/Limit    | Simple, familiar         | Slow on deep pages         | Small datasets, UI paging |
| Cursor-based    | Consistent, performant   | No random page access      | Large datasets, feeds   |
| Keyset          | Very fast, stable        | Requires sortable key      | Time-series, logs       |

---

## Compute Optimization

| Strategy              | When                              |
| --------------------- | --------------------------------- |
| Worker threads        | CPU-intensive tasks (> 50ms)      |
| Job queues            | Deferrable work                   |
| Streaming processing  | Large file/data processing        |
| Caching computed data | Repeatedly calculated values      |

### Rules

| Do                                 | Don't                           |
| ---------------------------------- | ------------------------------- |
| Offload heavy computation to queue | Block event loop                |
| Stream large responses             | Buffer entire response in memory|
| Use worker threads for CPU work    | Spawn child process per request |
| Pre-compute where possible         | Compute on every request        |

---

## Monitoring Targets

| Metric              | Target        | Alert When        |
| -------------------- | ------------- | ----------------- |
| Response time (p95)  | < 200ms       | > 500ms           |
| Response time (p99)  | < 500ms       | > 1s              |
| Error rate           | < 0.1%        | > 1%              |
| DB query time (avg)  | < 50ms        | > 200ms           |
| Memory usage         | < 70%         | > 85%             |
| Event loop lag       | < 10ms        | > 50ms            |

---

## Anti-Patterns

| Anti-Pattern             | Problem                     | Solution                      |
| ------------------------ | --------------------------- | ----------------------------- |
| N+1 queries              | Multiplied DB round trips   | Eager load or DataLoader      |
| No connection pooling    | Connection overhead per req | Use pool with proper sizing   |
| Unbounded queries        | Memory spikes, slow response| Always paginate               |
| Blocking event loop      | All requests stall          | Offload to worker/queue       |
| No response compression  | Wasted bandwidth            | Enable gzip/brotli            |
| Missing DB indexes       | Full table scans            | Index filtered/sorted columns |
| Buffering large payloads | Memory exhaustion           | Stream responses              |

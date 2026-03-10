# Concurrency & Async Patterns

## Event Loop Model

| Phase | What Runs | Examples |
| ----- | --------- | ------- |
| Call stack | Synchronous code | Function calls, assignments |
| Microtask queue | Higher priority async | `Promise.then()`, `queueMicrotask()` |
| Macrotask queue | Lower priority async | `setTimeout`, `setInterval`, I/O callbacks |

### Rules

| Do | Don't |
| -- | ----- |
| Keep synchronous work short | Block the event loop with heavy computation |
| Use `async/await` for sequential async | Use nested `.then()` chains |
| Offload CPU-intensive work to worker threads | Run crypto/parsing/image processing on main thread |

---

## Promise Combinators

| Combinator | Behavior | Use When |
| ---------- | -------- | -------- |
| `Promise.all()` | Resolves when **all** resolve, rejects on **first** rejection | All must succeed (parallel fetch) |
| `Promise.allSettled()` | Resolves when **all** settle (fulfilled or rejected) | Need results regardless of failures |
| `Promise.race()` | Resolves/rejects with **first** to settle | Timeout pattern, fastest source wins |
| `Promise.any()` | Resolves with **first** to fulfill, rejects if **all** reject | Fallback sources, redundant requests |

### Selection Guide

| Scenario | Combinator |
| -------- | ---------- |
| Fetch user + orders + preferences in parallel | `Promise.all` |
| Send notifications to multiple channels, log failures | `Promise.allSettled` |
| API call with timeout | `Promise.race` |
| Try primary cache, fallback to secondary | `Promise.any` |

---

## Async/Await Patterns

### Sequential vs Parallel

| Pattern | When | Performance |
| ------- | ---- | ----------- |
| Sequential `await` | Each step depends on previous | Slower, but necessary for dependencies |
| Parallel `Promise.all` | Independent operations | Faster, runs concurrently |
| Batched parallel | Many independent ops, rate limit needed | Controlled concurrency |

### Error Handling

| Pattern | Use When |
| ------- | -------- |
| `try/catch` around `await` | Single operation, need specific handling |
| `try/catch` around `Promise.all` | Fail-fast on first error |
| `Promise.allSettled` + filter | Need partial results, handle failures individually |
| `.catch()` on individual promises before `Promise.all` | Prevent one failure from cancelling all |

---

## Race Conditions

### Common Sources

| Source | Example | Prevention |
| ------ | ------- | ---------- |
| Stale closure | Click handler uses outdated state | AbortController, latest-value check |
| Concurrent writes | Two requests update same resource | Optimistic locking, queuing |
| Out-of-order responses | Slow request resolves after fast one | Request ID tracking, abort previous |
| Shared mutable state | Global variable modified by parallel tasks | Immutable patterns, message passing |

### Prevention Strategies

| Strategy | Mechanism |
| -------- | --------- |
| AbortController | Cancel in-flight requests on new trigger |
| Debounce | Delay execution until input settles |
| Throttle | Limit execution frequency |
| Mutex/semaphore | Serialize access to shared resource |
| Idempotency keys | Safe retry without duplicate side effects |

---

## Debounce and Throttle

| Technique | Behavior | Use When |
| --------- | -------- | -------- |
| Debounce | Execute after pause in triggers | Search input, form validation |
| Throttle | Execute at most once per interval | Scroll handler, resize, rate-limited API |
| Leading debounce | Execute on first trigger, ignore until pause | Button click (prevent double-submit) |

---

## Cancellation

| Mechanism | Scope | Works With |
| --------- | ----- | ---------- |
| `AbortController` / `AbortSignal` | Native | `fetch`, Node.js streams, custom async |
| Timeout via `AbortSignal.timeout(ms)` | Native | `fetch`, any AbortSignal consumer |
| Manual flag | Custom | Loops, recursive async |

### Rules

| Do | Don't |
| -- | ----- |
| Cancel previous request on new input | Let stale requests resolve and overwrite |
| Use `AbortSignal` over manual flags | Invent custom cancellation protocols |
| Clean up listeners and timers in teardown | Leave dangling subscriptions |

---

## Concurrency Control

| Pattern | Purpose |
| ------- | ------- |
| Semaphore (concurrency limit) | Process N items at a time from a large set |
| Queue | Serialize async operations (one at a time) |
| Batch processing | Group items, process batch concurrently |
| Rate limiting (client-side) | Respect API rate limits |

### Batching Rules

| Do | Don't |
| -- | ----- |
| Batch DB operations (bulk insert) | Insert one row per await in a loop |
| Limit parallel HTTP requests (5-10 max) | Fire 1000 requests simultaneously |
| Use `Promise.allSettled` for batch error handling | Let one failure kill entire batch |

---

## Retry Patterns

| Strategy | Behavior | Use When |
| -------- | -------- | -------- |
| Fixed delay | Wait same duration between retries | Simple cases |
| Exponential backoff | Double wait time each retry | API rate limits, transient failures |
| Exponential + jitter | Backoff with random spread | Multiple clients retrying simultaneously |
| Circuit breaker | Stop retrying after threshold | Failing dependency, prevent cascade |

### Retry Rules

| Do | Don't |
| -- | ----- |
| Only retry transient/recoverable errors | Retry 400 Bad Request (won't change) |
| Set max retry count (3-5) | Retry indefinitely |
| Use exponential backoff for external APIs | Hammer failing service with fixed interval |
| Log each retry attempt | Retry silently |

---

## Worker Threads

| Use Main Thread | Use Worker Thread |
| --------------- | ----------------- |
| I/O operations (network, disk) | CPU-intensive computation |
| Request handling | Image/video processing |
| Lightweight data transforms | Cryptographic operations |
| Template rendering | Large data parsing/serialization |

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| `await` in a loop | Sequential execution, N times slower | `Promise.all` for independent operations |
| Ignoring returned promises | Unhandled rejections, silent failures | Always `await` or handle with `.catch()` |
| Fire-and-forget without error handling | Crashes on unhandled rejection | At minimum `.catch(log)` |
| Mixing `async/await` with `.then()` | Inconsistent, hard to follow | Pick one style per function |
| No cancellation on unmount/cleanup | Memory leaks, stale updates | AbortController in teardown |
| Unbounded parallelism | Resource exhaustion, rate limit hits | Semaphore or batch processing |
| Swallowing errors in `catch` | Silent failures, hard to debug | Log or rethrow, never empty `catch` |
| `setTimeout` as retry mechanism | No backoff, no limit, fragile | Structured retry with backoff |

---

## Principles

- **Prefer `async/await`** — cleaner than `.then()` chains, better error handling
- **Parallelize independent work** — don't sequentially `await` unrelated operations
- **Always handle errors** — every promise must have an error path
- **Cancel what you start** — clean up requests, timers, and subscriptions
- **Bound concurrency** — limit parallel operations to prevent resource exhaustion

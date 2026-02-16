# Performance Principles

## Core Philosophy

**Measure first, optimize later.**

Never optimize without profiling data. Premature optimization adds complexity with no proven benefit.

---

## When to Optimize

| Optimize                  | Don't Optimize       |
| ------------------------- | -------------------- |
| Measured issue (profiler) | No measured problem  |
| User-facing impact        | Minimal user impact  |
| Clear bottleneck          | Based on assumptions |
| Simple solution available | Adds complexity      |

---

## Optimization Process

1. **Identify**: User reports or monitoring reveals a problem
2. **Measure**: Profile to find the actual bottleneck
3. **Analyze**: Understand why the bottleneck exists
4. **Fix**: Apply the simplest effective solution
5. **Verify**: Confirm the fix improved the metric

---

## Common Techniques

| Technique         | Use Case                        |
| ----------------- | ------------------------------- |
| Caching           | Expensive computations or I/O   |
| Lazy loading      | Large modules, deferred content |
| Pagination        | Large data sets                 |
| Debouncing        | Rapid user input                |
| Batching          | Multiple operations at once     |
| Connection pooling| Database connections            |
| Indexing           | Slow database queries           |

---

## Anti-Patterns

| Pattern                | Problem                         |
| ---------------------- | ------------------------------- |
| Premature optimization | Optimizing without measuring    |
| Over-caching           | Caching trivial operations      |
| N+1 queries            | Query per item instead of batch |
| Unnecessary computation| Re-computing already known values|
| Ignoring profiler data | Guessing at bottlenecks         |

---

## Principles

- **Measure First**: Profile before optimizing
- **User-Facing Impact**: Only optimize what users notice
- **Simplest Fix**: Prefer simple solutions over clever ones
- **Verify Results**: Confirm improvements with data
- **Avoid Premature Abstraction**: Complexity costs performance too

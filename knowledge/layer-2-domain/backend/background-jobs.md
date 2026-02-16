# Background Jobs

> Framework-agnostic patterns for asynchronous job processing in backend applications.

## Job Categories

| Category            | Characteristics     | Examples              |
| ------------------- | ------------------- | --------------------- |
| **Fire-and-forget** | No response needed  | Send email, log event |
| **Delayed**         | Execute after time  | Reminder, cleanup     |
| **Scheduled**       | Recurring execution | Reports, sync         |
| **Workflow**        | Multi-step process  | Order fulfillment     |

## Queue Design

### Separate Queues by Concern

| Queue       | Purpose             | Priority          |
| ----------- | ------------------- | ----------------- |
| `critical`  | Payment, auth       | Highest           |
| `default`   | Business operations | Normal            |
| `low`       | Reports, analytics  | Low               |
| `scheduled` | Cron jobs           | Based on schedule |

### Queue Rules

| Do                               | Don't                 |
| -------------------------------- | --------------------- |
| Use dedicated queues per concern | Single queue for all  |
| Set appropriate priorities       | Same priority for all |
| Configure concurrency limits     | Unlimited workers     |
| Monitor queue depth              | Ignore metrics        |

## Job Design

### Idempotency

| Do                         | Don't                   |
| -------------------------- | ----------------------- |
| Design for re-execution    | Assume single execution |
| Use unique job IDs         | Rely on queue dedup     |
| Check if action completed  | Always perform action   |
| Store job state externally | Rely on job data only   |

### Payload

| Do                    | Don't                |
| --------------------- | -------------------- |
| Include only IDs      | Include full objects  |
| Keep payload small    | Large payloads       |
| Use serializable data | Complex objects      |
| Version job payload   | Breaking changes     |

## Retry Strategy

| Parameter    | Recommendation                            |
| ------------ | ----------------------------------------- |
| Max attempts | 3-5 for transient, 1 for permanent        |
| Backoff      | Exponential (1s, 2s, 4s, 8s)              |
| Jitter       | Add randomness to prevent thundering herd |
| Dead letter  | Move failed jobs after max attempts       |

### Error Classification

| Type      | Retry?  | Example                     |
| --------- | ------- | --------------------------- |
| Transient | Yes     | Network timeout, rate limit |
| Permanent | No      | Invalid data, not found     |
| Unknown   | Limited | Unexpected errors           |

## Monitoring

| Metric            | Alert Threshold |
| ----------------- | --------------- |
| Queue depth       | > 1000 jobs     |
| Processing time   | > 30 seconds    |
| Failure rate      | > 5%            |
| Dead letter count | > 0             |
| Worker health     | Any unhealthy   |

## General Rules

| Do                      | Don't                |
| ----------------------- | -------------------- |
| Log job start/end       | Silent processing    |
| Include correlation ID  | Lose request context |
| Handle timeouts         | Let jobs hang        |
| Clean up completed jobs | Keep forever         |
| Test job handlers       | Skip job testing     |

## Patterns

### Saga Pattern

| Use When                 | Description                  |
| ------------------------ | ---------------------------- |
| Distributed transactions | Coordinate multiple services |
| Long-running processes   | Multi-step workflows         |
| Compensation needed      | Rollback on failure          |

### Outbox Pattern

| Use When                | Description                 |
| ----------------------- | --------------------------- |
| Event publishing        | Ensure events are published |
| At-least-once delivery  | Prevent lost messages       |
| Transaction + messaging | Atomic operation            |

## Anti-Patterns

| Don't                 | Problem          |
| --------------------- | ---------------- |
| Synchronous in job    | Blocks worker    |
| No timeout            | Jobs run forever |
| Ignore failures       | Silent data loss |
| Hardcoded delays      | Inflexible retry |
| Process in controller | Blocks request   |

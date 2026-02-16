# BullMQ

## Queue Setup

```typescript
import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";

// Share a single Redis connection
const connection = new IORedis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,  // Required for BullMQ
});

// Create queue
const emailQueue = new Queue("email", { connection });

// Add a job
await emailQueue.add("send-welcome", {
  userId: "abc-123",
  template: "welcome",
}, {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: 100,  // Keep last 100 completed
  removeOnFail: 500,      // Keep last 500 failed
});
```

---

## Worker

```typescript
const worker = new Worker(
  "email",
  async (job) => {
    const { userId, template } = job.data;

    // Update progress
    await job.updateProgress(10);

    const user = await userService.findById(userId);
    await job.updateProgress(50);

    await emailService.send(user.email, template);
    await job.updateProgress(100);

    return { sent: true, email: user.email };
  },
  {
    connection,
    concurrency: 5,           // Process 5 jobs at a time
    limiter: {
      max: 100,               // Max 100 jobs
      duration: 60_000,       // Per 60 seconds
    },
  },
);

// Event handlers
worker.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed`, result);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err.message);
});

worker.on("stalled", (jobId) => {
  console.warn(`Job ${jobId} stalled`);
});
```

---

## Job Lifecycle

```
Added → Waiting → Active → Completed
                         ↘ Failed → (retry) → Waiting
                                  ↘ (max retries) → Failed (permanent)
```

| State        | Description                              |
| ------------ | ---------------------------------------- |
| `waiting`    | In queue, ready to be processed          |
| `active`     | Currently being processed by a worker    |
| `completed`  | Successfully processed                   |
| `failed`     | Processing failed (may retry)            |
| `delayed`    | Waiting for scheduled time               |
| `stalled`    | Worker stopped responding (auto-retried) |

---

## Job Scheduling

### Delayed Jobs

```typescript
// Execute after 5 minutes
await queue.add("reminder", { userId: "123" }, {
  delay: 5 * 60 * 1000,
});
```

### Repeatable Jobs (Cron)

```typescript
// Every day at 2 AM
await queue.add("daily-report", {}, {
  repeat: {
    pattern: "0 2 * * *",    // Cron syntax
  },
});

// Every 30 minutes
await queue.add("sync-data", {}, {
  repeat: {
    every: 30 * 60 * 1000,   // Milliseconds
  },
});

// Remove repeatable job
await queue.removeRepeatableByKey(repeatableKey);
```

---

## FlowProducer (Job Dependencies)

```typescript
import { FlowProducer } from "bullmq";

const flowProducer = new FlowProducer({ connection });

// Parent waits for all children to complete
const flow = await flowProducer.add({
  name: "process-order",
  queueName: "orders",
  data: { orderId: "order-123" },
  children: [
    {
      name: "validate-payment",
      queueName: "payments",
      data: { orderId: "order-123" },
    },
    {
      name: "reserve-inventory",
      queueName: "inventory",
      data: { orderId: "order-123", items: [...] },
    },
    {
      name: "send-confirmation",
      queueName: "email",
      data: { orderId: "order-123" },
      opts: {
        delay: 5000,  // Send after 5s
      },
    },
  ],
});
```

### Flow Rules

| Rule                                        | Purpose                        |
| ------------------------------------------- | ------------------------------ |
| Parent processes after all children complete | Dependency ordering            |
| Children can have their own children         | Multi-level workflows          |
| Each child can be on a different queue       | Separation of concerns         |
| Parent receives children results             | Aggregation                    |

---

## Rate Limiting

```typescript
// Worker-level rate limiting
const worker = new Worker("api-calls", processor, {
  connection,
  limiter: {
    max: 10,            // 10 jobs
    duration: 1000,     // Per second
  },
});

// Group-based rate limiting
await queue.add("api-call", data, {
  group: {
    id: tenantId,       // Rate limit per tenant
    maxSize: 5,
    duration: 1000,
  },
});
```

---

## Queue Patterns by Priority

```typescript
// Separate queues by concern
const criticalQueue = new Queue("critical", { connection });  // Payments, auth
const defaultQueue = new Queue("default", { connection });    // Business ops
const lowQueue = new Queue("low", { connection });            // Reports, analytics
const scheduledQueue = new Queue("scheduled", { connection }); // Cron jobs

// Job priority within a queue (lower = higher priority)
await queue.add("urgent-task", data, { priority: 1 });
await queue.add("normal-task", data, { priority: 5 });
await queue.add("background-task", data, { priority: 10 });
```

---

## Job Design Rules

### Idempotency

```typescript
// Use jobId to prevent duplicate processing
await queue.add("process-payment", { paymentId: "pay-123" }, {
  jobId: `payment-${paymentId}`,  // Same ID = same job (deduplication)
});

// Check completion before acting
async function processPayment(job) {
  const payment = await paymentRepo.findById(job.data.paymentId);
  if (payment.status === "completed") {
    return { skipped: true, reason: "already processed" };
  }
  // Process payment...
}
```

### Payload Rules

| Do                                  | Don't                             |
| ----------------------------------- | --------------------------------- |
| Include only IDs and references     | Include full objects              |
| Keep payload under 1KB              | Large payloads (files, blobs)     |
| Use serializable data only          | Class instances, functions        |
| Version the payload schema          | Breaking changes without version  |

---

## Bull Board Dashboard

```typescript
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(orderQueue),
    new BullMQAdapter(reportQueue),
  ],
  serverAdapter,
});

// Mount in Express/NestJS
app.use("/admin/queues", serverAdapter.getRouter());
```

---

## Graceful Shutdown

```typescript
async function shutdown() {
  console.log("Shutting down workers...");

  // Close workers (waits for active jobs to finish)
  await worker.close();

  // Close queues
  await queue.close();

  // Close Redis connection
  await connection.quit();

  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

---

## Anti-Patterns

| Anti-Pattern                          | Solution                                     |
| ------------------------------------- | -------------------------------------------- |
| Single queue for everything           | Separate queues by concern/priority          |
| Large payloads in job data            | Store data externally, pass IDs only         |
| No retry strategy                     | Configure attempts + exponential backoff     |
| Ignoring stalled jobs                 | Monitor stalled events, set stalledInterval  |
| No idempotency                        | Use jobId for dedup, check state before acting|
| Missing graceful shutdown             | Close workers before process exits           |
| No dead letter handling               | Monitor and alert on permanently failed jobs |

# Winston

## Logger Creation

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  defaultMeta: { service: "user-service" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

export default logger;
```

---

## Log Levels

```typescript
// Default npm levels (lowest to highest priority)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Usage
logger.error("Database connection failed", { host: "db.example.com" });
logger.warn("Deprecated API called", { endpoint: "/v1/users" });
logger.info("User registered", { userId: "abc-123" });
logger.debug("Query executed", { sql: "SELECT * FROM users", ms: 42 });

// Log with metadata object
logger.info("Request completed", {
  method: "GET",
  path: "/api/users",
  statusCode: 200,
  duration: 150,
});
```

---

## Transports

### Console

```typescript
new winston.transports.Console({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),
});
```

### File

```typescript
new winston.transports.File({
  filename: "error.log",
  level: "error",
  maxsize: 5242880, // 5MB
  maxFiles: 5,
  tailable: true,
});
```

### HTTP

```typescript
new winston.transports.Http({
  level: "warn",
  host: "log-server.example.com",
  port: 443,
  path: "/logs",
  ssl: true,
  format: winston.format.json(),
});
```

### Daily Rotate File

```typescript
import DailyRotateFile from "winston-daily-rotate-file";

new DailyRotateFile({
  filename: "application-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  dirname: "logs",
});
```

---

## Formatters

```typescript
import { format } from "winston";

// Combine multiple formats
const customFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.metadata({ fillExcept: ["message", "level", "timestamp"] }),
  format.json(),
);

// Custom format function
const myFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ""
  }`;
});

// Common format combinations
const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "HH:mm:ss" }),
  myFormat,
);

const prodFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
);
```

---

## Child Loggers

```typescript
const logger = winston.createLogger({ /* ... */ });

// Child logger with persistent metadata
const requestLogger = logger.child({
  requestId: "req-abc-123",
  module: "auth",
});

requestLogger.info("Processing request");
// {"level":"info","message":"Processing request","requestId":"req-abc-123","module":"auth"}

// Express middleware pattern
function requestLoggerMiddleware(req, res, next) {
  req.logger = logger.child({
    requestId: req.headers["x-request-id"] || crypto.randomUUID(),
    method: req.method,
    path: req.path,
  });
  next();
}
```

---

## Error Handling

```typescript
// Handle uncaught exceptions
const logger = winston.createLogger({
  exceptionHandlers: [
    new winston.transports.File({ filename: "exceptions.log" }),
  ],
});

// Handle unhandled promise rejections
const logger = winston.createLogger({
  rejectionHandlers: [
    new winston.transports.File({ filename: "rejections.log" }),
  ],
});

// Log Error objects properly
try {
  await riskyOperation();
} catch (err) {
  // format.errors({ stack: true }) required for stack traces
  logger.error("Operation failed", err);
}
```

---

## Transport Management

```typescript
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

// Add transport
logger.add(new winston.transports.File({ filename: "combined.log" }));

// Remove transport
logger.remove(logger.transports[0]);

// Clear all transports
logger.clear();

// Reconfigure entirely
logger.configure({
  level: "warn",
  transports: [
    new DailyRotateFile({
      filename: "application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
    }),
  ],
});

// Close logger and flush
logger.close();
```

---

## Query Logs

```typescript
const options = {
  from: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h ago
  until: new Date(),
  limit: 10,
  start: 0,
  order: "desc" as const,
  fields: ["message", "level", "timestamp"],
};

logger.query(options, (err, results) => {
  if (err) {
    console.error("Query failed:", err);
    return;
  }
  console.log(results);
});
```

---

## Profiling

```typescript
// Start/stop profiling
logger.profile("database-query");
await db.query("SELECT * FROM users");
logger.profile("database-query");
// logs: {"level":"info","message":"database-query","durationMs":42}
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Creating logger per request | Excessive memory and file handles | Create one logger, use `child()` for context |
| No `format.errors({ stack: true })` | Error stacks are lost in output | Always include `errors` format |
| Logging sensitive data (passwords, tokens) | Security exposure in log files | Sanitize or redact sensitive fields |
| Console-only in production | Logs lost on restart, poor searchability | Use file or HTTP transport in production |
| Not setting `maxsize`/`maxFiles` on files | Disk fills up over time | Set rotation limits on file transports |
| String concatenation for log messages | Loses structured metadata | Use object metadata: `logger.info("msg", { key: val })` |
| No `exceptionHandlers` configured | Uncaught exceptions lost silently | Add exception and rejection handlers |
| Logging inside tight loops | Performance degradation, log flooding | Log aggregated summaries or use sampling |

# Pino

## Configuration

```typescript
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  base: { service: "user-service", env: process.env.NODE_ENV },
});

logger.info("Server started");
// {"level":"info","time":"2024-03-15T10:30:00.000Z","service":"user-service","msg":"Server started"}
```

---

## Log Levels

```typescript
// Default levels (lowest to highest number = highest to lowest priority)
// fatal: 60, error: 50, warn: 40, info: 30, debug: 20, trace: 10

logger.fatal("Unrecoverable error");
logger.error("Operation failed");
logger.warn("Deprecated feature used");
logger.info("User registered", { userId: "abc-123" });
logger.debug("Query executed", { sql: "SELECT *", ms: 42 });
logger.trace("Entering function", { fn: "processUser" });

// Check if level is enabled
if (logger.isLevelEnabled("debug")) {
  logger.debug("Expensive debug data", computeDebugInfo());
}

// Custom levels
const logger = pino({
  customLevels: {
    audit: 35, // Between info (30) and warn (40)
  },
});
(logger as any).audit("User modified record");
```

---

## Child Loggers

```typescript
const logger = pino();

// Create child with persistent bindings
const requestLogger = logger.child({
  requestId: "abc-123",
  module: "auth",
});

requestLogger.info("Processing request");
// {"level":"info","requestId":"abc-123","module":"auth","msg":"Processing request"}

// Nested children
const userLogger = requestLogger.child({ userId: "user-456" });
userLogger.info("User action");
// {"level":"info","requestId":"abc-123","module":"auth","userId":"user-456","msg":"User action"}

// Child with different level
const debugChild = logger.child(
  { component: "database" },
  { level: "debug" },
);

// Child with custom serializer
const childWithSerializer = logger.child(
  {},
  {
    serializers: {
      user: (user) => ({ id: user.id, name: user.name }),
    },
  },
);

// Message prefix
const prefixedLogger = pino({ msgPrefix: "[API] " });
const authLogger = prefixedLogger.child({}, { msgPrefix: "[Auth] " });
authLogger.info("Token validated");
// {"msg":"[API] [Auth] Token validated"}
```

---

## Transports

### Pretty Printing (Development)

```typescript
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});
```

### File Transport

```typescript
const logger = pino({
  transport: {
    target: "pino/file",
    options: { destination: "/var/log/app.log", mkdir: true },
  },
});
```

### Multiple Transports

```typescript
const logger = pino({
  level: "debug",
  transport: {
    targets: [
      {
        target: "pino-pretty",
        level: "info",
        options: { destination: 1 }, // stdout
      },
      {
        target: "pino/file",
        level: "error",
        options: { destination: "/var/log/error.log" },
      },
      {
        target: "pino/file",
        level: "debug",
        options: { destination: "/var/log/debug.log" },
      },
    ],
  },
});
```

### Transport Pipeline

```typescript
const logger = pino({
  transport: {
    pipeline: [
      { target: "pino-syslog" },
      {
        target: "pino-socket",
        options: { address: "syslog.example.com", port: 514 },
      },
    ],
  },
});
```

---

## Serializers

```typescript
const logger = pino({
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
    // Custom serializer
    user: (user) => ({
      id: user.id,
      email: user.email,
      // Omit sensitive fields
    }),
  },
});

logger.info({ req, user }, "Request received");
```

---

## Redaction

```typescript
// Simple path redaction
const logger = pino({
  redact: ["password", "creditCard", "user.ssn", "users[*].token"],
});

logger.info({
  username: "john",
  password: "secret123",
}, "Login attempt");
// {"username":"john","password":"[Redacted]","msg":"Login attempt"}

// Custom censor value
const logger = pino({
  redact: {
    paths: ["secret", "data.apiKey"],
    censor: "***HIDDEN***",
  },
});

// Remove redacted keys entirely
const logger = pino({
  redact: {
    paths: ["tempData", "internal.*"],
    remove: true,
  },
});

// Dynamic censor function
const logger = pino({
  redact: {
    paths: ["email"],
    censor: (value: string) => {
      if (value.includes("@")) {
        return value.replace(/(.{2}).*(@.*)/, "$1***$2");
      }
      return "[Redacted]";
    },
  },
});
```

---

## Async Mode

```typescript
// Async mode for better throughput (may lose logs on crash)
const logger = pino(
  pino.destination({
    dest: "/var/log/app.log",
    sync: false,         // Async writing
    minLength: 4096,     // Buffer size before flush
  }),
);

// Flush before exit
process.on("beforeExit", () => {
  logger.flush();
});

const handler = pino.final(logger, (err, finalLogger) => {
  finalLogger.info("exiting");
  process.exit(err ? 1 : 0);
});

process.on("uncaughtException", handler);
process.on("unhandledRejection", handler);
```

---

## Express Integration (pino-http)

```typescript
import express from "express";
import pinoHttp from "pino-http";

const app = express();

app.use(
  pinoHttp({
    logger: pino({ level: "info" }),
    autoLogging: true,
    customLogLevel(req, res, err) {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage(req, res) {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage(req, res, err) {
      return `${req.method} ${req.url} failed: ${err.message}`;
    },
  }),
);

app.get("/", (req, res) => {
  req.log.info("Processing home request");
  res.send("ok");
});
```

---

## Fastify Integration

```typescript
import Fastify from "fastify";

const fastify = Fastify({
  logger: {
    level: "info",
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty" }
        : undefined,
  },
});

fastify.get("/", async (request, reply) => {
  request.log.info("Processing request");
  return { hello: "world" };
});
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Using `pino-pretty` in production | Significantly slower than JSON output | Use JSON in production, pretty only in dev |
| Sync mode for high-throughput apps | Blocks event loop on each log write | Use async destination with `sync: false` |
| Not using `pino.final` for exit handlers | Async logs lost on crash | Use `pino.final()` for graceful shutdown |
| Logging entire request/response objects | Huge log entries, sensitive data exposure | Use serializers to pick specific fields |
| No redaction of sensitive data | Passwords and tokens in log files | Configure `redact` paths |
| Creating new logger per request | Overhead and lost configuration | Use `logger.child()` with request context |
| String concatenation in log messages | Loses structured data, slower | Use object merging: `logger.info({ key }, "msg")` |
| Not checking `isLevelEnabled` | Computing expensive debug data unnecessarily | Guard with `logger.isLevelEnabled("debug")` |

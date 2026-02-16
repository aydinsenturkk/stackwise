# Observability

## Three Pillars

| Pillar      | Purpose        | Tool Examples       |
| ----------- | -------------- | ------------------- |
| **Logging** | What happened  | Winston, Pino       |
| **Metrics** | How much/often | Prometheus, DataDog |
| **Tracing** | Request flow   | Jaeger, Zipkin      |

---

## Logging

### Log Levels

| Level | When to Use                           |
| ----- | ------------------------------------- |
| ERROR | Unhandled exceptions, system failures |
| WARN  | Handled exceptions, degraded service  |
| INFO  | Business events, request summary      |
| DEBUG | Detailed flow, variable values        |
| TRACE | Very detailed, framework internals    |

### Structured Logging

| Do                     | Don't                 |
| ---------------------- | --------------------- |
| Use JSON format        | Plain text            |
| Include correlation ID | No request context    |
| Add timestamp          | Rely on system time   |
| Include service name   | Assume single service |
| Log at boundaries      | Log everything        |

### Required Fields

| Field           | Description                |
| --------------- | -------------------------- |
| `timestamp`     | ISO 8601 format            |
| `level`         | Log level                  |
| `message`       | Human-readable description |
| `correlationId` | Request trace ID           |
| `service`       | Service name               |
| `context`       | Additional structured data |

### Rules

| Do                           | Don't                         |
| ---------------------------- | ----------------------------- |
| Log business events          | Log implementation details    |
| Sanitize sensitive data      | Log passwords, tokens         |
| Use consistent format        | Different formats per service |
| Include error stack          | Only error message            |
| Log request/response summary | Log full payloads             |

---

## Metrics

### Types

| Type      | Use For              | Example       |
| --------- | -------------------- | ------------- |
| Counter   | Cumulative values    | Request count |
| Gauge     | Point-in-time values | Queue depth   |
| Histogram | Distribution         | Response time |
| Summary   | Percentiles          | Latency P99   |

### Standard Metrics

| Category     | Metrics                               |
| ------------ | ------------------------------------- |
| **HTTP**     | Request count, duration, status codes |
| **Database** | Query count, duration, connections    |
| **Cache**    | Hit rate, miss rate, latency          |
| **Queue**    | Depth, processing time, failures      |
| **Business** | Orders created, users registered      |

### Naming Convention

**Pattern:** `{namespace}_{subsystem}_{name}_{unit}`

Example: `api_http_requests_total`, `api_db_query_duration_seconds`

---

## Tracing

### Span Attributes

| Attribute          | Description        |
| ------------------ | ------------------ |
| `service.name`     | Service identifier |
| `http.method`      | GET, POST, etc.    |
| `http.url`         | Request URL        |
| `http.status_code` | Response status    |
| `db.system`        | Database type      |
| `db.statement`     | Query (sanitized)  |

### Rules

| Do                          | Don't                       |
| --------------------------- | --------------------------- |
| Propagate trace context     | Start new trace per service |
| Add meaningful span names   | Generic names               |
| Include relevant attributes | Sensitive data              |
| Sample appropriately        | Trace everything            |

---

## Health Checks

### Endpoints

| Endpoint          | Purpose                 |
| ----------------- | ----------------------- |
| `/health/live`    | Is process running      |
| `/health/ready`   | Can accept traffic      |
| `/health/startup` | Initialization complete |

### Checks to Include

| Check               | Ready | Live |
| ------------------- | ----- | ---- |
| Database connection | Yes   | No   |
| Cache connection    | Yes   | No   |
| External service    | Yes   | No   |
| Memory usage        | No    | Yes  |
| Disk space          | No    | Yes  |

---

## Alerting

| Severity | Response Time     | Example              |
| -------- | ----------------- | -------------------- |
| Critical | < 5 min           | Service down         |
| High     | < 30 min          | High error rate      |
| Medium   | < 4 hours         | Degraded performance |
| Low      | Next business day | Non-critical warning |

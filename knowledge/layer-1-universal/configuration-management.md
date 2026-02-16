# Configuration Management

## Environment Strategy

| Environment     | Purpose        | Config Source         |
| --------------- | -------------- | --------------------- |
| **local**       | Development    | `.env.local`          |
| **development** | Shared dev     | Environment variables |
| **staging**     | Pre-production | Secrets manager       |
| **production**  | Live system    | Secrets manager       |

---

## Configuration Categories

| Category              | Examples                     | Storage         |
| --------------------- | ---------------------------- | --------------- |
| **Application**       | Port, host, debug mode       | Env variables   |
| **Database**          | Connection string, pool size | Secrets manager |
| **External Services** | API keys, endpoints          | Secrets manager |
| **Feature Flags**     | Enable/disable features      | Config service  |
| **Business Rules**    | Limits, thresholds           | Database/Config |

---

## Environment Variables

### Naming Convention

| Pattern                    | Example         |
| -------------------------- | --------------- |
| `{APP}_{CATEGORY}_{NAME}`  | `API_DB_HOST`   |
| Uppercase with underscores | `API_REDIS_URL` |

### Rules

| Do                        | Don't                  |
| ------------------------- | ---------------------- |
| Use descriptive names     | Abbreviate excessively |
| Group by prefix           | Random naming          |
| Document all variables    | Undocumented env vars  |
| Validate at startup       | Fail at runtime        |
| Use defaults for optional | Require all variables  |

---

## Configuration Validation

| Do                            | Don't                    |
| ----------------------------- | ------------------------ |
| Validate on application start | Validate on first use    |
| Fail fast if invalid          | Continue with bad config |
| Type-check all values         | Trust string values      |
| Validate URLs, ports, etc.    | Accept any format        |
| Log config (sanitized)        | Log secrets              |

---

## Secrets Management

| Do                                    | Don't                     |
| ------------------------------------- | ------------------------- |
| Use secrets manager (AWS/Vault)       | Store in env files        |
| Rotate secrets regularly              | Static secrets            |
| Audit secret access                   | No access logging         |
| Encrypt at rest                       | Plain text storage        |
| Different secrets per environment     | Share across environments |

### Secret Types

| Type               | Rotation  | Storage         |
| ------------------ | --------- | --------------- |
| Database passwords | 90 days   | Secrets manager |
| API keys           | On demand | Secrets manager |
| JWT secrets        | 30 days   | Secrets manager |
| Encryption keys    | Yearly    | KMS             |

---

## Feature Flags

| Do                      | Don't                      |
| ----------------------- | -------------------------- |
| Use for gradual rollout | Deploy incomplete features |
| Clean up old flags      | Accumulate forever         |
| Default to safe state   | Default to enabled         |
| Log flag evaluations    | Silent flag changes        |

---

## Config File Structure

| File           | Purpose                     | Git          |
| -------------- | --------------------------- | ------------ |
| `.env.example` | Template with all variables | Committed    |
| `.env.local`   | Local overrides             | Ignored      |
| `.env.test`    | Test environment            | Committed    |

---

## Anti-Patterns

| Avoid                              | Problem           |
| ---------------------------------- | ----------------- |
| Hardcode values                    | No flexibility    |
| Commit secrets                     | Security breach   |
| Different config structure per env | Deployment issues |
| Magic strings                      | Hard to maintain  |
| Config scattered in code           | Hard to find      |

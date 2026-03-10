# CI/CD Principles

## Pipeline Stages

| Stage | Purpose | Fails When |
| ----- | ------- | ---------- |
| Install | Restore dependencies | Lock file out of sync, registry down |
| Lint | Code style, static analysis | Formatting errors, lint violations |
| Type check | Type safety verification | TypeScript errors |
| Test | Unit + integration tests | Failing tests, coverage threshold unmet |
| Build | Compile and bundle | Build errors, missing env vars |
| Deploy | Ship to target environment | Infra errors, health check fails |

### Stage Rules

| Do | Don't |
| -- | ----- |
| Fail fast — run cheapest checks first (lint → types → test → build) | Run expensive builds before linting |
| Cache dependencies between runs | Install from scratch every time |
| Run stages in parallel when independent (lint ∥ type check) | Serialize everything sequentially |
| Pin CI runner versions | Use `latest` tags for runners |

---

## Environment Promotion

| Environment | Purpose | Deploy Trigger | Data |
| ----------- | ------- | -------------- | ---- |
| Development | Local + feature branches | Push to branch | Mock/seed |
| Preview/PR | Per-PR ephemeral environment | PR opened/updated | Seed/staging |
| Staging | Pre-production validation | Merge to `main` / `develop` | Production-like |
| Production | Live users | Manual approval or tag | Real |

### Promotion Rules

| Do | Don't |
| -- | ----- |
| Same artifact through all environments | Rebuild for each environment |
| Environment-specific config via env vars | Hardcode environment differences in code |
| Require staging validation before production | Deploy directly to production |
| Use immutable artifacts (Docker image tag, commit SHA) | Use mutable references (`latest`, branch name) |

---

## Build Principles

| Principle | Meaning |
| --------- | ------- |
| Reproducible | Same commit → same artifact, always |
| Hermetic | No dependency on host machine state |
| Incremental | Cache intermediate results, only rebuild what changed |
| Fast | Optimize for developer feedback loop (target < 5 min) |

### Dependency Caching

| What to Cache | Key |
| ------------- | --- |
| `node_modules` | Hash of lock file (`package-lock.json`, `pnpm-lock.yaml`) |
| Build output | Hash of source files |
| Docker layers | Layer-aware caching with multi-stage builds |

---

## Testing in CI

| Test Type | When to Run | Speed |
| --------- | ----------- | ----- |
| Unit tests | Every push | Seconds |
| Integration tests | Every push | Minutes |
| E2E tests | PR merge, staging deploy | Minutes |
| Smoke tests | Post-deploy | Seconds |
| Performance tests | Scheduled, pre-release | Minutes–hours |

### Rules

| Do | Don't |
| -- | ----- |
| Run tests in isolation (no shared state between runs) | Depend on previous test run's data |
| Set coverage thresholds as a gate | Measure coverage without enforcing |
| Parallelize test suites | Run all tests in a single sequential process |
| Fail the pipeline on flaky tests, then fix them | Skip or retry flaky tests indefinitely |

---

## Deployment Strategies

| Strategy | How It Works | Risk | Rollback |
| -------- | ------------ | ---- | -------- |
| All-at-once | Replace all instances | High — full outage if broken | Redeploy previous |
| Rolling | Replace instances incrementally | Medium — partial impact | Stop rollout |
| Blue/Green | Two identical envs, switch traffic | Low — instant rollback | Switch back |
| Canary | Route small % of traffic to new version | Low — limited blast radius | Route back to old |

---

## Secrets Management in CI

| Do | Don't |
| -- | ----- |
| Use CI platform's secret store | Hardcode secrets in pipeline config |
| Rotate secrets regularly | Use the same secret across all environments |
| Audit secret access logs | Grant secret access to all pipelines |
| Mask secrets in CI output | Print secrets in logs for debugging |
| Scope secrets to environment/branch | Use production secrets in PR builds |

---

## Artifact Management

| Artifact | Storage | Retention |
| -------- | ------- | --------- |
| Docker images | Container registry (tagged by SHA) | Keep last N releases |
| Build output | CI artifacts or object storage | Short-lived (days) |
| Test reports | CI artifacts | Per-pipeline |
| Coverage reports | CI artifacts or dedicated service | Per-pipeline |

---

## Notifications and Observability

| Event | Notify | Channel |
| ----- | ------ | ------- |
| Pipeline failure on `main` | Immediate, team-wide | Slack/Teams channel |
| PR pipeline failure | PR author | PR comment, status check |
| Deployment success | Team | Deploy channel |
| Deployment failure | On-call + team | Alert + deploy channel |

---

## Branch Protection

| Rule | Purpose |
| ---- | ------- |
| Require passing CI before merge | Prevent broken code on `main` |
| Require code review approval | Ensure quality and knowledge sharing |
| Require up-to-date branch | Prevent integration issues |
| Block force-push to `main` | Protect shared history |
| Require signed commits | Verify commit authorship |

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| No CI at all | Bugs found in production | Set up basic lint → test → build pipeline |
| CI that takes 30+ minutes | Developers avoid running it | Cache, parallelize, run cheap checks first |
| Deploying without tests passing | Ships broken code | Make test stage a required gate |
| Manual deployment steps | Error-prone, unreproducible | Automate everything, document exceptions |
| Same secrets in all environments | Blast radius of a leak | Scope secrets per environment |
| No rollback strategy | Stuck with broken deploy | Plan rollback before deploying |
| Skipping staging | Untested in production-like env | Always validate in staging first |
| CI config drift across repos | Inconsistent quality gates | Shared CI templates or reusable workflows |

---

## Principles

- **Fail fast** — cheapest checks first, stop at first failure
- **Reproducible builds** — same input always produces same output
- **Automate everything** — if you do it twice, automate it
- **Immutable artifacts** — build once, deploy the same artifact everywhere
- **Continuous feedback** — fast pipelines, clear notifications, visible status

# Dependency Management

## Semantic Versioning

| Format | Meaning | Example |
| ------ | ------- | ------- |
| `MAJOR.MINOR.PATCH` | Breaking.Feature.Fix | `2.3.1` |
| `^2.3.1` | Allow minor + patch updates | `>=2.3.1 <3.0.0` |
| `~2.3.1` | Allow patch updates only | `>=2.3.1 <2.4.0` |
| `2.3.1` | Exact version | Only `2.3.1` |

### Pinning Strategy

| Context | Strategy | Why |
| ------- | -------- | --- |
| Production deps | Exact or `~` | Stability, predictable builds |
| Dev deps | `^` acceptable | Less risk, easier updates |
| Monorepo shared deps | Exact, synced | Version mismatch causes bugs |

---

## Lock Files

| File | Package Manager | Purpose |
| ---- | --------------- | ------- |
| `package-lock.json` | npm | Exact dependency tree |
| `pnpm-lock.yaml` | pnpm | Exact dependency tree |
| `yarn.lock` | yarn | Exact dependency tree |
| `bun.lock` | bun | Exact dependency tree |

### Rules

| Do | Don't |
| -- | ----- |
| Commit lock file to git | Gitignore lock file |
| Use one package manager per project | Mix npm and yarn |
| Regenerate lock file on conflicts | Manually edit lock file |
| Review lock file changes in PRs | Blindly approve lock file diffs |

---

## Adding Dependencies

| Question | Yes | No |
| -------- | --- | -- |
| Is it a trivial task (< 20 lines)? | Write it yourself | Consider a package |
| Is the package actively maintained? | Safe to add | Find alternative or write own |
| Does it have known vulnerabilities? | Don't add | Safe to proceed |
| Does it pull 50+ transitive deps? | Reconsider | Acceptable |
| Is there a lighter alternative? | Use the lighter one | Use what fits |

### Evaluation Checklist

| Factor | Check |
| ------ | ----- |
| Maintenance | Last publish < 6 months, active issues |
| Size | Bundle size acceptable for use case |
| License | Compatible with project license |
| Types | Has TypeScript types (built-in or `@types/`) |
| Security | No known CVEs, `npm audit` clean |
| Popularity | Community adoption, not a single-author abandoned project |

---

## Auditing

| Action | Command | Frequency |
| ------ | ------- | --------- |
| Check vulnerabilities | `npm audit` / `pnpm audit` | Every CI run |
| Fix auto-fixable | `npm audit fix` | When found |
| Check outdated | `npm outdated` | Weekly/monthly |
| Check unused | `depcheck` or `knip` | Monthly |
| Check bundle impact | `bundlephobia` (web) | Before adding |

---

## Update Strategy

| Type | Frequency | Process |
| ---- | --------- | ------- |
| Patch updates | Weekly (automated) | Dependabot/Renovate → auto-merge if CI passes |
| Minor updates | Bi-weekly | Review changelog, run tests |
| Major updates | Monthly/quarterly | Read migration guide, test thoroughly, dedicated PR |
| Security patches | Immediately | Drop everything, patch, deploy |

### Rules

| Do | Don't |
| -- | ----- |
| Update one major at a time | Update 5 majors in one PR |
| Read changelog before updating | Blindly bump versions |
| Run full test suite after update | Update and ship without testing |
| Pin after major update stabilizes | Leave `^` on freshly updated major |

---

## Import Order

1. Language/runtime built-ins
2. External libraries (third-party packages)
3. Internal absolute paths (`@/features`, `@/shared`)
4. Relative imports (`./`, `../`)

---

## Module Boundaries

| Do | Don't |
| -- | ----- |
| Import from feature's public API (`index.ts`) | Import internal feature files |
| Use shared modules for cross-cutting | Direct imports between features |
| Keep dependencies unidirectional | Circular dependencies |

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| Dependency for trivial task | Bloat, supply chain risk | Write it yourself |
| No lock file in git | Non-reproducible builds | Always commit lock file |
| Ignoring `npm audit` | Known vulnerabilities ship | Audit in CI, fix promptly |
| Never updating deps | Security debt, compatibility issues | Scheduled update cadence |
| Phantom dependencies | Using transitive dep directly | Add to own `package.json` |
| Multiple package managers | Lock file conflicts, inconsistency | Pick one, enforce with `packageManager` field |

---

## Principles

- **Minimize dependencies** — every package is a liability
- **Lock everything** — reproducible builds are non-negotiable
- **Audit continuously** — security is not a one-time check
- **Update regularly** — small frequent updates beat big infrequent ones
- **Evaluate before adding** — maintenance, size, license, security

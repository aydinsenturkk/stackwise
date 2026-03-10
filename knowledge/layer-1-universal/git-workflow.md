# Git Workflow

## Branch Strategy

| Branch | Purpose | Lifetime |
| ------ | ------- | -------- |
| `main` / `master` | Production-ready code | Permanent |
| `develop` | Integration branch | Permanent (if used) |
| `feature/<name>` | New functionality | Until merged |
| `fix/<name>` | Bug fix | Until merged |
| `hotfix/<name>` | Production emergency fix | Until merged |
| `release/<version>` | Release preparation | Until tagged and merged |

### Branch Rules

| Do | Don't |
| -- | ----- |
| Branch from latest `main` or `develop` | Branch from stale branches |
| Keep branches short-lived (days, not weeks) | Let feature branches drift for months |
| Delete merged branches | Accumulate stale branches |
| Use descriptive names: `feature/user-auth` | Use vague names: `feature/stuff` |

---

## Commit Conventions

### Conventional Commits Format

`<type>(<scope>): <description>`

| Type | When |
| ---- | ---- |
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes nor adds |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Build, CI, tooling changes |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace (no logic change) |
| `ci` | CI/CD pipeline changes |
| `build` | Build system or dependency changes |

### Commit Message Rules

| Do | Don't |
| -- | ----- |
| Use imperative mood: "add user auth" | Past tense: "added user auth" |
| Keep subject under 72 characters | Write novels in subject line |
| Explain **why** in body if non-obvious | Only describe **what** changed |
| One logical change per commit | Mix unrelated changes |
| Reference issue: `fix: resolve crash (#42)` | Commit without context |

---

## Merge Strategy

| Strategy | When to Use | Trade-off |
| -------- | ----------- | --------- |
| Merge commit | Default for feature branches | Preserves full history, noisier log |
| Squash merge | Many small/WIP commits | Clean history, loses granular commits |
| Rebase | Linear history preferred | Clean log, rewrites history (never on shared branches) |
| Fast-forward | Trivial single-commit changes | Cleanest, only works if no divergence |

### Rules

| Do | Don't |
| -- | ----- |
| Squash WIP commits before merge | Merge branches with "wip" commits |
| Rebase only local/unshared branches | Rebase `main` or shared branches |
| Resolve conflicts in feature branch | Force-push over others' work |
| Use merge commit for collaborative branches | Squash multi-author branches without agreement |

---

## .gitignore Essentials

| Category | Patterns |
| -------- | -------- |
| Dependencies | `node_modules/`, `.pnp.*` |
| Build output | `dist/`, `build/`, `.next/`, `.nuxt/` |
| Environment | `.env`, `.env.local`, `.env.*.local` |
| IDE | `.idea/`, `.vscode/` (except shared settings), `*.swp` |
| OS | `.DS_Store`, `Thumbs.db` |
| Logs | `*.log`, `logs/` |
| Coverage | `coverage/`, `.nyc_output/` |
| Cache | `.cache/`, `.turbo/`, `.eslintcache` |

---

## Tagging and Releases

| Convention | Format | Example |
| ---------- | ------ | ------- |
| Semantic versioning | `vMAJOR.MINOR.PATCH` | `v1.2.3` |
| Pre-release | `vMAJOR.MINOR.PATCH-<label>` | `v2.0.0-beta.1` |
| Annotated tags (preferred) | `git tag -a v1.2.3 -m "..."` | Includes metadata |

---

## Pull Request Hygiene

| Do | Don't |
| -- | ----- |
| Keep PRs small and focused (< 400 lines) | Submit 2000+ line PRs |
| Write descriptive PR title and body | "fix stuff" as PR title |
| Link related issues | Submit without context |
| Request review from relevant owners | Self-merge without review |
| Address all review comments | Ignore or dismiss feedback |
| Ensure CI passes before requesting review | Push broken code for review |

---

## Conflict Resolution

| Situation | Approach |
| --------- | -------- |
| Simple text conflict | Resolve manually, test, commit |
| Complex logic conflict | Discuss with the other author |
| Lock file conflicts | Regenerate: delete lock file, reinstall |
| Migration conflicts | Never auto-merge — coordinate with team |

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| Committing directly to `main` | No review, broken deployments | Always use branches + PR |
| Giant long-lived branches | Merge hell, integration risk | Short-lived branches, merge often |
| Force-pushing shared branches | Overwrites others' work | Only force-push personal branches |
| Committing secrets | Credential exposure | `.gitignore` + pre-commit hooks |
| "fix", "update", "wip" commits | Useless git history | Use conventional commits |
| Ignoring CI failures | Broken builds accumulate | Fix CI before merging |
| Merge commits on merge commits | Tangled history | Consistent merge strategy per repo |

---

## Principles

- **Commit often, push regularly** — small increments reduce risk
- **History is documentation** — write commits for the next person reading them
- **Branches are cheap** — use them liberally, delete them promptly
- **Never rewrite shared history** — only rebase local, unshared work
- **Automate enforcement** — use hooks and CI, not discipline alone

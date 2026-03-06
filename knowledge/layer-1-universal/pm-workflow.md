# PM Workflow

Spec-driven development workflow using GitHub Issues as the single source of truth. Planning artifacts are stored in `.claude/pm/`.

## Commands

| Command | Purpose |
|---------|---------|
| `/ck-plan <idea> [--auto]` | Define scope, create PRD, epic, tasks, GitHub Issues. `--auto` executes all tasks sequentially |
| `/ck-tasks [filter]` | View task status dashboard |
| `/ck-work [issue]` | Pick up a task and implement it |
| `/ck-ship [issue]` | Create PR, optionally merge |
| `/ck-standup` | Status report across all epics |

## Development Flow

```
/ck-plan <project idea>        # First run: scope mode
    │
    ├── Define project vision
    ├── Decompose into epics
    ├── Create PROJECT.md (roadmap)
    ├── User confirms epic list
    └── Detail first epic (PRD + tasks + GitHub Issues)
    │
    ▼
┌─ /ck-work ──────────────────┐
│   Pick task (auto or manual) │
│   Load epic + PRD context    │
│   Create branch, implement   │
│   Test + lint + commit       │
│   Unblock dependent tasks    │
└──────────┬───────────────────┘
           │
           ▼
   /ck-ship
       Create PR (Closes #N)
       Optional: --merge
           │
           ▼
       More tasks in epic?
       ├── Yes → /ck-work (loop)
       └── No  → /ck-plan <next epic>
                     │
                     ▼
                 Epic mode: detail next epic
                 from PROJECT.md roadmap
                     │
                     └── back to /ck-work loop
```

### Integration Branch Flow

When `profile.json` has `workflow.integration_branch: true`:

```
/ck-plan <epic>
    │
    ├── Plan epic (PRD + tasks + GitHub Issues)
    ├── Create integration branch: feat/<epic-slug>
    └── Push to origin
    │
    ▼
┌─ /ck-work ──────────────────────────┐
│   Branch from feat/<epic-slug>       │
│   (not from main)                    │
│   Branch name: <slug>/<number>-<desc>│
│   Implement, test, commit            │
└──────────┬───────────────────────────┘
           │
           ▼
   /ck-ship
       PR target: feat/<epic-slug>
       (not main — no container triggered)
           │
           ▼
       More tasks?
       ├── Yes → /ck-work (loop)
       └── No  → /ck-ship --final
                     │
                     ▼
                 feat/<epic-slug> → main (final PR)
                 Container triggered, epic closed
```

## Automated Flow

`/ck-plan <idea> --auto` combines planning and execution into a single command. It plans the epic (or resumes an existing one) and then executes all tasks sequentially: implement → test → PR → merge → next task.

```
/ck-plan <idea> --auto
    │
    ├── Plan epic (Steps 1-8) — or skip if already planned
    │
    ▼
┌─ Auto-Execute Loop ─────────────────────────┐
│                                              │
│   Read fresh context (tasks.md + GitHub)     │
│   Select next unblocked, unassigned task     │
│       │                                      │
│       ├── No tasks left → Epic complete ─────┼──► Close epic, activate next
│       ├── All blocked → Deadlock, STOP ──────┼──► Report blocked tasks
│       │                                      │
│       ▼                                      │
│   ck-work: assign, branch, implement,        │
│            typecheck, lint, test, commit      │
│       │                                      │
│       ├── Fail after 3 retries → STOP ───────┼──► Report error + branch
│       │                                      │
│       ▼                                      │
│   ck-ship --merge: push, PR, squash merge,   │
│                    close issue, unblock deps  │
│       │                                      │
│       ├── Merge conflict → STOP ─────────────┼──► Report conflict
│       │                                      │
│       ▼                                      │
│   Progress: ✓ Task #N (X/Y done)             │
│   Loop ──────────────────────────────────────┘
```

### Resuming Auto Mode

If auto mode stops (failure, deadlock, or manual interruption), fix the issue and resume:

```bash
/ck-plan <epic-slug> --auto
```

Since the epic is already planned and tasks exist, it skips planning and picks up from the next open task.

## Key Concepts

### Scope Mode vs Epic Mode

`/ck-plan` has two modes based on whether `.claude/pm/PROJECT.md` exists:

- **Scope Mode** (first run): Takes a broad project idea, asks clarifying questions, collects architecture decisions (frontend model, backend model, API style, database, auth), decomposes into epics, creates PROJECT.md as the roadmap, then details the first epic. First epic's first task is always "Project Setup".
- **Epic Mode** (subsequent runs): Takes a specific epic from the roadmap (or a new idea), creates its PRD + tasks + GitHub Issues, updates PROJECT.md

### Architecture Decisions

PROJECT.md records the project's architecture choices. These decisions guide all implementation:

- **Frontend model:** Feature-Based, Atomic Design, or Module-Based
- **Backend model:** Layered, DDD, Hexagonal, Clean Architecture, or Modular Monolith
- **API style:** REST, GraphQL, tRPC
- **Database, Auth, and other key technical choices**

When implementing tasks (`/ck-work`), always read PROJECT.md's Architecture Decisions section and follow the chosen model's rules from the corresponding knowledge files (`frontend-architecture.md`, `backend-architecture.md`).

### Artifact Structure

```
.claude/pm/
  PROJECT.md              # Project roadmap — single entry point
  prds/
    <slug>.md             # PRD per epic
  epics/
    <slug>/
      epic.md             # Epic definition + task table
      tasks.md            # GitHub Issue # → task mapping
```

### GitHub Labels

| Label | Purpose |
|-------|---------|
| `pm:epic` | Epic tracking issue |
| `pm:task` | Individual task |
| `pm:blocked` | Blocked by another task |
| `priority:high/medium/low` | Priority level |
| `size:small/medium/large` | Estimated effort |
| `scope:<workspace>` | Workspace scope (monorepo only) |

Labels are created lazily — on first use via `gh label create`.

### Task Selection

When no issue number is given to `/ck-work`, it automatically picks the best next task:
1. Open, not blocked (`pm:blocked` absent), unassigned
2. Sorted by priority (high > medium > low)
3. Then by issue number (lower first)

### Issue Conventions

PROJECT.md records the project's issue template preferences:

- **Task title patterns:** Conventional, User Story, Job Story, Imperative
- **Epic title patterns:** Simple, Goal-based, Domain-scoped
- **Task body templates:** Minimal, Detailed, User Story
- **Epic body templates:** Checklist, Full

When creating issues (`/ck-plan`), always use the conventions specified in PROJECT.md.

### Workspace Scoping (Monorepos)

In monorepo projects, tasks and epics include a Scope field:
- **Epic scope:** Which workspace(s) the epic primarily targets (`web`, `api`, `cross`)
- **Task scope:** Which specific workspace the task modifies
- **GitHub label:** `scope:<workspace>` label on task issues
- **Rule loading:** `/ck-work` loads only rules matching the task's workspace type

Scope values match workspace directory names from `.claude/profile.json`.
Special value `cross` indicates the epic/task spans multiple workspaces.

### Branch Strategy

`.claude/profile.json` records the branch strategy under `workflow.integration_branch`. Two modes are supported:

**Default** (`integration_branch: false`):
- Task branches: `feat/<issue-number>-<short-description>`
- PR target: `main`
- Each task is a direct PR to main
- Example: `feat/13-create-api-endpoints` → PR to `main`

**Integration Branch** (`integration_branch: true`):
- Integration branch: `feat/<epic-slug>` (long-lived, one per epic)
- Task branches: `<epic-slug>/<issue-number>-<short-description>`
- PR target: `feat/<epic-slug>` (not main)
- Final merge: `feat/<epic-slug>` → `main` when epic is complete
- Use when `feat/*` PRs trigger deployments (preview containers, staging environments)
- Example: `cms/13-login-form` → PR to `feat/cms` → final PR to `main`

The integration branch setting is configured via `npx @aydinsenturk/claudekit` and stored in `profile.json`. The integration branch is created by `/ck-plan` when an epic is planned. Task branches are created by `/ck-work` from the integration branch. Final merge is done by `/ck-ship --final`.

### Commit Convention

```
feat: <description>

Implements #<issue-number>
```

### PR Convention

PR body includes `Closes #<issue-number>` to auto-close the task issue on merge. References the epic issue for traceability.

## Rules

- **GitHub Issues is the source of truth** for task status. Local `.claude/pm/` files are planning artifacts and mappings.
- **One task = one PR.** Each task should be completable in a single pull request.
- **Unblock eagerly.** After completing a task, check if dependent tasks can have their `pm:blocked` label removed.
- **PROJECT.md is the entry point.** When resuming work or starting a new session, read PROJECT.md first to understand the full picture.
- **Epic order matters.** Epics have dependencies. Don't start an epic before its dependencies are complete.
- **Size discipline.** Small: < 1 hour, Medium: 1-3 hours, Large: 3-8 hours. Split anything larger.
- **Auto mode is fail-fast.** If a task fails after 3 fix attempts, stop immediately. Don't skip broken tasks — downstream tasks may depend on them.
- **Fresh context every iteration.** In auto mode, re-read tasks.md and GitHub Issues at the start of each loop iteration. Don't rely on stale state from previous iterations.
- **Clean state between tasks.** Each task starts from the base branch with a clean working tree. Always `git checkout <base> && git pull` between tasks.
- **Only pick unassigned tasks.** In auto mode, skip tasks assigned to other users. Only pick up unassigned, unblocked tasks.
- **Scope-aware rule loading.** In monorepos, `/ck-work` reads the task's Scope field and loads only the rules matching that workspace's type (frontend/backend/shared). Cross-scope tasks load rules for all involved types.
- **Branch strategy consistency.** All tasks in an epic follow the same branch strategy from `profile.json`. Don't mix default and integration branch workflows within a single epic.
- **Integration branch freshness.** When using integration branch strategy, regularly merge main into the integration branch to reduce final merge conflicts.

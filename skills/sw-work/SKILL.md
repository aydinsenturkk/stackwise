Pick up a task and implement it

## Input

`$ARGUMENTS` - Optional: issue number (e.g., `42`), or `--parallel 42 44` for parallel execution

## Workflow

### Step 1: Select the Task

**If issue number is provided:**
Fetch the specified issue:

```bash
gh issue view $ARGUMENTS --json number,title,body,labels,assignees,state
```

Verify it has the `pm:task` label and is open. If not, warn the user.

**If `--parallel` is provided:**
Parse the issue numbers after `--parallel`. For each issue, verify it's an open `pm:task`. Then skip to Step 8 for parallel execution.

**If no argument:**
Find the next task automatically — the highest-priority, unblocked, unassigned, open task:

```bash
gh issue list --label "pm:task" --state open --json number,title,labels,assignees --limit 50
```

Filter out issues that have `pm:blocked` label or are already assigned. Sort by priority (high > medium > low), then by issue number. Pick the first one.

If no task is available, inform the user and suggest checking blocked tasks with `/sw-tasks blocked`.

### Step 2: Load Context

1. Read the task issue body to find the epic reference (look for "Part of #<number>" or "Epic" section)

2. **If epic reference found (epic task):**
   a. Find the epic slug by checking `.claude/pm/epics/*/tasks.md` for the epic issue number
   b. Read the epic file: `.claude/pm/epics/<slug>/epic.md`
   c. Read the PRD: `.claude/pm/prds/<slug>.md`
   d. Understand the full context: what the feature is, what this specific task needs to accomplish, and what constraints exist
   e. Read `.claude/profile.json` and check `workflow.integration_branch`
   f. If `integration_branch` is `true`:
      - Read the integration branch name from `.claude/pm/epics/<slug>/epic.md`
        (look for "Integration Branch:" field)

3. **If no epic reference (standalone task):**
   - The task issue body IS the full context — no epic/PRD to load
   - Read `.claude/profile.json` for stack and conventions
   - Standalone tasks always branch from the base branch (no integration branch)

4. If monorepo: Read the task's "Scope" field from the issue body
   - Parse the `## Scope` section → workspace directory name
   - If scope is missing, infer from the task title or ask the user

### Step 3: Assign and Branch

1. Assign the issue:

```bash
gh issue edit <number> --add-assignee "@me"
```

2. Create a branch based on task type:

   **Standalone task** (no epic reference):

   Determine the type from the task title prefix or labels: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.

   ```bash
   git checkout <base-branch>
   git pull origin <base-branch>
   git checkout -b <type>/<number>-<short-description>
   ```

   Example: `fix/42-login-validation`, `feat/55-add-export-csv`

   **Epic task — default** (`integration_branch: false`):

   ```bash
   git checkout <base-branch>
   git pull origin <base-branch>
   git checkout -b feat/<number>-<short-description>
   ```

   **Epic task — integration branch enabled** (`integration_branch: true`):

   ```bash
   git checkout feat/<epic-slug>
   git pull origin feat/<epic-slug>
   git checkout -b <epic-slug>/<number>-<short-description>
   ```

### Step 4: Load Project Rules

Load rules **selectively** based on task nature to minimize context usage. Don't load the entire rule set — only what's relevant.

1. Read `.claude/profile.json` to understand the project's stack
2. Determine which universal rules (`01-*`) are relevant to the task:
   - **Always load:** `architecture-principles`, `typescript-patterns`, `naming-conventions`
   - **Feature/refactor tasks:** add `error-handling`
   - **API tasks:** add `api-design`, `security-principles`
   - **Test tasks:** add `testing-philosophy`
   - **Performance tasks:** add `performance-principles`
   - **Skip unless directly relevant:** `ci-cd-principles`, `git-workflow`, `pm-workflow`, `documentation-standards`, `observability`, `dependency-management`, `configuration-management`, `code-review-standards`
3. If monorepo and task has a scope:
   a. Find the workspace in `profile.workspaces` where `dir` matches the task's scope
   b. Use `workspace.type` to determine domain (frontend/backend/shared)
   c. Load domain/framework/tool rules:
      - `02-*` (domain) — only matching `workspace.type`
      - `03-*` (framework) — only matching `workspace.frameworks`
      - `04-*` (tool) — only tools actually used by the files being changed
   d. If scope is `cross`, load rules for all involved workspace types
4. If not monorepo: based on the files you will modify, read rules from `.claude/rules/`:
   - `02-*` (domain rules) - load based on the domain (frontend vs backend)
   - `03-*` (framework rules) - load for the active framework
   - `04-*` (tool rules) - load only for tools actually used in the changed files
5. If no profile exists, read all available rules from `.claude/rules/` and apply relevant ones

### Step 5: Implement

- Follow the acceptance criteria from the task issue
- Apply all loaded project rules and conventions
- Write clean, well-typed code
- Add or update tests as needed
- Handle edge cases mentioned in the task or PRD

### Step 6: Verify

Run quality checks:

```bash
# Type check
npx tsc --noEmit 2>/dev/null

# Lint
npm run lint 2>/dev/null

# Tests
npm test 2>/dev/null
```

Fix any failures before proceeding. If tests don't exist for the changed area, note this.

After all checks pass, update the task issue to check off completed checklist items.

This applies to ALL task body templates (Minimal, Detailed, User Story):

1. Fetch the current issue body:

```bash
gh issue view <number> --json body -q '.body'
```

2. Parse all `- [ ]` items in the body. For each item, determine if it's completed:

   **Acceptance Criteria** (all templates):
   - Check off each criterion that the implementation satisfies
   - For Given/When/Then format (User Story template), check off if the scenario works correctly

   **Definition of Done** (Detailed template only — skip if not present):
   - `Implementation complete` → ✓ (Step 5 done)
   - `Tests pass` → ✓ if tests passed
   - `Lint/typecheck pass` → ✓ if lint/typecheck passed
   - `PR reviewed` → leave unchecked (not yet reviewed)

3. Update the issue with checked items:

```bash
gh issue edit <number> --body "<updated body with checked items>"
```

Only check off items that are genuinely completed. Leave unchecked any criteria that weren't fully met or don't exist in the template.

### Step 7: Commit

Create a conventional commit referencing the issue:

```bash
git add <changed-files>
git commit -m "feat: <description>

Implements #<number>"
```

Use the appropriate commit type (`feat`, `fix`, `refactor`, etc.) based on the task nature.

After committing, check if any tasks that were blocked by this task can be unblocked:

```bash
# Find issues that reference this task as a blocker
gh issue list --label "pm:blocked" --state open --json number,body --limit 50
```

For each blocked issue whose only blocker is the completed task, remove the `pm:blocked` label:

```bash
gh issue edit <blocked-number> --remove-label "pm:blocked"
```

### Step 8: Parallel Execution

When `--parallel` is used with multiple issue numbers:

1. Verify all specified tasks are open, unblocked, and independent (not blocking each other)
2. For each task, spawn a separate agent in a worktree:
   - Each agent gets its own isolated worktree
   - Each agent follows Steps 2-7 independently
   - All agents work concurrently

```
For each issue number in --parallel list:
  - Create worktree branch: feat/<number>-<description>
  - Agent executes Steps 2-7 in the worktree
  - Report results back
```

3. After all agents complete, summarize results for each task

### Output

After completing, display:
- Task number and title
- Summary of changes made
- Files modified/created
- Test results (pass/fail)
- Branch name
- Any unblocked dependent tasks
- Next step: `/sw-ship <number>` to create a PR

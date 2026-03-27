Plan work as a standalone task or a full epic with PRD, tasks, and GitHub Issues

## Input

`$ARGUMENTS` - The feature idea or description (e.g., `add user notifications system`) or a broad project description.

**Flags:**
- `--auto` — After planning, automatically execute all tasks in the epic (implement → test → PR → merge) until the epic is complete. Can be combined with an epic slug or idea: `user-notifications --auto`

## Workflow

### Step 1: Parse the Idea

Read `$ARGUMENTS`. If the idea is too vague or short (fewer than 5 words), ask the user clarifying questions:
- What problem does this solve?
- Who is the target user?
- What are the key requirements?

### Step 2: Assess Scope

Analyze the parsed idea to determine the planning tier:

**Standalone Task** — single, focused work item completable in one PR:
- Bug fix, small feature, config change, refactor
- Affects one concern or module
- No sub-tasks needed

**Epic** — multi-task initiative requiring coordination:
- Spans multiple modules or concerns
- Needs multiple PRs to complete
- Has internal dependencies between sub-tasks
- `--auto` flag implies epic tier

Present your assessment to the user:

> "This looks like a **standalone task** — a single PR should cover it. Proceed as standalone, or escalate to an epic?"

or:

> "This looks like an **epic** — it'll need multiple tasks and PRs. Proceed as epic?"

If the user confirms, continue with the appropriate path below.

---

### Path A: Standalone Task

For standalone tasks, skip the full PRD/Epic ceremony and create a single GitHub issue.

#### A1: Ensure Labels

```bash
gh label create "pm:task" --description "Individual task" --color "0075CA" 2>/dev/null || true
gh label create "priority:high" --description "High priority" --color "D73A4A" 2>/dev/null || true
gh label create "priority:medium" --description "Medium priority" --color "FBCA04" 2>/dev/null || true
gh label create "priority:low" --description "Low priority" --color "0E8A16" 2>/dev/null || true
gh label create "size:small" --description "Small task" --color "C5DEF5" 2>/dev/null || true
gh label create "size:medium" --description "Medium task" --color "BFD4F2" 2>/dev/null || true
gh label create "size:large" --description "Large task" --color "D4C5F9" 2>/dev/null || true
```

#### A2: Load Conventions

If `.claude/pm/PROJECT.md` exists, read the **Issue Conventions** section to use the project's task title and body patterns. If it doesn't exist, use **Conventional** title pattern and **Minimal** body template as defaults.

#### A3: Determine Task Type

Infer the type from the idea:
- `feat` — new functionality
- `fix` — bug fix
- `refactor` — code restructuring
- `chore` — maintenance, config, tooling
- `docs` — documentation only
- `test` — adding or fixing tests

#### A4: Review Before Creating

Present the issue that will be created:

> **Title:** `<type>: <description>`
> **Labels:** `pm:task`, `priority:<level>`, `size:<size>`
> **Body:** (preview of the issue body)
>
> "Create this issue?"

Wait for the user's confirmation before creating.

#### A5: Create GitHub Issue

Create a single issue using the conventions:

```bash
gh issue create \
  --title "<type>: <description>" \
  --label "pm:task,priority:<level>,size:<size>" \
  --body "<task body per convention, WITHOUT ## Epic section>"
```

The task body follows the same template as epic tasks (Minimal/Detailed/User Story from conventions), but **without** the `## Epic` section — standalone tasks have no epic parent.

**Monorepo:** If `.claude/profile.json` has `monorepo: true`, add `scope:<workspace>` to the labels.

#### A6: Output

Display:
- Task issue number and URL
- Task title and labels
- Suggested branch: `<type>/<number>-<short-desc>` (e.g., `fix/42-login-validation`)
- Command to start: `/sw-work <issue-number>`

**Stop here.** Do not continue to Path B steps.

---

### Path B: Epic

Continue with the full planning flow below (Steps 3–12).

### Step 3: Understand Project Context

1. Read `.claude/profile.json` to understand the project's stack and conventions
2. Check if `.claude/pm/PROJECT.md` exists

**If `PROJECT.md` does NOT exist → Scope Mode (first run):**

This is a new project. Before creating any epic, define the overall scope first.

1. Create the directory structure:

```
.claude/pm/
  PROJECT.md
  prds/
  epics/
```

2. Analyze `$ARGUMENTS` — it may be a broad project description (e.g., "personal finance tracker app") or a specific feature
3. Ask clarifying questions to understand the full project:
   - What is the core problem this project solves?
   - Who are the target users?
   - What are the main feature areas?
4. Ask about architecture decisions:
   - **Frontend model** (if applicable): Feature-Based, Atomic Design, or Module-Based
   - **Backend model** (if applicable): Layered, DDD, Hexagonal, Clean Architecture, or Modular Monolith
   - **API style**: REST, GraphQL, tRPC
   - **Database**: PostgreSQL, MySQL, MongoDB, SQLite, etc.
   - **Auth strategy**: JWT, session-based, OAuth, etc.
   - Other key technical decisions relevant to the project
5. Ask about issue conventions:
   - **Task title pattern:** Conventional (`<type>: <description>`) / User Story (`As a <user>, I want...`) / Job Story (`When <situation>, I want...`) / Imperative (`<Verb> <object>`)
   - **Epic title pattern:** Simple (`Epic: <title>`) / Goal-based (`Epic: Enable <outcome>`) / Domain-scoped (`Epic(<domain>): <title>`)
   - **Task body template:** Minimal / Detailed / User Story
   - **Epic body template:** Checklist / Full
6. Decompose the project into epics (major feature areas). For each epic, define:
   - Title and one-line description
   - Scope (monorepo only): which workspace the epic targets
   - Dependencies on other epics
   - Relative priority
7. The first epic's first task is always **"Project Setup"** — initialize the project, install dependencies, run `npx stackwise`
8. Write `.claude/pm/PROJECT.md` (**Monorepo:** If `profile.json` has `monorepo: true`, include the Scope column. Scope values are workspace dir names or `cross`. Omit it for single-repo projects):

```markdown
# Project: <name>

## Vision
<1-2 sentence project description>

## Target Users
<who this is for>

## Architecture Decisions

| Area | Decision | Notes |
|------|----------|-------|
| Frontend | <Feature-Based / Atomic Design / Module-Based> | <rationale> |
| Backend | <Layered / DDD / Hexagonal / Clean / Modular Monolith> | <rationale> |
| API | <REST / GraphQL / tRPC> | <details> |
| Database | <PostgreSQL / MySQL / MongoDB / etc.> | <details> |
| Auth | <JWT / session / OAuth / etc.> | <details> |

## Issue Conventions

| Setting | Choice |
|---------|--------|
| Task title | <Conventional / User Story / Job Story / Imperative> |
| Epic title | <Simple / Goal-based / Domain-scoped> |
| Task body | <Minimal / Detailed / User Story> |
| Epic body | <Checklist / Full> |

## Epics

| # | Epic | Description | Scope | Status | Dependencies | Progress |
|---|------|-------------|-------|--------|--------------|----------|
| 1 | <epic title> | <one-liner> | <workspace> | planned | - | - |
| 2 | <epic title> | <one-liner> | <workspace> | planned | Epic 1 | - |
| 3 | <epic title> | <one-liner> | cross | planned | Epic 1, 2 | - |

## Epic Order & Dependencies
1. <epic> — no dependencies
2. <epic> — depends on <epic>
3. <epic> — depends on <epic>, <epic>
```

9. Present the epic roadmap to the user for confirmation
10. After confirmation, proceed to Step 4 with the **first epic** (highest priority, no dependencies). Set its status to `active` in PROJECT.md.

**If `PROJECT.md` exists → Epic Mode (subsequent runs):**

1. Read `.claude/pm/PROJECT.md` to understand existing epics, ordering, and dependencies
2. Check existing PRDs in `.claude/pm/prds/` to avoid duplication
3. Determine which epic to plan:
   - If `$ARGUMENTS` matches a planned/active epic from PROJECT.md **AND** `.claude/pm/epics/<slug>/tasks.md` already exists → tasks are already created. If `--auto` is set, skip directly to Step 12. Otherwise show the Output summary.
   - If `$ARGUMENTS` matches a planned epic from PROJECT.md but tasks don't exist yet, proceed to Step 4
   - If `$ARGUMENTS` is a new idea not in PROJECT.md, add it as a new epic
4. Proceed to Step 4

### Step 4: Explore & Brainstorm

Before writing any plan documents, explore the problem space with the user.

**If arriving from Scope Mode (first epic of a new project):** The codebase is empty or minimal — skip 4a (codebase research) and go directly to 4b. In 4b, focus on technology choices, project structure, and implementation strategy rather than existing code analysis. The architecture decisions from Step 3 (PROJECT.md) provide the foundation for the discussion.

#### 4a: Research the Codebase

Delegate codebase research to an **Explore agent** to keep the main context clean. Spawn the agent with the epic idea as the query:

> "Search the codebase for code, patterns, and files relevant to: `<epic idea>`. Report: relevant files and modules, existing patterns that can be reused, technical constraints (database schema, API contracts, shared types), dependencies involved."

The agent returns a structured summary. Only this summary enters the main conversation — not raw file contents.

Present the summary to the user:

> "Here's what I found in the codebase that's relevant to this feature: ..."

#### 4b: Discuss Approaches

Based on the codebase research (or architecture decisions for new projects), propose 2-3 possible approaches:

For each approach, explain:
- **What:** Brief description of the approach
- **How:** Key implementation details
- **Pros:** Benefits, simplicity, alignment with existing patterns
- **Cons:** Trade-offs, risks, complexity
- **Affected areas:** Which files/modules will change

Let the user ask questions, challenge assumptions, suggest alternatives. Iterate until alignment.

#### 4c: Confirm Direction

Summarize the chosen approach:

> "We'll go with [approach]: [brief description]. This means [key implications]. Agreed?"

Wait for explicit confirmation before proceeding to the PRD.

### Step 5: Generate the PRD

Create a slug from the idea (e.g., `user-notifications`).

Write `.claude/pm/prds/<slug>.md` with this structure:

```markdown
# PRD: <Title>

**Status:** Draft
**Created:** <date>
**Epic:** <slug>

## Problem

<What problem does this solve? Who is affected?>

## Solution

<High-level approach to solving the problem>

## Requirements

### Must Have
- <requirement 1>
- <requirement 2>

### Nice to Have
- <optional requirement>

## Out of Scope
- <explicitly excluded items>

## Technical Notes
- <architecture considerations, dependencies, constraints>

## Success Criteria
- [ ] <measurable criterion 1>
- [ ] <measurable criterion 2>
```

### Step 6: Decompose into Epic and Tasks

Write `.claude/pm/epics/<slug>/epic.md`.

**Monorepo:** If `.claude/profile.json` has `monorepo: true`, include the **Scope** column in the Tasks table. Omit it for single-repo projects.

```markdown
# Epic: <Title>

**PRD:** ../.../prds/<slug>.md
**Status:** Open

## Tasks

| # | Task | Size | Priority | Scope | Blocked By |
|---|------|------|----------|-------|------------|
| 1 | <task description> | small/medium/large | high/medium/low | <workspace> | - |
| 2 | <task description> | small | high | <workspace> | - |
| 3 | <task description> | medium | medium | <workspace> | 1, 2 |

## Notes
- <implementation notes, sequencing rationale>
```

Guidelines for task decomposition:
- Each task should be completable in a single PR
- Small: < 1 hour, Medium: 1-3 hours, Large: 3-8 hours
- Tasks larger than "large" should be split further
- Identify dependencies between tasks clearly
- Order tasks so blocked ones come after their dependencies

### Step 7: Review & Approve

Before creating any GitHub issues, present the full plan to the user for review.

#### 7a: Present the Plan

Display a summary:

```
## Plan Review

### PRD: <title>
Problem: <1-2 sentence summary>
Solution: <chosen approach from brainstorm>

### Tasks (<count> total)

| # | Task | Size | Priority | Blocked By |
|---|------|------|----------|------------|
| 1 | <task> | small | high | - |
| 2 | <task> | medium | high | - |
| 3 | <task> | small | medium | 1, 2 |

### Files Created
- .claude/pm/prds/<slug>.md
- .claude/pm/epics/<slug>/epic.md
```

#### 7b: Iterate

Ask the user:

> "This is the plan. Would you like to change anything before I create the GitHub issues?"

The user may:
- Approve → proceed to Step 8
- Request changes → modify PRD and/or epic.md, then re-present
- Add/remove/reorder tasks → update epic.md, then re-present
- Cancel → stop entirely, local files remain for future use

#### 7c: Confirm

Only after explicit approval ("tamam", "onaylıyorum", "evet", "go ahead", etc.) proceed to Step 8.

### Step 8: Ensure GitHub Labels Exist

Check and create labels if they don't exist:

```bash
# Check and create each label (idempotent)
gh label create "pm:epic" --description "Epic tracking issue" --color "6F42C1" 2>/dev/null || true
gh label create "pm:task" --description "Individual task" --color "0075CA" 2>/dev/null || true
gh label create "pm:blocked" --description "Blocked by another task" --color "E4E669" 2>/dev/null || true
gh label create "priority:high" --description "High priority" --color "D73A4A" 2>/dev/null || true
gh label create "priority:medium" --description "Medium priority" --color "FBCA04" 2>/dev/null || true
gh label create "priority:low" --description "Low priority" --color "0E8A16" 2>/dev/null || true
gh label create "size:small" --description "Small task" --color "C5DEF5" 2>/dev/null || true
gh label create "size:medium" --description "Medium task" --color "BFD4F2" 2>/dev/null || true
gh label create "size:large" --description "Large task" --color "D4C5F9" 2>/dev/null || true

# Monorepo only: create scope labels for each workspace
# For each workspace in profile.workspaces:
gh label create "scope:<workspace-dir>" --description "Scope: <workspace-dir>" --color "1D76DB" 2>/dev/null || true
```

### Step 9: Create GitHub Issues

Read the **Issue Conventions** section from `.claude/pm/PROJECT.md` to determine which title patterns and body templates to use. Apply the selected convention for every issue created below.

#### Epic Title Patterns

| Convention | Format | Example |
|------------|--------|---------|
| **Simple** | `Epic: <title>` | `Epic: User Authentication` |
| **Goal-based** | `Epic: Enable <outcome>` | `Epic: Enable secure user login` |
| **Domain-scoped** | `Epic(<domain>): <title>` | `Epic(auth): User Authentication` |

#### Task Title Patterns

| Convention | Format | Example |
|------------|--------|---------|
| **Conventional** | `<type>: <description>` | `feat: add login endpoint` |
| **User Story** | `As a <user>, I want <action> so that <benefit>` | `As a user, I want to reset my password so that I can regain access` |
| **Job Story** | `When <situation>, I want <action>, so I can <outcome>` | `When logged out, I want to authenticate, so I can access my data` |
| **Imperative** | `<Verb> <object>` | `Implement JWT authentication` |

Conventional type prefixes: `feat`, `fix`, `setup`, `refactor`, `test`, `docs`, `chore`

#### Epic Body Templates

> **Monorepo only:** If `.claude/profile.json` has `monorepo: true`, include the `## Scope` section in epic body templates (after `## Overview`). Omit it for single-repo projects.

**Checklist:**

```markdown
## Overview
<brief description from PRD>

## Scope
Primary: <workspace> | Cross: <workspace1>, <workspace2>

## Tasks
- [ ] #<number> - <task title>

## PRD
<link to PRD or inline summary>
```

**Full:**

```markdown
## Overview
<brief description from PRD>

## Scope
Primary: <workspace> | Cross: <workspace1>, <workspace2>

## Goals
- <goal 1>
- <goal 2>

## Tasks
- [ ] #<number> - <task title>

## Success Criteria
- [ ] <criterion>

## PRD
<link to PRD or inline summary>
```

#### Task Body Templates

> **Monorepo only:** If `.claude/profile.json` has `monorepo: true`, include the `## Scope` section in all task body templates (before `## Epic`). Omit it for single-repo projects.

**Minimal:**

```markdown
## Description
<what needs to be done>

## Acceptance Criteria
- [ ] <criterion>

## Scope
<workspace-dir>

## Epic
Part of #<epic-number>

## Blocked By
- #<number> (only if blocked)
```

**Detailed:**

```markdown
## Description
<what needs to be done>

## Context
<why this task exists, background>

## Acceptance Criteria
- [ ] <criterion>

## Technical Notes
- <affected files, architecture notes>

## Definition of Done
- [ ] Implementation complete
- [ ] Tests pass
- [ ] Lint/typecheck pass
- [ ] PR reviewed

## Scope
<workspace-dir>

## Epic
Part of #<epic-number>

## Blocked By
- #<number> (only if blocked)
```

**User Story:**

```markdown
## User Story
As a <user>, I want <action> so that <benefit>.

## Acceptance Criteria
- [ ] Given <context>, when <action>, then <result>

## Notes
<additional context>

## Scope
<workspace-dir>

## Epic
Part of #<epic-number>

## Blocked By
- #<number> (only if blocked)
```

#### Creating Issues

1. Create the epic issue first using the selected epic title pattern and epic body template:

```bash
gh issue create \
  --title "<epic title per convention>" \
  --label "pm:epic" \
  --body "<epic body per template>"
```

2. Create individual task issues using the selected task title pattern and task body template:

```bash
gh issue create \
  --title "<task title per convention>" \
  --label "pm:task,priority:<level>,size:<size>" \
  --body "<task body per template>"
```

**Monorepo:** If the project is a monorepo, add `scope:<workspace>` to the labels:

```bash
gh issue create \
  --title "<task title per convention>" \
  --label "pm:task,priority:<level>,size:<size>,scope:<workspace>" \
  --body "<task body per template>"
```

For blocked tasks, also add the `pm:blocked` label.

3. After creating all task issues, update the epic issue body with the actual issue numbers.

4. If `.claude/profile.json` has `workflow.integration_branch: true`, create the integration branch:

```bash
git checkout <base-branch>
git pull origin <base-branch>
git checkout -b feat/<epic-slug>
git push -u origin feat/<epic-slug>
git checkout <base-branch>
```

Add to `.claude/pm/epics/<slug>/epic.md`:

```markdown
**Integration Branch:** `feat/<epic-slug>`
```

### Step 10: Write Task Mapping

Write `.claude/pm/epics/<slug>/tasks.md`.

**Monorepo:** If `.claude/profile.json` has `monorepo: true`, include a **Scope** column.

```markdown
# Task Mapping: <Title>

**Epic Issue:** #<number>

| Issue | Task | Status | Size | Priority | Scope |
|-------|------|--------|------|----------|-------|
| #<number> | <task title> | open | small | high | api |
| #<number> | <task title> | open | medium | medium | web |
```

### Step 11: Update Project Index

Update `.claude/pm/PROJECT.md` — create it if it doesn't exist.

If creating for the first time, ask the user for a short project name (or infer from the repo name).

The file maintains a single source of truth for all epics.

**Monorepo:** If `.claude/profile.json` has `monorepo: true`, include a **Scope** column after GitHub. Scope values are workspace directory names (`web`, `api`, `shared`) or `cross`.

```markdown
# Project: <name>

## Epics

| # | Epic | PRD | GitHub | Scope | Status | Progress |
|---|------|-----|--------|-------|--------|----------|
| 1 | Auth sistemi | [PRD](prds/auth.md) | #10 | api | active | 3/5 |
| 2 | Kullanıcı profili | [PRD](prds/user-profile.md) | #20 | web | planned | 0/4 |

## Epic Order & Dependencies
1. Auth sistemi — no dependencies
2. Kullanıcı profili — depends on Auth
3. Bildirim sistemi — depends on Auth, Kullanıcı profili
```

Rules:
- Append the new epic as a new row in the table
- Set its status to `planned` (first epic defaults to `active`)
- Update Progress column with `0/<task-count>`
- Add it to the Epic Order section with its dependencies (if any)
- If this is the only epic, set it to `active`

### Step 12: Auto-Execute (only when `--auto` is set)

If `--auto` is NOT in `$ARGUMENTS`, skip this step entirely and show the Output below.

If `--auto` IS set, begin the automated execution loop:

#### Pre-flight Checks

Before starting the loop:

```bash
# Ensure clean working tree
git status --porcelain
```

If there are uncommitted changes, stop and warn the user.

```bash
# Ensure we're on the base branch
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
git branch --show-current
```

If not on the base branch (main/master), switch to it and pull latest.

#### Execution Loop

Read `.claude/profile.json` → `workflow.mode` to determine the execution mode: **solo** or **agency**.

Each task is executed in a **separate worktree agent** to prevent context accumulation. The main conversation only manages task selection, pipeline orchestration, and progress tracking.

```
WHILE true:
  1. Read fresh context (lightweight — main conversation):
     - Re-read .claude/pm/epics/<slug>/tasks.md for task list
     - Fetch open tasks from GitHub:
       gh issue list --label "pm:task" --state open --json number,title,labels,assignees --limit 50

  2. Select next task:
     - Filter: open, unassigned, NOT pm:blocked
     - Sort: priority (high > medium > low), then issue number (lower first)
     - Pick the first one

  3. If no unblocked unassigned task found:
     - Check if any open tasks remain
     - If open tasks exist but all are blocked → STOP, report deadlock
     - If no open tasks remain → epic is COMPLETE, break loop

  4. Assign the issue (main conversation):
     gh issue edit <number> --add-assignee "@me"

  5. Execute the task using the configured workflow mode:

     ─── SOLO MODE (workflow.mode: "solo") ───

     Spawn a single worktree agent that handles everything:

     > "Execute task #<number> for epic <slug>.
     >  Read the issue, context files, and profile.
     >  Create branch, load rules, implement, test, commit.
     >  Push, create PR with 'Closes #<number>', squash merge.
     >  Unblock dependent tasks."

     Use `isolation: "worktree"`.

     ─── AGENCY MODE (workflow.mode: "agency") ───

     Run a quality pipeline with specialized agents:

     **Step A: Determine task domain**
     From task labels (`scope:<workspace>`) or issue body (`## Scope`):
     - Backend task → use `backend-dev` agent
     - Frontend task → use `frontend-dev` agent
     - Cross/ambiguous → use `backend-dev` or `frontend-dev` based on primary files

     **Step B: Dev Agent (worktree)**
     Spawn the appropriate dev agent with `isolation: "worktree"`:

     > "Implement task #<number> for epic <slug>.
     >  Read the issue, context files, and profile.
     >  Create branch per strategy. Load rules for your domain.
     >  Implement following acceptance criteria. Write tests.
     >  Run quality checks. Commit."

     Dev agent implements and commits but does NOT push or create PR.

     **Step C: QA Agent (reviews dev agent's work)**
     Spawn `qa` agent on the dev agent's branch (no worktree — reads only):

     > "Review task #<number> on branch <branch>.
     >  Read the task issue for acceptance criteria.
     >  Run: git diff <base>...<branch> to see changes.
     >  Run: npm test to verify tests pass.
     >  Validate: acceptance criteria, test coverage, edge cases.
     >  Return: PASS or FAIL with findings."

     - If **FAIL**: Spawn dev agent again on same branch to fix QA findings.
       Re-run QA. Max 2 QA cycles. If still failing → STOP.
     - If **PASS**: Continue to Step D.

     **Step D: Code Review Agent**
     Spawn `code-reviewer` agent on the branch:

     > "Review changes on branch <branch> against <base>.
     >  Check code quality, patterns, conventions.
     >  Return categorized findings."

     - If **CRITICAL** findings: Spawn dev agent to fix. Re-review. Max 1 retry.
     - If no criticals: Continue to Step E.

     **Step E: Security Agent (conditional)**
     If the task involves API endpoints, authentication, authorization, or user input handling:
     Spawn `security-auditor` agent on the branch.

     - If **CRITICAL** findings: Spawn dev agent to fix. Re-audit.
     - Otherwise: Continue.

     **Step F: Ship (main conversation)**
     Push, create PR, squash merge, unblock dependent tasks.

     ```bash
     git push -u origin <branch>
     gh pr create --title "<title>" --body "Closes #<number>\n\nPart of #<epic>"
     gh pr merge --squash --delete-branch
     ```

  6. Process result:
     - **Success:** Log progress, update tasks.md status
       "✓ Task #<number>: <title> — Completed (X/Y tasks done)"
     - **Failure:** STOP immediately (fail-fast), report error and branch.
       "Task #<number> failed. Resume with: /sw-plan <epic-slug> --auto"

  7. Ensure clean state for next task:
     git checkout <base> && git pull
     (or git checkout feat/<epic-slug> && git pull for integration branch)

  8. Loop back to step 1
END WHILE
```

#### Epic Completion

When all tasks in the epic are done:

1. If `.claude/profile.json` has `workflow.integration_branch: true`, perform final merge:

   a. Switch to integration branch and ensure it's up to date:

   ```bash
   git checkout feat/<epic-slug>
   git pull origin feat/<epic-slug>
   ```

   b. Create final PR from integration branch to main:

   ```bash
   gh pr create \
     --base <base-branch> \
     --title "Epic: <epic-title>" \
     --body "## Epic Complete\n\nMerges all tasks from epic #<epic-number>.\n\nCloses #<epic-number>"
   ```

   c. Squash merge:

   ```bash
   gh pr merge --squash --delete-branch
   ```

   d. Return to base branch:

   ```bash
   git checkout <base-branch> && git pull
   ```

2. Check off all remaining checklist items in the epic issue (tasks + Success Criteria):

```bash
EPIC_BODY=$(gh issue view <epic-number> --json body -q '.body')
UPDATED_EPIC=$(echo "$EPIC_BODY" | sed 's/- \[ \]/- [x]/g')
gh issue edit <epic-number> --body "$UPDATED_EPIC"
```

3. Close the epic issue (if not auto-closed by the final PR):

```bash
gh issue close <epic-number>
```

4. Update `.claude/pm/PROJECT.md`:
   - Set the completed epic's status to `completed`
   - Update its Progress column to `Y/Y`
   - Set the next planned epic (by order, with resolved dependencies) to `active`

5. Show the final summary

### Output

**If `--auto` is NOT set:**

After completing, display:
- PRD location and summary
- Epic issue number and URL
- Table of all created task issues with numbers, titles, and labels
- Updated PROJECT.md path
- Suggested first task to work on (highest priority, unblocked)
- Command to start: `/sw-work <issue-number>`

**If `--auto` completed successfully:**

Display:
- Epic title and issue number
- Table of all completed tasks with PR URLs
- Total tasks completed: X/X
- Epic status: completed
- Next epic (if any) now set to `active` in PROJECT.md
- Command to continue: `/sw-plan <next-epic> --auto`

**If `--auto` stopped due to failure:**

Display:
- Which task failed and why (error details)
- Tasks completed so far: X/Y
- Current branch and working tree state
- Suggested fix or manual intervention needed
- Command to resume after fixing: `/sw-plan <epic-slug> --auto`

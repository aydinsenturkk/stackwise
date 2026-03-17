Create a PR for a completed task and optionally merge it

## Input

`$ARGUMENTS` - Optional: issue number (e.g., `42`), `--merge` flag, `--review` flag, or `--final` flag for integration branch merge. Can combine: `42 --review --merge`

## Workflow

### Step 1: Determine the Task

**If issue number is provided:**
Use the given issue number.

**If no issue number:**
Infer from the current branch name. Expected formats:
- Standalone task: `<type>/<number>-<description>` (e.g., `fix/42-login-bug`)
- Epic task (trunk-based): `feat/<number>-<description>`
- Epic task (integration branch): `<epic-slug>/<number>-<description>`

```bash
git branch --show-current
```

Parse the issue number from the branch name. If the branch doesn't follow either convention, ask the user for the issue number.

### Step 2: Gather Context

1. Fetch the task issue:

```bash
gh issue view <number> --json number,title,body,labels
```

2. Check the task issue body for an epic reference (look for "Part of #<number>" or "Epic" section)

3. **If epic reference found (epic task):**
   a. Find the epic slug by checking `.claude/pm/epics/*/tasks.md` for a matching issue number
   b. Read the epic: `.claude/pm/epics/<slug>/epic.md`
   c. Read the PRD: `.claude/pm/prds/<slug>.md`

4. **If no epic reference (standalone task):**
   - The task issue body IS the full context — no epic/PRD to load

### Step 3: Determine Base Branch

1. Read `.claude/profile.json` and check `workflow.integration_branch`
2. If `integration_branch` is `true`:
   - Read the epic slug from the task issue body (## Epic section)
   - Find the integration branch from `.claude/pm/epics/<slug>/epic.md`
   - Base branch = `feat/<epic-slug>`
3. If `integration_branch` is `false` (default):

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

If that fails, use `main` or `master` (check which exists).

### Step 4: Analyze Changes

```bash
# All commits on this branch
git log <base-branch>..HEAD --oneline

# Diff stats
git diff <base-branch>...HEAD --stat

# Full diff
git diff <base-branch>...HEAD
```

### Step 5: Run Quality Checks

```bash
# Type check
npx tsc --noEmit 2>/dev/null

# Lint
npm run lint 2>/dev/null

# Tests
npm test 2>/dev/null
```

Note any failures in the PR description but don't block PR creation.

### Step 6: Code Review (only when `--review` is set)

If `--review` is in `$ARGUMENTS`, run the `/sw-review` workflow on the current changes before pushing. This performs a structured code review against project rules.

If the review finds **CRITICAL** findings, stop and present them to the user before continuing. For WARNING and SUGGESTION findings, include them in the PR description under a `## Review Notes` section.

If `--review` is NOT set, skip this step.

### Step 7: Push Branch

```bash
git push -u origin $(git branch --show-current)
```

### Step 8: Create the PR

Build the PR title and body from context:

**Title:** `<type>: <task title> (#<issue-number>)`

**Body (epic task):**

```markdown
## Summary
<2-3 bullet points describing what this PR does, derived from task + diff analysis>

## Changes
<grouped list of notable changes>

## Task
Closes #<issue-number>

## Epic
Part of #<epic-issue-number> — <epic title>

## Test Plan
- [ ] <how to verify each change>
```

**Body (standalone task):** Same structure but **omit** the `## Epic` section entirely.

```bash
gh pr create \
  --title "<title>" \
  --body "<body>"
```

### Step 9: Optional Merge

If `--merge` is in `$ARGUMENTS`:

1. Wait for PR creation to complete
2. Squash merge the PR:

```bash
gh pr merge --squash --delete-branch
```

3. Check off any remaining unchecked items in the task issue (e.g., `PR reviewed` in Detailed template):

```bash
TASK_BODY=$(gh issue view <number> --json body -q '.body')
# Check off PR reviewed if present (Detailed template)
UPDATED_TASK_BODY=$(echo "$TASK_BODY" | sed 's/- \[ \] PR reviewed/- [x] PR reviewed/g')
gh issue edit <number> --body "$UPDATED_TASK_BODY"
```

4. Close the issue if not auto-closed:

```bash
gh issue close <number>
```

5. **Epic tasks only** — Update the epic issue to check off the completed task (skip this for standalone tasks):

```bash
# Get epic number from task body
EPIC_NUMBER=$(gh issue view <number> --json body -q '.body' | grep -oP 'Part of #\K\d+')

# Fetch epic body, replace - [ ] #<number> with - [x] #<number>
EPIC_BODY=$(gh issue view $EPIC_NUMBER --json body -q '.body')
UPDATED_BODY=$(echo "$EPIC_BODY" | sed "s/- \[ \] #<number>/- [x] #<number>/g")
gh issue edit $EPIC_NUMBER --body "$UPDATED_BODY"
```

6. Switch back to base branch:

```bash
git checkout <base-branch>
git pull
```

7. Check for newly unblockable tasks:

```bash
gh issue list --label "pm:blocked" --state open --json number,body --limit 50
```

For each blocked issue whose blockers are all now closed, remove `pm:blocked`:

```bash
gh issue edit <number> --remove-label "pm:blocked"
```

8. **Epic tasks only** — Check if the closed task's epic is now complete (skip this for standalone tasks):

```bash
# Get the epic number from the task body
EPIC_NUMBER=$(gh issue view <number> --json body -q '.body' | grep -oP 'Part of #\K\d+')
```

If an epic number is found:

```bash
# Get all task issue numbers referenced in the epic body
TASKS=$(gh issue view $EPIC_NUMBER --json body -q '.body' | grep -oP '#\K\d+')

# Check if all referenced tasks are closed
ALL_CLOSED=true
for TASK in $TASKS; do
  STATE=$(gh issue view $TASK --json state -q '.state')
  if [ "$STATE" != "CLOSED" ]; then
    ALL_CLOSED=false
    break
  fi
done

# Close the epic if all tasks are done
if [ "$ALL_CLOSED" = true ]; then
  # Check off Success Criteria in epic body (Full template)
  EPIC_BODY=$(gh issue view $EPIC_NUMBER --json body -q '.body')
  # Replace all - [ ] with - [x] in Success Criteria section
  UPDATED_EPIC=$(echo "$EPIC_BODY" | sed 's/- \[ \]/- [x]/g')
  gh issue edit $EPIC_NUMBER --body "$UPDATED_EPIC"

  gh issue close $EPIC_NUMBER
fi
```

If the epic was closed, update `.claude/pm/PROJECT.md` — set the epic's status to `completed` and activate the next planned epic (if any).

### Step 10: Final Merge (only with `--final` flag)

If `--final` is in `$ARGUMENTS` and `.claude/profile.json` has `workflow.integration_branch: true`:

1. Determine the integration branch:
   - If on an integration branch (`feat/<epic-slug>`), use current branch
   - Otherwise, read from epic context

2. Ensure all epic tasks are closed:

```bash
gh issue list --label "pm:task" --state open --json number,title --limit 50
```

Filter to tasks belonging to this epic. If open tasks remain, warn and stop.

3. Push integration branch:

```bash
git push origin feat/<epic-slug>
```

4. Create final PR:

```bash
gh pr create \
  --base <main-branch> \
  --title "Epic: <epic-title>" \
  --body "## Epic Complete\n\nMerges all tasks for #<epic-number>.\n\nCloses #<epic-number>"
```

5. Squash merge:

```bash
gh pr merge --squash --delete-branch
```

6. Switch to main and pull:

```bash
git checkout <main-branch> && git pull
```

7. Close epic issue if not auto-closed:

```bash
gh issue close <epic-number>
```

8. Update PROJECT.md: set epic status to completed, activate next epic

### Output

Display:
- PR URL
- Summary of changes included
- Issue that will be closed
- Any warnings (failing tests, lint errors)
- If merged: confirmation and any unblocked tasks
- If final merge: epic completion status and next epic
- Next step: `/sw-work` to pick up the next task

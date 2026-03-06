View task status dashboard from GitHub Issues

## Input

`$ARGUMENTS` - Optional filter: an epic slug, `open`, `blocked`, `next`, `closed`, `scope:<workspace>`, or empty for all

Filters can be combined: `scope:api open` → open tasks in the `api` workspace.

## Workflow

### Step 1: Determine Filter

Parse `$ARGUMENTS`:
- **empty**: Show all tasks across all epics
- **`open`**: Show only open tasks
- **`blocked`**: Show only tasks with `pm:blocked` label
- **`next`**: Show the single highest-priority, unblocked, unassigned task
- **`closed`**: Show recently closed tasks
- **`scope:<workspace>`**: Show only tasks with the `scope:<workspace>` label (monorepo only)
- **epic slug**: Show tasks for a specific epic (read `.claude/pm/epics/<slug>/tasks.md` for issue numbers)

Filters can be combined (e.g., `scope:api open` shows open tasks in the `api` workspace). When `scope:` is combined with another filter, apply both.

### Step 2: Fetch Issues from GitHub

```bash
# For all tasks
gh issue list --label "pm:task" --state all --json number,title,state,labels,assignees --limit 100

# For epics
gh issue list --label "pm:epic" --state all --json number,title,state,labels --limit 50
```

If filtering by epic slug, read `.claude/pm/epics/<slug>/tasks.md` to get the relevant issue numbers, then fetch each:

```bash
gh issue view <number> --json number,title,state,labels,assignees
```

### Step 3: Build Dashboard

Format the output as a readable dashboard:

**For all/open/closed filters:**

```
## <Epic Title> (#<epic-number>)  [3/7 tasks done]
 ████████░░░░░░░░░░  43%

| #   | Task                    | Size   | Priority | Scope   | Status  | Assignee |
|-----|-------------------------|--------|----------|---------|---------|----------|
| #12 | Set up database schema  | small  | high     | api     | closed  | @user    |
| #13 | Create API endpoints    | medium | high     | api     | open    |          |
| #14 | Add validation          | small  | medium   | web     | blocked |          |
```

> **Monorepo only:** The Scope column is included when `.claude/profile.json` has `monorepo: true`. Omit it for single-repo projects.

**For `next` filter:**

Show the single best next task:
1. Filter to open, unblocked (`pm:blocked` label absent), unassigned tasks
2. Sort by priority (high > medium > low), then by issue number (lower first)
3. Display the top result with full context:

```
## Next Task

**#13 - Create API endpoints**
- Priority: high
- Size: medium
- Epic: User Notifications (#10)

Start with: /ck-work 13
```

**For `blocked` filter:**

Show blocked tasks with what's blocking them:

```
## Blocked Tasks

| #   | Task              | Blocked By          |
|-----|-------------------|---------------------|
| #14 | Add validation    | #13 (open)          |
| #16 | Write e2e tests   | #13 (open), #15 (open) |
```

### Step 4: Show Summary

At the bottom, always show a quick summary:

```
---
Total: 7 tasks | Open: 4 | Blocked: 2 | Closed: 3
```

### Output

Display the formatted dashboard. This is a read-only command — no issues are modified.

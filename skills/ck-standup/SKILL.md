Generate a standup-style status report across all epics

## Input

`$ARGUMENTS` - Optional: `--post` to post the report as a comment on each epic issue

## Workflow

### Step 1: Gather All Epics

Read the project index for the big picture:

```bash
cat .claude/pm/PROJECT.md
```

Then find all epic slugs:

```bash
ls .claude/pm/epics/
```

For each epic, read:
1. `.claude/pm/epics/<slug>/epic.md` for the epic definition
2. `.claude/pm/epics/<slug>/tasks.md` for issue number mapping

Also fetch epic issues from GitHub:

```bash
gh issue list --label "pm:epic" --state all --json number,title,state --limit 50
```

### Step 2: Fetch Task Status

For each epic, fetch all related task issues:

```bash
gh issue list --label "pm:task" --state all --json number,title,state,labels,assignees,updatedAt --limit 100
```

Cross-reference with the task mapping files to group tasks by epic.

### Step 3: Build Report

Generate a report for each epic:

```markdown
## <Epic Title> (#<number>)
 ████████████░░░░░░  67%  (4/6 tasks)

### Completed Recently
- #12 Set up database schema (closed 2h ago)
- #13 Create API endpoints (closed 1d ago)

### In Progress
- #15 Build notification UI — assigned to @user

### Blocked
- #14 Add validation — waiting on #15

### Up Next
- #16 Write e2e tests (unblocked, unassigned)
```

### Step 4: Add Recommendations

At the bottom of the report, add actionable recommendations:

```markdown
---
## Recommendations
- **Unblock:** #14 is blocked by #15 which is in progress — follow up
- **Pick up:** #16 is ready to start — `/ck-work 16`
- **At risk:** Epic "User Notifications" has 2 large tasks remaining
```

### Step 5: Post to GitHub (Optional)

If `--post` is in `$ARGUMENTS`:

For each epic issue, post the report as a comment:

```bash
gh issue comment <epic-number> --body "<report for this epic>"
```

Format the comment as a standup update with a timestamp:

```markdown
## Standup — <date>

<epic-specific report section>
```

### Output

Display the full standup report in the terminal. If `--post` was used, confirm which epic issues received comments.

After displaying, update `.claude/pm/PROJECT.md` with current progress counts for each epic.

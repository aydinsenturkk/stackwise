Create a pull request with full context and description

## Workflow

### Step 1: Determine Base Branch

Identify the base branch for comparison:

```bash
# Check default branch
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

If that fails, use `main` or `master` (check which exists).

### Step 2: Gather All Changes

Collect the full picture of what this branch introduces:

```bash
# Current branch name
git branch --show-current

# All commits on this branch
git log <base-branch>..HEAD --oneline

# Full diff against base
git diff <base-branch>...HEAD --stat

# Detailed diff
git diff <base-branch>...HEAD
```

### Step 3: Analyze Changes

If `.claude/profile.json` exists, read it to understand the project's stack and conventions. This helps write more contextual PR descriptions.

Read the full diff and categorize the changes:

- **New files**: What was added and why
- **Modified files**: What changed in each file
- **Deleted files**: What was removed and why
- **Change type**: feature, fix, refactor, test, docs, chore

Review commit messages for context on the intent behind changes.

### Step 4: Check Code Quality

Run linting and tests before creating the PR:

```bash
# Lint check
npm run lint 2>/dev/null || npx eslint . 2>/dev/null

# Run tests
npm test 2>/dev/null
```

If there are failures, report them but do not block PR creation. Note them in the PR description.

### Step 5: Draft PR Content

Create a descriptive PR based on the analysis:

**Title**: Short, descriptive title (under 70 characters)
- For features: `feat: Add <feature description>`
- For fixes: `fix: Resolve <issue description>`
- For refactors: `refactor: <what was refactored>`

**Body**: Structured description with these sections:

```markdown
## Summary
- <bullet points summarizing the key changes>

## Changes
- <list of notable changes grouped by area>

## Test Plan
- [ ] <how to test each change>
- [ ] <edge cases to verify>

## Breaking Changes
<only if applicable - describe what breaks and migration steps>
```

### Step 6: Create the PR

```bash
gh pr create \
  --title "<title>" \
  --body "<body>"
```

If the branch has not been pushed, push it first:

```bash
git push -u origin $(git branch --show-current)
```

### Output

Display:
- The PR URL
- Summary of what was included
- Any warnings (failing tests, lint errors, large diff)

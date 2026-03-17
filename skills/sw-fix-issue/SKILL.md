Fetch a GitHub issue and implement a fix

## Input

`$ARGUMENTS` - The GitHub issue number to fix (e.g., `42`)

## Workflow

### Step 1: Fetch the Issue

```bash
gh issue view $ARGUMENTS --json title,body,labels,comments,assignees
```

Read the issue title, description, labels, and comments carefully. Understand the expected behavior, actual behavior, and any reproduction steps provided.

### Step 2: Analyze the Issue

Determine:
- **Type**: bug fix, improvement, or small feature from the labels and description
- **Scope**: which part of the codebase is affected (frontend, backend, or both)
- **Priority**: from labels or severity described in the issue

### Step 3: Create a Branch

Create a branch for the fix:

```bash
git checkout <base-branch>
git pull origin <base-branch>
git checkout -b <type>/$ARGUMENTS-<short-description>
```

Determine the branch type from the issue analysis:
- `fix/` for bug fixes (most common)
- `feat/` for new functionality
- `refactor/` for restructuring
- `perf/` for performance improvements

Example: `fix/42-login-double-submit`, `feat/87-add-export-csv`

### Step 4: Find Relevant Code

Search the codebase for files related to the issue:
- Use error messages or stack traces from the issue to locate code
- Search for function names, component names, or API endpoints mentioned
- Read the relevant source files to understand the current implementation

### Step 5: Load Applicable Rules

1. Read `.claude/profile.json` to understand the project's stack
2. Based on the files you will modify, read rules from `.claude/rules/`:
   - `01-*` (universal rules) - always load relevant ones (error handling, validation, security)
   - `02-*` (domain rules) - load based on the domain of files being modified (frontend vs backend)
   - `03-*` (framework rules) - load for the active framework
   - `04-*` (tool rules) - load for active tools
3. If no profile exists, read all available rules from `.claude/rules/` and apply the relevant ones. Suggest running `/init` first.

### Step 6: Implement the Fix

- Make the minimal changes needed to resolve the issue
- Follow all project rules and conventions
- Handle edge cases identified in the issue comments
- Do not refactor unrelated code

### Step 7: Verify the Fix

Run the relevant tests:

```bash
# Run tests related to changed files
npm test -- --findRelatedTests <changed-files>

# Or run the full test suite if changes are broad
npm test
```

If tests fail, fix them. If no tests cover the changed code, note this in the commit message.

### Step 8: Commit with Conventional Message

Create a commit using conventional commit format that references the issue:

```bash
git add <changed-files>
git commit -m "fix: <concise description of the fix>

<longer explanation if needed>

Closes #$ARGUMENTS"
```

Use the appropriate commit type:
- `fix:` for bug fixes
- `feat:` for new functionality
- `refactor:` for code changes that neither fix a bug nor add a feature
- `perf:` for performance improvements

### Output

After completing, summarize:
- What the issue was
- What changes were made and why
- Which files were modified
- Whether all tests pass
- Branch name
- Any follow-up work needed
- Next step: `/sw-pr` to create a pull request

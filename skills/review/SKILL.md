Code review using project rules as a checklist

## Workflow

### Step 1: Gather Changes

Read the current git diff to understand what has changed:

```bash
# Check for staged changes first
git diff --cached --stat

# If no staged changes, check working tree
git diff --stat
```

If there are staged changes, review those. Otherwise, review unstaged working tree changes. Use `git diff --cached` or `git diff` accordingly to get the full diff content.

If `$ARGUMENTS` is provided and refers to a specific file or directory, scope the diff to that path.

### Step 2: Load Applicable Rules

1. Read `.claude/profile.json` to understand the project's stack (frameworks, tools, domains)
2. Read rules from `.claude/rules/`:
   - `01-*` (universal rules) - always load relevant ones (architecture, naming, typescript, security)
   - `02-*` (domain rules) - load based on the domain of changed files (e.g., frontend rules for `.tsx` files, backend rules for service/controller files)
   - `03-*` (framework rules) - load for the active framework identified in the profile
   - `04-*` (tool rules) - load for active tools (test runner, ORM, etc.)
3. If no profile exists, read all available rules from `.claude/rules/` and apply the ones relevant to the changed files. Suggest running `/init` to set up a profile for better rule targeting.

Only load rules relevant to the files that were changed. Do not load all rules if only one layer is affected.

### Step 3: Analyze Each Changed File

For each changed file, check against every applicable rule. Look for:

- Architecture violations (wrong layer dependencies, misplaced logic)
- Security issues (injection, XSS, missing auth checks, exposed secrets)
- Naming convention violations
- Anti-patterns
- Missing error handling
- Missing or inadequate validation
- Performance concerns (N+1 queries, missing memoization, unnecessary re-renders)
- TypeScript type safety issues (any usage, missing types, unsafe casts)
- Testing gaps (untested business logic, missing edge cases)

### Step 4: Output Structured Review

Format findings grouped by file, then by severity:

```
## Code Review Summary

**Files reviewed:** <count>
**Findings:** <count by severity>

---

### <file-path>

#### CRITICAL
- **[Rule: <rule-name>]** <description of the issue>
  - Line(s): <line numbers>
  - Fix: <suggested fix>

#### WARNING
- **[Rule: <rule-name>]** <description of the issue>
  - Line(s): <line numbers>
  - Fix: <suggested fix>

#### SUGGESTION
- **[Rule: <rule-name>]** <description of the issue>
  - Line(s): <line numbers>
  - Fix: <suggested fix>

---
```

**Severity Definitions:**
- **CRITICAL**: Security vulnerabilities, data loss risks, breaking changes, architectural violations that will cause runtime errors
- **WARNING**: Anti-patterns, performance issues, missing validation, code that works but violates project standards
- **SUGGESTION**: Style improvements, naming tweaks, optional optimizations, better patterns that could be used

### Step 5: Provide Summary

End with an overall assessment:
- Whether the changes are ready to merge
- The most important items to address before merging
- Any positive observations about the code quality

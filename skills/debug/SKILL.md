Structured debugging to find and fix issues

## Input

`$ARGUMENTS` - A description of the issue (e.g., `"login form submits twice"`, `"API returns 500 on user creation"`, `"memory leak in dashboard"`)

## Workflow

### Step 1: Understand the Problem

Parse the issue description from `$ARGUMENTS`. Identify:
- **Symptom**: What is happening wrong?
- **Expected behavior**: What should happen instead?
- **Scope**: Which part of the system is affected?
- **Keywords**: Error messages, component names, endpoint paths, function names

### Step 2: Load Relevant Rules

1. Read `.claude/profile.json` to understand the project's stack
2. Based on the scope, read rules from `.claude/rules/`:
   - `01-*` (universal rules) - load error handling, observability, and anti-pattern rules
   - `02-*` (domain rules) - load based on which domain is affected (frontend error handling vs backend error handling)
   - `03-*` (framework rules) - load for the active framework (framework-specific debugging patterns)
   - `04-*` (tool rules) - load for relevant tools (logging, monitoring, etc.)
3. If no profile exists, read all available rules from `.claude/rules/` and apply the relevant ones. Suggest running `/init` first.

These rules help identify common causes and proper fixes.

### Step 3: Search for Relevant Code

Use the keywords from Step 1 to locate code:
- Search for error messages in the codebase
- Find the component, service, or handler mentioned in the issue
- Trace the execution path from entry point to the problem area
- Read related test files to understand expected behavior

### Step 4: Trace the Execution Path

Follow the code path from the trigger point:

1. **Entry point**: Route handler, event listener, or component mount
2. **Processing**: Service calls, state updates, data transformations
3. **Dependencies**: External API calls, database queries, third-party libraries
4. **Output**: Response, rendered UI, side effects

At each step, identify:
- What data flows in and out
- Where errors could occur
- Where state might be inconsistent
- What assumptions the code makes

### Step 5: Identify Root Cause

Based on the trace, determine:
- **Root cause**: The actual source of the bug (not just the symptom)
- **Contributing factors**: Conditions that trigger the bug
- **Impact**: What else might be affected

Common root causes to check:
- Race conditions or timing issues
- Missing null/undefined checks
- Incorrect state management
- Stale closures or references
- Missing error handling
- Incorrect API contract assumptions
- Wrong data type or shape

### Step 6: Implement the Fix

Apply the fix following project rules:
- Fix the root cause, not just the symptom
- Handle edge cases that were missed
- Add defensive checks where appropriate
- Do not introduce regressions

### Step 7: Verify the Fix

Run related tests and add new ones if needed:

```bash
# Run related tests
npm test -- --findRelatedTests <changed-files>
```

If the issue was not covered by existing tests, write a test that:
- Reproduces the original bug condition
- Verifies the fix works
- Prevents regression

### Output

Provide a structured debug report:

```
## Debug Report

### Issue
<description of the problem>

### Root Cause
<what was actually wrong and why>

### Execution Trace
1. <step 1 of how the bug occurs>
2. <step 2>
3. <step 3 - where things go wrong>

### Fix Applied
- File: <file path>
- Change: <what was changed and why>

### Verification
- Tests: <pass/fail status>
- New tests added: <yes/no, with description>

### Prevention
- <suggestions to prevent similar issues>
```

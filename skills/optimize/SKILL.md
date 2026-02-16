Analyze and optimize code performance

## Input

`$ARGUMENTS` - A file path or area to optimize (e.g., `src/features/dashboard/`, `src/services/reportService.ts`, `database queries`)

## Workflow

### Step 1: Read the Target Code

Read the file(s) specified by `$ARGUMENTS`. If a directory is given, identify the most performance-sensitive files within it.

Understand:
- What the code does
- How it is called (hot path vs. cold path)
- What external systems it interacts with
- Current complexity characteristics

### Step 2: Load Performance Rules

1. Read `.claude/profile.json` to understand the project's stack
2. Read rules from `.claude/rules/`:
   - `01-*` (universal rules) - load performance and anti-pattern rules
   - `02-*` (domain rules) - load domain-specific performance rules (frontend: rendering optimization, bundle size; backend: caching, database patterns)
   - `03-*` (framework rules) - load for the active framework (framework-specific optimizations)
   - `04-*` (tool rules) - load for relevant tools (bundler, ORM, cache layer)
3. If no profile exists, read all available rules from `.claude/rules/` and apply performance-relevant ones. Suggest running `/init` first.

### Step 3: Identify Performance Issues

Apply the "measure first" approach. Analyze the code for common performance problems:

**Frontend issues:**
- Unnecessary re-renders (missing React.memo, unstable references in props)
- Missing or incorrect memoization (useMemo, useCallback without proper deps)
- Large bundle size (dynamic imports needed, tree-shaking blockers)
- Expensive computations in render path
- Layout thrashing (forced synchronous layouts)
- Unoptimized images or assets
- Missing virtualization for long lists
- Waterfalling network requests (sequential when could be parallel)

**Backend issues:**
- N+1 query patterns (loading relations in a loop)
- Missing database indexes
- Unoptimized queries (SELECT *, missing WHERE clauses, no pagination)
- Missing caching for expensive or repeated operations
- Synchronous blocking in async contexts
- Memory leaks (unclosed connections, growing arrays, event listener buildup)
- Inefficient algorithms (O(n^2) where O(n) is possible)
- Missing connection pooling
- Large payloads without pagination or streaming

**Shared issues:**
- Redundant computations
- Excessive data copying
- Missing early returns / short-circuit evaluation
- Over-fetching data (loading more than needed)

### Step 4: Generate Optimization Report

For each issue found, document:

```
## Optimization Report: $ARGUMENTS

### Summary
- Issues found: <count>
- Estimated impact: <high/medium/low>

### Findings

#### 1. <Issue Title>
- **Type**: <N+1 query | missing memoization | bundle size | etc.>
- **Location**: <file:line>
- **Current behavior**: <what happens now>
- **Impact**: <why this is a problem, estimated cost>
- **Recommended fix**: <specific code change>
- **Expected improvement**: <what gets better>

#### 2. <Issue Title>
...
```

### Step 5: Implement Safe Optimizations

Apply optimizations that are:
- Low risk of introducing bugs
- High confidence of improvement
- Aligned with project rules

Examples of safe optimizations:
- Adding missing `React.memo` wrappers
- Converting sequential queries to parallel with `Promise.all`
- Adding database indexes
- Implementing proper pagination
- Adding cache headers or memoization
- Replacing O(n^2) with O(n) algorithms where clear
- Adding `loading="lazy"` to images

Do NOT apply optimizations that:
- Require significant architectural changes without user approval
- Could change behavior (optimistic vs. pessimistic patterns)
- Need performance measurements to validate

### Step 6: Verify Changes

Run tests to ensure optimizations did not break anything:

```bash
npm test -- --findRelatedTests <changed-files>
```

### Output

Present the full optimization report with:
- All findings, even those not auto-fixed
- Changes that were applied
- Suggestions that require user decision
- Recommended follow-up measurements to validate improvements

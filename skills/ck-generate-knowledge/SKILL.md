Generate knowledge rules for a tool or library by fetching its up-to-date documentation

## Input

`$ARGUMENTS` - The npm package name to generate knowledge rules for (e.g., `mongoose`, `express`, `socket.io`)

## Workflow

### Step 1: Read Existing Format

Read any existing Layer 4 knowledge file from `.claude/rules/` that starts with `04-tool-` prefix to understand the expected format and structure. If none exist, use this reference structure:

```
# Tool Name vX

## Section with Code Examples
\`\`\`typescript
// practical example
\`\`\`

## Configuration
...

## Common Patterns
...

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
|---|---|---|
| ... | ... | ... |
```

### Step 2: Fetch Documentation

Use Context7 MCP tools to fetch up-to-date documentation:

1. Call `resolve-library-id` with the package name from `$ARGUMENTS`
2. Call `query-docs` with the resolved library ID for:
   - Getting started / basic usage patterns
   - Configuration and setup
   - Common patterns and best practices
   - API reference for most-used features

If Context7 is unavailable, use web search to find the official documentation.

### Step 3: Determine Domain

Based on the package's purpose, determine the domain:

- **frontend** — UI libraries, state management, styling, components, routing
- **backend** — Server frameworks, database, auth, queue, email, logging
- **all** — Validation, testing, utilities used across both frontend and backend

### Step 4: Generate Knowledge File

Create a markdown file following the exact format of existing Layer 4 knowledge files:

1. **Title**: `# {Package Name} {major version if relevant}`
2. **Core sections** with TypeScript/TSX code examples showing real usage
3. **Configuration** patterns and setup
4. **Common usage patterns** with practical, copy-pasteable examples
5. **Integration patterns** — how it works with other tools detected in `.claude/profile.json`
6. **Final section**: `## Anti-Patterns` as a markdown table with columns: Anti-Pattern | Problem | Instead

Keep the content focused and practical. Prioritize patterns that developers actually use daily over exhaustive API coverage.

### Step 5: Write File

Read `.claude/profile.json` to determine the project's path patterns, then write the generated file to `.claude/rules/04-tool-{name}.md` with appropriate frontmatter. This follows the compose naming convention: `{layer prefix}-{name}.md`.

For **frontend** tools:
```yaml
---
paths:
  - {frontend path from profile.json, or src/**/*.{ts,tsx}}
---
```

For **backend** tools:
```yaml
---
paths:
  - {backend path from profile.json, or src/**/*.ts}
---
```

For **universal** tools (used in both frontend and backend):
```yaml
---
paths: **/*
---
```

### Step 6: Summary

Report:
- The file path where the knowledge file was written
- Which sections were included
- The documentation source used (Context7 library ID or web URL)
- Remind the user they can edit the generated file to customize it

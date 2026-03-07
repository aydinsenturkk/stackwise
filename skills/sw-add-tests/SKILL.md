Generate tests for a file or directory

## Input

`$ARGUMENTS` - A file path or directory to add tests for (e.g., `src/services/userService.ts` or `src/features/auth/`)

## Workflow

### Step 1: Read the Target Code

Read the file(s) specified by `$ARGUMENTS`:
- If a single file, read that file
- If a directory, find all source files (`.ts`, `.tsx`) excluding existing test files and index files

Understand the code thoroughly: what it exports, its dependencies, its side effects, and its business logic.

### Step 2: Load Testing Rules

1. Read `.claude/profile.json` to understand the project's stack and testing tools
2. Read rules from `.claude/rules/`:
   - `01-*` (universal rules) - load testing-related universal rules
   - `02-*` (domain rules) - load domain-specific testing rules based on the target file's domain (frontend vs backend)
   - `03-*` (framework rules) - load for the active framework (testing conventions may vary by framework)
   - `04-*` (tool rules) - load for the test runner (Vitest, Jest, etc.) and related tools
3. If no profile exists, read all available rules from `.claude/rules/` and identify the test runner from `package.json`. Suggest running `/init` first.

Key principles to follow:
- Test behavior, not implementation details
- Each test should verify one thing
- Use descriptive test names that explain the expected behavior
- Arrange-Act-Assert pattern
- Avoid testing private/internal methods directly
- Mock external dependencies, not internal modules

### Step 3: Analyze What Needs Testing

Identify testable aspects:
- **Public API**: exported functions, class methods, component props
- **Business logic**: conditional branches, calculations, transformations
- **Edge cases**: empty inputs, boundary values, null/undefined handling
- **Error states**: invalid inputs, network failures, permission errors
- **Integration points**: database queries, API calls, event handlers

### Step 4: Check for Existing Tests

Look for existing test files:
- `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
- `__tests__/` directories

If tests already exist, read them to understand current coverage and avoid duplication. Add missing test cases rather than rewriting.

### Step 5: Generate Test Files

Create test files following project conventions:
- Place test files next to source files as `<filename>.test.ts` or `<filename>.spec.ts`
- Match the project's existing test naming convention

Structure each test file:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'; // or jest

describe('<ModuleName>', () => {
  // Setup and shared mocks
  beforeEach(() => {
    // Reset state between tests
  });

  describe('<methodName>', () => {
    it('should <expected behavior> when <condition>', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should throw <ErrorType> when <invalid condition>', () => {
      // Arrange
      // Act & Assert
    });
  });
});
```

For React components:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('<ComponentName>', () => {
  it('should render <expected content> when <condition>', () => {
    render(<Component {...props} />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('should call <handler> when user <action>', () => {
    const handler = vi.fn();
    render(<Component onAction={handler} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledWith(expectedArgs);
  });
});
```

### Step 6: Run Tests

Execute the tests to verify they pass:

```bash
# Run only the new test files
npm test -- <test-file-paths>
```

If tests fail:
- Fix legitimate test bugs (wrong assertions, missing mocks)
- If the source code has a bug, note it but write the test for the expected behavior
- Ensure all tests are green before finishing

### Output

Summarize:
- Number of test files created
- Number of test cases written
- Coverage areas: what aspects of the code are now tested
- Any discovered issues in the source code
- Suggested additional tests that could be added later

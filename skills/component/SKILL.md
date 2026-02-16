Create a React component with proper structure and files

## Input

`$ARGUMENTS` - The component name (e.g., `UserAvatar`, `DataTable`, `ConfirmDialog`)

## Workflow

### Step 1: Determine Component Type

Analyze the component name and context to determine the type:
- **UI component**: Generic, reusable (Button, Modal, Input, Card) - lives in shared/ui or components/ui
- **Feature component**: Business-specific (UserProfile, InvoiceList) - lives in the feature directory
- **Layout component**: Page structure (Header, Sidebar, PageLayout) - lives in components/layout

If the type is ambiguous, check the existing project structure for conventions. If still unclear, ask the user.

### Step 2: Load Component Rules

1. Read `.claude/profile.json` to identify the frontend framework and UI conventions
2. Read rules from `.claude/rules/`:
   - `01-*` (universal rules) - load component design, TypeScript, naming, accessibility, and testing rules
   - `02-*` (domain rules) - load frontend domain rules
   - `03-*` (framework rules) - load for the active frontend framework (React, Vue, Svelte, etc.) to follow framework-specific component patterns
   - `04-*` (tool rules) - load for styling tools (Tailwind, CSS Modules, etc.) and test runner
3. If no profile exists, read all available rules from `.claude/rules/` and infer the framework from `package.json`. Suggest running `/init` first.

### Step 3: Determine Target Directory

Based on component type and existing project structure:
- Check for existing patterns: `src/components/`, `src/shared/`, `src/features/`
- Place the component in the appropriate directory
- Create a directory for the component: `<ComponentName>/`

### Step 4: Create Component Files

Create the following files:

**`<ComponentName>.tsx`** - The component implementation:
```typescript
import type { <ComponentName>Props } from './<componentName>.types';

export function <ComponentName>({ ...props }: <ComponentName>Props) {
  return (
    // Component JSX
  );
}
```

Rules to follow:
- Use named function declarations (not arrow functions for components)
- Destructure props in the function signature
- Include proper accessibility attributes (aria-labels, roles, semantic HTML)
- Use composition patterns when applicable
- No default exports unless required by framework (e.g., Next.js pages)

**`<componentName>.types.ts`** - Type definitions:
```typescript
export interface <ComponentName>Props {
  // Required props
  // Optional props with defaults documented
  className?: string;
}
```

**`<ComponentName>.test.tsx`** - Test file:
```typescript
import { render, screen } from '@testing-library/react';
import { <ComponentName> } from './<ComponentName>';

describe('<ComponentName>', () => {
  it('should render successfully', () => {
    render(<<ComponentName> />);
    // Assert basic rendering
  });

  it('should handle user interaction', () => {
    // Test interactive behavior
  });

  it('should be accessible', () => {
    // Test accessibility attributes
  });
});
```

**`index.ts`** - Barrel export:
```typescript
export { <ComponentName> } from './<ComponentName>';
export type { <ComponentName>Props } from './<componentName>.types';
```

### Step 5: Add Styles (if applicable)

Check the project's styling approach:
- **Tailwind CSS**: Use className prop with Tailwind classes inline
- **CSS Modules**: Create `<ComponentName>.module.css`
- **Styled Components / Emotion**: Create styled components in the component file or a separate styles file

Follow whichever approach the project uses.

### Output

Display:
- Tree view of created files
- The component code with a brief explanation
- Usage example showing how to import and use the component
- Suggested props or variants to add

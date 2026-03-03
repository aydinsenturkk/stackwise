Scaffold a new feature with proper project structure

## Input

`$ARGUMENTS` - The feature name (e.g., `user-profile`, `notifications`, `billing`)

## Workflow

### Step 1: Determine Scope

Analyze the project structure to determine if this is a frontend feature, backend feature, or full-stack:

```bash
ls -d */ 2>/dev/null
```

Look for directories like `frontend/`, `backend/`, `src/`, `apps/`, `packages/` to understand the project layout.

If the scope is unclear, ask the user whether the feature is frontend, backend, or both.

### Step 2: Load Architecture Rules

1. Read `.claude/profile.json` to understand the project's stack, frameworks, and conventions
2. Read rules from `.claude/rules/`:
   - `01-*` (universal rules) - load architecture and naming rules
   - `02-*` (domain rules) - load based on the feature's scope (frontend, backend, or both)
   - `03-*` (framework rules) - load for the active framework to determine proper scaffold structure (e.g., NestJS modules vs Express routers, Next.js app router vs pages)
   - `04-*` (tool rules) - load for active tools (ORM for entity generation, validation library for DTOs)
3. If no profile exists, read all available rules from `.claude/rules/` and infer the framework from `package.json`. Suggest running `/init` first.

Follow the loaded rules strictly when creating the folder structure and files. Use the framework detected from the profile to determine the correct scaffold pattern.

### Step 3: Create Frontend Feature Structure

If the feature includes frontend, create:

```
<feature-root>/$ARGUMENTS/
  components/          # Feature-specific components
    ${PascalName}.tsx
    ${PascalName}.test.tsx
  hooks/               # Feature-specific hooks
    use${PascalName}.ts
    use${PascalName}.test.ts
  queries/             # API query hooks (React Query / TanStack Query)
    use${PascalName}Query.ts
  api/                 # API client functions
    ${camelName}Api.ts
  store/               # Feature-specific state (if needed)
    ${camelName}Store.ts
  types/               # Feature types and interfaces
    ${camelName}.types.ts
  index.ts             # Barrel export
```

Each file should include:
- Proper TypeScript types
- Skeleton implementation with TODO comments for business logic
- Named exports (no default exports unless required by framework)

### Step 4: Create Backend Feature Structure

If the feature includes backend, create:

```
<feature-root>/$ARGUMENTS/
  ${camelName}.controller.ts      # Route handlers
  ${camelName}.controller.spec.ts # Controller tests
  ${camelName}.service.ts         # Business logic
  ${camelName}.service.spec.ts    # Service tests
  ${camelName}.repository.ts      # Data access
  ${camelName}.module.ts          # Module definition (NestJS) or router
  dto/
    create-${kebabName}.dto.ts    # Create DTO with validation
    update-${kebabName}.dto.ts    # Update DTO with validation
  domain/
    ${camelName}.entity.ts        # Domain entity
    ${camelName}.types.ts         # Domain types
  index.ts                        # Barrel export
```

Each file should include:
- Proper TypeScript types and interfaces
- Skeleton class/function structure with TODO comments
- Dependency injection setup where applicable

### Step 5: Generate Boilerplate Content

For each file, generate proper boilerplate:
- Import statements
- Type definitions
- Class or function skeleton with proper signatures
- TODO comments marking where business logic should be added
- Basic error handling structure
- Test file with describe block and placeholder test cases

### Output

After scaffolding, display:
- Tree view of all created files
- Brief description of each file's purpose
- Suggested next steps for implementing the feature

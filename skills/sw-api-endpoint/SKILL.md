Scaffold a complete REST API endpoint with CRUD operations

## Input

`$ARGUMENTS` - The resource name (e.g., `users`, `projects`, `invoices`)

## Workflow

### Step 1: Analyze Project Context

1. Read `.claude/profile.json` to identify the backend framework, ORM, and validation library
2. If no profile exists, determine the stack from `package.json`:

```bash
# Fallback: Check package.json for framework
cat package.json 2>/dev/null || cat backend/package.json 2>/dev/null
```

Look for: NestJS, Express, Fastify, Hono, or other frameworks. Identify the ORM (Prisma, TypeORM, Drizzle) and validation library (Zod, class-validator).

### Step 2: Load API Rules

1. Read rules from `.claude/rules/`:
   - `01-*` (universal rules) - load architecture, error handling, validation, security, and naming rules
   - `02-*` (domain rules) - load backend domain rules (API design, database patterns)
   - `03-*` (framework rules) - load for the active backend framework (NestJS, Express, etc.)
   - `04-*` (tool rules) - load for the ORM and validation library identified in the profile
2. If no profile exists, read all available rules from `.claude/rules/` and apply the backend-relevant ones. Suggest running `/init` first.

### Step 3: Create Types and DTOs

Create the type definitions and DTOs for the resource:

**Types file** (`<resource>.types.ts`):
- Entity interface with all fields
- Response type (what the API returns)
- Query params type for list endpoint (pagination, filtering, sorting)

**DTOs with Zod validation** (`dto/` directory):
- `create-<resource>.dto.ts` - Schema for creating the resource
- `update-<resource>.dto.ts` - Schema for updating (partial of create)
- Include proper validation rules: required fields, string lengths, email format, etc.

### Step 4: Create the Service

Create `<resource>.service.ts` with business logic methods:

```typescript
// Methods to implement:
findAll(query: QueryParams): Promise<PaginatedResult<Resource>>
findOne(id: string): Promise<Resource>
create(dto: CreateResourceDto): Promise<Resource>
update(id: string, dto: UpdateResourceDto): Promise<Resource>
remove(id: string): Promise<void>
```

Include:
- Proper error handling (not found, conflict, validation)
- Repository/database interaction
- Business rule validation
- TODO comments for complex business logic

### Step 5: Create the Controller

Create `<resource>.controller.ts` with route handlers:

```
GET    /<resources>        - List with pagination, filtering, sorting
GET    /<resources>/:id    - Get single resource by ID
POST   /<resources>        - Create new resource
PATCH  /<resources>/:id    - Update existing resource
DELETE /<resources>/:id    - Delete resource
```

Each handler should:
- Validate request input using DTOs
- Call the service layer (never put business logic in controllers)
- Return proper HTTP status codes (200, 201, 204, 400, 404, 409)
- Include proper error responses

### Step 6: Create Test Files

Create test files for both controller and service:

**`<resource>.controller.spec.ts`**:
- Test each endpoint
- Mock the service layer
- Test input validation (invalid payloads return 400)
- Test not found scenarios (return 404)
- Test success scenarios with proper status codes

**`<resource>.service.spec.ts`**:
- Test each business logic method
- Mock the repository/database layer
- Test error cases (not found, duplicates)
- Test edge cases (empty results, boundary values)

### Step 7: Register the Module

Add the new endpoint to the application's routing:
- For NestJS: create module file and add to AppModule imports
- For Express: create router and mount in the app
- For other frameworks: follow their routing convention

### Output

Display:
- Tree view of all created files
- Summary of endpoints with HTTP methods and paths
- Sample request/response for each endpoint
- Next steps (implement business logic, add auth, etc.)

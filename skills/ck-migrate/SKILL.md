Create a database migration with up and down scripts

## Input

`$ARGUMENTS` - Description of the migration (e.g., `"add email_verified column to users"`, `"create invoices table"`, `"rename status to state in orders"`)

## Workflow

### Step 1: Detect Migration Tool

1. Read `.claude/profile.json` to identify the ORM/migration tool from the project's tool configuration
2. If no profile exists, detect from `package.json`:

```bash
# Fallback: Check package.json dependencies
cat package.json 2>/dev/null | grep -E "prisma|typeorm|drizzle|knex|sequelize|migrate"
```

Also check for existing migration files:
```bash
find . -path "*/migrations/*" -o -path "*/prisma/migrations/*" -type f 2>/dev/null | head -20
```

Determine which tool is used: Prisma, TypeORM, Drizzle, Knex, or raw SQL.

### Step 2: Load Database Rules

1. Read rules from `.claude/rules/`:
   - `01-*` (universal rules) - load relevant universal rules
   - `02-*` (domain rules) - load backend domain rules (database patterns)
   - `04-*` (tool rules) - load for the specific ORM/migration tool identified in the profile (Prisma, TypeORM, Drizzle, etc.)
2. If no profile exists, read all available rules from `.claude/rules/` and apply database-relevant ones. Suggest running `/init` first.

Key principles:
- Every migration must have both up and down scripts
- Migrations should be atomic (one logical change per migration)
- Use reversible operations when possible
- Data migrations should be separate from schema migrations
- Test both up and down migrations

### Step 3: Plan the Migration

Based on `$ARGUMENTS`, determine:
- **Schema changes**: New tables, columns, indexes, constraints
- **Data changes**: Transformations, backfills, cleanups
- **Dependencies**: Does this depend on other tables or columns existing?
- **Reversibility**: Can this be safely rolled back?

### Step 4: Create the Migration File

Generate the migration using the project's tool:

**Prisma:**
```bash
npx prisma migrate dev --name <migration-name> --create-only
```
Then edit the generated SQL file.

**TypeORM:**
```bash
npx typeorm migration:create src/migrations/<MigrationName>
```
Then implement the `up()` and `down()` methods.

**Drizzle:**
```bash
npx drizzle-kit generate:migration --name <migration-name>
```

**Raw SQL / Knex:**
Create a new file following the project's naming convention (e.g., `YYYYMMDDHHMMSS_<description>.ts` or `.sql`).

### Step 5: Write the Up Migration

Implement the schema changes:
- Use proper column types and constraints
- Add indexes for columns used in WHERE clauses or JOINs
- Set appropriate defaults and nullability
- Add foreign key constraints where needed
- Include comments for non-obvious choices

For data migrations:
- Process in batches to avoid locking large tables
- Handle NULL values and edge cases
- Log progress for long-running migrations

### Step 6: Write the Down Migration

Implement the rollback that reverses the up migration:
- Drop added columns or tables
- Restore renamed columns
- Reverse data transformations
- Handle cases where rollback may lose data (document this)

If the migration is not fully reversible (e.g., dropping a column with data), add a clear comment explaining what data will be lost on rollback.

### Step 7: Update Schema (if applicable)

If the project uses a schema file (Prisma schema, TypeORM entities):
- Update the schema/entity to reflect the migration changes
- Ensure types are in sync with the database

### Step 8: Test the Migration

Run the migration in both directions:

```bash
# Run the up migration
<tool-specific up command>

# Verify the schema changed correctly
<tool-specific schema check>

# Run the down migration
<tool-specific down command>

# Verify the rollback was clean
<tool-specific schema check>
```

### Output

Display:
- Migration file path and content
- Summary of schema changes
- Rollback plan
- Any warnings about irreversible operations or data loss
- Next steps (run migration, update seeds, notify team)

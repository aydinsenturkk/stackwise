Sync CLAUDE.md with current project state by analyzing the actual project structure

## Workflow

### Step 1: Read Project Profile

Read `.claude/profile.json` to get the current stack and workflow configuration.

If no profile exists, inform the user to run `npx stackwise` first and stop.

### Step 2: Read package.json

Read `package.json` from the project root to get:
- `name` — project name
- `scripts` — available commands

### Step 3: Analyze Project Structure

Scan the project directory to understand the actual structure:

1. List top-level directories (`ls` the project root)
2. If `prisma/schema.prisma` exists, read it and extract model names
3. If `src/app/api/` exists (Next.js), list the route structure
4. If `src/routes/` or `src/controllers/` exists, list the endpoints/controllers
5. If there are workspace directories (monorepo), list their structure

### Step 4: Build the Auto Section

Generate the content between `<!-- CLAUDEKIT:AUTO:START -->` and `<!-- CLAUDEKIT:AUTO:END -->` markers:

```markdown
<!-- CLAUDEKIT:AUTO:START -->
# <project-name>

## Stack
- **Language:** <from profile>
- **Framework:** <from profile>
- ... (list all detected tools from profile)

## Commands
```bash
<package-manager> <script-name>    # <script-command>
```

## Workflow
- **Commits:** <convention summary>
- **Branches:** <strategy summary>
- **Releases:** <release strategy>
- **PR merge:** <merge strategy>

## Project Structure
- <key directories and their purpose, based on Step 3 analysis>
- <API routes if found>
- <DB models if found>
<!-- CLAUDEKIT:AUTO:END -->
```

The "Project Structure" section is the key advantage of this skill over the CLI — use your analysis from Step 3 to describe the actual project layout, key directories, API routes, and database models.

### Step 5: Update CLAUDE.md

1. Read the existing `CLAUDE.md` file
2. Find the `<!-- CLAUDEKIT:AUTO:START -->` and `<!-- CLAUDEKIT:AUTO:END -->` markers
3. Replace everything between the markers (inclusive) with the new auto section
4. **Do NOT modify anything outside the markers** — that is the user's custom content
5. If no markers exist, prepend the auto section to the beginning of the file, preserving all existing content
6. Write the updated file

### Important Rules

- Never delete or modify content outside the `CLAUDEKIT:AUTO:START/END` markers
- Keep the auto section concise — this goes into Claude's context on every conversation
- Use the profile's `stack.package_manager` to determine the correct run command (`npm run`, `pnpm`, `bun`, `yarn`)
- If `$ARGUMENTS` contains specific instructions (e.g., "add API routes"), focus the analysis on that area

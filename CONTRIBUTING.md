# Contributing to stackwise

Thanks for your interest in contributing! This guide covers the project structure and how to add new knowledge files, skills, agents, and tool detections.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/aydinsenturkk/stackwise.git
cd stackwise

# Install dependencies
npm install

# Link for local testing
npm link

# Run in any project
cd /path/to/your-project
stackwise
```

## Project Structure

```
stackwise/
├── bin/stackwise.js          # CLI entry point
├── src/
│   ├── cli.js                # Main orchestrator (interactive flow)
│   ├── detect.js             # Stack auto-detection from package.json
│   ├── compose.js            # Rule composition with YAML frontmatter
│   ├── registry.js           # Registry loader and query functions
│   ├── profiles.js           # Stack → knowledge file mapping
│   ├── prompts.js            # Interactive prompts (@inquirer/prompts)
│   ├── settings.js           # Settings merge logic
│   ├── constants.js          # Skills, agents, hooks, dependency map
│   └── utils.js              # File system helpers
├── knowledge/                # 4-layer knowledge system
│   ├── layer-1-universal/    # Rules for all projects
│   ├── layer-2-domain/       # Frontend / backend specific
│   ├── layer-3-framework/    # Framework-specific (Next.js, NestJS, etc.)
│   └── layer-4-tool/         # Tool-specific (Prisma, Zod, etc.)
├── skills/                   # Slash command definitions (SKILL.md files)
├── agents/                   # Custom agent definitions
├── hooks/                    # Hook scripts
├── settings/                 # Settings presets
├── templates/                # CLAUDE.md templates
└── lib/registry.json         # Knowledge file registry
```

## Adding a Knowledge File

1. Create a markdown file in the appropriate layer directory:
   - `knowledge/layer-1-universal/` — applies to all projects
   - `knowledge/layer-2-domain/frontend/` or `backend/` — domain-specific
   - `knowledge/layer-3-framework/frontend/` or `backend/` — framework-specific
   - `knowledge/layer-4-tool/<category>/` — tool/library-specific

2. Add an entry to `lib/registry.json`:

   ```json
   {
     "path": "knowledge/layer-4-tool/category/tool-name.md",
     "layer": 4,
     "name": "tool-name",
     "domain": "backend",
     "framework": null,
     "tool": "tool-name",
     "glob_strategy": "backend"
   }
   ```

   - `domain`: `"frontend"`, `"backend"`, or `null` (universal)
   - `glob_strategy`: `"frontend"`, `"backend"`, or `"all"`

3. If this is a tool rule (Layer 4), add the mapping to `src/profiles.js` in the `TOOL_MAP` object:

   ```js
   'tool-name': 'tool-name',
   ```

## Adding a Skill

1. Create a directory `skills/<name>/` with a `SKILL.md` file.

2. Use `$ARGUMENTS` as placeholder for user input after the command:

   ```markdown
   Do something with `$ARGUMENTS`

   ## Workflow

   ### Step 1: ...
   ```

3. Add the skill to the `SKILLS` array in `src/constants.js`:

   ```js
   { name: 'skill-name', description: 'What it does' },
   ```

4. If the skill is frontend or backend only, add to `FRONTEND_SKILLS` or `BACKEND_SKILLS`.

## Adding an Agent

1. Create `agents/<name>/<name>.md` with YAML frontmatter:

   ```yaml
   ---
   model: sonnet
   tools:
     - Read
     - Grep
     - Glob
   ---

   Agent instructions here...
   ```

2. Add to the `AGENTS` array in `src/constants.js`:

   ```js
   { name: 'agent-name', description: 'What it does' },
   ```

## Adding Tool Detection

1. Add the package name to `DEPENDENCY_MAP` in `src/constants.js`:

   ```js
   'package-name': { category: 'category_name', value: 'detection-value' },
   ```

   - `category`: detection category (e.g., `'orm'`, `'auth'`, `'styling'`)
   - `value`: the value stored in the stack object
   - Optional `excludeIf`: package name(s) that, if present, suppress this detection

2. If the category is new, add the corresponding array to `detect.js` in the stack initialization.

3. Add the tool mapping in `src/profiles.js` `TOOL_MAP` and create the knowledge file in `lib/registry.json`.

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add knowledge rule for Redis
fix: correct glob pattern for monorepo detection
docs: update README with new skill descriptions
chore: bump @inquirer/prompts to v8
```

## Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Commit with a conventional commit message
5. Push and open a PR against `main`

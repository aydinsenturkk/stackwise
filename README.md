# claudekit

Curated knowledge base of rules, skills, agents, and hooks for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). One command to set up any TypeScript project.

[![npm version](https://img.shields.io/npm/v/claudekit)](https://www.npmjs.com/package/claudekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

```bash
npx claudekit
```

## What It Does

claudekit scans your `package.json` (including monorepo workspaces), detects your frameworks, tools, and libraries, then installs:

- **Knowledge rules** into `.claude/rules/` with proper glob frontmatter
- **Skills** (slash commands) into `.claude/skills/`
- **Agents** (specialized AI agents) into `.claude/agents/`
- **Hooks** (automation scripts) into `.claude/hooks/`
- **Settings** preset merged into `.claude/settings.json`
- **CLAUDE.md** auto-generated with your stack and workflow info

No global install needed. Just `npx claudekit` in any project.

## Supported Stacks

### Auto-Detected Frameworks & Tools

| Category | Detected |
|----------|----------|
| **Frontend** | Next.js, React SPA, Vue, Nuxt, Angular, Svelte, SvelteKit, Astro, Solid, Solid Start, Qwik, Remix, TanStack Start |
| **Backend** | NestJS, Express, Fastify, Hono, Koa, AdonisJS, FeathersJS, Elysia, Hapi, Nitro |
| **ORM / Database** | Prisma, Drizzle, TypeORM, Mongoose, Sequelize, Knex, Mikro-ORM |
| **State Management** | TanStack Query, TanStack Store, Zustand, Redux Toolkit |
| **Validation** | Zod, Valibot, class-validator |
| **Testing** | Vitest, Jest, Playwright, Cypress |
| **Styling** | Tailwind CSS, Styled Components, Emotion |
| **Forms** | React Hook Form, TanStack Form |
| **UI Components** | shadcn/ui |
| **Routing** | TanStack Router |
| **Animation** | Framer Motion |
| **Tables** | TanStack Table |
| **DevTools** | TanStack DevTools |
| **Auth** | NestJS Passport, Passport, NextAuth, Auth.js, Lucia |
| **GraphQL / API** | GraphQL, Apollo Server, Apollo Client, tRPC |
| **Realtime** | Socket.IO, ws |
| **Logging** | Winston, Pino |
| **HTTP Client** | Axios, Ky |
| **i18n** | i18next, next-intl |
| **Date** | Day.js, date-fns, Luxon |
| **Email** | Nodemailer, NestJS Mailer |
| **Upload** | Multer |
| **Queue** | BullMQ |
| **API Docs** | NestJS Swagger |
| **Rate Limiting** | NestJS Throttler |
| **Cache** | NestJS Cache Manager |
| **Config** | NestJS Config |
| **Monorepo** | pnpm workspaces, Turborepo, Nx, Lerna |

### Package Managers

npm, pnpm, yarn, bun

## 4-Layer Knowledge System

Knowledge files are organized into layers of increasing specificity. Only the layers relevant to your stack get installed.

| Layer | Count | Scope |
|-------|-------|-------|
| **Layer 1: Universal** | 16 files | Architecture, TypeScript patterns, error handling, testing, security, API design, performance, naming, code review, docs, observability, dependencies, configuration, anti-patterns, refactoring, PM workflow |
| **Layer 2: Domain** | 22 files | Frontend (10): component design, accessibility, i18n, etc. Backend (12): database patterns, caching, validation, event-driven, contracts, etc. |
| **Layer 3: Framework** | 3 files | Next.js (App Router, Server Components), React SPA (Vite, client routing), NestJS (modules, DI) |
| **Layer 4: Tool** | 45 files | ORM, validation, state, forms, auth, GraphQL, realtime, logging, HTTP, i18n, date, email, upload, etc. |

**Total: 86 knowledge rules**

### Profiles

| Profile | Layers | Description |
|---------|--------|-------------|
| `fullstack-nextjs` | L1 + L2 frontend + L2 backend + L3 Next.js + L4 tools | Next.js fullstack applications |
| `fullstack-react-nestjs` | L1 + L2 both + L3 React SPA + L3 NestJS + L4 tools | React + NestJS monorepo |
| `frontend-react` | L1 + L2 frontend + L3 React SPA + L4 tools | React SPA without backend |
| `backend-nestjs` | L1 + L2 backend + L3 NestJS + L4 tools | NestJS API without frontend |
| `generic` | L1 only | Any TypeScript project |

**Example:** A Next.js + Prisma + Zod + TanStack Query + Vitest project gets: 16 universal + 10 frontend + 1 Next.js + 4 tool-specific = **31 rules**.

## PM Workflow

claudekit includes a spec-driven development workflow powered by 5 slash commands. Plan features as PRDs, decompose into epics and tasks backed by GitHub Issues, then implement them — manually or fully automated.

```
Idea → /ck-plan → PRD + Epic + GitHub Issues
                        ↓
              /ck-tasks (view dashboard)
                        ↓
              /ck-work  (pick up & implement)
                        ↓
              /ck-ship  (PR + merge)
                        ↓
              /ck-standup (status report)
```

### Commands

| Command | Description |
|---------|-------------|
| `/ck-plan <idea>` | Generate PRD, epic, tasks, and GitHub Issues from an idea |
| `/ck-plan <idea> --auto` | Plan and automatically execute all tasks until epic is complete |
| `/ck-tasks` | View task status dashboard from GitHub Issues |
| `/ck-work <issue>` | Pick up a task and implement it |
| `/ck-ship` | Create PR for completed task and optionally merge |
| `/ck-standup` | Generate standup status report across all epics |

### Integration Branch Support

When enabled during setup, task PRs target an integration branch (`feat/<epic-slug>`) instead of main. After all tasks are complete, a final PR merges the integration branch into main.

### Project Management Files

```
.claude/pm/
├── PROJECT.md              # Project index with epic roadmap
├── prds/
│   └── <epic-slug>.md      # PRD per epic
└── epics/
    └── <epic-slug>/
        ├── epic.md          # Epic details and task table
        └── tasks.md         # Task ↔ GitHub Issue mapping
```

## Skills (17 Slash Commands)

Installed to `.claude/skills/` and available as `/command` in Claude Code.

### Development

| Command | Description |
|---------|-------------|
| `/ck-review` | Code review using project rules as checklist |
| `/ck-fix-issue <number>` | Fetch GitHub issue and implement fix |
| `/ck-new-feature <name>` | Scaffold feature with proper structure |
| `/ck-add-tests <file>` | Generate tests following testing philosophy |
| `/ck-api-endpoint <resource>` | Create REST endpoint with full stack |
| `/ck-component <name>` | Create React component with types and tests |
| `/ck-debug <description>` | Structured debugging workflow |
| `/ck-optimize <file>` | Performance analysis and optimization |
| `/ck-pr` | Create pull request with full context |
| `/ck-migrate <description>` | Database migration with rollback strategy |

### PM Workflow

| Command | Description |
|---------|-------------|
| `/ck-plan <idea>` | Generate PRD, epic, tasks, and GitHub Issues. Use `--auto` to execute all tasks |
| `/ck-tasks` | View task status dashboard from GitHub Issues |
| `/ck-work <issue>` | Pick up a task and implement it |
| `/ck-ship` | Create PR for completed task and optionally merge |
| `/ck-standup` | Generate standup status report across all epics |

### Utility

| Command | Description |
|---------|-------------|
| `/ck-generate-knowledge` | Generate knowledge rules for an unsupported tool |
| `/ck-sync-project` | Sync CLAUDE.md with current project state |

Skills are context-aware: `/ck-component` only appears for frontend projects, `/ck-api-endpoint` and `/ck-migrate` only for backend.

## Agents (4 Specialized)

| Agent | Model | Purpose |
|-------|-------|---------|
| `code-reviewer` | Sonnet | Thorough code review with categorized findings |
| `test-writer` | Sonnet | Test generation following testing philosophy |
| `security-auditor` | Opus | Security analysis using OWASP categories |
| `refactorer` | Sonnet | Safe refactoring with test verification |

## Hooks

| Hook | Trigger | Purpose |
|------|---------|---------|
| `format-on-save.sh` | After Edit/Write | Auto-formats files after Claude edits them |
| `protect-env.sh` | Before Bash/Read | Blocks Claude from reading .env files |

## How It Works

Running `npx claudekit` walks you through an interactive flow:

1. Checks for existing `.claude/profile.json` (offers to update or start fresh)
2. Scans `package.json` files to detect your stack (including monorepo workspaces)
3. Shows detection results and asks for confirmation/overrides
4. Configures development workflow (commit convention, branch strategy, integration branches, release strategy, PR merge strategy)
5. Asks for glob path patterns (frontend/backend/shared)
6. Resolves knowledge files from all 4 layers based on your stack
7. Lets you select which skills, agents, and hooks to install
8. Composes and installs everything, merges settings, generates CLAUDE.md

Re-run anytime to update your configuration:

```bash
npx claudekit
```

## What Gets Created

```
your-project/
├── .claude/
│   ├── profile.json           # Your stack profile (re-used on next run)
│   ├── settings.json          # Permissions + hooks config
│   ├── rules/
│   │   ├── 01-universal-*.md  # Layer 1 rules
│   │   ├── 02-frontend-*.md   # Layer 2 frontend rules
│   │   ├── 02-backend-*.md    # Layer 2 backend rules
│   │   ├── 03-framework-*.md  # Layer 3 framework rules
│   │   └── 04-tool-*.md       # Layer 4 tool rules
│   ├── skills/                # Slash commands
│   ├── agents/                # Specialized agents
│   ├── hooks/                 # Automation scripts
│   └── pm/                    # PM workflow (created by /ck-plan)
│       ├── PROJECT.md
│       ├── prds/
│       └── epics/
└── CLAUDE.md                  # Auto-generated project instructions
```

## Customization

### Adding a knowledge file

1. Create a markdown file in the appropriate layer directory under `knowledge/`
2. Layer 1 files apply universally; Layer 2+ files are profile-specific
3. Add an entry to `lib/registry.json` with layer, domain, tool, and glob_strategy
4. If Layer 4, add the tool mapping to `src/profiles.js` `TOOL_MAP`

### Adding a skill

1. Create `skills/<name>/SKILL.md`
2. Use `$ARGUMENTS` for user input after the command
3. Write step-by-step instructions for Claude to follow
4. Add to `SKILLS` array in `src/constants.js`

### Adding an agent

1. Create `agents/<name>/<name>.md`
2. Use YAML frontmatter for model and tool configuration
3. Add to `AGENTS` array in `src/constants.js`

### Adding tool detection

1. Add the package name to `DEPENDENCY_MAP` in `src/constants.js`
2. Map the detection value in `TOOL_MAP` in `src/profiles.js`
3. Create the knowledge rule and register in `lib/registry.json`

## Requirements

- Node.js >= 18.0.0

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)

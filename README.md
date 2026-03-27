# stackwise

Curated knowledge base of rules, skills, agents, and hooks for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). One command to set up any TypeScript project.

[![npm version](https://img.shields.io/npm/v/stackwise)](https://www.npmjs.com/package/stackwise)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

```bash
npx stackwise
```

## What It Does

stackwise scans your `package.json` (including monorepo workspaces), detects your frameworks, tools, and libraries, then installs:

- **Knowledge rules** into `.claude/rules/` with proper glob frontmatter
- **Skills** (slash commands) into `.claude/skills/`
- **Agents** (specialized AI agents) into `.claude/agents/`
- **Hooks** (automation scripts) into `.claude/hooks/`
- **Settings** preset merged into `.claude/settings.json`
- **CLAUDE.md** auto-generated with your stack and workflow info

No global install needed. Just `npx stackwise` in any project.

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
| **UI Components** | shadcn/ui, Storybook |
| **Routing** | TanStack Router |
| **Animation** | Framer Motion |
| **Tables** | TanStack Table |
| **DevTools** | TanStack DevTools |
| **Auth** | NestJS Passport, Passport, NextAuth, Auth.js, Better Auth |
| **GraphQL** | Apollo Server, Apollo Client |
| **RPC** | tRPC |
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
| **Monorepo** | npm workspaces, yarn workspaces, pnpm workspaces, Turborepo, Nx, Lerna |

### Package Managers

npm, pnpm, yarn, bun

## 4-Layer Knowledge System

Knowledge files are organized into layers of increasing specificity. Only the layers relevant to your stack get installed.

| Layer | Count | Scope |
|-------|-------|-------|
| **Layer 1: Universal** | 19 files | Architecture, TypeScript patterns, error handling, testing, security, API design, performance, naming, code review, docs, observability, dependencies, configuration, anti-patterns, refactoring, concurrency, git workflow, CI/CD, PM workflow |
| **Layer 2: Domain** | 24 files | Frontend (10): component design, accessibility, i18n, etc. Backend (14): database patterns, caching, validation, event-driven, contracts, performance, anti-patterns, etc. |
| **Layer 3: Framework** | 12 files | Frontend (7): Next.js, React SPA, Vue, Nuxt, Angular, Remix/React Router v7, TanStack Start. Backend (5): NestJS, Express, Fastify, Hono, Koa |
| **Layer 4: Tool** | 50 files | ORM, validation, state, forms, auth, GraphQL, RPC, realtime, logging, HTTP, i18n, date, email, upload, etc. |

**Total: 105 knowledge rules**

### Profiles

| Profile | Layers | Description |
|---------|--------|-------------|
| `fullstack-nextjs` | L1 + L2 frontend + L2 backend + L3 Next.js + L4 tools | Next.js fullstack applications |
| `fullstack-react-nestjs` | L1 + L2 both + L3 React SPA + L3 NestJS + L4 tools | React + NestJS monorepo |
| `frontend-react` | L1 + L2 frontend + L3 React SPA + L4 tools | React SPA without backend |
| `backend-nestjs` | L1 + L2 backend + L3 NestJS + L4 tools | NestJS API without frontend |
| `generic` | L1 only | Any TypeScript project |

**Example:** A Next.js + Prisma + Zod + TanStack Query + Vitest project gets: 19 universal + 10 frontend + 1 Next.js + 4 tool-specific = **34 rules**.

## PM Workflow

stackwise includes a two-tier development workflow powered by 5 slash commands. Small work becomes a standalone task (single issue, single PR). Larger work becomes an epic — explored, planned, reviewed, then executed.

```
Idea → /sw-plan → Assess scope
                        ↓
          ┌─────────────┴──────────────────┐
    Standalone Task                   Epic
     Review → Issue                    ↓
          ↓                     Explore & brainstorm
    /sw-work → /sw-ship         (research, propose, iterate)
                                       ↓
                                PRD + task breakdown
                                       ↓
                                Review & approve
                                (user confirms plan)
                                       ↓
                                GitHub Issues created
                                       ↓
                                /sw-tasks (dashboard)
                                       ↓
                                /sw-work  (implement)
                                       ↓
                                /sw-ship  (PR + merge)
                                       ↓
                                /sw-standup (report)
```

### Commands

| Command | Description |
|---------|-------------|
| `/sw-plan <idea>` | Plan work as standalone task or epic |
| `/sw-plan <idea> --auto` | Plan epic and automatically execute all tasks until complete |
| `/sw-tasks` | View task status dashboard from GitHub Issues |
| `/sw-work <issue>` | Pick up a task and implement it |
| `/sw-ship` | Create PR for a tracked task issue, close it, and optionally merge |
| `/sw-standup` | Generate standup status report across all epics |

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

## Skills (8 Slash Commands)

Installed to `.claude/skills/` and available as `/command` in Claude Code.

### PM Workflow

| Command | Description |
|---------|-------------|
| `/sw-plan <idea>` | Plan work as standalone task or epic. Use `--auto` for epic auto-execution |
| `/sw-tasks` | View task status dashboard from GitHub Issues |
| `/sw-work <issue>` | Pick up a task and implement it |
| `/sw-ship` | Create PR for a tracked task issue, close it, and optionally merge |
| `/sw-standup` | Generate standup status report across all epics |
| `/sw-review` | Code review using project rules as checklist |

### Utility

| Command | Description |
|---------|-------------|
| `/sw-generate-knowledge` | Generate knowledge rules for an unsupported tool |
| `/sw-sync-project` | Sync CLAUDE.md with current project state |

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

Running `npx stackwise` walks you through an interactive flow:

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
npx stackwise
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
│   └── pm/                    # PM workflow (created by /sw-plan)
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

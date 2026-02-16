# claudekit

Curated knowledge base of rules, skills, agents, and hooks for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). One command to set up any TypeScript project.

```bash
npx claudekit
```

The interactive CLI auto-detects your project's stack, lets you confirm or override, and installs the right combination of knowledge rules, skills, agents, and hooks into `.claude/`.

## What It Does

claudekit scans your `package.json` (including monorepo workspaces), detects your frameworks, tools, and libraries, then installs:

- **Knowledge rules** into `.claude/rules/` with proper glob frontmatter
- **Skills** (slash commands) into `.claude/skills/`
- **Agents** (specialized AI agents) into `.claude/agents/`
- **Hooks** (automation scripts) into `.claude/hooks/`
- **Settings** preset merged into `.claude/settings.json`
- **CLAUDE.md** template tailored to your stack

No global install needed. No `~/.claude-skills/` directory. Just `npx claudekit` in any project.

## Supported Stacks

### Auto-Detected Frameworks & Tools

| Category | Detected |
|----------|----------|
| **Frontend** | Next.js, React SPA, Vue, Angular, Svelte |
| **Backend** | NestJS, Express, Fastify, Hono, Koa |
| **ORM** | Prisma, Drizzle, TypeORM |
| **State** | TanStack Query, Zustand, Redux Toolkit |
| **Validation** | Zod, Valibot |
| **Testing** | Vitest, Jest, Playwright, Cypress |
| **Styling** | Tailwind CSS, Styled Components, Emotion |
| **Queue** | BullMQ |
| **Monorepo** | pnpm workspaces, Turborepo, Nx, Lerna |

### Package Managers

npm, pnpm, yarn, bun

## 4-Layer Knowledge System

Knowledge files are organized into layers of increasing specificity. Only the layers relevant to your stack get installed.

| Layer | Count | Scope |
|-------|-------|-------|
| **Layer 1: Universal** | 14 files | Architecture, TypeScript patterns, error handling, testing, security, API design, performance, naming, code review, docs, observability, dependencies, configuration, anti-patterns |
| **Layer 2: Domain** | 21 files | Frontend (10): component design, accessibility, i18n, etc. Backend (11): database patterns, caching, validation, event-driven, etc. |
| **Layer 3: Framework** | 3 files | Next.js (App Router, Server Components), React SPA (Vite, client routing), NestJS (modules, DI) |
| **Layer 4: Tool** | 5 files | Prisma, Zod, TanStack Query, Vitest, BullMQ |

**Example:** A Next.js + Prisma + Zod + Vitest project gets: 14 universal + 10 frontend + 1 Next.js + 3 tool-specific = **28 rules**.

## Skills (10 Slash Commands)

Installed to `.claude/skills/` and available as `/command` in Claude Code.

| Command | Description |
|---------|-------------|
| `/review` | Code review using project rules as checklist |
| `/fix-issue <number>` | Fetch GitHub issue and implement fix |
| `/new-feature <name>` | Scaffold feature with proper structure |
| `/add-tests <file>` | Generate tests following testing philosophy |
| `/api-endpoint <resource>` | Create REST endpoint with full stack |
| `/component <name>` | Create React component with types and tests |
| `/debug <description>` | Structured debugging workflow |
| `/optimize <file>` | Performance analysis and optimization |
| `/pr` | Create pull request with full context |
| `/migrate <description>` | Database migration with rollback strategy |

Skills are context-aware: `/component` only appears for frontend projects, `/api-endpoint` and `/migrate` only for backend.

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

Running `npx claudekit` walks you through an 8-step interactive flow:

1. Checks for existing `.claude/profile.json` (offers to update or start fresh)
2. Scans `package.json` files to detect your stack
3. Shows detection results and asks for confirmation/overrides
4. Asks for glob path patterns (frontend/backend/shared)
5. Lets you select which skills, agents, and hooks to install
6. Composes knowledge rules with proper YAML frontmatter
7. Merges settings preset into `.claude/settings.json`
8. Copies the matching `CLAUDE.md` template if one doesn't exist

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
│   └── hooks/                 # Automation scripts
└── CLAUDE.md                  # Project-level instructions template
```

## Requirements

- Node.js >= 18.0.0

## License

MIT

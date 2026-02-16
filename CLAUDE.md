# claudekit - Knowledge Base for Claude Code

A reusable knowledge base of rules, skills, agents, hooks, and settings for Claude Code. Run `npx claudekit` in any project to configure it — no global install needed.

## Quick Start

```bash
npx claudekit
```

The interactive CLI auto-detects your project's stack, lets you confirm/override, and installs the right combination of knowledge rules, skills, agents, and hooks into `.claude/`.

## 4-Layer Knowledge System

Knowledge files are organized into layers of increasing specificity. The CLI installs the right combination as `.claude/rules/` files based on your project's stack.

### Layer 1: Universal (14 files)
Applies to all TypeScript projects regardless of stack.

- `architecture-principles.md` - Clean architecture, separation of concerns, dependency rules
- `typescript-patterns.md` - Strict TypeScript, discriminated unions, type inference
- `error-handling.md` - Error hierarchies, Result patterns, error boundaries
- `testing-philosophy.md` - Testing trophy, behavior-driven tests, fixture patterns
- `security-principles.md` - Input validation, auth patterns, secrets management
- `api-design.md` - REST conventions, versioning, pagination, error responses
- `performance-principles.md` - Bundle optimization, lazy loading, caching strategies
- `naming-conventions.md` - File naming, variable naming, consistent terminology
- `code-review-standards.md` - Review checklist, PR conventions, feedback style
- `documentation-standards.md` - JSDoc, README structure, decision records
- `observability.md` - Structured logging, metrics, distributed tracing
- `dependency-management.md` - Version pinning, audit, update strategy
- `configuration-management.md` - Environment variables, feature flags, secrets
- `anti-patterns.md` - Common mistakes and how to avoid them

### Layer 2: Domain (21 files)
Frontend or backend specific knowledge.

**Frontend (10 files):** component-design, frontend-architecture, frontend-testing, frontend-performance, frontend-security, frontend-error-handling, accessibility, internationalization, frontend-naming, frontend-anti-patterns

**Backend (11 files):** backend-architecture, backend-api-design, backend-testing, backend-security, backend-error-handling, database-patterns, caching-strategies, validation-patterns, event-driven, background-jobs, backend-naming

### Layer 3: Framework (3 files)
Framework-specific patterns and conventions.

- `frontend/nextjs.md` - App Router, Server Components, Route Handlers
- `frontend/react-spa.md` - Vite, client-side routing, SPA patterns
- `backend/nestjs.md` - Modules, decorators, dependency injection

### Layer 4: Tool (5 files)
Library and tool-specific usage patterns.

- `orm/prisma.md` - Schema design, migrations, query patterns
- `validation/zod.md` - Schema composition, refinements, transforms
- `state/tanstack-query.md` - Query keys, mutations, optimistic updates
- `testing/vitest.md` - Configuration, mocking, snapshot testing
- `queue/bullmq.md` - Job processing, retry strategies, concurrency

## Profiles

Profiles are automatically determined based on detected stack. The CLI resolves which knowledge layers and tools to install.

| Profile | Layers | Description |
|---------|--------|-------------|
| `fullstack-nextjs` | L1 + L2 frontend + L2 backend + L3 Next.js + L4 tools | Next.js fullstack applications |
| `fullstack-react-nestjs` | L1 + L2 both + L3 React SPA + L3 NestJS + L4 tools | React + NestJS monorepo |
| `frontend-react` | L1 + L2 frontend + L3 React SPA + L4 tools | React SPA without backend |
| `backend-nestjs` | L1 + L2 backend + L3 NestJS + L4 tools | NestJS API without frontend |
| `generic` | L1 only | Any TypeScript project |

## Skills (10 slash commands)

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

## Agents (4 specialized)

| Agent | Model | Purpose |
|-------|-------|---------|
| `code-reviewer` | sonnet | Thorough code review with categorized findings |
| `test-writer` | sonnet | Test generation following testing philosophy |
| `security-auditor` | opus | Security analysis using OWASP categories |
| `refactorer` | sonnet | Safe refactoring with test verification |

## Hooks

- **format-on-save.sh** - Auto-formats files after Claude edits them
- **protect-env.sh** - Blocks Claude from reading .env files

## Templates (4 stack presets)

CLAUDE.md templates for common stacks. The CLI copies one into your project and you fill in the TODOs.

- `nextjs.md` - Next.js App Router fullstack
- `react-nestjs.md` - React + NestJS monorepo
- `react-spa.md` - React single-page application
- `generic.md` - Framework-agnostic starter

## Customization

### Adding a knowledge file

1. Create a markdown file in the appropriate layer directory under `knowledge/`
2. Layer 1 files apply universally; Layer 2+ files are profile-specific
3. Update `lib/registry.json` if the file should be included in specific profiles

### Adding a skill

1. Create `skills/<name>/SKILL.md`
2. Use `$ARGUMENTS` for user input after the command
3. Write step-by-step instructions for Claude to follow

### Adding an agent

1. Create `agents/<name>/<name>.md`
2. Use YAML frontmatter for model and tool configuration

### Adding a template

1. Create `templates/<name>.md` with sections: Project Overview, Architecture, Common Commands, Tech Stack, Conventions
2. Use `<!-- TODO: ... -->` comments for project-specific details

## Directory Structure

```
claudekit/
├── package.json              # npm package definition
├── bin/
│   └── claudekit.js          # CLI entry point (#!/usr/bin/env node)
├── src/
│   ├── cli.js                # Main orchestrator (8-step interactive flow)
│   ├── detect.js             # Auto-detection of project stack
│   ├── compose.js            # Rule composition with frontmatter
│   ├── registry.js           # Registry loader and query functions
│   ├── profiles.js           # Stack → knowledge file mapping
│   ├── prompts.js            # Interactive prompts (@inquirer/prompts)
│   ├── settings.js           # Settings merge logic
│   ├── constants.js          # Skills, agents, hooks, dependency map
│   └── utils.js              # File system helpers
├── knowledge/                # 4-layer knowledge system
│   ├── layer-1-universal/    # 14 files - all TypeScript projects
│   ├── layer-2-domain/       # Domain-specific
│   │   ├── frontend/         # 10 files
│   │   └── backend/          # 11 files
│   ├── layer-3-framework/    # Framework-specific
│   │   ├── frontend/         # nextjs.md, react-spa.md
│   │   └── backend/          # nestjs.md
│   └── layer-4-tool/         # Tool-specific
│       ├── orm/              # prisma.md
│       ├── validation/       # zod.md
│       ├── state/            # tanstack-query.md
│       ├── testing/          # vitest.md
│       └── queue/            # bullmq.md
├── lib/
│   └── registry.json         # Knowledge file registry with metadata
├── skills/                   # Slash command definitions
│   ├── review/
│   ├── fix-issue/
│   ├── new-feature/
│   ├── add-tests/
│   ├── api-endpoint/
│   ├── component/
│   ├── debug/
│   ├── optimize/
│   ├── pr/
│   └── migrate/
├── agents/                   # Custom agent definitions
│   ├── code-reviewer/
│   ├── test-writer/
│   ├── security-auditor/
│   └── refactorer/
├── hooks/                    # Hook scripts
├── settings/                 # Settings templates (base, frontend, backend, fullstack)
└── templates/                # CLAUDE.md templates (flat .md files)
```

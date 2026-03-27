# stackwise - Knowledge Base for Claude Code

A reusable knowledge base of rules, skills, agents, hooks, and settings for Claude Code. Run `npx stackwise` in any project to configure it — no global install needed.

## Quick Start

```bash
npx stackwise
```

The interactive CLI auto-detects your project's stack, lets you confirm/override, and installs the right combination of knowledge rules, skills, agents, and hooks into `.claude/`.

## 4-Layer Knowledge System

Knowledge files are organized into layers of increasing specificity. The CLI installs the right combination as `.claude/rules/` files based on your project's stack.

### Layer 1: Universal (19 files)
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
- `refactoring-principles.md` - When to refactor, code smells, safety checklist
- `concurrency-async.md` - Async patterns, Promise.all, race conditions
- `git-workflow.md` - Branching strategy, commit conventions, PR workflow
- `ci-cd-principles.md` - Pipeline design, deployment strategies, rollback
- `pm-workflow.md` - Task management, estimation, prioritization

### Layer 2: Domain (24 files)
Frontend or backend specific knowledge.

**Frontend (10 files):** component-design, frontend-architecture, frontend-testing, frontend-performance, frontend-security, frontend-error-handling, accessibility, internationalization, frontend-naming, frontend-anti-patterns

**Backend (14 files):** backend-architecture, backend-api-design, backend-testing, backend-security, backend-error-handling, backend-performance, backend-anti-patterns, database-patterns, caching-strategies, validation-patterns, event-driven, background-jobs, backend-naming, contract-patterns

### Layer 3: Framework (12 files)
Framework-specific patterns and conventions.

**Frontend (7 files):**
- `frontend/nextjs.md` - Next.js 15-16, App Router, Server Functions, `use cache`
- `frontend/react-spa.md` - Vite, React Router v7 library mode, route.lazy()
- `frontend/vue.md` - Vue 3.5, Composition API, script setup, composables
- `frontend/nuxt.md` - Nuxt 3.14+, auto-imports, useFetch, server routes
- `frontend/angular.md` - Angular 19+, signals, standalone, zoneless
- `frontend/remix.md` - React Router v7 Framework Mode, loaders/actions, typegen
- `frontend/tanstack-start.md` - TanStack Start v1 RC, server functions, Nitro

**Backend (5 files):**
- `backend/nestjs.md` - NestJS v11, modules, decorators, dependency injection
- `backend/express.md` - Express v5, middleware pipeline, async handlers
- `backend/fastify.md` - Fastify v5, plugin system, schema validation
- `backend/hono.md` - Multi-runtime, middleware, Zod OpenAPI, RPC mode
- `backend/koa.md` - Koa 3, onion middleware, context object

### Layer 4: Tool (50 files)
Library and tool-specific usage patterns across 26 categories.

- `orm/prisma.md` - Prisma 7, driver adapters, TypedSQL, Client Extensions
- `orm/drizzle.md` - SQL-first ORM, schema, relations, identity columns
- `orm/mongoose.md` - Mongoose ODM, schemas, TypeScript inference
- `orm/sequelize.md` - Sequelize ORM, models, migrations, scopes
- `orm/typeorm.md` - TypeORM, entities, decorators, repositories
- `orm/knex.md` - Knex.js query builder, migrations, seeds
- `orm/mikro-orm.md` - MikroORM, Unit of Work, Identity Map
- `validation/zod.md` - Schema composition, refinements, transforms
- `validation/class-validator.md` - Decorator validation, class-transformer, DTOs
- `state/tanstack-query.md` - TanStack Query v5, queryOptions, suspense hooks
- `state/tanstack-store.md` - Reactive store, selectors, persistence
- `state/zustand.md` - Zustand v5, slices, middleware, persist
- `testing/vitest.md` - Vitest v4, Browser Mode, visual regression
- `testing/jest.md` - Jest configuration, mocking, snapshots
- `testing/playwright.md` - E2E testing, page objects, assertions
- `queue/bullmq.md` - Job processing, retry strategies, concurrency
- `forms/react-hook-form.md` - Form state, Zod integration, field arrays
- `forms/tanstack-form.md` - Type-safe forms, field-level validation
- `styling/tailwind.md` - Tailwind v4, CSS-first config, container queries
- `ui/shadcn-ui.md` - Component composition, variants, Radix primitives
- `ui/storybook.md` - Storybook CSF3, stories, docs, interaction tests
- `routing/tanstack-router.md` - Type-safe routing, loaders, search params
- `rpc/trpc.md` - tRPC v11, streaming, SSE subscriptions, FormData
- `animation/framer-motion.md` - Motion (Framer Motion), layout animations
- `table/tanstack-table.md` - Headless tables, sorting, filtering, pagination
- `devtools/tanstack-devtools.md` - Query, Router, Form devtools setup
- `graphql/apollo-server.md` - Apollo Server v4, resolvers, context
- `graphql/apollo-client.md` - Apollo Client, cache, queries, mutations
- `auth/better-auth.md` - Better Auth (replaces Lucia), providers, sessions
- `auth/next-auth.md` - NextAuth.js / Auth.js v5, providers, middleware
- `auth/nestjs-passport.md` - JWT/Local strategies, guards, role-based auth
- `auth/passport.md` - Passport.js, strategies, serialization
- `realtime/socket-io.md` - Socket.IO, rooms, namespaces, events
- `realtime/ws.md` - ws WebSocket, binary, heartbeat
- `logging/winston.md` - Winston, transports, formats
- `logging/pino.md` - Pino, fast logging, child loggers
- `http-client/axios.md` - Axios, interceptors, instances
- `http-client/ky.md` - Ky, hooks, retry, timeout
- `i18n/i18next.md` - i18next, namespaces, interpolation
- `i18n/next-intl.md` - next-intl, App Router, messages
- `date/dayjs.md` - Day.js, parsing, formatting, plugins
- `date/date-fns.md` - date-fns, tree-shakeable, functional
- `date/luxon.md` - Luxon, DateTime, zones, intervals
- `email/nodemailer.md` - Nodemailer, SMTP, templates
- `email/nestjs-mailer.md` - @nestjs-modules/mailer, templates
- `upload/multer.md` - Multer, file uploads, storage
- `api-docs/nestjs-swagger.md` - OpenAPI docs, decorators, DocumentBuilder
- `rate-limiting/nestjs-throttler.md` - Rate limiting, throttlers, guards
- `cache/nestjs-cache-manager.md` - Redis/memory cache, interceptor, TTL
- `config/nestjs-config.md` - Environment variables, validation, namespaced config

## Profiles

Profiles are automatically determined based on detected stack. The CLI resolves which knowledge layers and tools to install.

| Profile | Layers | Description |
|---------|--------|-------------|
| `fullstack-nextjs` | L1 + L2 frontend + L2 backend + L3 Next.js + L4 tools | Next.js fullstack applications |
| `fullstack-react-nestjs` | L1 + L2 both + L3 React SPA + L3 NestJS + L4 tools | React + NestJS monorepo |
| `frontend-react` | L1 + L2 frontend + L3 React SPA + L4 tools | React SPA without backend |
| `backend-nestjs` | L1 + L2 backend + L3 NestJS + L4 tools | NestJS API without frontend |
| `generic` | L1 only | Any TypeScript project |

## Skills (8 slash commands)

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

## Agents (5 specialized)

| Agent | Model | Role | Purpose |
|-------|-------|------|---------|
| `backend-dev` | opus | Developer | Backend specialist: API, database, business logic |
| `frontend-dev` | opus | Developer | Frontend specialist: UI, components, state management |
| `qa` | opus | QA Engineer | Test coverage, edge cases, acceptance criteria validation |
| `code-reviewer` | opus | Reviewer | Code quality, patterns, conventions |
| `security-auditor` | opus | Security | Security analysis using OWASP categories |

### Workflow modes

- **Solo** (default): Single agent per task — implements, tests, and ships
- **Agency**: Specialized agents with quality pipeline — dev → qa → review → ship

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
stackwise/
├── package.json              # npm package definition
├── bin/
│   └── stackwise.js          # CLI entry point (#!/usr/bin/env node)
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
├── knowledge/                # 4-layer knowledge system (105 files)
│   ├── layer-1-universal/    # 19 files - all TypeScript projects
│   ├── layer-2-domain/       # Domain-specific
│   │   ├── frontend/         # 10 files
│   │   └── backend/          # 14 files
│   ├── layer-3-framework/    # Framework-specific
│   │   ├── frontend/         # 7 files (nextjs, react-spa, vue, nuxt, angular, remix, tanstack-start)
│   │   └── backend/          # 5 files (nestjs, express, fastify, hono, koa)
│   └── layer-4-tool/         # 50 files across 26 categories
│       ├── orm/              # prisma, drizzle, mongoose, sequelize, typeorm, knex, mikro-orm
│       ├── validation/       # zod, class-validator
│       ├── state/            # tanstack-query, tanstack-store, zustand
│       ├── testing/          # vitest, jest, playwright
│       ├── queue/            # bullmq
│       ├── forms/            # react-hook-form, tanstack-form
│       ├── styling/          # tailwind
│       ├── ui/               # shadcn-ui, storybook
│       ├── routing/          # tanstack-router
│       ├── rpc/              # trpc
│       ├── animation/        # framer-motion (motion)
│       ├── table/            # tanstack-table
│       ├── devtools/         # tanstack-devtools
│       ├── graphql/          # apollo-server, apollo-client
│       ├── auth/             # better-auth, next-auth, nestjs-passport, passport
│       ├── realtime/         # socket-io, ws
│       ├── logging/          # winston, pino
│       ├── http-client/      # axios, ky
│       ├── i18n/             # i18next, next-intl
│       ├── date/             # dayjs, date-fns, luxon
│       ├── email/            # nodemailer, nestjs-mailer
│       ├── upload/           # multer
│       ├── api-docs/         # nestjs-swagger
│       ├── rate-limiting/    # nestjs-throttler
│       ├── cache/            # nestjs-cache-manager
│       └── config/           # nestjs-config
├── lib/
│   └── registry.json         # Knowledge file registry with metadata
├── skills/                   # 8 slash command definitions
│   ├── sw-plan/              # PM workflow skills
│   ├── sw-tasks/
│   ├── sw-work/
│   ├── sw-ship/
│   ├── sw-standup/
│   ├── sw-review/
│   ├── sw-generate-knowledge/ # Utility skills
│   └── sw-sync-project/
├── agents/                   # Specialized agent definitions
│   ├── backend-dev/          # Backend developer
│   ├── frontend-dev/         # Frontend developer
│   ├── qa/                   # QA engineer
│   ├── code-reviewer/        # Code reviewer
│   └── security-auditor/     # Security auditor
├── hooks/                    # Hook scripts
├── settings/                 # Settings templates (base, frontend, backend, fullstack)
└── templates/                # CLAUDE.md templates (flat .md files)
```

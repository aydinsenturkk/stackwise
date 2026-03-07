# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-15

### Added

- Interactive CLI with 8-step guided setup flow
- 4-layer knowledge system with 86 rules:
  - Layer 1: 16 universal rules (architecture, TypeScript, testing, security, PM workflow, etc.)
  - Layer 2: 22 domain rules (10 frontend + 12 backend)
  - Layer 3: 3 framework rules (Next.js, React SPA, NestJS)
  - Layer 4: 45 tool-specific rules (ORM, validation, state, forms, auth, GraphQL, logging, etc.)
- Auto-detection for 30+ tools and libraries across 28 categories
- 17 skills (slash commands):
  - 10 development: review, fix-issue, new-feature, add-tests, api-endpoint, component, debug, optimize, pr, migrate
  - 5 PM workflow: plan, tasks, work, ship, standup
  - 2 utility: generate-knowledge, sync-project
- 4 specialized agents: code-reviewer, test-writer, security-auditor, refactorer
- 2 hooks: format-on-save, protect-env
- PM workflow with spec-driven development:
  - PRD generation from ideas
  - Epic and task decomposition with GitHub Issues
  - `--auto` flag for fully automated epic execution
  - Integration branch support for epic-scoped PRs
  - Standup report generation across all epics
- Development workflow configuration:
  - Commit conventions (Conventional, Angular, Gitmoji, Custom)
  - Branch strategies (GitHub Flow, Gitflow, Trunk-based)
  - Release strategies (SemVer, CalVer, None)
  - PR merge strategies (Squash, Merge, Rebase)
- Monorepo support with workspace detection (pnpm, Turborepo, Nx, Lerna)
- CLAUDE.md auto-generation with stack and workflow info
- Settings presets (base, frontend, backend, fullstack)
- Profile persistence via `.claude/profile.json` for re-runs
- YAML frontmatter composition with glob patterns per knowledge file
- CLAUDE.md template system with 4 stack presets (Next.js, React+NestJS, React SPA, Generic)

[1.0.0]: https://github.com/aydinsenturkk/stackwise/releases/tag/v1.0.0

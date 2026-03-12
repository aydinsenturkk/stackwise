import { readFileSync, writeFileSync, copyFileSync, chmodSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, copyDirRecursive, fileExists, getPackageRoot } from './utils.js';
import { getFileMetadata } from './registry.js';

const AUTO_START = '<!-- STACKWISE:AUTO:START -->';
const AUTO_END = '<!-- STACKWISE:AUTO:END -->';

function getOutputPrefix(layer, domain) {
  switch (layer) {
    case 1: return '01-universal';
    case 2:
      if (domain === 'frontend') return '02-frontend';
      if (domain === 'backend') return '02-backend';
      return '02-shared';
    case 3: return '03-framework';
    case 4: return '04-tool';
    default: return '99-other';
  }
}

function getPathsForStrategy(strategy, paths) {
  switch (strategy) {
    case 'frontend': return paths.frontend || '';
    case 'backend': return paths.backend || '';
    case 'all': {
      const parts = [paths.frontend, paths.backend, paths.shared].filter(Boolean);
      return parts.join(', ');
    }
    default: {
      const allParts = [paths.frontend, paths.backend, paths.shared].filter(Boolean);
      return allParts.join(', ');
    }
  }
}

function buildFrontmatter(pathsString) {
  if (!pathsString) return '';

  const lines = ['---'];

  lines.push('paths:');
  const parts = pathsString.split(',').map((p) => p.trim());
  for (const part of parts) {
    lines.push(`  - ${part}`);
  }

  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

function composeWorkflowRule(workflow) {
  const sections = ['# Development Workflow\n'];

  // Commit Convention
  switch (workflow.commit_convention) {
    case 'conventional':
      sections.push(`## Commit Convention: Conventional Commits

Format: \`<type>(<scope>): <description>\`

Types:
- \`feat\` — New feature (MINOR version bump)
- \`fix\` — Bug fix (PATCH version bump)
- \`docs\` — Documentation changes
- \`refactor\` — Code refactoring (no behavior change)
- \`test\` — Adding or fixing tests
- \`chore\` — Build, CI, tooling
- \`ci\` — CI pipeline changes
- \`perf\` — Performance improvement

Rules:
- Scope is optional but encouraged
- Description must be lowercase, imperative mood
- Breaking change: add \`BREAKING CHANGE:\` in body or \`!\` after type
- Max 72 characters for subject line
`);
      break;
    case 'angular':
      sections.push(`## Commit Convention: Angular

Format: \`<type>(<scope>): <subject>\`

Types:
- \`feat\` — New feature
- \`fix\` — Bug fix
- \`docs\` — Documentation
- \`style\` — Formatting (no code change)
- \`refactor\` — Refactoring
- \`test\` — Tests
- \`chore\` — Maintenance
- \`perf\` — Performance
- \`ci\` — CI changes
- \`build\` — Build system

Rules:
- Scope is REQUIRED
- Subject must be lowercase, imperative mood
- Body explains "why", not "what"
- Footer contains breaking changes and issue references
`);
      break;
    case 'gitmoji':
      sections.push(`## Commit Convention: Gitmoji

Format: \`<emoji> <description>\`

Common emojis:
- ✨ \`:sparkles:\` — New feature
- 🐛 \`:bug:\` — Bug fix
- ♻️ \`:recycle:\` — Refactor
- 📝 \`:memo:\` — Documentation
- ✅ \`:white_check_mark:\` — Tests
- 🔧 \`:wrench:\` — Configuration
- 🚀 \`:rocket:\` — Deploy
- 🔥 \`:fire:\` — Remove code/files
- 💄 \`:lipstick:\` — UI/style changes
- 🏗️ \`:building_construction:\` — Architecture changes

Rules:
- One emoji per commit
- Description in imperative mood
- Use gitmoji.dev for full reference
`);
      break;
    case 'custom':
      sections.push(`## Commit Convention: Custom

Pattern: \`${workflow.custom_commit_pattern || '<custom pattern>'}\`

Rules:
- Follow the team-defined commit pattern above
- Keep messages concise and descriptive
- Reference issue numbers when applicable
`);
      break;
  }

  // Branch Strategy
  switch (workflow.branch_strategy) {
    case 'github-flow':
      sections.push(`## Branch Strategy: GitHub Flow

Branches:
- \`main\` — Always deployable, production-ready
- \`feature/<name>\` — New feature
- \`fix/<name>\` — Bug fix
- \`chore/<name>\` — Maintenance task

Rules:
- Never push directly to main
- Every change comes through a PR
- Branch from main, merge back to main
- Delete branch after PR merge
- Keep branches short-lived
`);
      break;
    case 'gitflow':
      sections.push(`## Branch Strategy: Gitflow

Branches:
- \`main\` — Production releases only
- \`develop\` — Integration branch
- \`feature/<name>\` — New feature (from develop)
- \`release/<version>\` — Release preparation (from develop)
- \`hotfix/<name>\` — Production fix (from main)

Rules:
- Features branch from and merge to develop
- Releases branch from develop, merge to both main and develop
- Hotfixes branch from main, merge to both main and develop
- Tag main with version number on release
- Never push directly to main or develop
`);
      break;
    case 'trunk-based':
      sections.push(`## Branch Strategy: Trunk-Based Development

Branches:
- \`main\` — Single source of truth
- Short-lived feature branches (max 1-2 days)

Rules:
- Keep branches extremely short-lived
- Merge to main at least daily
- Use feature flags for incomplete features
- Every commit to main must be deployable
- Prefer small, incremental changes
`);
      break;
  }

  // Integration Branches
  if (workflow.integration_branch) {
    sections.push(`## Integration Branches

When an epic is planned, a long-lived integration branch is created:
- Integration branch: \`feat/<epic-slug>\`
- Task branches: \`<epic-slug>/<issue-number>-<description>\`
- Task PRs target the integration branch (not main)
- Final merge: integration branch → main when epic is complete

Use this when \`feat/*\` PRs trigger deployments (e.g., preview containers).
Task PRs to the integration branch avoid triggering deployments until the epic is ready.

Workflow:
- \`/sw-plan\` creates the integration branch when planning an epic
- \`/sw-work\` branches from the integration branch
- \`/sw-ship\` targets the integration branch for task PRs
- \`/sw-ship --final\` merges the integration branch to main
`);
  }

  // Release Strategy
  switch (workflow.release_strategy) {
    case 'semver':
      sections.push(`## Release Strategy: Semantic Versioning

Format: \`vMAJOR.MINOR.PATCH\`

Version bumps:
- MAJOR — Breaking changes (incompatible API changes)
- MINOR — New features (backwards-compatible)
- PATCH — Bug fixes (backwards-compatible)

Rules:
- \`feat\` commit → MINOR bump
- \`fix\` commit → PATCH bump
- \`BREAKING CHANGE\` → MAJOR bump
- Pre-release: \`v1.0.0-beta.1\`
- Tag every release on main
`);
      break;
    case 'calver':
      sections.push(`## Release Strategy: Calendar Versioning

Format: \`vYYYY.MM.DD\`

Rules:
- Version reflects release date
- Multiple releases per day: \`vYYYY.MM.DD.N\` (N = sequential number)
- Tag every release on main
- No distinction between breaking/non-breaking in version number
`);
      break;
    case 'none':
      sections.push(`## Release Strategy: None

No formal release versioning. Releases are managed manually or not applicable.
`);
      break;
  }

  // Changelog
  switch (workflow.changelog) {
    case 'auto':
      sections.push(`## Changelog: Auto-Generated

Rules:
- CHANGELOG.md is auto-generated from commit messages
- Group entries by type (Features, Bug Fixes, Breaking Changes)
- Include commit references and PR links
- Do NOT manually edit CHANGELOG.md
`);
      break;
    case 'manual':
      sections.push(`## Changelog: Manual

Rules:
- Maintain CHANGELOG.md by hand
- Follow Keep a Changelog format (keepachangelog.com)
- Sections: Added, Changed, Deprecated, Removed, Fixed, Security
- Update changelog in the same PR as the code change
`);
      break;
    case 'none':
      sections.push(`## Changelog: None

No changelog is maintained for this project.
`);
      break;
  }

  // PR Merge Strategy
  switch (workflow.pr_merge) {
    case 'squash':
      sections.push(`## PR Merge Strategy: Squash and Merge

Rules:
- All PR commits are squashed into a single commit
- PR title becomes the commit message — make it descriptive
- Follow commit convention in the PR title
- Detailed description goes in the PR body
- Clean commit history on main
`);
      break;
    case 'merge':
      sections.push(`## PR Merge Strategy: Merge Commit

Rules:
- All PR commits are preserved with a merge commit
- Individual commit messages must follow commit convention
- Keep commits atomic and meaningful
- Avoid "fix typo" or "wip" commits — squash locally before PR
`);
      break;
    case 'rebase':
      sections.push(`## PR Merge Strategy: Rebase and Merge

Rules:
- PR commits are rebased onto main (linear history)
- Each commit must follow commit convention
- Each commit must be independently buildable
- Keep commits atomic and meaningful
- Rebase onto latest main before merge
`);
      break;
  }

  return sections.join('\n');
}

// --- CLAUDE.md auto-generation ---

const COMMIT_LABELS = {
  conventional: 'Conventional Commits — `feat:`, `fix:`, `chore:`, ...',
  angular: 'Angular — `type(scope): subject`',
  gitmoji: 'Gitmoji — emoji prefix',
  custom: 'Custom pattern',
};

const BRANCH_LABELS = {
  'github-flow': 'GitHub Flow — `main` + `feature/*`, `fix/*`',
  gitflow: 'Gitflow — `main`, `develop`, `feature/*`, `release/*`, `hotfix/*`',
  'trunk-based': 'Trunk-based — `main` + short-lived branches',
};

const RELEASE_LABELS = {
  semver: 'Semantic Versioning — `vMAJOR.MINOR.PATCH`',
  calver: 'Calendar Versioning — `vYYYY.MM.DD`',
  none: 'None',
};

const PR_MERGE_LABELS = {
  squash: 'Squash and merge',
  merge: 'Merge commit',
  rebase: 'Rebase and merge',
};

export function generateClaudeMdAuto(stack, workflow, projectDir) {
  // Read package.json for project name and scripts
  let projectName = 'project';
  let scripts = {};
  const pkgPath = join(projectDir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      projectName = pkg.name || 'project';
      scripts = pkg.scripts || {};
    } catch {
      // ignore parse errors
    }
  }

  const lines = [AUTO_START, '', `# ${projectName}`, '', '## Stack'];

  // Language
  if (stack.language) {
    lines.push(`- **Language:** ${stack.language}`);
  }
  if (stack.package_manager) {
    lines.push(`- **Package manager:** ${stack.package_manager}`);
  }

  // Frameworks
  if (stack.frontend_frameworks.length) {
    lines.push(`- **Frontend:** ${stack.frontend_frameworks.join(', ')}`);
  }
  if (stack.backend_frameworks.length) {
    lines.push(`- **Backend:** ${stack.backend_frameworks.join(', ')}`);
  }

  // Tools — collect non-empty categories
  const toolCategories = [
    ['ORM', stack.orm],
    ['State', stack.state_management],
    ['Validation', stack.validation],
    ['Testing', stack.testing],
    ['Styling', stack.styling],
    ['UI', stack.ui],
    ['Forms', stack.forms],
    ['Routing', stack.routing],
    ['Animation', stack.animation],
    ['Table', stack.table],
    ['Queue', stack.queue],
    ['Auth', stack.auth],
    ['Cache', stack.cache],
    ['Config', stack.config],
    ['API Docs', stack.api_docs],
    ['GraphQL', stack.graphql],
    ['Realtime', stack.realtime],
    ['Logging', stack.logging],
    ['HTTP Client', stack.http_client],
    ['i18n', stack.i18n],
    ['Date', stack.date_utils],
    ['Email', stack.email],
    ['Upload', stack.upload],
    ['DevTools', stack.devtools],
  ];

  for (const [label, values] of toolCategories) {
    if (values && values.length) {
      lines.push(`- **${label}:** ${values.join(', ')}`);
    }
  }

  if (stack.monorepo) {
    lines.push(`- **Monorepo:** ${stack.monorepo_tool || 'Yes'}`);
  }

  // Commands from package.json scripts
  const scriptEntries = Object.entries(scripts);
  if (scriptEntries.length) {
    lines.push('', '## Commands', '', '```bash');
    // Common scripts first, then the rest
    const priority = ['dev', 'start', 'build', 'test', 'lint', 'format', 'typecheck', 'check'];
    const sorted = [...scriptEntries].sort((a, b) => {
      const ai = priority.indexOf(a[0]);
      const bi = priority.indexOf(b[0]);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a[0].localeCompare(b[0]);
    });
    const pm = stack.package_manager || 'npm';
    const run = pm === 'npm' ? 'npm run' : pm;
    for (const [name, cmd] of sorted) {
      const padded = `${run} ${name}`.padEnd(24);
      lines.push(`${padded} # ${cmd}`);
    }
    lines.push('```');
  }

  // Workflow summary
  if (workflow && Object.keys(workflow).length) {
    lines.push('', '## Workflow');
    if (workflow.commit_convention) {
      const label = workflow.commit_convention === 'custom' && workflow.custom_commit_pattern
        ? `Custom — \`${workflow.custom_commit_pattern}\``
        : COMMIT_LABELS[workflow.commit_convention] || workflow.commit_convention;
      lines.push(`- **Commits:** ${label}`);
    }
    if (workflow.branch_strategy) {
      lines.push(`- **Branches:** ${BRANCH_LABELS[workflow.branch_strategy] || workflow.branch_strategy}`);
    }
    if (workflow.integration_branch) {
      lines.push(`- **Integration branches:** Enabled — epic tasks PR to \`feat/<epic-slug>\``);
    }
    if (workflow.release_strategy) {
      lines.push(`- **Releases:** ${RELEASE_LABELS[workflow.release_strategy] || workflow.release_strategy}`);
    }
    if (workflow.pr_merge) {
      lines.push(`- **PR merge:** ${PR_MERGE_LABELS[workflow.pr_merge] || workflow.pr_merge}`);
    }
    lines.push('');
    lines.push('> **Principle:** When the agent knows the project\'s conventions (branch strategy, commit convention, PR workflow), it must guide the user through the correct flow. Short or ambiguous instructions should not be interpreted as permission to skip the workflow — they should be interpreted according to the project\'s rules.');
  }

  lines.push(AUTO_END);

  return lines.join('\n');
}

export function writeClaudeMd(projectDir, autoContent) {
  const claudeMdPath = join(projectDir, 'CLAUDE.md');

  if (!existsSync(claudeMdPath)) {
    // New file: auto content + empty user section
    const content = autoContent + '\n\n<!-- Add project-specific notes below this line -->\n';
    writeFileSync(claudeMdPath, content, 'utf-8');
    return 'created';
  }

  const existing = readFileSync(claudeMdPath, 'utf-8');

  const startIdx = existing.indexOf(AUTO_START);
  const endIdx = existing.indexOf(AUTO_END);

  if (startIdx !== -1 && endIdx !== -1) {
    const before = existing.substring(0, startIdx);
    const after = existing.substring(endIdx + AUTO_END.length);
    writeFileSync(claudeMdPath, before + autoContent + after, 'utf-8');
    return 'updated';
  }

  // No markers found — prepend auto content, preserve existing
  const content = autoContent + '\n\n' + existing;
  writeFileSync(claudeMdPath, content, 'utf-8');
  return 'migrated';
}

export function compose(config, packageRoot) {
  const targetDir = config.targetDir;
  const rulesDir = join(targetDir, 'rules');
  const skillsDir = join(targetDir, 'skills');
  const agentsDir = join(targetDir, 'agents');
  const hooksDir = join(targetDir, 'hooks');

  ensureDir(rulesDir);
  ensureDir(skillsDir);
  ensureDir(agentsDir);
  ensureDir(hooksDir);

  const counts = { rules: 0, skills: 0, agents: 0, hooks: 0, skipped: 0 };

  // --- Install knowledge files as rules with frontmatter ---
  for (const filePath of config.knowledge_files) {
    const meta = getFileMetadata(filePath);
    if (!meta) {
      console.warn(`Warning: File not found in registry, skipping: ${filePath}`);
      counts.skipped++;
      continue;
    }

    const sourceFile = join(packageRoot, filePath);
    if (!fileExists(sourceFile)) {
      console.warn(`Warning: Source file missing, skipping: ${sourceFile}`);
      counts.skipped++;
      continue;
    }

    const prefix = getOutputPrefix(meta.layer, meta.domain);
    const outputFile = join(rulesDir, `${prefix}-${meta.name}.md`);

    const pathsString = getPathsForStrategy(meta.glob_strategy || 'all', config.paths || {});
    const frontmatter = buildFrontmatter(pathsString);
    const content = readFileSync(sourceFile, 'utf-8');

    writeFileSync(outputFile, frontmatter + content, 'utf-8');
    counts.rules++;
  }

  // --- Generate workflow rule ---
  if (config.workflow) {
    const workflowContent = composeWorkflowRule(config.workflow);
    const frontmatter = buildFrontmatter('**/*');
    writeFileSync(
      join(rulesDir, '01-universal-development-workflow.md'),
      frontmatter + workflowContent,
      'utf-8'
    );
    counts.rules++;
  }

  // --- Copy skills ---
  for (const skillName of config.skills || []) {
    const skillSource = join(packageRoot, 'skills', skillName);
    if (fileExists(skillSource)) {
      try {
        const skillDest = join(skillsDir, skillName);
        copyDirRecursive(skillSource, skillDest);
        counts.skills++;
      } catch (err) {
        console.warn(`Warning: Failed to copy skill "${skillName}": ${err.message}`);
        counts.skipped++;
      }
    } else {
      console.warn(`Warning: Skill not found, skipping: ${skillName}`);
      counts.skipped++;
    }
  }

  // --- Copy agents ---
  for (const agentName of config.agents || []) {
    const agentSource = join(packageRoot, 'agents', agentName);
    if (fileExists(agentSource)) {
      try {
        const agentDest = join(agentsDir, agentName);
        copyDirRecursive(agentSource, agentDest);
        counts.agents++;
      } catch (err) {
        console.warn(`Warning: Failed to copy agent "${agentName}": ${err.message}`);
        counts.skipped++;
      }
    } else {
      console.warn(`Warning: Agent not found, skipping: ${agentName}`);
      counts.skipped++;
    }
  }

  // --- Copy hooks ---
  for (const hookName of config.hooks || []) {
    const hookSource = join(packageRoot, 'hooks', hookName);
    if (fileExists(hookSource)) {
      const hookDest = join(hooksDir, hookName);
      copyFileSync(hookSource, hookDest);
      chmodSync(hookDest, 0o755);
      counts.hooks++;
    } else {
      console.warn(`Warning: Hook not found, skipping: ${hookName}`);
      counts.skipped++;
    }
  }

  return counts;
}

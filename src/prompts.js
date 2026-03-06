import { select, checkbox, input, confirm } from '@inquirer/prompts';
import { SKILLS, AGENTS, HOOKS, FRONTEND_SKILLS, BACKEND_SKILLS } from './constants.js';

export async function promptExistingProfile() {
  return await select({
    message: 'A profile already exists. What would you like to do?',
    choices: [
      { name: 'Update with current settings as defaults', value: 'update' },
      { name: 'Start fresh', value: 'fresh' },
    ],
  });
}

export async function promptStackConfirmation(detected) {
  console.log('\n  Detected stack:');
  if (detected.language) console.log(`    Language:      ${detected.language}`);
  if (detected.package_manager) console.log(`    Package mgr:   ${detected.package_manager}`);
  console.log(`    Monorepo:      ${detected.monorepo ? `Yes (${detected.monorepo_tool})` : 'No'}`);
  if (detected.frontend_frameworks.length) console.log(`    Frontend:      ${detected.frontend_frameworks.join(', ')}`);
  if (detected.backend_frameworks.length) console.log(`    Backend:       ${detected.backend_frameworks.join(', ')}`);
  if (detected.orm.length) console.log(`    ORM:           ${detected.orm.join(', ')}`);
  if (detected.state_management.length) console.log(`    State:         ${detected.state_management.join(', ')}`);
  if (detected.validation.length) console.log(`    Validation:    ${detected.validation.join(', ')}`);
  if (detected.testing.length) console.log(`    Testing:       ${detected.testing.join(', ')}`);
  if (detected.styling.length) console.log(`    Styling:       ${detected.styling.join(', ')}`);
  if (detected.queue.length) console.log(`    Queue:         ${detected.queue.join(', ')}`);
  if (detected.forms.length) console.log(`    Forms:         ${detected.forms.join(', ')}`);
  if (detected.ui.length) console.log(`    UI:            ${detected.ui.join(', ')}`);
  if (detected.routing.length) console.log(`    Routing:       ${detected.routing.join(', ')}`);
  if (detected.animation.length) console.log(`    Animation:     ${detected.animation.join(', ')}`);
  if (detected.table.length) console.log(`    Table:         ${detected.table.join(', ')}`);
  if (detected.devtools.length) console.log(`    DevTools:      ${detected.devtools.join(', ')}`);
  if (detected.api_docs.length) console.log(`    API Docs:      ${detected.api_docs.join(', ')}`);
  if (detected.class_validation.length) console.log(`    Validation(cls):${detected.class_validation.join(', ')}`);
  if (detected.rate_limiting.length) console.log(`    Rate Limit:    ${detected.rate_limiting.join(', ')}`);
  if (detected.auth.length) console.log(`    Auth:          ${detected.auth.join(', ')}`);
  if (detected.cache.length) console.log(`    Cache:         ${detected.cache.join(', ')}`);
  if (detected.config.length) console.log(`    Config:        ${detected.config.join(', ')}`);
  if (detected.graphql.length) console.log(`    GraphQL:       ${detected.graphql.join(', ')}`);
  if (detected.realtime.length) console.log(`    Realtime:      ${detected.realtime.join(', ')}`);
  if (detected.logging.length) console.log(`    Logging:       ${detected.logging.join(', ')}`);
  if (detected.http_client.length) console.log(`    HTTP Client:   ${detected.http_client.join(', ')}`);
  if (detected.i18n.length) console.log(`    i18n:          ${detected.i18n.join(', ')}`);
  if (detected.date_utils.length) console.log(`    Date:          ${detected.date_utils.join(', ')}`);
  if (detected.email.length) console.log(`    Email:         ${detected.email.join(', ')}`);
  if (detected.upload.length) console.log(`    Upload:        ${detected.upload.join(', ')}`);
  if (detected.workspaces?.length) {
    console.log('    Workspaces:');
    for (const ws of detected.workspaces) {
      const fwInfo = ws.frameworks.length ? ` (${ws.frameworks.join(', ')})` : '';
      console.log(`      ${ws.dir} → ${ws.type}${fwInfo}`);
    }
  }
  console.log('');

  const isCorrect = await confirm({
    message: 'Is this detection correct?',
    default: true,
  });

  if (isCorrect) return detected;

  // Let user override each category
  const stack = { ...detected };

  stack.frontend_frameworks = await promptCommaSeparated(
    'Frontend frameworks (comma-separated, or empty):',
    detected.frontend_frameworks.join(', ')
  );

  stack.backend_frameworks = await promptCommaSeparated(
    'Backend frameworks (comma-separated, or empty):',
    detected.backend_frameworks.join(', ')
  );

  stack.orm = await promptCommaSeparated('ORM (comma-separated, or empty):', detected.orm.join(', '));
  stack.state_management = await promptCommaSeparated('State management (comma-separated, or empty):', detected.state_management.join(', '));
  stack.validation = await promptCommaSeparated('Validation (comma-separated, or empty):', detected.validation.join(', '));
  stack.testing = await promptCommaSeparated('Testing (comma-separated, or empty):', detected.testing.join(', '));
  stack.styling = await promptCommaSeparated('Styling (comma-separated, or empty):', detected.styling.join(', '));
  stack.queue = await promptCommaSeparated('Queue (comma-separated, or empty):', detected.queue.join(', '));
  stack.forms = await promptCommaSeparated('Forms (comma-separated, or empty):', detected.forms.join(', '));
  stack.ui = await promptCommaSeparated('UI components (comma-separated, or empty):', detected.ui.join(', '));
  stack.routing = await promptCommaSeparated('Routing (comma-separated, or empty):', detected.routing.join(', '));
  stack.animation = await promptCommaSeparated('Animation (comma-separated, or empty):', detected.animation.join(', '));
  stack.table = await promptCommaSeparated('Table (comma-separated, or empty):', detected.table.join(', '));
  stack.devtools = await promptCommaSeparated('DevTools (comma-separated, or empty):', detected.devtools.join(', '));
  stack.api_docs = await promptCommaSeparated('API Docs (comma-separated, or empty):', detected.api_docs.join(', '));
  stack.class_validation = await promptCommaSeparated('Class Validation (comma-separated, or empty):', detected.class_validation.join(', '));
  stack.rate_limiting = await promptCommaSeparated('Rate Limiting (comma-separated, or empty):', detected.rate_limiting.join(', '));
  stack.auth = await promptCommaSeparated('Auth (comma-separated, or empty):', detected.auth.join(', '));
  stack.cache = await promptCommaSeparated('Cache (comma-separated, or empty):', detected.cache.join(', '));
  stack.config = await promptCommaSeparated('Config (comma-separated, or empty):', detected.config.join(', '));
  stack.graphql = await promptCommaSeparated('GraphQL (comma-separated, or empty):', detected.graphql.join(', '));
  stack.realtime = await promptCommaSeparated('Realtime (comma-separated, or empty):', detected.realtime.join(', '));
  stack.logging = await promptCommaSeparated('Logging (comma-separated, or empty):', detected.logging.join(', '));
  stack.http_client = await promptCommaSeparated('HTTP Client (comma-separated, or empty):', detected.http_client.join(', '));
  stack.i18n = await promptCommaSeparated('i18n (comma-separated, or empty):', detected.i18n.join(', '));
  stack.date_utils = await promptCommaSeparated('Date utils (comma-separated, or empty):', detected.date_utils.join(', '));
  stack.email = await promptCommaSeparated('Email (comma-separated, or empty):', detected.email.join(', '));
  stack.upload = await promptCommaSeparated('Upload (comma-separated, or empty):', detected.upload.join(', '));

  return stack;
}

async function promptCommaSeparated(message, defaultValue) {
  const answer = await input({ message, default: defaultValue });
  if (!answer.trim()) return [];
  return answer.split(',').map((s) => s.trim()).filter(Boolean);
}

export async function promptPathPatterns(stack) {
  const isMonorepo = stack.monorepo;
  const hasNextjs = stack.frontend_frameworks.includes('nextjs');
  const hasFrontend = stack.frontend_frameworks.length > 0;
  const hasBackend = stack.backend_frameworks.length > 0;
  const workspaces = stack.workspaces || [];

  let defaultFrontend = '';
  let defaultBackend = '';
  let defaultShared = '';
  let needsShared = false;

  if (isMonorepo) {
    const frontendDirs = workspaces
      .filter(ws => ws.type === 'frontend' || ws.type === 'fullstack')
      .map(ws => ws.dir);
    const backendDirs = workspaces
      .filter(ws => ws.type === 'backend' || ws.type === 'fullstack')
      .map(ws => ws.dir);
    const sharedDirs = workspaces
      .filter(ws => ws.type === 'shared')
      .map(ws => ws.dir);

    defaultFrontend = frontendDirs.map(d => `${d}/**/*.{ts,tsx}`).join(', ');
    defaultBackend = backendDirs.map(d => `${d}/**/*.ts`).join(', ');

    if (sharedDirs.length > 0) {
      needsShared = true;
      const parentDirs = [...new Set(sharedDirs.map(d => d.split('/')[0]))];
      defaultShared = parentDirs.map(d => `${d}/**/*.ts`).join(', ');
    }
  } else if (hasNextjs) {
    defaultFrontend = 'src/**/*.{ts,tsx}';
    defaultBackend = 'src/app/api/**/*.ts';
    needsShared = true;
    defaultShared = 'src/lib/**/*.ts';
  } else if (hasFrontend && hasBackend) {
    // Fullstack without monorepo — shared makes sense for common code
    defaultFrontend = 'src/**/*.{ts,tsx}';
    defaultBackend = 'src/**/*.ts';
    needsShared = true;
    defaultShared = 'src/shared/**/*.ts, src/common/**/*.ts';
  } else {
    // Single domain — no shared needed
    defaultFrontend = 'src/**/*.{ts,tsx}';
    defaultBackend = 'src/**/*.ts';
  }

  const paths = {};

  if (hasFrontend) {
    paths.frontend = await input({
      message: 'Frontend path pattern:',
      default: defaultFrontend,
    });
  }

  if (hasBackend) {
    paths.backend = await input({
      message: 'Backend path pattern:',
      default: defaultBackend,
    });
  }

  if (needsShared) {
    paths.shared = await input({
      message: 'Shared/common path pattern:',
      default: defaultShared,
    });
  }

  return paths;
}

export async function promptSkillSelection(stack) {
  const hasFrontend = stack.frontend_frameworks.length > 0;
  const hasBackend = stack.backend_frameworks.length > 0;

  const availableSkills = SKILLS.filter((s) => {
    if (FRONTEND_SKILLS.includes(s.name) && !hasFrontend) return false;
    if (BACKEND_SKILLS.includes(s.name) && !hasBackend) return false;
    return true;
  });

  const selected = await checkbox({
    message: 'Which skills to install?',
    choices: availableSkills.map((s) => ({
      name: `/${s.name} - ${s.description}`,
      value: s.name,
      checked: true,
    })),
  });

  return selected;
}

export async function promptAgentSelection() {
  const selected = await checkbox({
    message: 'Which agents to install?',
    choices: AGENTS.map((a) => ({
      name: `${a.name} - ${a.description}`,
      value: a.name,
      checked: true,
    })),
  });

  return selected;
}

export async function promptHookSelection() {
  const selected = await checkbox({
    message: 'Which hooks to install?',
    choices: HOOKS.map((h) => ({
      name: `${h.name} - ${h.description}`,
      value: h.name,
      checked: true,
    })),
  });

  return selected;
}

export async function promptWorkflow(defaults = {}) {
  const commit_convention = await select({
    message: 'Commit convention:',
    choices: [
      { name: 'Conventional Commits (feat:, fix:, chore:, ...)', value: 'conventional' },
      { name: 'Angular (type(scope): subject — scope required)', value: 'angular' },
      { name: 'Gitmoji (emoji prefix: ✨ feat, 🐛 fix, ...)', value: 'gitmoji' },
      { name: 'Custom pattern', value: 'custom' },
    ],
    default: defaults.commit_convention || 'conventional',
  });

  let custom_commit_pattern = defaults.custom_commit_pattern || '';
  if (commit_convention === 'custom') {
    custom_commit_pattern = await input({
      message: 'Custom commit pattern (e.g. "[PROJ-123] description"):',
      default: custom_commit_pattern,
    });
  }

  const branch_strategy = await select({
    message: 'Branch strategy:',
    choices: [
      { name: 'GitHub Flow (main + feature/*, fix/*, chore/*)', value: 'github-flow' },
      { name: 'Gitflow (main, develop, feature/*, release/*, hotfix/*)', value: 'gitflow' },
      { name: 'Trunk-based (main + short-lived branches)', value: 'trunk-based' },
    ],
    default: defaults.branch_strategy || 'github-flow',
  });

  let integration_branch = defaults.integration_branch || false;
  if (branch_strategy === 'github-flow' || branch_strategy === 'trunk-based') {
    integration_branch = await confirm({
      message: 'Use integration branches for epics? (task PRs target feat/<epic> instead of main)',
      default: defaults.integration_branch || false,
    });
  }

  const release_strategy = await select({
    message: 'Release strategy:',
    choices: [
      { name: 'Semantic Versioning (vMAJOR.MINOR.PATCH)', value: 'semver' },
      { name: 'Calendar Versioning (vYYYY.MM.DD)', value: 'calver' },
      { name: 'None (manual / no releases)', value: 'none' },
    ],
    default: defaults.release_strategy || 'semver',
  });

  const changelog = await select({
    message: 'Changelog:',
    choices: [
      { name: 'Auto-generate from commits', value: 'auto' },
      { name: 'Manual (CHANGELOG.md maintained by hand)', value: 'manual' },
      { name: 'None', value: 'none' },
    ],
    default: defaults.changelog || 'auto',
  });

  const pr_merge = await select({
    message: 'PR merge strategy:',
    choices: [
      { name: 'Squash and merge (single commit)', value: 'squash' },
      { name: 'Merge commit (history preserved)', value: 'merge' },
      { name: 'Rebase and merge (linear history)', value: 'rebase' },
    ],
    default: defaults.pr_merge || 'squash',
  });

  const result = { commit_convention, branch_strategy, integration_branch, release_strategy, changelog, pr_merge };
  if (commit_convention === 'custom') {
    result.custom_commit_pattern = custom_commit_pattern;
  }
  return result;
}

export async function promptSettingsMerge(presetName) {
  return await confirm({
    message: `Merge "${presetName}" settings preset into .claude/settings.json?`,
    default: true,
  });
}

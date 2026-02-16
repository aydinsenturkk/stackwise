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

  let defaultFrontend = '';
  let defaultBackend = '';
  let defaultShared = '';

  if (isMonorepo) {
    defaultFrontend = 'apps/web/**/*.{ts,tsx}';
    defaultBackend = 'apps/api/**/*.ts';
    defaultShared = 'packages/**/*.ts';
  } else if (hasNextjs) {
    defaultFrontend = 'src/**/*.{ts,tsx}';
    defaultBackend = 'src/app/api/**/*.ts';
    defaultShared = 'src/lib/**/*.ts';
  } else {
    defaultFrontend = 'src/**/*.{ts,tsx}';
    defaultBackend = 'src/**/*.ts';
    defaultShared = 'src/**/*.ts';
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

  paths.shared = await input({
    message: 'Shared/common path pattern:',
    default: defaultShared,
  });

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
      name: `${s.name} - ${s.description}`,
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

export async function promptSettingsMerge(presetName) {
  return await confirm({
    message: `Merge "${presetName}" settings preset into .claude/settings.json?`,
    default: true,
  });
}

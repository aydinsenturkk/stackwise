import { join } from 'node:path';
import { getPackageRoot, readJson, writeJson, ensureDir, fileExists } from './utils.js';
import { detect } from './detect.js';
import { resolveKnowledgeFiles, determineSettingsPreset, TOOL_MAP } from './profiles.js';
import { compose, generateClaudeMdAuto, writeClaudeMd } from './compose.js';
import { installSettings } from './settings.js';
import {
  promptExistingProfile,
  promptStackConfirmation,
  promptWorkflow,
  promptPathPatterns,
  promptSkillSelection,
  promptAgentSelection,
  promptHookSelection,
  promptSettingsMerge,
} from './prompts.js';

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

function banner() {
  console.log('');
  console.log(`${BOLD}${CYAN}╔══════════════════════════════════════════════╗${NC}`);
  console.log(`${BOLD}${CYAN}║          stackwise - Project Setup           ║${NC}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════╝${NC}`);
  console.log('');
}

function step(msg) {
  console.log(`\n${BOLD}${GREEN}▸ ${msg}${NC}`);
}

function info(msg) {
  console.log(`  ${DIM}${msg}${NC}`);
}

function success(msg) {
  console.log(`  ${GREEN}✓ ${msg}${NC}`);
}

function warn(msg) {
  console.log(`  ${YELLOW}⚠ ${msg}${NC}`);
}

export async function run() {
  const packageRoot = getPackageRoot();
  const projectDir = process.cwd();
  const claudeDir = join(projectDir, '.claude');
  const profilePath = join(claudeDir, 'profile.json');

  // --- Step 1: Banner ---
  banner();
  info(`Project: ${projectDir}`);

  // --- Step 2: Check existing profile ---
  let existingProfile = null;
  let useExisting = false;

  if (fileExists(profilePath)) {
    step('Existing profile found');
    existingProfile = readJson(profilePath);
    const action = await promptExistingProfile();
    useExisting = action === 'update';
  }

  // --- Step 3: Detect stack ---
  step('Detecting project stack...');
  const detected = detect(projectDir);

  // --- Step 4: Confirm stack with user ---
  step('Stack detection results');
  const stack = await promptStackConfirmation(
    useExisting ? { ...detected, ...existingProfile?.stack, workspaces: detected.workspaces } : detected
  );

  // --- Step 4b: Development workflow ---
  step('Development workflow');
  const defaultWorkflow = useExisting && existingProfile?.workflow ? existingProfile.workflow : {};
  const workflow = await promptWorkflow(defaultWorkflow);

  // --- Step 5: Configure path patterns ---
  step('Configure path patterns');
  const defaultPaths = useExisting && existingProfile?.paths ? existingProfile.paths : {};
  const paths = await promptPathPatterns({ ...stack, _defaults: defaultPaths });

  // --- Step 6: Resolve knowledge files ---
  step('Resolving knowledge files...');
  const knowledgeFiles = resolveKnowledgeFiles(stack);
  const filePaths = knowledgeFiles.map((f) => f.path);

  const layer1Count = knowledgeFiles.filter((f) => f.layer === 1).length;
  const layer2FrontendCount = knowledgeFiles.filter((f) => f.layer === 2 && f.domain === 'frontend').length;
  const layer2BackendCount = knowledgeFiles.filter((f) => f.layer === 2 && f.domain === 'backend').length;
  const layer3Count = knowledgeFiles.filter((f) => f.layer === 3).length;
  const layer4Count = knowledgeFiles.filter((f) => f.layer === 4).length;

  info(`Layer 1 (Universal):  ${layer1Count} rules`);
  if (layer2FrontendCount) info(`Layer 2 (Frontend):   ${layer2FrontendCount} rules`);
  if (layer2BackendCount) info(`Layer 2 (Backend):    ${layer2BackendCount} rules`);
  if (layer3Count) {
    const fwNames = knowledgeFiles.filter((f) => f.layer === 3).map((f) => f.name);
    info(`Layer 3 (Framework):  ${layer3Count} rules (${fwNames.join(', ')})`);
  }
  if (layer4Count) {
    const toolNames = knowledgeFiles.filter((f) => f.layer === 4).map((f) => f.name);
    info(`Layer 4 (Tool):       ${layer4Count} rules (${toolNames.join(', ')})`);
  }

  // --- Step 6b: Warn about tools without knowledge rules ---
  const allDetectedTools = [
    ...stack.orm, ...stack.state_management, ...stack.validation,
    ...stack.testing, ...stack.styling, ...stack.queue, ...stack.forms,
    ...stack.ui, ...stack.routing, ...stack.animation, ...stack.table,
    ...stack.devtools, ...stack.api_docs, ...stack.class_validation,
    ...stack.rate_limiting, ...stack.auth, ...stack.cache, ...stack.config,
    ...stack.graphql, ...stack.realtime, ...stack.logging,
    ...stack.http_client, ...stack.i18n, ...stack.date_utils,
    ...stack.email, ...stack.upload,
  ];
  const toolsWithoutKnowledge = [...new Set(allDetectedTools)].filter(t => !TOOL_MAP[t]);
  if (toolsWithoutKnowledge.length) {
    warn(`No knowledge rules for: ${toolsWithoutKnowledge.join(', ')}`);
    info('Run /generate-knowledge <tool> in Claude Code to generate rules.');
  }

  // --- Step 7: Select skills, agents, hooks ---
  step('Select components');
  const selectedSkills = await promptSkillSelection(stack);
  const selectedAgents = await promptAgentSelection();
  const selectedHooks = await promptHookSelection();

  // --- Step 8: Compose and install ---
  step('Installing to .claude/...');
  ensureDir(claudeDir);

  const config = {
    targetDir: claudeDir,
    knowledge_files: filePaths,
    paths,
    workflow,
    skills: selectedSkills,
    agents: selectedAgents,
    hooks: selectedHooks,
  };

  const counts = compose(config, packageRoot);

  // Write profile.json
  const profile = {
    version: '1.0',
    detected_at: new Date().toISOString(),
    stack,
    paths,
    workflow,
    knowledge_files: filePaths,
    skills: selectedSkills,
    agents: selectedAgents,
    hooks: selectedHooks,
  };
  writeJson(profilePath, profile);
  success('Profile saved to .claude/profile.json');

  // Settings merge
  const presetName = determineSettingsPreset(stack);
  const shouldMerge = await promptSettingsMerge(presetName);
  if (shouldMerge) {
    installSettings(claudeDir, presetName);
    success(`Settings merged with "${presetName}" preset`);
  }

  // CLAUDE.md (auto-generated section)
  const autoContent = generateClaudeMdAuto(stack, workflow, projectDir);
  const claudeMdResult = writeClaudeMd(projectDir, autoContent);
  switch (claudeMdResult) {
    case 'created':
      success('CLAUDE.md created with auto-generated project info');
      break;
    case 'updated':
      success('CLAUDE.md auto section updated, user notes preserved');
      break;
    case 'migrated':
      success('CLAUDE.md migrated — auto section prepended, existing content preserved');
      break;
  }

  // --- Summary ---
  console.log('');
  console.log(`${BOLD}${GREEN}╔══════════════════════════════════════════════╗${NC}`);
  console.log(`${BOLD}${GREEN}║        stackwise initialized!               ║${NC}`);
  console.log(`${BOLD}${GREEN}╚══════════════════════════════════════════════╝${NC}`);
  console.log('');
  console.log(`  ${BOLD}Rules:${NC}   ${counts.rules} knowledge files installed to .claude/rules/`);
  console.log(`  ${BOLD}Skills:${NC}  ${counts.skills} slash commands installed to .claude/skills/`);
  console.log(`  ${BOLD}Agents:${NC}  ${counts.agents} specialized agents installed to .claude/agents/`);
  console.log(`  ${BOLD}Hooks:${NC}   ${counts.hooks} hook scripts installed to .claude/hooks/`);
  console.log('');
  console.log(`  ${BOLD}Profile saved to${NC} .claude/profile.json`);
  console.log('');
  console.log(`  ${DIM}To re-run with different settings: npx stackwise${NC}`);
  console.log('');
}

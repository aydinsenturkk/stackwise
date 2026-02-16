import { readFileSync, writeFileSync, copyFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, copyDirRecursive, fileExists, getPackageRoot } from './utils.js';
import { getFileMetadata } from './registry.js';

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

  if (pathsString.includes(',')) {
    lines.push('paths:');
    const parts = pathsString.split(',').map((p) => p.trim());
    for (const part of parts) {
      lines.push(`  - ${part}`);
    }
  } else {
    lines.push(`paths: ${pathsString}`);
  }

  lines.push('---');
  lines.push('');
  return lines.join('\n');
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

  const counts = { rules: 0, skills: 0, agents: 0, hooks: 0 };

  // --- Install knowledge files as rules with frontmatter ---
  for (const filePath of config.knowledge_files) {
    const meta = getFileMetadata(filePath);
    if (!meta) {
      console.warn(`Warning: File not found in registry, skipping: ${filePath}`);
      continue;
    }

    const sourceFile = join(packageRoot, filePath);
    if (!fileExists(sourceFile)) {
      console.warn(`Warning: Source file missing, skipping: ${sourceFile}`);
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

  // --- Copy skills ---
  for (const skillName of config.skills || []) {
    const skillSource = join(packageRoot, 'skills', skillName);
    if (fileExists(skillSource)) {
      const skillDest = join(skillsDir, skillName);
      copyDirRecursive(skillSource, skillDest);
      counts.skills++;
    } else {
      console.warn(`Warning: Skill not found, skipping: ${skillName}`);
    }
  }

  // --- Copy agents ---
  for (const agentName of config.agents || []) {
    const agentSource = join(packageRoot, 'agents', agentName);
    if (fileExists(agentSource)) {
      const agentDest = join(agentsDir, agentName);
      copyDirRecursive(agentSource, agentDest);
      counts.agents++;
    } else {
      console.warn(`Warning: Agent not found, skipping: ${agentName}`);
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
    }
  }

  return counts;
}

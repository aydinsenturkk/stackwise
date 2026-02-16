import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DEPENDENCY_MAP } from './constants.js';
import { fileExists } from './utils.js';

function readPackageJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function hasDep(pkg, parsedPkgJson) {
  if (!parsedPkgJson) return false;
  return !!(
    parsedPkgJson.dependencies?.[pkg] ||
    parsedPkgJson.devDependencies?.[pkg] ||
    parsedPkgJson.peerDependencies?.[pkg]
  );
}

function detectPackageManager(projectDir) {
  if (fileExists(join(projectDir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fileExists(join(projectDir, 'yarn.lock'))) return 'yarn';
  if (fileExists(join(projectDir, 'bun.lockb')) || fileExists(join(projectDir, 'bun.lock'))) return 'bun';
  if (fileExists(join(projectDir, 'package-lock.json'))) return 'npm';
  return '';
}

function detectMonorepo(projectDir) {
  if (fileExists(join(projectDir, 'pnpm-workspace.yaml'))) {
    return { monorepo: true, monorepo_tool: 'pnpm-workspaces' };
  }
  if (fileExists(join(projectDir, 'lerna.json'))) {
    return { monorepo: true, monorepo_tool: 'lerna' };
  }
  if (fileExists(join(projectDir, 'turbo.json'))) {
    return { monorepo: true, monorepo_tool: 'turborepo' };
  }
  if (fileExists(join(projectDir, 'nx.json'))) {
    return { monorepo: true, monorepo_tool: 'nx' };
  }
  return { monorepo: false, monorepo_tool: '' };
}

function detectLanguage(projectDir) {
  if (fileExists(join(projectDir, 'package.json'))) return 'typescript';
  if (fileExists(join(projectDir, 'go.mod'))) return 'go';
  if (
    fileExists(join(projectDir, 'requirements.txt')) ||
    fileExists(join(projectDir, 'pyproject.toml')) ||
    fileExists(join(projectDir, 'setup.py'))
  ) return 'python';
  if (fileExists(join(projectDir, 'Cargo.toml'))) return 'rust';
  if (
    fileExists(join(projectDir, 'build.gradle')) ||
    fileExists(join(projectDir, 'build.gradle.kts')) ||
    fileExists(join(projectDir, 'pom.xml'))
  ) return 'java';
  return '';
}

function collectPackageJsonFiles(projectDir, isMonorepo) {
  const files = [];
  const rootPkg = join(projectDir, 'package.json');
  if (fileExists(rootPkg)) {
    files.push(rootPkg);
  }

  if (isMonorepo) {
    const workspaceDirs = ['apps', 'packages', 'services', 'libs', 'modules'];
    for (const wsDir of workspaceDirs) {
      const wsPath = join(projectDir, wsDir);
      try {
        const entries = readdirSync(wsPath);
        for (const entry of entries) {
          const entryPath = join(wsPath, entry);
          const pkgPath = join(entryPath, 'package.json');
          try {
            if (statSync(entryPath).isDirectory() && fileExists(pkgPath)) {
              files.push(pkgPath);
            }
          } catch {
            // skip inaccessible entries
          }
        }
      } catch {
        // workspace dir doesn't exist, skip
      }
    }
  }

  return files;
}

function dedupe(arr) {
  return [...new Set(arr)];
}

export function detect(projectDir) {
  const language = detectLanguage(projectDir);
  const package_manager = detectPackageManager(projectDir);
  const { monorepo, monorepo_tool } = detectMonorepo(projectDir);

  const result = {
    language,
    package_manager,
    monorepo,
    monorepo_tool,
    frontend_frameworks: [],
    backend_frameworks: [],
    orm: [],
    state_management: [],
    validation: [],
    testing: [],
    styling: [],
    queue: [],
  };

  const pkgFiles = collectPackageJsonFiles(projectDir, monorepo);

  // Collect all deps from all package.json files for excludeIf checks
  const allDeps = new Set();
  const parsedPkgs = [];
  for (const pkgPath of pkgFiles) {
    const parsed = readPackageJson(pkgPath);
    if (parsed) {
      parsedPkgs.push(parsed);
      for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
        if (parsed[section]) {
          for (const dep of Object.keys(parsed[section])) {
            allDeps.add(dep);
          }
        }
      }
    }
  }

  // Scan using dependency map
  for (const [depName, mapping] of Object.entries(DEPENDENCY_MAP)) {
    for (const parsed of parsedPkgs) {
      if (hasDep(depName, parsed)) {
        // Check excludeIf condition (e.g., react-spa excluded if next is present)
        if (mapping.excludeIf && allDeps.has(mapping.excludeIf)) {
          continue;
        }
        result[mapping.category].push(mapping.value);
      }
    }
  }

  // Deduplicate all arrays
  for (const key of Object.keys(result)) {
    if (Array.isArray(result[key])) {
      result[key] = dedupe(result[key]);
    }
  }

  return result;
}

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
  if (fileExists(join(projectDir, 'package.json'))) return 'npm';
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
  // npm/yarn workspaces defined in package.json
  const rootPkg = readPackageJson(join(projectDir, 'package.json'));
  if (rootPkg?.workspaces) {
    const ws = rootPkg.workspaces;
    const globs = Array.isArray(ws) ? ws : ws.packages;
    if (Array.isArray(globs) && globs.length > 0) {
      return { monorepo: true, monorepo_tool: 'npm-workspaces' };
    }
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
  return 'unknown';
}

/**
 * Reads workspace glob patterns from monorepo config files.
 * Checks: package.json workspaces, pnpm-workspace.yaml, lerna.json, nx.json
 * Returns array of glob strings or null if none found.
 */
function readWorkspaceGlobs(projectDir) {
  // 1. package.json "workspaces" field (npm/yarn)
  const rootPkg = readPackageJson(join(projectDir, 'package.json'));
  if (rootPkg?.workspaces) {
    const ws = rootPkg.workspaces;
    // workspaces can be an array or { packages: [...] }
    const globs = Array.isArray(ws) ? ws : ws.packages;
    if (Array.isArray(globs) && globs.length > 0) return globs;
  }

  // 2. pnpm-workspace.yaml — simple line-based parse
  const pnpmWsPath = join(projectDir, 'pnpm-workspace.yaml');
  if (fileExists(pnpmWsPath)) {
    try {
      const content = readFileSync(pnpmWsPath, 'utf-8');
      const globs = [];
      let inPackages = false;
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (/^packages\s*:/.test(trimmed)) {
          inPackages = true;
          continue;
        }
        if (inPackages) {
          if (trimmed.startsWith('- ')) {
            // Strip leading "- ", optional quotes
            const value = trimmed.slice(2).trim().replace(/^['"]|['"]$/g, '');
            if (value) globs.push(value);
          } else if (trimmed && !trimmed.startsWith('#')) {
            // New top-level key, stop parsing
            break;
          }
        }
      }
      if (globs.length > 0) return globs;
    } catch (err) {
      console.warn(`Warning: Failed to parse pnpm-workspace.yaml: ${err.message}`);
    }
  }

  // 3. lerna.json "packages" field
  const lernaPath = join(projectDir, 'lerna.json');
  if (fileExists(lernaPath)) {
    try {
      const lerna = JSON.parse(readFileSync(lernaPath, 'utf-8'));
      if (Array.isArray(lerna.packages) && lerna.packages.length > 0) {
        return lerna.packages;
      }
    } catch {
      // parse failed
    }
  }

  // 4. nx.json workspaceLayout
  const nxPath = join(projectDir, 'nx.json');
  if (fileExists(nxPath)) {
    try {
      const nx = JSON.parse(readFileSync(nxPath, 'utf-8'));
      const layout = nx.workspaceLayout;
      if (layout) {
        const globs = [];
        if (layout.appsDir) globs.push(`${layout.appsDir}/*`);
        if (layout.libsDir) globs.push(`${layout.libsDir}/*`);
        if (globs.length > 0) return globs;
      }
    } catch {
      // parse failed
    }
  }

  return null;
}

/**
 * Resolves glob patterns to actual directories on disk.
 * Handles: "apps/*", "packages/**", "frontend" (no glob), "!excluded" (skipped)
 */
function resolveGlobDirs(projectDir, globs) {
  const dirs = new Set();

  for (const glob of globs) {
    // Skip exclusion patterns
    if (glob.startsWith('!')) continue;

    // Strip trailing /* or /** to get the parent dir
    const cleaned = glob.replace(/\/\*\*?$/, '');

    // If the cleaned pattern still contains *, skip it (complex glob)
    if (cleaned.includes('*')) {
      console.warn(`Warning: Complex workspace glob pattern not fully supported, skipping: ${glob}`);
      continue;
    }

    const parentPath = join(projectDir, cleaned);
    try {
      const stat = statSync(parentPath);
      if (stat.isDirectory()) {
        // Check if this is a direct workspace (not a parent of workspaces)
        // If original glob had /*, enumerate children; otherwise treat as direct
        if (glob.includes('*')) {
          const entries = readdirSync(parentPath);
          for (const entry of entries) {
            const entryPath = join(parentPath, entry);
            try {
              if (statSync(entryPath).isDirectory()) {
                dirs.add(`${cleaned}/${entry}`);
              }
            } catch {
              // skip inaccessible
            }
          }
        } else {
          dirs.add(cleaned);
        }
      }
    } catch {
      // directory doesn't exist, skip
    }
  }

  return [...dirs];
}

const FALLBACK_WORKSPACE_DIRS = ['apps', 'packages', 'services', 'libs', 'modules'];

function collectPackageJsonFiles(projectDir, isMonorepo) {
  const entries = [];
  const rootPkg = join(projectDir, 'package.json');
  if (fileExists(rootPkg)) {
    entries.push({ pkgPath: rootPkg, dir: '.', isRoot: true });
  }

  let allWsDirs = [];

  if (isMonorepo) {
    const globs = readWorkspaceGlobs(projectDir);

    if (globs) {
      allWsDirs = resolveGlobDirs(projectDir, globs);
    } else {
      const fallbackSet = new Set();
      for (const dir of FALLBACK_WORKSPACE_DIRS) {
        const dirPath = join(projectDir, dir);
        try {
          for (const entry of readdirSync(dirPath)) {
            if (statSync(join(dirPath, entry)).isDirectory()) {
              fallbackSet.add(`${dir}/${entry}`);
            }
          }
        } catch {
          // directory doesn't exist, skip
        }
      }
      allWsDirs = [...fallbackSet];
    }

    for (const wsDir of allWsDirs) {
      const pkgPath = join(projectDir, wsDir, 'package.json');
      if (fileExists(pkgPath)) {
        entries.push({ pkgPath, dir: wsDir, isRoot: false });
      }
    }
  }

  return { entries, allWsDirs };
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
    forms: [],
    ui: [],
    routing: [],
    animation: [],
    table: [],
    devtools: [],
    api_docs: [],
    class_validation: [],
    rate_limiting: [],
    auth: [],
    cache: [],
    config: [],
    graphql: [],
    rpc: [],
    realtime: [],
    logging: [],
    http_client: [],
    i18n: [],
    date_utils: [],
    email: [],
    upload: [],
  };

  const { entries: pkgEntries, allWsDirs } = collectPackageJsonFiles(projectDir, monorepo);

  // Collect all deps from all package.json files for excludeIf checks
  const allDeps = new Set();
  const parsedPkgs = [];
  for (const { pkgPath } of pkgEntries) {
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
        // excludeIf can be a string or an array of strings
        if (mapping.excludeIf) {
          const excludeList = Array.isArray(mapping.excludeIf) ? mapping.excludeIf : [mapping.excludeIf];
          if (excludeList.some(dep => allDeps.has(dep))) {
            continue;
          }
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

  // Build workspace-level detection for monorepos
  if (monorepo) {
    const workspaces = [];
    const detectedDirs = new Set();

    for (const { pkgPath, dir, isRoot } of pkgEntries) {
      if (isRoot) continue;
      const parsed = readPackageJson(pkgPath);
      if (!parsed) continue;

      detectedDirs.add(dir);

      const frameworks = [];
      const tools = [];
      let hasFrontendFramework = false;
      let hasBackendFramework = false;

      for (const [depName, mapping] of Object.entries(DEPENDENCY_MAP)) {
        if (!hasDep(depName, parsed)) continue;
        if (mapping.excludeIf) {
          const excludeList = Array.isArray(mapping.excludeIf) ? mapping.excludeIf : [mapping.excludeIf];
          if (excludeList.some(dep => allDeps.has(dep))) continue;
        }

        if (mapping.category === 'frontend_frameworks') {
          hasFrontendFramework = true;
          frameworks.push(mapping.value);
        } else if (mapping.category === 'backend_frameworks') {
          hasBackendFramework = true;
          frameworks.push(mapping.value);
        } else {
          tools.push(mapping.value);
        }
      }

      let type = 'shared';
      if (hasFrontendFramework && hasBackendFramework) type = 'fullstack';
      else if (hasFrontendFramework) type = 'frontend';
      else if (hasBackendFramework) type = 'backend';

      workspaces.push({
        dir,
        type,
        frameworks: dedupe(frameworks),
        tools: dedupe(tools),
      });
    }

    // Include workspace directories that exist on disk but have no package.json yet
    for (const wsDir of allWsDirs) {
      if (!detectedDirs.has(wsDir)) {
        workspaces.push({
          dir: wsDir,
          type: 'shared',
          frameworks: [],
          tools: [],
        });
      }
    }

    result.workspaces = workspaces;
  } else {
    result.workspaces = [];
  }

  return result;
}

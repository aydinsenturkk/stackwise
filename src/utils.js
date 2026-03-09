import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, lstatSync, copyFileSync, chmodSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_COPY_DEPTH = 10;

export function getPackageRoot() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return resolve(__dirname, '..');
}

export function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON file: ${filePath}\n  ${err.message}`);
    }
    throw new Error(`Failed to read file: ${filePath}\n  ${err.message}`);
  }
}

export function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

export function copyDirRecursive(src, dest, depth = 0) {
  if (depth > MAX_COPY_DEPTH) {
    console.warn(`Warning: Maximum directory depth (${MAX_COPY_DEPTH}) exceeded, skipping: ${src}`);
    return;
  }
  ensureDir(dest);
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = lstatSync(srcPath);
    if (stat.isSymbolicLink()) {
      continue; // Skip symlinks to prevent cycles
    }
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath, depth + 1);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export function copyFileWithMode(src, dest, mode) {
  copyFileSync(src, dest);
  if (mode) {
    chmodSync(dest, mode);
  }
}

export function fileExists(filePath) {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
}

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync, chmodSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function getPackageRoot() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return resolve(__dirname, '..');
}

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

export function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

export function copyDirRecursive(src, dest) {
  ensureDir(dest);
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
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

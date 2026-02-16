import { join } from 'node:path';
import { readJson, getPackageRoot } from './utils.js';

let _registry = null;

export function loadRegistry() {
  if (!_registry) {
    const registryPath = join(getPackageRoot(), 'lib', 'registry.json');
    _registry = readJson(registryPath);
  }
  return _registry;
}

export function getFileMetadata(filePath) {
  const registry = loadRegistry();
  return registry.files.find((f) => f.path === filePath) || null;
}

export function getFilesByLayer(layer) {
  const registry = loadRegistry();
  return registry.files.filter((f) => f.layer === layer);
}

export function getFilesByDomain(domain) {
  const registry = loadRegistry();
  return registry.files.filter((f) => f.domain === domain);
}

export function getFilesByFramework(framework) {
  const registry = loadRegistry();
  return registry.files.filter((f) => f.framework === framework);
}

export function getFilesByTool(tool) {
  const registry = loadRegistry();
  return registry.files.filter((f) => f.tool === tool);
}

export function getAllFiles() {
  const registry = loadRegistry();
  return registry.files;
}

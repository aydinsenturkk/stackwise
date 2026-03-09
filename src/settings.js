import { join } from 'node:path';
import { readJson, writeJson, fileExists, getPackageRoot } from './utils.js';

export function loadSettingsPreset(presetName) {
  const presetPath = join(getPackageRoot(), 'settings', `${presetName}.json`);
  if (!fileExists(presetPath)) return null;
  return readJson(presetPath);
}

export function mergeSettings(existing, preset) {
  if (!existing) return preset;
  if (!preset) return existing;

  const merged = JSON.parse(JSON.stringify(existing));

  // Merge permissions.allow (union)
  if (preset.permissions?.allow) {
    if (!merged.permissions) merged.permissions = {};
    if (!merged.permissions.allow) merged.permissions.allow = [];
    const allowSet = new Set([...merged.permissions.allow, ...preset.permissions.allow]);
    merged.permissions.allow = [...allowSet];
  }

  // Merge permissions.deny (union)
  if (preset.permissions?.deny) {
    if (!merged.permissions) merged.permissions = {};
    if (!merged.permissions.deny) merged.permissions.deny = [];
    const denySet = new Set([...merged.permissions.deny, ...preset.permissions.deny]);
    merged.permissions.deny = [...denySet];
  }

  // Merge hooks (merge by event key)
  if (preset.hooks) {
    if (!merged.hooks) merged.hooks = {};
    for (const [event, hooksList] of Object.entries(preset.hooks)) {
      if (!merged.hooks[event]) {
        merged.hooks[event] = hooksList;
      } else {
        // Merge hook arrays by matcher uniqueness
        const existingMatchers = new Set(merged.hooks[event].map((h) => h.matcher));
        for (const hook of hooksList) {
          if (!existingMatchers.has(hook.matcher)) {
            merged.hooks[event].push(hook);
          }
        }
      }
    }
  }

  return merged;
}

export function installSettings(targetDir, presetName) {
  const preset = loadSettingsPreset(presetName);
  if (!preset) {
    console.warn(`Warning: Settings preset "${presetName}" not found.`);
    return null;
  }

  const settingsPath = join(targetDir, 'settings.json');
  let existing = null;

  if (fileExists(settingsPath)) {
    existing = readJson(settingsPath);
  }

  const merged = mergeSettings(existing, preset);
  writeJson(settingsPath, merged);
  return merged;
}

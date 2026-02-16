import { getFilesByLayer, getFilesByDomain, getFilesByFramework, getFilesByTool } from './registry.js';

// Framework detection value → registry framework name
const FRAMEWORK_MAP = {
  nextjs: 'nextjs',
  'react-spa': 'react-spa',
  nestjs: 'nestjs',
};

// Tool detection value → registry tool name
const TOOL_MAP = {
  prisma: 'prisma',
  'tanstack-query': 'tanstack-query',
  zod: 'zod',
  vitest: 'vitest',
  bullmq: 'bullmq',
};

export function resolveKnowledgeFiles(stack) {
  const files = [];

  // Layer 1: Always include all universal files
  const layer1 = getFilesByLayer(1);
  files.push(...layer1);

  // Layer 2: Include domain files based on detected frameworks
  const hasFrontend = stack.frontend_frameworks.length > 0;
  const hasBackend = stack.backend_frameworks.length > 0;

  if (hasFrontend) {
    const frontendFiles = getFilesByDomain('frontend').filter((f) => f.layer === 2);
    files.push(...frontendFiles);
  }

  if (hasBackend) {
    const backendFiles = getFilesByDomain('backend').filter((f) => f.layer === 2);
    files.push(...backendFiles);
  }

  // Layer 3: Include matching framework files
  const allFrameworks = [...stack.frontend_frameworks, ...stack.backend_frameworks];
  for (const fw of allFrameworks) {
    const registryName = FRAMEWORK_MAP[fw];
    if (registryName) {
      const fwFiles = getFilesByFramework(registryName);
      files.push(...fwFiles);
    }
  }

  // Layer 4: Include matching tool files
  const allTools = [
    ...stack.orm,
    ...stack.state_management,
    ...stack.validation,
    ...stack.testing,
    ...stack.queue,
  ];
  for (const tool of allTools) {
    const registryName = TOOL_MAP[tool];
    if (registryName) {
      const toolFiles = getFilesByTool(registryName);
      files.push(...toolFiles);
    }
  }

  // Deduplicate by path
  const seen = new Set();
  return files.filter((f) => {
    if (seen.has(f.path)) return false;
    seen.add(f.path);
    return true;
  });
}

export function determineTemplate(stack) {
  const hasFrontend = stack.frontend_frameworks.length > 0;
  const hasBackend = stack.backend_frameworks.length > 0;
  const hasNextjs = stack.frontend_frameworks.includes('nextjs');
  const hasNestjs = stack.backend_frameworks.includes('nestjs');
  const hasReact = stack.frontend_frameworks.includes('react-spa');

  // Next.js without separate backend → nextjs template
  if (hasNextjs && !hasBackend) return 'nextjs.md';

  // React + NestJS → react-nestjs template
  if ((hasReact || hasNextjs) && hasNestjs) return 'react-nestjs.md';

  // React SPA without backend → react-spa template
  if (hasReact && !hasBackend) return 'react-spa.md';

  // Next.js fullstack (nextjs + backend) → nextjs template
  if (hasNextjs && hasBackend) return 'react-nestjs.md';

  // Everything else → generic
  return 'generic.md';
}

export function determineSettingsPreset(stack) {
  const hasFrontend = stack.frontend_frameworks.length > 0;
  const hasBackend = stack.backend_frameworks.length > 0;

  if (hasFrontend && hasBackend) return 'fullstack';
  if (hasFrontend) return 'frontend';
  if (hasBackend) return 'backend';
  return 'base';
}

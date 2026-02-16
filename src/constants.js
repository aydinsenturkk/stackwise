export const SKILLS = [
  { name: 'review', description: 'Code review using project rules' },
  { name: 'fix-issue', description: 'Fetch GitHub issue and implement fix' },
  { name: 'new-feature', description: 'Scaffold feature with proper structure' },
  { name: 'add-tests', description: 'Generate tests following testing philosophy' },
  { name: 'api-endpoint', description: 'Create REST endpoint with full stack' },
  { name: 'component', description: 'Create React component with types and tests' },
  { name: 'debug', description: 'Structured debugging workflow' },
  { name: 'optimize', description: 'Performance analysis and optimization' },
  { name: 'pr', description: 'Create pull request with full context' },
  { name: 'migrate', description: 'Database migration with rollback strategy' },
];

export const AGENTS = [
  { name: 'code-reviewer', description: 'Thorough code review with categorized findings' },
  { name: 'test-writer', description: 'Test generation following testing philosophy' },
  { name: 'security-auditor', description: 'Security analysis using OWASP categories' },
  { name: 'refactorer', description: 'Safe refactoring with test verification' },
];

export const HOOKS = [
  { name: 'format-on-save.sh', description: 'Auto-formats files after Claude edits' },
  { name: 'protect-env.sh', description: 'Blocks Claude from reading .env files' },
];

// Dependency name → detected category and value
// Maps package.json dependency names to stack detection results
export const DEPENDENCY_MAP = {
  // Frontend frameworks
  next: { category: 'frontend_frameworks', value: 'nextjs' },
  react: { category: 'frontend_frameworks', value: 'react-spa', excludeIf: 'next' },
  vue: { category: 'frontend_frameworks', value: 'vue' },
  '@angular/core': { category: 'frontend_frameworks', value: 'angular' },
  svelte: { category: 'frontend_frameworks', value: 'svelte' },

  // Backend frameworks
  '@nestjs/core': { category: 'backend_frameworks', value: 'nestjs' },
  express: { category: 'backend_frameworks', value: 'express' },
  fastify: { category: 'backend_frameworks', value: 'fastify' },
  hono: { category: 'backend_frameworks', value: 'hono' },
  koa: { category: 'backend_frameworks', value: 'koa' },

  // ORM / Database
  prisma: { category: 'orm', value: 'prisma' },
  '@prisma/client': { category: 'orm', value: 'prisma' },
  'drizzle-orm': { category: 'orm', value: 'drizzle' },
  typeorm: { category: 'orm', value: 'typeorm' },

  // State management
  '@tanstack/react-query': { category: 'state_management', value: 'tanstack-query' },
  zustand: { category: 'state_management', value: 'zustand' },
  '@reduxjs/toolkit': { category: 'state_management', value: 'redux-toolkit' },

  // Validation
  zod: { category: 'validation', value: 'zod' },
  valibot: { category: 'validation', value: 'valibot' },

  // Testing
  vitest: { category: 'testing', value: 'vitest' },
  jest: { category: 'testing', value: 'jest' },
  '@playwright/test': { category: 'testing', value: 'playwright' },
  playwright: { category: 'testing', value: 'playwright' },
  cypress: { category: 'testing', value: 'cypress' },

  // Styling
  tailwindcss: { category: 'styling', value: 'tailwindcss' },
  'styled-components': { category: 'styling', value: 'styled-components' },
  '@emotion/react': { category: 'styling', value: 'emotion' },

  // Queue
  bullmq: { category: 'queue', value: 'bullmq' },
};

// Frontend-only skills (only shown if frontend detected)
export const FRONTEND_SKILLS = ['component'];

// Backend-only skills (only shown if backend detected)
export const BACKEND_SKILLS = ['api-endpoint', 'migrate'];

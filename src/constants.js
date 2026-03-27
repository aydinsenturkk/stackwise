export const SKILLS = [
  { name: 'sw-plan', description: 'Plan work as standalone task or epic. Use --auto for epic auto-execution' },
  { name: 'sw-tasks', description: 'View task status dashboard from GitHub Issues' },
  { name: 'sw-work', description: 'Pick up a task and implement it' },
  { name: 'sw-ship', description: 'Create PR for a tracked task issue, close it, and optionally merge' },
  { name: 'sw-standup', description: 'Generate standup status report across all epics' },
  { name: 'sw-review', description: 'Code review using project rules' },
  { name: 'sw-generate-knowledge', description: 'Generate knowledge rules for an unsupported tool' },
  { name: 'sw-sync-project', description: 'Sync CLAUDE.md with current project state' },
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
  '@tanstack/react-start': { category: 'frontend_frameworks', value: 'tanstack-start' },
  '@remix-run/react': { category: 'frontend_frameworks', value: 'remix' },
  '@react-router/dev': { category: 'frontend_frameworks', value: 'remix' },
  react: { category: 'frontend_frameworks', value: 'react-spa', excludeIf: ['next', '@tanstack/react-start', '@remix-run/react', '@react-router/dev'] },
  nuxt: { category: 'frontend_frameworks', value: 'nuxt' },
  vue: { category: 'frontend_frameworks', value: 'vue', excludeIf: 'nuxt' },
  '@sveltejs/kit': { category: 'frontend_frameworks', value: 'sveltekit' },
  svelte: { category: 'frontend_frameworks', value: 'svelte', excludeIf: '@sveltejs/kit' },
  '@angular/core': { category: 'frontend_frameworks', value: 'angular' },
  astro: { category: 'frontend_frameworks', value: 'astro' },
  '@solidjs/start': { category: 'frontend_frameworks', value: 'solid-start' },
  'solid-js': { category: 'frontend_frameworks', value: 'solid', excludeIf: '@solidjs/start' },
  '@builder.io/qwik': { category: 'frontend_frameworks', value: 'qwik' },

  // Backend frameworks
  '@nestjs/core': { category: 'backend_frameworks', value: 'nestjs' },
  express: { category: 'backend_frameworks', value: 'express', excludeIf: ['@nestjs/core', '@feathersjs/feathers'] },
  fastify: { category: 'backend_frameworks', value: 'fastify' },
  hono: { category: 'backend_frameworks', value: 'hono' },
  koa: { category: 'backend_frameworks', value: 'koa' },
  '@adonisjs/core': { category: 'backend_frameworks', value: 'adonisjs' },
  '@feathersjs/feathers': { category: 'backend_frameworks', value: 'feathersjs' },
  '@elysiajs/core': { category: 'backend_frameworks', value: 'elysia' },
  elysia: { category: 'backend_frameworks', value: 'elysia' },
  '@hapi/hapi': { category: 'backend_frameworks', value: 'hapi' },
  'nitropack': { category: 'backend_frameworks', value: 'nitro' },

  // ORM / Database
  prisma: { category: 'orm', value: 'prisma' },
  '@prisma/client': { category: 'orm', value: 'prisma' },
  'drizzle-orm': { category: 'orm', value: 'drizzle' },
  typeorm: { category: 'orm', value: 'typeorm' },
  mongoose: { category: 'orm', value: 'mongoose' },
  sequelize: { category: 'orm', value: 'sequelize' },
  knex: { category: 'orm', value: 'knex' },
  '@mikro-orm/core': { category: 'orm', value: 'mikro-orm' },

  // State management
  '@tanstack/react-query': { category: 'state_management', value: 'tanstack-query' },
  '@tanstack/store': { category: 'state_management', value: 'tanstack-store' },
  '@tanstack/react-store': { category: 'state_management', value: 'tanstack-store' },
  zustand: { category: 'state_management', value: 'zustand' },
  '@reduxjs/toolkit': { category: 'state_management', value: 'redux-toolkit' },

  // Forms
  'react-hook-form': { category: 'forms', value: 'react-hook-form' },
  '@tanstack/react-form': { category: 'forms', value: 'tanstack-form' },

  // DevTools
  '@tanstack/react-query-devtools': { category: 'devtools', value: 'tanstack-devtools' },
  '@tanstack/router-devtools': { category: 'devtools', value: 'tanstack-devtools' },
  '@tanstack/form-devtools': { category: 'devtools', value: 'tanstack-devtools' },

  // UI Components
  'class-variance-authority': { category: 'ui', value: 'shadcn-ui' },
  '@storybook/react': { category: 'ui', value: 'storybook' },
  '@storybook/react-vite': { category: 'ui', value: 'storybook' },
  '@storybook/nextjs': { category: 'ui', value: 'storybook' },

  // Routing
  '@tanstack/react-router': { category: 'routing', value: 'tanstack-router' },

  // Animation
  'framer-motion': { category: 'animation', value: 'framer-motion' },
  'motion': { category: 'animation', value: 'framer-motion' },

  // Tables
  '@tanstack/react-table': { category: 'table', value: 'tanstack-table' },

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

  // API Documentation
  '@nestjs/swagger': { category: 'api_docs', value: 'nestjs-swagger' },

  // Class Validation (backend)
  'class-validator': { category: 'class_validation', value: 'class-validator' },
  'class-transformer': { category: 'class_validation', value: 'class-validator' },

  // Rate Limiting
  '@nestjs/throttler': { category: 'rate_limiting', value: 'nestjs-throttler' },

  // Authentication
  '@nestjs/passport': { category: 'auth', value: 'nestjs-passport' },
  '@nestjs/jwt': { category: 'auth', value: 'nestjs-passport' },
  'passport-jwt': { category: 'auth', value: 'nestjs-passport' },
  passport: { category: 'auth', value: 'passport' },
  'next-auth': { category: 'auth', value: 'next-auth' },
  '@auth/core': { category: 'auth', value: 'auth-core' },
  'better-auth': { category: 'auth', value: 'better-auth' },

  // Caching
  '@nestjs/cache-manager': { category: 'cache', value: 'nestjs-cache-manager' },
  'cache-manager': { category: 'cache', value: 'nestjs-cache-manager' },

  // Configuration
  '@nestjs/config': { category: 'config', value: 'nestjs-config' },

  // GraphQL
  graphql: { category: 'graphql', value: 'graphql' },
  '@apollo/server': { category: 'graphql', value: 'apollo-server' },
  '@apollo/client': { category: 'graphql', value: 'apollo-client' },

  // RPC
  '@trpc/server': { category: 'rpc', value: 'trpc' },
  '@trpc/client': { category: 'rpc', value: 'trpc' },

  // Realtime
  'socket.io': { category: 'realtime', value: 'socket-io' },
  ws: { category: 'realtime', value: 'ws' },

  // Logging
  winston: { category: 'logging', value: 'winston' },
  pino: { category: 'logging', value: 'pino' },

  // HTTP Client
  axios: { category: 'http_client', value: 'axios' },
  ky: { category: 'http_client', value: 'ky' },

  // Internationalization
  i18next: { category: 'i18n', value: 'i18next' },
  'next-intl': { category: 'i18n', value: 'next-intl' },

  // Date utilities
  dayjs: { category: 'date_utils', value: 'dayjs' },
  'date-fns': { category: 'date_utils', value: 'date-fns' },
  luxon: { category: 'date_utils', value: 'luxon' },

  // Email
  nodemailer: { category: 'email', value: 'nodemailer' },
  '@nestjs/mailer': { category: 'email', value: 'nestjs-mailer' },

  // File upload
  multer: { category: 'upload', value: 'multer' },
};

// Frontend-only skills (hidden if no frontend detected)
// All skills NOT listed here or in BACKEND_SKILLS are shown universally
export const FRONTEND_SKILLS = [];

// Backend-only skills (hidden if no backend detected)
export const BACKEND_SKILLS = [];

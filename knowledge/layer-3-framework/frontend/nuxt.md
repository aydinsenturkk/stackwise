# Nuxt

> Nuxt-specific conventions only. For Vue fundamentals (Composition API, reactivity, SFC), see the Vue L3 knowledge file.

## Auto-Imports

Nuxt auto-imports Vue APIs, composables, and utilities. No manual imports needed.

```vue
<script setup lang="ts">
// These are auto-imported — no import statements needed:
// ref, computed, watch, onMounted (from Vue)
// useFetch, useAsyncData, useRoute, useRouter (from Nuxt)
// definePageMeta, navigateTo, useState (from Nuxt)

const count = ref(0);
const route = useRoute();
const doubled = computed(() => count.value * 2);
</script>
```

### Auto-Import Sources

| Directory | What's Auto-Imported |
| --------- | -------------------- |
| `composables/` | All exported functions |
| `utils/` | All exported functions |
| `components/` | All Vue components (path-based prefixing) |
| `shared/` | Shared between app and server (3.14+, requires `compatibilityVersion: 4`) |
| `server/utils/` | Server-side utilities |
| Vue | `ref`, `computed`, `watch`, `onMounted`, etc. |
| Nuxt | `useFetch`, `useRoute`, `useState`, `navigateTo`, etc. |

### Custom Auto-Imports

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    dirs: ['stores'],  // Auto-import from additional directories
  },
});
```

---

## File-Based Routing

```
pages/
├── index.vue                 → /
├── about.vue                 → /about
├── users/
│   ├── index.vue             → /users
│   └── [id].vue              → /users/:id
├── posts/
│   └── [...slug].vue         → /posts/* (catch-all)
└── admin/
    └── [[id]].vue            → /admin, /admin/:id (optional param)
```

### Page Meta and Middleware

```vue
<!-- pages/admin/index.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
  title: 'Admin Dashboard',
});
</script>
```

### Programmatic Navigation

```typescript
// Navigate
navigateTo('/users/123');
navigateTo({ path: '/users', query: { page: '2' } });

// Redirect (in middleware or server)
navigateTo('/login', { redirectCode: 301 });

// External URL
navigateTo('https://example.com', { external: true });
```

---

## Data Fetching

### useFetch

```vue
<script setup lang="ts">
// useFetch — wrapper around useAsyncData + $fetch
const { data: users, status, error, refresh } = await useFetch('/api/users', {
  query: { page: 1 },
});

// Typed response
const { data } = await useFetch<User[]>('/api/users');

// With transform
const { data: userNames } = await useFetch('/api/users', {
  transform: (users: User[]) => users.map(u => u.name),
});

// Lazy — does not block navigation
const { data, status } = useLazyFetch('/api/stats');
</script>

<template>
  <div v-if="status === 'pending'">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

**Status field:** The `status` ref replaces the deprecated `pending` boolean. Values: `'idle' | 'pending' | 'success' | 'error'`.

### useAsyncData

```vue
<script setup lang="ts">
// useAsyncData — for non-fetch async operations
// Key is auto-generated from file + line (optional manual key)
const { data: user } = await useAsyncData(
  () => $fetch(`/api/users/${route.params.id}`),
);

// Explicit key — recommended for complex scenarios (dynamic params, deduplication)
const { data } = await useAsyncData(
  `user-${route.params.id}`,
  () => $fetch(`/api/users/${route.params.id}`),
  { watch: [() => route.params.id] },
);
</script>
```

### Shallow Reactivity and deep Option

```typescript
// data is shallowRef by default (Nuxt 3.x+)
// Use deep: true for nested reactivity
const { data } = await useFetch('/api/users', { deep: true });
```

### getCachedData and Deduplication

```typescript
const { data } = await useFetch('/api/data', {
  dedupe: 'cancel', // or 'defer'
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
});
```

### useFetch vs useAsyncData

| | `useFetch` | `useAsyncData` |
| --- | ---------- | -------------- |
| Auto key | From URL | Auto-generated (optional manual) |
| Request lib | `$fetch` built-in | Any async function |
| Use when | Simple API calls | Custom async logic |

### Refresh and Cache

```typescript
// Refresh data
const { data, refresh } = await useFetch('/api/users');
await refresh();

// Clear cached data
clearNuxtData('user');

// Refresh all data
refreshNuxtData();
```

---

## Server Routes

```
server/
├── api/
│   ├── users/
│   │   ├── index.get.ts       → GET /api/users
│   │   ├── index.post.ts      → POST /api/users
│   │   └── [id].get.ts        → GET /api/users/:id
│   └── health.ts              → GET /api/health (all methods)
├── middleware/
│   └── auth.ts                → Server middleware
└── utils/
    └── db.ts                  → Auto-imported server utilities
```

### Defining Server Routes

```typescript
// server/api/users/index.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const users = await db.user.findMany({
    skip: ((Number(query.page) || 1) - 1) * 20,
    take: 20,
  });
  return users;
});

// server/api/users/index.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const user = await db.user.create({ data: body });
  setResponseStatus(event, 201);
  return user;
});

// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' });
  }
  return user;
});
```

### Server Utilities

```typescript
// server/utils/db.ts — auto-imported in server/
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function useDB() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
```

---

## Middleware

### Route Middleware (Client-Side)

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useAuth();  // your auth composable
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login');
  }
});

// Apply in page
definePageMeta({
  middleware: ['auth'],
});
```

### Global Middleware

```typescript
// middleware/analytics.global.ts (suffix .global = runs on every route)
export default defineNuxtRouteMiddleware((to) => {
  trackPageView(to.path);
});
```

### Server Middleware

```typescript
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '');
  if (event.path.startsWith('/api/admin') && !token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  if (token) {
    event.context.user = await verifyToken(token);
  }
});
```

---

## State Management

### useState (SSR-safe)

```typescript
// composables/useAuth.ts
export function useAuth() {
  return useState<User | null>('auth-user', () => null);
}

// In any component
const user = useAuth();
user.value = { id: '1', name: 'John' };
```

**Important:** `useState` is SSR-safe (serialized from server to client). `ref()` in composables is **not** SSR-safe.

---

## Layouts

```
layouts/
├── default.vue        → Default layout
├── admin.vue          → Admin layout
└── blank.vue          → No-chrome layout
```

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <AppHeader />
    <main>
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<!-- Set layout in page -->
<script setup>
definePageMeta({ layout: 'admin' });
</script>
```

---

## Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  runtimeConfig: {
    // Server-only (not exposed to client)
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,

    // Client-exposed (prefixed with public)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },

  routeRules: {
    '/api/**': { cors: true },
    '/admin/**': { ssr: false },         // SPA mode for admin
    '/blog/**': { swr: 3600 },           // Stale-while-revalidate
    '/': { prerender: true },            // Static generation
  },

  nitro: {
    preset: 'node-server',  // or 'cloudflare', 'vercel', etc.
  },
});
```

### Runtime Config Access

```typescript
// In components/composables
const config = useRuntimeConfig();
config.public.apiBase;  // Available on client and server

// In server routes
const config = useRuntimeConfig(event);
config.databaseUrl;  // Server-only
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| Importing Vue APIs manually | Redundant, defeats auto-import | Let Nuxt auto-import `ref`, `computed`, etc. |
| Using `ref()` for SSR state | State not transferred to client | Use `useState()` for SSR-safe shared state |
| `useFetch` in event handlers | Should only run in setup | Use `$fetch` for event-triggered requests |
| Omitting key in complex `useAsyncData` | Auto-generated key may collide with dynamic params | Provide explicit keys when using dynamic route params or deduplication |
| Server secrets in `runtimeConfig.public` | Exposed to client bundle | Keep secrets in `runtimeConfig` (not `public`) |
| `pages/api/` for server routes | Wrong directory | Use `server/api/` for server routes |
| Not using `definePageMeta` | Middleware/layout not applied | Set metadata via `definePageMeta` |
| Calling `navigateTo` in template | Must be called in script | Use `<NuxtLink>` in templates, `navigateTo` in script |
| Using deprecated `pending` boolean | Removed in favor of `status` ref | Use `status === 'pending'` instead |

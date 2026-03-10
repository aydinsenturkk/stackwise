# Vue

## Composition API

Vue 3 uses the Composition API with `<script setup>` for organizing component logic.

### Reactivity Primitives

| API | Purpose | Use For |
| --- | ------- | ------- |
| `ref()` | Reactive primitive value | Strings, numbers, booleans |
| `reactive()` | Reactive object | Objects with many properties |
| `computed()` | Derived value | Computed from reactive sources |
| `watch()` | Side effect on change | API calls, logging |
| `watchEffect()` | Auto-tracked side effect | Runs immediately, re-runs on dep change |

```vue
<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';

// Refs — access value with .value in script
const count = ref(0);
const name = ref('');

// Reactive — no .value needed, but can't reassign
const user = reactive({
  name: '',
  email: '',
  preferences: { theme: 'light' },
});

// Computed — cached, only recalculates when deps change
const doubled = computed(() => count.value * 2);

// Watch specific source
watch(count, (newVal, oldVal) => {
  console.log(`Count changed: ${oldVal} → ${newVal}`);
});

// Watch with options
watch(
  () => user.name,
  (newName) => { /* ... */ },
  { immediate: true },
);

// Lifecycle
onMounted(async () => {
  const data = await fetchUser();
  user.name = data.name;
});
</script>
```

### ref vs reactive

| | `ref()` | `reactive()` |
| --- | ------- | ------------ |
| Primitives | Yes | No |
| Objects | Yes (`.value` to access) | Yes (direct access) |
| Reassignment | `ref.value = newObj` | Cannot reassign root |
| Destructuring | Returns ref — stays reactive | Loses reactivity |
| Template usage | Auto-unwrapped (no `.value`) | Direct access |

**Recommendation:** Default to `ref()`. Use `reactive()` for objects with many related properties.

---

## Single-File Components (SFC)

```vue
<script setup lang="ts">
// Imports, composition logic, props, emits
import { ref } from 'vue';
import type { User } from '@/types';

const props = defineProps<{
  user: User;
  isEditable?: boolean;
}>();

const emit = defineEmits<{
  update: [user: User];
  delete: [id: string];
}>();

const isEditing = ref(false);

function handleSave() {
  emit('update', props.user);
  isEditing.value = false;
}
</script>

<template>
  <div class="user-card">
    <h2>{{ user.name }}</h2>
    <p v-if="isEditable && isEditing">
      <input v-model="user.name" />
      <button @click="handleSave">Save</button>
    </p>
    <button v-else-if="isEditable" @click="isEditing = true">
      Edit
    </button>
  </div>
</template>

<style scoped>
.user-card {
  padding: 1rem;
  border: 1px solid var(--border-color);
}
</style>
```

---

## Props and Emits

### Props with Defaults

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
  items?: string[];
}

// Vue 3.5+ — destructured props with defaults (recommended)
const { title, count = 0, items = [] } = defineProps<Props>();

// Pre-3.5 alternative
// const props = withDefaults(defineProps<Props>(), {
//   count: 0,
//   items: () => [],
// });
</script>
```

### Emits with Validation

```vue
<script setup lang="ts">
const emit = defineEmits<{
  change: [value: string];
  submit: [data: FormData];
  'update:modelValue': [value: string]; // v-model support
}>();
</script>
```

### v-model on Components

```vue
<!-- Parent -->
<SearchInput v-model.trim="query" v-model:filter="activeFilter" />

<!-- SearchInput.vue -->
<script setup lang="ts">
const [model, modifiers] = defineModel<string>();  // modifiers.trim === true
const filter = defineModel<string>('filter');       // named v-model
</script>

<template>
  <input :value="model" @input="model = ($event.target as HTMLInputElement).value" />
</template>
```

---

## Template Directives

| Directive | Purpose | Example |
| --------- | ------- | ------- |
| `v-if` / `v-else-if` / `v-else` | Conditional rendering | `<div v-if="isReady">` |
| `v-show` | Toggle visibility (CSS) | `<div v-show="isVisible">` |
| `v-for` | List rendering | `<li v-for="item in items" :key="item.id">` |
| `v-model` | Two-way binding | `<input v-model="name">` |
| `v-on` / `@` | Event listener | `<button @click="handler">` |
| `v-bind` / `:` | Dynamic attribute | `<img :src="url">` |
| `v-slot` / `#` | Slot content | `<template #header>` |

### v-if vs v-show

| | `v-if` | `v-show` |
| --- | ------ | -------- |
| Mechanism | Adds/removes from DOM | Toggles `display: none` |
| Cost | Higher toggle cost | Higher initial render cost |
| Use when | Condition rarely changes | Condition toggles frequently |

---

## Provide / Inject

```typescript
import { provide, inject, ref } from 'vue';
import type { InjectionKey, Ref } from 'vue';

export const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme');

// In parent
const theme = ref<'light' | 'dark'>('light');
provide(ThemeKey, theme);

// In any descendant
const theme = inject(ThemeKey);               // Ref<...> | undefined
const theme = inject(ThemeKey, ref('light')); // with default
```

---

## Script Setup Macros (3.3+)

| Macro | Purpose | Example |
| ----- | ------- | ------- |
| `defineOptions()` | Set component options (`name`, `inheritAttrs`) | `defineOptions({ name: 'MyComp', inheritAttrs: false })` |
| `defineSlots<T>()` | Typed slot definitions | `defineSlots<{ default(props: { item: Item }): any }>()` |
| Generic components | Type parameter on component | `<script setup lang="ts" generic="T extends object">` |

```vue
<!-- GenericList.vue -->
<script setup lang="ts" generic="T extends { id: string }">
defineOptions({ name: 'GenericList' });
const { items } = defineProps<{ items: T[] }>();
defineSlots<{ item(props: { item: T; index: number }): any }>();
</script>

<template>
  <ul>
    <li v-for="(item, i) in items" :key="item.id">
      <slot name="item" :item="item" :index="i" />
    </li>
  </ul>
</template>
```

---

## Composables

Composables are the Vue equivalent of React hooks — reusable logic extracted into functions.

```typescript
// composables/useUsers.ts
import { ref, onMounted } from 'vue';
import type { User } from '@/types';

export function useUsers() {
  const users = ref<User[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  async function fetchUsers() {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await fetch('/api/users');
      users.value = await res.json();
    } catch (e) {
      error.value = e as Error;
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(fetchUsers);

  return { users, isLoading, error, refetch: fetchUsers };
}
```

```vue
<script setup lang="ts">
import { useUsers } from '@/composables/useUsers';

const { users, isLoading, error } = useUsers();
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

### Composable Rules

| Do | Don't |
| -- | ----- |
| Name with `use` prefix | Name without `use` prefix |
| Call at top level of `<script setup>` | Call inside conditionals or loops |
| Return refs (keep reactivity) | Return plain values (lose reactivity) |
| Accept refs as arguments | Require `.value` from caller |
| Use `toValue(refOrGetter)` to normalize inputs (3.3+) | Manually check ref vs getter vs plain value |

---

## Watchers

```typescript
import { ref, watch, watchEffect, onWatcherCleanup } from 'vue';

const search = ref('');
const page = ref(1);

// Watch single source
watch(search, async (query) => {
  page.value = 1;
  await fetchResults(query);
});

// Watch multiple sources
watch([search, page], async ([query, pageNum]) => {
  await fetchResults(query, pageNum);
});

// Deep watch (full) or with depth limit (3.5+: deep accepts a number)
watch(() => user, (newUser) => { /* ... */ }, { deep: true });
watch(() => user, (newUser) => { /* ... */ }, { deep: 2 });

// Fire only once (3.4+)
watch(source, (val) => { /* runs once then stops */ }, { once: true });

// Cleanup side effects (3.5+)
watch(search, async (query) => {
  const controller = new AbortController();
  onWatcherCleanup(() => controller.abort());
  await fetchResults(query, { signal: controller.signal });
});

// Pause/resume watcher (3.5+)
const { pause, resume, stop } = watch(search, handler);
pause(); resume(); // temporarily suspend / re-enable

// watchEffect — auto-tracks dependencies
watchEffect(async () => {
  const results = await fetchResults(search.value, page.value);
  items.value = results;
});
```

---

## Slots

```vue
<!-- BaseCard.vue -->
<template>
  <div class="card">
    <div v-if="$slots.header" class="card-header"><slot name="header" /></div>
    <div class="card-body"><slot /></div>
    <div v-if="$slots.footer" class="card-footer"><slot name="footer" /></div>
  </div>
</template>

<!-- Usage -->
<BaseCard>
  <template #header><h2>Title</h2></template>
  <p>Card content goes here</p>
  <template #footer><button>Action</button></template>
</BaseCard>
```

### Scoped Slots

```vue
<!-- DataList.vue -->
<template>
  <ul>
    <li v-for="(item, index) in items" :key="item.id">
      <slot name="item" :item="item" :index="index" />
    </li>
  </ul>
</template>

<!-- Usage -->
<DataList :items="users">
  <template #item="{ item }">
    <strong>{{ item.name }}</strong> — {{ item.email }}
  </template>
</DataList>
```

---

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UserCard from './UserCard.vue';

describe('UserCard', () => {
  it('renders user name', () => {
    const wrapper = mount(UserCard, {
      props: { user: { id: '1', name: 'John', email: 'john@test.com' } },
    });
    expect(wrapper.text()).toContain('John');
  });

  it('emits update on save', async () => {
    const wrapper = mount(UserCard, {
      props: { user: { id: '1', name: 'John' }, isEditable: true },
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('update')).toBeTruthy();
  });
});
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| Destructuring reactive objects | Loses reactivity | Use `toRefs()` or access properties directly |
| Replacing entire reactive object | Does not trigger updates | Mutate properties or use `ref()` |
| Mutating props directly | One-way data flow violation | Emit events, let parent update |
| Missing `:key` on `v-for` | Incorrect DOM reuse, subtle bugs | Always use unique `:key` |
| Options API + Composition API mix | Confusing, inconsistent | Use `<script setup>` exclusively |
| `watchEffect` with side effects | Hard to debug, unpredictable | Prefer explicit `watch` for API calls |
| Deep watchers on large objects | Performance overhead | Watch specific properties instead |
| Global reactive state without stores | Hard to track, no devtools | Use Pinia for shared state |

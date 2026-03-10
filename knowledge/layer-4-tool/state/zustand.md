# Zustand

> Zustand v5 requires React 18+.

## Store Creation

```typescript
import { create } from 'zustand';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

### Usage in Components

```typescript
// Select specific state (recommended — prevents unnecessary re-renders)
const count = useCounterStore((state) => state.count);
const increment = useCounterStore((state) => state.increment);

// Select multiple values with shallow comparison
import { useShallow } from 'zustand/react/shallow';

const { count, increment } = useCounterStore(
  useShallow((state) => ({ count: state.count, increment: state.increment })),
);
```

### Custom Equality Function

In v5, `create` no longer accepts a custom equality function. For custom equality comparisons, use `createWithEqualityFn` from `zustand/traditional`:

```typescript
import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const useStore = createWithEqualityFn<State>()(
  (set) => ({ ... }),
  shallow,
);
```

## Store with Async Actions

```typescript
interface UserStore {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (data: CreateUserDto) => Promise<void>;
}

const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await api.getUsers();
      set({ users, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createUser: async (data) => {
    const user = await api.createUser(data);
    set((state) => ({ users: [...state.users, user] }));
  },
}));
```

## Slices Pattern

Split large stores into slices for modularity.

```typescript
interface AuthSlice {
  user: User | null;
  token: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

interface UISlice {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const createAuthSlice: StateCreator<AuthSlice & UISlice, [], [], AuthSlice> = (set) => ({
  user: null,
  token: null,
  login: async (credentials) => {
    const { user, token } = await api.login(credentials);
    set({ user, token });
  },
  logout: () => set({ user: null, token: null }),
});

const createUISlice: StateCreator<AuthSlice & UISlice, [], [], UISlice> = (set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
});

const useAppStore = create<AuthSlice & UISlice>()((...args) => ({
  ...createAuthSlice(...args),
  ...createUISlice(...args),
}));
```

## Middleware

### Persist

> In v5, the persist middleware no longer stores the item at store creation time — it writes to storage on the first state change. If you need to persist the initial state immediately, trigger a no-op `set` after creation.

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';

const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme, language: state.language }),
    },
  ),
);
```

### Immer

```typescript
import { immer } from 'zustand/middleware/immer';

const useTodoStore = create<TodoStore>()(
  immer((set) => ({
    todos: [],
    addTodo: (text: string) =>
      set((state) => {
        state.todos.push({ id: crypto.randomUUID(), text, done: false });
      }),
    toggleTodo: (id: string) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) todo.done = !todo.done;
      }),
  })),
);
```

### Devtools

```typescript
import { devtools } from 'zustand/middleware';

const useStore = create<Store>()(
  devtools(
    (set) => ({
      // ... state and actions
    }),
    { name: 'MyStore' },
  ),
);
```

### Combining Middleware

```typescript
const useStore = create<Store>()(
  devtools(
    persist(
      immer((set) => ({
        // ... state and actions
      })),
      { name: 'store' },
    ),
    { name: 'Store' },
  ),
);
```

## Computed Values

```typescript
const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  // Derived values as getters — call as functions
  completedCount: () => get().todos.filter((t) => t.done).length,
  pendingTodos: () => get().todos.filter((t) => !t.done),
}));

// In component — memoize if expensive
const completedCount = useTodoStore((state) => state.completedCount());
```

## Outside React

```typescript
// Read state outside components
const currentUser = useAuthStore.getState().user;

// Subscribe to changes
// NOTE: Selector-based subscribe requires the `subscribeWithSelector` middleware.
// Without it, `subscribe` only accepts a listener for the entire state.
//   import { subscribeWithSelector } from 'zustand/middleware';
//   const useAuthStore = create<AuthStore>()(subscribeWithSelector((set) => ({ ... })));
const unsubscribe = useAuthStore.subscribe(
  (state) => state.token,
  (token) => {
    api.setAuthHeader(token);
  },
);

// Set state outside components
useAuthStore.setState({ user: null, token: null });
```

## Testing

```typescript
import { act } from '@testing-library/react';

// Reset store between tests
beforeEach(() => {
  useCounterStore.setState({ count: 0 });
});

it('increments counter', () => {
  act(() => {
    useCounterStore.getState().increment();
  });
  expect(useCounterStore.getState().count).toBe(1);
});
```

## State Management Decision

| Need | Solution |
|------|----------|
| Simple shared state | Single Zustand store |
| Complex nested updates | Zustand + Immer middleware |
| Persistent settings | Zustand + Persist middleware |
| Server state (fetch, cache, sync) | TanStack Query (not Zustand) |
| Form state | React Hook Form or TanStack Form (not Zustand) |
| URL state | Router search params (not Zustand) |

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| Selecting entire store: `useStore()` | Re-renders on any state change | Select individual fields: `useStore((s) => s.count)` |
| Storing server/cached data | Duplicates TanStack Query's job | Use Zustand for client-only state |
| Deeply nested state without Immer | Verbose spread operators | Use Immer middleware |
| One mega-store | Hard to maintain, couples unrelated state | Split into domain-specific stores or slices |
| Storing derived data | Stale values, extra state | Compute on read with getter functions |
| `set({ ...get(), field: value })` | Overwrites concurrent updates | Use `set((state) => ({ field: value }))` — Zustand merges shallowly |

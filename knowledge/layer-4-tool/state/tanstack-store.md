# TanStack Store

## Core Concept

TanStack Store is a **framework-agnostic, immutable** state management library. It provides a minimal, type-safe reactive store with fine-grained subscriptions. Use it for client-side UI state — server state belongs in TanStack Query.

---

## Basic Store

```typescript
import { Store } from "@tanstack/store";

// Define the store
const countStore = new Store(0);

// Read
console.log(countStore.state); // 0

// Update (immutable — must return new state)
countStore.setState((prev) => prev + 1);

// Subscribe to changes
const unsub = countStore.subscribe(() => {
  console.log("Count changed:", countStore.state);
});

// Cleanup
unsub();
```

---

## React Integration

```typescript
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";

// Store defined outside components (module-level)
const counterStore = new Store({
  count: 0,
  step: 1,
});

function Counter() {
  // Select specific slice — only re-renders when selected value changes
  const count = useStore(counterStore, (state) => state.count);
  const step = useStore(counterStore, (state) => state.step);

  return (
    <div>
      <span>{count}</span>
      <button onClick={() =>
        counterStore.setState((prev) => ({ ...prev, count: prev.count + prev.step }))
      }>
        +{step}
      </button>
    </div>
  );
}
```

---

## Store with Typed Actions

```typescript
interface ThemeState {
  mode: "light" | "dark" | "system";
  primaryColor: string;
  fontSize: "sm" | "md" | "lg";
}

const themeStore = new Store<ThemeState>({
  mode: "system",
  primaryColor: "#3b82f6",
  fontSize: "md",
});

// Action helpers (plain functions, not methods)
function setThemeMode(mode: ThemeState["mode"]) {
  themeStore.setState((prev) => ({ ...prev, mode }));
}

function setPrimaryColor(color: string) {
  themeStore.setState((prev) => ({ ...prev, primaryColor: color }));
}

function setFontSize(size: ThemeState["fontSize"]) {
  themeStore.setState((prev) => ({ ...prev, fontSize: size }));
}

// Usage in component
function ThemeToggle() {
  const mode = useStore(themeStore, (s) => s.mode);

  return (
    <button onClick={() => setThemeMode(mode === "dark" ? "light" : "dark")}>
      {mode === "dark" ? "Light" : "Dark"}
    </button>
  );
}
```

---

## Derived / Computed State

```typescript
const cartStore = new Store({
  items: [] as CartItem[],
  discount: 0,
});

// Derive in selector — computed on read, memoized by useStore
function CartSummary() {
  const totalItems = useStore(cartStore, (s) => s.items.length);
  const subtotal = useStore(cartStore, (s) =>
    s.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  const total = useStore(cartStore, (s) => {
    const sub = s.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return sub * (1 - s.discount);
  });

  return (
    <div>
      <span>{totalItems} items</span>
      <span>Total: ${total.toFixed(2)}</span>
    </div>
  );
}
```

---

## Store Organization

### Single Feature Store

```typescript
// stores/sidebar.ts
import { Store } from "@tanstack/store";

interface SidebarState {
  isOpen: boolean;
  width: number;
  activeSection: string | null;
}

export const sidebarStore = new Store<SidebarState>({
  isOpen: true,
  width: 240,
  activeSection: null,
});

export function toggleSidebar() {
  sidebarStore.setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
}

export function setSidebarWidth(width: number) {
  sidebarStore.setState((prev) => ({ ...prev, width }));
}

export function setActiveSection(section: string | null) {
  sidebarStore.setState((prev) => ({ ...prev, activeSection: section }));
}
```

### File Structure

| Pattern                    | When                            |
| -------------------------- | ------------------------------- |
| `stores/{feature}.ts`      | One store per feature           |
| Export store + action fns   | Keep store and actions together |
| Module-level `new Store()` | Singleton, shared across app   |

---

## State Management Decision Table

| State Type                    | Solution               |
| ----------------------------- | ---------------------- |
| Server data (API responses)   | TanStack Query         |
| Global UI state (theme, sidebar) | TanStack Store      |
| Local UI state (single component) | `useState`         |
| Form state                    | TanStack Form          |
| URL state (search, filters)   | TanStack Router search params |

---

## Store with Persistence

```typescript
const STORAGE_KEY = "app-preferences";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

const preferencesStore = new Store(
  loadFromStorage(STORAGE_KEY, {
    theme: "system" as "light" | "dark" | "system",
    language: "en",
    notifications: true,
  })
);

// Auto-persist on changes
preferencesStore.subscribe(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferencesStore.state));
});
```

---

## TanStack Store vs Zustand

| Aspect            | TanStack Store           | Zustand                     |
| ----------------- | ------------------------ | --------------------------- |
| Size              | ~1kB                     | ~1.5kB                      |
| API               | `new Store()` + selectors| `create()` with hooks       |
| Framework support | Any (React, Vue, Solid)  | React-focused               |
| Middleware        | None (simple by design)  | persist, immer, devtools    |
| DevTools          | TanStack DevTools        | Redux DevTools              |
| Ecosystem fit     | TanStack suite           | Standalone                  |
| Complexity        | Minimal                  | Slightly more features      |

---

## Anti-Patterns

| Anti-Pattern                              | Solution                                     |
| ----------------------------------------- | -------------------------------------------- |
| Storing server data in Store              | Use TanStack Query for server state          |
| Selecting entire state object             | Select specific slices for granular re-renders |
| Mutating state directly                   | Always return new object from `setState`      |
| Creating stores inside components         | Define stores at module level (singleton)     |
| One giant global store                    | Split into feature-specific stores           |
| Storing derived data                      | Compute in selectors, not in state           |
| Using Store for form state                | Use TanStack Form for form management        |

# Tailwind CSS v4

## Utility-First Approach

```tsx
// Compose styles from utilities — no custom CSS needed
<button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
  Save Changes
</button>
```

---

## CSS-First Configuration

Tailwind v4 replaces `tailwind.config.ts` with CSS-based configuration using `@theme`.

```css
/* app.css */
@import "tailwindcss";

@theme {
  --color-brand-50: oklch(0.97 0.01 250);
  --color-brand-500: oklch(0.55 0.2 250);
  --color-brand-600: oklch(0.48 0.2 250);
  --color-brand-700: oklch(0.42 0.2 250);
  --color-brand-900: oklch(0.3 0.15 250);

  --spacing-4\.5: 1.125rem;
  --spacing-18: 4.5rem;

  --font-display: "Satoshi", sans-serif;

  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
  --ease-snappy: cubic-bezier(0.2, 0, 0, 1);

  --animate-fade-in: fade-in 0.2s ease-in-out;
  --animate-slide-up: slide-up 0.3s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### `@source` Directive

Tailwind v4 auto-detects source files, but some paths (e.g., `node_modules`) are excluded by default. Use `@source` to explicitly add them.

```css
@import "tailwindcss";
@source "../node_modules/@my-org/ui-kit/src";
@source "../../packages/shared-styles";

/* Register class names that only exist at runtime (CMS, database) */
@source inline("bg-red-500 text-white font-bold");
```

### `@utility` Directive

Define custom utilities that work with all variants (`hover:`, `dark:`, responsive) — unlike plain CSS classes.

```css
@utility tab-size-* {
  tab-size: --value(--tab-size-*);
}

@utility content-auto {
  content-visibility: auto;
}
```

```tsx
// Custom utilities compose with variants just like built-in ones
<pre className="tab-size-4 dark:tab-size-2">
<div className="content-auto hover:content-auto">
```

### `@variant` Directive

Define custom variants for use with any utility.

```css
@variant pointer-coarse (@media (pointer: coarse));
@variant theme-ocean (&:where([data-theme="ocean"], [data-theme="ocean"] *));
```

```tsx
<button className="px-4 pointer-coarse:px-6 pointer-coarse:py-3">
<div className="bg-white theme-ocean:bg-cyan-50">
```

### Reset and Override Defaults

```css
@import "tailwindcss";

@theme {
  /* Reset all defaults for a category */
  --color-*: initial;

  /* Then define only your custom values */
  --color-primary: oklch(0.55 0.2 250);
  --color-secondary: oklch(0.7 0.1 200);
}
```

### v3 → v4 Configuration Mapping

| v3 (`tailwind.config.ts`)       | v4 (`@theme {}` in CSS)              |
| ------------------------------- | ------------------------------------ |
| `theme.extend.colors`           | `--color-{name}-{shade}`            |
| `theme.extend.spacing`          | `--spacing-{name}`                  |
| `theme.extend.fontSize`         | `--text-{name}`                     |
| `theme.extend.fontFamily`       | `--font-{name}`                     |
| `theme.extend.breakpoints`      | `--breakpoint-{name}`               |
| `theme.extend.animation`        | `--animate-{name}`                  |
| `prefix: "tw"`                  | `@import "tailwindcss" prefix(tw)`  |
| `darkMode: "class"`             | `@custom-variant dark`              |

---

## Container Queries

Built-in container query support — no plugins needed. Use `@container` on the parent and size-based variants on children.

```tsx
<div className="@container">
  <div className="flex flex-col @sm:flex-row @lg:grid @lg:grid-cols-3 gap-4">
    <Card />
  </div>
</div>

// Named containers for nested scenarios
<div className="@container/sidebar">
  <nav className="@sm/sidebar:flex @sm/sidebar:flex-col">{links}</nav>
</div>
```

| Variant             | Min Width | Notes                |
| ------------------- | --------- | -------------------- |
| `@xs:` / `@sm:`     | 20 / 24rem | Small containers    |
| `@md:` / `@lg:`     | 28 / 32rem | Medium containers   |
| `@xl:` / `@2xl:`    | 36 / 42rem | Large containers    |
| `@min-[400px]:`     | Custom     | Arbitrary min-width |
| `@max-sm:` / `@max-[600px]:` | — | Max-width variants |

---

## Responsive Design

| Prefix | Min Width | Target            |
| ------ | --------- | ----------------- |
| (none) | 0px       | Mobile first      |
| `sm:`  | 640px     | Small tablets     |
| `md:`  | 768px     | Tablets           |
| `lg:`  | 1024px    | Laptops           |
| `xl:`  | 1280px    | Desktops          |
| `2xl:` | 1536px    | Large screens     |

```tsx
// Mobile first — base styles apply to all, prefixes add breakpoint overrides
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => <Card key={item.id} item={item} />)}
</div>
```

### Custom Breakpoints

```css
@import "tailwindcss";

@theme {
  --breakpoint-xs: 30rem;
  --breakpoint-2xl: 100rem;
  --breakpoint-3xl: 120rem;
}
```

---

## Dark Mode

```tsx
// Class-based dark mode
<div className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
  <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">Title</h1>
</div>
```

```css
/* Custom dark mode selector (replaces darkMode: "class" in v3 config) */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

---

## Class Merging with `cn()`

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
// Usage: conditional + merge without conflicts
<div className={cn(
  "rounded-lg border px-4 py-2",
  isActive && "border-blue-500 bg-blue-50",
  isDisabled && "cursor-not-allowed opacity-50",
  className, // Allow parent overrides
)} />
```

### Why `cn()` Over Template Literals

| Approach          | Problem                              |
| ----------------- | ------------------------------------ |
| Template literals | `"px-4 px-6"` — both apply, conflict |
| `clsx` only       | Same conflict, no Tailwind awareness |
| `cn()` (twMerge)  | `"px-6"` — later class wins correctly |

---

## Layout Patterns

```tsx
// Flexbox
<div className="flex items-center justify-center">
<div className="flex flex-wrap items-center justify-between gap-4">
<div className="flex flex-col gap-2">

// Grid
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
<div className="grid grid-cols-[240px_1fr] gap-8">
<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
```

### Common Layout Utilities

| Pattern                 | Classes                                    |
| ----------------------- | ------------------------------------------ |
| Center everything       | `flex items-center justify-center`         |
| Sticky header           | `sticky top-0 z-10`                       |
| Full viewport           | `min-h-screen`                             |
| Container with padding  | `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` |
| Truncate text           | `truncate` or `line-clamp-2`              |
| Aspect ratio            | `aspect-video` or `aspect-square`          |

---

## 3D Transform Utilities

```tsx
// Card flip on hover
<div className="group perspective-500">
  <div className="transition-transform duration-500 transform-3d group-hover:rotate-y-180">
    <div className="backface-hidden">Front</div>
    <div className="absolute inset-0 rotate-y-180 backface-hidden">Back</div>
  </div>
</div>
```

| Utility                      | CSS Property                   |
| ---------------------------- | ------------------------------ |
| `rotate-x-*` / `rotate-y-*` | `rotateX()` / `rotateY()`     |
| `perspective-*`              | `perspective`                  |
| `perspective-origin-*`       | `perspective-origin`           |
| `transform-3d`               | `transform-style: preserve-3d`|
| `backface-hidden`            | `backface-visibility: hidden`  |

---

## State Variants

| Variant       | Purpose                               |
| ------------- | ------------------------------------- |
| `hover:`      | Mouse hover                           |
| `focus:`      | Keyboard focus                        |
| `focus-visible:` | Keyboard focus only (not click)    |
| `active:`     | While clicking                        |
| `disabled:`   | Disabled state                        |
| `group-hover:`| When parent `.group` is hovered       |
| `peer-invalid:` | When sibling `.peer` is invalid     |
| `first:`      | First child                           |
| `last:`       | Last child                            |
| `odd:` / `even:` | Alternating children              |
| `not-hover:`  | When NOT hovered                      |
| `not-focus:`  | When NOT focused                      |
| `not-first:`  | Not the first child                   |
| `not-last:`   | Not the last child                    |
| `not-disabled:` | When NOT disabled                   |

```tsx
// Group hover pattern
<div className="group rounded-lg border p-4 hover:border-blue-500">
  <h3 className="text-gray-700 group-hover:text-blue-600">Title</h3>
  <span className="opacity-0 group-hover:opacity-100">→</span>
</div>

// Peer validation pattern
<input className="peer" type="email" required />
<span className="hidden text-red-500 peer-invalid:block">Invalid email</span>

// not-* negation variants — cleaner than :not() pseudo-selectors
<li className="border-b not-last:mb-2 not-first:pt-2">Item</li>
<button className="opacity-50 not-disabled:opacity-100 not-disabled:hover:bg-blue-700">Submit</button>
```

---

## v3 → v4 Migration Notes

| v3 Behavior                       | v4 Change                                  |
| --------------------------------- | ------------------------------------------ |
| `ring` = 3px blue-500             | `ring` = 1px currentColor, use `ring-3`    |
| JS config file required           | CSS-only `@theme` directive                |
| `@apply` for custom utilities     | Still works, prefer utilities directly     |
| `content` config for scanning     | Automatic source detection                 |

---

## Arbitrary Values

```tsx
// When design tokens don't cover the exact value
<div className="top-[117px] grid grid-cols-[1fr_2fr_1fr] bg-[#1a1a2e]">

// Arbitrary variants
<div className="[&>svg]:h-4 [&>svg]:w-4">
<div className="[&:nth-child(3)]:col-span-2">
```

---

## Anti-Patterns

| Anti-Pattern                           | Solution                                     |
| -------------------------------------- | -------------------------------------------- |
| Using `tailwind.config.ts` in v4       | Use `@theme` directive in CSS                |
| `@apply` for everything               | Use utilities directly, `@apply` sparingly   |
| Inline `style={{}}` alongside Tailwind | Use arbitrary values `[value]` instead       |
| Not using `cn()` for conditional classes | Always use `cn()` to avoid class conflicts |
| Hardcoded colors instead of theme      | Define in `@theme` block                     |
| Desktop-first responsive               | Mobile-first: base → `sm:` → `md:` → `lg:`  |
| Too many arbitrary values              | Add to `@theme` if used 3+ times            |
| Ignoring dark mode                     | Add `dark:` variants for all color utilities |
| Long className strings without structure | Group by category: layout, spacing, colors, states |

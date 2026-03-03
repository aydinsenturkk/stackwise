# Motion (formerly Framer Motion)

## Installation

```bash
npm install motion
```

```typescript
// Standard React
import { motion } from "motion/react";

// React Server Components (Next.js etc)
import * as motion from "motion/react-client";
```

---

## Basic Animation

```tsx
import { motion } from "motion/react";

// Animate on mount
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

## Transition Types

| Type     | When                                | Properties                     |
| -------- | ----------------------------------- | ------------------------------ |
| `spring` | Natural movement (default)          | `stiffness`, `damping`, `mass` |
| `tween`  | Linear/eased duration-based         | `duration`, `ease`             |
| `inertia`| Physics-based deceleration          | `velocity`, `power`            |

```tsx
// Spring (bouncy, natural)
<motion.div
  animate={{ scale: 1.1 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
/>

// Tween (predictable timing)
<motion.div
  animate={{ opacity: 1 }}
  transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
/>
```

### Common Spring Presets

| Feel      | Stiffness | Damping | Use Case          |
| --------- | --------- | ------- | ----------------- |
| Snappy    | 400       | 25      | Buttons, toggles  |
| Smooth    | 200       | 20      | Page transitions  |
| Bouncy    | 300       | 10      | Playful elements  |
| Gentle    | 100       | 15      | Background motion |

---

## AnimatePresence (Enter/Exit)

```tsx
import { AnimatePresence, motion } from "motion/react";

function NotificationList({ notifications }: { notifications: Notification[] }) {
  return (
    <AnimatePresence>
      {notifications.map((n) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <NotificationCard notification={n} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

### AnimatePresence Modes

| Mode       | Behavior                                         |
| ---------- | ------------------------------------------------ |
| `"sync"`   | All enter/exit at once (default)                 |
| `"wait"`   | Exit completes before new enters                 |
| `"popLayout"` | Exiting items removed from layout immediately |

```tsx
// Page transitions — wait for exit before enter
<AnimatePresence mode="wait">
  <motion.div key={pathname}>
    <Outlet />
  </motion.div>
</AnimatePresence>
```

### AnimatePresence Rules

- Always provide unique `key` (use item ID, not index)
- Keep `AnimatePresence` outside conditional rendering
- For layout + exit animations, wrap in `LayoutGroup`

```tsx
// Correct: conditional inside AnimatePresence
<AnimatePresence>
  {isVisible && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>

// Layout + exit: wrap in LayoutGroup
<LayoutGroup>
  <motion.ul layout>
    <AnimatePresence>
      {items.map(item => (
        <motion.li layout key={item.id} />
      ))}
    </AnimatePresence>
  </motion.ul>
</LayoutGroup>
```

---

## Variants

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function StaggeredList({ items }: { items: Item[] }) {
  return (
    <motion.ul variants={containerVariants} initial="hidden" animate="visible">
      {items.map((item) => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### Variant Propagation Rules

- Parent `animate` value propagates to children automatically
- Children inherit parent variant names unless overridden
- `staggerChildren` in parent `transition` staggers child animations

---

## Layout Animations

```tsx
// Smooth layout changes (position, size)
<motion.div layout>
  {isExpanded && <ExpandedContent />}
</motion.div>

// Shared layout animation between components
<motion.div layoutId="user-avatar">
  <Avatar src={user.avatar} />
</motion.div>
```

| Prop         | Purpose                                   |
| ------------ | ----------------------------------------- |
| `layout`     | Animate position/size changes             |
| `layoutId`   | Shared animation between mount/unmount    |

---

## Gestures

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  whileFocus={{ boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.5)" }}
>
  Click me
</motion.button>

// Draggable
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300, top: 0, bottom: 200 }}
  dragElastic={0.2}
/>

// Drag axis lock
<motion.div drag="x" dragConstraints={{ left: 0, right: 0 }}>
  Swipe to dismiss
</motion.div>
```

### Gesture Props

| Prop             | Trigger                   |
| ---------------- | ------------------------- |
| `whileHover`     | Mouse enter               |
| `whileTap`       | Mouse down / touch        |
| `whileFocus`     | Element focused           |
| `whileDrag`      | During drag               |
| `whileInView`    | Element enters viewport   |

---

## Scroll-Triggered Animations

```tsx
<motion.section
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.5 }}
>
  Appears on scroll
</motion.section>
```

| Viewport Option | Purpose                                    |
| --------------- | ------------------------------------------ |
| `once`          | Animate only on first enter (default: false)|
| `margin`        | Offset trigger point                       |
| `amount`        | How much must be visible (0-1)             |

---

## useAnimate (Imperative)

```tsx
import { useAnimate } from "motion/react";

function SearchBar() {
  const [scope, animate] = useAnimate();

  const handleError = () => {
    animate(scope.current, { x: [0, -10, 10, -10, 0] }, { duration: 0.3 });
  };

  return <input ref={scope} onInvalid={handleError} />;
}
```

---

## Performance

| Do                                     | Don't                                    |
| -------------------------------------- | ---------------------------------------- |
| Animate `transform` and `opacity`      | Animate `width`, `height`, `top`, `left` |
| Use `layout` for size/position changes | Manually animate dimensions              |
| Add `will-change: transform` for heavy | Animate everything with springs          |
| Use `whileInView` with `once: true`    | Re-trigger animations on every scroll    |
| Keep variants outside component        | Define variants inline (re-creates)      |

---

## Anti-Patterns

| Anti-Pattern                            | Solution                                    |
| --------------------------------------- | ------------------------------------------- |
| Importing from `"framer-motion"`        | Use `"motion/react"` (package renamed)      |
| Animating layout properties directly    | Use `layout` prop instead                   |
| Missing `key` in `AnimatePresence`      | Always provide unique `key` for exit anims  |
| Complex animations without variants     | Use variants for multi-element orchestration|
| `AnimatePresence` without `mode="wait"` for pages | Set `mode="wait"` for route transitions |
| Animation on every re-render            | Use `whileInView` with `once: true`         |
| Excessive motion                        | Respect `prefers-reduced-motion`            |
| `AnimatePresence` inside conditional    | Keep `AnimatePresence` outside, conditional inside |

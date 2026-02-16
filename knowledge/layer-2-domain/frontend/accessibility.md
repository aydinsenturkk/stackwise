# Accessibility (a11y)

## WCAG 2.1 Principles

| Principle      | Description                       |
| -------------- | --------------------------------- |
| Perceivable    | Content available to all senses   |
| Operable       | All functionality via keyboard    |
| Understandable | Clear and predictable             |
| Robust         | Works with assistive technologies |

---

## Semantic HTML

| Do                           | Don't                  |
| ---------------------------- | ---------------------- |
| `<button>` for actions       | `<div>` with click handler |
| `<a href>` for navigation    | `<span>` with click handler |
| `<nav>`, `<main>`, `<aside>` | Generic `<div>` wrappers |
| `<h1>`-`<h6>` hierarchy      | Skip heading levels      |
| `<ul>`, `<ol>` for lists     | `<div>` with bullets     |

---

## ARIA Rules

### When to Use

- Use when no semantic HTML element exists for the purpose
- Use for dynamic content updates
- Use for complex widgets (tabs, modals, menus)
- Never use to override semantic HTML meaning

### Common Patterns

| Pattern        | ARIA                                  |
| -------------- | ------------------------------------- |
| Loading state  | `aria-busy="true"`                    |
| Live updates   | `aria-live="polite"`                  |
| Hidden content | `aria-hidden="true"`                  |
| Required field | `aria-required="true"`                |
| Error message  | `aria-describedby` + `aria-invalid`   |
| Modal dialog   | `role="dialog"` + `aria-modal="true"` |

---

## Keyboard Navigation

### Requirements

- All interactive elements must be focusable
- Visible focus indicator on every focusable element
- Logical tab order matching visual layout
- Escape key closes modals and dropdowns

### Key Mappings

| Key         | Action                  |
| ----------- | ----------------------- |
| Tab         | Move to next focusable  |
| Shift+Tab   | Move to previous        |
| Enter/Space | Activate button/link    |
| Arrow keys  | Navigate within widgets |
| Escape      | Close/cancel            |

---

## Focus Management

| Scenario     | Action                          |
| ------------ | ------------------------------- |
| Modal opens  | Focus first focusable inside    |
| Modal closes | Return focus to trigger element |
| Route change | Focus main content or h1        |
| Error occurs | Focus error message             |

---

## Color and Contrast

| Requirement               | Ratio              |
| ------------------------- | ------------------ |
| Normal text               | 4.5:1 minimum      |
| Large text (18px+)        | 3:1 minimum        |
| UI components             | 3:1 minimum        |
| Don't rely on color alone | Use icons/text too |

---

## Forms

| Requirement     | Implementation                        |
| --------------- | ------------------------------------- |
| Labels          | Associated `<label>` or `aria-label`  |
| Error messages  | Associated with `aria-describedby`    |
| Required fields | `required` attribute or `aria-required` |
| Field groups    | `<fieldset>` + `<legend>`             |

---

## Testing Checklist

- [ ] Keyboard-only navigation works
- [ ] Screen reader announces correctly
- [ ] Color contrast passes
- [ ] Focus visible at all times
- [ ] No content flashing >3Hz
- [ ] Images have alt text
- [ ] Forms have labels
- [ ] Errors are announced

---

## Tools

| Tool           | Purpose                     |
| -------------- | --------------------------- |
| axe DevTools   | Automated testing           |
| WAVE           | Visual accessibility report |
| Lighthouse     | Audit score                 |
| VoiceOver/NVDA | Screen reader testing       |
| Keyboard only  | Manual testing              |

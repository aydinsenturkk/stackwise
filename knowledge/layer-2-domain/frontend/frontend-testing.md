# Frontend Testing

> See Layer 1 testing-philosophy.md for universal testing principles.

## Component Testing

### What to Test in Components

| Do                                     | Don't                                  |
| -------------------------------------- | -------------------------------------- |
| Test rendered output                   | Test internal state variables          |
| Test user interactions                 | Test lifecycle method calls            |
| Test visible behavior                  | Test implementation details            |
| Assert on what the user sees           | Assert on component instance internals |

| Aspect             | Example                                      |
| ------------------ | -------------------------------------------- |
| Rendering          | Does it display correct content?             |
| User interaction   | Does clicking a button trigger the callback? |
| Conditional UI     | Does loading state show spinner?             |
| Error states       | Does error boundary show fallback?           |
| Accessibility      | Does it have correct ARIA attributes?        |

---

## Testing User Interactions

Test interactions the way a real user would perform them.

| Interaction        | Test Approach                           |
| ------------------ | --------------------------------------- |
| Click              | Find element by accessible role, click  |
| Type               | Find input by label, type text          |
| Submit             | Fill form fields, submit form           |
| Navigate           | Click link, verify destination content  |
| Select             | Open dropdown, choose option            |

### Query Priority

Find elements the way a user or assistive technology would find them:

| Priority | Query Method             | Example                    |
| -------- | ------------------------ | -------------------------- |
| 1st      | By role                  | Button, textbox, heading   |
| 2nd      | By label text            | Associated label content   |
| 3rd      | By placeholder           | Input placeholder          |
| 4th      | By text content          | Visible text in element    |
| Last     | By test ID               | `data-testid` (escape hatch) |

---

## Visual Testing

| Aspect                | Purpose                              |
| --------------------- | ------------------------------------ |
| Snapshot testing      | Catch unintended UI changes          |
| Visual regression     | Screenshot comparison across builds  |
| Component stories     | Document and test component variants |

### Snapshot Rules

- Update snapshots intentionally, not blindly
- Keep snapshots small and focused
- Avoid snapshotting frequently changing content

---

## Accessibility Testing

| Level      | Approach                             |
| ---------- | ------------------------------------ |
| Automated  | Run axe or similar on rendered output |
| Manual     | Keyboard navigation, screen reader  |
| Component  | Assert ARIA attributes in tests     |

---

## Frontend Focus Areas

| Area            | Why                                        |
| --------------- | ------------------------------------------ |
| User flows      | Login, checkout, data submission           |
| Edge cases      | Empty states, error states, boundaries     |
| Interactions    | Click, type, submit, navigate              |
| Accessible queries | Find elements the way users find them   |

---

## Principles

- **Accessible queries**: Find elements the way users and assistive technology find them
- **User perspective**: Test what the user sees and does, not internal wiring
- **Visual stability**: Use snapshots and visual regression to catch unintended UI changes

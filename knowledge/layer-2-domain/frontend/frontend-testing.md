# Frontend Testing

See testing-fundamentals in Layer 1 for universal testing principles (pyramid, test quality, naming).

## Testing Pyramid for Frontend

```
       /\       E2E (Few) - Critical user flows
      /  \
     /----\     Integration (Some) - Component interactions
    /      \
   /--------\   Unit (Many) - Business logic, utilities
```

---

## What to Test

| Test                          | Don't Test            |
| ----------------------------- | --------------------- |
| Business logic                | Simple presentational |
| Complex components with logic | UI library components |
| Critical user flows           | Framework internals   |
| Edge cases, error states      | Third-party libraries |

---

## Component Testing

### Test Behavior, Not Implementation

Test what the component does from the user's perspective, not how it works internally.

| Do                                     | Don't                                  |
| -------------------------------------- | -------------------------------------- |
| Test rendered output                   | Test internal state variables          |
| Test user interactions                 | Test lifecycle method calls            |
| Test visible behavior                  | Test implementation details            |
| Assert on what the user sees           | Assert on component instance internals |

### What to Test in Components

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

## Focus Areas

| Area            | Why                                        |
| --------------- | ------------------------------------------ |
| Business logic  | Calculations, transformations, validations |
| User flows      | Login, checkout, data submission           |
| Edge cases      | Empty states, error states, boundaries     |
| Interactions    | Click, type, submit, navigate              |

---

## Principles

- **Test behavior**: Test what the user sees and does, not internal wiring
- **Pyramid distribution**: Many unit, some integration, few E2E
- **Trust the platform**: Don't test framework or library internals
- **Business focus**: Most testing value comes from business logic tests
- **Accessible queries**: Find elements the way users find them

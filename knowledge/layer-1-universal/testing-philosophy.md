# Testing Philosophy

## Testing Pyramid

```
       /\       E2E (Few) - Critical user flows
      /  \
     /----\     Integration (Some) - Component interactions
    /      \
   /--------\   Unit (Many) - Business logic, utilities
```

| Level           | Quantity | Speed  | Scope                 |
| --------------- | -------- | ------ | --------------------- |
| **Unit**        | Many     | Fast   | Single class/function |
| **Integration** | Some     | Medium | Multiple components   |
| **E2E**         | Few      | Slow   | Full system           |

---

## What to Test

| Test                          | Don't Test            |
| ----------------------------- | --------------------- |
| Business logic                | Framework internals   |
| Complex transformations       | Third-party libraries |
| Critical user flows           | Simple getters/setters|
| Edge cases and error states   | Obvious code          |
| State transitions             | Implementation details|
| Validation logic              | UI library components |

---

## Test Quality (FIRST)

| Characteristic  | Description            |
| --------------- | ---------------------- |
| **F**ast        | Runs quickly           |
| **I**solated    | Independent of others  |
| **R**epeatable  | Same result every time |
| **S**elf-Validating | Clear pass/fail    |
| **T**imely      | Written close to code  |

---

## Test Naming

**Pattern:** `should_{expected_behavior}_when_{condition}`

| Good                               | Bad                |
| ---------------------------------- | ------------------ |
| `should_throw_when_order_is_empty` | `test_order`       |
| `should_return_user_when_found`    | `get_user_test`    |
| `should_reject_invalid_email`      | `email_validation` |

---

## Test Data

| Do                     | Don't                  |
| ---------------------- | ---------------------- |
| Use factories/builders | Hardcode test data     |
| Generate unique IDs    | Reuse IDs across tests |
| Isolate test data      | Share between tests    |
| Use meaningful values  | Random gibberish       |

---

## Mocking Rules

| Do                  | Don't                 |
| ------------------- | --------------------- |
| Mock at boundaries  | Mock everything       |
| Mock interfaces     | Mock concrete classes |
| Verify interactions | Over-specify mocks    |
| Keep mocks simple   | Complex mock setup    |

### What to Mock

- External services (APIs, databases, file system)
- Time-dependent operations
- Non-deterministic behavior

### What NOT to Mock

- The unit under test
- Pure functions
- Domain objects and value objects

---

## Code Coverage

| Area               | Target | Priority |
| ------------------ | ------ | -------- |
| Business logic     | 90%+   | High     |
| Application layer  | 80%+   | High     |
| Infrastructure     | 60%+   | Medium   |
| Presentation       | 40%+   | Low      |

Coverage is a guide, not a goal. 100% coverage with bad tests is worse than 70% with good tests.

---

## Anti-Patterns

| Avoid                     | Problem               |
| ------------------------- | --------------------- |
| Test implementation       | Brittle tests         |
| Share state between tests | Flaky tests           |
| Ignore failing tests      | Technical debt        |
| Mock time incorrectly     | Date-related bugs     |
| Test private methods      | Coupling to internals |

---

## Principles

- **Test Behavior, Not Implementation**: Test what it does, not how
- **Pyramid Distribution**: Many unit, some integration, few E2E
- **Trust the Platform**: Don't test framework/library internals
- **Business Focus**: Most value in business logic tests
- **Measure Before Mocking**: Only mock what you must

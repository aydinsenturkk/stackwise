# Backend Testing

> Backend-specific testing patterns organized by DDD layer. See Layer 1 for universal testing principles.

## Test Pyramid

| Level           | Quantity | Speed  | Scope                 |
| --------------- | -------- | ------ | --------------------- |
| **Unit**        | Many     | Fast   | Single class/function |
| **Integration** | Some     | Medium | Multiple components   |
| **E2E**         | Few      | Slow   | Full system           |

## Test by DDD Layer

| Layer              | Test Type          | What to Test                            |
| ------------------ | ------------------ | --------------------------------------- |
| **Domain**         | Unit               | Business logic, entities, value objects |
| **Application**    | Unit + Integration | Use cases, handlers                     |
| **Infrastructure** | Integration        | Repositories, external services         |
| **Presentation**   | E2E                | API endpoints                           |

## Domain Layer Testing

| Do                      | Don't                   |
| ----------------------- | ----------------------- |
| Test all business rules | Test getters/setters    |
| Test state transitions  | Test framework code     |
| Test validation logic   | Mock domain objects     |
| Test edge cases         | Only happy path         |
| Use plain assertions    | Complex test frameworks |

## Application Layer Testing

| Do                                 | Don't                         |
| ---------------------------------- | ----------------------------- |
| Mock infrastructure (repositories) | Use real database             |
| Test orchestration logic           | Test domain logic again       |
| Verify correct calls               | Verify implementation details |
| Test error handling                | Only happy path               |

## Infrastructure Layer Testing

| Do                      | Don't                |
| ----------------------- | -------------------- |
| Use test database       | Mock database        |
| Test repository methods | Test ORM internals   |
| Use test containers     | Shared test database |
| Clean up after tests    | Leave test data      |

## E2E API Testing

| Do                  | Don't               |
| ------------------- | ------------------- |
| Test critical flows | Test every endpoint  |
| Use realistic data  | Use minimal data     |
| Test auth flows     | Skip auth            |
| Run in CI/CD        | Only local           |

## Test Naming

**Pattern:** `should_{expected_behavior}_when_{condition}`

| Good                               | Bad                |
| ---------------------------------- | ------------------ |
| `should_throw_when_order_is_empty` | `test_order`       |
| `should_return_user_when_found`    | `get_user_test`    |
| `should_reject_invalid_email`      | `email_validation` |

## Test Data

| Do                     | Don't                  |
| ---------------------- | ---------------------- |
| Use factories/builders | Hardcode test data     |
| Generate unique IDs    | Reuse IDs across tests |
| Isolate test data      | Share between tests    |
| Use meaningful values  | Random gibberish       |

## Mocking Rules

| Do                  | Don't                 |
| ------------------- | --------------------- |
| Mock at boundaries  | Mock everything       |
| Mock interfaces     | Mock concrete classes |
| Verify interactions | Over-specify mocks    |
| Keep mocks simple   | Complex mock setup    |

## Code Coverage Targets

| Metric               | Target | Priority |
| -------------------- | ------ | -------- |
| Domain layer         | 90%+   | High     |
| Application layer    | 80%+   | High     |
| Infrastructure layer | 60%+   | Medium   |
| Presentation layer   | 40%+   | Low      |

## Anti-Patterns

| Don't                     | Problem               |
| ------------------------- | --------------------- |
| Test implementation       | Brittle tests         |
| Share state between tests | Flaky tests           |
| Ignore failing tests      | Technical debt        |
| Mock time incorrectly     | Date-related bugs     |
| Test private methods      | Coupling to internals |

# Backend Testing

> See Layer 1 testing-philosophy.md for universal testing principles.

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

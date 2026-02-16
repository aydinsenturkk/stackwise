# Validation Patterns

> Framework-agnostic validation patterns for backend applications.

## Validation Layers

| Layer                      | Purpose                        | Where                 |
| -------------------------- | ------------------------------ | --------------------- |
| **DTO (Entry Point)**      | Input shape, basic constraints | Schema validation     |
| **Domain (Business)**      | Business rules, invariants     | Entity methods        |
| **Database (Persistence)** | Data integrity, constraints    | Database schema       |

## Layer Responsibilities

### DTO Validation

| Validates          | Examples                   |
| ------------------ | -------------------------- |
| Required fields    | `title` is required        |
| Data types         | `email` is string          |
| Format constraints | `email` matches pattern    |
| Length limits       | `title` max 200 chars      |
| Enum values        | `status` in allowed values |

### Domain Validation

| Validates            | Examples                          |
| -------------------- | --------------------------------- |
| Business rules       | Order must have at least one item |
| State transitions    | Cannot cancel shipped order       |
| Cross-field rules    | End date must be after start date |
| Aggregate invariants | Total cannot be negative          |

### Database Validation

| Validates         | Examples             |
| ----------------- | -------------------- |
| Uniqueness        | Email must be unique |
| Foreign keys      | Project must exist   |
| Not null          | Required columns     |
| Check constraints | Price > 0            |

## Validation Flow

1. Request arrives at controller
2. DTO validation (schema) - reject if invalid
3. Map to domain object
4. Domain validation (entity) - throw domain exception if invalid
5. Persist to database
6. Database validation (constraints) - throw infrastructure exception if violated

## General Rules

| Do                                   | Don't                        |
| ------------------------------------ | ---------------------------- |
| Define schemas in shared package     | Duplicate validation logic   |
| Validate at entry point first        | Skip DTO validation          |
| Keep business rules in domain        | Put business rules in DTO    |
| Share schemas between client/server  | Use different validators     |
| Return all validation errors         | Return first error only      |
| Use domain exceptions for business rules | Use generic validation error |

## Error Messages

| Do                                    | Don't               |
| ------------------------------------- | ------------------- |
| "Title must be at least 3 characters" | "Invalid title"     |
| "Email format is invalid"             | "Validation failed" |
| "Order must have at least one item"   | "Bad request"       |
| Field-specific messages               | Generic messages    |
| User-friendly language                | Technical jargon    |

## Schema Sharing Strategy

| Location                      | Content                            |
| ----------------------------- | ---------------------------------- |
| Shared schemas package        | Validation schemas (source of truth) |
| API DTOs                      | DTOs derived from schemas          |
| Client forms                  | Form validation from schemas       |

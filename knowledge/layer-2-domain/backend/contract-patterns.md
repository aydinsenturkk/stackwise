# Contract-First Development

**Contracts package is the single source of truth** for types, validation, and API contracts.

> **CRITICAL:** After ANY change in the contracts package, rebuild it before using in backend/frontend.

## Type Flow

| Source              | Consumers            | Method         |
| ------------------- | -------------------- | -------------- |
| Zod Schema          | Backend DTOs         | `createZodDto` |
| Zod Schema          | Frontend Forms       | Direct import  |
| Inferred Types      | All layers           | `z.infer<>`    |
| Generated API Types | Frontend API clients | OpenAPI        |

---

## Package Structure

| Path                                       | Content              |
| ------------------------------------------ | -------------------- |
| `packages/contracts/src/domains/{domain}/` | Domain schemas/types |
| `{domain}.schemas.ts`                      | Zod schemas          |
| `{domain}.types.ts`                        | Inferred types       |
| `shared/`                                  | Cross-domain schemas |

---

## Schema Naming

| Category       | Pattern                       | Example                      |
| -------------- | ----------------------------- | ---------------------------- |
| Base Entity    | `{Entity}Schema`              | `ProjectSchema`              |
| Create Input   | `Create{Entity}Schema`        | `CreateProjectSchema`        |
| Update Input   | `Update{Entity}Schema`        | `UpdateProjectSchema`        |
| Filter Params  | `{Entity}FilterParamsSchema`  | `ProjectFilterParamsSchema`  |
| Query Params   | `{Entity}QueryParamsSchema`   | `ProjectQueryParamsSchema`   |
| With Relations | `{Entity}WithRelationsSchema` | `ProjectWithRelationsSchema` |

---

## Layer Imports

| Layer         | Import                     | From                    |
| ------------- | -------------------------- | ----------------------- |
| Domain Entity | Enum types only            | `@project/contracts`    |
| Repository    | Filter params, Read models | `@project/contracts`    |
| Application   | All needed types           | `@project/contracts`    |
| DTO           | Schemas (createZodDto)     | `@project/contracts`    |
| Controller    | Enum types (Swagger)       | `@project/contracts`    |

---

## DTO Creation

| Do                                  | Don't                       |
| ----------------------------------- | --------------------------- |
| `extends createZodDto(Schema)`      | Define DTO properties       |
| `@ApiSchema({ name: 'InputName' })` | Skip Swagger schema name    |
| Import schema from contracts        | Duplicate schema in DTO     |
| One DTO per schema                  | Multiple schemas in one DTO |

---

## Type Imports

| Do                                   | Don't                         |
| ------------------------------------ | ----------------------------- |
| `import type { X }` for types       | `import { X }` for types     |
| Import from `@project/contracts`     | Define types in entity files  |
| Use inferred types from schemas      | Inline type definitions       |
| Share types via contracts package     | Duplicate types across layers |

---

## Adding New Types

1. Define schema in `packages/contracts/src/domains/{domain}/{domain}.schemas.ts`
2. Export type in `{domain}.types.ts`: `export type X = z.infer<typeof XSchema>`
3. Re-export in `index.ts`
4. Build contracts package
5. Import in backend: `import type { X } from '@project/contracts'`

---

## File Organization

| Pattern         | When                            | Example                |
| --------------- | ------------------------------- | ---------------------- |
| Entity-Centric  | Single entity CRUD, <200 lines  | `project.schemas.ts`   |
| Feature-Centric | Multiple operations, >300 lines | `discovery.schemas.ts` |
| Hierarchical    | Parent-child entities           | Separate folders       |
| Shared          | Used by 3+ domains              | Move to `shared/`      |

---

## Query vs Filter Params

| Type         | Layer     | Contains                    |
| ------------ | --------- | --------------------------- |
| QueryParams  | API layer | page, limit, sort + filters |
| FilterParams | Domain    | status, search, date range  |

---

## Anti-Patterns

| Don't                                | Do                                   |
| ------------------------------------ | ------------------------------------ |
| Define types in entity files         | Import from contracts                |
| Inline type definitions              | Create schema in contracts           |
| Duplicate validation logic           | Single schema, derive DTOs           |
| Skip `type` in import               | Always `import type` for types       |
| Define enums in multiple files       | Single enum in contracts             |

# NestJS Swagger (OpenAPI)

## Setup

```bash
npm install @nestjs/swagger
```

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("My API")
    .setDescription("API description")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("users")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api", app, document, {
    jsonDocumentUrl: "/api-json",
    yamlDocumentUrl: "/api-yaml",
  });

  await app.listen(3000);
  // Swagger UI: http://localhost:3000/api
  // JSON spec:  http://localhost:3000/api-json
}
bootstrap();
```

---

## DTO Decorators

```typescript
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ description: "User name", example: "John", minLength: 1, maxLength: 100 })
  name: string;

  @ApiProperty({ description: "Email address", example: "john@example.com" })
  email: string;

  @ApiProperty({ enum: ["USER", "ADMIN"], enumName: "UserRole", default: "USER" })
  role: string;

  @ApiPropertyOptional({ description: "Profile bio", maxLength: 500 })
  bio?: string;

  @ApiPropertyOptional({ type: [String], example: ["tag1", "tag2"] })
  tags?: string[];
}
```

### Common `@ApiProperty` Options

| Option        | Purpose                              |
| ------------- | ------------------------------------ |
| `description` | Field description in docs            |
| `example`     | Example value                        |
| `enum`        | Allowed values                       |
| `enumName`    | Shared enum reference name           |
| `type`        | Explicit type (`String`, `[String]`) |
| `minimum`     | Min value (numbers)                  |
| `maximum`     | Max value (numbers)                  |
| `minLength`   | Min length (strings)                 |
| `maxLength`   | Max length (strings)                 |
| `default`     | Default value                        |
| `required`    | Override required status             |
| `nullable`    | Allow null value                     |

---

## Controller Decorators

```typescript
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiQuery, ApiBody,
} from "@nestjs/swagger";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  @Post()
  @ApiOperation({ summary: "Create a user" })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: "User created", type: UserResponseDto })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiParam({ name: "id", type: String, description: "User ID" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: "User not found" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: "List users with pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  findAll(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("search") search?: string,
  ) {
    return this.usersService.findAll({ page, limit, search });
  }
}
```

---

## Response DTOs

```typescript
import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: ["USER", "ADMIN"] })
  role: string;

  @ApiProperty()
  createdAt: Date;
}

export class PaginatedResponseDto<T> {
  data: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
```

---

## DocumentBuilder Methods

| Method                     | Purpose                            |
| -------------------------- | ---------------------------------- |
| `.setTitle()`              | API title                          |
| `.setDescription()`       | API description                    |
| `.setVersion()`           | API version                        |
| `.addTag()`               | Group tag                          |
| `.addBearerAuth()`        | JWT bearer security scheme         |
| `.addApiKey()`            | API key security scheme            |
| `.addOAuth2()`            | OAuth2 security scheme             |
| `.addServer()`            | Server URL (staging, production)   |
| `.addSecurityRequirements()` | Global security requirement     |
| `.build()`                | Build the OpenAPI config           |

---

## CLI Plugin (Auto-generate)

```json
// nest-cli.json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ]
  }
}
```

With the CLI plugin enabled, `@ApiProperty()` decorators are auto-generated from TypeScript types and `class-validator` decorators. JSDoc comments become descriptions.

---

## Anti-Patterns

| Anti-Pattern                              | Solution                                       |
| ----------------------------------------- | ---------------------------------------------- |
| No `@ApiResponse` on endpoints            | Document all status codes explicitly            |
| Returning entity directly                 | Use separate response DTOs                      |
| Missing `@ApiTags` on controllers         | Group endpoints with tags                       |
| Not using CLI plugin                      | Enable it to reduce decorator boilerplate       |
| Hardcoded security in every controller    | Use `addBearerAuth()` + `@ApiBearerAuth()`     |
| No `@ApiPropertyOptional` for optionals   | Distinguish required vs optional fields         |
| Swagger running in production             | Guard with environment check or disable         |

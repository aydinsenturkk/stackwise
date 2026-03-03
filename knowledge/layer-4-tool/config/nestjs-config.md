# NestJS Config

## Setup

```bash
npm install @nestjs/config
# For Joi validation:
npm install joi
```

---

## Basic Configuration

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // No need to import in every module
      envFilePath: [".env.local", ".env"], // Priority order
    }),
  ],
})
export class AppModule {}
```

---

## Configuration Factory

```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    name: process.env.DATABASE_NAME || "myapp",
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
});
```

```typescript
// app.module.ts
import configuration from "./config/configuration";

ConfigModule.forRoot({
  isGlobal: true,
  load: [configuration],
}),
```

---

## Using ConfigService

```typescript
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppService {
  constructor(private config: ConfigService) {}

  getDatabaseUrl(): string {
    const host = this.config.get<string>("database.host");
    const port = this.config.get<number>("database.port");
    const name = this.config.get<string>("database.name");
    return `postgresql://${host}:${port}/${name}`;
  }

  getPort(): number {
    return this.config.get<number>("port", 3000); // with default
  }

  getOrFail(): string {
    return this.config.getOrThrow<string>("JWT_SECRET"); // throws if missing
  }
}
```

---

## Namespaced Configuration

```typescript
// config/database.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("database", () => ({
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  name: process.env.DATABASE_NAME || "myapp",
  url: process.env.DATABASE_URL,
}));
```

```typescript
// config/jwt.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("jwt", () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || "1h",
}));
```

```typescript
// app.module.ts
import databaseConfig from "./config/database.config";
import jwtConfig from "./config/jwt.config";

ConfigModule.forRoot({
  isGlobal: true,
  load: [databaseConfig, jwtConfig],
}),
```

```typescript
// Type-safe injection
import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import databaseConfig from "./config/database.config";

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(databaseConfig.KEY)
    private dbConfig: ConfigType<typeof databaseConfig>,
  ) {
    console.log(this.dbConfig.host); // fully typed
  }
}
```

---

## Validation with Joi

```typescript
import * as Joi from "joi";

ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    REDIS_HOST: Joi.string().default("localhost"),
    REDIS_PORT: Joi.number().default(6379),
  }),
  validationOptions: {
    allowUnknown: true,   // Don't fail on extra env vars
    abortEarly: false,    // Report all validation errors
  },
}),
```

### Custom Validation (class-validator)

```typescript
// env.validation.ts
import { plainToInstance } from "class-transformer";
import { IsEnum, IsNumber, IsString, validateSync } from "class-validator";

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
```

```typescript
ConfigModule.forRoot({
  validate,
}),
```

---

## ConfigService Methods

| Method                            | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `get<T>(key, default?)`          | Get config value with optional default|
| `getOrThrow<T>(key)`             | Get value or throw if missing        |
| `get<T>("namespace.key")`        | Access nested/namespaced config      |

---

## forRoot Options

| Option              | Default     | Purpose                              |
| ------------------- | ----------- | ------------------------------------ |
| `isGlobal`          | `false`     | Register globally                    |
| `envFilePath`       | `".env"`    | Path(s) to .env files               |
| `load`              | `[]`        | Configuration factory functions      |
| `validationSchema`  | —           | Joi schema for validation            |
| `validate`          | —           | Custom validation function           |
| `expandVariables`   | `false`     | Enable `${VAR}` expansion in .env    |
| `cache`             | `false`     | Cache environment variables in memory|
| `ignoreEnvFile`     | `false`     | Skip loading .env file               |

---

## Anti-Patterns

| Anti-Pattern                            | Solution                                       |
| --------------------------------------- | ---------------------------------------------- |
| Using `process.env` directly            | Always use `ConfigService` for testability      |
| No validation on startup                | Use Joi or custom `validate` function           |
| Missing required vars discovered at runtime | Validate at startup, fail fast              |
| Not using `isGlobal: true`              | Set global to avoid re-importing per module    |
| Hardcoded config values                 | Move all config to environment variables       |
| Single large config factory             | Use `registerAs()` for namespaced configs      |
| Not using `getOrThrow` for required values | Fail explicitly instead of silent `undefined`|

# class-validator & class-transformer

## Core Concept

Decorator-based validation for TypeScript classes. Used with NestJS `ValidationPipe` to automatically validate incoming DTOs. `class-transformer` converts plain objects to class instances so decorators can be applied.

```bash
npm install class-validator class-transformer
```

---

## NestJS ValidationPipe Setup

```typescript
// main.ts
import { ValidationPipe } from "@nestjs/common";

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip properties without decorators
    forbidNonWhitelisted: true, // Throw on unknown properties
    transform: true,            // Auto-transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true, // Convert query string types
    },
  }),
);
```

### ValidationPipe Options

| Option                   | Default | Purpose                                  |
| ------------------------ | ------- | ---------------------------------------- |
| `whitelist`              | `false` | Remove non-decorated properties          |
| `forbidNonWhitelisted`   | `false` | Throw error on extra properties          |
| `transform`              | `false` | Auto-transform to DTO class instances    |
| `disableErrorMessages`   | `false` | Hide validation details in production    |
| `stopAtFirstError`       | `false` | Return only first error per property     |

---

## Common Decorators

### String Validators

```typescript
import {
  IsString, IsNotEmpty, IsEmail, IsUrl, IsUUID,
  MinLength, MaxLength, Matches, Length, Contains,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, {
    message: "Password must contain uppercase, lowercase, and number",
  })
  password: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsUUID()
  @IsOptional()
  referralId?: string;
}
```

### Number Validators

```typescript
import { IsInt, IsNumber, IsPositive, Min, Max } from "class-validator";

export class PaginationDto {
  @IsInt()
  @Min(1)
  page: number;

  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;
}
```

### Boolean, Date, Enum

```typescript
import { IsBoolean, IsDateString, IsEnum, IsOptional } from "class-validator";

enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export class UpdateUserDto {
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
```

### Array & Nested Validators

```typescript
import {
  IsArray, ArrayMinSize, ArrayMaxSize,
  ValidateNested, IsOptional, Type,
} from "class-validator";
import { Type as TransformType } from "class-transformer";

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true }) // validate each element
  items: string[];

  @ValidateNested()
  @TransformType(() => AddressDto) // class-transformer for nested
  address: AddressDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @TransformType(() => AddressDto)
  alternateAddresses?: AddressDto[];
}
```

---

## Decorator Quick Reference

| Decorator                | Purpose                            |
| ------------------------ | ---------------------------------- |
| `@IsString()`           | Must be string                     |
| `@IsNumber()`           | Must be number                     |
| `@IsInt()`              | Must be integer                    |
| `@IsBoolean()`          | Must be boolean                    |
| `@IsEmail()`            | Valid email                        |
| `@IsUrl()`              | Valid URL                          |
| `@IsUUID()`             | Valid UUID                         |
| `@IsEnum(enum)`         | Must be enum value                 |
| `@IsDateString()`       | ISO date string                    |
| `@IsNotEmpty()`         | Not empty string/array             |
| `@IsOptional()`         | Skip validation if undefined       |
| `@MinLength(n)`         | Minimum string length              |
| `@MaxLength(n)`         | Maximum string length              |
| `@Min(n)`               | Minimum number value               |
| `@Max(n)`               | Maximum number value               |
| `@Matches(regex)`       | Regex match                        |
| `@IsArray()`            | Must be array                      |
| `@ArrayMinSize(n)`      | Minimum array length               |
| `@ValidateNested()`     | Validate nested object             |
| `@Type(() => Cls)`      | Transform to class (class-transformer) |

---

## Custom Validators

```typescript
import {
  registerDecorator, ValidationOptions, ValidationArguments,
} from "class-validator";

function IsAfterDate(property: string, options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isAfterDate",
      target: object.constructor,
      propertyName,
      constraints: [property],
      options,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedField] = args.constraints;
          const relatedValue = (args.object as any)[relatedField];
          return value > relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be after ${args.constraints[0]}`;
        },
      },
    });
  };
}

// Usage
export class DateRangeDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsAfterDate("startDate", { message: "End date must be after start date" })
  endDate: string;
}
```

---

## class-transformer Patterns

```typescript
import { Exclude, Expose, Transform, Type } from "class-transformer";
import { plainToInstance, instanceToPlain } from "class-transformer";

export class UserEntity {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Exclude() // Never include in responses
  password: string;

  @Transform(({ value }) => value.toISOString())
  createdAt: Date;
}

// Plain object → class instance
const user = plainToInstance(UserEntity, rawData);

// Class instance → plain object (respects @Exclude/@Expose)
const plain = instanceToPlain(user);
```

---

## Anti-Patterns

| Anti-Pattern                            | Solution                                       |
| --------------------------------------- | ---------------------------------------------- |
| No `whitelist: true` in ValidationPipe  | Always strip undecorated properties             |
| Validating plain objects directly       | Use `plainToInstance()` first or `transform: true` |
| Missing `@Type()` on nested objects     | Always add `@Type(() => Dto)` for nested DTOs  |
| Using `{ each: true }` without `@IsArray()` | Combine both for array validation         |
| Not using `@IsOptional()` for optionals | Required by default — mark optionals explicitly |
| Custom messages on every decorator      | Use consistent error format via exception filter |
| Importing `Type` from wrong package     | `@Type` from class-transformer, `@IsType` from class-validator |

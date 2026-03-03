# NestJS Throttler

## Setup

```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 60 seconds (milliseconds)
        limit: 10,   // 10 requests per ttl
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply globally
    },
  ],
})
export class AppModule {}
```

---

## Multiple Throttlers

```typescript
ThrottlerModule.forRoot([
  {
    name: "short",
    ttl: 1000,    // 1 second
    limit: 3,
  },
  {
    name: "medium",
    ttl: 10000,   // 10 seconds
    limit: 20,
  },
  {
    name: "long",
    ttl: 60000,   // 1 minute
    limit: 100,
  },
]),
```

All named throttlers are applied simultaneously — a request is blocked if it exceeds **any** of the limits.

---

## Decorators

### Override Limits

```typescript
import { Throttle } from "@nestjs/throttler";

@Controller("auth")
export class AuthController {
  // Stricter limit for login
  @Throttle([{ name: "short", limit: 3, ttl: 60000 }])
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // More lenient for read operations
  @Throttle([{ name: "short", limit: 50, ttl: 60000 }])
  @Get("profile")
  getProfile() {
    return this.authService.getProfile();
  }
}
```

### Skip Throttling

```typescript
import { SkipThrottle } from "@nestjs/throttler";

// Skip all throttling for this controller
@SkipThrottle()
@Controller("health")
export class HealthController {
  @Get()
  check() {
    return { status: "ok" };
  }
}

// Skip specific named throttler
@SkipThrottle({ short: true })
@Controller("reports")
export class ReportsController {
  @Get()
  getReports() {
    return this.reportsService.findAll();
  }
}
```

---

## Async Configuration

```typescript
ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => [
    {
      ttl: config.get("THROTTLE_TTL", 60000),
      limit: config.get("THROTTLE_LIMIT", 10),
    },
  ],
}),
```

---

## Custom Throttler Guard

```typescript
import { Injectable, ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  // Use custom key (e.g., user ID instead of IP)
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ?? req.ip;
  }

  // Skip throttling for certain routes
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return request.url === "/health";
  }
}
```

---

## WebSocket & GraphQL Support

```typescript
// WebSocket throttling
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;
    const client = context.switchToWs().getClient();
    // Use client connection ID as tracker
    const tracker = client.id;
    // ... custom logic
    return true;
  }
}
```

---

## Configuration Options

| Option             | Type     | Default | Purpose                           |
| ------------------ | -------- | ------- | --------------------------------- |
| `ttl`              | `number` | —       | Time window in milliseconds       |
| `limit`            | `number` | —       | Max requests per TTL window       |
| `name`             | `string` | `"default"` | Throttler identifier         |
| `ignoreUserAgents` | `RegExp[]` | `[]`  | Skip for matching user agents     |
| `skipIf`           | `function` | —     | Conditional skip function         |

---

## Anti-Patterns

| Anti-Pattern                           | Solution                                     |
| -------------------------------------- | -------------------------------------------- |
| TTL in seconds instead of milliseconds | v5+ uses milliseconds — multiply by 1000     |
| Same limit for all endpoints           | Use `@Throttle()` for route-specific limits  |
| Not skipping health checks             | Use `@SkipThrottle()` on health endpoints    |
| IP-only tracking behind proxy          | Override `getTracker()` or trust proxy headers|
| Single throttler for all use cases     | Use multiple named throttlers                |
| Missing global guard registration      | Register `ThrottlerGuard` as `APP_GUARD`     |

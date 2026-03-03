# NestJS Cache Manager

## Setup

```bash
npm install @nestjs/cache-manager cache-manager
# For Redis:
npm install cache-manager-redis-yet
```

---

## Basic Configuration

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    CacheModule.register({
      ttl: 5000,       // Default TTL in milliseconds
      isGlobal: true,  // Available throughout the app
    }),
  ],
})
export class AppModule {}
```

### Redis Store

```typescript
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";

CacheModule.register({
  stores: redisStore,
  ttl: 60000,
  namespace: "my-app",
  isGlobal: true,
}),
```

### Multi-Layer Cache (Memory + Redis)

```typescript
import Keyv from "keyv";
import { redisStore } from "cache-manager-redis-yet";

CacheModule.register({
  stores: [
    new Keyv(),                    // Layer 1: in-memory (fastest)
    redisStore({                   // Layer 2: Redis (persistent)
      socket: { host: "localhost", port: 6379 },
    }),
  ],
  ttl: 60000,
  isGlobal: true,
}),
```

---

## Manual Cache Operations

```typescript
import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

@Injectable()
export class UsersService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async findById(id: string) {
    // Check cache first
    const cached = await this.cache.get<User>(`user:${id}`);
    if (cached) return cached;

    // Cache miss — fetch from DB
    const user = await this.db.user.findUnique({ where: { id } });

    // Store in cache with custom TTL
    await this.cache.set(`user:${id}`, user, 30000);

    return user;
  }

  async update(id: string, data: UpdateUserDto) {
    const user = await this.db.user.update({ where: { id }, data });

    // Invalidate cache
    await this.cache.del(`user:${id}`);

    return user;
  }

  async clearAll() {
    await this.cache.reset(); // Reset entire cache
  }
}
```

### Cache Methods

| Method                       | Purpose                          |
| ---------------------------- | -------------------------------- |
| `cache.get<T>(key)`         | Get cached value                 |
| `cache.set(key, value, ttl?)` | Set value with optional TTL    |
| `cache.del(key)`            | Delete specific key              |
| `cache.reset()`             | Clear entire cache               |

---

## Auto-Caching with Interceptor

```typescript
// Global auto-cache for all GET endpoints
import { APP_INTERCEPTOR } from "@nestjs/core";
import { CacheInterceptor } from "@nestjs/cache-manager";

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

```typescript
// Controller-level cache
import { UseInterceptors, CacheInterceptor, CacheTTL, CacheKey } from "@nestjs/cache-manager";

@Controller("products")
@UseInterceptors(CacheInterceptor)
export class ProductsController {
  @Get()
  @CacheTTL(30000) // Override TTL for this endpoint
  findAll() {
    return this.productsService.findAll();
  }

  @Get(":id")
  @CacheKey("product-detail") // Custom cache key
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }
}
```

---

## Async Configuration

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => ({
    ttl: config.get("CACHE_TTL", 60000),
    stores: await redisStore({
      socket: {
        host: config.get("REDIS_HOST", "localhost"),
        port: config.get("REDIS_PORT", 6379),
      },
    }),
  }),
  isGlobal: true,
}),
```

---

## Cache Invalidation Patterns

```typescript
@Injectable()
export class ProductsService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  // Invalidate on write
  async create(data: CreateProductDto) {
    const product = await this.db.product.create({ data });
    await this.cache.del("products:list"); // Invalidate list cache
    return product;
  }

  // Cache-aside pattern
  async findAll() {
    const cacheKey = "products:list";
    const cached = await this.cache.get<Product[]>(cacheKey);
    if (cached) return cached;

    const products = await this.db.product.findMany();
    await this.cache.set(cacheKey, products, 60000);
    return products;
  }
}
```

---

## Anti-Patterns

| Anti-Pattern                            | Solution                                       |
| --------------------------------------- | ---------------------------------------------- |
| No cache invalidation on writes         | Always `del()` related cache keys after mutations |
| Caching user-specific data globally     | Include user ID in cache key                   |
| TTL in seconds instead of milliseconds  | `@nestjs/cache-manager` uses milliseconds      |
| Not using `isGlobal: true`              | Set global to avoid re-importing per module    |
| Caching everything with CacheInterceptor| Only cache stable, read-heavy endpoints        |
| Missing error handling on cache ops     | Cache failures should not break the application|
| No namespace for Redis keys             | Use `namespace` option to avoid key collisions |

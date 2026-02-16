# NestJS Framework

## Module System

### Module Types

| Type               | Purpose                            | Example                        |
| ------------------ | ---------------------------------- | ------------------------------ |
| **Feature Module** | Single bounded context             | `UsersModule`, `OrdersModule`  |
| **Shared Module**  | Common utilities, reused across    | `SharedModule`                 |
| **Core Module**    | Singleton services, imported once  | `CoreModule` (in AppModule)    |
| **Dynamic Module** | Configurable at import time        | `DatabaseModule.forRoot(opts)` |

### Module Structure

```typescript
@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UsersService],  // Only export the public API
})
export class UsersModule {}
```

### Module Rules

| Do                                | Don't                              |
| --------------------------------- | ---------------------------------- |
| Export only the public API        | Export everything                   |
| Import only needed modules        | Import the entire AppModule        |
| One module per bounded context    | One huge module for all features   |
| Use `forRoot`/`forFeature` pattern| Hardcode config in module          |

---

## Dependency Injection

### Provider Types

```typescript
// Class provider (most common)
@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}
}

// Value provider
{ provide: CONFIG_TOKEN, useValue: { apiKey: "..." } }

// Factory provider
{
  provide: CACHE_MANAGER,
  useFactory: (config: ConfigService) => {
    return new CacheManager(config.get("redis"));
  },
  inject: [ConfigService],
}

// Alias provider
{ provide: LOGGER, useExisting: WinstonLogger }
```

### Custom Injection Tokens

```typescript
// tokens.ts
export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
export const NOTIFICATION_SERVICE = Symbol("NOTIFICATION_SERVICE");

// module registration
providers: [
  {
    provide: USER_REPOSITORY,
    useClass: PrismaUserRepository,
  },
]

// injection
constructor(
  @Inject(USER_REPOSITORY)
  private readonly userRepo: UserRepository,
) {}
```

### Injection Scopes

| Scope                   | Lifetime                  | Use When                     |
| ----------------------- | ------------------------- | ---------------------------- |
| **Singleton** (default) | Entire application        | Stateless services           |
| **Request**             | Per HTTP request          | Request-scoped context       |
| **Transient**           | Per injection             | Unique instance each time    |

```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  // New instance per HTTP request
}
```

**Warning:** Request-scoped providers bubble up. If A (singleton) depends on B (request-scoped), A also becomes request-scoped.

---

## Request Pipeline

The execution order for incoming requests:

```
Middleware → Guards → Interceptors (before) → Pipes → Handler → Interceptors (after) → Exception Filters
```

### Guards

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) return false;

    request.user = await this.authService.validateToken(token);
    return true;
  }
}

// Usage
@UseGuards(AuthGuard)
@Controller("users")
export class UsersController {}
```

### Pipes

```typescript
// Validation pipe with Zod DTO
@UsePipes(new ZodValidationPipe())
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}

// Built-in ParseIntPipe for param transformation
@Get(":id")
async findOne(@Param("id", ParseIntPipe) id: number) {
  return this.usersService.findById(id);
}
```

### Interceptors

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`${Date.now() - now}ms`)),
    );
  }
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({ data, timestamp: new Date().toISOString() })),
    );
  }
}
```

### Exception Filters

```typescript
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response.status(exception.statusCode).json({
      statusCode: exception.statusCode,
      message: exception.message,
      error: exception.name,
    });
  }
}
```

---

## Controller Patterns

```typescript
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() query: UserQueryParamsDto) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
```

### Controller Rules

| Do                                       | Don't                                |
| ---------------------------------------- | ------------------------------------ |
| Thin controllers (delegate to services)  | Business logic in controllers        |
| Use proper HTTP status codes             | Return 200 for everything            |
| Use DTOs for input validation            | Access raw `req.body`                |
| Return consistent response shapes        | Mix response formats                 |

---

## Dynamic Modules

```typescript
@Module({})
export class CacheModule {
  static forRoot(options: CacheOptions): DynamicModule {
    return {
      module: CacheModule,
      global: true,
      providers: [
        { provide: CACHE_OPTIONS, useValue: options },
        CacheService,
      ],
      exports: [CacheService],
    };
  }

  static forFeature(prefix: string): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        { provide: CACHE_PREFIX, useValue: prefix },
        ScopedCacheService,
      ],
      exports: [ScopedCacheService],
    };
  }
}

// Usage
@Module({
  imports: [
    CacheModule.forRoot({ ttl: 300, host: "localhost" }),
  ],
})
export class AppModule {}
```

---

## Testing with NestJS

```typescript
describe("UsersService", () => {
  let service: UsersService;
  let repository: UserRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USER_REPOSITORY,
          useValue: {
            findById: vi.fn(),
            save: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(USER_REPOSITORY);
  });

  it("should find user by id", async () => {
    const user = { id: "1", name: "John" };
    vi.mocked(repository.findById).mockResolvedValue(user);

    const result = await service.findById("1");

    expect(result).toEqual(user);
    expect(repository.findById).toHaveBeenCalledWith("1");
  });
});
```

---

## Circular Dependency Solutions

| Solution               | When to Use                        |
| ---------------------- | ---------------------------------- |
| `forwardRef()`         | Quick fix, use sparingly           |
| Event-based decoupling | Preferred for cross-module comms   |
| Extract shared service | When two modules share a concern   |
| Mediator pattern       | Complex multi-module interactions  |

```typescript
// forwardRef (temporary solution)
@Module({
  imports: [forwardRef(() => OrdersModule)],
})
export class UsersModule {}

// Event-based (preferred)
@Injectable()
export class OrdersService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async complete(orderId: string) {
    await this.save(order);
    this.eventEmitter.emit("order.completed", { orderId });
  }
}
```

---

## Anti-Patterns

| Anti-Pattern                          | Solution                                    |
| ------------------------------------- | ------------------------------------------- |
| Business logic in controllers         | Delegate to service layer                   |
| Injecting concrete classes everywhere | Use injection tokens for abstractions       |
| Single module for entire app          | Split into feature modules                  |
| Request-scoped overuse                | Default to singleton, use request scope only when needed |
| Circular module imports               | Use events or extract shared service        |
| Skipping the Testing Module           | Always use `Test.createTestingModule`       |

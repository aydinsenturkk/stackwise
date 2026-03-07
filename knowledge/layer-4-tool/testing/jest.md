# Jest

## Configuration

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.module.ts',
  ],
  coverageThresholds: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  setupFilesAfterSetup: ['<rootDir>/test/setup.ts'],
};

export default config;
```

### Frontend Configuration

```typescript
// jest.config.ts (React)
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterSetup: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(jpg|png|svg)$': '<rootDir>/test/__mocks__/fileMock.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};
```

## Test Structure

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;
    service = new UserService(mockRepo);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = { id: '1', name: 'Alice' };
      mockRepo.findOne.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(result).toEqual(user);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

## Mocking

### jest.fn()

```typescript
const mockFn = jest.fn();
mockFn.mockReturnValue(42);
mockFn.mockReturnValueOnce(1).mockReturnValueOnce(2);
mockFn.mockResolvedValue({ id: '1' });
mockFn.mockRejectedValue(new Error('fail'));
mockFn.mockImplementation((x: number) => x * 2);
```

### jest.mock()

```typescript
// Mock entire module
jest.mock('./email.service');
import { EmailService } from './email.service';
const MockedEmailService = jest.mocked(EmailService);

// Mock with implementation
jest.mock('./config', () => ({
  getConfig: jest.fn().mockReturnValue({ apiUrl: 'http://test' }),
}));

// Partial mock — keep real implementations for some exports
jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  sendEmail: jest.fn(),
}));
```

### jest.spyOn()

```typescript
const spy = jest.spyOn(service, 'validate');
spy.mockReturnValue(true);

expect(spy).toHaveBeenCalledTimes(1);

spy.mockRestore(); // Restore original implementation
```

### Manual Mocks

```
src/
├── services/
│   └── api.service.ts
└── __mocks__/
    └── services/
        └── api.service.ts   # Auto-used when jest.mock('./services/api.service')
```

## Common Matchers

| Matcher | Use Case |
|---------|----------|
| `toBe(value)` | Strict equality (===) |
| `toEqual(value)` | Deep equality (objects/arrays) |
| `toStrictEqual(value)` | Deep equality + undefined properties |
| `toBeTruthy()` / `toBeFalsy()` | Truthiness checks |
| `toBeNull()` / `toBeUndefined()` | Null/undefined checks |
| `toContain(item)` | Array contains / string includes |
| `toContainEqual(obj)` | Array contains object (deep) |
| `toHaveLength(n)` | Array/string length |
| `toMatch(/regex/)` | String regex match |
| `toThrow(Error)` | Function throws |
| `toHaveBeenCalledWith(args)` | Mock called with specific args |
| `toHaveBeenCalledTimes(n)` | Mock call count |
| `toMatchObject(subset)` | Object contains subset |
| `toHaveProperty('key', value)` | Object has property |
| `expect.any(Constructor)` | Matches any instance of type |
| `expect.arrayContaining([])` | Array includes these items |
| `expect.objectContaining({})` | Object includes these keys |

## Async Testing

```typescript
// Async/Await
it('fetches user', async () => {
  const user = await service.getUser('1');
  expect(user.name).toBe('Alice');
});

// Resolves/Rejects
it('resolves with user', async () => {
  await expect(service.getUser('1')).resolves.toEqual({ id: '1', name: 'Alice' });
});

it('rejects with error', async () => {
  await expect(service.getUser('bad')).rejects.toThrow('Not found');
});
```

## Timers

```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('debounces search', () => {
  const search = jest.fn();
  const debounced = debounce(search, 300);

  debounced('query');
  expect(search).not.toHaveBeenCalled();

  jest.advanceTimersByTime(300);
  expect(search).toHaveBeenCalledWith('query');
});
```

## Snapshot Testing

```typescript
it('renders correctly', () => {
  const { container } = render(<UserCard user={mockUser} />);
  expect(container).toMatchSnapshot();
});

// Inline snapshots (auto-updated by Jest)
it('serializes config', () => {
  expect(getDefaultConfig()).toMatchInlineSnapshot(`
    {
      "debug": false,
      "port": 3000,
    }
  `);
});
```

## Testing HTTP (with supertest)

```typescript
import request from 'supertest';

describe('GET /api/users', () => {
  it('returns paginated users', async () => {
    const response = await request(app)
      .get('/api/users')
      .query({ page: 1, limit: 10 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(10);
    expect(response.body.meta.total).toBeGreaterThan(0);
  });

  it('returns 401 without auth', async () => {
    await request(app).get('/api/users').expect(401);
  });
});
```

## Running Tests

```bash
# Run all tests
npx jest

# Watch mode
npx jest --watch

# Run specific file
npx jest src/user/user.service.test.ts

# Run by pattern
npx jest --testPathPattern=user

# With coverage
npx jest --coverage

# Update snapshots
npx jest --updateSnapshot
```

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| `jest.mock()` at test level | Mock leaks to other tests | Mock in `beforeEach`, restore in `afterEach` |
| Not restoring mocks | State leaks between tests | Use `jest.restoreAllMocks()` in `afterEach` |
| Testing implementation details | Brittle tests break on refactor | Test behavior and outputs, not internal calls |
| Snapshot overuse | Meaningless snapshots, rubber-stamp updates | Use snapshots for serializable output, not full component trees |
| `any` in mocks | Loses type safety | Use `jest.Mocked<Type>` and `jest.mocked()` |
| Forgetting `await` on async assertions | Test passes without running assertion | Always `await expect(...).resolves/rejects` |
| Shared mutable test state | Order-dependent tests | Reset state in `beforeEach` |
| Testing third-party code | Wasted effort, already tested | Mock external dependencies, test your logic |

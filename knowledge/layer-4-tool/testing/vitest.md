# Vitest

## Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,                    // No need to import describe, it, expect
    environment: "node",              // or "jsdom" for frontend
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",                 // or "istanbul"
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/**/*.test.ts", "src/**/index.ts"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Frontend Configuration

```typescript
// vitest.config.ts (React)
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    css: true,
  },
});
```

```typescript
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
```

### Monorepo Workspace Configuration

```typescript
// vitest.workspace.ts
export default [
  "apps/*/vitest.config.ts",
  "packages/*/vitest.config.ts",
];
```

---

## Test Structure

```typescript
describe("UsersService", () => {
  let service: UsersService;
  let repository: MockUserRepository;

  beforeEach(() => {
    repository = createMockRepository();
    service = new UsersService(repository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("findById", () => {
    it("should return user when found", async () => {
      const expected = { id: "1", name: "John" };
      repository.findById.mockResolvedValue(expected);

      const result = await service.findById("1");

      expect(result).toEqual(expected);
      expect(repository.findById).toHaveBeenCalledWith("1");
    });

    it("should throw when user not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById("999")).rejects.toThrow(
        "User not found"
      );
    });
  });
});
```

### Setup and Teardown

| Hook          | Runs                                   |
| ------------- | -------------------------------------- |
| `beforeAll`   | Once before all tests in describe      |
| `beforeEach`  | Before each test                       |
| `afterEach`   | After each test                        |
| `afterAll`    | Once after all tests in describe       |

---

## Mocking

### `vi.fn()` - Mock Functions

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue({ id: "1" });
mockFn.mockImplementation((x) => x * 2);

// One-time return
mockFn.mockReturnValueOnce("first").mockReturnValueOnce("second");

// Assertions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
expect(mockFn).toHaveBeenCalledTimes(3);
```

### `vi.mock()` - Module Mocking

```typescript
// Mock entire module
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock with factory (auto-mock all exports)
vi.mock("@/services/email.service");

// Access mocked module
import { apiClient } from "@/lib/api-client";

it("should call API", async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

  const result = await service.getAll();

  expect(apiClient.get).toHaveBeenCalledWith("/users");
});
```

### `vi.spyOn()` - Spy on Methods

```typescript
const spy = vi.spyOn(console, "error").mockImplementation(() => {});

service.doSomething();

expect(spy).toHaveBeenCalledWith("error message");
spy.mockRestore();

// Spy on object method
const spy = vi.spyOn(repository, "save");
spy.mockResolvedValue(savedEntity);
```

---

## Testing Async Code

```typescript
// Async/await
it("should fetch data", async () => {
  const data = await service.fetchData();
  expect(data).toBeDefined();
});

// Rejected promises
it("should handle errors", async () => {
  await expect(service.failingOperation()).rejects.toThrow("Error");
  await expect(service.failingOperation()).rejects.toThrowError(/Error/);
});

// Callbacks (use vi.waitFor)
it("should complete callback", async () => {
  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalled();
  });
});
```

---

## Testing Timers

```typescript
describe("delayed operations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should execute after delay", () => {
    const callback = vi.fn();

    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledOnce();
  });

  it("should handle intervals", () => {
    const callback = vi.fn();

    setInterval(callback, 500);

    vi.advanceTimersByTime(1500);

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("should run all pending timers", () => {
    const callback = vi.fn();
    setTimeout(callback, 5000);

    vi.runAllTimers();

    expect(callback).toHaveBeenCalled();
  });
});
```

---

## Snapshot Testing

```typescript
it("should match snapshot", () => {
  const result = service.generateConfig();
  expect(result).toMatchSnapshot();
});

// Inline snapshot (stored in test file)
it("should match inline snapshot", () => {
  const result = service.formatOutput("test");
  expect(result).toMatchInlineSnapshot(`"formatted: test"`);
});

// Update snapshots: vitest --update or press 'u' in watch mode
```

---

## Common Matchers

| Matcher                           | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `expect(x).toBe(y)`              | Strict equality (===)                |
| `expect(x).toEqual(y)`           | Deep equality                        |
| `expect(x).toBeDefined()`        | Not undefined                        |
| `expect(x).toBeTruthy()`         | Truthy value                         |
| `expect(x).toContain(item)`      | Array/string contains                |
| `expect(x).toHaveLength(n)`      | Array/string length                  |
| `expect(x).toThrow(msg)`         | Function throws                      |
| `expect(x).toMatchObject(obj)`   | Object contains properties           |
| `expect(x).toHaveBeenCalledWith` | Mock called with specific args       |

---

## Running Tests

```bash
# Run all tests
vitest

# Run in watch mode (default in dev)
vitest --watch

# Run once (CI)
vitest run

# Run specific file
vitest run src/services/user.service.test.ts

# Run with coverage
vitest run --coverage

# Run matching pattern
vitest run -t "should create user"

# Run workspace project
vitest --project api
```

---

## Anti-Patterns

| Anti-Pattern                           | Solution                                    |
| -------------------------------------- | ------------------------------------------- |
| Testing implementation details         | Test behavior and outputs                   |
| Shared mutable state between tests     | Reset in `beforeEach`, restore in `afterEach`|
| Not restoring mocks                    | Always call `vi.restoreAllMocks()` in afterEach|
| Over-mocking (mocking everything)      | Only mock external boundaries              |
| Snapshot overuse                       | Use snapshots for stable output only       |
| Forgetting `vi.useRealTimers()`        | Always restore in `afterEach`              |

# Vitest

> **Vitest v4** (current stable). Key breaking changes from v3: `vitest.workspace.ts` replaced by `test.projects`, `poolOptions` removed in favor of top-level `maxWorkers`/`isolate`, Browser Mode is stable and built-in, snapshot format uses backtick quotes with no escaped quotes, verbose reporter outputs a flat list by default.

---

## Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",              // or "jsdom" for frontend
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    maxWorkers: 4,                    // v4: replaces poolOptions.threads.maxThreads
    isolate: true,                    // v4: replaces poolOptions.threads.isolate
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/**/*.test.ts", "src/**/index.ts"],
      thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
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
    setupFiles: ["./tests/setup.ts"], // contains: import "@testing-library/jest-dom/vitest"
    css: true,
  },
});
```

### Monorepo Projects Configuration

In v4, `vitest.workspace.ts` is deprecated. Use `test.projects` in `vitest.config.ts`.

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "./apps/*",       // glob patterns resolve to dirs with their own config
      "./packages/*",
      {
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          maxWorkers: 1,  // sequential for shared resources
        },
      },
    ],
  },
});
```

Run a specific project: `vitest --project unit`.

### Browser Mode

Browser Mode is stable in v4 and built into Vitest (no separate `@vitest/browser` package). Use `test.projects` to run Node and browser tests together:

```typescript
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node-unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "browser-ui",
          include: ["src/**/*.browser.test.ts"],
          browser: {
            enabled: true,
            provider: "playwright",  // or "webdriverio"
            name: "chromium",
            headless: true,
          },
        },
      },
    ],
  },
});
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

  it("should return user when found", async () => {
    const expected = { id: "1", name: "John" };
    repository.findById.mockResolvedValue(expected);
    expect(await service.findById("1")).toEqual(expected);
    expect(repository.findById).toHaveBeenCalledWith("1");
  });

  it("should throw when user not found", async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findById("999")).rejects.toThrow("User not found");
  });
});
```

### Lifecycle Hooks

`beforeAll` / `beforeEach` / `afterEach` / `afterAll` work as expected. In v4, `onTestFinished` and `onTestFailed` now receive the test context as their second argument:

```typescript
import { onTestFinished, onTestFailed } from "vitest";

it("should clean up resources", async () => {
  const resource = await acquireResource();

  onTestFinished((result, ctx) => {
    resource.release();
    console.log(`"${ctx.task.name}" finished: ${result.state}`);
  });

  onTestFailed((result, ctx) => {
    console.error(`"${ctx.task.name}" failed:`, result.errors);
  });

  expect(resource.isReady()).toBe(true);
});
```

---

## Mocking

### `vi.fn()` - Mock Functions

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue({ id: "1" });
mockFn.mockImplementation((x) => x * 2);
mockFn.mockReturnValueOnce("first").mockReturnValueOnce("second");

// Assertions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
expect(mockFn).toHaveBeenCalledTimes(3);
expect(mockFn).toHaveBeenCalledOnce();
expect(mockFn).toHaveBeenCalledExactlyOnceWith("arg1"); // v4
```

### `vi.mock()` - Module Mocking

```typescript
vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("@/services/email.service"); // auto-mock all exports

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
```

---

## Testing Async Code

```typescript
it("should fetch data", async () => {
  const data = await service.fetchData();
  expect(data).toBeDefined();
});

it("should handle errors", async () => {
  await expect(service.failingOperation()).rejects.toThrow("Error");
});

it("should complete callback", async () => {
  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalled();
  });
});
```

---

## Testing Timers

```typescript
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

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
```

---

## Snapshot Testing

In v4, snapshots use backtick quotes and no longer escape internal quotes. Run `vitest --update` to regenerate after upgrading.

```typescript
it("should match snapshot", () => {
  expect(service.generateConfig()).toMatchSnapshot();
});

it("should match inline snapshot", () => {
  expect(service.formatOutput("test")).toMatchInlineSnapshot(`"formatted: test"`);
});
// Update: vitest --update or press 'u' in watch mode
```

---

## Visual Regression Testing

New in v4. Requires Browser Mode.

```typescript
import { page } from "@vitest/browser/context";

it("should match visual baseline", async () => {
  await page.render(<MyComponent variant="primary" />);
  await expect(page.screenshot()).toMatchImageSnapshot();
});

it("should match element screenshot", async () => {
  await page.render(<Card title="Hello" />);
  await expect(page.getByRole("article").screenshot()).toMatchImageSnapshot({
    maxDiffPercentage: 0.01, // tolerance for pixel differences
  });
});
// Update baselines: vitest --update
```

---

## Common Matchers

| Matcher                              | Purpose                        |
| ------------------------------------ | ------------------------------ |
| `expect(x).toBe(y)`                 | Strict equality (===)          |
| `expect(x).toEqual(y)`              | Deep equality                  |
| `expect(x).toBeDefined()`           | Not undefined                  |
| `expect(x).toBeTruthy()`            | Truthy value                   |
| `expect(x).toContain(item)`         | Array/string contains          |
| `expect(x).toHaveLength(n)`         | Array/string length            |
| `expect(x).toThrow(msg)`            | Function throws                |
| `expect(x).toMatchObject(obj)`      | Object contains properties     |
| `expect(x).toHaveBeenCalledWith(…)` | Mock called with specific args |
| `expect(x).toHaveBeenCalledOnce()`  | Mock called exactly once       |

### v4 Matchers

| Matcher                                              | Purpose                               |
| ---------------------------------------------------- | ------------------------------------- |
| `expect(fn).toHaveBeenCalledExactlyOnceWith(…args)`  | Called once AND with exact args        |
| `expect(fn).toHaveBeenCalledAfter(otherFn)`          | Asserts call order (fn after otherFn)  |
| `expect(fn).toHaveBeenCalledBefore(otherFn)`         | Asserts call order (fn before otherFn) |

```typescript
it("should call hooks in order", () => {
  const init = vi.fn();
  const validate = vi.fn();
  const save = vi.fn();

  pipeline.execute();

  expect(init).toHaveBeenCalledBefore(validate);
  expect(validate).toHaveBeenCalledBefore(save);
  expect(save).toHaveBeenCalledExactlyOnceWith(expectedPayload);
});
```

---

## Running Tests

```bash
vitest                  # watch mode (default in dev)
vitest run              # single run (CI)
vitest run --coverage   # with coverage report
vitest run src/services/user.service.test.ts   # specific file
vitest run -t "should create user"             # matching pattern
vitest --project api                           # specific project
vitest --reporter=verbose                      # v4: flat list
vitest --reporter=tree                         # tree view (old verbose)
```

---

## v4 Migration Checklist

| v3                                 | v4                                               |
| ---------------------------------- | ------------------------------------------------ |
| `vitest.workspace.ts`              | `test.projects` in `vitest.config.ts`            |
| `poolOptions.threads.maxThreads`   | `test.maxWorkers`                                |
| `poolOptions.threads.isolate`      | `test.isolate`                                   |
| `@vitest/browser` package          | Built-in `test.browser` (no extra package)       |
| Escaped quotes in snapshots        | Unescaped quotes, backtick format                |
| `onTestFinished(fn)`               | `onTestFinished((result, ctx) => …)`             |
| `onTestFailed(fn)`                 | `onTestFailed((result, ctx) => …)`               |
| `--reporter=verbose` (tree output) | `--reporter=verbose` (flat) or `--reporter=tree` |

After upgrading, run `vitest --update` to regenerate all snapshots.

---

## Anti-Patterns

| Anti-Pattern                            | Solution                                        |
| --------------------------------------- | ----------------------------------------------- |
| Testing implementation details          | Test behavior and outputs                       |
| Shared mutable state between tests      | Reset in `beforeEach`, restore in `afterEach`   |
| Not restoring mocks                     | Always call `vi.restoreAllMocks()` in afterEach |
| Over-mocking (mocking everything)       | Only mock external boundaries                  |
| Snapshot overuse                        | Use snapshots for stable output only            |
| Forgetting `vi.useRealTimers()`         | Always restore in `afterEach`                   |
| Using `vitest.workspace.ts`             | Use `test.projects` in `vitest.config.ts` (v4)  |
| Using `poolOptions` config              | Use top-level `maxWorkers`, `isolate` (v4)      |
| Installing `@vitest/browser` separately | Browser Mode is built-in in v4                  |
| Ignoring snapshot format changes        | Run `vitest --update` after upgrading to v4     |
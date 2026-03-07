# Playwright

## Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('bad@example.com');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
```

## Locators

Prefer role-based and accessible locators. Avoid CSS selectors and XPath.

| Method | Use Case | Priority |
|--------|----------|----------|
| `getByRole('button', { name: 'Submit' })` | Interactive elements | 1st |
| `getByLabel('Email')` | Form inputs | 2nd |
| `getByPlaceholder('Search...')` | Inputs with placeholder | 3rd |
| `getByText('Welcome')` | Static text content | 4th |
| `getByTestId('user-card')` | When no semantic option exists | Last resort |

### Locator Chaining

```typescript
// Narrow scope
const dialog = page.getByRole('dialog');
await dialog.getByRole('button', { name: 'Confirm' }).click();

// Filter
const row = page.getByRole('row').filter({ hasText: 'Alice' });
await row.getByRole('button', { name: 'Edit' }).click();

// nth item
const firstCard = page.getByTestId('product-card').first();
const thirdCard = page.getByTestId('product-card').nth(2);
```

## Actions

```typescript
// Click
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('link', { name: 'Profile' }).click();

// Fill input (clears first)
await page.getByLabel('Name').fill('Alice');

// Type character by character (for autocomplete)
await page.getByLabel('Search').pressSequentially('react', { delay: 100 });

// Select dropdown
await page.getByLabel('Country').selectOption('US');

// Checkbox / Radio
await page.getByLabel('Accept terms').check();
await page.getByLabel('Premium').uncheck();

// File upload
await page.getByLabel('Upload').setInputFiles('test-data/photo.png');

// Keyboard
await page.keyboard.press('Enter');
await page.keyboard.press('Control+a');

// Drag and drop
await page.getByTestId('item-1').dragTo(page.getByTestId('dropzone'));
```

## Assertions

```typescript
// Visibility
await expect(page.getByText('Welcome')).toBeVisible();
await expect(page.getByText('Loading')).toBeHidden();

// Text content
await expect(page.getByRole('heading')).toHaveText('Dashboard');
await expect(page.getByRole('status')).toContainText('3 items');

// Attributes
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.getByLabel('Email')).toHaveValue('user@test.com');
await expect(page.getByRole('link')).toHaveAttribute('href', '/profile');

// URL
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/\/dashboard\?tab=.+/);

// Page title
await expect(page).toHaveTitle('Dashboard - MyApp');

// Count
await expect(page.getByRole('listitem')).toHaveCount(5);

// CSS
await expect(page.getByTestId('alert')).toHaveClass(/error/);
```

## Page Object Model

```typescript
// e2e/pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  readonly emailInput = this.page.getByLabel('Email');
  readonly passwordInput = this.page.getByLabel('Password');
  readonly submitButton = this.page.getByRole('button', { name: 'Sign in' });
  readonly errorMessage = this.page.getByRole('alert');

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// e2e/login.spec.ts
test('successful login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@test.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

## API Testing

```typescript
test('should create user via API', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: { name: 'Alice', email: 'alice@test.com' },
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();
  const user = await response.json();
  expect(user.name).toBe('Alice');
});
```

## Authentication State

```typescript
// Save auth state
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@test.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');

  await page.context().storageState({ path: '.auth/user.json' });
});

// Reuse in tests
// playwright.config.ts
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { storageState: '.auth/user.json' },
    dependencies: ['setup'],
  },
],
```

## Network Interception

```typescript
// Mock API response
await page.route('**/api/users', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: '1', name: 'Alice' }]),
  }),
);

// Modify response
await page.route('**/api/config', async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.featureFlag = true;
  await route.fulfill({ response, json });
});

// Wait for specific request
const responsePromise = page.waitForResponse('**/api/users');
await page.getByRole('button', { name: 'Load' }).click();
const response = await responsePromise;
expect(response.status()).toBe(200);
```

## Visual Regression

```typescript
test('homepage screenshot', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixelRatio: 0.01,
  });
});

// Element screenshot
test('header component', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('banner')).toHaveScreenshot('header.png');
});
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test e2e/login.spec.ts

# Run in headed mode
npx playwright test --headed

# Run specific project
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# Show report
npx playwright show-report

# Update snapshots
npx playwright test --update-snapshots

# Run with UI mode
npx playwright test --ui
```

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| `page.locator('.btn-primary')` | Brittle CSS selectors | Use `getByRole`, `getByLabel`, `getByText` |
| Hard-coded `waitForTimeout(3000)` | Flaky, slow tests | Use `waitForURL`, `waitForResponse`, or auto-waiting assertions |
| Not using `expect` auto-waiting | Manual waits, race conditions | `await expect(locator).toBeVisible()` auto-retries |
| Test interdependence | Order-dependent, flaky | Each test should be fully self-contained |
| Testing third-party UI | Fragile, out of your control | Mock external services with `page.route()` |
| Skipping `webServer` config | Manual server start, CI failures | Configure `webServer` in playwright.config.ts |
| No Page Object Model | Duplicated selectors | Extract page objects for reusable locators |
| Screenshot tests without threshold | Fails on font rendering differences | Set `maxDiffPixelRatio` or `maxDiffPixels` |

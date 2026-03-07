# Storybook

## Story Format (CSF3)

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'destructive'],
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    onClick: { action: 'clicked' },
  },
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'md',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
```

## File Naming

| Convention | Pattern |
|-----------|---------|
| Story file | `ComponentName.stories.tsx` |
| Co-located | Place next to component file |
| Title hierarchy | `'Category/Subcategory/Component'` |

## Args and Controls

```typescript
const meta = {
  component: Input,
  argTypes: {
    // Select dropdown
    type: { control: 'select', options: ['text', 'email', 'password'] },

    // Radio buttons
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },

    // Boolean toggle
    disabled: { control: 'boolean' },

    // Number with range
    maxLength: { control: { type: 'range', min: 1, max: 100 } },

    // Color picker
    color: { control: 'color' },

    // Date picker
    date: { control: 'date' },

    // Text input
    placeholder: { control: 'text' },

    // Hide from controls panel
    onChange: { table: { disable: true } },

    // Action logger
    onSubmit: { action: 'submitted' },
  },
} satisfies Meta<typeof Input>;
```

## Decorators

```typescript
// Story-level decorator
export const WithTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider theme="dark">
        <Story />
      </ThemeProvider>
    ),
  ],
};

// Meta-level decorator (applies to all stories in file)
const meta = {
  component: Card,
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

// Global decorator (.storybook/preview.tsx)
const preview: Preview = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
```

## Play Functions (Interaction Testing)

```typescript
import { within, userEvent, expect } from '@storybook/test';

export const FilledForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Email'), 'user@test.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'password123');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));

    await expect(canvas.getByText('Welcome')).toBeInTheDocument();
  },
};

export const ValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Submit empty form
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));

    await expect(canvas.getByText('Email is required')).toBeVisible();
  },
};
```

## Loaders (Async Data)

```typescript
export const WithUserData: Story = {
  loaders: [
    async () => ({
      user: await fetch('/api/users/1').then((r) => r.json()),
    }),
  ],
  render: (args, { loaded: { user } }) => <UserCard user={user} {...args} />,
};
```

## Parameters

```typescript
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'iphone6' },
    layout: 'fullscreen',
  },
};

export const NoBackground: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// Disable specific addon
export const Simple: Story = {
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
  },
};
```

## MSW Integration (Mock API)

```typescript
import { http, HttpResponse } from 'msw';

export const WithData: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/users', () =>
          HttpResponse.json([
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
          ]),
        ),
      ],
    },
  },
};

export const WithError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/users', () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 }),
        ),
      ],
    },
  },
};
```

## Documentation (MDX)

```mdx
{/* Button.mdx */}
import { Canvas, Meta, Story, Controls } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

A versatile button component supporting multiple variants and sizes.

## Usage

<Canvas of={ButtonStories.Primary} />

## Props

<Controls />

## Variants

<Canvas>
  <Story of={ButtonStories.Primary} />
  <Story of={ButtonStories.Secondary} />
  <Story of={ButtonStories.Destructive} />
</Canvas>
```

## Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
};

export default config;
```

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
};

export default preview;
```

## Running

```bash
# Development
npx storybook dev -p 6006

# Build static
npx storybook build -o storybook-static

# Run interaction tests
npx test-storybook
```

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| One story per component | Misses edge cases | Create stories for each visual state and variant |
| Hardcoded data in stories | Not reusable | Use args and controls for dynamic props |
| Missing `autodocs` tag | No auto-generated docs | Add `tags: ['autodocs']` to meta |
| Stories with real API calls | Flaky, slow, environment-dependent | Use MSW or loaders with mock data |
| No interaction tests | Visual-only verification | Add play functions for user flow testing |
| Importing from barrel files | Slow HMR, circular deps | Import directly from component file |
| Skipping error/loading states | Incomplete coverage | Add stories for loading, error, empty states |
| Global styles not loaded | Components look broken | Import global CSS in `.storybook/preview.ts` |

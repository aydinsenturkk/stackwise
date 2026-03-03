# next-intl

## Setup with Next.js App Router

### 1. Install and Configure Routing

```typescript
// src/i18n/routing.ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de", "fr"],
  defaultLocale: "en",
});
```

### 2. Middleware

```typescript
// src/middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(de|en|fr)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
```

### 3. Request Configuration

```typescript
// src/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

### 4. Layout with NextIntlClientProvider

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 5. next.config.js

```typescript
// next.config.ts
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl({
  // Other Next.js config
});
```

---

## Messages (Translation Files)

```json
// messages/en.json
{
  "HomePage": {
    "title": "Welcome to our app",
    "greeting": "Hello, {name}!"
  },
  "UserProfile": {
    "title": "{firstName}'s profile",
    "membership": "Member since {memberSince, date, short}",
    "followers": "{count, plural, =0 {No followers yet} =1 {One follower} other {# followers}}"
  },
  "Common": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

---

## useTranslations Hook

### Client Components

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("HomePage");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("greeting", { name: "John" })}</p>
    </div>
  );
}
```

### Server Components

```typescript
import { useTranslations } from "next-intl";

export default function ProfilePage() {
  const t = useTranslations("UserProfile");

  return (
    <div>
      <h1>{t("title", { firstName: "John" })}</h1>
      <p>{t("membership", { memberSince: new Date("2023-01-15") })}</p>
      <p>{t("followers", { count: 42 })}</p>
    </div>
  );
}
```

### Non-Component Usage (Server)

```typescript
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("HomePage");

  return {
    title: t("title"),
  };
}
```

---

## ICU Message Format

### Interpolation

```json
{
  "greeting": "Hello, {name}!"
}
```

### Plurals

```json
{
  "items": "{count, plural, =0 {No items} one {# item} other {# items}}"
}
```

### Select (Gender/Category)

```json
{
  "pronoun": "{gender, select, male {He} female {She} other {They}} liked your post"
}
```

### Rich Text

```json
{
  "terms": "By signing up, you agree to our <link>terms</link> and <bold>privacy policy</bold>"
}
```

```typescript
t.rich("terms", {
  link: (chunks) => <a href="/terms">{chunks}</a>,
  bold: (chunks) => <strong>{chunks}</strong>,
});
```

---

## Date and Number Formatting

### Global Formats

```typescript
// src/i18n/request.ts
export default getRequestConfig(async ({ requestLocale }) => {
  return {
    locale,
    messages,
    formats: {
      dateTime: {
        short: { day: "numeric", month: "short", year: "numeric" },
        long: { day: "numeric", month: "long", year: "numeric", weekday: "long" },
      },
      number: {
        currency: { style: "currency", currency: "USD" },
        precise: { maximumFractionDigits: 5 },
      },
    },
  };
});
```

### useFormatter Hook

```typescript
import { useFormatter } from "next-intl";

function PriceDisplay({ amount, date }: { amount: number; date: Date }) {
  const format = useFormatter();

  return (
    <div>
      <p>{format.number(amount, { style: "currency", currency: "USD" })}</p>
      <p>{format.dateTime(date, { dateStyle: "medium" })}</p>
      <p>{format.relativeTime(date)}</p>
      <p>{format.list(["Alice", "Bob", "Charlie"], { type: "conjunction" })}</p>
    </div>
  );
}
```

---

## Routing Strategies

### Prefix-Based (default)

```
/en/about
/de/about
/fr/about
```

### With Domain-Based

```typescript
export const routing = defineRouting({
  locales: ["en", "de"],
  defaultLocale: "en",
  domains: [
    { domain: "example.com", defaultLocale: "en" },
    { domain: "example.de", defaultLocale: "de" },
  ],
});
```

### Locale Navigation

```typescript
import { Link, useRouter, usePathname } from "next-intl";

function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav>
      <Link href="/about">About</Link>

      {/* Switch locale */}
      <Link href={pathname} locale="de">
        Deutsch
      </Link>

      {/* Programmatic navigation */}
      <button onClick={() => router.push("/dashboard")}>Dashboard</button>
    </nav>
  );
}
```

---

## TypeScript Support

```typescript
// global.d.ts
import en from "./messages/en.json";

type Messages = typeof en;

declare global {
  interface IntlMessages extends Messages {}
}
```

This enables autocomplete for all translation keys in `useTranslations`.

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Not wrapping layout with `NextIntlClientProvider` | Client components cannot access translations | Wrap `[locale]/layout.tsx` with provider |
| Importing messages in every component | Large bundles, duplicated data | Load once in layout, pass via provider |
| Hardcoding locale in `getRequestConfig` | Only one language works | Use `requestLocale` parameter dynamically |
| String concatenation for plurals | Broken grammar across languages | Use ICU `{count, plural, ...}` syntax |
| Missing middleware matcher | Locale detection does not run on routes | Configure matcher to cover all paths |
| Not using `getTranslations` in metadata | Cannot translate page titles | Use async `getTranslations` in `generateMetadata` |
| Skipping `global.d.ts` type declaration | No autocomplete for translation keys | Declare `IntlMessages` from message file type |
| Using raw dates/numbers in translations | Inconsistent formatting across locales | Use `useFormatter` or ICU format in messages |

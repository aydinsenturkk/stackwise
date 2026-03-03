# i18next

## Initialization

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)          // Load translations via HTTP
  .use(LanguageDetector)     // Detect user language
  .use(initReactI18next)     // React bindings
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "fr", "de", "es"],
    defaultNS: "common",
    ns: ["common", "auth", "dashboard"],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

export default i18n;
```

### Translation Files Structure

```
locales/
  en/
    common.json
    auth.json
    dashboard.json
  fr/
    common.json
    auth.json
    dashboard.json
```

---

## Namespaces

```typescript
i18n.init({
  ns: ["common", "moduleA", "moduleB"],
  defaultNS: "moduleA",
});

// Access default namespace
i18n.t("myKey"); // key in moduleA

// Access specific namespace
i18n.t("myKey", { ns: "common" });

// Load additional namespace at runtime
await i18n.loadNamespaces("newModule");
```

---

## Interpolation

```json
{
  "greeting": "Hello, {{name}}!",
  "score": "Your score is {{score, number}}",
  "date": "Created on {{date, datetime}}",
  "nested": "Welcome to {{company.name}}"
}
```

```typescript
t("greeting", { name: "John" });           // "Hello, John!"
t("score", { score: 1500.5 });              // "Your score is 1,500.5"
t("nested", { company: { name: "Acme" } }); // "Welcome to Acme"
```

### Format Functions

```typescript
i18n.init({
  interpolation: {
    format(value, format, lng) {
      if (format === "uppercase") return value.toUpperCase();
      if (format === "currency") {
        return new Intl.NumberFormat(lng, {
          style: "currency",
          currency: "USD",
        }).format(value);
      }
      return value;
    },
  },
});
```

```json
{
  "price": "Total: {{amount, currency}}",
  "status": "Status: {{status, uppercase}}"
}
```

---

## Plurals

```json
{
  "item": "{{count}} item",
  "item_other": "{{count}} items",
  "item_zero": "No items",

  "message": "You have {{count}} new message",
  "message_other": "You have {{count}} new messages"
}
```

```typescript
t("item", { count: 0 });  // "No items"
t("item", { count: 1 });  // "1 item"
t("item", { count: 5 });  // "5 items"
```

### Ordinal Plurals

```json
{
  "place_ordinal_one": "{{count}}st place",
  "place_ordinal_two": "{{count}}nd place",
  "place_ordinal_few": "{{count}}rd place",
  "place_ordinal_other": "{{count}}th place"
}
```

```typescript
t("place", { count: 1, ordinal: true });  // "1st place"
t("place", { count: 2, ordinal: true });  // "2nd place"
```

---

## Context

```json
{
  "friend": "A friend",
  "friend_male": "A boyfriend",
  "friend_female": "A girlfriend"
}
```

```typescript
t("friend");                           // "A friend"
t("friend", { context: "male" });      // "A boyfriend"
t("friend", { context: "female" });    // "A girlfriend"
```

---

## Language Detection and Switching

```typescript
// Change language
await i18n.changeLanguage("fr");

// Get current language
const currentLng = i18n.language; // "fr"

// Get resolved language
const resolved = i18n.resolvedLanguage; // "fr"

// Listen for language changes
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});
```

---

## Lazy Loading Namespaces

```typescript
i18n.init({
  partialBundledLanguages: true,
  ns: [], // Start with no namespaces
  backend: {
    loadPath: "/locales/{{lng}}/{{ns}}.json",
  },
});

// Load namespace on demand
async function loadModule(module: string) {
  await i18n.loadNamespaces(module);
  // Now translations are available
}
```

---

## React Integration (react-i18next)

### useTranslation Hook

```typescript
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t, i18n } = useTranslation();
  // With specific namespace
  const { t: tAuth } = useTranslation("auth");

  return (
    <div>
      <h1>{t("greeting", { name: "User" })}</h1>
      <p>{tAuth("loginPrompt")}</p>
      <button onClick={() => i18n.changeLanguage("fr")}>Francais</button>
    </div>
  );
}
```

### Trans Component (HTML in translations)

```json
{
  "description": "Click <1>here</1> to learn more about <3>{{topic}}</3>"
}
```

```typescript
import { Trans } from "react-i18next";

function Info() {
  return (
    <Trans i18nKey="description" values={{ topic: "i18next" }}>
      Click <a href="/learn">here</a> to learn more about <strong>i18next</strong>
    </Trans>
  );
}
```

### Suspense for Loading

```typescript
import { Suspense } from "react";
import { I18nextProvider } from "react-i18next";

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<div>Loading translations...</div>}>
        <MyComponent />
      </Suspense>
    </I18nextProvider>
  );
}
```

---

## TypeScript Typing

```typescript
// i18next.d.ts
import "i18next";
import common from "../locales/en/common.json";
import auth from "../locales/en/auth.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof common;
      auth: typeof auth;
    };
  }
}
```

```typescript
// Fully type-safe translations
const { t } = useTranslation();
t("greeting");         // autocomplete from common.json
t("loginPrompt", { ns: "auth" }); // autocomplete from auth.json
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Hardcoded strings in components | Cannot translate, scattered text | Use `t()` function for all user-facing text |
| Loading all namespaces upfront | Large initial bundle, slow load | Use lazy loading with `loadNamespaces()` |
| Not setting `fallbackLng` | Missing translations show keys | Always set a fallback language |
| Concatenating translated strings | Breaks grammar in other languages | Use interpolation: `t("msg", { name })` |
| Using `t()` outside React lifecycle | Missing context, stale translations | Use `i18n.t()` or pass `t` from hook |
| No TypeScript declaration file | No autocomplete for translation keys | Create `i18next.d.ts` with `CustomTypeOptions` |
| Nesting translations too deeply | Hard to maintain and override | Keep flat structure with namespace separation |
| Not escaping HTML in translations | XSS vulnerability | Use `Trans` component for HTML in translations |

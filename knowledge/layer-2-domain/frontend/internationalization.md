# Internationalization (i18n)

## Key Structure

```
feature.section.key
```

Example: `content.comments.placeholder`

---

## Naming Rules

| Do                              | Don't                            |
| ------------------------------- | -------------------------------- |
| Feature-based grouping          | Generic names (`message`, `label`) |
| Descriptive names (`empty_state`) | Vague names (`text1`)          |
| snake_case for keys             | camelCase or other               |
| Nested structure                | Flat structure with many keys    |

---

## Coverage

Translate **all** user-facing text:

- Labels and headings
- Button text
- Placeholders
- Error messages
- Empty states
- Tooltips
- No hardcoded strings in templates

---

## Usage Pattern

Translation functions take a namespace and a key path to return the localized string.

```
translate('namespace', 'buttons.submit')
translate('namespace', 'form.email_placeholder')
```

Use the translation function for every piece of user-visible text. Never embed raw strings in component templates.

---

## File Organization

```
locales/
  en/
    common.json
    auth.json
    errors.json
  tr/
    common.json
    auth.json
    errors.json
```

### Rules

- One JSON file per feature/domain per locale
- Keep a `common.json` for shared strings (buttons, labels, navigation)
- Keep an `errors.json` for error messages
- Mirror the same file structure across all locales
- Feature-specific translations live in feature-named files

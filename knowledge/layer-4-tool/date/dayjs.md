# Day.js

## Parsing

```typescript
import dayjs from "dayjs";

// Current date/time
const now = dayjs();

// From string (ISO 8601)
const date = dayjs("2024-03-15");
const dateTime = dayjs("2024-03-15T10:30:00Z");

// From Date object
const fromDate = dayjs(new Date());

// From timestamp (milliseconds)
const fromTimestamp = dayjs(1710489000000);

// From Unix timestamp (seconds)
import unix from "dayjs/plugin/unix";
dayjs.extend(unix);
const fromUnix = dayjs.unix(1710489000);
```

### Custom Parse Format

```typescript
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

const date = dayjs("15-03-2024", "DD-MM-YYYY");
const time = dayjs("02:30 PM", "hh:mm A");
const named = dayjs("March 15, 2024", "MMMM DD, YYYY");

// Strict mode
const strict = dayjs("2024-03-15", "YYYY-MM-DD", true);
console.log(strict.isValid()); // true

// Multiple formats
const multi = dayjs("2024-03-15", ["MM-DD-YYYY", "YYYY-MM-DD"]);

// Validation
dayjs("invalid").isValid(); // false
dayjs("2024-03-15").isValid(); // true
```

---

## Formatting

```typescript
dayjs("2024-03-15T10:30:00").format("YYYY-MM-DD");          // "2024-03-15"
dayjs("2024-03-15T10:30:00").format("DD/MM/YYYY");          // "15/03/2024"
dayjs("2024-03-15T10:30:00").format("MMMM DD, YYYY");       // "March 15, 2024"
dayjs("2024-03-15T10:30:00").format("dddd");                 // "Friday"
dayjs("2024-03-15T10:30:00").format("HH:mm:ss");            // "10:30:00"
dayjs("2024-03-15T10:30:00").format("h:mm A");              // "10:30 AM"
dayjs("2024-03-15T10:30:00").format("YYYY-MM-DDTHH:mm:ssZ"); // ISO-like

// Built-in methods
dayjs().toISOString();   // "2024-03-15T10:30:00.000Z"
dayjs().toJSON();        // "2024-03-15T10:30:00.000Z"
dayjs().toString();      // "Fri, 15 Mar 2024 10:30:00 GMT"
dayjs().valueOf();       // 1710489000000 (ms timestamp)
dayjs().unix();          // 1710489000 (seconds)
```

---

## Manipulation

```typescript
// Add and subtract (returns new instance, immutable)
dayjs().add(7, "day");
dayjs().add(1, "month");
dayjs().add(2, "year");
dayjs().subtract(30, "minute");
dayjs().subtract(1, "hour");

// Start/end of unit
dayjs().startOf("month");   // First moment of current month
dayjs().endOf("year");      // Last moment of current year
dayjs().startOf("week");    // Start of current week
dayjs().startOf("day");     // Midnight today

// Set specific values
dayjs().set("year", 2025);
dayjs().set("month", 11);   // December (0-indexed)
dayjs().set("date", 25);
dayjs().set("hour", 14);
dayjs().set("minute", 30);

// Get values
dayjs().year();    // 2024
dayjs().month();   // 2 (0-indexed, March)
dayjs().date();    // 15
dayjs().day();     // 5 (Friday, 0=Sunday)
dayjs().hour();    // 10
dayjs().minute();  // 30
dayjs().second();  // 0
```

---

## Comparison

```typescript
const a = dayjs("2024-03-15");
const b = dayjs("2024-06-20");

a.isBefore(b);              // true
a.isAfter(b);               // false
a.isSame(b);                // false
a.isSame(b, "year");        // true (same year)
a.isSame(b, "month");       // false

// isBetween plugin
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

dayjs("2024-04-15").isBetween(a, b);             // true
dayjs("2024-04-15").isBetween(a, b, "day", "[]"); // inclusive

// Difference
b.diff(a, "day");    // 97
b.diff(a, "month");  // 3
b.diff(a, "year", true); // 0.265... (fractional)

// Min/max
import minMax from "dayjs/plugin/minMax";
dayjs.extend(minMax);

dayjs.min(a, b);   // a (earlier date)
dayjs.max(a, b);   // b (later date)
```

---

## Duration

```typescript
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

// Create duration
const dur = dayjs.duration(2, "hours");
dur.asMinutes();  // 120
dur.hours();      // 2
dur.minutes();    // 0

// From object
const complex = dayjs.duration({ hours: 2, minutes: 30, seconds: 45 });
complex.asSeconds();         // 9045
complex.format("HH:mm:ss"); // "02:30:45"

// From ISO 8601
const iso = dayjs.duration("P1Y2M3DT4H5M6S");
iso.years();   // 1
iso.months();  // 2
iso.days();    // 3

// Duration arithmetic
const d1 = dayjs.duration(2, "hours");
const d2 = d1.add(30, "minutes");    // 2h30m
const d3 = d2.subtract(15, "minutes"); // 2h15m

// Humanize
dur.humanize();       // "2 hours"
dur.humanize(true);   // "in 2 hours"
```

---

## Plugins

### Relative Time

```typescript
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

dayjs("2024-10-17").fromNow();        // "5 months ago"
dayjs("2025-10-19").toNow();          // "in a year"
dayjs("2024-10-17").fromNow(true);    // "5 months" (no suffix)

const a = dayjs("2024-01-15");
const b = dayjs("2024-03-20");
b.from(a);  // "in 2 months"
a.to(b);    // "in 2 months"
```

### UTC and Timezone

```typescript
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

// UTC mode
dayjs.utc("2024-03-15").format(); // "2024-03-15T00:00:00Z"

// Convert to timezone
dayjs.tz("2024-03-15 10:00", "America/New_York");
dayjs().tz("Europe/Berlin").format("HH:mm z");

// Set default timezone
dayjs.tz.setDefault("America/New_York");
```

---

## Locale

```typescript
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/de";

// Set global locale
dayjs.locale("es");
dayjs("2024-03-15").format("MMMM DD, YYYY"); // "marzo 15, 2024"

// Per-instance locale
const frDate = dayjs("2024-03-15").locale("fr");
frDate.format("dddd"); // "vendredi"

// Get current locale
dayjs().locale(); // "es"
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Mutating Day.js objects | Day.js is immutable; mutations are ignored | Assign result: `const next = d.add(1, "day")` |
| Not extending plugins before use | Methods are `undefined` at runtime | Call `dayjs.extend(plugin)` at app init |
| Using `month()` without 0-indexing awareness | Off-by-one month bugs | Remember months are 0-indexed (0=Jan) |
| Parsing ambiguous date strings | Locale-dependent parsing surprises | Use `customParseFormat` with explicit format |
| Setting global locale in components | Side effects across the entire app | Use per-instance `.locale()` for scoped use |
| Not checking `isValid()` after parsing | Silent invalid date propagation | Always validate: `dayjs(input).isValid()` |
| Using `diff()` without unit | Returns milliseconds, often not useful | Specify unit: `b.diff(a, "day")` |
| Loading all locale files | Bloated bundle size | Import only needed locales |

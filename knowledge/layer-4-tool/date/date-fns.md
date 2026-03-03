# date-fns

## Core Imports

```typescript
import {
  format,
  parseISO,
  parse,
  addDays,
  subMonths,
  differenceInDays,
  isAfter,
  isBefore,
  isValid,
} from "date-fns";
```

All functions operate on native `Date` objects and are individually importable for tree-shaking.

---

## Formatting

```typescript
import { format, formatISO, formatDistance, formatRelative } from "date-fns";

const date = new Date(2024, 2, 15, 10, 30, 0); // March 15, 2024

format(date, "yyyy-MM-dd");           // "2024-03-15"
format(date, "dd/MM/yyyy");           // "15/03/2024"
format(date, "MMMM do, yyyy");        // "March 15th, 2024"
format(date, "EEEE");                 // "Friday"
format(date, "HH:mm:ss");            // "10:30:00"
format(date, "h:mm a");              // "10:30 AM"
format(date, "yyyy-MM-dd'T'HH:mm:ss"); // "2024-03-15T10:30:00"

formatISO(date);                      // "2024-03-15T10:30:00-04:00"

// Relative formatting
formatDistance(date, new Date(), { addSuffix: true }); // "about 1 year ago"
formatRelative(date, new Date()); // "last Friday at 10:30 AM"
```

---

## Parsing

```typescript
import { parse, parseISO, isValid } from "date-fns";

// Parse ISO string
const iso = parseISO("2024-03-15T10:30:00Z");

// Parse custom format
const custom = parse("15-03-2024", "dd-MM-yyyy", new Date());
const time = parse("02:30 PM", "hh:mm a", new Date());

// Validation
isValid(parseISO("2024-03-15"));   // true
isValid(parseISO("invalid"));      // false
isValid(parse("31-02-2024", "dd-MM-yyyy", new Date())); // false
```

---

## Add and Subtract

```typescript
import {
  addDays,
  addMonths,
  addYears,
  addHours,
  addMinutes,
  subDays,
  subMonths,
  subYears,
  add,
  sub,
} from "date-fns";

const date = new Date(2024, 2, 15);

addDays(date, 7);      // March 22, 2024
addMonths(date, 1);    // April 15, 2024
addYears(date, 1);     // March 15, 2025
addHours(date, 3);     // March 15, 2024 03:00
subDays(date, 10);     // March 5, 2024
subMonths(date, 2);    // January 15, 2024

// Using duration object
add(date, { years: 1, months: 2, days: 3 });
sub(date, { hours: 5, minutes: 30 });
```

---

## Comparison

```typescript
import {
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isSameMonth,
  isSameYear,
  isWithinInterval,
  compareAsc,
  compareDesc,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  differenceInHours,
  min,
  max,
} from "date-fns";

const a = new Date(2024, 2, 15);
const b = new Date(2024, 5, 20);

isAfter(b, a);          // true
isBefore(a, b);         // true
isEqual(a, a);          // true
isSameDay(a, a);        // true
isSameMonth(a, b);      // false
isSameYear(a, b);       // true

// Difference
differenceInDays(b, a);    // 97
differenceInMonths(b, a);  // 3
differenceInYears(b, a);   // 0

// Within interval
isWithinInterval(new Date(2024, 3, 15), { start: a, end: b }); // true

// Sorting
const dates = [b, a, new Date(2024, 4, 1)];
dates.sort(compareAsc);  // chronological
dates.sort(compareDesc); // reverse chronological

// Min/max
min([a, b]);   // a
max([a, b]);   // b
```

---

## Intervals

```typescript
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachHourOfInterval,
  intervalToDuration,
  isWithinInterval,
  areIntervalsOverlapping,
  clamp,
} from "date-fns";

const interval = {
  start: new Date(2024, 2, 1),
  end: new Date(2024, 2, 7),
};

// Generate array of days
const days = eachDayOfInterval(interval);
// [Mar 1, Mar 2, Mar 3, Mar 4, Mar 5, Mar 6, Mar 7]

// With step
const everyOtherDay = eachDayOfInterval(interval, { step: 2 });
// [Mar 1, Mar 3, Mar 5, Mar 7]

// Duration from interval
const dur = intervalToDuration({
  start: new Date(2024, 0, 1),
  end: new Date(2024, 2, 15),
});
// { years: 0, months: 2, days: 14, hours: 0, ... }

// Check overlap
const interval2 = {
  start: new Date(2024, 2, 5),
  end: new Date(2024, 2, 10),
};
areIntervalsOverlapping(interval, interval2); // true

// Clamp date to interval
clamp(new Date(2024, 2, 10), interval); // Mar 7 (clamped to end)
```

---

## Locale

```typescript
import { format, formatDistance } from "date-fns";
import { fr, de, es, ja } from "date-fns/locale";

const date = new Date(2024, 2, 15);

format(date, "EEEE d MMMM yyyy", { locale: fr });
// "vendredi 15 mars 2024"

format(date, "EEEE d MMMM yyyy", { locale: de });
// "Freitag 15. Marz 2024"

formatDistance(date, new Date(), { locale: es, addSuffix: true });
// "hace aproximadamente 1 ano"

// Locale wrapper helper
const locales: Record<string, Locale> = { fr, de, es, ja };

function localizedFormat(
  date: Date,
  formatStr = "PP",
  localeKey = "en",
): string {
  return format(date, formatStr, {
    locale: locales[localeKey],
  });
}
```

---

## FP Submodule

```typescript
import { addDays, format } from "date-fns/fp";
import { pipe } from "date-fns/fp"; // or lodash/fp

// Curried functions (reversed argument order)
const addFiveDays = addDays(5);
const formatAsISO = format("yyyy-MM-dd");

const result = formatAsISO(addFiveDays(new Date(2024, 2, 15)));
// "2024-03-20"

// Compose transformations
const dates = [
  new Date(2024, 0, 1),
  new Date(2024, 1, 11),
  new Date(2024, 6, 2),
];

const formatted = dates.map(addDays(5)).map(format("d MMMM yyyy"));
// ["6 January 2024", "16 February 2024", "7 July 2024"]
```

---

## Start/End Helpers

```typescript
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

const date = new Date(2024, 2, 15, 10, 30);

startOfDay(date);     // Mar 15, 00:00:00
endOfDay(date);       // Mar 15, 23:59:59.999
startOfWeek(date);    // Mar 10 (Sunday)
startOfWeek(date, { weekStartsOn: 1 }); // Mar 11 (Monday)
startOfMonth(date);   // Mar 1
endOfMonth(date);     // Mar 31
startOfYear(date);    // Jan 1
```

---

## Tree-Shaking

date-fns supports tree-shaking by default. Import only what you need:

```typescript
// Good: only includes format and addDays in bundle
import { format, addDays } from "date-fns";

// Also works from submodules
import { format } from "date-fns/format";
import { addDays } from "date-fns/addDays";
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Importing the entire library | No tree-shaking benefit, large bundle | Import individual functions: `import { format } from "date-fns"` |
| Using `new Date(string)` for parsing | Browser-inconsistent parsing | Use `parseISO()` or `parse()` with explicit format |
| Mutating the original Date object | date-fns returns new Date, but source might be reused | Always use the returned value |
| Not passing locale to `format` | English-only output | Pass `{ locale }` option for multilingual apps |
| Forgetting `addSuffix` in `formatDistance` | Missing "ago"/"in" context | Add `{ addSuffix: true }` for relative strings |
| Using `differenceIn*` with wrong arg order | Negative results | Order is `differenceInDays(later, earlier)` |
| Not validating parsed dates | Silent NaN propagation | Always check `isValid()` after parsing |
| Ignoring `weekStartsOn` option | Wrong week boundaries for non-US locales | Set `weekStartsOn: 1` for Monday-start weeks |

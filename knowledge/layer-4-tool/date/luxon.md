# Luxon

## DateTime Creation

```typescript
import { DateTime } from "luxon";

// Current date/time
const now = DateTime.now();
const utcNow = DateTime.utc();

// From components
const dt = DateTime.local(2024, 3, 15, 10, 30, 0);
const utcDt = DateTime.utc(2024, 3, 15, 10, 30, 0);

// From JavaScript Date
const fromDate = DateTime.fromJSDate(new Date());

// From millisecond timestamp
const fromMillis = DateTime.fromMillis(1710489000000);

// From seconds timestamp
const fromSeconds = DateTime.fromSeconds(1710489000);

// From object
const fromObj = DateTime.fromObject(
  { year: 2024, month: 3, day: 15, hour: 10 },
  { zone: "America/New_York" },
);

// Validation
const invalid = DateTime.fromISO("not a date");
invalid.isValid;         // false
invalid.invalidReason;   // "unparsable"
```

---

## Parsing

### ISO 8601

```typescript
const dt = DateTime.fromISO("2024-03-15T10:30:00-05:00");
const dateOnly = DateTime.fromISO("2024-03-15");

// With zone override
const withZone = DateTime.fromISO("2024-03-15T10:30:00", {
  zone: "America/Los_Angeles",
});
```

### SQL Format

```typescript
const sql = DateTime.fromSQL("2024-03-15 10:30:00");
const sqlDate = DateTime.fromSQL("2024-03-15");
const sqlTz = DateTime.fromSQL("2024-03-15 10:30:00.000 -05:00");
```

### Custom Format

```typescript
const custom = DateTime.fromFormat("05-15-2024", "MM-dd-yyyy");
const withTime = DateTime.fromFormat("2024/03/15 14:30", "yyyy/MM/dd HH:mm");

// Parse with locale
const french = DateTime.fromFormat("mars 2024", "LLLL yyyy", {
  locale: "fr",
});

// Parse with timezone
const withTz = DateTime.fromFormat(
  "2024-03-15 10:30 PST",
  "yyyy-MM-dd HH:mm ZZZ",
  { setZone: true },
);
```

### RFC 2822 and HTTP

```typescript
const rfc = DateTime.fromRFC2822("Tue, 01 Nov 2016 13:23:12 +0630");
const http = DateTime.fromHTTP("Sun, 06 Nov 1994 08:49:37 GMT");
```

---

## Formatting

```typescript
const dt = DateTime.local(2024, 3, 15, 10, 30, 0);

// Preset formats
dt.toISO();                  // "2024-03-15T10:30:00.000-04:00"
dt.toISODate();              // "2024-03-15"
dt.toISOTime();              // "10:30:00.000-04:00"
dt.toSQL();                  // "2024-03-15 10:30:00.000 -04:00"
dt.toHTTP();                 // "Fri, 15 Mar 2024 14:30:00 GMT"
dt.toRFC2822();              // "Fri, 15 Mar 2024 10:30:00 -0400"
dt.toUnixInteger();          // 1710489000

// Custom format tokens
dt.toFormat("yyyy-MM-dd");   // "2024-03-15"
dt.toFormat("MMMM dd, yyyy"); // "March 15, 2024"
dt.toFormat("cccc");          // "Friday"
dt.toFormat("HH:mm:ss");     // "10:30:00"
dt.toFormat("h:mm a");       // "10:30 AM"

// Localized formatting (uses Intl)
dt.toLocaleString(DateTime.DATE_SHORT);  // "3/15/2024"
dt.toLocaleString(DateTime.DATE_MED);    // "Mar 15, 2024"
dt.toLocaleString(DateTime.DATE_FULL);   // "March 15, 2024"
dt.toLocaleString(DateTime.DATETIME_SHORT); // "3/15/2024, 10:30 AM"
dt.toLocaleString(DateTime.TIME_SIMPLE); // "10:30 AM"

// Relative formatting
dt.toRelative();             // "5 months ago"
dt.toRelativeCalendar();     // "5 months ago"
```

---

## Manipulation

```typescript
const dt = DateTime.local(2024, 3, 15, 10, 30, 0);

// Plus and minus (immutable, returns new instance)
dt.plus({ days: 7 });                // March 22, 2024
dt.plus({ months: 1, days: 5 });     // April 20, 2024
dt.minus({ hours: 3, minutes: 30 }); // March 15, 07:00
dt.minus({ years: 1 });              // March 15, 2023

// Start/end of unit
dt.startOf("month");   // March 1, 00:00
dt.endOf("month");     // March 31, 23:59:59.999
dt.startOf("week");    // Monday of current week
dt.startOf("day");     // Midnight
dt.startOf("year");    // January 1

// Set specific values
dt.set({ year: 2025, month: 12 });
dt.set({ hour: 14, minute: 0, second: 0 });

// Access components
dt.year;      // 2024
dt.month;     // 3 (1-indexed, unlike JS Date)
dt.day;       // 15
dt.hour;      // 10
dt.minute;    // 30
dt.weekday;   // 5 (1=Monday, 7=Sunday, ISO)
dt.ordinal;   // 75 (day of year)
dt.daysInMonth; // 31
```

---

## Duration

```typescript
import { Duration } from "luxon";

// Create duration
const dur = Duration.fromObject({ hours: 2, minutes: 30 });
const isoD = Duration.fromISO("PT2H30M");
const milliD = Duration.fromMillis(9000000);

// Access components
dur.hours;    // 2
dur.minutes;  // 30
dur.as("minutes"); // 150
dur.as("seconds"); // 9000

// Arithmetic
dur.plus({ minutes: 15 });   // 2h45m
dur.minus({ hours: 1 });     // 1h30m
dur.negate();                 // -2h30m

// Normalize (shift overflow)
Duration.fromObject({ minutes: 90 }).shiftTo("hours", "minutes");
// { hours: 1, minutes: 30 }

// Format
dur.toFormat("hh:mm");       // "02:30"
dur.toISO();                 // "PT2H30M"
dur.toHuman();               // "2 hours, 30 minutes"
```

---

## Interval

```typescript
import { Interval, DateTime } from "luxon";

const start = DateTime.local(2024, 3, 1);
const end = DateTime.local(2024, 3, 15);

// Create interval
const interval = Interval.fromDateTimes(start, end);

// From ISO
const isoInterval = Interval.fromISO("2024-03-15T10:00:00/PT2H");

// Properties
interval.length("days");     // 14
interval.length("hours");    // 336
interval.start;              // DateTime
interval.end;                // DateTime

// Checks
interval.contains(DateTime.local(2024, 3, 10)); // true
interval.isValid;            // true

// Operations
const other = Interval.fromDateTimes(
  DateTime.local(2024, 3, 10),
  DateTime.local(2024, 3, 20),
);

interval.overlaps(other);    // true
interval.intersection(other); // Mar 10 - Mar 15
interval.union(other);       // Mar 1 - Mar 20

// Split
interval.splitBy({ days: 7 }); // [Mar 1-8, Mar 8-15]
interval.divideEqually(3);     // 3 equal intervals
```

---

## Timezone Handling

```typescript
const dt = DateTime.now();

// Convert to another timezone
const tokyo = dt.setZone("Asia/Tokyo");
const london = dt.setZone("Europe/London");
const utc = dt.toUTC();

// Create in specific timezone
const nyTime = DateTime.fromObject(
  { year: 2024, month: 3, hour: 10 },
  { zone: "America/New_York" },
);

// Timezone info
dt.zoneName;          // "America/New_York"
dt.offset;            // -240 (minutes from UTC)
dt.offsetNameShort;   // "EDT"
dt.offsetNameLong;    // "Eastern Daylight Time"
dt.isInDST;          // true/false

// Keep local time, change zone interpretation
dt.setZone("Europe/London", { keepLocalTime: true });
```

---

## Locale

```typescript
const dt = DateTime.local(2024, 3, 15, 10, 30, 0);

// Set locale per-instance
dt.setLocale("fr").toLocaleString(DateTime.DATE_FULL);
// "15 mars 2024"

dt.setLocale("de").toLocaleString(DateTime.DATE_FULL);
// "15. Marz 2024"

dt.setLocale("ja").toLocaleString(DateTime.DATE_FULL);
// "2024年3月15日"

// Set default locale
import { Settings } from "luxon";
Settings.defaultLocale = "fr";

// Relative with locale
dt.setLocale("es").toRelative(); // "hace 5 meses"
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Using `DateTime.local()` for UTC | Creates local timezone DateTime | Use `DateTime.utc()` for UTC |
| Ignoring `isValid` after parsing | Silent invalid DateTime propagation | Always check `.isValid` and `.invalidReason` |
| Mutating DateTime objects | Luxon is immutable; methods return new instances | Assign the result: `const next = dt.plus(...)` |
| Using month index 0-based | Luxon months are 1-indexed (unlike JS Date) | `DateTime.local(2024, 3, 15)` = March 15 |
| Not using `shiftTo` on Duration | Components overflow (e.g., 90 minutes) | Use `dur.shiftTo("hours", "minutes")` |
| String formatting for machine consumption | Fragile, locale-dependent | Use `.toISO()`, `.toSQL()`, or `.toUnixInteger()` |
| Creating DateTime for each comparison | Unnecessary overhead | Create once, reuse reference |
| Not specifying zone in `fromObject` | Assumes local timezone, ambiguous | Pass `{ zone }` option when timezone matters |

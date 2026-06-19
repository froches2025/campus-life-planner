# Campus Life Planner

A responsive, accessible web application for managing student tasks and activities, built with vanilla HTML, CSS, and JavaScript.
A tool for students to log and track everything that takes up their time on campus, from assignments and exams to gym sessions, meals, and club meetings. The goal is a clear picture of the week ahead so you can plan intentionally instead of reacting to deadlines.

## Features

### Core Functionality

- **Task Management:** Add, edit, and delete tasks with a title, due date, duration in minutes, and tag
- **Dashboard Analytics:** Four stat cards plus a 7-day activity trend chart
- **Tag Organisation:** Organise tasks by tag (Academics, Social, Health, Personal, Club, Other); add and remove tags in Settings
- **Search & Filter:** Live regex-powered search with `@tag:` prefix support and match highlighting
- **Data Persistence:** Auto-save to localStorage on every change, with JSON import and export
- **Responsive Design:** Mobile card layout below 768px, desktop table layout above

### Advanced Features

- **7-Day Trend Chart:** Bar chart of tasks created per day over the last week, built from `createdAt` timestamps
- **Weekly Hour Cap:** Set a target, see a progress bar fill up, and get a live warning with percentage when you go over
- **Real-time Validation:** Five regex rules with instant inline feedback, including a duplicate-word back-reference warning
- **Duration Display Toggle:** Switch between raw minutes and formatted hours and minutes across all views
- **Accessibility:** Full keyboard navigation, ARIA live regions, screen reader labels, and skip-to-content link

## 🔧 Setup & Installation

Clone the repository:

```bash
git clone https://github.com/froches2025/campus-life-planner.git
cd campus-life-planner
```

Open in browser:

```bash
# Option 1
python3 -m http.server 8000

# Option 2
# Use the VS Code Live Server extension
```

Then open `localhost:8000` in your browser.

## Testing

Run the test suite by opening `tests.html` through a local server (`localhost:8000/tests.html`). Tests run automatically on load and verify:

- Title regex (leading/trailing whitespace, duplicate words)
- Duration regex (positive numbers, decimal limits)
- Date regex (format, valid month/day ranges, calendar validity)
- Tag regex (letters only, single separators)

## Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| Default (mobile) | Card layout, stacked nav |
| 768px and up | Table layout, font size bump |
| 1024px and up | Max-width 1200px, centred |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next interactive element |
| Shift+Tab | Move to previous interactive element |
| Enter / Space | Activate focused button or link |
| Arrow keys | Navigate radio button group in Settings |
| Tab (page load) | Reveals skip-to-content link |

## Regex Catalog

### Validation Patterns

| Field | Pattern | Notes |
|---|---|---|
| Title | `^\S(?:.*\S)?$` | Rejects leading/trailing whitespace |
| Duplicate words | `\b(\w+)\s+\1\b` | Back-reference; warns but does not block |
| Duration | `^(0\|[1-9]\d*)(\.\d{1,2})?$` | Non-negative, max two decimal places |
| Date | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` | YYYY-MM-DD; also validated with `new Date()` |
| Tag | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` | Letters only, single spaces or hyphens |

### Search Patterns

| Pattern | Purpose |
|---|---|
| `@tag:\w+` | Filter by tag from the search bar (e.g. `@tag:Health`) |
| Any valid regex | Full regex search across title, tag, date, and duration fields |

## Accessibility Features

- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Skip-to-content link as the first element in the page
- ARIA live regions: form errors (`assertive`), form success and search status (`polite`), cap status (two separate permanent `polite`/`assertive` elements)
- `aria-labelledby` on every section
- `aria-invalid` updated on form inputs in real time during validation
- `aria-label` on all action buttons (e.g. "Edit Morning run", "Delete Club orientation meeting")
- `tabindex="-1"` on the Records heading for programmatic focus after the last record is deleted
- Import file input triggered by a keyboard-accessible `<button>` — no `display:none` on interactive elements
- Over-cap state uses color plus a `Warning:` text prefix, not color alone (WCAG SC 1.4.1)
- WCAG AA contrast on all text (4.5:1 body, 3:1 large text)

## Architecture

### File Structure

```
campus-life-planner/
├── index.html              # App shell, all sections, form markup
├── styles/
│   └── main.css            # All styles, mobile-first
├── scripts/
│   ├── main.js             # Entry point (imports ui.js)
│   ├── state.js            # In-memory record store, CRUD, localStorage sync
│   ├── storage.js          # localStorage read/write, settings, seed detection
│   ├── ui.js               # All DOM wiring: form, records, search, sort, settings
│   ├── validators.js       # Regex-based field validators
│   ├── search.js           # compileRegex(), highlight(), filterRecords()
│   └── stats.js            # Pure calculation functions — no DOM
├── tests.html              # Standalone browser test suite
├── seed.json               # 12 sample records loaded on first run
├── docs/
│   └── planning.md         # Original spec, data model, a11y plan
└── README.md               # This file
```

### Module Organisation

- **state.js:** Record array, CRUD operations, `nextId` derived from stored IDs, auto-save on every mutation
- **storage.js:** `loadRecords`, `saveRecords`, `loadSettings`, `saveSettings`, `hasStoredRecords`
- **validators.js:** One exported function per field, each returns `{ valid, message }`
- **search.js:** `compileRegex` wraps `new RegExp` in a try-catch; `filterRecords` falls back to unfiltered on invalid patterns
- **stats.js:** `getTotalCount`, `getTotalDurationMinutes`, `formatDuration`, `getTopTag`, `getLast7DaysTrend`, `getUpcomingWeekMinutes` — pure functions, no DOM
- **ui.js:** Imports from all other modules; owns all DOM interaction and event listeners

## Deployment

Deployed on GitHub Pages: [https://froches2025.github.io/campus-life-planner/](https://froches2025.github.io/campus-life-planner/)

## Sample Data

`seed.json` contains 12 records covering:

- Due dates in the past, today/tomorrow, and months ahead
- Durations from 5 minutes to 4 hours, including a decimal value
- All six tags used at least once
- A title that triggers the duplicate-word warning
- `createdAt` timestamps spread across the last 7 days so the trend chart has visible bars on first load

## Demo Video

[https://youtu.be/QDrEQYXTc2w](https://youtu.be/QDrEQYXTc2w)

## Developer

Favour Michael

- GitHub: [froches2025](https://github.com/froches2025)
- Email: f.michael@alustudent.com

## 📄 License

Created for educational purposes as part of a summative assignment.

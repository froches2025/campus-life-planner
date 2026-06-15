## Theme and Purpose
This is the Campus Life Planner Web App. The purpose of this platform is to help myself and my fellow students effectively plan our lives on campus. From tracking tasks, calculating time spent on different activities, assignments, meals, etc. This theme seems like the best option for me to work on because I struggle a lot with organizing and planning my daily life as a student. Features of the Campus Life Planner include a records table, regex-powered search, stats dashboard, localStorage persistence, and JSON import/export.

## Wireframes
Wireframe screenshots are located in the `/wireframes` folder.

- `image1.png` – App shell and navigation
- `image2.png` – Dashboard / Stats and About
- `image3.png` – Records Table
- `image4.png` – Add/Edit Form and Settings

## Data Model
id          → string, format "task_0001", auto-incremented
title       → string, the task or event name
dueDate     → string, YYYY-MM-DD
duration    → number, stored always in minutes
tag         → string, one of the defined tag categories
createdAt   → string, ISO 8601 timestamp, set once at creation
updatedAt   → string, ISO 8601 timestamp, updated on every edit

## Regex Catalog

### 1. Title validation
**Pattern:** `^\S(?:.*\S)?$`
**Purpose:** Title must not start or end with whitespace
**Pass:** `Submit assignment`
**Fail:** `" Submit"` (leading space)

### 2. Duration validation
**Pattern:** `^(0|[1-9]\d*)(\.\d{1,2})?$`
**Purpose:** Duration must be a non-negative number with at most 2 decimal places
**Pass:** `90`, `1.5`, `0`
**Fail:** `-5`, `1.555`, `abc`

### 3. Date validation
**Pattern:** `^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$`
**Purpose:** Date must follow YYYY-MM-DD format with valid month and day ranges
**Pass:** `2025-09-15`
**Fail:** `2025-13-01`, `15-09-2025`

### 4. Tag validation
**Pattern:** `^[A-Za-z]+(?:[ -][A-Za-z]+)*$`
**Purpose:** Tag must contain only letters, spaces, or hyphens
**Pass:** `Campus Life`, `Self-Care`
**Fail:** `Club@ALU`, `123Health`

### 5. Duplicate word detection (back-reference)
**Pattern:** `\b(\w+)\s+\1\b`
**Purpose:** Catches repeated words in a title (e.g. accidental double typing)
**Pass:** `Submit assignment` (no duplicate)
**Fail:** `Submit Submit assignment` (triggers warning)

### 6. Tag-prefix search (advanced)
**Pattern:** `^@tag:\w+`
**Purpose:** Lets users filter records by tag directly in the search bar
**Pass:** `@tag:Health`
**Fail:** `@tagHealth`, `@tag:` (no word after colon)


## A11y plan (Accessibility) 
- HTML landmarks such as ```<header>, <nav>, <main>, <section>, <footer>``` will be used for structuring the page.
- ARIA live regions will be embedded in the form error messages, any status confirmations after adding or deleting, warnings on the dashboard, etc.
- Keyboard navigation would work like this: Tab moves through nav links -> form fields -> table actions; Enter submits; Escape cancels an edit
- A skip-to-content link is placed as the first element in the body
- Focus goes to next row when a record is deleted
- All text and interactive elements will meet WCAG AA contrast ratio (minimum 4.5:1 for body text, 3:1 for large text).


## Page/Section List
- About: Describes the app's purpose and the developer's contact details (GitHub and email).
- Dashboard / Stats: Shows them their relevant stats
- Records Table: Displays all tasks with live regex search, column sorting, and inline edit/delete actions.
- Add/Edit Form: Enables user to add items or activities
- Settings: Lets the user set duration display preference (minutes or hours), manage tags, set the weekly hour cap, and import/export records as JSON.

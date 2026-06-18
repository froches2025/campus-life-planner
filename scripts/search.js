// compile a regex pattern with optional case-insensitive flag
// adapted from assignment starter snippets
export function compileRegex(pattern, caseInsensitive = false) {
  try {
    const flags = caseInsensitive ? 'i' : '';
    return new RegExp(pattern, flags);
  } catch (e) {
    // if pattern is invalid, return null
    return null;
  }
}

// highlight matches in text using regex
// adapted from assignment starter snippets
export function highlight(text, regex) {
  if (!regex) return text;
  // use g flag for highlighting to replace all occurrences
  const globalRegex = new RegExp(regex.source, (regex.flags || '') + (regex.flags?.includes('g') ? '' : 'g'));
  return text.replace(globalRegex, (match) => `<mark>${match}</mark>`);
}

// build a searchable string from a record's fields
function buildSearchString(record) {
  const parts = [
    record.title,
    `@tag:${record.tag}`,
    record.dueDate,
    String(record.duration),
  ];
  return parts.join(' ');
}

// filter records based on search pattern
export function filterRecords(records, pattern, caseInsensitive = true) {
  if (!pattern.trim()) {
    // no search pattern, return all records
    return records;
  }

  // compile regex without g flag for .test() - important!
  const regex = compileRegex(pattern, caseInsensitive);

  if (!regex) {
    // invalid regex, return unfiltered records
    return records;
  }

  // test each record's searchable string
  return records.filter((record) => {
    const searchString = buildSearchString(record);
    return regex.test(searchString);
  });
}

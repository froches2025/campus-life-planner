// regex patterns for validation
const patterns = {
  title: /^\S(?:.*\S)?$/,
  duplicateWords: /\b(\w+)\s+\1\b/,
  duration: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
};

// check if there's a repeated word in the string
export function detectDuplicateWords(value) {
  return patterns.duplicateWords.test(value);
}

// title field - no leading or trailing spaces, check for duplicate words
export function validateTitle(value) {
  if (!patterns.title.test(value)) {
    return {
      valid: false,
      message: "Title cannot start or end with spaces",
    };
  }

  // warning for duplicate words (but still valid)
  if (detectDuplicateWords(value)) {
    return {
      valid: true,
      message: "Note: you may have repeated a word",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

// duration field - positive number, up to 2 decimal places
export function validateDuration(value) {
  if (!patterns.duration.test(value)) {
    return {
      valid: false,
      message: "Duration must be a positive number with at most 2 decimal places",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

// date field - YYYY-MM-DD format and must be a valid date
export function validateDate(value) {
  if (!patterns.date.test(value)) {
    return {
      valid: false,
      message: "Date must be in YYYY-MM-DD format",
    };
  }

  // check if it's actually a valid date (catches things like 2025-02-30)
  const dateObj = new Date(value);
  if (isNaN(dateObj.getTime())) {
    return {
      valid: false,
      message: "That date doesn't exist",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

// tag field - letters, spaces, or hyphens only
export function validateTag(value) {
  if (!patterns.tag.test(value)) {
    return {
      valid: false,
      message: "Tag can only contain letters, spaces, or hyphens",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

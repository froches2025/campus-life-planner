import { validateTitle, validateDuration, validateDate, validateTag } from './validators.js';

// get all the form elements we need to work with
const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const dateInput = document.getElementById('task-due-date');
const durationInput = document.getElementById('task-duration');
const tagInput = document.getElementById('task-tag');
const formAnnouncement = document.getElementById('form-announcement');

// map each input to its validator and error span
const fieldConfig = {
  [titleInput.id]: {
    input: titleInput,
    validator: validateTitle,
    errorSpan: document.getElementById('task-title-error'),
  },
  [dateInput.id]: {
    input: dateInput,
    validator: validateDate,
    errorSpan: document.getElementById('task-due-date-error'),
  },
  [durationInput.id]: {
    input: durationInput,
    validator: validateDuration,
    errorSpan: document.getElementById('task-duration-error'),
  },
  [tagInput.id]: {
    input: tagInput,
    validator: validateTag,
    errorSpan: document.getElementById('task-tag-error'),
  },
};

// validate a single field as the user types - returns whether the field is valid
function validateField(fieldId) {
  const config = fieldConfig[fieldId];
  const { input, validator, errorSpan } = config;

  const result = validator(input.value);

  errorSpan.textContent = result.message;

  if (!result.valid) {
    errorSpan.className = 'error-message';
  } else if (result.message) {
    errorSpan.className = 'warning-message';
  } else {
    errorSpan.className = '';
  }

  input.setAttribute('aria-invalid', result.valid ? 'false' : 'true');

  return result.valid;
}

// attach input listeners to all fields
Object.values(fieldConfig).forEach(({ input }) => {
  input.addEventListener('input', () => validateField(input.id));
});

// handle form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();

  let firstFailingInput = null;
  let hasErrors = false;

  Object.values(fieldConfig).forEach(({ input }) => {
    const isValid = validateField(input.id);
    if (!isValid) {
      hasErrors = true;
      if (!firstFailingInput) {
        firstFailingInput = input;
      }
    }
  });

  if (hasErrors) {
    firstFailingInput.focus();
    formAnnouncement.textContent = 'Please fix the errors above';
    formAnnouncement.className = 'form-message form-message--error';
  } else {
    formAnnouncement.textContent = 'Task added successfully!';
    formAnnouncement.className = 'form-message form-message--success';
    console.log('form is valid, ready to submit');
  }
});

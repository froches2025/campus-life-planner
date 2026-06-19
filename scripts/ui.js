import { validateTitle, validateDuration, validateDate, validateTag } from './validators.js';
import { addRecord, updateRecord, deleteRecord, getRecords, importRecords } from './state.js';
import { filterRecords, highlight, compileRegex } from './search.js';
import { getTotalCount, getTotalDurationMinutes, formatDuration, getTopTag, getLast7DaysTrend, getUpcomingWeekMinutes } from './stats.js';
import { loadSettings, saveSettings, hasStoredRecords } from './storage.js';

// track whether we're editing an existing record
let editingId = null;
let appSettings = loadSettings();
let weeklyCapHours = appSettings.weeklyCapHours;

// track search and sort state
let currentSearchPattern = '';
let currentCaseInsensitive = true;
let sortState = {
  sortBy: null, // 'date', 'title', or 'duration'
  sortDir: 'asc', // 'asc' or 'desc'
};

// get all the form elements we need to work with
const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const dateInput = document.getElementById('task-due-date');
const durationInput = document.getElementById('task-duration');
const tagInput = document.getElementById('task-tag');
const formAnnouncement = document.getElementById('form-announcement');
const submitBtn = form.querySelector('button[type="submit"]');
const cancelBtn = document.getElementById('cancel-btn');

// records section elements
const recordsSection = document.getElementById('records');
const searchInput = document.getElementById('search-input');
const caseToggle = document.getElementById('case-insensitive-toggle');
const searchStatus = document.getElementById('search-status');
const sortButtons = document.querySelectorAll('.sort-btn');
const recordsTable = document.getElementById('records-table');
const recordsTbody = document.getElementById('records-tbody');
const recordsMobile = document.getElementById('records-mobile');
const emptyState = document.getElementById('empty-state');
const recordsHeading = document.getElementById('records-heading');

// dashboard elements
const capInput = document.getElementById('cap-input');
const capStatusPolite = document.getElementById('cap-status-polite');
const capStatusAssertive = document.getElementById('cap-status-assertive');

// settings elements
const durationRadios = document.querySelectorAll('input[name="duration-display"]');
const tagList = document.getElementById('tag-list');
const newTagInput = document.getElementById('new-tag-input');
const newTagError = document.getElementById('new-tag-error');
const addTagBtn = document.getElementById('add-tag-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importInput = document.getElementById('import-input');
const importStatus = document.getElementById('import-status');

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

function displayDuration(minutes) {
  return appSettings.durationDisplay === 'hours' ? formatDuration(minutes) : `${minutes} min`;
}

// render records in desktop table view
function renderTable(records, regex) {
  recordsTbody.innerHTML = '';

  records.forEach((record) => {
    const row = document.createElement('tr');

    // title cell - with highlighting
    const titleCell = document.createElement('td');
    titleCell.innerHTML = regex ? highlight(record.title, regex) : record.title;
    row.appendChild(titleCell);

    // due date cell
    const dateCell = document.createElement('td');
    dateCell.textContent = record.dueDate;
    row.appendChild(dateCell);

    // duration cell
    const durationCell = document.createElement('td');
    durationCell.textContent = displayDuration(record.duration);
    row.appendChild(durationCell);

    // tag cell - with highlighting
    const tagCell = document.createElement('td');
    tagCell.innerHTML = regex ? highlight(record.tag, regex) : record.tag;
    row.appendChild(tagCell);

    // actions cell
    const actionsCell = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit ${record.title}`);
    editBtn.addEventListener('click', () => startEdit(record));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete ${record.title}`);
    deleteBtn.addEventListener('click', () => confirmDelete(record.id, () => {
      // after delete, move focus to next row or heading
      const nextEditBtn = recordsTbody.querySelector('button[aria-label^="Edit"]');
      if (nextEditBtn) {
        nextEditBtn.focus();
      } else {
        recordsHeading.focus();
      }
    }));

    const actionGroup = document.createElement('div');
    actionGroup.className = 'record-actions';
    actionGroup.appendChild(editBtn);
    actionGroup.appendChild(deleteBtn);
    actionsCell.appendChild(actionGroup);
    row.appendChild(actionsCell);

    recordsTbody.appendChild(row);
  });
}

// render records in mobile card view
function renderCards(records, regex) {
  recordsMobile.innerHTML = '';

  records.forEach((record) => {
    const card = document.createElement('div');
    card.className = 'record-card';

    // title field
    const titleField = document.createElement('div');
    titleField.className = 'record-card-field';
    const titleLabel = document.createElement('div');
    titleLabel.className = 'record-card-label';
    titleLabel.textContent = 'Title';
    const titleValue = document.createElement('div');
    titleValue.className = 'record-card-value';
    titleValue.innerHTML = regex ? highlight(record.title, regex) : record.title;
    titleField.appendChild(titleLabel);
    titleField.appendChild(titleValue);
    card.appendChild(titleField);

    // due date field
    const dateField = document.createElement('div');
    dateField.className = 'record-card-field';
    const dateLabel = document.createElement('div');
    dateLabel.className = 'record-card-label';
    dateLabel.textContent = 'Due Date';
    const dateValue = document.createElement('div');
    dateValue.className = 'record-card-value';
    dateValue.textContent = record.dueDate;
    dateField.appendChild(dateLabel);
    dateField.appendChild(dateValue);
    card.appendChild(dateField);

    // duration field
    const durationField = document.createElement('div');
    durationField.className = 'record-card-field';
    const durationLabel = document.createElement('div');
    durationLabel.className = 'record-card-label';
    durationLabel.textContent = 'Duration';
    const durationValue = document.createElement('div');
    durationValue.className = 'record-card-value';
    durationValue.textContent = displayDuration(record.duration);
    durationField.appendChild(durationLabel);
    durationField.appendChild(durationValue);
    card.appendChild(durationField);

    // tag field
    const tagField = document.createElement('div');
    tagField.className = 'record-card-field';
    const tagLabel = document.createElement('div');
    tagLabel.className = 'record-card-label';
    tagLabel.textContent = 'Tag';
    const tagValue = document.createElement('div');
    tagValue.className = 'record-card-value';
    tagValue.innerHTML = regex ? highlight(record.tag, regex) : record.tag;
    tagField.appendChild(tagLabel);
    tagField.appendChild(tagValue);
    card.appendChild(tagField);

    // actions
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit ${record.title}`);
    editBtn.addEventListener('click', () => startEdit(record));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete ${record.title}`);
    deleteBtn.addEventListener('click', () => confirmDelete(record.id, () => {
      // after delete, move focus to next row or heading
      const nextEditBtn = recordsMobile.querySelector('button[aria-label^="Edit"]');
      if (nextEditBtn) {
        nextEditBtn.focus();
      } else {
        recordsHeading.focus();
      }
    }));

    const actionGroup = document.createElement('div');
    actionGroup.className = 'record-actions';
    actionGroup.appendChild(editBtn);
    actionGroup.appendChild(deleteBtn);
    card.appendChild(actionGroup);

    recordsMobile.appendChild(card);
  });
}

function renderTrendChart(trend) {
  const chart = document.getElementById('trend-chart');
  const maxCount = Math.max(...trend.map(d => d.count), 1);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const ariaLabel = `Tasks created per day, last 7 days: ${trend
    .map(d => `${dayNames[new Date(d.date + 'T12:00:00').getDay()]} ${d.count}`)
    .join(', ')}`;
  chart.setAttribute('aria-label', ariaLabel);
  chart.innerHTML = '';

  trend.forEach(d => {
    const dayName = dayNames[new Date(d.date + 'T12:00:00').getDay()];
    const heightPct = maxCount > 0 ? Math.round((d.count / maxCount) * 100) : 0;

    const col = document.createElement('div');
    col.className = 'trend-col';

    const barArea = document.createElement('div');
    barArea.className = 'trend-bar-area';

    const bar = document.createElement('div');
    bar.className = d.count === 0 ? 'trend-bar trend-bar--empty' : 'trend-bar';
    bar.style.height = d.count === 0 ? '2px' : `${heightPct}%`;
    barArea.appendChild(bar);

    const countEl = document.createElement('div');
    countEl.className = 'trend-count';
    countEl.textContent = d.count;

    const labelEl = document.createElement('div');
    labelEl.className = 'trend-label';
    labelEl.textContent = dayName;

    col.appendChild(barArea);
    col.appendChild(countEl);
    col.appendChild(labelEl);
    chart.appendChild(col);
  });
}

function refreshCapStatus(upcomingMinutes) {
  const progressWrap = document.getElementById('cap-progress-wrap');
  const progressBar = document.getElementById('cap-progress');

  if (weeklyCapHours === null) {
    capStatusPolite.textContent = '';
    capStatusAssertive.textContent = '';
    progressWrap.hidden = true;
    return;
  }

  const capMinutes = weeklyCapHours * 60;
  const upcomingFormatted = formatDuration(upcomingMinutes);
  const capFormatted = formatDuration(capMinutes);
  const pct = capMinutes > 0 ? Math.min(Math.round((upcomingMinutes / capMinutes) * 100), 100) : 0;

  progressWrap.hidden = false;
  progressBar.value = pct;
  progressBar.classList.toggle('over-cap', upcomingMinutes > capMinutes);

  if (upcomingMinutes > capMinutes) {
    capStatusPolite.textContent = '';
    capStatusPolite.className = '';
    const overByPct = Math.round((upcomingMinutes / capMinutes) * 100);
    capStatusAssertive.textContent = `Warning: Over cap by ${overByPct}%: ${upcomingFormatted} scheduled, cap is ${capFormatted}.`;
    capStatusAssertive.className = 'cap-over';
  } else {
    capStatusAssertive.textContent = '';
    capStatusAssertive.className = '';
    capStatusPolite.textContent = `On track: ${upcomingFormatted} of ${capFormatted} scheduled this week.`;
    capStatusPolite.className = 'cap-under';
  }
}

function refreshDashboard() {
  const records = getRecords();
  const upcomingMins = getUpcomingWeekMinutes(records);

  document.getElementById('stat-total-count').textContent = getTotalCount(records);
  document.getElementById('stat-total-duration').textContent = formatDuration(getTotalDurationMinutes(records));

  const topTag = getTopTag(records);
  document.getElementById('stat-top-tag').textContent = topTag ?? '—';

  document.getElementById('stat-upcoming').textContent = formatDuration(upcomingMins);

  renderTrendChart(getLast7DaysTrend(records));
  refreshCapStatus(upcomingMins);
}

// central orchestration: fetch, filter, sort, render
function refreshRecordsView() {
  // get all records from state
  const allRecords = getRecords();

  // filter by search pattern
  const filtered = filterRecords(allRecords, currentSearchPattern, currentCaseInsensitive);

  // sort the filtered results
  let sorted = [...filtered];
  if (sortState.sortBy) {
    if (sortState.sortBy === 'date') {
      // YYYY-MM-DD strings sort correctly with string comparison
      sorted.sort((a, b) => {
        const cmp = a.dueDate.localeCompare(b.dueDate);
        return sortState.sortDir === 'asc' ? cmp : -cmp;
      });
    } else if (sortState.sortBy === 'title') {
      sorted.sort((a, b) => {
        const cmp = a.title.localeCompare(b.title);
        return sortState.sortDir === 'asc' ? cmp : -cmp;
      });
    } else if (sortState.sortBy === 'duration') {
      sorted.sort((a, b) => {
        const cmp = a.duration - b.duration;
        return sortState.sortDir === 'asc' ? cmp : -cmp;
      });
    }
  }

  // compile regex for highlighting (with g flag for .replace() in highlight())
  let highlightRegex = null;
  if (currentSearchPattern.trim()) {
    highlightRegex = compileRegex(currentSearchPattern, currentCaseInsensitive);
  }

  // render both views with the same final array
  renderTable(sorted, highlightRegex);
  renderCards(sorted, highlightRegex);

  // show/hide empty state with context-aware message
  if (sorted.length === 0) {
    emptyState.hidden = false;
    emptyState.querySelector('p').textContent = currentSearchPattern.trim()
      ? 'No tasks match your search.'
      : 'No tasks yet. Add one to get started!';
  } else {
    emptyState.hidden = true;
  }

  refreshDashboard();
}

// start editing a record - populate form and set state
function startEdit(record) {
  editingId = record.id;
  titleInput.value = record.title;
  dateInput.value = record.dueDate;
  durationInput.value = record.duration;
  tagInput.value = record.tag;

  submitBtn.textContent = 'Update task';
  cancelBtn.hidden = false;

  // scroll form into view
  form.scrollIntoView({ behavior: 'smooth' });
  titleInput.focus();
}

// cancel editing - reset form and clear edit state
function cancelEdit() {
  editingId = null;
  form.reset();
  submitBtn.textContent = 'Add task';
  cancelBtn.hidden = true;
}

// delete a record with confirmation
function confirmDelete(recordId, onSuccess) {
  if (window.confirm('Are you sure you want to delete this task?')) {
    deleteRecord(recordId);
    refreshRecordsView();
    if (onSuccess) onSuccess();
  }
}

function renderTagList() {
  tagList.innerHTML = '';
  appSettings.tags.forEach(tag => {
    const li = document.createElement('li');
    li.className = 'tag-list-item';

    const name = document.createElement('span');
    name.textContent = tag;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.setAttribute('aria-label', `Remove tag ${tag}`);
    removeBtn.addEventListener('click', () => {
      appSettings.tags = appSettings.tags.filter(t => t !== tag);
      saveSettings(appSettings);
      renderTagList();
      updateTagDatalist();
    });

    li.appendChild(name);
    li.appendChild(removeBtn);
    tagList.appendChild(li);
  });
}

function updateTagDatalist() {
  const datalist = document.getElementById('tag-suggestions');
  datalist.innerHTML = '';
  appSettings.tags.forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    datalist.appendChild(option);
  });
}

// attach input listeners to all fields
Object.values(fieldConfig).forEach(({ input }) => {
  input.addEventListener('input', () => validateField(input.id));
});

// search input handler
searchInput.addEventListener('input', (e) => {
  currentSearchPattern = e.target.value;

  // validate regex pattern
  const regex = compileRegex(currentSearchPattern, currentCaseInsensitive);
  if (currentSearchPattern.trim() && !regex) {
    searchStatus.textContent = 'Invalid search pattern';
    searchStatus.classList.add('search-status--error');
  } else {
    searchStatus.textContent = '';
    searchStatus.classList.remove('search-status--error');
  }

  refreshRecordsView();
});

// case-insensitive toggle
caseToggle.addEventListener('change', (e) => {
  currentCaseInsensitive = e.target.checked;
  refreshRecordsView();
});

// update sort button labels to show direction arrows
function updateSortButtonLabels() {
  sortButtons.forEach((btn) => {
    const field = btn.id.replace('sort-', '');
    // remove any existing arrow
    btn.textContent = btn.textContent.replace(/ [↑↓]$/, '');
    
    // add arrow if this is the active column
    if (sortState.sortBy === field) {
      const arrow = sortState.sortDir === 'asc' ? ' ↑' : ' ↓';
      btn.textContent += arrow;
    }
  });
}

// sort buttons
sortButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const sortBy = btn.id.replace('sort-', '');

    // if clicking the same column, flip the direction
    if (sortState.sortBy === sortBy) {
      sortState.sortDir = sortState.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      // switching to a new column, start with ascending
      sortState.sortBy = sortBy;
      sortState.sortDir = 'asc';
    }

    // update button styling and labels
    sortButtons.forEach((b) => {
      b.classList.toggle('active', b.id.replace('sort-', '') === sortState.sortBy);
    });
    updateSortButtonLabels();
    refreshRecordsView();
  });
});

// cancel button handler
cancelBtn.addEventListener('click', () => {
  cancelEdit();
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
    // build data object from form values
    const data = {
      title: titleInput.value,
      dueDate: dateInput.value,
      duration: parseFloat(durationInput.value),
      tag: tagInput.value,
    };

    // save to state - either add new or update existing
    if (editingId === null) {
      addRecord(data);
      formAnnouncement.textContent = 'Task added successfully!';
    } else {
      const result = updateRecord(editingId, data);
      if (!result) {
        formAnnouncement.textContent = 'This task no longer exists, it may have been deleted.';
        formAnnouncement.className = 'form-message form-message--error';
        cancelEdit();
        refreshRecordsView();
        return;
      }
      formAnnouncement.textContent = 'Task updated successfully!';
      editingId = null;
    }

    formAnnouncement.className = 'form-message form-message--success';

    // reset form
    form.reset();

    // restore button states
    submitBtn.textContent = 'Add task';
    cancelBtn.hidden = true;

    // refresh the records view
    refreshRecordsView();
  }
});

// cap input handler
capInput.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  weeklyCapHours = isNaN(val) || val < 0 ? null : val;
  appSettings.weeklyCapHours = weeklyCapHours;
  saveSettings(appSettings);
  refreshCapStatus(getUpcomingWeekMinutes(getRecords()));
});

// duration display radio handler
durationRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    appSettings.durationDisplay = radio.value;
    saveSettings(appSettings);
    refreshRecordsView();
  });
});

// add tag handler
addTagBtn.addEventListener('click', () => {
  const value = newTagInput.value.trim();
  const result = validateTag(value);
  if (!result.valid) {
    newTagError.textContent = result.message;
    return;
  }
  if (appSettings.tags.includes(value)) {
    newTagError.textContent = 'Tag already exists.';
    return;
  }
  newTagError.textContent = '';
  appSettings.tags.push(value);
  saveSettings(appSettings);
  newTagInput.value = '';
  renderTagList();
  updateTagDatalist();
});

// allow pressing Enter in the new tag input
newTagInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addTagBtn.click();
  }
});

// import button triggers the hidden file input
importBtn.addEventListener('click', () => importInput.click());

// export handler
exportBtn.addEventListener('click', () => {
  const data = JSON.stringify(getRecords(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'campus-life-planner-export.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// import handler
importInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    let parsed;
    try {
      parsed = JSON.parse(event.target.result);
    } catch {
      importStatus.textContent = 'Invalid JSON: file could not be parsed.';
      importInput.value = '';
      return;
    }

    if (!Array.isArray(parsed)) {
      importStatus.textContent = 'Invalid format: expected an array of records.';
      importInput.value = '';
      return;
    }

    for (let i = 0; i < parsed.length; i++) {
      const r = parsed[i];
      const valid =
        typeof r.id === 'string' &&
        typeof r.title === 'string' && r.title.length > 0 &&
        typeof r.dueDate === 'string' && validateDate(r.dueDate).valid &&
        typeof r.duration === 'number' && !isNaN(r.duration) && r.duration >= 0 &&
        typeof r.tag === 'string' && r.tag.length > 0 &&
        typeof r.createdAt === 'string' &&
        typeof r.updatedAt === 'string';
      if (!valid) {
        importStatus.textContent = `Record ${i} is missing required fields or has invalid types.`;
        importInput.value = '';
        return;
      }
    }

    importRecords(parsed);
    refreshRecordsView();
    importStatus.textContent = `Successfully imported ${parsed.length} record${parsed.length === 1 ? '' : 's'}.`;
    importInput.value = '';
  };

  reader.readAsText(file);
});

// initialize on page load
durationRadios.forEach(radio => {
  radio.checked = radio.value === appSettings.durationDisplay;
});
if (appSettings.weeklyCapHours !== null) {
  capInput.value = appSettings.weeklyCapHours;
}
renderTagList();
updateTagDatalist();

if (!hasStoredRecords()) {
  fetch('./seed.json')
    .then(r => r.json())
    .then(data => {
      importRecords(data);
      refreshRecordsView();
    })
    .catch(() => {});
}

refreshRecordsView();
updateSortButtonLabels();

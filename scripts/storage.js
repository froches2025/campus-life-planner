const RECORDS_KEY = 'campus-planner-records';
const SETTINGS_KEY = 'campus-planner-settings';

const DEFAULT_SETTINGS = {
  durationDisplay: 'minutes',
  tags: ['Academics', 'Social', 'Health', 'Personal', 'Club', 'Other'],
  weeklyCapHours: null,
};

export function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    // spread DEFAULT_SETTINGS first so any new keys added later have a fallback
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// true only before the first save — distinguishes "first run" from "user cleared all records"
export function hasStoredRecords() {
  return localStorage.getItem(RECORDS_KEY) !== null;
}

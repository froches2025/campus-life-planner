import { loadRecords, saveRecords } from './storage.js';

let records = loadRecords();
let nextId = deriveNextId(records);

function deriveNextId(arr) {
  if (arr.length === 0) return 1;
  const max = arr.reduce((m, r) => {
    const n = parseInt(r.id.replace('task_', ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return max + 1;
}

function generateId() {
  const id = `task_${String(nextId).padStart(4, '0')}`;
  nextId++;
  return id;
}

export function addRecord(data) {
  const now = new Date().toISOString();
  const record = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  records.push(record);
  saveRecords(records);
  return record;
}

export function updateRecord(id, data) {
  const record = records.find((r) => r.id === id);
  if (!record) return null;
  Object.assign(record, data, {
    updatedAt: new Date().toISOString(),
  });
  saveRecords(records);
  return record;
}

export function deleteRecord(id) {
  const index = records.findIndex((r) => r.id === id);
  if (index !== -1) {
    records.splice(index, 1);
    saveRecords(records);
  }
}

export function getRecords() {
  return [...records];
}

export function importRecords(newRecords) {
  records = [...newRecords];
  nextId = deriveNextId(records);
  saveRecords(records);
}

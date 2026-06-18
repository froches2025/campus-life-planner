// private array - only accessible through the functions below
let records = [];
let nextId = 1;

// generate id in task_0001 format
function generateId() {
  const id = `task_${String(nextId).padStart(4, '0')}`;
  nextId++;
  return id;
}

// add a new record with generated id and timestamp
export function addRecord(data) {
  const now = new Date().toISOString();
  const record = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  records.push(record);
  return record;
}

// update an existing record - only touches updatedAt, never createdAt
export function updateRecord(id, data) {
  const record = records.find((r) => r.id === id);
  if (!record) return null;

  Object.assign(record, data, {
    updatedAt: new Date().toISOString(),
  });
  return record;
}

// remove a record by id
export function deleteRecord(id) {
  const index = records.findIndex((r) => r.id === id);
  if (index !== -1) {
    records.splice(index, 1);
  }
}

// get all records
export function getRecords() {
  return [...records];
}

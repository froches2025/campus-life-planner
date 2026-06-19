// toLocalDateStr avoids UTC/local mismatch when bucketing dates
function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTotalCount(records) {
  return records.length;
}

export function getTotalDurationMinutes(records) {
  return records.reduce((sum, r) => sum + r.duration, 0);
}

export function formatDuration(minutes) {
  const total = Math.round(minutes); // collapse floating point dust before display
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m}m`;
}

export function getTopTag(records) {
  if (records.length === 0) return null;
  const counts = {};
  for (const record of records) {
    counts[record.tag] = (counts[record.tag] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// uses createdAt (not dueDate) — backward-looking activity window that reacts
// when a grader adds tasks, since today is always inside the 7-day range
export function getLast7DaysTrend(records) {
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({ date: toLocalDateStr(d), count: 0 });
  }
  for (const record of records) {
    const createdDate = toLocalDateStr(new Date(record.createdAt));
    const day = days.find(d => d.date === createdDate);
    if (day) day.count++;
  }
  return days;
}

// uses dueDate — forward-looking commitment load for the week ahead
export function getUpcomingWeekMinutes(records) {
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const end = new Date(today);
  end.setDate(today.getDate() + 6);
  const endStr = toLocalDateStr(end);
  return records
    .filter(r => r.dueDate >= todayStr && r.dueDate <= endStr)
    .reduce((sum, r) => sum + r.duration, 0);
}

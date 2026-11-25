// old implementation (loop)
function oldBD(startDate, endDate) {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const direction = end >= start ? 1 : -1;
  let cursor = new Date(start); let count = 0;
  while ((direction > 0 && cursor < end) || (direction < 0 && cursor > end)) {
    cursor.setDate(cursor.getDate() + direction);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += direction;
  }
  return count;
}
// new implementation (closed form)
function isWeekday(d) { const k = d.getDay(); return k !== 0 && k !== 6; }

// weekdays in the half-open range (a, b], a <= b -- O(1) plus at most 6 steps
function weekdaysAfterUpTo(a, b) {
  const days = Math.round((b - a) / 86400000);
  const weeks = Math.floor(days / 7);
  let count = weeks * 5;
  const cursor = new Date(a);
  cursor.setDate(cursor.getDate() + weeks * 7);
  for (let i = weeks * 7; i < days; i += 1) {
    cursor.setDate(cursor.getDate() + 1);
    if (isWeekday(cursor)) count += 1;
  }
  return count;
}

function newBD(startDate, endDate) {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  if (end >= start) return weekdaysAfterUpTo(start, end);
  // Stepping backwards, the original loop lands on [end, start) rather than
  // (end, start], so shift the endpoints to match exactly.
  return -(weekdaysAfterUpTo(end, start) - (isWeekday(start) ? 1 : 0) + (isWeekday(end) ? 1 : 0));
}

import { test } from 'node:test';
import assert from 'node:assert/strict';

let fails = 0, checked = 0;
const base = new Date(2026, 5, 5);
// every day for 6 years forward, plus backwards ranges, plus DST boundaries
for (let d = -800; d < 2200; d++) {
  const end = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d);
  const o = oldBD(base, end), n = newBD(base, end);
  checked++;
  if (o !== n) { if (fails < 5) console.log('MISMATCH', end.toDateString(), 'old', o, 'new', n); fails++; }
}
// random spans across years, incl. DST transitions in March/November
for (let i = 0; i < 4000; i++) {
  const y1 = 2015 + Math.floor(Math.random()*20), y2 = 2015 + Math.floor(Math.random()*20);
  const s = new Date(y1, Math.floor(Math.random()*12), 1+Math.floor(Math.random()*28));
  const e = new Date(y2, Math.floor(Math.random()*12), 1+Math.floor(Math.random()*28));
  const o = oldBD(s,e), n = newBD(s,e);
  checked++;
  if (o !== n) { if (fails < 10) console.log('MISMATCH', s.toDateString(), '->', e.toDateString(), 'old', o, 'new', n); fails++; }
}
test('closed-form business days matches the original loop', () => {
  assert.equal(fails, 0, `${fails} of ${checked} ranges disagreed`);
  assert.ok(checked > 6000, 'expected a wide sweep of ranges');
});


/*
 * The shipped business-day arithmetic, checked against the loop it replaced.
 *
 * The implementation is READ OUT OF index.html between the business-days:begin
 * and business-days:end markers. An earlier version of this file declared its
 * own copy of isWeekday / weekdaysAfterUpTo / businessDaysBetween and imported
 * nothing, so it verified a transcription rather than the site -- it would have
 * passed with the page shipping anything at all. There is no module boundary to
 * import through (the functions live in an ~8000-line inline <script>), so the
 * test extracts the source instead. If the markers go missing, this fails
 * loudly rather than quietly testing a copy.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BEGIN = '/* business-days:begin';
const END = '/* business-days:end */';
const b = SRC.indexOf(BEGIN);
const e = SRC.indexOf(END, b);
if (b < 0 || e < 0) {
  throw new Error('business-days:begin / business-days:end markers missing from index.html');
}
const BODY = SRC.slice(SRC.indexOf('function isWeekday', b), e);
for (const name of ['function isWeekday', 'function weekdaysAfterUpTo', 'function businessDaysBetween']) {
  if (!BODY.includes(name)) throw new Error(`extracted span does not contain ${name}`);
}
// eslint-disable-next-line no-new-func
const { isWeekday, newBD } = new Function(
  `${BODY}\nreturn { isWeekday, newBD: businessDaysBetween };`
)();

// The implementation this replaced: one calendar day per iteration, so it grew
// by a step every day the site stayed up. Kept here as the oracle.
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


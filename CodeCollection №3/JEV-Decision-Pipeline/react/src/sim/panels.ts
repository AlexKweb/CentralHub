import {
  ACTIONS_MAX,
  ACTIONS_MAX_STEPS,
  ACTIONS_MIN,
  ACTIONS_START,
  ACTIONS_STEP_SECONDS,
  ANSWERS,
  BAR_GROW_SECONDS,
  BAR_ROWS,
  BAR_STAGGER_SECONDS,
  CASES,
  CASE_TYPES,
  CHANNEL,
  CHIEF_CHARS_PER_SECOND,
  CHIEF_VISIBLE_LINES,
  CYCLE_SECONDS,
  GATE_HUNDREDTHS,
  LOG_CASE_SLOTS,
  LOG_SLOTS_PER_CASE,
  LOG_SLOTS_PER_SECOND,
  LOG_VISIBLE,
  SPARK_POINTS,
  SPARK_STEPS_PER_SECOND,
  SPLIT_BASE,
  SPLIT_SEGMENTS,
  SPLIT_STEPS_PER_SECOND,
  STAGE_STARTS,
  STREAM_HISTORY_SECONDS,
} from './constants';
import { hash32, mulberry32 } from './rng';
import { timeline } from './timeline';
import type { BarRow, Case, ChiefView, LogLine, LogView, Spark, Split } from './types';
import { clamp, fmtHundredths, hundredths, mod, norm } from './util';

export function bars(seed: number, caseIndex: number, cases: readonly Case[]): BarRow[] {
  const c = cases[caseIndex];
  const r = mulberry32(hash32(seed, CHANNEL.BARS, caseIndex));
  const rows: BarRow[] = BAR_ROWS.map((label, i) => {
    const type = CASE_TYPES[Math.floor(i / 2)];
    const value = 0.05 + 0.9 * r();
    const answers = ANSWERS[type];
    const answer = answers[Math.floor(r() * answers.length)];
    return { label, type, value, answer, bright: false };
  });
  const win = 2 * CASE_TYPES.indexOf(c.type);
  rows[win].value = 0.9 + 0.1 * r();
  rows[win].answer = c.answer;
  for (const row of rows) row.bright = row.value >= 0.85;
  return rows;
}

export function barGrow(t: number, row: number): number {
  const local = timeline(t).local;
  return clamp((local - STAGE_STARTS[1] - row * BAR_STAGGER_SECONDS) / BAR_GROW_SECONDS, 0, 1);
}

/** Random walk in 3..8 that takes one step every 2 s and restarts each cycle. */
export function actions(t: number, seed: number): number {
  const now = norm(t);
  const cycle = Math.floor(now / CYCLE_SECONDS);
  const steps = Math.min(ACTIONS_MAX_STEPS, Math.floor((now - cycle * CYCLE_SECONDS) / ACTIONS_STEP_SECONDS));
  let a = ACTIONS_START;
  for (let j = 1; j <= steps; j++) {
    a = clamp(a + (hash32(seed, CHANNEL.ACTIONS, cycle, j) % 3) - 1, ACTIONS_MIN, ACTIONS_MAX);
  }
  return a;
}

/** k: 0 ask, 1 jev, 2 gate, 3 code. */
function caseLine(c: Case, k: number): LogLine {
  const h = hundredths(c.confidence);
  const conf = fmtHundredths(h);
  if (k === 0) return { tag: 'ask', text: c.question.replace(' · ', ' ') };
  if (k === 1) return { tag: 'jev', text: `→ ${c.answer}  ${conf}  ${c.jevMs}ms` };
  if (k === 2) {
    return { tag: 'gate', text: h >= GATE_HUNDREDTHS ? `${conf} ≥ 0.85  pass` : `${conf} < 0.85  human` };
  }
  return { tag: 'code', text: c.logCode };
}

function logLine(m: number, seed: number, cases: readonly Case[]): LogLine {
  const slot = m % LOG_SLOTS_PER_CASE;
  if (LOG_CASE_SLOTS.includes(slot)) {
    const caseIndex = Math.floor(m / LOG_SLOTS_PER_CASE) % CASES;
    return caseLine(cases[caseIndex], LOG_CASE_SLOTS.indexOf(slot));
  }
  const h = hash32(seed, CHANNEL.LOG, m);
  if (h % 8 === 0) return { tag: 'limit', text: `actions ${actions(m * 0.5, seed)}/10  spend ok` };
  return caseLine(cases[(h >>> 3) % CASES], (h >>> 8) % 4);
}

export function log(t: number, seed: number, cases: readonly Case[]): LogView {
  const x = norm(t) * LOG_SLOTS_PER_SECOND;
  const n = Math.floor(x);
  const lines: LogLine[] = [];
  for (let m = Math.max(0, n - LOG_VISIBLE + 1); m <= n; m++) lines.push(logLine(m, seed, cases));
  return { lines, scroll: x - n };
}

/** Indices of tiles showing the "in queue" dot, sorted, never the current case. */
export function queued(t: number, seed: number, caseIndex: number): number[] {
  const cycle = Math.floor(norm(t) / CYCLE_SECONDS);
  const h = hash32(seed, CHANNEL.QUEUE, cycle, caseIndex);
  const count = h % 3;
  const r = mulberry32(h);
  const picked: number[] = [];
  for (let k = 0; k < count; k++) {
    const idx = Math.floor(r() * CASES);
    if (idx !== caseIndex && !picked.includes(idx)) picked.push(idx);
  }
  return picked.sort((a, b) => a - b);
}

/** Endless typewriter over the file; `text` must be ASCII and end with a newline. */
export function chief(t: number, text: string): ChiefView {
  const lines = text.split('\n').slice(0, -1);
  const pos = Math.floor(norm(t) * CHIEF_CHARS_PER_SECOND) % text.length;
  const prefix = text.slice(0, pos);
  const li = prefix.split('\n').length - 1;
  const col = pos - (prefix.lastIndexOf('\n') + 1);
  const visible: string[] = [];
  for (let k = li - CHIEF_VISIBLE_LINES + 1; k <= li; k++) {
    const line = lines[mod(k, lines.length)];
    visible.push(k === li ? line.slice(0, col) : line);
  }
  return { pos, line: li, col, visible };
}

export function split(t: number, seed: number): Split {
  const k = Math.floor(norm(t) * SPLIT_STEPS_PER_SECOND);
  const segments = (r: number) =>
    clamp(SPLIT_BASE[r] + (hash32(seed, CHANNEL.SPLIT, k, r) % 3) - 1, 0, SPLIT_SEGMENTS);
  return [segments(0), segments(1), segments(2)];
}

export function spark(t: number, seed: number): Spark {
  const x = norm(t) * SPARK_STEPS_PER_SECOND;
  const k = Math.floor(x);
  const values: number[] = [];
  for (let i = 0; i < SPARK_POINTS; i++) {
    values.push(180 + (hash32(seed, CHANNEL.SPARK, k + i) % 1000) * 0.12);
  }
  return { values, offset: x - k };
}

/** Value of a sine-mix curve for type `typeIndex`; x is 0 (left edge) to 1 (now). */
export function stream(t: number, seed: number, typeIndex: number, x: number): number {
  const r = mulberry32(hash32(seed, CHANNEL.STREAM, typeIndex));
  const p0 = 2 * Math.PI * r();
  const p1 = 2 * Math.PI * r();
  const p2 = 2 * Math.PI * r();
  const s = norm(t) - (1 - x) * STREAM_HISTORY_SECONDS;
  return (
    0.8 +
    0.1 * Math.sin(1.3 * s + p0) +
    0.06 * Math.sin(2.9 * s + p1) +
    0.03 * Math.sin(6.1 * s + p2)
  );
}

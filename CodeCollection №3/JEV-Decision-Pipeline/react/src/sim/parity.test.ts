import { describe, expect, it } from 'vitest';
import chiefText from '@shared/chief.py?raw';
import cardsJson from '@shared/cards.json';
import casesJson from '@shared/cases.json';
import vectorsJson from '@shared/test-vectors.json';
import {
  accent,
  actions,
  active,
  barGrow,
  bars,
  buttons,
  cardPosition,
  chief,
  confidence,
  hash32,
  jumpToCase,
  jumpToStage,
  kpis,
  links,
  log,
  mulberry32,
  nextCase,
  prevCase,
  queued,
  spark,
  split,
  stream,
  subtitle,
  timeline,
} from './index';
import type { CardsDoc, CasesDoc } from './types';

interface TimeEntry {
  t: number;
  out: unknown;
}

interface VectorFile {
  version: number;
  seed: number;
  tolerance: number;
  frames: Record<string, number>;
  hash32: { in: number[]; out: number }[];
  mulberry32: { seed: number; out: number[] }[];
  timeline: TimeEntry[];
  kpis: TimeEntry[];
  confidence: TimeEntry[];
  buttons: { stage: number; out: unknown }[];
  subtitle: TimeEntry[];
  accent: TimeEntry[];
  active: TimeEntry[];
  cardPosition: { column: number; row: number; out: unknown }[];
  links: { seed: number; out: unknown; count: number };
  bars: { seed: number; case: number; out: unknown }[];
  barGrow: { t: number; row: number; out: unknown }[];
  actions: TimeEntry[];
  log: TimeEntry[];
  queued: { t: number; case: number; out: unknown }[];
  chief: TimeEntry[];
  split: TimeEntry[];
  spark: TimeEntry[];
  stream: { t: number; type: number; x: number; out: unknown }[];
  jumps: { t: number; toCase: number[]; toStage: number[]; next: number; prev: number }[];
}

const vectors = vectorsJson as unknown as VectorFile;
const cases = (casesJson as CasesDoc).cases;
const cards = cardsJson as CardsDoc;
const SEED = vectors.seed;

// Every section is exercised and counted; a shrunken or silently skipped section fails.
const EXPECTED_COUNTS = {
  hash32: 8,
  mulberry32: 4,
  timeline: 28,
  kpis: 32,
  confidence: 33,
  buttons: 5,
  subtitle: 30,
  accent: 10,
  active: 30,
  cardPosition: 6,
  links: 1,
  bars: 24,
  barGrow: 48,
  actions: 34,
  log: 32,
  queued: 48,
  chief: 10,
  split: 28,
  spark: 5,
  stream: 36,
  jumps: 6,
} as const;

const META_KEYS = ['version', 'seed', 'tolerance', 'frames'];

/** Returns human-readable mismatches; numbers compare within the file's tolerance. */
function diff(actual: unknown, expected: unknown, path = '$'): string[] {
  if (typeof expected === 'number') {
    return typeof actual === 'number' && Math.abs(actual - expected) <= vectors.tolerance
      ? []
      : [`${path}: expected ${expected}, got ${JSON.stringify(actual)}`];
  }
  if (expected === null || typeof expected !== 'object') {
    return Object.is(actual, expected)
      ? []
      : [`${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`];
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      return [`${path}: expected array of length ${expected.length}`];
    }
    return expected.flatMap((item, i) => diff(actual[i], item, `${path}[${i}]`));
  }
  if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) {
    return [`${path}: expected an object`];
  }
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();
  if (expectedKeys.join(',') !== actualKeys.join(',')) {
    return [`${path}: keys [${actualKeys.join(', ')}] differ from [${expectedKeys.join(', ')}]`];
  }
  const record = expected as Record<string, unknown>;
  const actualRecord = actual as Record<string, unknown>;
  return expectedKeys.flatMap((key) => diff(actualRecord[key], record[key], `${path}.${key}`));
}

/** Runs every entry of one section and returns how many were compared. */
function runSection<T>(section: string, entries: readonly T[], check: (entry: T) => string[]): number {
  let compared = 0;
  for (const entry of entries) {
    expect(check(entry), `${section}[${compared}]`).toEqual([]);
    compared += 1;
  }
  return compared;
}

describe('parity with shared/test-vectors.json', () => {
  it('covers exactly the known vector sections', () => {
    expect(Object.keys(vectorsJson).sort()).toEqual(
      [...META_KEYS, ...Object.keys(EXPECTED_COUNTS)].sort(),
    );
  });

  it('hash32', () => {
    const n = runSection('hash32', vectors.hash32, (v) => diff(hash32(...v.in), v.out));
    expect(n).toBe(EXPECTED_COUNTS.hash32);
  });

  it('mulberry32', () => {
    const n = runSection('mulberry32', vectors.mulberry32, (v) => {
      const rand = mulberry32(v.seed);
      return diff(
        v.out.map(() => rand()),
        v.out,
      );
    });
    expect(n).toBe(EXPECTED_COUNTS.mulberry32);
  });

  it('timeline', () => {
    const n = runSection('timeline', vectors.timeline, (v) => diff(timeline(v.t), v.out));
    expect(n).toBe(EXPECTED_COUNTS.timeline);
  });

  it('kpis', () => {
    const n = runSection('kpis', vectors.kpis, (v) => diff(kpis(v.t), v.out));
    expect(n).toBe(EXPECTED_COUNTS.kpis);
  });

  it('confidence', () => {
    const n = runSection('confidence', vectors.confidence, (v) => diff(confidence(v.t, cases), v.out));
    expect(n).toBe(EXPECTED_COUNTS.confidence);
  });

  it('buttons', () => {
    const n = runSection('buttons', vectors.buttons, (v) => diff(buttons(v.stage), v.out));
    expect(n).toBe(EXPECTED_COUNTS.buttons);
  });

  it('subtitle', () => {
    const n = runSection('subtitle', vectors.subtitle, (v) => diff(subtitle(v.t, cases), v.out));
    expect(n).toBe(EXPECTED_COUNTS.subtitle);
  });

  it('accent', () => {
    const n = runSection('accent', vectors.accent, (v) => diff(accent(v.t, cases), v.out));
    expect(n).toBe(EXPECTED_COUNTS.accent);
  });

  it('active', () => {
    const n = runSection('active', vectors.active, (v) => diff(active(v.t, cases), v.out));
    expect(n).toBe(EXPECTED_COUNTS.active);
  });

  it('cardPosition', () => {
    const n = runSection('cardPosition', vectors.cardPosition, (v) =>
      diff(cardPosition(v.column, v.row), v.out),
    );
    expect(n).toBe(EXPECTED_COUNTS.cardPosition);
  });

  it('links', () => {
    const n = runSection('links', [vectors.links], (v) => {
      const out = links(v.seed, cards.columns);
      return [...diff(out, v.out), ...diff(out.length, v.count, '$.count')];
    });
    expect(n).toBe(EXPECTED_COUNTS.links);
  });

  it('bars', () => {
    const n = runSection('bars', vectors.bars, (v) => diff(bars(v.seed, v.case, cases), v.out));
    expect(n).toBe(EXPECTED_COUNTS.bars);
  });

  it('barGrow', () => {
    const n = runSection('barGrow', vectors.barGrow, (v) => diff(barGrow(v.t, v.row), v.out));
    expect(n).toBe(EXPECTED_COUNTS.barGrow);
  });

  it('actions', () => {
    const n = runSection('actions', vectors.actions, (v) => diff(actions(v.t, SEED), v.out));
    expect(n).toBe(EXPECTED_COUNTS.actions);
  });

  it('log', () => {
    const n = runSection('log', vectors.log, (v) => diff(log(v.t, SEED, cases), v.out));
    expect(n).toBe(EXPECTED_COUNTS.log);
  });

  it('queued', () => {
    const n = runSection('queued', vectors.queued, (v) => diff(queued(v.t, SEED, v.case), v.out));
    expect(n).toBe(EXPECTED_COUNTS.queued);
  });

  it('chief', () => {
    const n = runSection('chief', vectors.chief, (v) => diff(chief(v.t, chiefText), v.out));
    expect(n).toBe(EXPECTED_COUNTS.chief);
  });

  it('split', () => {
    const n = runSection('split', vectors.split, (v) => diff(split(v.t, SEED), v.out));
    expect(n).toBe(EXPECTED_COUNTS.split);
  });

  it('spark', () => {
    const n = runSection('spark', vectors.spark, (v) => diff(spark(v.t, SEED), v.out));
    expect(n).toBe(EXPECTED_COUNTS.spark);
  });

  it('stream', () => {
    const n = runSection('stream', vectors.stream, (v) => diff(stream(v.t, SEED, v.type, v.x), v.out));
    expect(n).toBe(EXPECTED_COUNTS.stream);
  });

  it('jumps', () => {
    const n = runSection('jumps', vectors.jumps, (v) =>
      diff(
        {
          toCase: [0, 4, 11].map((ci) => jumpToCase(v.t, ci)),
          toStage: [0, 1, 2, 3, 4].map((si) => jumpToStage(v.t, si)),
          next: nextCase(v.t),
          prev: prevCase(v.t),
        },
        { toCase: v.toCase, toStage: v.toStage, next: v.next, prev: v.prev },
      ),
    );
    expect(n).toBe(EXPECTED_COUNTS.jumps);
  });
});

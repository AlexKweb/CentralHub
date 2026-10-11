import {
  COST_PER_DECISION_MICROS,
  DECISIONS_LOOP_SECONDS,
  DECISIONS_PER_LOOP,
  DECISION_SEGMENTS,
} from './constants';
import type { Kpis } from './types';
import { fmtMoney, fmtThousands, norm } from './util';

export function decisions(t: number): number {
  const x = norm(t) / DECISIONS_LOOP_SECONDS;
  const fraction = x - Math.floor(x);
  return Math.min(DECISIONS_PER_LOOP - 1, Math.floor(fraction * DECISIONS_PER_LOOP));
}

export function kpis(t: number): Kpis {
  const d = decisions(t);
  const cents = Math.floor((d * COST_PER_DECISION_MICROS + 5000) / 10000);
  return {
    decisions: d,
    decisionsText: fmtThousands(d),
    segments: Math.floor((d * DECISION_SEGMENTS) / DECISIONS_PER_LOOP),
    spendCents: cents,
    spendText: fmtMoney(cents),
    marker: d / DECISIONS_PER_LOOP,
  };
}

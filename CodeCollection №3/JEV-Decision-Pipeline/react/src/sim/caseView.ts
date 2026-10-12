import {
  ACCENT_BLEND_SECONDS,
  BALL_TRAVEL,
  CASES,
  CONF_COUNTUP_SECONDS,
  GATE_HUNDREDTHS,
  STAGES,
} from './constants';
import { timeline } from './timeline';
import type { ActiveView, Case, ConfidenceView, ButtonState, Plate, Rgb } from './types';
import { fmtHundredths, hexRgb, hundredths } from './util';

export function confidence(t: number, cases: readonly Case[]): ConfidenceView {
  const tl = timeline(t);
  const h = hundredths(cases[tl.caseIndex].confidence);
  if (tl.stageIndex < 3) return { text: '-.--', hundredths: null, badge: null, fill: 0 };
  const shown =
    tl.stageIndex === 3
      ? Math.floor(h * Math.min(1, tl.stageElapsed / CONF_COUNTUP_SECONDS))
      : h;
  return {
    text: fmtHundredths(shown),
    hundredths: shown,
    badge: h >= GATE_HUNDREDTHS ? 'PASS' : 'REVIEW',
    fill: shown / 100,
  };
}

export function buttons(stage: number): ButtonState[] {
  return STAGES.map((_, i) =>
    i < stage ? 'done' : i === stage ? 'current' : i === stage + 1 ? 'next' : 'future',
  );
}

export function subtitle(t: number, cases: readonly Case[]): string {
  const tl = timeline(t);
  const c = cases[tl.caseIndex];
  if (tl.stageIndex === 0) return '';
  if (tl.stageIndex < 3) return c.question;
  return `${c.question} → ${c.answer} ${fmtHundredths(hundredths(c.confidence))} → ${c.gateLabel}`;
}

/** Blends from the previous case's accent during the first 0.4 s of a case. */
export function accent(t: number, cases: readonly Case[]): Rgb {
  const tl = timeline(t);
  const ci = tl.caseIndex;
  const cur = hexRgb(cases[ci].accent);
  const k = tl.local / ACCENT_BLEND_SECONDS;
  if (k >= 1) return cur;
  const prev = hexRgb(cases[(ci + CASES - 1) % CASES].accent);
  const channel = (i: number) => Math.floor(prev[i] + (cur[i] - prev[i]) * k + 0.5);
  return [channel(0), channel(1), channel(2)];
}

function plate(stageIndex: number, c: Case): string {
  const h = hundredths(c.confidence);
  const conf = fmtHundredths(h);
  const passed = h >= GATE_HUNDREDTHS;
  if (stageIndex === 0) return 'state packed · evidence';
  if (stageIndex === 1) return 'typed question · asked';
  if (stageIndex === 2) return `→ ${c.answer} · ${conf}`;
  if (stageIndex === 3) return passed ? `${conf} ≥ 0.85 · pass` : `${conf} < 0.85 · human`;
  return passed ? 'done · code acts' : '→ human · review';
}

export function active(t: number, cases: readonly Case[]): ActiveView {
  const tl = timeline(t);
  const si = tl.stageIndex;
  const c = cases[tl.caseIndex];
  const path = c.path;
  const arrived = tl.stageProgress >= BALL_TRAVEL;
  const plates: Plate[] = [];
  for (let i = 0; i <= si; i++) {
    if (i < si || arrived) plates.push({ card: path[i], text: plate(i, c) });
  }
  return {
    lit: path.slice(0, si + 1),
    ball: {
      from: si > 0 ? path[si - 1] : null,
      to: path[si],
      progress: Math.min(1, tl.stageProgress / BALL_TRAVEL),
      arrived,
    },
    plates,
  };
}

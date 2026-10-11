import { create } from 'zustand';
import { CASES, STAGES, jumpToCase, jumpToStage, nextCase, prevCase } from '../sim';

export interface UrlState {
  t: number;
  seed: number;
  paused: boolean;
  fx: boolean;
}

/** `?t=&seed=&paused=1&case=&stage=&fx=0`; case and stage are applied on top of t, in that order. */
export function parseUrl(search: string): UrlState {
  const q = new URLSearchParams(search);
  const num = (key: string, fallback: number): number => {
    const raw = q.get(key);
    const n = raw === null || raw.trim() === '' ? NaN : Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };

  let t = num('t', 0);
  const caseNumber = num('case', NaN);
  if (Number.isInteger(caseNumber) && caseNumber >= 1 && caseNumber <= CASES) {
    t = jumpToCase(t, caseNumber - 1);
  }
  const stageParam = (q.get('stage') ?? '').toLowerCase();
  const stageIndex = /^[1-5]$/.test(stageParam)
    ? Number(stageParam) - 1
    : (STAGES as readonly string[]).indexOf(stageParam);
  if (stageIndex >= 0) t = jumpToStage(t, stageIndex);

  return {
    t,
    seed: Math.trunc(num('seed', 1)),
    paused: q.get('paused') === '1',
    fx: q.get('fx') !== '0',
  };
}

export interface ClockState extends UrlState {
  advance: (dt: number) => void;
  togglePause: () => void;
  toggleFx: () => void;
  stepCase: (dir: 1 | -1) => void;
  seekStage: (stageIndex: number) => void;
}

export const useClock = create<ClockState>()((set) => ({
  ...parseUrl(window.location.search),
  advance: (dt) => set((s) => (s.paused ? s : { t: s.t + dt })),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  toggleFx: () => set((s) => ({ fx: !s.fx })),
  stepCase: (dir) => set((s) => ({ t: dir > 0 ? nextCase(s.t) : prevCase(s.t) })),
  seekStage: (stageIndex) => set((s) => ({ t: jumpToStage(s.t, stageIndex) })),
}));

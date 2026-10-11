import { CASES, CASE_SECONDS, CYCLE_SECONDS, STAGE_STARTS, STAGES, STAGE_DURATIONS } from './constants';
import type { Timeline } from './types';
import { clamp, norm } from './util';

export function timeline(t: number): Timeline {
  const now = norm(t);
  const cycle = Math.floor(now / CYCLE_SECONDS);
  const inCycle = now - cycle * CYCLE_SECONDS;
  const caseIndex = clamp(Math.floor(inCycle / CASE_SECONDS), 0, CASES - 1);
  const local = Math.max(0, inCycle - caseIndex * CASE_SECONDS);
  let stageIndex = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (STAGE_STARTS[i] <= local) stageIndex = i;
  }
  const stageElapsed = local - STAGE_STARTS[stageIndex];
  return {
    cycle,
    caseIndex,
    caseNumber: caseIndex + 1,
    stageIndex,
    stage: STAGES[stageIndex],
    local,
    stageElapsed,
    stageProgress: Math.min(1, stageElapsed / STAGE_DURATIONS[stageIndex]),
    caseProgress: local / CASE_SECONDS,
  };
}

export function jumpToCase(t: number, caseIndex: number): number {
  return Math.floor(norm(t) / CYCLE_SECONDS) * CYCLE_SECONDS + caseIndex * CASE_SECONDS;
}

export function jumpToStage(t: number, stageIndex: number): number {
  return Math.floor(norm(t) / CASE_SECONDS) * CASE_SECONDS + STAGE_STARTS[stageIndex];
}

export function nextCase(t: number): number {
  return (Math.floor(norm(t) / CASE_SECONDS) + 1) * CASE_SECONDS;
}

export function prevCase(t: number): number {
  return Math.max(0, (Math.floor(norm(t) / CASE_SECONDS) - 1) * CASE_SECONDS);
}

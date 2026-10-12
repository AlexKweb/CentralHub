import { describe, expect, it } from 'vitest';
import casesJson from '@shared/cases.json';
import {
  confidence,
  jumpToCase,
  jumpToStage,
  kpis,
  nextCase,
  prevCase,
  subtitle,
  timeline,
} from './index';
import type { CasesDoc } from './types';

const cases = (casesJson as CasesDoc).cases;

describe('timeline boundaries', () => {
  it('starts case 01 at the state stage', () => {
    expect(timeline(0)).toMatchObject({ caseNumber: 1, stage: 'state', stageIndex: 0 });
  });

  it('switches to ask at 1.2 s and stays in code up to 7.999 s', () => {
    expect(timeline(1.2)).toMatchObject({ caseIndex: 0, stage: 'ask' });
    expect(timeline(7.999)).toMatchObject({ caseIndex: 0, stage: 'code', stageIndex: 4 });
  });

  it('rolls over to case 02 at 8 s and wraps the 96 s cycle', () => {
    expect(timeline(8)).toMatchObject({ caseIndex: 1, stage: 'state' });
    expect(timeline(96)).toMatchObject({ cycle: 1, caseIndex: 0, stage: 'state' });
  });
});

describe('jump helpers', () => {
  it('jumps to a case inside the current cycle', () => {
    expect(jumpToCase(13.68, 4)).toBe(32);
    expect(jumpToCase(100, 11)).toBe(96 + 88);
  });

  it('jumps to a stage inside the current case', () => {
    expect(jumpToStage(13.68, 2)).toBeCloseTo(10.8);
  });

  it('steps by whole cases and clamps prev at zero', () => {
    expect(nextCase(13.68)).toBe(16);
    expect(prevCase(13.68)).toBe(0);
    expect(prevCase(21)).toBe(8);
    expect(prevCase(3)).toBe(0);
  });
});

describe('KPI and case readouts', () => {
  it('formats decisions with thin groups and spend in dollars', () => {
    expect(kpis(102.8475)).toMatchObject({
      decisions: 6856,
      decisionsText: '6 856',
      spendText: '$0.29',
    });
  });

  it('hides confidence before the gate and shows the case value after it', () => {
    expect(confidence(2, cases)).toMatchObject({ text: '-.--', hundredths: null, badge: null });
    expect(confidence(7.6, cases)).toMatchObject({ text: '0.97', badge: 'PASS' });
  });

  it('marks a case below the gate for review', () => {
    // Case 07 (contracts) at its code stage: 0.79 is below the 0.85 gate.
    expect(confidence(55.6, cases)).toMatchObject({ text: '0.79', badge: 'REVIEW' });
  });

  it('builds the subtitle chain as the stages advance', () => {
    expect(subtitle(0, cases)).toBe('');
    expect(subtitle(4.5, cases)).toBe('Choice · folder → phishing 0.97 → quarantine');
  });
});

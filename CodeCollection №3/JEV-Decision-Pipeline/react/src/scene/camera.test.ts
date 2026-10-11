import { describe, expect, it } from 'vitest';
import casesJson from '@shared/cases.json';
import { CASES, CASE_SECONDS, STAGES, STAGE_STARTS } from '../sim';
import type { CasesDoc, Vec3 } from '../sim';
import { STAGE_CAMERA, blendedFrame, cameraPose } from './camera';
import type { CameraPose } from './camera';
import { cardCenters, cardsDoc } from './layout';

const cases = (casesJson as CasesDoc).cases;
const centers = cardCenters(cardsDoc.columns);
const DEG = Math.PI / 180;

function centerOf(id: string): Vec3 {
  const v = centers.get(id);
  if (!v) throw new Error(`no centre for ${id}`);
  return v;
}

function expectClose(actual: Vec3, expected: Vec3): void {
  actual.forEach((c, i) => expect(c).toBeCloseTo(expected[i], 9));
}

function maxDelta(a: CameraPose, b: CameraPose): number {
  const pairs = [
    [a.position, b.position],
    [a.target, b.target],
    [a.up, b.up],
  ] as const;
  return Math.max(...pairs.flatMap(([x, y]) => x.map((c, i) => Math.abs(c - y[i]))));
}

describe('cameraPose', () => {
  it('is a pure function of t', () => {
    expect(cameraPose(13.37, cases, centers)).toEqual(cameraPose(13.37, cases, centers));
  });

  it('is continuous across every stage and case boundary, including the cycle wrap', () => {
    for (let ci = 0; ci <= CASES; ci++) {
      for (const start of STAGE_STARTS) {
        const b = ci * CASE_SECONDS + start;
        const jump = maxDelta(cameraPose(b - 1e-6, cases, centers), cameraPose(b + 1e-6, cases, centers));
        expect(jump, `t=${b}`).toBeLessThan(1e-3);
      }
    }
  });

  it('starts each stage from the previous target and converges on the current preset', () => {
    STAGES.forEach((stage, si) => {
      for (let ci = 0; ci < CASES; ci++) {
        const b = ci * CASE_SECONDS + STAGE_STARTS[si];
        const prevCard = si > 0 ? cases[ci].path[si - 1] : cases[(ci + CASES - 1) % CASES].path[STAGES.length - 1];
        expectClose(blendedFrame(b, cases, centers).target, centerOf(prevCard));

        // 1.0 s is past the 0.9 s blend and still inside every stage.
        const settled = blendedFrame(b + 1, cases, centers);
        expectClose(settled.target, centerOf(cases[ci].path[si]));
        expect(settled.yaw).toBeCloseTo(STAGE_CAMERA[stage].yaw * DEG, 9);
        expect(settled.distance).toBe(STAGE_CAMERA[stage].distance);
      }
    });
  });
});

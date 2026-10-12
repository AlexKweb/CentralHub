import { describe, expect, it } from 'vitest';
import casesJson from '@shared/cases.json';
import { STAGE_STARTS, CASE_SECONDS } from '../sim';
import type { CasesDoc, Vec3 } from '../sim';
import { bezierPoint, linkCurve } from './curves';
import { cardCenters, cardsDoc } from './layout';
import { routeView } from './route';

const cases = (casesJson as CasesDoc).cases;
const centers = cardCenters(cardsDoc.columns);
const at = (stage: number, offset: number) => STAGE_STARTS[stage] + offset;

function expectClose(actual: Vec3, expected: Vec3): void {
  actual.forEach((c, i) => expect(c).toBeCloseTo(expected[i], 6));
}

describe('routeView', () => {
  const path = cases[0].path;
  const c = (id: string): Vec3 => centers.get(id) as Vec3;

  it('fades the ball in on the state card in stage 0, with no path yet', () => {
    const v = routeView(at(0, 0.3), cases, centers);
    expect(v.pairs).toEqual([]);
    expect(v.flash).toBeNull();
    expectClose(v.ball.at, c(path[0]));
    expect(v.ball.alpha).toBeGreaterThan(0);
    expect(v.ball.alpha).toBeLessThan(1);
  });

  it('draws the path between consecutive lit cards and starts the ball on the source edge', () => {
    const v = routeView(at(1, 0), cases, centers);
    expect(v.pairs).toEqual([[path[0], path[1]]]);
    expectClose(v.ball.at, linkCurve(c(path[0]), c(path[1]))[0]);
    expect(v.ball.alpha).toBe(0);
  });

  it('moves along the link curve by eased progress', () => {
    // Stage 1 lasts 1.6 s and the ball covers its first 70 %; 0.56 s in is half-way (eased 0.5).
    const v = routeView(at(1, 0.56), cases, centers);
    expectClose(v.ball.at, bezierPoint(linkCurve(c(path[0]), c(path[1])), 0.5));
  });

  it('flashes the target card on arrival and lets it die out by the end of the stage', () => {
    const arrival = routeView(at(1, 0.7 * 1.6 + 1e-6), cases, centers);
    expect(arrival.flash?.strength).toBeGreaterThan(0.999);
    expectClose(arrival.flash?.at as Vec3, c(path[1]));
    expect(arrival.ball.alpha).toBeGreaterThan(0.999);

    const end = routeView(at(1, 1.6 - 1e-6), cases, centers);
    expect(end.flash?.strength).toBeLessThan(1e-3);
    expect(end.ball.alpha).toBeLessThan(1e-3);
  });

  it('is a pure function of t', () => {
    expect(routeView(13.37, cases, centers)).toEqual(routeView(13.37, cases, centers));
  });

  it('starts a new path at each case', () => {
    const v = routeView(CASE_SECONDS + at(0, 0.1), cases, centers);
    expect(v.pairs).toEqual([]);
  });
});

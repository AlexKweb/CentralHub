import { BALL_TRAVEL, STAGE_DURATIONS, active, timeline } from '../sim';
import type { Case, Vec3 } from '../sim';
import { clamp } from '../sim/util';
import { bezierPoint, easeInOutCubic, linkCurve } from './curves';

/** Ball progress over which it fades in at the start of its travel. */
const FADE_IN = 0.25;

export interface RouteView {
  /** Consecutive lit cards, as [from, to] ids. */
  pairs: [string, string][];
  ball: { at: Vec3; alpha: number };
  /** Set from the ball's arrival until the stage ends; strength falls from 1 to 0. */
  flash: { at: Vec3; strength: number } | null;
}

/** Ball and flash for time t. Stage 0 has no source card, so the ball fades in on the state card. */
export function routeView(t: number, cases: readonly Case[], centers: ReadonlyMap<string, Vec3>): RouteView {
  const view = active(t, cases);
  const tl = timeline(t);
  const centre = (id: string): Vec3 => {
    const c = centers.get(id);
    if (!c) throw new Error(`route: unknown card ${id}`);
    return c;
  };

  const pairs = view.lit.slice(1).map((to, i): [string, string] => [view.lit[i], to]);

  const { from, to, progress, arrived } = view.ball;
  const target = centre(to);
  const at: Vec3 = from === null ? target : bezierPoint(linkCurve(centre(from), target), easeInOutCubic(progress));

  const duration = STAGE_DURATIONS[tl.stageIndex];
  const sinceArrival = Math.max(0, tl.stageElapsed - BALL_TRAVEL * duration);
  const untilEnd = duration * (1 - BALL_TRAVEL);
  const strength = arrived ? (1 - clamp(sinceArrival / untilEnd, 0, 1)) ** 2 : 0;

  let alpha: number;
  if (arrived) alpha = strength;
  else if (from === null) alpha = easeInOutCubic(progress);
  else alpha = Math.min(1, progress / FADE_IN);

  return {
    pairs,
    ball: { at, alpha },
    flash: arrived ? { at: target, strength } : null,
  };
}

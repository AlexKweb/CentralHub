import { CASES, STAGES, timeline } from '../sim';
import type { Case, StageName, Vec3 } from '../sim';

const DEG = Math.PI / 180;
/** Stages last at least 1.2 s, so each blend from the previous stage completes inside its own stage. */
const BLEND_SECONDS = 0.9;
const SWAY_YAW_DEG = 1.5;
const SWAY_PITCH_DEG = 0.8;
/** Drops the stage target below the card so the card sits above the scene centre (SPEC §6.4). */
const TARGET_DROP = 1.5;
/** The target projects to 721 of 1568 px: the scene zone centre. */
const FOCUS_Y = 721 / 1568;

/** Per-stage presets: yaw, pitch and roll in degrees, distance in world units. */
export const STAGE_CAMERA: Record<StageName, { yaw: number; pitch: number; roll: number; distance: number }> = {
  state: { yaw: 18, pitch: -8, roll: -4, distance: 21 },
  ask: { yaw: 14, pitch: -6, roll: -3, distance: 19 },
  jev: { yaw: 4, pitch: -3, roll: 0, distance: 23 },
  gate: { yaw: -6, pitch: -2, roll: 0, distance: 19 },
  code: { yaw: -3, pitch: 0, roll: 0, distance: 25 },
};

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  up: Vec3;
}

/** Angles in radians. */
export interface CameraFrame {
  target: Vec3;
  yaw: number;
  pitch: number;
  roll: number;
  distance: number;
}

/** Halfway to the origin in x frames the card pair; the 1.5 drop lifts the active card above the scene centre. */
function stageFrame(cardId: string, stage: StageName, centers: ReadonlyMap<string, Vec3>): CameraFrame {
  const c = centers.get(cardId);
  if (!c) throw new Error(`camera target: unknown card ${cardId}`);
  const p = STAGE_CAMERA[stage];
  return {
    target: [0.5 * c[0], c[1] - TARGET_DROP, 0],
    yaw: p.yaw * DEG,
    pitch: p.pitch * DEG,
    roll: p.roll * DEG,
    distance: p.distance,
  };
}

function easeOutCubic(x: number): number {
  const u = 1 - x;
  return 1 - u * u * u;
}

function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

function lerpFrame(a: CameraFrame, b: CameraFrame, k: number): CameraFrame {
  return {
    target: [lerp(a.target[0], b.target[0], k), lerp(a.target[1], b.target[1], k), lerp(a.target[2], b.target[2], k)],
    yaw: lerp(a.yaw, b.yaw, k),
    pitch: lerp(a.pitch, b.pitch, k),
    roll: lerp(a.roll, b.roll, k),
    distance: lerp(a.distance, b.distance, k),
  };
}

function normalize(v: Vec3): Vec3 {
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Target and angles without sway: the previous stage's frame eased into the current stage's. */
export function blendedFrame(t: number, cases: readonly Case[], centers: ReadonlyMap<string, Vec3>): CameraFrame {
  const tl = timeline(t);
  const current = stageFrame(cases[tl.caseIndex].path[tl.stageIndex], tl.stage, centers);
  const prevStage = (tl.stageIndex + STAGES.length - 1) % STAGES.length;
  const prevCase = tl.stageIndex > 0 ? tl.caseIndex : (tl.caseIndex + CASES - 1) % CASES;
  const previous = stageFrame(cases[prevCase].path[prevStage], STAGES[prevStage], centers);
  return lerpFrame(previous, current, easeOutCubic(Math.min(1, tl.stageElapsed / BLEND_SECONDS)));
}

export function poseOf(f: CameraFrame): CameraPose {
  const cp = Math.cos(f.pitch);
  const dir: Vec3 = [Math.sin(f.yaw) * cp, -Math.sin(f.pitch), Math.cos(f.yaw) * cp];
  const position: Vec3 = [
    f.target[0] + f.distance * dir[0],
    f.target[1] + f.distance * dir[1],
    f.target[2] + f.distance * dir[2],
  ];
  // World up made perpendicular to the view axis, then rolled about it.
  const k = dir[1];
  const u0 = normalize([-k * dir[0], 1 - k * dir[1], -k * dir[2]]);
  const s = cross(dir, u0);
  const up: Vec3 = [
    u0[0] * Math.cos(f.roll) + s[0] * Math.sin(f.roll),
    u0[1] * Math.cos(f.roll) + s[1] * Math.sin(f.roll),
    u0[2] * Math.cos(f.roll) + s[2] * Math.sin(f.roll),
  ];
  return { position, target: f.target, up };
}

/** A pure function of t: the same t always gives the same pose. */
export function cameraPose(t: number, cases: readonly Case[], centers: ReadonlyMap<string, Vec3>): CameraPose {
  const f = blendedFrame(t, cases, centers);
  return poseOf({
    ...f,
    yaw: f.yaw + SWAY_YAW_DEG * DEG * Math.sin(0.4 * t),
    pitch: f.pitch + SWAY_PITCH_DEG * DEG * Math.sin(0.31 * t + 1),
  });
}

/** Arguments for `PerspectiveCamera.setViewOffset`: shifts the principal point so the target lands on FOCUS_Y. */
export function viewOffset(width: number, height: number): [number, number, number, number, number, number] {
  return [width, height, 0, height / 2 - FOCUS_Y * height, width, height];
}

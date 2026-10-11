import type { CaseType } from './types';

export const STAGES = ['state', 'ask', 'jev', 'gate', 'code'] as const;
export const STAGE_STARTS: readonly number[] = [0, 1.2, 2.8, 4.4, 6.0];
export const STAGE_DURATIONS: readonly number[] = [1.2, 1.6, 1.6, 1.6, 2.0];

export const CASES = 12;
export const CASE_SECONDS = 8;
export const CYCLE_SECONDS = 96;

export const DECISIONS_LOOP_SECONDS = 150;
export const DECISIONS_PER_LOOP = 10000;
export const DECISION_SEGMENTS = 30;
/** Cost per decision in micro-dollars: $0.000042 = 42. */
export const COST_PER_DECISION_MICROS = 42;
export const GATE_HUNDREDTHS = 85;

export const CONF_COUNTUP_SECONDS = 0.3;
export const BALL_TRAVEL = 0.7;
export const ACCENT_BLEND_SECONDS = 0.4;
export const BAR_GROW_SECONDS = 0.6;
export const BAR_STAGGER_SECONDS = 0.06;

export const LOG_SLOTS_PER_SECOND = 2;
export const LOG_SLOTS_PER_CASE = 16;
export const LOG_VISIBLE = 5;
/** Slots of a case inside its 16-slot block: ask, jev, gate, code. */
export const LOG_CASE_SLOTS: readonly number[] = [3, 6, 9, 12];

export const CHIEF_CHARS_PER_SECOND = 24;
export const CHIEF_VISIBLE_LINES = 11;

export const ACTIONS_STEP_SECONDS = 2;
export const ACTIONS_START = 5;
export const ACTIONS_MIN = 3;
export const ACTIONS_MAX = 8;
export const ACTIONS_MAX_STEPS = 48;

export const SPLIT_STEPS_PER_SECOND = 2;
/** LLM writes, Jev decides, code acts. */
export const SPLIT_BASE: readonly number[] = [4, 18, 15];
export const SPLIT_SEGMENTS = 20;

export const SPARK_STEPS_PER_SECOND = 4;
export const SPARK_POINTS = 24;

export const STREAM_HISTORY_SECONDS = 6.5;

export const COLUMN_SPACING = 3;
export const CARD_STEP = 1.25;
export const COLUMN_Y: readonly number[] = [0, -0.35, 0.2, -0.15, 0.1];

export const CASE_TYPES: readonly CaseType[] = ['choice', 'score', 'noul'];
export const BAR_ROWS = ['Choice A', 'Choice B', 'Score A', 'Score B', 'Noul A', 'Noul B'] as const;
export const ANSWERS: Record<CaseType, readonly string[]> = {
  choice: ['research', 'write', 'review', 'billing', 'phishing', 'sponsor'],
  score: ['low', 'medium', 'high', 'critical'],
  noul: ['yes', 'no'],
};

/** Sub-seed channels for hash32(seed, channel, ...); 9 and 10 are render-only. */
export const CHANNEL = {
  LINKS: 1,
  BARS: 2,
  LOG: 3,
  QUEUE: 4,
  ACTIONS: 5,
  SPLIT: 6,
  SPARK: 7,
  STREAM: 8,
  PARTICLES: 9,
  DUST: 10,
} as const;

export type StageName = 'state' | 'ask' | 'jev' | 'gate' | 'code';
export type CaseType = 'choice' | 'score' | 'noul';
export type ColumnId = 'state' | 'questions' | 'jev' | 'gate' | 'code';
export type ButtonState = 'done' | 'current' | 'next' | 'future';
export type LinkColor = 'white' | 'pink' | 'cyan' | 'lime' | 'lavender';
export type LogTag = 'ask' | 'jev' | 'gate' | 'code' | 'limit';
export type Rgb = [number, number, number];
export type Vec3 = [number, number, number];
export type Split = [number, number, number];

export interface Case {
  id: string;
  title: string;
  tile: string;
  accent: string;
  type: CaseType;
  question: string;
  answer: string;
  confidence: number;
  gateLabel: string;
  jevMs: number;
  logCode: string;
  /** Card ids for state, questions, jev, gate, code. */
  path: string[];
}

export interface CardRow {
  k: string;
  v: string;
  hl?: boolean;
}

export interface Card {
  id: string;
  title: string;
  rows: CardRow[];
}

export interface Column {
  id: ColumnId;
  num: string;
  title: string;
  color: string;
  cards: Card[];
}

export interface CasesDoc {
  version: number;
  gate: number;
  cases: Case[];
}

export interface CardsDoc {
  version: number;
  columns: Column[];
}

export interface Timeline {
  cycle: number;
  caseIndex: number;
  caseNumber: number;
  stageIndex: number;
  stage: StageName;
  local: number;
  stageElapsed: number;
  stageProgress: number;
  caseProgress: number;
}

export interface Kpis {
  decisions: number;
  decisionsText: string;
  segments: number;
  spendCents: number;
  spendText: string;
  marker: number;
}

export interface ConfidenceView {
  text: string;
  hundredths: number | null;
  badge: 'PASS' | 'REVIEW' | null;
  fill: number;
}

export interface Plate {
  card: string;
  text: string;
}

export interface ActiveView {
  lit: string[];
  ball: { from: string | null; to: string; progress: number; arrived: boolean };
  plates: Plate[];
}

export interface Link {
  from: string;
  to: string;
  color: LinkColor;
}

export interface BarRow {
  label: string;
  type: CaseType;
  value: number;
  answer: string;
  bright: boolean;
}

export interface LogLine {
  tag: LogTag;
  text: string;
}

export interface LogView {
  lines: LogLine[];
  scroll: number;
}

export interface ChiefView {
  pos: number;
  line: number;
  col: number;
  visible: string[];
}

export interface Spark {
  values: number[];
  offset: number;
}

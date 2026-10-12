import chiefText from '@shared/chief.py?raw';
import {
  CASE_TYPES,
  LOG_SLOTS_PER_SECOND,
  SPLIT_SEGMENTS,
  actions,
  barGrow,
  bars,
  chief,
  kpis,
  log,
  queued,
  split,
  stream,
} from '../sim';
import type { Case, CaseType } from '../sim';
import { useClock } from '../state/store';
import { tokenizeChief } from './chiefTokens';
import { curvePoints, valueY } from './curves';

const TYPE_COLOR: Record<CaseType, string> = { choice: '#FF5C8A', score: '#4FD1E8', noul: '#C6F23A' };
const TYPE_LABEL: Record<CaseType, string> = { choice: 'Choice', score: 'Score', noul: 'Noul' };

const STREAM_SAMPLES = 80;
const STREAM_W = 100;
const STREAM_H = 100;
const STREAM_Y_MIN = 0.55;
const STREAM_Y_MAX = 1.05;
const STREAM_GATE = 0.85;
const STREAM_XS = Array.from({ length: STREAM_SAMPLES }, (_, i) => i / (STREAM_SAMPLES - 1));
const GATE_Y = valueY(STREAM_GATE, STREAM_H, STREAM_Y_MIN, STREAM_Y_MAX);

const LOG_LINE_PX = 15;
const ACTION_SEGMENTS = 10;

const LANES = [
  { label: 'LLM writes', lane: 'llm', strong: false },
  { label: 'Jev decides', lane: 'jev', strong: true },
  { label: 'code acts', lane: 'code', strong: false },
] as const;

interface SimProps {
  t: number;
  seed: number;
  cases: readonly Case[];
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function Segments({ count, lit, lane }: { count: number; lit: number; lane?: 'llm' | 'jev' | 'code' }) {
  return (
    <span className="segments" data-lane={lane}>
      {Array.from({ length: count }, (_, i) => (
        <i key={i} className={i < lit ? 'on' : undefined} />
      ))}
    </span>
  );
}

export function ParallelQuestions({ t, seed, cases, caseIndex }: SimProps & { caseIndex: number }) {
  const rows = bars(seed, caseIndex, cases);
  return (
    <>
      <div className="pq-rows">
        {rows.map((row, i) => {
          const fill = row.value * barGrow(t, i) * 100;
          return (
            <div className="pq-row" key={row.label}>
              <span className="pq-label">{row.label}</span>
              <span className="track pq-track">
                <i style={{ width: `${fill}%`, background: TYPE_COLOR[row.type] }} />
                {fill > 0 && <b style={{ left: `${fill}%` }} />}
              </span>
              <span className={row.bright ? 'pq-answer bright' : 'pq-answer'}>{row.answer}</span>
            </div>
          );
        })}
      </div>
      <div className="panel-foot">three answers ≈ one cheap decision</div>
    </>
  );
}

export function ConfidenceStream({ t, seed }: { t: number; seed: number }) {
  return (
    <>
      <div className="stream-chart">
        <svg viewBox={`0 0 ${STREAM_W} ${STREAM_H}`} preserveAspectRatio="none">
          <line className="stream-gate" x1={0} x2={STREAM_W} y1={GATE_Y} y2={GATE_Y} />
          {CASE_TYPES.map((type, k) => (
            <polyline
              key={type}
              stroke={TYPE_COLOR[type]}
              points={curvePoints(
                STREAM_XS.map((x) => stream(t, seed, k, x)),
                STREAM_W,
                STREAM_H,
                STREAM_Y_MIN,
                STREAM_Y_MAX,
              )}
            />
          ))}
        </svg>
        <span className="stream-gate-label" style={{ top: `${GATE_Y}%` }}>
          {STREAM_GATE.toFixed(2)}
        </span>
      </div>
      <div className="legend-row">
        <span className="legend">
          {CASE_TYPES.map((type) => (
            <span key={type} style={{ color: TYPE_COLOR[type] }}>
              {TYPE_LABEL[type]}
            </span>
          ))}
        </span>
        <span className="dim">under → human</span>
      </div>
    </>
  );
}

export function UseCases({ t, seed, cases, caseIndex }: SimProps & { caseIndex: number }) {
  const waiting = queued(t, seed, caseIndex);
  return (
    <div className="tile-grid">
      {cases.map((c, i) => {
        const current = i === caseIndex;
        const mark = current ? 'current' : waiting.includes(i) ? 'queued' : undefined;
        return (
          <button
            key={c.id}
            type="button"
            className={current ? 'case-tile current' : 'case-tile'}
            onClick={(e) => {
              e.currentTarget.blur();
              useClock.getState().seekCase(i);
            }}
          >
            <span className="tile-num">{pad2(i + 1)}</span>
            <span className="tile-name">{c.tile}</span>
            {mark && <i className="tile-mark" data-mark={mark} />}
          </button>
        );
      })}
    </div>
  );
}

export function ChiefCode({ t }: { t: number }) {
  const view = chief(t, chiefText);
  const last = view.visible.length - 1;
  return (
    <div className="chief-code">
      {view.visible.map((line, i) => (
        <div key={i} className={i === last ? 'chief-line current' : 'chief-line'}>
          {tokenizeChief(line).map((tok, j) => (
            <span key={j} className={`tok-${tok.kind}`}>
              {tok.text}
            </span>
          ))}
          {i === last && <i className="chief-cursor" />}
        </div>
      ))}
    </div>
  );
}

export function RunLog({ t, seed, cases }: SimProps) {
  const view = log(t, seed, cases);
  // One row below the window, so the upward scroll never reveals an empty gap.
  const rows = [...view.lines, ...log(t + 1 / LOG_SLOTS_PER_SECOND, seed, cases).lines.slice(-1)];
  return (
    <div className="log-window">
      <div className="log-rows" style={{ transform: `translateY(${-view.scroll * LOG_LINE_PX}px)` }}>
        {rows.map((line, i) => (
          <div className="log-row" key={i}>
            <span className="log-tag" data-tag={line.tag}>
              {line.tag}
            </span>
            <span className="log-text">{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SplitLanes({ t, seed }: { t: number; seed: number }) {
  const values = split(t, seed);
  return (
    <div className="split-lanes">
      {LANES.map((l, i) => (
        <div className="lane-row" key={l.lane}>
          <span className={l.strong ? 'lane-label strong' : 'lane-label'}>{l.label}</span>
          <Segments count={SPLIT_SEGMENTS} lit={values[i]} lane={l.lane} />
        </div>
      ))}
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
      <rect x="1" y="5" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function Guardrails({ t, seed }: { t: number; seed: number }) {
  const k = kpis(t);
  const acts = actions(t, seed);
  return (
    <div className="guard-body">
      <div className="guard-row">
        <span className="guard-label">spend cap</span>
        <span className="track guard-track">
          <i style={{ width: `${Math.min(100, k.spendCents)}%` }} />
        </span>
        <span className="guard-value">{`${k.spendText} / 1.00`}</span>
      </div>
      <div className="guard-row">
        <span className="guard-label">actions</span>
        <Segments count={ACTION_SEGMENTS} lit={acts} />
        <span className="guard-value">{`${acts} / ${ACTION_SEGMENTS}`}</span>
      </div>
      <div className="guard-foot">
        <LockIcon />
        <span>never auto-post to X · progress saved</span>
      </div>
    </div>
  );
}

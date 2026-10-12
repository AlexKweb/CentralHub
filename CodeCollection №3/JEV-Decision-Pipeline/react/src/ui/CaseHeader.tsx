import type { CSSProperties } from 'react';
import { CASES, STAGES, buttons, subtitle, timeline } from '../sim';
import type { Case } from '../sim';
import { useClock } from '../state/store';
import { ZONES, rectStyle } from './geometry';

const NEXT_PULSE_SECONDS = 1.2;

/** Pulse of the next-stage button in 0..1, a function of clock time so paused frames stay still. */
function nextPulse(t: number): number {
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / NEXT_PULSE_SECONDS);
}

export function CaseHeader({ t, cases }: { t: number; cases: readonly Case[] }) {
  const tl = timeline(t);
  const states = buttons(tl.stageIndex);
  const pulseStyle = { '--pulse': nextPulse(t) } as CSSProperties;
  return (
    <div className="zone case-header" data-zone="case" style={rectStyle(ZONES.case)}>
      <div className="case-badge">{`CASE ${String(tl.caseNumber).padStart(2, '0')} / ${CASES}`}</div>
      <div className="case-title">
        <h1>{cases[tl.caseIndex].title}</h1>
        <p className="case-sub">{subtitle(t, cases)}</p>
      </div>
      <div className="stages" style={pulseStyle}>
        {STAGES.map((name, i) => (
          <button
            key={name}
            type="button"
            className="stage-btn"
            data-stage={name}
            data-state={states[i]}
            onClick={(e) => {
              e.currentTarget.blur();
              useClock.getState().seekStage(i);
            }}
          >
            {name.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

import { CASES, STAGES, buttons, subtitle, timeline } from '../sim';
import type { Case } from '../sim';
import { useClock } from '../state/store';
import { ZONES, rectStyle } from './geometry';

export function CaseHeader({ t, cases }: { t: number; cases: readonly Case[] }) {
  const tl = timeline(t);
  const states = buttons(tl.stageIndex);
  return (
    <div className="zone case-header" data-zone="case" style={rectStyle(ZONES.case)}>
      <div className="case-badge">{`CASE ${String(tl.caseNumber).padStart(2, '0')} / ${CASES}`}</div>
      <div className="case-title">
        <h1>{cases[tl.caseIndex].title}</h1>
        <p className="case-sub">{subtitle(t, cases)}</p>
      </div>
      <div className="stages">
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

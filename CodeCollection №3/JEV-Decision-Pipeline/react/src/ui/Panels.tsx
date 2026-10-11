import { ZONES, rectStyle } from './geometry';
import type { ZoneName } from './geometry';

function Panel({ zone, title, right }: { zone: ZoneName; title: string; right: string }) {
  return (
    <section className="zone panel" data-zone={zone} style={rectStyle(ZONES[zone])}>
      <div className="panel-head">
        <span className="panel-title">{title}</span>
        <span className="accent-text">{right}</span>
      </div>
    </section>
  );
}

export function Panels({ caseNumber }: { caseNumber: number }) {
  return (
    <>
      <Panel zone="panel-parallel" title="Parallel questions" right="one state" />
      <Panel zone="panel-stream" title="Confidence stream" right="SIM" />
      <Panel zone="panel-cases" title="12 use cases" right={`case ${String(caseNumber).padStart(2, '0')}`} />
      <Panel zone="panel-chief" title="chief.py" right="14 l/s" />
      <Panel zone="panel-runlog" title="Run log" right="8 l/s" />
      <Panel zone="panel-split" title="The split" right="who does what" />
      <Panel zone="panel-guardrails" title="Guardrails" right="always on" />
    </>
  );
}

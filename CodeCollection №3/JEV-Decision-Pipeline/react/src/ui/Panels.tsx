import type { ReactNode } from 'react';
import { timeline } from '../sim';
import type { Case } from '../sim';
import { ZONES, rectStyle } from './geometry';
import type { ZoneName } from './geometry';
import {
  ChiefCode,
  ConfidenceStream,
  Guardrails,
  ParallelQuestions,
  RunLog,
  SplitLanes,
  UseCases,
} from './PanelBodies';

function Panel({
  zone,
  title,
  right,
  children,
}: {
  zone: ZoneName;
  title: string;
  right: string;
  children: ReactNode;
}) {
  return (
    <section className="zone panel" data-zone={zone} style={rectStyle(ZONES[zone])}>
      <div className="panel-head">
        <span className="panel-title">{title}</span>
        <span className="accent-text">{right}</span>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Panels({ t, seed, cases }: { t: number; seed: number; cases: readonly Case[] }) {
  const { caseIndex, caseNumber } = timeline(t);
  return (
    <>
      <Panel zone="panel-parallel" title="Parallel questions" right="one state">
        <ParallelQuestions t={t} seed={seed} cases={cases} caseIndex={caseIndex} />
      </Panel>
      <Panel zone="panel-stream" title="Confidence stream" right="SIM">
        <ConfidenceStream t={t} seed={seed} />
      </Panel>
      <Panel zone="panel-cases" title="12 use cases" right={`case ${String(caseNumber).padStart(2, '0')}`}>
        <UseCases t={t} seed={seed} cases={cases} caseIndex={caseIndex} />
      </Panel>
      <Panel zone="panel-chief" title="chief.py" right="14 l/s">
        <ChiefCode t={t} />
      </Panel>
      <Panel zone="panel-runlog" title="Run log" right="8 l/s">
        <RunLog t={t} seed={seed} cases={cases} />
      </Panel>
      <Panel zone="panel-split" title="The split" right="who does what">
        <SplitLanes t={t} seed={seed} />
      </Panel>
      <Panel zone="panel-guardrails" title="Guardrails" right="always on">
        <Guardrails t={t} seed={seed} />
      </Panel>
    </>
  );
}

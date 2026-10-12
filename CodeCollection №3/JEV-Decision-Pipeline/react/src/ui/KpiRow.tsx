import type { ReactNode } from 'react';
import {
  COST_PER_DECISION_MICROS,
  DECISIONS_PER_LOOP,
  DECISION_SEGMENTS,
  GATE_HUNDREDTHS,
  SPARK_POINTS,
  confidence,
  kpis,
  spark,
} from '../sim';
import type { Case } from '../sim';
import { ZONES, rectStyle } from './geometry';
import type { ZoneName } from './geometry';

const SPARK_W = 110;
const SPARK_H = 40;
// spark() values lie in [180, 300).
const SPARK_MIN = 180;
const SPARK_RANGE = 120;
const LATENCY_RUN_SECONDS = 12;

function Card({
  zone,
  label,
  children,
}: {
  zone: ZoneName;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="zone kpi" data-zone={zone} style={rectStyle(ZONES[zone])}>
      <div className="kpi-label">{label}</div>
      {children}
    </div>
  );
}

export function KpiRow({ t, seed, cases }: { t: number; seed: number; cases: readonly Case[] }) {
  const k = kpis(t);
  const sp = spark(t, seed);
  const conf = confidence(t, cases);
  const step = SPARK_W / (SPARK_POINTS - 1);
  const points = sp.values
    .map(
      (v, i) =>
        `${((i - sp.offset) * step).toFixed(1)},${(SPARK_H * (1 - (v - SPARK_MIN) / SPARK_RANGE)).toFixed(1)}`,
    )
    .join(' ');
  const costTen = ((COST_PER_DECISION_MICROS * DECISIONS_PER_LOOP) / 1_000_000).toFixed(2);
  const costPerMillion = (COST_PER_DECISION_MICROS / 1000).toFixed(3);
  const latencyRun = ((t / LATENCY_RUN_SECONDS) % 1) * 100;

  return (
    <>
      <div className="zone" data-zone="kpi" style={rectStyle(ZONES.kpi)} />
      <Card zone="kpi-decisions" label="DECISIONS · THIS RUN">
        <div className="kpi-value">{k.decisionsText}</div>
        <div className="seg-bar">
          {Array.from({ length: DECISION_SEGMENTS }, (_, i) => (
            <i key={i} className={i < k.segments ? 'on' : undefined} />
          ))}
        </div>
        <div className="kpi-foot">SIM · one loop = 10 000</div>
      </Card>
      <Card zone="kpi-latency" label="MEDIAN LATENCY · REPORTED">
        <div className="kpi-row">
          <span>
            <span className="kpi-value">~256</span>
            <span className="kpi-unit">ms</span>
          </span>
          <svg className="spark" width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}>
            <polyline points={points} />
          </svg>
        </div>
        <div className="thin-bar">
          <i style={{ left: `${latencyRun}%` }} />
        </div>
        <div className="kpi-foot">public demos · not SLAs</div>
      </Card>
      <Card zone="kpi-cost" label="COST · 10 000 DECISIONS">
        <div className="cost-value">{`≈ $${costTen}`}</div>
        <div className="bar-row">
          <b>jev</b>
          <span className="track">
            <i style={{ width: '4%' }} />
          </span>
          <span>{`$${costPerMillion} / M in · out free`}</span>
        </div>
        <div className="bar-row">
          <b>LLM</b>
          <span className="track">
            <i className="llm" style={{ width: '100%' }} />
          </span>
        </div>
      </Card>
      <Card zone="kpi-confidence" label="CONFIDENCE · LIVE">
        <div className="kpi-row">
          <span className={conf.hundredths === null ? 'kpi-value conf-value' : 'kpi-value conf-value live'}>
            {conf.text}
          </span>
          {conf.badge && <span className={`badge ${conf.badge === 'PASS' ? 'pass' : 'review'}`}>{conf.badge}</span>}
        </div>
        <div className="conf-bar">
          <i style={{ width: `${conf.fill * 100}%` }} />
          <b style={{ left: `${GATE_HUNDREDTHS}%` }} />
        </div>
        <div className="kpi-foot">
          <span>calibrate on yours</span>
          <span>{`gate ${(GATE_HUNDREDTHS / 100).toFixed(2)}`}</span>
        </div>
      </Card>
    </>
  );
}

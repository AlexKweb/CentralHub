import { ZONES, rectStyle } from './geometry';

export function Header() {
  return (
    <div className="zone header" data-zone="header" style={rectStyle(ZONES.header)}>
      <span className="brand">JEV / DECISION PIPELINE</span>
      <span className="accent-text">SYSTEM ONE · jev-1.13.0</span>
      <span className="flow">STATE → QUESTIONS → JEV → GATE → CODE</span>
      <span className="accent-text">centralhub · demo</span>
    </div>
  );
}

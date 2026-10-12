import { kpis } from '../sim';
import { ZONES, rectStyle } from './geometry';

export function Footer({ t }: { t: number }) {
  const { marker } = kpis(t);
  return (
    <div className="zone footer" data-zone="footer" style={rectStyle(ZONES.footer)}>
      <span>LLM WRITES · JEV DECIDES · CODE ACTS</span>
      <div className="timeline">
        <i style={{ left: `${marker * 100}%` }} />
      </div>
      <span className="muted">metrics illustrative · prices and gate from the article</span>
    </div>
  );
}

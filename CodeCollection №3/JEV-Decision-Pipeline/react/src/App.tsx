import casesJson from '@shared/cases.json';
import { accent } from './sim';
import type { CasesDoc } from './sim';
import { useClock } from './state/store';
import { useClockLoop, useKeys, useUiTime } from './state/hooks';
import { useJevHook } from './state/jevHook';
import { CaseHeader } from './ui/CaseHeader';
import { Footer } from './ui/Footer';
import { Frame } from './ui/Frame';
import { Header } from './ui/Header';
import { KpiRow } from './ui/KpiRow';
import { Panels } from './ui/Panels';
import './ui/styles.css';

const CASE_LIST = (casesJson as CasesDoc).cases;

export function App() {
  useClockLoop();
  useKeys();
  useJevHook();
  const t = useUiTime();
  const seed = useClock((s) => s.seed);
  return (
    <Frame accent={accent(t, CASE_LIST)}>
      <Header />
      <KpiRow t={t} seed={seed} cases={CASE_LIST} />
      <CaseHeader t={t} cases={CASE_LIST} />
      <Panels t={t} seed={seed} cases={CASE_LIST} />
      <Footer t={t} />
    </Frame>
  );
}

import { useEffect } from 'react';
import { timeline } from '../sim';
import type { StageName } from '../sim';
import { useClock } from './store';

export interface JevHook {
  ready: boolean;
  state: () => { case: number; stage: StageName; t: number; paused: boolean };
}

declare global {
  interface Window {
    __jev: JevHook;
  }
}

/** Test-facing handle; `ready` flips once fonts are loaded and the first render has committed. */
export function useJevHook(): void {
  useEffect(() => {
    const hook: JevHook = {
      ready: false,
      state: () => {
        const { t, paused } = useClock.getState();
        const tl = timeline(t);
        return { case: tl.caseNumber, stage: tl.stage, t, paused };
      },
    };
    window.__jev = hook;
    void document.fonts.ready.then(() => {
      hook.ready = true;
    });
  }, []);
}

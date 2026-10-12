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

let sceneRendered = false;
let composedFrame = false;

/** Called by the scene after a frame has drawn at the clock time; `ready` waits for it. */
export function markSceneRendered(): void {
  if (sceneRendered) return;
  sceneRendered = true;
  if (window.__jev) window.__jev.ready = true;
}

export function isSceneRendered(): boolean {
  return sceneRendered;
}

/** Set by the post-processing stack once its composer has drawn the current frame. */
export function markComposedFrame(): void {
  composedFrame = true;
}

/** Reads and clears the composed-frame flag; the render probe calls it once per frame. */
export function takeComposedFrame(): boolean {
  const seen = composedFrame;
  composedFrame = false;
  return seen;
}

/** Test-facing handle; `ready` flips once the 3D scene has rendered at the requested time. */
export function useJevHook(): void {
  useEffect(() => {
    const hook: JevHook = {
      ready: sceneRendered,
      state: () => {
        const { t, paused } = useClock.getState();
        const tl = timeline(t);
        return { case: tl.caseNumber, stage: tl.stage, t, paused };
      },
    };
    window.__jev = hook;
  }, []);
}

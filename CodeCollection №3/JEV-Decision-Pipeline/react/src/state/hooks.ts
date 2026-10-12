import { useEffect, useState } from 'react';
import { isSceneRendered } from './jevHook';
import { useClock } from './store';

const UI_HZ = 30;
/** Largest clock step per frame: a stalled frame slows playback instead of skipping a stage. */
const MAX_STEP_SECONDS = 0.25;

/** Clock time for rendering, sampled at most UI_HZ times per second so the UI re-renders at a bounded rate. */
export function useUiTime(): number {
  const [t, setT] = useState(() => useClock.getState().t);
  useEffect(() => {
    const sync = () => setT(useClock.getState().t);
    const id = window.setInterval(sync, 1000 / UI_HZ);
    return () => window.clearInterval(id);
  }, []);
  return t;
}

export function useClockLoop(): void {
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      // The clock waits for the first scene frame, so shader compilation at load does not run playback past a stage.
      if (isSceneRendered()) useClock.getState().advance(Math.min((now - last) / 1000, MAX_STEP_SECONDS));
      last = now;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
}

export function useKeys(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const clock = useClock.getState();
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (!e.repeat) clock.togglePause();
          break;
        case 'ArrowLeft':
          clock.stepCase(-1);
          break;
        case 'ArrowRight':
          clock.stepCase(1);
          break;
        case 'KeyF':
          clock.toggleFx();
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

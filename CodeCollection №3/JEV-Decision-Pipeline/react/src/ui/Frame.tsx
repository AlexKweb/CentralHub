import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Rgb } from '../sim';
import { useClock } from '../state/store';
import { FRAME, ZONES, rectStyle } from './geometry';

function frameScale(): number {
  return Math.min(window.innerWidth / FRAME.w, window.innerHeight / FRAME.h);
}

function useFrameScale(): number {
  const [scale, setScale] = useState(frameScale);
  useEffect(() => {
    const onResize = () => setScale(frameScale());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}

export function Frame({ accent, scene, children }: { accent: Rgb; scene: ReactNode; children: ReactNode }) {
  const scale = useFrameScale();
  const fx = useClock((s) => s.fx);
  const [r, g, b] = accent;
  const vars = {
    '--accent': `rgb(${r}, ${g}, ${b})`,
    '--accent-rgb': `${r}, ${g}, ${b}`,
  } as CSSProperties;
  return (
    <div className="stage">
      <div
        className="frame"
        data-frame
        data-fx={fx ? '1' : '0'}
        style={{ ...vars, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div className="zone" data-zone="scene" style={rectStyle(ZONES.scene)}>
          <div
            className="scene-canvas"
            style={{ left: -ZONES.scene.x, top: -ZONES.scene.y, width: FRAME.w, height: FRAME.h }}
          >
            {scene}
          </div>
        </div>
        <div className="scene-fade scene-fade--top" />
        <div className="scene-fade scene-fade--bottom" />
        {children}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Rgb } from '../sim';
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

export function Frame({ accent, children }: { accent: Rgb; children: ReactNode }) {
  const scale = useFrameScale();
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
        style={{ ...vars, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div className="zone" data-zone="scene" style={rectStyle(ZONES.scene)} />
        <div className="scene-fade scene-fade--top" />
        <div className="scene-fade scene-fade--bottom" />
        {children}
      </div>
    </div>
  );
}

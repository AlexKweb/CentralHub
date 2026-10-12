import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import type { Case } from '../sim';
import { Scene } from './Scene';

const BG = '#05070B';
const FONT_FACES = ['700 15px "JetBrains Mono"', '400 11px "JetBrains Mono"'];

/** Card and header textures are drawn with JetBrains Mono, so the scene waits for the faces. */
function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void Promise.all(FONT_FACES.map((face) => document.fonts.load(face))).then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

export function SceneCanvas({ t, cases }: { t: number; cases: readonly Case[] }) {
  const fontsReady = useFontsReady();
  return (
    <Canvas
      dpr={[1, 2]}
      flat
      camera={{ fov: 35, near: 0.1, far: 100, position: [0, 0, 10] }}
      style={{ background: BG }}
      onCreated={({ gl }) => gl.setClearColor(BG, 1)}
    >
      {fontsReady && <Scene t={t} cases={cases} />}
    </Canvas>
  );
}

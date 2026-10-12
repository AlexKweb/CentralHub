import { useFrame } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import type { DepthOfFieldEffect } from 'postprocessing';
import type { Case } from '../sim';
import { markComposedFrame } from '../state/jevHook';
import { useClock } from '../state/store';
import { cameraPose } from './camera';
import { cardCenters, cardsDoc } from './layout';

const CENTERS = cardCenters(cardsDoc.columns);

/** Post-processing stack, mounted only while the fx flag is on: `?fx=0` and key F draw the plain scene. */
export function PostFx({ cases }: { cases: readonly Case[] }) {
  const fx = useClock((s) => s.fx);
  if (!fx) return null;
  return <Stack cases={cases} />;
}

/** Focus follows the camera target each frame, so the active card stays sharp and the depth around it blurs. */
function Stack({ cases }: { cases: readonly Case[] }) {
  const focus = useMemo(() => new Vector3(), []);
  const dof = useRef<DepthOfFieldEffect>(null);

  useFrame(() => {
    focus.set(...cameraPose(useClock.getState().t, cases, CENTERS).target);
    if (dof.current?.target) dof.current.target.copy(focus);
  });
  // Priority 2 runs after the composer (priority 1) has drawn this frame.
  useFrame(() => markComposedFrame(), 2);

  return (
    <EffectComposer>
      <DepthOfField ref={dof} target={focus} bokehScale={3} />
      <Bloom mipmapBlur luminanceThreshold={0.25} luminanceSmoothing={0.2} intensity={1.4} radius={0.7} />
      <Vignette offset={0.3} darkness={0.6} />
      <Noise opacity={0.04} premultiply />
    </EffectComposer>
  );
}

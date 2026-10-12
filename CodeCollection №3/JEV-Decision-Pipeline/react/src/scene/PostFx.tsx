import { useFrame } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import { Uniform, Vector3 } from 'three';
import { Effect } from 'postprocessing';
import type { DepthOfFieldEffect } from 'postprocessing';
import type { Case } from '../sim';
import { markComposedFrame } from '../state/jevHook';
import { useClock } from '../state/store';
import { cameraPose } from './camera';
import { cardCenters, cardsDoc } from './layout';

const CENTERS = cardCenters(cardsDoc.columns);
const GRAIN_FPS = 24;

const GRAIN_FRAGMENT = /* glsl */ `
uniform float frame;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float n = fract(sin(dot(uv * 1024.0 + frame, vec2(12.9898, 78.233))) * 43758.5453);
  outputColor = vec4(inputColor.rgb + (n - 0.5) * 0.04, inputColor.a);
}`;

/** Grain keyed to clock time: the pattern changes GRAIN_FPS times a second and freezes while paused. */
class GrainEffect extends Effect {
  private readonly frame: Uniform<number>;

  constructor() {
    const frame = new Uniform(0);
    super('GrainEffect', GRAIN_FRAGMENT, { uniforms: new Map([['frame', frame]]) });
    this.frame = frame;
  }

  setTime(t: number): void {
    this.frame.value = Math.floor(t * GRAIN_FPS);
  }
}

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
  const grain = useMemo(() => new GrainEffect(), []);
  useEffect(() => () => grain.dispose(), [grain]);

  useFrame(() => {
    const { t } = useClock.getState();
    focus.set(...cameraPose(t, cases, CENTERS).target);
    if (dof.current?.target) dof.current.target.copy(focus);
    grain.setTime(t);
  });
  // Priority 2 runs after the composer (priority 1) has drawn this frame.
  useFrame(() => markComposedFrame(), 2);

  return (
    <EffectComposer>
      <DepthOfField ref={dof} target={focus} bokehScale={3} />
      <Bloom mipmapBlur luminanceThreshold={0.25} luminanceSmoothing={0.2} intensity={1.8} radius={0.7} />
      <Vignette offset={0.3} darkness={0.6} />
      <primitive object={grain} />
    </EffectComposer>
  );
}
